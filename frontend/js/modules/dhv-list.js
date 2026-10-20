// Vista de consulta de hojas de vida por activo.
let dhvFilasCache = [];
let dhvUsuariosCache = [];

// Evita generar controles sin etiqueta para elementos de seccion o metadatos internos.
dhvView.createFields = dhvView.createFields.filter(field =>
  field.type !== 'section' && field.type !== 'custom' &&
  !['responsable_instalacion', 'responsable_devolucion', 'responsable_prestamo', 'entregado_a', 'creado_por'].includes(field.key)
);
dhvView.openNew = async function () {
  openModal('dhv');
  await prepararSelectorActivosDHV();
};
dhvView.render = async function (container) {
  container.innerHTML = '<div class="empty-state">Cargando hojas de vida...</div>';
  try {
    const headers = { Authorization: `Bearer ${getToken()}` };
    const [assetsRes, sheetsRes] = await Promise.all([fetch(`${API_BASE}/activos/`, { headers }), fetch(`${API_BASE}/dhv/`, { headers })]);
    if (assetsRes.status === 401 || sheetsRes.status === 401) { clearToken(); showLogin(); return; }
    if (!assetsRes.ok || !sheetsRes.ok) throw new Error('No se pudieron cargar los activos y sus hojas de vida.');
    const [assets, sheets] = await Promise.all([assetsRes.json(), sheetsRes.json()]);
    dhvUsuariosCache = [];
    try {
      const usersRes = await fetch(`${API_BASE}/usuarios/`, { headers });
      if (usersRes.status === 401) { clearToken(); showLogin(); return; }
      if (usersRes.ok) dhvUsuariosCache = await usersRes.json();
    } catch (_) { /* El detalle conserva los identificadores si no se pueden consultar usuarios. */ }
    const sheetsByAsset = new Map(sheets.map(sheet => [Number(sheet.id_activo), sheet]));
    dhvFilasCache = assets.map(activo => ({ activo, hoja: sheetsByAsset.get(Number(activo.id)) || null }));
    container.innerHTML = `<div class="dhv-view-stack">
      <section class="dhv-filter-card" aria-labelledby="dhv-filter-heading">
        <div class="dhv-section-heading"><span class="material-symbols-outlined dhv-heading-icon">manage_search</span><div><h3 id="dhv-filter-heading">Buscar hojas de vida</h3><p>Filtra los activos por sus datos principales.</p></div></div>
        <form class="dhv-filters" id="dhv-filters">
          <div class="dhv-filter-field"><label for="dhv-filter-id">ID</label><input id="dhv-filter-id" type="search" placeholder="ID del activo"></div>
          <div class="dhv-filter-field"><label for="dhv-filter-activo">Activo</label><input id="dhv-filter-activo" type="search" placeholder="Nombre del activo"></div>
          <div class="dhv-filter-field"><label for="dhv-filter-serial">Serial</label><input id="dhv-filter-serial" type="search" placeholder="Serial"></div>
          <div class="dhv-filter-field"><label for="dhv-filter-area">&Aacute;rea</label><input id="dhv-filter-area" type="search" placeholder="Area"></div>
          <div class="dhv-filter-field"><label for="dhv-filter-tipo">Tipo</label><input id="dhv-filter-tipo" type="search" placeholder="Tipo"></div>
          <div class="dhv-filter-field"><label for="dhv-filter-fecha">Fecha</label><input id="dhv-filter-fecha" type="date"></div>
          <div class="dhv-filter-actions"><button class="btn-secondary dhv-clear" type="reset"><span class="material-symbols-outlined">restart_alt</span>Limpiar filtros</button></div>
        </form>
      </section>
      <section class="dhv-table-card" aria-labelledby="dhv-table-heading">
        <div class="dhv-table-heading"><div><h3 id="dhv-table-heading">Equipos registrados</h3><p id="dhv-count" aria-live="polite"></p></div></div>
        <div id="dhv-results" class="dhv-table-wrap"></div>
      </section>
    </div>`;
    const form = container.querySelector('#dhv-filters');
    const draw = () => {
      const value = key => form.querySelector(`#${key}`).value.trim().toLocaleLowerCase('es');
      const id = value('dhv-filter-id'), name = value('dhv-filter-activo'), serial = value('dhv-filter-serial');
      const area = value('dhv-filter-area'), type = value('dhv-filter-tipo'), date = value('dhv-filter-fecha');
      const rows = dhvFilasCache.filter(({ activo, hoja }) => String(activo.id).includes(id) && String(activo.nombre || '').toLocaleLowerCase('es').includes(name) && String(activo.serial || '').toLocaleLowerCase('es').includes(serial) && String(activo.area || '').toLocaleLowerCase('es').includes(area) && String(activo.tipo || activo.categoria_tipo || '').toLocaleLowerCase('es').includes(type) && (!date || hoja?.fecha_instalacion === date));
      const results = container.querySelector('#dhv-results');
      container.querySelector('#dhv-count').textContent = `Mostrando ${rows.length} de ${dhvFilasCache.length} activos`;
      results.innerHTML = rows.length ? `<table class="data-table"><thead><tr><th>ID</th><th>Activo</th><th>Serial</th><th>&Aacute;rea</th><th>Tipo</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>${rows.map(({ activo, hoja }) => `<tr><td>${escapeHtml(activo.id)}</td><td><strong>${escapeHtml(activo.nombre || 'Sin nombre')}</strong></td><td>${escapeHtml(activo.serial || '-')}</td><td>${escapeHtml(activo.area || '-')}</td><td>${escapeHtml(activo.tipo || activo.categoria_tipo || '-')}</td><td>${hoja?.fecha_instalacion ? escapeHtml(formatFecha(hoja.fecha_instalacion)) : '-'}</td><td><button type="button" class="btn-secondary" onclick="dhvModule.ver(${Number(activo.id)})">Ver hoja de vida</button></td></tr>`).join('')}</tbody></table>` : `<div class="empty-state">${dhvFilasCache.length ? 'No hay activos que coincidan con los filtros.' : 'No hay activos registrados.'}</div>`;
    };
    form.addEventListener('input', draw); form.addEventListener('change', draw); form.addEventListener('reset', () => setTimeout(draw)); draw();
  } catch (error) { container.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`; }
};
window.dhvModule = { ver(id) {
  const item = dhvFilasCache.find(row => Number(row.activo.id) === Number(id)); if (!item) return;
  const { activo: a, hoja: h } = item;
  const field = (label, value) => value === null || value === undefined || value === '' ? '' : `<div class="dhv-detail-item"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`;
  const date = value => value ? formatFecha(value) : null;
  const dateTime = value => { if (!value) return null; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('es-CO'); };
  const person = id => { if (!id) return null; const user = dhvUsuariosCache.find(row => Number(row.id) === Number(id)); return user ? `${user.user} (#${user.id})` : `Usuario #${id}`; };
  const money = value => value === null || value === undefined ? null : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  const group = (title, fields) => { const populated = fields.filter(Boolean); return populated.length ? `<section class="dhv-detail-section"><h4>${title}</h4><div class="dhv-detail-grid">${populated.join('')}</div></section>` : ''; };
  let content = group('Identificaci&oacute;n', [
    field('ID del activo', a.id), field('Nombre', a.nombre), field('Categor&iacute;a', a.categoria_tipo), field('Tipo', a.tipo),
    field('Marca', a.marca), field('Modelo', a.modelo), field('Fabricante', a.fabricante), field('Serial', a.serial), field('Placa', a.placa)
  ]);
  content += group('Ubicaci&oacute;n', [
    field('Sede', a.sede), field('Municipio', a.municipio), field('Ubicaci&oacute;n', a.ubicacion), field('&Aacute;rea', a.area),
    field('Puesto', a.puesto), field('Centro de negocio', a.centro_negocio)
  ]);
  content += group('Caracter&iacute;sticas t&eacute;cnicas', [
    field('Procesador', a.procesador), field('Memoria RAM', a.ram), field('Tipo de RAM', a.tipo_ram), field('Discos', a.discos)
  ]);
  content += group('Compra y control', [
    field('Fecha de compra', date(a.fecha_compra)), field('Valor', money(a.valor)), field('IVA', money(a.iva)),
    field('Valor final', money(a.valor_definitivo)), field('Garant&iacute;a del activo', a.garantia),
    field('Fin de garant&iacute;a del activo', date(a.finalizacion_garantia)), field('Estado del activo', a.estado ? 'Activo' : 'Inactivo'),
    field('Usuario asignado', person(a.id_usuario)), field('Asunto', a.asunto),
    field('Creado', dateTime(a.creado_en)), field('Actualizado', dateTime(a.actualizado_en))
  ]);
  if (h) {
    content += group('Instalaci&oacute;n', [field('Fecha', date(h.fecha_instalacion)), field('Responsable', person(h.responsable_instalacion)), field('Observaciones', h.observaciones_instalacion)]);
    content += group('Garant&iacute;a', [field('Garant&iacute;a', h.garantia), field('Inicio', date(h.inicio_garantia)), field('Finalizaci&oacute;n', date(h.finalizacion_garantia)), field('Proveedor', h.proveedor_garantia), field('Observaciones', h.observaciones_garantia)]);
    content += group('Devoluci&oacute;n', [field('Fecha', date(h.fecha_devolucion)), field('Responsable', person(h.responsable_devolucion)), field('Motivo', h.motivo_devolucion), field('Estado', h.estado_devolucion), field('Observaciones', h.observaciones_devolucion)]);
    content += group('Pr&eacute;stamo', [field('Estado', h.estado_prestamo ? 'Prestado' : 'No prestado'), field('Fecha de pr&eacute;stamo', date(h.fecha_prestamo)), field('Fecha de devoluci&oacute;n', date(h.fecha_devolucion_prestamo)), field('Responsable', person(h.responsable_prestamo)), field('Entregado a', person(h.entregado_a)), field('Observaciones', h.observaciones_prestamo)]);
    content += group('Registro de hoja de vida', [field('ID de hoja de vida', h.id), field('ID del activo vinculado', h.id_activo), field('Creado por', person(h.creado_por)), field('Actualizado por', person(h.actualizado_por)), field('Fecha de creaci&oacute;n', dateTime(h.creado_en)), field('Fecha de actualizaci&oacute;n', dateTime(h.actualizado_en))]);
  } else {
    content += '<p class="dhv-no-record">Este activo aun no tiene una hoja de vida registrada.</p>';
  }
  openCustomModal(`Hoja de vida - ${a.nombre || `Activo #${a.id}`}`, `<div class="dhv-detail-content">${content}</div>`, null, 'Cerrar');
  let editButton = document.getElementById('dhv-edit-record');
  if (h) {
    if (!editButton) {
      editButton = document.createElement('button');
      editButton.id = 'dhv-edit-record';
      editButton.type = 'button';
      editButton.className = 'btn-secondary dhv-edit-record';
      editButton.textContent = 'Editar';
      document.getElementById('modal-cancel').after(editButton);
      editButton.addEventListener('click', () => {
        const assetId = Number(editButton.dataset.assetId);
        editButton.hidden = true;
        window.dhvModule.editar(assetId);
      });
      document.getElementById('modal-cancel').addEventListener('click', () => { editButton.hidden = true; });
      modalOverlay.addEventListener('click', event => { if (event.target === modalOverlay) editButton.hidden = true; });
    }
    editButton.dataset.assetId = String(id);
    editButton.hidden = false;
  } else if (editButton) editButton.hidden = true;
},
async editar(id) {
  const item = dhvFilasCache.find(row => Number(row.activo.id) === Number(id));
  if (!item?.hoja) return;
  const h = item.hoja;
  const input = (key, label, type = 'text', value = h[key] ?? '') => `<div class="field"><label for="dhv-edit-${key}">${label}</label><input id="dhv-edit-${key}" type="${type}" value="${escapeHtml(type === 'date' ? String(value).slice(0, 10) : value)}"></div>`;
  const textarea = (key, label) => `<div class="field full"><label for="dhv-edit-${key}">${label}</label><textarea id="dhv-edit-${key}" rows="3">${escapeHtml(h[key] || '')}</textarea></div>`;
  const userSelect = (key, label) => `<div class="field"><label for="dhv-edit-${key}">${label}</label><select id="dhv-edit-${key}"><option value="">Sin asignar</option>${dhvUsuariosCache.map(user => `<option value="${user.id}" ${Number(h[key]) === Number(user.id) ? 'selected' : ''}>${escapeHtml(user.user)} (#${user.id})</option>`).join('')}</select></div>`;
  const html = `<div class="dhv-edit-form">
    <section class="dhv-edit-section"><h4>Instalaci&oacute;n</h4>${input('fecha_instalacion', 'Fecha', 'date')}${userSelect('responsable_instalacion', 'Responsable')}${textarea('observaciones_instalacion', 'Observaciones')}</section>
    <section class="dhv-edit-section"><h4>Garant&iacute;a</h4>${input('garantia', 'Garant&iacute;a')}${input('inicio_garantia', 'Inicio', 'date')}${input('finalizacion_garantia', 'Finalizaci&oacute;n', 'date')}${input('proveedor_garantia', 'Proveedor')}${textarea('observaciones_garantia', 'Observaciones')}</section>
    <section class="dhv-edit-section"><h4>Devoluci&oacute;n</h4>${input('fecha_devolucion', 'Fecha', 'date')}${userSelect('responsable_devolucion', 'Responsable')}${input('motivo_devolucion', 'Motivo')}${input('estado_devolucion', 'Estado')}${textarea('observaciones_devolucion', 'Observaciones')}</section>
    <section class="dhv-edit-section"><h4>Pr&eacute;stamo</h4><label class="checkbox-field"><input id="dhv-edit-estado_prestamo" type="checkbox" ${h.estado_prestamo ? 'checked' : ''}>Activo en pr&eacute;stamo</label>${input('fecha_prestamo', 'Fecha de pr&eacute;stamo', 'date')}${input('fecha_devolucion_prestamo', 'Fecha de devoluci&oacute;n', 'date')}${userSelect('responsable_prestamo', 'Responsable')}${userSelect('entregado_a', 'Entregado a')}${textarea('observaciones_prestamo', 'Observaciones')}</section>
  </div>`;
  openCustomModal(`Editar hoja de vida - ${item.activo.nombre || `Activo #${id}`}`, html, async () => {
    const value = key => document.getElementById(`dhv-edit-${key}`).value.trim() || null;
    const personId = key => value(key) ? Number(value(key)) : null;
    const payload = {
      fecha_instalacion: value('fecha_instalacion'), responsable_instalacion: personId('responsable_instalacion'), observaciones_instalacion: value('observaciones_instalacion'),
      garantia: value('garantia'), inicio_garantia: value('inicio_garantia'), finalizacion_garantia: value('finalizacion_garantia'), proveedor_garantia: value('proveedor_garantia'), observaciones_garantia: value('observaciones_garantia'),
      fecha_devolucion: value('fecha_devolucion'), responsable_devolucion: personId('responsable_devolucion'), motivo_devolucion: value('motivo_devolucion'), estado_devolucion: value('estado_devolucion'), observaciones_devolucion: value('observaciones_devolucion'),
      estado_prestamo: document.getElementById('dhv-edit-estado_prestamo').checked, fecha_prestamo: value('fecha_prestamo'), fecha_devolucion_prestamo: value('fecha_devolucion_prestamo'), responsable_prestamo: personId('responsable_prestamo'), entregado_a: personId('entregado_a'), observaciones_prestamo: value('observaciones_prestamo')
    };
    const response = await fetch(`${API_BASE}/dhv/${h.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(payload) });
    if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.error || 'No se pudo actualizar la hoja de vida.'); }
    closeModal();
    await loadView('dhv');
  }, 'Guardar cambios');
} };


// Filtros independientes para los listados estandar de activos y usuarios.
function renderFilteredRecords(container, rows, filters, title) {
  const id = `record-filters-${title.toLowerCase()}`;
  container.innerHTML = `<div class="record-view-stack">
    <section class="record-filter-card" aria-labelledby="${id}-heading">
      <div class="dhv-section-heading"><span class="material-symbols-outlined dhv-heading-icon">manage_search</span><div><h3 id="${id}-heading">Filtrar ${title.toLowerCase()}</h3><p>Busca registros por sus datos principales.</p></div></div>
      <form class="record-filters dhv-filters" id="${id}">${filters.map((filter, index) => {
        const controlId = `${id}-${index}`;
        if (filter.options) return `<div class="dhv-filter-field"><label for="${controlId}">${filter.label}</label><select id="${controlId}" data-filter="${index}"><option value="">Todos</option>${filter.options.map(option => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join('')}</select></div>`;
        return `<div class="dhv-filter-field"><label for="${controlId}">${filter.label}</label><input id="${controlId}" data-filter="${index}" type="${filter.type || 'search'}" placeholder="${escapeHtml(filter.placeholder || filter.label)}"></div>`;
      }).join('')}<div class="dhv-filter-actions"><button class="btn-secondary dhv-clear" type="reset"><span class="material-symbols-outlined">restart_alt</span>Limpiar filtros</button></div></form>
    </section>
    <section class="record-table-card dhv-table-card" aria-label="Resultados de ${title.toLowerCase()}">
      <div class="dhv-table-heading"><div><h3>${title} registrados</h3><p id="${id}-count" aria-live="polite"></p></div></div>
      <div class="dhv-table-wrap" id="${id}-results"></div>
    </section>
  </div>`;
  const form = container.querySelector(`#${id}`);
  const draw = () => {
    const visible = rows.filter(row => filters.every((filter, index) => {
      const field = form.querySelector(`[data-filter="${index}"]`);
      const value = field.value.trim();
      if (!value) return true;
      const raw = filter.get ? filter.get(row) : row[filter.key];
      if (filter.type === 'select') return String(raw) === value;
      return String(raw ?? '').toLocaleLowerCase('es').includes(value.toLocaleLowerCase('es'));
    }));
    container.querySelector(`#${id}-count`).textContent = `Mostrando ${visible.length} de ${rows.length} registros`;
    container.querySelector(`#${id}-results`).innerHTML = renderTable(visible, title === 'Activos' ? activosView.columns : usuariosView.columns);
  };
  form.addEventListener('input', draw);
  form.addEventListener('change', draw);
  form.addEventListener('reset', () => setTimeout(draw));
  draw();
}

activosView.render = async function (container) {
  container.innerHTML = '<div class="empty-state">Cargando activos...</div>';
  try {
    const res = await fetch(`${API_BASE}${this.endpoint}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (res.status === 401) { clearToken(); showLogin(); return; }
    if (!res.ok) throw new Error('No se pudieron cargar los activos.');
    const rows = await res.json();
    renderFilteredRecords(container, rows, [
      { key: 'id', label: 'ID' }, { key: 'nombre', label: 'Activo' },
      { label: 'Tipo', get: row => row.tipo || row.categoria_tipo }, { key: 'serial', label: 'Serial' },
      { key: 'area', label: 'Area' }, { key: 'sede', label: 'Sede' },
      { label: 'Estado', type: 'select', options: [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }], get: row => String(Boolean(row.estado)) },
      { key: 'creado_en', label: 'Creado', type: 'date' }
    ], 'Activos');
  } catch (error) { container.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`; }
};

usuariosView.render = async function (container) {
  container.innerHTML = '<div class="empty-state">Cargando usuarios...</div>';
  try {
    const res = await fetch(`${API_BASE}${this.endpoint}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (res.status === 401) { clearToken(); showLogin(); return; }
    if (!res.ok) throw new Error('No se pudieron cargar los usuarios.');
    const rows = await res.json();
    const roles = [...new Set(rows.map(row => row.rol).filter(Boolean))].sort();
    renderFilteredRecords(container, rows, [
      { key: 'id', label: 'ID' }, { key: 'user', label: 'Usuario' },
      { key: 'rol', label: 'Rol', type: 'select', options: roles.map(role => ({ value: role, label: role })) },
      { key: 'id_activo', label: 'Activo asignado' },
      { label: 'Estado', type: 'select', options: [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }], get: row => String(Boolean(row.estado)) },
      { key: 'creado_en', label: 'Creado', type: 'date' }
    ], 'Usuarios');
  } catch (error) { container.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`; }
};
