import os
import jwt
import datetime
import bcrypt

from flask import Blueprint, jsonify, request

from app.models import Usuario


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.json

    user = data.get("user")
    clave = data.get("clave")

    if not user or not clave:
        return jsonify({
            "error": "Usuario y clave son requeridos"
        }), 400

    usuario = Usuario.query.filter_by(user=user).first()

    if (
        not usuario
        or not bcrypt.checkpw(
            clave.encode("utf-8"),
            usuario.clave.encode("utf-8")
        )
    ):
        return jsonify({
            "error": "Credenciales inválidas"
        }), 401

    token = jwt.encode(
        {
            "id": usuario.id,
            "user": usuario.user,
            "rol": usuario.rol,
            "exp": (
                datetime.datetime.utcnow()
                + datetime.timedelta(hours=8)
            )
        },
        os.getenv("SECRET_KEY"),
        algorithm="HS256"
    )

    return jsonify({
        "token": token,
        "usuario": usuario.to_dict()
    })