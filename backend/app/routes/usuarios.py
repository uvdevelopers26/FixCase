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
# HELPERS
# ==========================================================

# Longitudes máximas según la tabla (varchar)
MAX_LEN = {
    "rol": 50,
    "user": 50,
    "nombres": 100,
    "apellidos": 100,
    "email": 150,
    "telefono": 30,
    "cargo": 100,
}

# Campos de texto opcionales (aceptan NULL)
CAMPOS_OPCIONALES = ["nombres", "apellidos", "email", "telefono", "cargo"]


def limpiar_texto(valor):
    """Recorta espacios y convierte cadenas vacías en None."""
    if valor is None:
        return None
    valor = str(valor).strip()
    return valor if valor != "" else None


def validar_longitudes(datos):
    """Devuelve un mensaje de error si algún texto excede su longitud."""
    for campo, maximo in MAX_LEN.items():
        valor = datos.get(campo)
        if valor and len(valor) > maximo:
            return f"El campo '{campo}' no puede superar {maximo} caracteres"
    return None


def parse_id_activo(valor):
    """Convierte id_activo a int o None. Lanza ValueError si no es válido."""
    if valor is None or valor == "":
        return None
    return int(valor)


def hashear_clave(clave):
    return bcrypt.hashpw(
        clave.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def error(mensaje, codigo=400):
    return jsonify({"ok": False, "error": mensaje}), codigo


def usuario_a_dict(usuario):
    """
    to_dict() sin exponer nunca el hash de la contraseña.
    El modelo usa la columna 'activo'; el frontend lee 'estado',
    así que se devuelven ambos.
    """
    d = usuario.to_dict()
    d.pop("clave", None)
    d["estado"] = bool(d.get("activo"))
    return d


# ==========================================================
# LISTAR USUARIOS
# ==========================================================

@usuarios_bp.route("/", methods=["GET"])
def get_usuarios():

    usuarios = Usuario.query.all()

    return jsonify([
        usuario_a_dict(u)
        for u in usuarios
    ])


# ==========================================================
# OBTENER USUARIO
# ==========================================================

@usuarios_bp.route("/<int:id>", methods=["GET"])
def get_usuario(id):

    usuario = Usuario.query.get_or_404(id)

    return jsonify(
        usuario_a_dict(usuario)
    )


# ==========================================================
# CREAR USUARIO
# ==========================================================

@usuarios_bp.route("/", methods=["POST"])
def crear_usuario():

    data = request.get_json() or {}

    user = limpiar_texto(data.get("user"))
    rol = limpiar_texto(data.get("rol"))
    clave = data.get("clave")

    # ------------------------------------------------------
    # Validaciones obligatorias
    # ------------------------------------------------------

    if not user:
        return error("El usuario es obligatorio")

    if not rol:
        return error("El rol es obligatorio")

    if not clave or not str(clave).strip():
        return error("La contraseña es obligatoria")

    if Usuario.query.filter_by(user=user).first():
        return error("Ya existe un usuario con ese nombre", 409)

    # ------------------------------------------------------
    # Campos opcionales
    # ------------------------------------------------------

    opcionales = {
        campo: limpiar_texto(data.get(campo))
        for campo in CAMPOS_OPCIONALES
    }

    try:
        id_activo = parse_id_activo(data.get("id_activo"))
    except (TypeError, ValueError):
        return error("El activo asignado no es válido")

    msg = validar_longitudes({"user": user, "rol": rol, **opcionales})
    if msg:
        return error(msg)

    # ------------------------------------------------------
    # Crear usuario (hash BCrypt)
    # creado_en / actualizado_en los llena el modelo por defecto
    # ------------------------------------------------------

    nuevo = Usuario(
        rol=rol,
        user=user,
        clave=hashear_clave(clave),
        id_activo=id_activo,
        activo=bool(data.get("estado", data.get("activo", True))),
        **opcionales
    )

    try:
        db.session.add(nuevo)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error(f"No se pudo crear el usuario: {e}", 500)

    res = usuario_a_dict(nuevo)
    res["ok"] = True
    return jsonify(res), 201


# ==========================================================
# ACTUALIZAR USUARIO (EDITAR)
# ==========================================================

@usuarios_bp.route("/<int:id>", methods=["PUT"])
def actualizar_usuario(id):

    usuario = Usuario.query.get_or_404(id)

    data = request.get_json() or {}

    # ------------------------------------------------------
    # Obligatorios: solo se cambian si llega un valor válido
    # ------------------------------------------------------

    if "user" in data:
        user = limpiar_texto(data.get("user"))
        if not user:
            return error("El usuario no puede quedar vacío")

        repetido = Usuario.query.filter(
            Usuario.user == user,
            Usuario.id != id
        ).first()
        if repetido:
            return error("Ya existe un usuario con ese nombre", 409)

        usuario.user = user

    if "rol" in data:
        rol = limpiar_texto(data.get("rol"))
        if not rol:
            return error("El rol no puede quedar vacío")
        usuario.rol = rol

    # ------------------------------------------------------
    # Opcionales: si vienen en el payload, se actualizan
    # (null o vacío => queda NULL en la base de datos)
    # ------------------------------------------------------

    for campo in CAMPOS_OPCIONALES:
        if campo in data:
            setattr(usuario, campo, limpiar_texto(data.get(campo)))

    if "id_activo" in data:
        try:
            usuario.id_activo = parse_id_activo(data.get("id_activo"))
        except (TypeError, ValueError):
            db.session.rollback()
            return error("El activo asignado no es válido")

    if "estado" in data:
        usuario.activo = bool(data["estado"])
    elif "activo" in data:
        usuario.activo = bool(data["activo"])

    msg = validar_longitudes({
        "user": usuario.user,
        "rol": usuario.rol,
        **{c: getattr(usuario, c, None) for c in CAMPOS_OPCIONALES}
    })
    if msg:
        db.session.rollback()
        return error(msg)

    # ------------------------------------------------------
    # Si viene una nueva contraseña y no está vacía, generar BCrypt
    # ------------------------------------------------------

    clave = data.get("clave")
    if clave and str(clave).strip() != "":
        usuario.clave = hashear_clave(clave)

    # actualizado_en se actualiza solo (onupdate en el modelo)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error(f"No se pudo actualizar el usuario: {e}", 500)

    res = usuario_a_dict(usuario)
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
        usuario.activo = bool(data["estado"])
    else:
        # Si no viene el valor, invierte el estado actual
        usuario.activo = not usuario.activo

    db.session.commit()

    return jsonify({
        "ok": True,
        "mensaje": "Estado actualizado correctamente",
        "usuario": usuario_a_dict(usuario)
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