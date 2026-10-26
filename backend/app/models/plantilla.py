from datetime import datetime

from database import db
from .base import BaseModel


class Plantilla(BaseModel):
    __tablename__ = "plantilla"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    nombre = db.Column(
        db.String(150),
        nullable=False,
        index=True,
    )

    id_activos = db.Column(
        db.Integer,
        db.ForeignKey("activos.id"),
        index=True,
    )

    id_tareas = db.Column(
        db.Integer,
        db.ForeignKey("tareas.id"),
        index=True,
    )

    tipo_asunto = db.Column(
        db.String(100),
        nullable=False,
        index=True,
    )

    contenido = db.Column(
        db.Text,
        nullable=False,
    )

    estado = db.Column(
        db.Boolean,
        default=True,
        nullable=False,
        index=True,
    )

    version = db.Column(
        db.Integer,
        default=1,
        nullable=False,
    )

    creado_en = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    actualizado_en = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    activo = db.relationship(
        "Activo",
        foreign_keys=[id_activos],
    )

    tarea = db.relationship(
        "Tarea",
        foreign_keys=[id_tareas],
    )

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "id_activos": self.id_activos,
            "id_tareas": self.id_tareas,
            "tipo_asunto": self.tipo_asunto,
            "contenido": self.contenido,
            "estado": self.estado,
            "version": self.version,
            "creado_en": self.creado_en.isoformat() if self.creado_en else None,
            "actualizado_en": self.actualizado_en.isoformat() if self.actualizado_en else None,
        }