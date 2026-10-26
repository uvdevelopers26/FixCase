// Fecha sin hora (AAAA-MM-DD) -> DD/MM/AAAA, sin desfase de zona horaria
function formatSoloFecha(val) {
  if (!val) return '—';
  const [y, m, d] = String(val).slice(0, 10).split('-');
  return (y && m && d) ? `${d}/${m}/${y}` : '—';
}

const tareasView = {
  title: 'Tarea Técnica',
  sub: 'El sistema abrirá el checklist automáticamente según el equipo y trabajo seleccionado.',
  endpoint: '/tareas/',

  columns: [
    { key: 'id', label: 'ID' },
    {
      key: 'codigo_activo',
      label: 'Activo',
      render: (val) => val ? `<strong>${val}</strong>` : '—'
    },
    { key: 'tipo_trabajo', label: 'Trabajo', render: (val) => val || '—' },
    { key: 'tecnico', label: 'Técnico', render: (val) => val || '—' },
    {
      key: 'prioridad',
      label: 'Prioridad',
      render: (val) => {
        const clases = { alta: 'warning', media: 'neutral', baja: 'neutral' };
        return val ? `<span class="badge ${clases[val] || ''}">${val}</span>` : '—';
      }
    },
    {
      key: 'id_estado',
      label: 'Estado',
      render: (val) => {
        const clases = { completado: 'on', pendiente: 'neutral', en_proceso: 'warning' };
        return `<span class="badge ${clases[val] || ''}">${val}</span>`;
      }
    },
    {
      key: 'checklist',
      label: 'Checklist',
      render: (val) => (val && val.total) ? `${val.completados}/${val.total}` : '—'
    },
    {
      key: 'fecha_programada',
      label: 'Programada',
      render: (val) => formatSoloFecha(val)
    }
  ],

  render: async function(container) {
    container.innerHTML = '<div class="empty-state">Cargando tareas...</div>';
    try {
      const tareas = await tareasView.request(`${API_BASE}${tareasView.endpoint}`);
      const columns = [...tareasView.columns, {
        key: 'id',
        label: 'Acciones',
        render: (id) => `<div class="task-row-actions"><button type="button" class="btn-secondary" data-task-action="edit" data-task-id="${Number(id)}">Editar</button><button type="button" class="btn-secondary task-delete" data-task-action="delete" data-task-id="${Number(id)}">Eliminar</button></div>`
      }];
      container.innerHTML = renderTable(tareas, columns);
      container.querySelectorAll('[data-task-action="edit"]').forEach(button => {
        button.addEventListener('click', () => tareasView.edit(button.dataset.taskId));
      });
      container.querySelectorAll('[data-task-action="delete"]').forEach(button => {
        button.addEventListener('click', () => tareasView.remove(button.dataset.taskId));
      });
    } catch (e) {
      container.innerHTML = `<div class="empty-state">No se pudieron cargar las tareas: ${escapeHtml(e.message)}</div>`;
    }
  },

  request: async function(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${getToken()}`,
        ...(options.headers || {})
      }
    });
    if (response.status === 401) {
      clearToken();
      showLogin();
      throw new Error('La sesión expiró.');
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'No se pudo completar la acción.');
    }
    return response.status === 204 ? null : response.json();
  },

  edit: async function(id) {
    try {
      const [tarea, activos, usuarios] = await Promise.all([
        tareasView.request(`${API_BASE}${tareasView.endpoint}${id}`),
        tareasView.request(`${API_BASE}/activos/`),
        tareasView.request(`${API_BASE}/usuarios/`)
      ]);
      const selectOptions = (rows, key, current, label) => rows.map(row =>
        `<option value="${escapeHtml(row[key])}" ${String(row[key]) === String(current) ? 'selected' : ''}>${escapeHtml(label(row))}</option>`
      ).join('');
      const taskOptions = (values, current) => {
        const choices = values.includes(current) ? values : [...values, ...(current ? [current] : [])];
        return choices.map(value => `<option value="${escapeHtml(value)}" ${value === current ? 'selected' : ''}>${escapeHtml(value.replace('_', ' '))}</option>`).join('');
      };
      const activeUsers = usuarios.filter(user => user.activo !== false);
      const assetOptions = selectOptions(activos, 'id', tarea.id_activo, asset => `${asset.nombre} (${asset.serial || 'S/N'})`);
      const userOptions = selectOptions(activeUsers, 'id', tarea.id_usuario, user => user.user);
      openCustomModal('Editar tarea', `<div class="task-edit-form">
        <div class="field"><label for="task-edit-asset">Equipo</label><select id="task-edit-asset" required>${assetOptions}</select></div>
        <div class="field"><label for="task-edit-user">Técnico responsable</label><select id="task-edit-user" required>${userOptions}</select></div>
        <div class="field"><label for="task-edit-work">Tipo de trabajo</label><select id="task-edit-work" required>${taskOptions(['Preventivo', 'Correctivo', 'Reinstalacion'], tarea.tipo_trabajo)}</select></div>
        <div class="field"><label for="task-edit-priority">Prioridad</label><select id="task-edit-priority">${taskOptions(['baja', 'media', 'alta'], tarea.prioridad || 'media')}</select></div>
        <div class="field"><label for="task-edit-status">Estado</label><select id="task-edit-status">${taskOptions(['pendiente', 'en_proceso', 'completado', 'cancelado'], tarea.id_estado || 'pendiente')}</select></div>
        <div class="field"><label for="task-edit-date">Fecha programada</label><input id="task-edit-date" type="date" value="${escapeHtml(tarea.fecha_programada || '')}"></div>
        <div class="field full"><label for="task-edit-description">Descripción / observaciones</label><textarea id="task-edit-description" rows="4">${escapeHtml(tarea.descripcion || '')}</textarea></div>
      </div>`, async () => {
        const payload = {
          id_activo: Number(document.getElementById('task-edit-asset').value),
          id_usuario: Number(document.getElementById('task-edit-user').value),
          tipo_trabajo: document.getElementById('task-edit-work').value,
          prioridad: document.getElementById('task-edit-priority').value,
          id_estado: document.getElementById('task-edit-status').value,
          fecha_programada: document.getElementById('task-edit-date').value || null,
          descripcion: document.getElementById('task-edit-description').value.trim() || null
        };
        await tareasView.request(`${API_BASE}${tareasView.endpoint}${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        closeModal();
        loadView('tareas');
      }, 'Guardar cambios');
    } catch (e) { alert(e.message); }
  },

  remove: async function(id) {
    if (!confirm('¿Eliminar esta tarea? Los checklists y plantillas vinculados se conservarán, pero quedarán desvinculados.')) return;
    try {
      await tareasView.request(`${API_BASE}${tareasView.endpoint}${id}`, { method: 'DELETE' });
      loadView('tareas');
    } catch (e) { alert(e.message); }
  },

  createFields: [
    {
      key: 'asunto_grupo',
      label: '1. Categoría de Equipo',
      type: 'select',
      required: true,
      options: [
        { value: 'AIO', label: '🖥️ Todo en Uno' },
        { value: 'SOFTWARE', label: '💿 Software / Aplicativo' },
        { value: 'IMPRESORA', label: '🖨️ Impresora' },
        { value: 'PORTATIL', label: '💻 Portátil / Laptop' },
        { value: 'TELEVISOR', label: '📺 Televisor' }
      ],
      onChange: (val) => {
        tareasView.cargarTecnicos();
        tareasView.actualizarActivos(val);
      }
    },
    {
      key: 'id_activo',
      label: '2. Equipo Específico',
      type: 'select',
      required: true,
      options: []
    },
    {
      key: 'tipo_trabajo',
      label: '3. Tipo de Trabajo',
      type: 'select',
      required: true,
      options: [
        { value: 'Preventivo', label: '🛠️ Mantenimiento Preventivo' },
        { value: 'Correctivo', label: '🚨 Mantenimiento Correctivo' },
        { value: 'Reinstalacion', label: '📦 Reinstalación / Cambio' }
      ],
      onChange: (val) => { tareasView.validarPlantilla(val); }
    },
    {
      key: 'id_usuario',
      label: 'Técnico responsable',
      type: 'select',
      required: true,
      options: []
    },
    {
      key: 'prioridad',
      label: 'Prioridad',
      type: 'select',
      options: [
        { value: 'media', label: 'Media' },
        { value: 'alta', label: 'Alta' },
        { value: 'baja', label: 'Baja' }
      ]
    },
    { key: 'fecha_programada', label: 'Fecha programada', type: 'date' },
    { key: 'descripcion', label: 'Descripción / observaciones', type: 'textarea' }
  ],

  // Si modal.js soporta un hook de apertura, se usa; si no, los técnicos
  // se cargan al elegir la categoría (ver onChange del primer campo).
  onOpen: function() {
    tareasView.cargarTecnicos();
  },

  // Id del usuario logueado, leído del JWT (null si no se puede obtener)
  usuarioActualId: function() {
    try {
      const payload = JSON.parse(atob(getToken().split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.id || payload.user_id || payload.id_usuario || payload.sub || null;
    } catch (e) {
      return null;
    }
  },

  cargarTecnicos: async function() {
    const select = document.getElementById('f-id_usuario');
    if (!select || select.dataset.cargado === '1') return;
    select.innerHTML = '<option disabled selected>Cargando técnicos...</option>';
    try {
      const res = await fetch(`${API_BASE}/usuarios/`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const usuarios = (await res.json()).filter(u => u.activo !== false);
      const actual = String(tareasView.usuarioActualId() ?? '');
      select.innerHTML = usuarios.map(u =>
        `<option value="${u.id}" ${String(u.id) === actual ? 'selected' : ''}>${u.user}</option>`
      ).join('') || '<option disabled selected>No hay técnicos disponibles</option>';
      select.dataset.cargado = '1';
    } catch (e) {
      console.error('Error cargando técnicos:', e);
      select.innerHTML = '<option disabled selected>No se pudieron cargar los técnicos</option>';
    }
  },

  actualizarActivos: async function(tipo) {
    const select = document.getElementById('f-id_activo');
    select.innerHTML = '<option disabled>Cargando equipos...</option>';
    try {
      const res = await fetch(`${API_BASE}/activos/`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const activos = await res.json();
      const filtrados = activos.filter(a => a.categoria_tipo === tipo);
      select.innerHTML = filtrados.map(a => `<option value="${a.id}">${a.nombre} (${a.serial || 'S/N'})</option>`).join('')
                         || '<option disabled>No hay equipos registrados</option>';
    } catch (e) { console.error("Error filtrando activos:", e); }
  },

  validarPlantilla: async function(mant) {
    const perfil = document.getElementById('f-asunto_grupo').value;
    const errorBox = document.getElementById('modal-error');
    const submitBtn = document.getElementById('modal-submit');

    try {
      // Sin barra final antes de "?": la ruta del backend es /plantillas/buscar-match
      const res = await fetch(`${API_BASE}/checklists/plantillas/buscar-match?perfil=${encodeURIComponent(perfil)}&mantenimiento=${encodeURIComponent(mant)}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) {
        errorBox.textContent = `⚠️ No hay plantilla para ${perfil} en modo ${mant}.`;
        errorBox.style.display = 'block';
        submitBtn.disabled = true;
      } else {
        errorBox.style.display = 'none';
        submitBtn.disabled = false;
      }
    } catch (e) { console.error(e); }
  }
};
