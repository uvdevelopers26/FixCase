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
    const res = await fetch(`${API_BASE}/usuarios/${id}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!res.ok) throw new Error('No se pudieron obtener los datos del usuario.');

    const usuario = await res.json();

    // Si tu sistema utiliza openModal para renderizar formularios dinámicos
    if (typeof openModal === 'function') {
      openModal({
        title: 'Editar Usuario',
        fields: usuariosView.createFields,
        data: usuario,
        onSubmit: async (formData) => {
          const updateRes = await fetch(`${API_BASE}/usuarios/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(formData)
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
    } else {
      alert('La función modal (openModal) no está disponible.');
    }
  } catch (err) {
    alert(`Error al abrir edición: ${err.message}`);
  }
}