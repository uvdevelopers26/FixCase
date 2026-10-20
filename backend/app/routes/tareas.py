from datetime import date

from flask import Blueprint, request, jsonify
from sqlalchemy.orm import joinedload

from database import db
from app.models import Tarea, Activo, Usuario, ChecklistInstancia

tareas_bp = Blueprint(
    "tareas",
    __name__,
    url_prefix="/api/tareas"
)

ESTADOS = ("pendiente", "en_proceso", "completado", "cancelado")
PRIORIDADES = ("baja", "media", "alta")


def error(message, status=400):
    return jsonify({"error": message}), status


def parse_fecha(value):
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        raise ValueError("La fecha debe tener formato AAAA-MM-DD.")


def progreso_checklists(ids_tarea):
    """Devuelve {id_tarea: {'total': n, 'completados': m, 'checklists': k}}."""
    if not ids_tarea:
        return {}
    instancias = (
        ChecklistInstancia.query
        .options(joinedload(ChecklistInstancia.items))
        .filter(ChecklistInstancia.id_tarea.in_(ids_tarea))
        .all()
    )
    resultado = {}
    for inst in instancias:
        r = resultado.setdefault(
            inst.id_tarea, {"total": 0, "completados": 0, "checklists": 0}
        )
        r["checklists"] += 1
        r["total"] += len(inst.items)
        r["completados"] += sum(1 for i in inst.items if i.completado)
    return resultado


def tarea_dict(tarea, progreso=None):
    data = tarea.to_dict()
    data["checklist"] = progreso or {"total": 0, "completados": 0, "checklists": 0}
    return data


def validar_y_aplicar(tarea, data, parcial=False):
    """Valida los datos y los asigna a la tarea. Devuelve un mensaje de error o None."""
    if not parcial or "id_usuario" in data:
        id_usuario = data.get("id_usuario")
        if not id_usuario or not Usuario.query.get(id_usuario):
            return "Selecciona un técnico responsable válido."
        tarea.id_usuario = id_usuario

    if not parcial or "id_activo" in data:
        id_activo = data.get("id_activo")
        if not id_activo or not Activo.query.get(id_activo):
            return "Selecciona un activo válido."
        tarea.id_activo = id_activo

    if "id_estado" in data:
        if data["id_estado"] not in ESTADOS:
            return "Estado no válido."
        tarea.id_estado = data["id_estado"]

    if "prioridad" in data:
        prioridad = data["prioridad"] or "media"
        if prioridad not in PRIORIDADES:
            return "Prioridad no válida."
        tarea.prioridad = prioridad

    if "fecha_programada" in data or "fecha" in data:
        try:
            tarea.fecha_programada = parse_fecha(
                data.get("fecha_programada") or data.get("fecha")
            )
        except ValueError as exc:
            return str(exc)

    if "tipo_trabajo" in data:
        tarea.tipo_trabajo = (data["tipo_trabajo"] or None)

    if "descripcion" in data:
        tarea.descripcion = (data["descripcion"] or None)

    return None


@tareas_bp.route("/", methods=["GET"], strict_slashes=False)
def get_tareas():
    tareas = (
        Tarea.query
        .options(joinedload(Tarea.activo), joinedload(Tarea.usuario))
        .order_by(Tarea.id.desc())
        .all()
    )
    progreso = progreso_checklists([t.id for t in tareas])
    return jsonify([tarea_dict(t, progreso.get(t.id)) for t in tareas])


@tareas_bp.route("/<int:id>", methods=["GET"])
def get_tarea(id):
    tarea = Tarea.query.get_or_404(id)
    progreso = progreso_checklists([tarea.id])
    return jsonify(tarea_dict(tarea, progreso.get(tarea.id)))


@tareas_bp.route("/", methods=["POST"], strict_slashes=False)
def crear_tarea():
    data = request.get_json() or {}

    if not data:
        return error("No se recibió información de la tarea.")

    nueva = Tarea(id_estado="pendiente", prioridad="media")
    mensaje = validar_y_aplicar(nueva, data)
    if mensaje:
        return error(mensaje)

    db.session.add(nueva)
    db.session.commit()

    return jsonify(tarea_dict(nueva)), 201


@tareas_bp.route("/<int:id>", methods=["PUT", "PATCH"])
def actualizar_tarea(id):
    tarea = Tarea.query.get_or_404(id)
    data = request.get_json() or {}

    mensaje = validar_y_aplicar(tarea, data, parcial=True)
    if mensaje:
        return error(mensaje)

    db.session.commit()

    progreso = progreso_checklists([tarea.id])
    return jsonify(tarea_dict(tarea, progreso.get(tarea.id)))


@tareas_bp.route("/<int:id>", methods=["DELETE"])
def eliminar_tarea(id):
    tarea = Tarea.query.get_or_404(id)
    db.session.delete(tarea)
    db.session.commit()

    return "", 204