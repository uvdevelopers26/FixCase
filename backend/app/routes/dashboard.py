from flask import Blueprint, jsonify
from sqlalchemy import func

from database import db
from app.models.tarea import Tarea
from app.models.usuario import Usuario
from app.models.activo import Activo


dashboard_bp = Blueprint(
    "dashboard",
    __name__,
    url_prefix="/api/dashboard"
)


@dashboard_bp.route("/resumen", methods=["GET"])
def resumen():
    try:
        # ============================
        # TAREAS
        # ============================

        total_tareas = db.session.query(
            func.count(Tarea.id)
        ).scalar() or 0

        pendientes = db.session.query(
            func.count(Tarea.id)
        ).filter(
            Tarea.id_estado == "pendiente"
        ).scalar() or 0

        en_proceso = db.session.query(
            func.count(Tarea.id)
        ).filter(
            Tarea.id_estado == "en_proceso"
        ).scalar() or 0

        completadas = db.session.query(
            func.count(Tarea.id)
        ).filter(
            Tarea.id_estado == "completado"
        ).scalar() or 0

        canceladas = db.session.query(
            func.count(Tarea.id)
        ).filter(
            Tarea.id_estado == "cancelado"
        ).scalar() or 0

        # ============================
        # ACTIVOS
        # ============================

        total_activos = db.session.query(
            func.count(Activo.id)
        ).scalar() or 0

        # ============================
        # USUARIOS
        # ============================

        total_usuarios = db.session.query(
            func.count(Usuario.id)
        ).scalar() or 0

        usuarios_activos = db.session.query(
            func.count(Usuario.id)
        ).filter(
            Usuario.activo == True
        ).scalar() or 0

        # ============================
        # RESPUESTA
        # ============================

        return jsonify({
            "ok": True,

            "tareas": {
                "total": total_tareas,
                "pendientes": pendientes,
                "en_proceso": en_proceso,
                "completadas": completadas,
                "canceladas": canceladas
            },

            "activos": {
                "total": total_activos
            },

            "usuarios": {
                "total": total_usuarios,
                "activos": usuarios_activos
            }
        }), 200

    except Exception as e:
        print("ERROR DASHBOARD:", e)

        return jsonify({
            "ok": False,
            "error": str(e)
        }), 500