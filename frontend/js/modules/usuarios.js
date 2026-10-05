/* ============================================================
   FixCase — Módulo: Usuarios
   ============================================================ */

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
    { key: 'creado_en', label: 'Creado', render: formatFecha },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_, row) => `
        <button type="button" class="btn-secondary" onclick="editarUsuario(${row.id})" style="padding: 4px 8px; font-size: 12px; margin-right: 4px;">
          <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">edit</span> Editar
        </button>
        <button type="button" class="btn-secondary" onclick="toggleEstadoUsuario(${row.id}, ${row.estado})" style="padding: 4px 8px; font-size: 12px; color: ${row.estado ? 'var(--warn)' : '#2E8B57'};">
          <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">${row.estado ? 'block' : 'check_circle'}</span>
          ${row.estado ? 'Inactivar' : 'Activar'}
        </button>
      `
    }
  ],

  createFields: [
    { key: 'user', label: 'Usuario', type: 'text', required: true, full: true },
    { key: 'clave', label: 'Contraseña (dejar en blanco para mantener actual)', type: 'password', full: true },
    {
      key: 'rol',
      label: 'Rol',
      type: 'select',
      required: true,
      options: [
        { value: 'Administrador', label: 'Administrador' },
        { value: 'Técnico', label: 'Técnico' }
      ]
    }
  ]
};

// ============================================================
// FUNCIONES DE EDICIÓN E INACTIVACIÓN
// ============================================================

// Alternar entre Activo e Inactivo
async function toggleEstadoUsuario(id, estadoActual) {
  const accion = estadoActual ? 'inactivar' : 'activar';
  if (!confirm(`¿Estás seguro de que deseas ${accion} este usuario?`)) return;

  try {
    const res = await fetch(`${API_BASE}/usuarios/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ estado: !estadoActual })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo cambiar el estado.');

    // Recargar la tabla de usuarios
    if (typeof loadView === 'function') {
      loadView('usuarios');
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

// Cargar datos y abrir modal de edición
async function editarUsuario(id) {
  try {
    const res = await fetch(`${API_BASE}/usuarios/${id}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) throw new Error('No se pudo obtener la información del usuario.');
    const usuario = await res.json();

    // Abrir modal con los campos del usuario
    if (typeof openModal === 'function') {
      openModal('Editar Usuario', usuariosView.createFields, usuario, async (formData) => {
        const updateRes = await fetch(`${API_BASE}/usuarios/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify(formData)
        });

        const updateData = await updateRes.json();
        if (!updateRes.ok || !updateData.ok) {
          throw new Error(updateData.error || 'No se pudieron guardar los cambios.');
        }

        if (typeof loadView === 'function') {
          loadView('usuarios');
        }
      });
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}