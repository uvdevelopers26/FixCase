from flask import Blueprint, request, jsonify

from database import db
from app.models import Activo, Categoria, Marca, Area, Sede, Puesto


activos_bp = Blueprint(
    "activos",
    __name__,
    url_prefix="/api/activos"
)


# ==========================================================
# LISTAR ACTIVOS
# ==========================================================

@activos_bp.route("/", methods=["GET"])
def get_activos():

    activos = Activo.query.all()

    return jsonify([
        activo.to_dict()
        for activo in activos
    ])


# ==========================================================
# OPCIONES PARA LOS CAMPOS DEL FORMULARIO
# GET /api/activos/opciones
#
# Devuelve los valores de los catálogos (solo los activos) para
# los selects de categoría, marca, área, sede y puesto.
# Si un catálogo no se puede leer (por ejemplo, la tabla aún no
# existe), se usan como respaldo los valores ya registrados en
# la tabla de activos.
# ==========================================================

def _valores_distintos(columna):
    """Valores únicos de una columna de activos: sin vacíos ni 'N/A',
    sin repetir por mayúsculas/minúsculas y ordenados alfabéticamente."""
    filas = (
        db.session.query(columna)
        .filter(columna.isnot(None))
        .distinct()
        .all()
    )

    vistos = {}
    for (valor,) in filas:
        valor = (valor or "").strip()
        if valor and valor.upper() != "N/A":
            vistos.setdefault(valor.upper(), valor)

    return sorted(vistos.values(), key=str.lower)


def _valores_catalogo(Modelo, columna_activo):
    """Nombres activos de un catálogo; si falla, usa los valores
    distintos que ya existen en la tabla de activos."""
    try:
        filas = (
            db.session.query(Modelo.nombre)
            .filter(Modelo.activo.is_(True))
            .order_by(Modelo.nombre)
            .all()
        )
        return [nombre for (nombre,) in filas]
    except Exception:
        db.session.rollback()
        return _valores_distintos(columna_activo)


@activos_bp.route("/opciones", methods=["GET"])
def opciones_activos():

    return jsonify({
        "categoria_tipo": _valores_catalogo(Categoria, Activo.categoria_tipo),
        "marca": _valores_catalogo(Marca, Activo.marca),
        "area": _valores_catalogo(Area, Activo.area),
        "sede": _valores_catalogo(Sede, Activo.sede),
        "puesto": _valores_catalogo(Puesto, Activo.puesto),
    })


# ==========================================================
# CONSULTAR ACTIVO
# ==========================================================

@activos_bp.route("/<int:id>", methods=["GET"])
def get_activo(id):

    activo = Activo.query.get_or_404(id)

    return jsonify(
        activo.to_dict()
    )


# ==========================================================
# CREAR ACTIVO
# ==========================================================

@activos_bp.route("/", methods=["POST"])
def crear_activo():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No se recibió información del activo"
        }), 400

    if not data.get("nombre"):
        return jsonify({
            "error": "El campo nombre es requerido"
        }), 400

    nuevo = Activo(
        nombre=data.get("nombre"),
        categoria_tipo=data.get("categoria_tipo"),
        tipo=data.get("tipo"),
        marca=data.get("marca"),
        modelo=data.get("modelo"),
        fabricante=data.get("fabricante"),
        serial=data.get("serial"),
        placa=data.get("placa"),

        sede=data.get("sede"),
        municipio=data.get("municipio"),
        ubicacion=data.get("ubicacion"),
        area=data.get("area"),
        puesto=data.get("puesto"),
        centro_negocio=data.get("centro_negocio"),

        procesador=data.get("procesador"),
        ram=data.get("ram"),
        tipo_ram=data.get("tipo_ram"),
        discos=data.get("discos"),

        fecha_compra=data.get("fecha_compra"),

        valor=data.get("valor"),
        iva=data.get("iva"),
        valor_definitivo=data.get("valor_definitivo"),

        garantia=data.get("garantia"),
        finalizacion_garantia=data.get(
            "finalizacion_garantia"
        ),

        estado=data.get("estado", True),
        id_usuario=data.get("id_usuario"),
        asunto=data.get("asunto")
    )

    try:
        db.session.add(nuevo)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": f"No se pudo crear el activo: {e}"
        }), 500

    return jsonify(
        nuevo.to_dict()
    ), 201


# ==========================================================
# ACTUALIZAR ACTIVO
# ==========================================================

@activos_bp.route("/<int:id>", methods=["PUT"])
def actualizar_activo(id):

    activo = Activo.query.get_or_404(id)

    data = request.get_json() or {}

    campos = [
        "nombre",
        "categoria_tipo",
        "tipo",
        "marca",
        "modelo",
        "fabricante",
        "serial",
        "placa",
        "sede",
        "municipio",
        "ubicacion",
        "area",
        "puesto",
        "centro_negocio",
        "procesador",
        "ram",
        "tipo_ram",
        "discos",
        "fecha_compra",
        "valor",
        "iva",
        "valor_definitivo",
        "garantia",
        "finalizacion_garantia",
        "estado",
        "id_usuario",
        "asunto"
    ]

    for campo in campos:

        if campo in data:
            setattr(
                activo,
                campo,
                data[campo]
            )

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": f"No se pudo actualizar el activo: {e}"
        }), 500

    return jsonify(
        activo.to_dict()
    )


# ==========================================================
# ELIMINAR ACTIVO
# ==========================================================

@activos_bp.route("/<int:id>", methods=["DELETE"])
def eliminar_activo(id):

    activo = Activo.query.get_or_404(id)

    db.session.delete(activo)

    db.session.commit()

    return "", 204