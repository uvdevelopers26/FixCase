from database import db
from app.models.usuario import Usuario


class UsuarioRepository:
    """
    Repositorio para operaciones de persistencia de usuarios.

    Esta capa es responsable exclusivamente de interactuar
    con la base de datos.
    """

    @staticmethod
    def obtener_todos():
        return Usuario.query.order_by(Usuario.id.asc()).all()

    @staticmethod
    def obtener_por_id(usuario_id):
        return db.session.get(Usuario, usuario_id)

    @staticmethod
    def obtener_por_username(username):
        return Usuario.query.filter_by(user=username).first()

    @staticmethod
    def obtener_activos():
        return (
            Usuario.query
            .filter_by(activo=True)
            .order_by(Usuario.id.asc())
            .all()
        )

    @staticmethod
    def crear(usuario):
        db.session.add(usuario)
        db.session.commit()
        db.session.refresh(usuario)
        return usuario

    @staticmethod
    def actualizar(usuario):
        db.session.commit()
        db.session.refresh(usuario)
        return usuario

    @staticmethod
    def eliminar(usuario):
        db.session.delete(usuario)
        db.session.commit()

    @staticmethod
    def guardar():
        db.session.commit()

    @staticmethod
    def rollback():
        db.session.rollback()