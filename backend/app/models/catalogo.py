from datetime import datetime

from database import db
from .base import BaseModel


class CatalogoMixin:
    """Columnas y to_dict() compartidos por todos los catálogos."""

    id = db.Column(db.Integer, primary_key=True)

    nombre = db.Column(db.String(100), unique=True, nullable=False)

    activo = db.Column(db.Boolean, default=True, nullable=False)

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
            "nombre": self.nombre,
            "activo": self.activo,
            "estado": bool(self.activo),
            "creado_en": (
                self.creado_en.isoformat()
                if self.creado_en else None
            ),
            "actualizado_en": (
                self.actualizado_en.isoformat()
                if self.actualizado_en else None
            ),
        }


class Categoria(CatalogoMixin, BaseModel):
    __tablename__ = "categorias"


class Marca(CatalogoMixin, BaseModel):
    __tablename__ = "marcas"


class Area(CatalogoMixin, BaseModel):
    __tablename__ = "areas"


class Sede(CatalogoMixin, BaseModel):
    __tablename__ = "sedes"


class Puesto(CatalogoMixin, BaseModel):
    __tablename__ = "puestos"