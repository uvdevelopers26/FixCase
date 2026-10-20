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
        nullable=True,
        index=True
    )

    id_activo = db.Column(db.Integer, db.ForeignKey("activos.id"), nullable=True, index=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=True, index=True)
    fecha_programada = db.Column(db.Date, nullable=True, index=True)
    observaciones = db.Column(db.String(2000), nullable=True)

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

    activo = db.relationship("Activo", foreign_keys=[id_activo])
    responsable = db.relationship("Usuario", foreign_keys=[id_usuario])

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
        items = list(self.items)
        estado = (
            "Pendiente" if not items or not any(item.completado for item in items)
            else "Completado" if all(item.completado for item in items)
            else "En progreso"
        )
        return {
            "id": self.id,
            "id_tarea": self.id_tarea,
            "id_activo": self.id_activo or (self.tarea.id_activo if self.tarea else None),
            "activo": self.activo.to_dict() if self.activo else (self.tarea.activo.to_dict() if self.tarea and self.tarea.activo else None),
            "id_usuario": self.id_usuario or (self.tarea.id_usuario if self.tarea else None),
            "responsable": self.responsable.to_dict() if self.responsable else (self.tarea.usuario.to_dict() if self.tarea and self.tarea.usuario else None),
            "fecha_programada": self.fecha_programada.isoformat() if self.fecha_programada else None,
            "estado": estado,
            "observaciones": self.observaciones,
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
