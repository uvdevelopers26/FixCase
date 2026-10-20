from datetime import date, datetime
import os
import jwt
from flask import Blueprint, jsonify, request
from sqlalchemy.orm import joinedload
from database import db
from app.models import ChecklistPlantilla, ChecklistPlantillaItem, ChecklistInstancia, ChecklistInstanciaItem, Activo, Usuario, Tarea

checklists_bp = Blueprint('checklists', __name__, url_prefix='/api/checklists')


def error(message, status=400):
    return jsonify({'error': message}), status


def es_administrador():
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return False
    try:
        claims = jwt.decode(auth[7:], os.getenv('SECRET_KEY'), algorithms=['HS256'])
        return str(claims.get('rol', '')).strip().lower() in ('administrador', 'admin')
    except (jwt.PyJWTError, TypeError, ValueError):
        return False


def estado_instancia(instancia):
    items = instancia.items
    if not items or not any(item.completado for item in items):
        return 'Pendiente'
    if all(item.completado for item in items):
        return 'Completado'
    return 'En progreso'


def parse_fecha(value):
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        raise ValueError('La fecha debe tener formato AAAA-MM-DD.')


def nombre_activo(activo):
    """Identificador legible del activo, sin asumir que exista una columna 'nombre'."""
    if not activo:
        return None
    return activo.placa or activo.serial or f'Activo {activo.id}'


def instancia_dict(instancia):
    data = instancia.to_dict()
    data['estado'] = estado_instancia(instancia)
    data['categoria'] = (instancia.plantilla.categoria_mantenimiento or instancia.plantilla.perfil_activo) if instancia.plantilla else None
    activo = instancia.activo or (instancia.tarea.activo if instancia.tarea else None)
    data['codigo_activo'] = (activo.placa or activo.serial or str(activo.id)) if activo else None

    responsable = instancia.responsable or (instancia.tarea.usuario if instancia.tarea else None)
    data['tecnico'] = (getattr(responsable, 'user', None) or getattr(responsable, 'nombre', None)) if responsable else None

    if not data['categoria'] and activo:
        data['categoria'] = activo.categoria_tipo
    return data


@checklists_bp.route('/plantillas', methods=['GET'])
def get_plantillas():
    return jsonify([p.to_dict() for p in ChecklistPlantilla.query.order_by(ChecklistPlantilla.nombre).all()])


@checklists_bp.route('/plantillas/<int:id>', methods=['GET'])
def get_plantilla(id):
    return jsonify(ChecklistPlantilla.query.get_or_404(id).to_dict())


@checklists_bp.route('/plantillas', methods=['POST'])
def crear_plantilla():
    data = request.get_json() or {}
    nombre = (data.get('nombre') or '').strip()
    items = data.get('items') or []
    if not nombre:
        return error('El nombre de la plantilla es obligatorio.')
    if not isinstance(items, list):
        return error('Los puntos de revisión deben enviarse como una lista.')
    plantilla = ChecklistPlantilla(
        nombre=nombre,
        descripcion=data.get('descripcion'),
        categoria_mantenimiento=data.get('categoria_mantenimiento') or data.get('categoria'),
        perfil_activo=data.get('perfil_activo'),
        estado=data.get('estado', True),
        version=1
    )
    db.session.add(plantilla)
    db.session.flush()
    for orden, item_data in enumerate(items, 1):
        texto = (item_data.get('texto') or '').strip()
        if texto:
            db.session.add(ChecklistPlantillaItem(id_plantilla=plantilla.id, texto=texto, orden=orden))
    db.session.commit()
    return jsonify(plantilla.to_dict()), 201


@checklists_bp.route('/plantillas/<int:id>', methods=['PUT'])
def actualizar_plantilla(id):
    plantilla = ChecklistPlantilla.query.get_or_404(id)
    data = request.get_json() or {}
    for field in ('nombre', 'descripcion', 'estado', 'categoria_mantenimiento', 'perfil_activo'):
        if field in data:
            setattr(plantilla, field, data[field])
    if 'categoria' in data:
        plantilla.categoria_mantenimiento = data['categoria']
    if 'items' in data:
        if not isinstance(data['items'], list):
            return error('Los puntos de revisión deben enviarse como una lista.')
        plantilla.items.clear()
        for orden, item_data in enumerate(data['items'], 1):
            texto = (item_data.get('texto') or '').strip()
            if texto:
                plantilla.items.append(ChecklistPlantillaItem(texto=texto, orden=orden))
        plantilla.version = (plantilla.version or 1) + 1
    db.session.commit()
    return jsonify(plantilla.to_dict())


@checklists_bp.route('/plantillas/<int:id>', methods=['DELETE'])
def eliminar_plantilla(id):
    if not es_administrador():
        return error('Solo un administrador puede eliminar plantillas.', 403)
    plantilla = ChecklistPlantilla.query.get_or_404(id)
    ChecklistInstancia.query.filter_by(id_plantilla=id).update({ChecklistInstancia.id_plantilla: None})
    db.session.delete(plantilla)
    db.session.commit()
    return '', 204


@checklists_bp.route('/plantillas/buscar-match', methods=['GET'])
def buscar_match_plantilla():
    plantilla = ChecklistPlantilla.query.filter_by(
        perfil_activo=request.args.get('perfil'),
        categoria_mantenimiento=request.args.get('mantenimiento'),
        estado=True
    ).first()
    return (jsonify(plantilla.to_dict()), 200) if plantilla else error('No se encontró una plantilla que coincida.', 404)


