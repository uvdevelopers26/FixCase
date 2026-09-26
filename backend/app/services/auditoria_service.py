from database import db
from app.models.auditoria_usuario import AuditoriaUsuario

def registrar_auditoria_usuario(usuario_afectado_id, accion, operador_id=None, detalles=None, ip=None):
    try:
        log = AuditoriaUsuario(
            usuario_afectado_id=usuario_afectado_id,
            usuario_operador_id=operador_id,
            accion=accion,
            detalles=detalles,
            ip_origen=ip
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error registrando auditoría: {e}")