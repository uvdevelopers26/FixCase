import os

from flask import Flask
from flask_cors import CORS

from config import config
from database import db


def create_app():

    app = Flask(__name__)

    # ==========================
    # Configuración
    # ==========================
    env = os.getenv("FLASK_ENV", "development")

    app.config.from_object(config[env])

    # ==========================
    # Inicializar base de datos
    # ==========================
    db.init_app(app)

    # ==========================
    # Configuración CORS
    # ==========================
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://localhost:8085",
                    "http://127.0.0.1:8085",
                    "http://192.168.0.186:8085",
                ]
            }
        },
        supports_credentials=True,
    )

    # ==========================
    # Importar Blueprints
    # ==========================
    from app.routes.auth import auth_bp
    from app.routes.usuarios import usuarios_bp
    from app.routes.tareas import tareas_bp
    from app.routes.activos import activos_bp
    from app.routes.plantillas import plantillas_bp
    from app.routes.checklists import checklists_bp
    from app.routes.dhv import dhv_bp
    from app.routes.dhv_archivos import dhv_archivos_bp

    # ==========================
    # Registrar Blueprints
    # ==========================
    app.register_blueprint(auth_bp)
    app.register_blueprint(usuarios_bp)
    app.register_blueprint(tareas_bp)
    app.register_blueprint(activos_bp)
    app.register_blueprint(plantillas_bp)
    app.register_blueprint(checklists_bp)
    app.register_blueprint(dhv_bp)
    app.register_blueprint(dhv_archivos_bp)

    # ==========================
    # Endpoint de prueba
    # ==========================
    @app.route("/api/ping")
    def ping():
        return {
            "ok": True,
            "mensaje": "InfraTrack Backend",
            "version": app.config["API_VERSION"],
        }

    # ==========================
    # Manejo de errores
    # ==========================
    register_error_handlers(app)

    # ==========================
    # Crear tablas
    # ==========================
    with app.app_context():
        db.create_all()

    return app


def register_error_handlers(app):

    @app.errorhandler(404)
    def not_found(error):
        return {
            "ok": False,
            "error": "Recurso no encontrado",
        }, 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return {
            "ok": False,
            "error": "Método HTTP no permitido",
        }, 405

    @app.errorhandler(500)
    def internal(error):
        return {
            "ok": False,
            "error": "Error interno del servidor",
        }, 500