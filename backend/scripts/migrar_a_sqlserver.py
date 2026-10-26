"""
Copia los datos de FixCase de MariaDB (origen, solo lectura) a SQL Server (destino).

Uso, desde E:\\fixcase\\backend:

    .\\venv\\Scripts\\python.exe scripts\\migrar_a_sqlserver.py
        Simulación: muestra qué se copiaría. No escribe nada.

    .\\venv\\Scripts\\python.exe scripts\\migrar_a_sqlserver.py --ejecutar
        Crea las tablas en SQL Server (desde los modelos) y copia los datos.

    .\\venv\\Scripts\\python.exe scripts\\migrar_a_sqlserver.py --ejecutar --vaciar
        Borra los datos del destino y vuelve a copiar (útil para repetir la
        copia el día del cambio definitivo).

Variables del .env:
    DB_*     conexión a MariaDB (origen)
    MSSQL_*  conexión a SQL Server (destino)

MariaDB nunca se modifica: el script solo la lee.
"""
import argparse
import sys
import warnings
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from dotenv import load_dotenv

load_dotenv(BACKEND / ".env")

from sqlalchemy import Boolean, MetaData, Table, create_engine, func, inspect, select, text
from sqlalchemy.exc import SAWarning

from config import build_database_uri
from database import db
import app.models  # noqa: F401  (registra los modelos en db.metadata)
import app.models.auditoria_usuario  # noqa: F401

LOTE = 500


def limpiar_valor(valor, columna):
    """Ajusta los valores de MariaDB a lo que espera SQL Server."""
    if valor is None:
        return None
    if isinstance(valor, str) and valor.startswith("0000-00-00"):
        return None  # fecha inválida típica de MySQL
    if isinstance(columna.type, Boolean):
        return bool(valor)  # TINYINT(1) -> BIT
    return valor


def contar(motor, tabla):
    with motor.connect() as conn:
        return conn.execute(select(func.count()).select_from(tabla)).scalar()


