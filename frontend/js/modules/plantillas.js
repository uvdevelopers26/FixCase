// Valores que usa la pantalla de Tareas para buscar la plantilla (buscar-match).
// Deben coincidir exactamente con los de tareas.js y con la tabla checklist_plantillas.
const PLANTILLA_MANTENIMIENTOS = [
  { value: 'Preventivo', label: 'Preventivo' },
  { value: 'Correctivo', label: 'Correctivo' },
  { value: 'Reinstalacion', label: 'Reinstalación / Cambio' }
];

const PLANTILLA_PERFILES = [
  { value: 'PC', label: 'PC (genérico: todo en uno y portátil)' },
  { value: 'AIO', label: 'Todo en Uno' },
  { value: 'PORTATIL', label: 'Portátil / Laptop' },
  { value: 'IMPRESORA', label: 'Impresora' },
  { value: 'SOFTWARE', label: 'Software / Aplicativo' },
  { value: 'TELEVISOR', label: 'Televisor' }
];

function plantillaEtiqueta(lista, value) {
  const found = lista.find(o => o.value === value);
  return found ? found.label : (value || '');
}

// Construye las <option>; si el valor guardado es antiguo (no está en la lista) lo conserva
function plantillaOpciones(lista, actual, vacio) {
  const opciones = [...lista];
  if (actual && !opciones.some(o => o.value === actual)) {
    opciones.push({ value: actual, label: `${actual} (valor anterior)` });
  }
  const vacia = vacio ? `<option value="">${escapeHtml(vacio)}</option>` : '';
  return vacia + opciones.map(o =>
    `<option value="${escapeHtml(o.value)}" ${o.value === actual ? 'selected' : ''}>${escapeHtml(o.label)}</option>`
  ).join('');
}

