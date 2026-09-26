import os
import uuid

from flask import (
    Blueprint,
    request,
    jsonify,
    send_from_directory,
    current_app
)
from werkzeug.utils import secure_filename

from database import db
from app.models import DHV, DHVArchivo


dhv_archivos_bp = Blueprint(
    "dhv_archivos",
    __name__,
    url_prefix="/api/dhv/archivos"
)


# ==========================================================
# CONFIGURACIÓN
# ==========================================================

EXTENSIONES_PERMITIDAS = {
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "jpg",
    "jpeg",
    "png",
    "txt",
    "csv"
}


def extension_permitida(nombre):
    if "." not in nombre:
        return False

    extension = nombre.rsplit(".", 1)[1].lower()

    return extension in EXTENSIONES_PERMITIDAS


def obtener_carpeta_dhv(id_dhv):

    carpeta_base = os.path.join(
        current_app.instance_path,
        "uploads",
        "dhv"
    )

    carpeta_dhv = os.path.join(
        carpeta_base,
        str(id_dhv)
    )

    os.makedirs(
        carpeta_dhv,
        exist_ok=True
    )

    return carpeta_dhv


# ==========================================================
# LISTAR ARCHIVOS DE UNA HOJA DE VIDA
# ==========================================================

@dhv_archivos_bp.route(
    "/dhv/<int:id_dhv>",
    methods=["GET"]
)
def listar_archivos(id_dhv):

    dhv = DHV.query.get_or_404(id_dhv)

    archivos = DHVArchivo.query.filter_by(
        id_dhv=dhv.id,
        estado=True
    ).order_by(
        DHVArchivo.id.desc()
    ).all()

    return jsonify([
        archivo.to_dict()
        for archivo in archivos
    ])


# ==========================================================
# CONSULTAR ARCHIVO
# ==========================================================

@dhv_archivos_bp.route(
    "/<int:id>",
    methods=["GET"]
)
def obtener_archivo(id):

    archivo = DHVArchivo.query.get_or_404(id)

    return jsonify(
        archivo.to_dict()
    )


# ==========================================================
# SUBIR ARCHIVO
# ==========================================================

@dhv_archivos_bp.route(
    "/dhv/<int:id_dhv>",
    methods=["POST"]
)
def subir_archivo(id_dhv):

    dhv = DHV.query.get_or_404(id_dhv)

    archivo = request.files.get("archivo")

    if not archivo:
        return jsonify({
            "ok": False,
            "error": "No se recibió ningún archivo"
        }), 400

    if not archivo.filename:
        return jsonify({
            "ok": False,
            "error": "El archivo no tiene nombre"
        }), 400

    if not extension_permitida(
        archivo.filename
    ):
        return jsonify({
            "ok": False,
            "error": (
                "Extensión de archivo no permitida"
            ),
            "extensiones_permitidas": sorted(
                EXTENSIONES_PERMITIDAS
            )
        }), 400

    tipo_documento = request.form.get(
        "tipo_documento"
    )

    if not tipo_documento:
        return jsonify({
            "ok": False,
            "error": "El campo tipo_documento es requerido"
        }), 400

    # ------------------------------------------------------
    # NOMBRE ORIGINAL
    # ------------------------------------------------------

    nombre_original = secure_filename(
        archivo.filename
    )

    extension = nombre_original.rsplit(
        ".",
        1
    )[1].lower()

    # ------------------------------------------------------
    # NOMBRE INTERNO ÚNICO
    # ------------------------------------------------------

    nombre_archivo = (
        f"{uuid.uuid4().hex}.{extension}"
    )

    # ------------------------------------------------------
    # CARPETA
    # ------------------------------------------------------

    carpeta = obtener_carpeta_dhv(
        id_dhv
    )

    ruta_fisica = os.path.join(
        carpeta,
        nombre_archivo
    )

    # ------------------------------------------------------
    # GUARDAR ARCHIVO
    # ------------------------------------------------------

    archivo.save(
        ruta_fisica
    )

    # ------------------------------------------------------
    # METADATOS
    # ------------------------------------------------------

    tamano = os.path.getsize(
        ruta_fisica
    )

    nuevo = DHVArchivo(
        id_dhv=id_dhv,
        tipo_documento=tipo_documento,
        nombre_archivo=nombre_archivo,
        nombre_original=nombre_original,
        ruta_archivo=os.path.relpath(
            ruta_fisica
        ),
        extension=extension,
        mime_type=archivo.mimetype,
        tamano=tamano,
        descripcion=request.form.get(
            "descripcion"
        ),
        fecha_documento=request.form.get(
            "fecha_documento"
        ) or None,
        numero_documento=request.form.get(
            "numero_documento"
        ),
        proveedor=request.form.get(
            "proveedor"
        ),
        estado=True,
        subido_por=(
            request.form.get("subido_por")
            or None
        )
    )

    db.session.add(nuevo)
    db.session.commit()

    return jsonify({
        "ok": True,
        "mensaje": "Archivo cargado correctamente",
        "archivo": nuevo.to_dict()
    }), 201


# ==========================================================
# DESCARGAR ARCHIVO
# ==========================================================

@dhv_archivos_bp.route(
    "/<int:id>/download",
    methods=["GET"]
)
def descargar_archivo(id):

    archivo = DHVArchivo.query.get_or_404(id)

    if not archivo.estado:
        return jsonify({
            "ok": False,
            "error": "El archivo está inactivo"
        }), 404

    carpeta = obtener_carpeta_dhv(
        archivo.id_dhv
    )

    if not os.path.isfile(
        os.path.join(
            carpeta,
            archivo.nombre_archivo
        )
    ):
        return jsonify({
            "ok": False,
            "error": "El archivo físico no existe"
        }), 404

    return send_from_directory(
        carpeta,
        archivo.nombre_archivo,
        as_attachment=True,
        download_name=(
            archivo.nombre_original
            or archivo.nombre_archivo
        )
    )


# ==========================================================
# ACTUALIZAR METADATOS
# ==========================================================

@dhv_archivos_bp.route(
    "/<int:id>",
    methods=["PUT"]
)
def actualizar_archivo(id):

    archivo = DHVArchivo.query.get_or_404(id)

    data = request.get_json()

    if not data:
        return jsonify({
            "ok": False,
            "error": "No se recibió información"
        }), 400

    campos = [
        "tipo_documento",
        "nombre_original",
        "descripcion",
        "fecha_documento",
        "numero_documento",
        "proveedor",
        "subido_por"
    ]

    for campo in campos:

        if campo in data:
            setattr(
                archivo,
                campo,
                data[campo]
            )

    db.session.commit()

    return jsonify({
        "ok": True,
        "mensaje": "Metadatos actualizados",
        "archivo": archivo.to_dict()
    })


# ==========================================================
# DESACTIVAR ARCHIVO
# ==========================================================

@dhv_archivos_bp.route(
    "/<int:id>",
    methods=["DELETE"]
)
def eliminar_archivo(id):

    archivo = DHVArchivo.query.get_or_404(id)

    archivo.estado = False

    db.session.commit()

    return jsonify({
        "ok": True,
        "mensaje": "Archivo desactivado correctamente",
        "id": archivo.id
    })