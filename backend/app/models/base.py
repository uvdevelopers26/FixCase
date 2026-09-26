from datetime import datetime

from database import db


class BaseModel(db.Model):
    """
    Modelo base para las entidades de InfraTrack.

    Contiene únicamente los comportamientos comunes.
    Las columnas específicas de auditoría se declaran
    en cada modelo según la estructura real de la BD.
    """

    __abstract__ = True

    def save(self):
        db.session.add(self)
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()