@checklists_bp.route('/instancias', methods=['GET'])
def get_instancias():
    rows = ChecklistInstancia.query.options(
        joinedload(ChecklistInstancia.activo),
        joinedload(ChecklistInstancia.responsable),
        joinedload(ChecklistInstancia.plantilla),
        joinedload(ChecklistInstancia.tarea)
    ).order_by(ChecklistInstancia.id.desc()).all()
    return jsonify([instancia_dict(row) for row in rows])


@checklists_bp.route('/instancias/<int:id>', methods=['GET'])
def get_instancia(id):
    row = ChecklistInstancia.query.options(
        joinedload(ChecklistInstancia.activo),
        joinedload(ChecklistInstancia.responsable),
        joinedload(ChecklistInstancia.plantilla),
        joinedload(ChecklistInstancia.tarea)
    ).get_or_404(id)
    return jsonify(instancia_dict(row))


@checklists_bp.route('/instancias', methods=['POST'])
@checklists_bp.route('/instancias/desde-plantilla', methods=['POST'])
def crear_instancia():
    data = request.get_json() or {}
    plantilla = ChecklistPlantilla.query.get(data.get('id_plantilla')) if data.get('id_plantilla') else None
    if data.get('id_plantilla') and not plantilla:
        return error('La plantilla seleccionada no existe.', 404)

    tarea = Tarea.query.get(data.get('id_tarea')) if data.get('id_tarea') else None
    if data.get('id_tarea') and not tarea:
        return error('La tarea seleccionada no existe.', 404)

    id_activo = data.get('id_activo') or (tarea.id_activo if tarea else None)
    id_usuario = data.get('id_usuario') or (tarea.id_usuario if tarea else None)
    activo = Activo.query.get(id_activo) if id_activo else None

    if not activo:
        return error('Selecciona un activo válido.')
    if not id_usuario or not Usuario.query.get(id_usuario):
        return error('Selecciona un técnico responsable válido.')
    if not plantilla and not data.get('nombre'):
        return error('Selecciona una plantilla o indica el nombre del checklist.')

    try:
        fecha = parse_fecha(data.get('fecha_programada') or data.get('fecha'))
    except ValueError as exc:
        return error(str(exc))

    snapshot = [{'texto': item.texto, 'orden': item.orden} for item in sorted(plantilla.items, key=lambda x: x.orden)] if plantilla else data.get('items', [])

    nombre_defecto = f"{plantilla.nombre} - {nombre_activo(activo)}" if plantilla else "Checklist"
    instancia = ChecklistInstancia(
        id_tarea=tarea.id if tarea else None,
        id_plantilla=plantilla.id if plantilla else None,
        id_activo=id_activo,
        id_usuario=id_usuario,
        fecha_programada=fecha or date.today(),
        observaciones=data.get('observaciones'),
        nombre=(data.get('nombre') or nombre_defecto).strip()
    )

    db.session.add(instancia)
    db.session.flush()
    for orden, item in enumerate(snapshot, 1):
        texto = (item.get('texto') or '').strip()
        if texto:
            db.session.add(ChecklistInstanciaItem(id_instancia=instancia.id, texto=texto, orden=item.get('orden', orden)))
    db.session.commit()
    return jsonify(instancia_dict(instancia)), 201


@checklists_bp.route('/instancias/<int:id>', methods=['PUT', 'PATCH'])
def actualizar_instancia(id):
    instancia = ChecklistInstancia.query.get_or_404(id)
    data = request.get_json() or {}
    if 'id_usuario' in data:
        if not Usuario.query.get(data['id_usuario']):
            return error('El técnico seleccionado no existe.')
        instancia.id_usuario = data['id_usuario']
    if 'id_activo' in data:
        if not Activo.query.get(data['id_activo']):
            return error('El activo seleccionado no existe.')
        instancia.id_activo = data['id_activo']
    if 'fecha_programada' in data or 'fecha' in data:
        try:
            instancia.fecha_programada = parse_fecha(data.get('fecha_programada') or data.get('fecha'))
        except ValueError as exc:
            return error(str(exc))
    for field in ('nombre', 'observaciones'):
        if field in data:
            setattr(instancia, field, data[field])
    db.session.commit()
    return jsonify(instancia_dict(instancia))


@checklists_bp.route('/instancias/<int:id>', methods=['DELETE'])
def eliminar_instancia(id):
    if not es_administrador():
        return error('Solo un administrador puede eliminar checklists.', 403)
    instancia = ChecklistInstancia.query.get_or_404(id)
    db.session.delete(instancia)
    db.session.commit()
    return '', 204


@checklists_bp.route('/instancias/items/<int:id_item>', methods=['PUT', 'PATCH'])
def actualizar_item_instancia(id_item):
    item = ChecklistInstanciaItem.query.get_or_404(id_item)
    data = request.get_json() or {}
    if 'completado' in data:
        item.completado = bool(data['completado'])
        item.completado_por = data.get('completado_por')
        item.completado_en = datetime.utcnow() if item.completado else None
    if 'observaciones' in data:
        item.observaciones = data['observaciones']
    db.session.commit()
    return jsonify(item.to_dict())


@checklists_bp.route('/tareas/<int:id_tarea>/instancias', methods=['GET'])
def get_instancias_por_tarea(id_tarea):
    rows = ChecklistInstancia.query.filter_by(id_tarea=id_tarea).order_by(ChecklistInstancia.id.desc()).all()
    return jsonify([instancia_dict(row) for row in rows])