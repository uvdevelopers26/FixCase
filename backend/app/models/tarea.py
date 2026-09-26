from datetime import datetime

from database import db
from .base import BaseModel


class Tarea(BaseModel):
    __tablename__ = "tareas"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    id_usuario = db.Column(
        db.Integer,
        db.ForeignKey("usuarios.id"),
        nullable=False
    )

    id_activo = db.Column(
        db.Integer,
        db.ForeignKey("activos.id"),
        nullable=False
    )

    id_estado = db.Column(
        db.Enum(
            "pendiente",
            "en_proceso",
            "completado",
            "cancelado"
        ),
        default="pendiente",
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
            "id_usuario": self.id_usuario,
            "id_activo": self.id_activo,
            "id_estado": self.id_estado,
            "creado_en": (
                self.creado_en.isoformat()
                if self.creado_en else None
            ),
            "actualizado_en": (
                self.actualizado_en.isoformat()
                if self.actualizado_en else None
            ),
        }