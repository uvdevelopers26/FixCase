/* ============================================================
   FixCase — Módulo: Usuarios
   ============================================================ */

// ============================================================
// OPCIONES DINÁMICAS Y CAMPOS DEL FORMULARIO
// ============================================================

// Opciones del select "Activo asignado" (se llenan desde la API)
const activosOptions = [{ value: '', label: 'Sin asignar' }];

const rolOptions = [
  { value: 'Administrador', label: 'Administrador' },
  { value: 'Técnico', label: 'Técnico' }
];

// Campos que no cambian entre crear y editar
const camposUsuario = {
  user:      { key: 'user', label: 'Usuario', type: 'text', required: true, maxlength: 50 },
  rol:       { key: 'rol', label: 'Rol', type: 'select', required: true, options: rolOptions },
  nombres:   { key: 'nombres', label: 'Nombres', type: 'text', maxlength: 100 },
  apellidos: { key: 'apellidos', label: 'Apellidos', type: 'text', maxlength: 100 },
  email:     { key: 'email', label: 'Email', type: 'email', maxlength: 150 },
  telefono:  { key: 'telefono', label: 'Teléfono', type: 'tel', maxlength: 30 },
  cargo:     { key: 'cargo', label: 'Cargo', type: 'text', maxlength: 100 },
  id_activo: { key: 'id_activo', label: 'Activo asignado', type: 'select', options: activosOptions }
};

// Crear: la contraseña es obligatoria
const camposCrearUsuario = [
  camposUsuario.user,
  { key: 'clave', label: 'Contraseña', type: 'password', required: true, full: true },
  camposUsuario.rol,
  camposUsuario.nombres,
  camposUsuario.apellidos,
  camposUsuario.email,
  camposUsuario.telefono,
  camposUsuario.cargo,
  camposUsuario.id_activo
];

// Editar: la contraseña es opcional (en blanco = mantener la actual)
const camposEditarUsuario = [
  camposUsuario.user,
  { key: 'clave', label: 'Contraseña (dejar en blanco para mantener actual)', type: 'password', full: true },
  camposUsuario.rol,
  camposUsuario.nombres,
  camposUsuario.apellidos,
  camposUsuario.email,
  camposUsuario.telefono,
  camposUsuario.cargo,
  camposUsuario.id_activo
];

// ============================================================
// DEFINICIÓN DE LA VISTA
// ============================================================

const usuariosView = {
  title: 'Usuarios',
  sub: 'Listado de usuarios registrados en el sistema.',
  endpoint: '/usuarios/',

  columns: [
    { key: 'id', label: 'ID' },
    { key: 'user', label: 'Usuario' },
    { key: 'rol', label: 'Rol' },
    { key: 'id_activo', label: 'Activo asignado', render: (val) => val ?? '—' },
    {
      key: 'estado',
      label: 'Estado',
      render: (val) => `
        <span class="badge ${val ? 'on' : 'off'}">
          ${val ? 'Activo' : 'Inactivo'}
        </span>
      `
    },
    { key: 'creado_en', label: 'Creado', render: typeof formatFecha === 'function' ? formatFecha : (val) => val || '—' },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_, row) => {
        if (!row || typeof row.id === 'undefined') return '—';
        const id = row.id;
        const estado = row.estado === true || row.estado === 1;

        return `
          <button type="button" class="btn-secondary" onclick="editarUsuario(${id})" style="padding: 4px 8px; font-size: 12px; margin-right: 4px;">
            <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">edit</span> Editar
          </button>
          <button type="button" class="btn-secondary" onclick="toggleEstadoUsuario(${id}, ${estado})" style="padding: 4px 8px; font-size: 12px; color: ${estado ? 'var(--warn)' : '#2E8B57'};">
            <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">${estado ? 'block' : 'check_circle'}</span>
            ${estado ? 'Inactivar' : 'Activar'}
          </button>
        `;
      }
    }
  ],

  // Formulario de "+ Nuevo"
  createFields: camposCrearUsuario,

  // Formulario de "Editar"
  editFields: camposEditarUsuario
};

// ============================================================
// HELPERS
// ============================================================

