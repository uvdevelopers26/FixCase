from datetime import datetime

from database import db
from .base import BaseModel


class Activo(BaseModel):
    __tablename__ = "activos"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # ==========================================================
    # IDENTIFICACIÓN
    # ==========================================================

    nombre = db.Column(
        db.String(150),
        nullable=False
    )

    categoria_tipo = db.Column(
        db.String(100),
        nullable=True
    )

    tipo = db.Column(
        db.String(100),
        nullable=True
    )

    marca = db.Column(
        db.String(100),
        nullable=True
    )

    modelo = db.Column(
        db.String(150),
        nullable=True
    )

    fabricante = db.Column(
        db.String(150),
        nullable=True
    )

    serial = db.Column(
        db.String(100),
        nullable=True
    )

    placa = db.Column(
        db.String(100),
        nullable=True
    )

    # ==========================================================
    # UBICACIÓN
    # ==========================================================

    sede = db.Column(
        db.String(100),
        nullable=True
    )

    municipio = db.Column(
        db.String(100),
        nullable=True
    )

    ubicacion = db.Column(
        db.String(150),
        nullable=True
    )

    area = db.Column(
        db.String(100),
        nullable=True
    )

    puesto = db.Column(
        db.String(100),
        nullable=True
    )

    centro_negocio = db.Column(
        db.String(150),
        nullable=True
    )

    # ==========================================================
    # CARACTERÍSTICAS TÉCNICAS
    # ==========================================================

    procesador = db.Column(
        db.String(150),
        nullable=True
    )

    ram = db.Column(
        db.String(100),
        nullable=True
    )

    tipo_ram = db.Column(
        db.String(100),
        nullable=True
    )

    discos = db.Column(
        db.String(500),
        nullable=True
    )

    # ==========================================================
    # INFORMACIÓN FINANCIERA
    # ==========================================================

    fecha_compra = db.Column(
        db.Date,
        nullable=True
    )

    valor = db.Column(
        db.Numeric(15, 2),
        nullable=True
    )

    iva = db.Column(
        db.Numeric(15, 2),
        nullable=True
    )

    valor_definitivo = db.Column(
        db.Numeric(15, 2),
        nullable=True
    )

    # ==========================================================
    # GARANTÍA
    # ==========================================================

    garantia = db.Column(
        db.String(150),
        nullable=True
    )

    finalizacion_garantia = db.Column(
        db.Date,
        nullable=True
    )

    # ==========================================================
    # ESTADO Y RESPONSABLE
    # ==========================================================

    estado = db.Column(
        db.Boolean,
        default=True,
        nullable=False
    )

    id_usuario = db.Column(
        db.Integer,
        db.ForeignKey("usuarios.id"),
        nullable=True
    )

    # ==========================================================
    # INFORMACIÓN ADICIONAL
    # ==========================================================

    asunto = db.Column(
        db.String(255),
        nullable=True
    )

    # ==========================================================
    # AUDITORÍA
    # ==========================================================

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

            # Identificación
            "nombre": self.nombre,
            "categoria_tipo": self.categoria_tipo,
            "tipo": self.tipo,
            "marca": self.marca,
            "modelo": self.modelo,
            "fabricante": self.fabricante,
            "serial": self.serial,
            "placa": self.placa,

            # Ubicación
            "sede": self.sede,
            "municipio": self.municipio,
            "ubicacion": self.ubicacion,
            "area": self.area,
            "puesto": self.puesto,
            "centro_negocio": self.centro_negocio,

            # Características técnicas
            "procesador": self.procesador,
            "ram": self.ram,
            "tipo_ram": self.tipo_ram,
            "discos": self.discos,

            # Información financiera
            "fecha_compra": (
                self.fecha_compra.isoformat()
                if self.fecha_compra else None
            ),
            "valor": (
                float(self.valor)
                if self.valor is not None else None
            ),
            "iva": (
                float(self.iva)
                if self.iva is not None else None
            ),
            "valor_definitivo": (
                float(self.valor_definitivo)
                if self.valor_definitivo is not None else None
            ),

            # Garantía
            "garantia": self.garantia,
            "finalizacion_garantia": (
                self.finalizacion_garantia.isoformat()
                if self.finalizacion_garantia else None
            ),

            # Estado y responsable
            "estado": self.estado,
            "id_usuario": self.id_usuario,

            # Adicional
            "asunto": self.asunto,

            # Auditoría
            "creado_en": (
                self.creado_en.isoformat()
                if self.creado_en else None
            ),
            "actualizado_en": (
                self.actualizado_en.isoformat()
                if self.actualizado_en else None
            ),
        }