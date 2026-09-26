from datetime import datetime

from database import db
from .base import BaseModel


class DHVTipoEvento(BaseModel):
    __tablename__ = "dhv_tipos_evento"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    codigo = db.Column(
        db.String(50),
        nullable=False,
        unique=True
    )

    nombre = db.Column(
        db.String(100),
        nullable=False,
        unique=True
    )

    descripcion = db.Column(
        db.String(255),
        nullable=True
    )

    estado = db.Column(
        db.Boolean,
        default=True,
        nullable=False
    )

    orden = db.Column(
        db.Integer,
        default=0,
        nullable=False
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
            "codigo": self.codigo,
            "nombre": self.nombre,
            "descripcion": self.descripcion,
            "estado": self.estado,
            "orden": self.orden,
            "creado_en": (
                self.creado_en.isoformat()
                if self.creado_en else None
            ),
            "actualizado_en": (
                self.actualizado_en.isoformat()
                if self.actualizado_en else None
            ),
        }