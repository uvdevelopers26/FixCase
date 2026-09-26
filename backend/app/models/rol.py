```python
from database import db
from models.base import BaseModel


class Rol(BaseModel):
    __tablename__ = "roles"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    id_usuario = db.Column(
        db.Integer,
        db.ForeignKey("usuarios.id"),
        nullable=False,
        index=True,
    )

    nombre = db.Column(
        db.String(100),
        nullable=False,
        unique=True,
        index=True,
    )

    descripcion = db.Column(
        db.String(255),
    )

    usuario = db.relationship(
        "Usuario",
        foreign_keys=[id_usuario],
    )

    def to_dict(self):
        return {
            "id": self.id,
            "id_usuario": self.id_usuario,
            "nombre": self.nombre,
            "descripcion": self.descripcion,
            "creado_en": self.creado_en.isoformat() if self.creado_en else None,
            "actualizado_en": self.actualizado_en.isoformat() if self.actualizado_en else None,
        }