// Carga los activos disponibles en el select "Activo asignado"
async function cargarActivosOpciones() {
  try {
    const res = await fetch(`${API_BASE}/activos/`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!res.ok) return;

    const json = await res.json();
    const lista = Array.isArray(json) ? json : (json.data || []);

    // Se modifica el mismo arreglo para que los formularios lo vean actualizado
    activosOptions.length = 0;
    activosOptions.push({ value: '', label: 'Sin asignar' });
    lista.forEach((a) => activosOptions.push({
      value: a.id,
      label: a.nombre || a.codigo || `Activo ${a.id}` // ajusta al nombre real del campo
    }));
  } catch (_) {
    // Si falla, el select queda solo con "Sin asignar"
  }
}

// Convierte '' en null y no envía la clave si viene vacía
function limpiarPayloadUsuario(formData) {
  const out = {};
  for (const [k, v] of Object.entries(formData)) {
    const val = typeof v === 'string' ? v.trim() : v;
    out[k] = val === '' ? null : val;
  }
  if (!out.clave) delete out.clave; // mantener la contraseña actual
  if (out.id_activo != null) out.id_activo = Number(out.id_activo);
  return out;
}

// ============================================================
// CREACIÓN
// ============================================================

// Abre el modal de "Nuevo Usuario".
// Si tu app ya abre el modal de creación con createFields desde el botón "+ Nuevo",
// puedes ignorar esta función y usar limpiarPayloadUsuario en ese submit.
async function nuevoUsuario() {
  try {
    await cargarActivosOpciones();

    if (typeof openModal !== 'function') {
      return alert('La función modal (openModal) no está disponible.');
    }

    openModal({
      title: 'Nuevo Usuario',
      fields: usuariosView.createFields,
      data: {},
      onSubmit: async (formData) => {
        const res = await fetch(`${API_BASE}/usuarios/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify(limpiarPayloadUsuario(formData))
        });

        const data = await res.json();
        if (!res.ok || (data.ok !== undefined && !data.ok)) {
          throw new Error(data.error || 'No se pudo crear el usuario.');
        }

        if (typeof loadView === 'function') loadView('usuarios');
      }
    });
  } catch (err) {
    alert(`Error al abrir creación: ${err.message}`);
  }
}

// ============================================================
// FUNCIONES DE EDICIÓN E INACTIVACIÓN
// ============================================================

// Alternar estado Activo / Inactivo
async function toggleEstadoUsuario(id, estadoActual) {
  const nuevoEstado = !estadoActual;
  const accion = estadoActual ? 'inactivar' : 'activar';

  if (!confirm(`¿Estás seguro de que deseas ${accion} este usuario?`)) return;

  try {
    const res = await fetch(`${API_BASE}/usuarios/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    const data = await res.json();

    if (!res.ok || (data.ok !== undefined && !data.ok)) {
      throw new Error(data.error || `No se pudo ${accion} el usuario.`);
    }

    // Recargar la vista actual
    if (typeof loadView === 'function') {
      loadView('usuarios');
    }
  } catch (err) {
    alert(`Error al cambiar estado: ${err.message}`);
  }
}

// Cargar y abrir modal de edición
async function editarUsuario(id) {
  try {
    await cargarActivosOpciones();

    const res = await fetch(`${API_BASE}/usuarios/${id}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!res.ok) throw new Error('No se pudieron obtener los datos del usuario.');

    const usuario = await res.json();
    delete usuario.clave; // nunca precargar el hash en el formulario

    if (typeof openModal !== 'function') {
      return alert('La función modal (openModal) no está disponible.');
    }

    openModal({
      title: 'Editar Usuario',
      fields: usuariosView.editFields,
      data: usuario,
      onSubmit: async (formData) => {
        const updateRes = await fetch(`${API_BASE}/usuarios/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify(limpiarPayloadUsuario(formData))
        });

        const updateData = await updateRes.json();
        if (!updateRes.ok || (updateData.ok !== undefined && !updateData.ok)) {
          throw new Error(updateData.error || 'No se pudieron guardar los cambios.');
        }

        if (typeof loadView === 'function') {
          loadView('usuarios');
        }
      }
    });
  } catch (err) {
    alert(`Error al abrir edición: ${err.message}`);
  }
}

// Precarga los activos para que el botón "+ Nuevo" ya los tenga disponibles
cargarActivosOpciones();