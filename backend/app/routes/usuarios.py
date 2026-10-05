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

    data = request.get_json() or {}

    clave = data.get("clave")

    if not clave:
        return jsonify({
            "ok": False,
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
        id_activo=data.get("id_activo"),
        estado=data.get("estado", True)
    )

    db.session.add(nuevo)
    db.session.commit()

    res = nuevo.to_dict()
    res["ok"] = True
    return jsonify(res), 201


# ==========================================================
# ACTUALIZAR USUARIO (EDITAR)
# ==========================================================

@usuarios_bp.route("/<int:id>", methods=["PUT"])
def actualizar_usuario(id):

    usuario = Usuario.query.get_or_404(id)

    data = request.get_json() or {}

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

    if "estado" in data:
        usuario.estado = bool(data["estado"])

    # ------------------------------------------------------
    # Si viene una nueva contraseña y no está vacía, generar BCrypt
    # ------------------------------------------------------

    clave = data.get("clave")
    if clave and clave.strip() != "":
        clave_hash = bcrypt.hashpw(
            clave.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")
        usuario.clave = clave_hash

    db.session.commit()

    res = usuario.to_dict()
    res["ok"] = True
    return jsonify(res)


# ==========================================================
# CAMBIAR ESTADO (INACTIVAR / ACTIVAR)
# ==========================================================

@usuarios_bp.route("/<int:id>/estado", methods=["PATCH"])
def cambiar_estado_usuario(id):

    usuario = Usuario.query.get_or_404(id)

    data = request.get_json() or {}

    if "estado" in data:
        usuario.estado = bool(data["estado"])
    else:
        # Si no viene el valor, invierte el estado actual
        usuario.estado = not getattr(usuario, "estado", True)

    db.session.commit()

    return jsonify({
        "ok": True,
        "mensaje": "Estado actualizado correctamente",
        "usuario": usuario.to_dict()
    })


# ==========================================================
# ELIMINAR USUARIO
# ==========================================================

@usuarios_bp.route("/<int:id>", methods=["DELETE"])
def eliminar_usuario(id):

    usuario = Usuario.query.get_or_404(id)

    db.session.delete(usuario)
    db.session.commit()

    return jsonify({
        "ok": True,
        "mensaje": "Usuario eliminado correctamente"
    }), 200