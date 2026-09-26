from datetime import datetime

from database import db
from .base import BaseModel


class DHV(BaseModel):
    __tablename__ = "dhv"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    id_activo = db.Column(
        db.Integer,
        db.ForeignKey(
            "activos.id",
            ondelete="CASCADE",
            onupdate="CASCADE"
        ),
        nullable=False,
        unique=True
    )

    # ==========================================================
    # INSTALACIÓN
    # ==========================================================

    fecha_instalacion = db.Column(
        db.Date,
        nullable=True
    )

    responsable_instalacion = db.Column(
        db.Integer,
        nullable=True
    )

    observaciones_instalacion = db.Column(
        db.String(1000),
        nullable=True
    )

    # ==========================================================
    # GARANTÍA
    # ==========================================================

    garantia = db.Column(
        db.String(150),
        nullable=True
    )

    inicio_garantia = db.Column(
        db.Date,
        nullable=True
    )

    finalizacion_garantia = db.Column(
        db.Date,
        nullable=True
    )

    proveedor_garantia = db.Column(
        db.String(150),
        nullable=True
    )

    observaciones_garantia = db.Column(
        db.String(1000),
        nullable=True
    )

    # ==========================================================
    # DEVOLUCIÓN
    # ==========================================================

    fecha_devolucion = db.Column(
        db.Date,
        nullable=True
    )

    responsable_devolucion = db.Column(
        db.Integer,
        nullable=True
    )

    motivo_devolucion = db.Column(
        db.String(500),
        nullable=True
    )

    estado_devolucion = db.Column(
        db.String(100),
        nullable=True
    )

    observaciones_devolucion = db.Column(
        db.String(1000),
        nullable=True
    )

    # ==========================================================
    # PRÉSTAMO
    # ==========================================================

    estado_prestamo = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    fecha_prestamo = db.Column(
        db.Date,
        nullable=True
    )

    fecha_devolucion_prestamo = db.Column(
        db.Date,
        nullable=True
    )

    responsable_prestamo = db.Column(
        db.Integer,
        nullable=True
    )

    entregado_a = db.Column(
        db.Integer,
        nullable=True
    )

    observaciones_prestamo = db.Column(
        db.String(1000),
        nullable=True
    )

    # ==========================================================
    # AUDITORÍA
    # ==========================================================

    creado_por = db.Column(
        db.Integer,
        nullable=True
    )

    actualizado_por = db.Column(
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

    # ==========================================================
    # SERIALIZACIÓN
    # ==========================================================

    def to_dict(self):
        return {
            "id": self.id,
            "id_activo": self.id_activo,

            "fecha_instalacion": (
                self.fecha_instalacion.isoformat()
                if self.fecha_instalacion else None
            ),
            "responsable_instalacion": self.responsable_instalacion,
            "observaciones_instalacion": self.observaciones_instalacion,

            "garantia": self.garantia,
            "inicio_garantia": (
                self.inicio_garantia.isoformat()
                if self.inicio_garantia else None
            ),
            "finalizacion_garantia": (
                self.finalizacion_garantia.isoformat()
                if self.finalizacion_garantia else None
            ),
            "proveedor_garantia": self.proveedor_garantia,
            "observaciones_garantia": self.observaciones_garantia,

            "fecha_devolucion": (
                self.fecha_devolucion.isoformat()
                if self.fecha_devolucion else None
            ),
            "responsable_devolucion": self.responsable_devolucion,
            "motivo_devolucion": self.motivo_devolucion,
            "estado_devolucion": self.estado_devolucion,
            "observaciones_devolucion": self.observaciones_devolucion,

            "estado_prestamo": self.estado_prestamo,
            "fecha_prestamo": (
                self.fecha_prestamo.isoformat()
                if self.fecha_prestamo else None
            ),
            "fecha_devolucion_prestamo": (
                self.fecha_devolucion_prestamo.isoformat()
                if self.fecha_devolucion_prestamo else None
            ),
            "responsable_prestamo": self.responsable_prestamo,
            "entregado_a": self.entregado_a,
            "observaciones_prestamo": self.observaciones_prestamo,

            "creado_por": self.creado_por,
            "actualizado_por": self.actualizado_por,

            "creado_en": (
                self.creado_en.isoformat()
                if self.creado_en else None
            ),
            "actualizado_en": (
                self.actualizado_en.isoformat()
                if self.actualizado_en else None
            ),
        }