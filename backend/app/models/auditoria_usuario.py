from database import db
from datetime import datetime

class AuditoriaUsuario(db.Model):
    __tablename__ = 'auditoria_usuarios'

    id = db.Column(db.Integer, primary_key=True)
    usuario_afectado_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    usuario_operador_id = db.Column(db.Integer, nullable=True) # ID del admin que ejecutó el cambio
    accion = db.Column(db.String(50), nullable=False)
    detalles = db.Column(db.Text, nullable=True)
    ip_origen = db.Column(db.String(45), nullable=True)
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<AuditoriaUsuario {self.accion} - UserID: {self.usuario_afectado_id}>"