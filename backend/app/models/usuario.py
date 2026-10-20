from datetime import datetime

from database import db
from .base import BaseModel


class Usuario(BaseModel):
    __tablename__ = "usuarios"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    rol = db.Column(
        db.String(50),
        nullable=False
    )

    nombres = db.Column(
        db.String(100),
        nullable=True
    )

    apellidos = db.Column(
        db.String(100),
        nullable=True
    )

    email = db.Column(
        db.String(150),
        nullable=True
    )

    telefono = db.Column(
        db.String(30),
        nullable=True
    )

    cargo = db.Column(
        db.String(100),
        nullable=True
    )

    user = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    clave = db.Column(
        db.String(255),
        nullable=False
    )

    id_activo = db.Column(
        db.Integer,
        db.ForeignKey("activos.id"),
        nullable=True
    )

    activo = db.Column(
        db.Boolean,
        default=True,
        nullable=False
    )

    ultimo_login = db.Column(
        db.DateTime,
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
        nullable=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "rol": self.rol,
            "nombres": self.nombres or "",
            "apellidos": self.apellidos or "",
            "nombre_completo": f"{self.nombres or ''} {self.apellidos or ''}".strip() or self.user,
            "email": self.email or "",
            "telefono": self.telefono or "",
            "cargo": self.cargo or "",
            "user": self.user,
            "id_activo": self.id_activo,
            "activo": self.activo,
            "ultimo_login": (
                self.ultimo_login.isoformat()
                if self.ultimo_login else None
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