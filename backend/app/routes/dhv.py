from flask import Blueprint, request, jsonify

from database import db
from app.models import DHV


dhv_bp = Blueprint(
    "dhv",
    __name__,
    url_prefix="/api/dhv"
)


# ==========================================================
# LISTAR TODAS LAS DHV
# ==========================================================

@dhv_bp.route("/", methods=["GET"])
def get_dhvs():

    dhvs = DHV.query.all()

    return jsonify([
        dhv.to_dict()
        for dhv in dhvs
    ])


# ==========================================================
# CONSULTAR DHV POR ID
# ==========================================================

@dhv_bp.route("/<int:id>", methods=["GET"])
def get_dhv(id):

    dhv = DHV.query.get_or_404(id)

    return jsonify(
        dhv.to_dict()
    )


# ==========================================================
# CONSULTAR DHV POR ACTIVO
# ==========================================================

@dhv_bp.route("/activo/<int:id_activo>", methods=["GET"])
def get_dhv_por_activo(id_activo):

    dhv = DHV.query.filter_by(
        id_activo=id_activo
    ).first()

    if not dhv:
        return jsonify({
            "error": "El activo no tiene una hoja de vida registrada"
        }), 404

    return jsonify(
        dhv.to_dict()
    )


# ==========================================================
# CREAR DHV
# ==========================================================

@dhv_bp.route("/", methods=["POST"])
def crear_dhv():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No se recibió información de la hoja de vida"
        }), 400

    if not data.get("id_activo"):
        return jsonify({
            "error": "El campo id_activo es requerido"
        }), 400

    # Verificar que el activo no tenga ya una DHV
    existente = DHV.query.filter_by(
        id_activo=data["id_activo"]
    ).first()

    if existente:
        return jsonify({
            "error": "El activo ya tiene una hoja de vida registrada",
            "id_dhv": existente.id
        }), 409

    nuevo = DHV(
        id_activo=data.get("id_activo"),

        fecha_instalacion=data.get(
            "fecha_instalacion"
        ),
        responsable_instalacion=data.get(
            "responsable_instalacion"
        ),
        observaciones_instalacion=data.get(
            "observaciones_instalacion"
        ),

        garantia=data.get("garantia"),
        inicio_garantia=data.get(
            "inicio_garantia"
        ),
        finalizacion_garantia=data.get(
            "finalizacion_garantia"
        ),
        proveedor_garantia=data.get(
            "proveedor_garantia"
        ),
        observaciones_garantia=data.get(
            "observaciones_garantia"
        ),

        fecha_devolucion=data.get(
            "fecha_devolucion"
        ),
        responsable_devolucion=data.get(
            "responsable_devolucion"
        ),
        motivo_devolucion=data.get(
            "motivo_devolucion"
        ),
        estado_devolucion=data.get(
            "estado_devolucion"
        ),
        observaciones_devolucion=data.get(
            "observaciones_devolucion"
        ),

        estado_prestamo=data.get(
            "estado_prestamo",
            False
        ),
        fecha_prestamo=data.get(
            "fecha_prestamo"
        ),
        fecha_devolucion_prestamo=data.get(
            "fecha_devolucion_prestamo"
        ),
        responsable_prestamo=data.get(
            "responsable_prestamo"
        ),
        entregado_a=data.get(
            "entregado_a"
        ),
        observaciones_prestamo=data.get(
            "observaciones_prestamo"
        ),

        creado_por=data.get(
            "creado_por"
        ),
        actualizado_por=data.get(
            "actualizado_por"
        )
    )

    db.session.add(nuevo)
    db.session.commit()

    return jsonify(
        nuevo.to_dict()
    ), 201


# ==========================================================
# ACTUALIZAR DHV
# ==========================================================

@dhv_bp.route("/<int:id>", methods=["PUT"])
def actualizar_dhv(id):

    dhv = DHV.query.get_or_404(id)

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No se recibió información para actualizar"
        }), 400

    campos = [
        "id_activo",

        "fecha_instalacion",
        "responsable_instalacion",
        "observaciones_instalacion",

        "garantia",
        "inicio_garantia",
        "finalizacion_garantia",
        "proveedor_garantia",
        "observaciones_garantia",

        "fecha_devolucion",
        "responsable_devolucion",
        "motivo_devolucion",
        "estado_devolucion",
        "observaciones_devolucion",

        "estado_prestamo",
        "fecha_prestamo",
        "fecha_devolucion_prestamo",
        "responsable_prestamo",
        "entregado_a",
        "observaciones_prestamo",

        "creado_por",
        "actualizado_por"
    ]

    for campo in campos:

        if campo in data:
            setattr(
                dhv,
                campo,
                data[campo]
            )

    db.session.commit()

    return jsonify(
        dhv.to_dict()
    )