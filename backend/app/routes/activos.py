from flask import Blueprint, request, jsonify

from database import db
from app.models import Activo


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

    db.session.add(nuevo)
    db.session.commit()

    return jsonify(
        nuevo.to_dict()
    ), 201


# ==========================================================
# ACTUALIZAR ACTIVO
# ==========================================================

@activos_bp.route("/<int:id>", methods=["PUT"])
def actualizar_activo(id):

    activo = Activo.query.get_or_404(id)

    data = request.get_json()

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

    db.session.commit()

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