from flask import Blueprint, request, jsonify
from database import db
from app.models import Plantilla

plantillas_bp = Blueprint('plantillas', __name__, url_prefix='/api/plantillas')

@plantillas_bp.route('/', methods=['GET'])
def get_plantillas():
    plantillas = Plantilla.query.all()
    return jsonify([p.to_dict() for p in plantillas])

@plantillas_bp.route('/<int:id>', methods=['GET'])
def get_plantilla(id):
    plantilla = Plantilla.query.get_or_404(id)
    return jsonify(plantilla.to_dict())

@plantillas_bp.route('/', methods=['POST'])
def crear_plantilla():
    data = request.get_json()
    nueva = Plantilla(
        nombre=data.get('nombre'),
        id_activos=data.get('id_activos'),
        id_tareas=data.get('id_tareas'),
        tipo_asunto=data.get('tipo_asunto'),
        contenido=data.get('contenido'),
        estado=data.get('estado', True),
        version=data.get('version', 1)
    )
    db.session.add(nueva)
    db.session.commit()
    return jsonify(nueva.to_dict()), 201

@plantillas_bp.route('/<int:id>', methods=['PUT'])
def actualizar_plantilla(id):
    plantilla = Plantilla.query.get_or_404(id)
    data = request.get_json()
    for campo in ['nombre', 'id_activos', 'id_tareas', 'tipo_asunto',
                  'contenido', 'estado', 'version']:
        if campo in data:
            setattr(plantilla, campo, data[campo])
    db.session.commit()
    return jsonify(plantilla.to_dict())

@plantillas_bp.route('/<int:id>', methods=['DELETE'])
def eliminar_plantilla(id):
    plantilla = Plantilla.query.get_or_404(id)
    db.session.delete(plantilla)
    db.session.commit()
    return '', 204