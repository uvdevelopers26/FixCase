from datetime import datetime

from database import db
from .base import BaseModel


class DHVArchivo(BaseModel):
    __tablename__ = "dhv_archivos"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    id_dhv = db.Column(
        db.Integer,
        db.ForeignKey(
            "dhv.id",
            ondelete="CASCADE",
            onupdate="CASCADE"
        ),
        nullable=False
    )

    tipo_documento = db.Column(
        db.String(100),
        nullable=False
    )

    nombre_archivo = db.Column(
        db.String(255),
        nullable=False
    )

    nombre_original = db.Column(
        db.String(255),
        nullable=True
    )

    ruta_archivo = db.Column(
        db.String(500),
        nullable=True
    )

    extension = db.Column(
        db.String(20),
        nullable=True
    )

    mime_type = db.Column(
        db.String(100),
        nullable=True
    )

    tamano = db.Column(
        db.BigInteger,
        nullable=True
    )

    descripcion = db.Column(
        db.String(500),
        nullable=True
    )

    fecha_documento = db.Column(
        db.Date,
        nullable=True
    )

    numero_documento = db.Column(
        db.String(100),
        nullable=True
    )

    proveedor = db.Column(
        db.String(150),
        nullable=True
    )

    estado = db.Column(
        db.Boolean,
        default=True,
        nullable=False
    )

    subido_por = db.Column(
        db.Integer,
        nullable=True
    )

    creado_en = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    actualizado_en = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    def to_dict(self):
        return {
            "id": self.id,
            "id_dhv": self.id_dhv,
            "tipo_documento": self.tipo_documento,
            "nombre_archivo": self.nombre_archivo,
            "nombre_original": self.nombre_original,
            "ruta_archivo": self.ruta_archivo,
            "extension": self.extension,
            "mime_type": self.mime_type,
            "tamano": self.tamano,
            "descripcion": self.descripcion,
            "fecha_documento": (
                self.fecha_documento.isoformat()
                if self.fecha_documento else None
            ),
            "numero_documento": self.numero_documento,
            "proveedor": self.proveedor,
            "estado": self.estado,
            "subido_por": self.subido_por,
            "creado_en": (
                self.creado_en.isoformat()
                if self.creado_en else None
            ),
            "actualizado_en": (
                self.actualizado_en.isoformat()
                if self.actualizado_en else None
            ),
        }