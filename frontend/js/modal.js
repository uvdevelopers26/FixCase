// ---------- Elementos del modal ----------
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalFields = document.getElementById('modal-fields');
const modalForm = document.getElementById('modal-form');
const modalError = document.getElementById('modal-error');
const modalSubmit = document.getElementById('modal-submit');
const btnNew = document.getElementById('btn-new');

/**
 * Construye el HTML de un campo del formulario según su tipo.
 * Se añadió soporte para IDs específicos y clases de ancho completo.
 */
function renderField(f) {
  if (f.type === 'checkbox') {
    return `
      <label class="checkbox-field">
        <input type="checkbox" id="f-${f.key}" name="${f.key}" ${f.default ? 'checked' : ''}>
        ${f.label}
      </label>`;
  }

  if (f.type === 'select') {
    const options = f.options.map(o =>
      `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`
    ).join('');
    return `
      <div class="field ${f.full ? 'full' : ''}">
        <label for="f-${f.key}">${f.label}</label>
        <select id="f-${f.key}" name="${f.key}" ${f.required ? 'required' : ''}>
          <option value="" disabled selected>Selecciona...</option>
          ${options}
        </select>
      </div>`;
  }

  return `
    <div class="field ${f.full ? 'full' : ''}">
      <label for="f-${f.key}">${f.label}</label>
      <input type="${f.type}" id="f-${f.key}" name="${f.key}" ${f.required ? 'required' : ''}>
    </div>`;
}

/**
 * Abre el modal y configura los eventos de cambio dinámicos (onChange).
 */
function openModal(viewKey) {
  const view = VIEWS[viewKey];
  if (!view || !view.createFields) return;

  modalTitle.textContent = `Nuevo ${view.title.replace(/s$/, '')}`;
  modalError.style.display = 'none';
  modalForm.reset();
  modalSubmit.style.display = 'block'; // Asegurar que el botón se vea

  // 1. Renderizar campos
  modalFields.innerHTML = view.createFields.map(renderField).join('');

  // 2. Asignar eventos onChange si existen en la definición del módulo
  view.createFields.forEach(f => {
    if (f.onChange) {
      const el = document.getElementById(`f-${f.key}`);
      if (el) {
        el.addEventListener('change', (e) => f.onChange(e.target.value));
      }
    }
  });

  modalOverlay.classList.add('open');
}

function closeModal() {
  modalOverlay.classList.remove('open');
  modalSubmit.style.display = 'block'; 
  modalError.style.display = 'none';
}

// Eventos de interfaz
btnNew.addEventListener('click', () => openModal(currentViewKey));
document.getElementById('modal-cancel').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

/**
 * Envío del formulario: Crea el registro e intercepta si es una Tarea
 * para abrir el checklist automáticamente.
 */
modalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const view = VIEWS[currentViewKey];
  modalError.style.display = 'none';
  modalSubmit.disabled = true;
  modalSubmit.textContent = 'Guardando...';

  const formData = new FormData(modalForm);
  const payload = {};
  
  view.createFields.forEach(f => {
    const value = formData.get(f.key);
    if (f.type === 'checkbox') {
      payload[f.key] = formData.has(f.key);
    } else if (f.type === 'number') {
      payload[f.key] = value === '' ? null : Number(value);
    } else {
      payload[f.key] = value === '' ? null : value;
    }
  });

  try {
    // 1. Guardar en el Backend
    const res = await fetch(`${API_BASE}${view.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      if (res.status === 401) { clearToken(); showLogin(); return; }
      const body = await res.json().catch(() => null);
      throw new Error(body?.detail ? JSON.stringify(body.detail) : 'No se pudo guardar el registro.');
    }

    const dataGuardada = await res.json();

    // 2. Capturar datos para el auto-checklist ANTES de cerrar
    const perfil = document.getElementById('f-asunto_grupo')?.value;
    const mantenimiento = document.getElementById('f-categoria_mantenimiento')?.value;

    // 3. Cerrar y refrescar tabla
    closeModal();
    loadView(currentViewKey);

    // 4. LÓGICA PROACTIVA: Si es tarea, abrir checklist automáticamente
    if (currentViewKey === 'tareas' && perfil && mantenimiento) {
      if (window.checklistsModule) {
        checklistsModule.iniciarAutomatico(dataGuardada.id, perfil, mantenimiento);
      }
    }

  } catch (err) {
    modalError.textContent = err.message;
    modalError.style.display = 'block';
  } finally {
    modalSubmit.disabled = false;
    modalSubmit.textContent = 'Guardar';
  }
});