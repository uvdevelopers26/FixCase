from datetime import datetime
from flask import Blueprint, request, jsonify
from database import db
from app.models import ChecklistPlantilla, ChecklistPlantillaItem, ChecklistInstancia, ChecklistInstanciaItem

checklists_bp = Blueprint('checklists', __name__, url_prefix='/api/checklists')

# ---------- Plantillas ----------

@checklists_bp.route('/plantillas', methods=['GET'])
def get_plantillas():
    plantillas = ChecklistPlantilla.query.all()
    return jsonify([p.to_dict() for p in plantillas])

@checklists_bp.route('/plantillas/<int:id>', methods=['GET'])
def get_plantilla(id):
    plantilla = ChecklistPlantilla.query.get_or_404(id)
    return jsonify(plantilla.to_dict())

@checklists_bp.route('/plantillas', methods=['POST'])
def crear_plantilla():
    data = request.get_json()
    nueva = ChecklistPlantilla(
        nombre=data.get('nombre'),
        descripcion=data.get('descripcion'),
        estado=data.get('estado', True),
        version=data.get('version', 1),
        categoria_mantenimiento=data.get('categoria_mantenimiento'),
        perfil_activo=data.get('perfil_activo')
    )
    db.session.add(nueva)
    db.session.commit()

    # Permite crear la plantilla junto con sus items en la misma llamada
    for item_data in data.get('items', []):
        item = ChecklistPlantillaItem(
            id_plantilla=nueva.id,
            texto=item_data.get('texto'),
            orden=item_data.get('orden', 0)
        )
        db.session.add(item)
    db.session.commit()

    return jsonify(nueva.to_dict()), 201

@checklists_bp.route('/plantillas/<int:id>', methods=['PUT'])
def actualizar_plantilla(id):
    plantilla = ChecklistPlantilla.query.get_or_404(id)
    data = request.get_json()
    for campo in ['nombre', 'descripcion', 'estado', 'version',
                  'categoria_mantenimiento', 'perfil_activo']:
        if campo in data:
            setattr(plantilla, campo, data[campo])
    db.session.commit()
    return jsonify(plantilla.to_dict())

@checklists_bp.route('/plantillas/<int:id>', methods=['DELETE'])
def eliminar_plantilla(id):
    plantilla = ChecklistPlantilla.query.get_or_404(id)
    db.session.delete(plantilla)  # cascade borra sus items automáticamente
    db.session.commit()
    return '', 204

# ---------- Items de plantilla ----------

@checklists_bp.route('/plantillas/<int:id_plantilla>/items', methods=['POST'])
def agregar_item_plantilla(id_plantilla):
    ChecklistPlantilla.query.get_or_404(id_plantilla)  # valida que exista
    data = request.get_json()
    item = ChecklistPlantillaItem(
        id_plantilla=id_plantilla,
        texto=data.get('texto'),
        orden=data.get('orden', 0)
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201

@checklists_bp.route('/plantillas/items/<int:id_item>', methods=['PUT'])
def actualizar_item_plantilla(id_item):
    item = ChecklistPlantillaItem.query.get_or_404(id_item)
    data = request.get_json()
    item.texto = data.get('texto', item.texto)
    item.orden = data.get('orden', item.orden)
    db.session.commit()
    return jsonify(item.to_dict())

@checklists_bp.route('/plantillas/items/<int:id_item>', methods=['DELETE'])
def eliminar_item_plantilla(id_item):
    item = ChecklistPlantillaItem.query.get_or_404(id_item)
    db.session.delete(item)
    db.session.commit()
    return '', 204

# ---------- Buscar plantilla que coincida con el activo y mantenimiento ----------
@checklists_bp.route('/plantillas/buscar-match', methods=['GET'])
def buscar_match_plantilla():
    perfil = request.args.get('perfil')
    mantenimiento = request.args.get('mantenimiento')

    plantilla = ChecklistPlantilla.query.filter_by(
        perfil_activo=perfil,
        categoria_mantenimiento=mantenimiento,
        estado=True
    ).first()

    if not plantilla:
        return jsonify({"error": "No se encontró una plantilla que coincida"}), 404

    return jsonify(plantilla.to_dict())

# ---------- Instancias ----------

@checklists_bp.route('/instancias', methods=['GET'])
def get_instancias():
    instancias = ChecklistInstancia.query.all()
    return jsonify([i.to_dict() for i in instancias])

@checklists_bp.route('/instancias/<int:id>', methods=['GET'])
def get_instancia(id):
    instancia = ChecklistInstancia.query.get_or_404(id)
    return jsonify(instancia.to_dict())

@checklists_bp.route('/instancias', methods=['POST'])
def crear_instancia():
    """
    Crea una instancia de checklist para una tarea, normalmente a partir
    de una plantilla existente (copia sus items como items de instancia).
    """
    data = request.get_json()
    id_tarea = data.get('id_tarea')
    id_plantilla = data.get('id_plantilla')

    if not id_tarea:
        return jsonify({"error": "id_tarea es requerido"}), 400

    nombre = data.get('nombre')
    items_copiados = []

    if id_plantilla:
        plantilla = ChecklistPlantilla.query.get_or_404(id_plantilla)
        nombre = nombre or plantilla.nombre
        items_copiados = [
            {"texto": item.texto, "orden": item.orden}
            for item in plantilla.items
        ]

    if not nombre:
        return jsonify({"error": "nombre es requerido si no se envía id_plantilla"}), 400

    instancia = ChecklistInstancia(
        id_tarea=id_tarea,
        id_plantilla=id_plantilla,
        nombre=nombre
    )
    db.session.add(instancia)
    db.session.commit()

    # copia los items de la plantilla, o usa items enviados manualmente
    for item_data in (items_copiados or data.get('items', [])):
        item = ChecklistInstanciaItem(
            id_instancia=instancia.id,
            texto=item_data.get('texto'),
            orden=item_data.get('orden', 0)
        )
        db.session.add(item)
    db.session.commit()

    return jsonify(instancia.to_dict()), 201

@checklists_bp.route('/instancias/<int:id>', methods=['DELETE'])
def eliminar_instancia(id):
    instancia = ChecklistInstancia.query.get_or_404(id)
    db.session.delete(instancia)  # cascade borra sus items
    db.session.commit()
    return '', 204

# (misma lógica que POST /instancias, solo con la URL que ya espera checklists.js)
@checklists_bp.route('/instancias/desde-plantilla', methods=['POST'])
def crear_instancia_desde_plantilla():
    return crear_instancia()

# ---------- Items de instancia (marcar como completado) ----------

@checklists_bp.route('/instancias/items/<int:id_item>', methods=['PUT', 'PATCH'])
def actualizar_item_instancia(id_item):
    item = ChecklistInstanciaItem.query.get_or_404(id_item)
    data = request.get_json()

    if 'completado' in data:
        item.completado = data['completado']
        item.completado_por = data.get('completado_por')
        item.completado_en = datetime.utcnow() if data['completado'] else None

    if 'observaciones' in data:
        item.observaciones = data['observaciones']

    if 'texto' in data:
        item.texto = data['texto']

    db.session.commit()
    return jsonify(item.to_dict())



# ---------- Instancias de una tarea específica ----------
@checklists_bp.route('/tareas/<int:id_tarea>/instancias', methods=['GET'])
def get_instancias_por_tarea(id_tarea):
    instancias = ChecklistInstancia.query.filter_by(id_tarea=id_tarea) \
        .order_by(ChecklistInstancia.id.desc()).all()
    return jsonify([i.to_dict() for i in instancias])

# ---------- Alias: crear instancia desde plantilla ----------