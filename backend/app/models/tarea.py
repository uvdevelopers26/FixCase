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

    # --- Campos nuevos ---
    tipo_trabajo = db.Column(db.String(50), nullable=True)

    prioridad = db.Column(
        db.Enum("baja", "media", "alta"),
        default="media",
        nullable=False
    )

    fecha_programada = db.Column(db.Date, nullable=True)

    descripcion = db.Column(db.Text, nullable=True)
    # ---------------------

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

    activo = db.relationship("Activo", foreign_keys=[id_activo])
    usuario = db.relationship("Usuario", foreign_keys=[id_usuario])

    def to_dict(self):
        return {
            "id": self.id,
            "id_usuario": self.id_usuario,
            "id_activo": self.id_activo,
            "id_estado": self.id_estado,
            "tipo_trabajo": self.tipo_trabajo,
            "prioridad": self.prioridad,
            "fecha_programada": (
                self.fecha_programada.isoformat()
                if self.fecha_programada else None
            ),
            "descripcion": self.descripcion,
            "codigo_activo": (
                (self.activo.placa or self.activo.serial or str(self.activo.id))
                if self.activo else None
            ),
            "tecnico": (
                getattr(self.usuario, "user", None)
                if self.usuario else None
            ),
            "creado_en": (
                self.creado_en.isoformat()
                if self.creado_en else None
            ),
            "actualizado_en": (
                self.actualizado_en.isoformat()
                if self.actualizado_en else None
            ),
        }