const plantillasView = {
  title: 'Plantillas de Checklist',
  sub: 'Modelos reutilizables para los mantenimientos de tus activos.',
  endpoint: '/checklists/plantillas',
  createFields: [],
  newLabel: '+ Nueva plantilla',
  openNew: () => plantillasModule.openEditor(),

  render: async function (container) {
    container.innerHTML = `
      <section class="templates-browser">
        <div class="template-filters">
          <label class="templates-search-wrap">
            <span class="material-symbols-outlined">search</span>
            <input class="templates-search" id="templates-search" type="search" placeholder="Buscar por nombre, perfil o descripción">
          </label>
          <select id="templates-maint"><option value="">Todos los mantenimientos</option></select>
          <select id="templates-profile"><option value="">Todos los perfiles</option></select>
        </div>
        <p class="templates-count" id="templates-count" aria-live="polite"></p>
        <div class="templates-grid" id="templates-grid"><div class="empty-state">Cargando plantillas...</div></div>
      </section>`;

    const grid = container.querySelector('#templates-grid');
    const search = container.querySelector('#templates-search');
    const maint = container.querySelector('#templates-maint');
    const profile = container.querySelector('#templates-profile');
    const count = container.querySelector('#templates-count');

    try {
      const templates = await checklistRequest(`${API_BASE}${this.endpoint}`);

      const unicos = (campo) => [...new Set(templates.map(t => t[campo]).filter(Boolean))].sort();
      unicos('categoria_mantenimiento').forEach(v =>
        maint.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(v)}">${escapeHtml(plantillaEtiqueta(PLANTILLA_MANTENIMIENTOS, v))}</option>`));
      unicos('perfil_activo').forEach(v =>
        profile.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(v)}">${escapeHtml(plantillaEtiqueta(PLANTILLA_PERFILES, v))}</option>`));

      const card = (t) => {
        const n = t.items?.length || 0;
        return `
        <article class="template-card">
          <div class="template-card-top">
            <span class="template-card-icon material-symbols-outlined">fact_check</span>
            <span class="template-item-count">${n} ${n === 1 ? 'punto' : 'puntos'}</span>
            <details class="action-menu">
              <summary aria-label="Acciones de plantilla">⋯</summary>
              <div>
                <button onclick="plantillasModule.view(${t.id})">Ver plantilla</button>
                <button onclick="plantillasModule.openEditor(${t.id})">Editar</button>
                <button onclick="plantillasModule.duplicate(${t.id})">Duplicar</button>
                ${checklistIsAdmin() ? `<button class="danger-action" onclick="plantillasModule.remove(${t.id})">Eliminar</button>` : ''}
              </div>
            </details>
          </div>
          <h3>${escapeHtml(t.nombre)}</h3>
          <p class="template-description">${escapeHtml(t.descripcion || 'Sin descripción.')}</p>
          <div class="template-tags">
            <span class="template-tag"><span class="material-symbols-outlined">build</span>${escapeHtml(plantillaEtiqueta(PLANTILLA_MANTENIMIENTOS, t.categoria_mantenimiento) || 'Sin tipo')}</span>
            <span class="template-tag"><span class="material-symbols-outlined">category</span>${escapeHtml(plantillaEtiqueta(PLANTILLA_PERFILES, t.perfil_activo) || 'Sin perfil')}</span>
            ${t.estado === false ? '<span class="template-tag"><span class="material-symbols-outlined">pause_circle</span>Inactiva</span>' : ''}
          </div>
          <button class="btn-new template-use" type="button" onclick="plantillasModule.use(${t.id})">
            <span class="material-symbols-outlined">add_task</span> Usar plantilla
          </button>
        </article>`;
      };

      const draw = () => {
        const q = search.value.trim().toLocaleLowerCase('es');
        const filtered = templates.filter(t =>
          [t.nombre, t.categoria_mantenimiento, t.perfil_activo, t.descripcion]
            .some(v => String(v || '').toLocaleLowerCase('es').includes(q)) &&
          (!maint.value || t.categoria_mantenimiento === maint.value) &&
          (!profile.value || t.perfil_activo === profile.value)
        );
        count.textContent = `${filtered.length} de ${templates.length} plantillas`;
        grid.innerHTML = filtered.length
          ? filtered.map(card).join('')
          : `<div class="templates-empty">
               <span class="material-symbols-outlined">${templates.length ? 'search_off' : 'inventory_2'}</span>
               <strong>${templates.length ? 'No hay coincidencias' : 'Aún no hay plantillas'}</strong>
               <span>${templates.length ? 'Cambia la búsqueda o los filtros.' : 'Crea una plantilla para empezar.'}</span>
             </div>`;
      };

      search.addEventListener('input', draw);
      maint.addEventListener('change', draw);
      profile.addEventListener('change', draw);
      draw();
    } catch (e) {
      grid.innerHTML = `<div class="empty-state">${escapeHtml(e.message)}</div>`;
    }
  }
};

