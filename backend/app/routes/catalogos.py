from flask import Blueprint, request, jsonify

from database import db
from app.models import Categoria, Marca, Area, Sede, Puesto


MAX_NOMBRE = 100


# ==========================================================
# HELPERS
# ==========================================================

def error(mensaje, codigo=400):
    return jsonify({"ok": False, "error": mensaje}), codigo


def limpiar_texto(valor):
    """Recorta espacios y convierte cadenas vacías en None."""
    if valor is None:
        return None
    valor = str(valor).strip()
    return valor if valor != "" else None


# ==========================================================
# FÁBRICA DE BLUEPRINTS CRUD
# ==========================================================

def crear_catalogo_bp(nombre_bp, prefix, Modelo):

    bp = Blueprint(
        nombre_bp,
        __name__,
        url_prefix=f"/api/{prefix}"
    )

    def existe_nombre(nombre, excluir_id=None):
        consulta = Modelo.query.filter(
            db.func.lower(Modelo.nombre) == nombre.lower()
        )
        if excluir_id is not None:
            consulta = consulta.filter(Modelo.id != excluir_id)
        return consulta.first() is not None

    # ------------------------------------------------------
    # LISTAR
    # ------------------------------------------------------

    @bp.route("/", methods=["GET"])
    def listar():
        items = Modelo.query.order_by(Modelo.nombre).all()
        return jsonify([i.to_dict() for i in items])

    # ------------------------------------------------------
    # OBTENER
    # ------------------------------------------------------

    @bp.route("/<int:id>", methods=["GET"])
    def obtener(id):
        item = Modelo.query.get_or_404(id)
        return jsonify(item.to_dict())

    # ------------------------------------------------------
    # CREAR
    # ------------------------------------------------------

    @bp.route("/", methods=["POST"])
    def crear():
        data = request.get_json() or {}

        nombre = limpiar_texto(data.get("nombre"))

        if not nombre:
            return error("El nombre es obligatorio")

        if len(nombre) > MAX_NOMBRE:
            return error(f"El nombre no puede superar {MAX_NOMBRE} caracteres")

        if existe_nombre(nombre):
            return error("Ya existe un registro con ese nombre", 409)

        nuevo = Modelo(
            nombre=nombre,
            activo=bool(data.get("estado", data.get("activo", True)))
        )

        try:
            db.session.add(nuevo)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return error(f"No se pudo crear el registro: {e}", 500)

        res = nuevo.to_dict()
        res["ok"] = True
        return jsonify(res), 201

    # ------------------------------------------------------
    # ACTUALIZAR
    # ------------------------------------------------------

    @bp.route("/<int:id>", methods=["PUT"])
    def actualizar(id):
        item = Modelo.query.get_or_404(id)
        data = request.get_json() or {}

        if "nombre" in data:
            nombre = limpiar_texto(data.get("nombre"))

            if not nombre:
                return error("El nombre no puede quedar vacío")

            if len(nombre) > MAX_NOMBRE:
                return error(f"El nombre no puede superar {MAX_NOMBRE} caracteres")

            if existe_nombre(nombre, excluir_id=id):
                return error("Ya existe un registro con ese nombre", 409)

            item.nombre = nombre

        if "estado" in data:
            item.activo = bool(data["estado"])
        elif "activo" in data:
            item.activo = bool(data["activo"])

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return error(f"No se pudo actualizar el registro: {e}", 500)

        res = item.to_dict()
        res["ok"] = True
        return jsonify(res)

    # ------------------------------------------------------
    # CAMBIAR ESTADO (INACTIVAR / ACTIVAR)
    # ------------------------------------------------------

    @bp.route("/<int:id>/estado", methods=["PATCH"])
    def cambiar_estado(id):
        item = Modelo.query.get_or_404(id)
        data = request.get_json() or {}

        if "estado" in data:
            item.activo = bool(data["estado"])
        elif "activo" in data:
            item.activo = bool(data["activo"])
        else:
            item.activo = not item.activo

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return error(f"No se pudo cambiar el estado: {e}", 500)

        return jsonify({
            "ok": True,
            "mensaje": "Estado actualizado correctamente",
            "registro": item.to_dict()
        })

    # ------------------------------------------------------
    # ELIMINAR
    # ------------------------------------------------------

    @bp.route("/<int:id>", methods=["DELETE"])
    def eliminar(id):
        item = Modelo.query.get_or_404(id)

        try:
            db.session.delete(item)
            db.session.commit()
        except Exception:
            db.session.rollback()
            return error(
                "No se puede eliminar porque está en uso. Inactívalo en su lugar.",
                409
            )

        return jsonify({
            "ok": True,
            "mensaje": "Registro eliminado correctamente"
        }), 200

    return bp


# ==========================================================
# BLUEPRINTS DE CADA CATÁLOGO
# ==========================================================

categorias_bp = crear_catalogo_bp("categorias", "categorias", Categoria)
marcas_bp = crear_catalogo_bp("marcas", "marcas", Marca)
areas_bp = crear_catalogo_bp("areas", "areas", Area)
sedes_bp = crear_catalogo_bp("sedes", "sedes", Sede)
puestos_bp = crear_catalogo_bp("puestos", "puestos", Puesto)

catalogos_bps = [
    categorias_bp,
    marcas_bp,
    areas_bp,
    sedes_bp,
    puestos_bp,
]