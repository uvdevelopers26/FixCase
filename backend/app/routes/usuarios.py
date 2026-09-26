from flask import Blueprint, request, jsonify
import bcrypt

from database import db
from app.models import Usuario


usuarios_bp = Blueprint(
    "usuarios",
    __name__,
    url_prefix="/api/usuarios"
)


# ==========================================================
# LISTAR USUARIOS
# ==========================================================

@usuarios_bp.route("/", methods=["GET"])
def get_usuarios():

    usuarios = Usuario.query.all()

    return jsonify([
        u.to_dict()
        for u in usuarios
    ])


# ==========================================================
# OBTENER USUARIO
# ==========================================================

@usuarios_bp.route("/<int:id>", methods=["GET"])
def get_usuario(id):

    usuario = Usuario.query.get_or_404(id)

    return jsonify(
        usuario.to_dict()
    )


# ==========================================================
# CREAR USUARIO
# ==========================================================

@usuarios_bp.route("/", methods=["POST"])
def crear_usuario():

    data = request.get_json()

    clave = data.get("clave")

    if not clave:
        return jsonify({
            "error": "La contraseña es obligatoria"
        }), 400

    # ------------------------------------------------------
    # Generar hash BCrypt
    # ------------------------------------------------------

    clave_hash = bcrypt.hashpw(
        clave.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    nuevo = Usuario(
        rol=data.get("rol"),
        user=data.get("user"),
        clave=clave_hash,
        id_activo=data.get("id_activo")
    )

    db.session.add(nuevo)
    db.session.commit()

    return jsonify(
        nuevo.to_dict()
    ), 201


# ==========================================================
# ACTUALIZAR USUARIO
# ==========================================================

@usuarios_bp.route("/<int:id>", methods=["PUT"])
def actualizar_usuario(id):

    usuario = Usuario.query.get_or_404(id)

    data = request.get_json()

    usuario.rol = data.get(
        "rol",
        usuario.rol
    )

    usuario.user = data.get(
        "user",
        usuario.user
    )

    usuario.id_activo = data.get(
        "id_activo",
        usuario.id_activo
    )

    # ------------------------------------------------------
    # Si viene una nueva contraseña, generar BCrypt
    # ------------------------------------------------------

    if data.get("clave"):
        clave_hash = bcrypt.hashpw(
            data["clave"].encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")
        usuario.clave = clave_hash

    db.session.commit()

    return jsonify(
        usuario.to_dict()
    )

# ==========================================================
# ELIMINAR USUARIO
# ==========================================================

@usuarios_bp.route("/<int:id>", methods=["DELETE"])
def eliminar_usuario(id):

    usuario = Usuario.query.get_or_404(id)

    db.session.delete(usuario)
    db.session.commit()

    return "", 204