const plantillasModule = {
  view: async function (id) {
    try {
      const t = await checklistRequest(`${API_BASE}/checklists/plantillas/${id}`);
      const items = t.items || [];
      openCustomModal(
        t.nombre,
        `<div class="template-view">
           <section class="template-view-summary">
             <div class="template-view-icon"><span class="material-symbols-outlined">fact_check</span></div>
             <div class="template-view-intro"><span class="template-view-eyebrow">Plantilla de checklist</span><p>${escapeHtml(t.descripcion || 'Esta plantilla organiza los puntos de revisión para realizar el mantenimiento.')}</p></div>
           </section>
           <section class="template-view-meta" aria-label="Detalles de la plantilla">
             <div class="template-view-meta-item"><span class="material-symbols-outlined">build</span><div><small>Tipo de mantenimiento</small><strong>${escapeHtml(plantillaEtiqueta(PLANTILLA_MANTENIMIENTOS, t.categoria_mantenimiento) || 'Sin tipo')}</strong></div></div>
             <div class="template-view-meta-item"><span class="material-symbols-outlined">category</span><div><small>Perfil de activo</small><strong>${escapeHtml(plantillaEtiqueta(PLANTILLA_PERFILES, t.perfil_activo) || 'Sin perfil')}</strong></div></div>
             <div class="template-view-meta-item"><span class="material-symbols-outlined">${t.estado === false ? 'pause_circle' : 'check_circle'}</span><div><small>Estado</small><strong>${t.estado === false ? 'Inactiva' : 'Activa'}</strong></div></div>
           </section>
           <section class="template-view-points">
             <div class="template-view-points-heading"><div><span class="template-view-eyebrow">Contenido</span><h4>Puntos de revisión</h4></div><span class="template-view-count">${items.length} ${items.length === 1 ? 'punto' : 'puntos'}</span></div>
             ${items.length ? `<ol class="template-view-list">${items.map((item, index) => `<li><span class="template-view-number">${String(index + 1).padStart(2, '0')}</span><span class="template-view-point-text">${escapeHtml(item.texto)}</span><span class="material-symbols-outlined template-view-point-icon">task_alt</span></li>`).join('')}</ol>` : '<div class="template-view-empty"><span class="material-symbols-outlined">playlist_add</span><span>Esta plantilla todavía no tiene puntos de revisión.</span></div>'}
           </section>
         </div>`,
        null,
        'Cerrar'
      );
    } catch (e) { alert(e.message); }
  },

  use: async function (id) {
    try {
      const t = await checklistRequest(`${API_BASE}/checklists/plantillas/${id}`);
      checklistsModule.openCreate(t);
    } catch (e) { alert(e.message); }
  },

  openEditor: async function (id = null, seed = null) {
    try {
      const t = seed || (id
        ? await checklistRequest(`${API_BASE}/checklists/plantillas/${id}`)
        : { nombre: '', descripcion: '', categoria_mantenimiento: 'Preventivo', perfil_activo: 'PC', estado: true, items: [] });

      let items = (t.items || []).map(i => i.texto);

      // Pasa lo escrito en los inputs al arreglo antes de redibujar
      const syncItems = () => {
        document.querySelectorAll('[data-point]').forEach(input => { items[Number(input.dataset.point)] = input.value; });
      };

      const drawItems = () => `
        <div class="template-editor-items" id="template-editor-items">
          ${items.map((text, i) => `
            <div class="template-point-row">
              <span class="template-point-number">${i + 1}</span>
              <input type="text" data-point="${i}" value="${escapeHtml(text)}" aria-label="Punto ${i + 1}">
              <button type="button" title="Subir" onclick="plantillasModule.move(${i},-1)">↑</button>
              <button type="button" title="Bajar" onclick="plantillasModule.move(${i},1)">↓</button>
              <button type="button" class="danger-action" title="Eliminar" onclick="plantillasModule.removePoint(${i})">×</button>
            </div>`).join('')}
          <button type="button" class="btn-secondary" onclick="plantillasModule.addPoint()">+ Agregar punto</button>
        </div>`;

      const redraw = () => {
        const el = document.getElementById('template-editor-items');
        if (el) el.outerHTML = drawItems();
      };

      // Los botones del editor operan siempre sobre los puntos de la plantilla abierta
      plantillasModule.addPoint = function () {
        syncItems();
        items.push('');
        redraw();
        const inputs = document.querySelectorAll('[data-point]');
        inputs[inputs.length - 1]?.focus();
      };
      plantillasModule.removePoint = function (i) {
        syncItems();
        items.splice(i, 1);
        redraw();
      };
      plantillasModule.move = function (i, delta) {
        syncItems();
        const j = i + delta;
        if (j < 0 || j >= items.length) return;
        [items[i], items[j]] = [items[j], items[i]];
        redraw();
      };

      openCustomModal(
        id ? 'Editar plantilla' : 'Nueva plantilla',
        `<div class="field full">
           <label for="template-name">Nombre</label>
           <input id="template-name" required value="${escapeHtml(t.nombre)}">
         </div>
         <div class="field">
           <label for="template-maint">Tipo de mantenimiento</label>
           <select id="template-maint">${plantillaOpciones(PLANTILLA_MANTENIMIENTOS, t.categoria_mantenimiento, 'Selecciona...')}</select>
         </div>
         <div class="field">
           <label for="template-profile">Perfil de equipo</label>
           <select id="template-profile">${plantillaOpciones(PLANTILLA_PERFILES, t.perfil_activo, 'Selecciona...')}</select>
         </div>
         <div class="field full">
           <label for="template-description">Descripción</label>
           <textarea id="template-description" rows="3">${escapeHtml(t.descripcion || '')}</textarea>
         </div>
         <div class="field full template-active-field">
           <label class="template-active-toggle" for="template-active">
             <span class="template-active-copy"><strong>Plantilla activa</strong><small>Solo las activas se usan al crear tareas.</small></span>
             <input type="checkbox" id="template-active" ${t.estado === false ? '' : 'checked'}>
           </label>
         </div>
         <div class="field full">
           <label>Puntos de revisión</label>${drawItems()}
         </div>`,
        async () => {
          syncItems();
          const payload = {
            nombre: document.getElementById('template-name').value.trim(),
            categoria_mantenimiento: document.getElementById('template-maint').value || null,
            perfil_activo: document.getElementById('template-profile').value || null,
            descripcion: document.getElementById('template-description').value.trim(),
            estado: document.getElementById('template-active').checked,
            items: items.map(x => x.trim()).filter(Boolean).map((texto, orden) => ({ texto, orden: orden + 1 }))
          };

          if (!payload.nombre) throw new Error('Escribe el nombre de la plantilla.');
          if (!payload.categoria_mantenimiento) throw new Error('Selecciona el tipo de mantenimiento.');
          if (!payload.perfil_activo) throw new Error('Selecciona el perfil de equipo.');
          if (!payload.items.length) throw new Error('Agrega al menos un punto de revisión.');

          // Aviso de duplicados: buscar-match solo usa la primera plantilla activa de cada combinación
          if (payload.estado) {
            const todas = await checklistRequest(`${API_BASE}/checklists/plantillas`);
            const choque = todas.find(p =>
              p.id !== id && p.estado !== false &&
              p.perfil_activo === payload.perfil_activo &&
              p.categoria_mantenimiento === payload.categoria_mantenimiento);
            if (choque && !confirm(`Ya existe una plantilla activa para esta combinación: "${choque.nombre}".\n\nAl crear una tarea solo se usará una de las dos. ¿Guardar de todos modos?`)) {
              return;
            }
          }

          await checklistRequest(`${API_BASE}/checklists/plantillas${id ? `/${id}` : ''}`, {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
          });
          closeModal();
          loadView('plantillas');
        }
      );
    } catch (e) { alert(e.message); }
  },

  // Se reemplazan al abrir el editor
  addPoint: function () {},
  removePoint: function () {},
  move: function () {},

  duplicate: async function (id) {
    try {
      const t = await checklistRequest(`${API_BASE}/checklists/plantillas/${id}`);
      this.openEditor(null, { ...t, nombre: `${t.nombre} (copia)`, items: (t.items || []).map(i => ({ ...i })) });
    } catch (e) { alert(e.message); }
  },

  remove: async function (id) {
    if (!checklistIsAdmin() || !confirm('¿Eliminar esta plantilla? Los checklists ya creados conservan sus puntos.')) return;
    try {
      await checklistRequest(`${API_BASE}/checklists/plantillas/${id}`, { method: 'DELETE' });
      loadView('plantillas');
    } catch (e) { alert(e.message); }
  }
};

window.plantillasModule = plantillasModule;
