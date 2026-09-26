from flask import Blueprint, request, jsonify

from database import db
from app.models import Tarea


tareas_bp = Blueprint(
    "tareas",
    __name__,
    url_prefix="/api/tareas"
)


@tareas_bp.route("/", methods=["GET"])
def get_tareas():

    tareas = Tarea.query.all()

    return jsonify([
        tarea.to_dict()
        for tarea in tareas
    ])


@tareas_bp.route("/<int:id>", methods=["GET"])
def get_tarea(id):

    tarea = Tarea.query.get_or_404(id)

    return jsonify(
        tarea.to_dict()
    )


@tareas_bp.route("/", methods=["POST"])
def crear_tarea():

    data = request.get_json()

    nueva = Tarea(
        id_usuario=data.get("id_usuario"),
        id_activo=data.get("id_activo"),
        id_estado=data.get(
            "id_estado",
            "pendiente"
        )
    )

    db.session.add(nueva)
    db.session.commit()

    return jsonify(
        nueva.to_dict()
    ), 201


@tareas_bp.route("/<int:id>", methods=["PUT"])
def actualizar_tarea(id):

    tarea = Tarea.query.get_or_404(id)

    data = request.get_json()

    tarea.id_usuario = data.get(
        "id_usuario",
        tarea.id_usuario
    )

    tarea.id_activo = data.get(
        "id_activo",
        tarea.id_activo
    )

    tarea.id_estado = data.get(
        "id_estado",
        tarea.id_estado
    )

    db.session.commit()

    return jsonify(
        tarea.to_dict()
    )


@tareas_bp.route("/<int:id>", methods=["DELETE"])
def eliminar_tarea(id):

    tarea = Tarea.query.get_or_404(id)

    db.session.delete(tarea)
    db.session.commit()

    return "", 204