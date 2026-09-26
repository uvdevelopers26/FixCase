from datetime import datetime

from database import db


# ==========================================================
# PLANTILLAS DE CHECKLIST
# ==========================================================

class ChecklistPlantilla(db.Model):
    __tablename__ = "checklist_plantillas"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    nombre = db.Column(
        db.String(150),
        nullable=False,
        index=True
    )

    descripcion = db.Column(
        db.String(500),
        nullable=True
    )

    estado = db.Column(
        db.Boolean,
        default=True,
        nullable=False,
        index=True
    )

    version = db.Column(
        db.Integer,
        default=1,
        nullable=False
    )

    creado_en = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    categoria_mantenimiento = db.Column(
        db.String(100),
        nullable=True
    )

    perfil_activo = db.Column(
        db.String(100),
        nullable=True,
        index=True
    )

    items = db.relationship(
        "ChecklistPlantillaItem",
        back_populates="plantilla",
        cascade="all, delete-orphan",
        lazy="select"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "descripcion": self.descripcion,
            "estado": self.estado,
            "version": self.version,
            "creado_en": (
                self.creado_en.isoformat()
                if self.creado_en else None
            ),
            "categoria_mantenimiento": self.categoria_mantenimiento,
            "perfil_activo": self.perfil_activo,
            "items": [
                item.to_dict()
                for item in self.items
            ]
        }


# ==========================================================
# ITEMS DE LA PLANTILLA
# ==========================================================

class ChecklistPlantillaItem(db.Model):
    __tablename__ = "checklist_plantilla_items"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    id_plantilla = db.Column(
        db.Integer,
        db.ForeignKey("checklist_plantillas.id"),
        nullable=False,
        index=True
    )

    texto = db.Column(
        db.String(500),
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

    plantilla = db.relationship(
        "ChecklistPlantilla",
        back_populates="items"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "id_plantilla": self.id_plantilla,
            "texto": self.texto,
            "orden": self.orden,
            "creado_en": (
                self.creado_en.isoformat()
                if self.creado_en else None
            )
        }


# ==========================================================
# INSTANCIAS DEL CHECKLIST
# ==========================================================

class ChecklistInstancia(db.Model):
    __tablename__ = "checklist_instancias"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    id_tarea = db.Column(
        db.Integer,
        db.ForeignKey("tareas.id"),
        nullable=False,
        index=True
    )

    id_plantilla = db.Column(
        db.Integer,
        db.ForeignKey("checklist_plantillas.id"),
        nullable=True,
        index=True
    )

    nombre = db.Column(
        db.String(150),
        nullable=False
    )

    creado_en = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    tarea = db.relationship(
        "Tarea",
        foreign_keys=[id_tarea]
    )

    plantilla = db.relationship(
        "ChecklistPlantilla",
        foreign_keys=[id_plantilla]
    )

    items = db.relationship(
        "ChecklistInstanciaItem",
        back_populates="instancia",
        cascade="all, delete-orphan",
        lazy="select"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "id_tarea": self.id_tarea,
            "id_plantilla": self.id_plantilla,
            "nombre": self.nombre,
            "creado_en": (
                self.creado_en.isoformat()
                if self.creado_en else None
            ),
            "items": [
                item.to_dict()
                for item in self.items
            ]
        }


# ==========================================================
# ITEMS DE LA INSTANCIA
# ==========================================================

class ChecklistInstanciaItem(db.Model):
    __tablename__ = "checklist_instancia_items"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    id_instancia = db.Column(
        db.Integer,
        db.ForeignKey("checklist_instancias.id"),
        nullable=False,
        index=True
    )

    texto = db.Column(
        db.String(500),
        nullable=False
    )

    orden = db.Column(
        db.Integer,
        default=0,
        nullable=False
    )

    completado = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    observaciones = db.Column(
        db.String(1000),
        nullable=True
    )

    completado_por = db.Column(
        db.Integer,
        nullable=True
    )

    completado_en = db.Column(
        db.DateTime,
        nullable=True
    )

    instancia = db.relationship(
        "ChecklistInstancia",
        back_populates="items"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "id_instancia": self.id_instancia,
            "texto": self.texto,
            "orden": self.orden,
            "completado": self.completado,
            "observaciones": self.observaciones,
            "completado_por": self.completado_por,
            "completado_en": (
                self.completado_en.isoformat()
                if self.completado_en else None
            )
        }