def main():
    ap = argparse.ArgumentParser(description="Copia FixCase de MariaDB a SQL Server")
    ap.add_argument("--ejecutar", action="store_true",
                    help="crea las tablas y copia los datos (sin esto solo simula)")
    ap.add_argument("--vaciar", action="store_true",
                    help="borra los datos del destino antes de copiar")
    args = ap.parse_args()

    origen = create_engine(build_database_uri("mysql"))
    destino = create_engine(build_database_uri("mssql"))

    for etiqueta, motor in (("MariaDB (origen)", origen), ("SQL Server (destino)", destino)):
        with motor.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"Conexión correcta: {etiqueta}")

    insp_origen = inspect(origen)

    with warnings.catch_warnings():
        # usuarios <-> activos se referencian entre sí; SQLAlchemy avisa del ciclo
        warnings.simplefilter("ignore", SAWarning)
        tablas = list(db.metadata.sorted_tables)

    # ------------------------------------------------------------------
    # Plan
    # ------------------------------------------------------------------
    print()
    print(f"{'Tabla':<30}{'Filas':>8}  Observaciones")
    print("-" * 78)

    plan = []
    for t in tablas:
        if not insp_origen.has_table(t.name):
            print(f"{t.name:<30}{'-':>8}  no existe en MariaDB: se crea vacía")
            continue

        src = Table(t.name, MetaData(), autoload_with=origen)
        comunes = [c for c in t.columns if c.name in src.c]
        faltan = [c.name for c in t.columns if c.name not in src.c]
        sobran = [c.name for c in src.columns if c.name not in t.c]
        total = contar(origen, src)

        notas = []
        if faltan:
            notas.append(f"sin datos de origen: {', '.join(faltan)}")
        if sobran:
            notas.append(f"columnas de MariaDB sin modelo (NO se copian): {', '.join(sobran)}")
        print(f"{t.name:<30}{total:>8}  {'; '.join(notas)}")
        plan.append((t, src, comunes, total))

    sin_modelo = sorted(set(insp_origen.get_table_names()) - set(db.metadata.tables))
    if sin_modelo:
        print()
        print("Tablas de MariaDB sin modelo (NO se copian): " + ", ".join(sin_modelo))

    if not args.ejecutar:
        print()
        print("Simulación terminada. No se escribió nada. Usa --ejecutar para copiar.")
        return 0

    # ------------------------------------------------------------------
    # Esquema en SQL Server
    # ------------------------------------------------------------------
    print()
    print("Creando tablas en SQL Server (las que ya existan se respetan)...")
    db.metadata.create_all(destino)

    ocupadas = [(t.name, n) for t in tablas if (n := contar(destino, t))]
    if ocupadas and not args.vaciar:
        print("El destino ya tiene datos: " + ", ".join(f"{n} ({c})" for n, c in ocupadas))
        print("Revisa que sea lo esperado, o usa --vaciar para borrarlos y copiar de nuevo.")
        return 1

    # Se desactivan las claves foráneas mientras se copia (hay una referencia
    # circular usuarios <-> activos) y se validan al final.
    with destino.begin() as conn:
        for t in tablas:
            conn.execute(text(f"ALTER TABLE [{t.name}] NOCHECK CONSTRAINT ALL"))

    if args.vaciar:
        print("Vaciando el destino...")
        with destino.begin() as conn:
            for t in reversed(tablas):
                conn.execute(text(f"DELETE FROM [{t.name}]"))

    # ------------------------------------------------------------------
    # Copia
    # ------------------------------------------------------------------
    print("Copiando datos...")
    for t, src, comunes, total in plan:
        try:
            with origen.connect() as lectura, destino.begin() as escritura:
                filas = lectura.execute(select(*[src.c[c.name] for c in comunes])).mappings()
                lote = []
                for fila in filas:
                    lote.append({c.name: limpiar_valor(fila[c.name], c) for c in comunes})
                    if len(lote) >= LOTE:
                        escritura.execute(t.insert(), lote)  # IDENTITY_INSERT lo maneja SQLAlchemy
                        lote = []
                if lote:
                    escritura.execute(t.insert(), lote)
            print(f"  {t.name:<30}{total:>8} filas")
        except Exception as exc:
            print()
            print(f"ERROR copiando '{t.name}': {exc}")
            print("La copia se detuvo. Corrige el problema y repite con --ejecutar --vaciar.")
            return 1

    # ------------------------------------------------------------------
    # Reactivar y validar claves foráneas
    # ------------------------------------------------------------------
    print()
    print("Validando claves foráneas...")
    problemas = []
    for t in tablas:
        try:
            with destino.begin() as conn:
                conn.execute(text(f"ALTER TABLE [{t.name}] WITH CHECK CHECK CONSTRAINT ALL"))
        except Exception as exc:
            problemas.append((t.name, str(exc).splitlines()[0]))

    for nombre, mensaje in problemas:
        print(f"  PROBLEMA en {nombre}: {mensaje}")
    if not problemas:
        print("  Todas las claves foráneas son válidas.")

    # ------------------------------------------------------------------
    # Verificación de conteos
    # ------------------------------------------------------------------
    print()
    print(f"{'Tabla':<30}{'MariaDB':>9}{'SQL Server':>12}  Resultado")
    print("-" * 66)
    diferencias = 0
    for t, src, comunes, total in plan:
        copiadas = contar(destino, t)
        ok = copiadas == total
        diferencias += 0 if ok else 1
        print(f"{t.name:<30}{total:>9}{copiadas:>12}  {'OK' if ok else 'DIFERENTE'}")

    print()
    if diferencias or problemas:
        print("Hay diferencias o claves inválidas. Revisa antes de cambiar DB_ENGINE a mssql.")
        return 1
    print("Copia completa y verificada. Ya puedes poner DB_ENGINE=mssql en el .env y reiniciar Flask.")
    return 0


if __name__ == "__main__":
    sys.exit(main())