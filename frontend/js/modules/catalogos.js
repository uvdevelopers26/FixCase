/* ============================================================
   FixCase — Módulo: Catálogos
   Categoría, Marca, Área, Sede y Puesto
   ============================================================ */

// ============================================================
// CONFIGURACIÓN DE CADA CATÁLOGO
// ============================================================

const CATALOGOS = {
  categorias: {
    key: 'categorias',
    title: 'Categorías',
    singular: 'Categoría',
    nuevo: 'Nueva',
    sub: 'Categorías de activos registradas en el sistema.',
    endpoint: '/categorias/'
  },
  marcas: {
    key: 'marcas',
    title: 'Marcas',
    singular: 'Marca',
    nuevo: 'Nueva',
    sub: 'Marcas de activos registradas en el sistema.',
    endpoint: '/marcas/'
  },
  areas: {
    key: 'areas',
    title: 'Áreas',
    singular: 'Área',
    nuevo: 'Nueva',
    sub: 'Áreas de la organización.',
    endpoint: '/areas/'
  },
  sedes: {
    key: 'sedes',
    title: 'Sedes',
    singular: 'Sede',
    nuevo: 'Nueva',
    sub: 'Sedes de la organización.',
    endpoint: '/sedes/'
  },
  puestos: {
    key: 'puestos',
    title: 'Puestos',
    singular: 'Puesto',
    nuevo: 'Nuevo',
    sub: 'Puestos de trabajo registrados en el sistema.',
    endpoint: '/puestos/'
  }
};

// Todos los catálogos comparten el mismo formulario: solo el nombre
const camposCatalogo = [
  { key: 'nombre', label: 'Nombre', type: 'text', required: true, maxlength: 100, full: true }
];

// ============================================================
// HELPERS
// ============================================================

async function apiCatalogo(url, method = 'GET', body) {
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.ok === false) {
    throw new Error(data.error || 'No se pudo completar la operación.');
  }

  return data;
}

// ============================================================
// ACCIONES (globales, se llaman desde los botones de la tabla)
// ============================================================

function nuevoCatalogo(key) {
  const cfg = CATALOGOS[key];

  openModal({
    title: `${cfg.nuevo} ${cfg.singular}`,
    fields: camposCatalogo,
    data: {},
    onSubmit: async (formData) => {
      await apiCatalogo(cfg.endpoint, 'POST', {
        nombre: (formData.nombre || '').trim()
      });
      loadView(key);
    }
  });
}

async function editarCatalogo(key, id) {
  const cfg = CATALOGOS[key];

  try {
    const registro = await apiCatalogo(`${cfg.endpoint}${id}`);

    openModal({
      title: `Editar ${cfg.singular}`,
      fields: camposCatalogo,
      data: registro,
      onSubmit: async (formData) => {
        await apiCatalogo(`${cfg.endpoint}${id}`, 'PUT', {
          nombre: (formData.nombre || '').trim()
        });
        loadView(key);
      }
    });
  } catch (err) {
    alert(`Error al abrir edición: ${err.message}`);
  }
}

async function toggleEstadoCatalogo(key, id, activoActual) {
  const cfg = CATALOGOS[key];
  const accion = activoActual ? 'inactivar' : 'activar';

  if (!confirm(`¿Estás seguro de que deseas ${accion} este registro de ${cfg.title.toLowerCase()}?`)) return;

  try {
    await apiCatalogo(`${cfg.endpoint}${id}/estado`, 'PATCH', { estado: !activoActual });
    loadView(key);
  } catch (err) {
    alert(`Error al cambiar estado: ${err.message}`);
  }
}

// ============================================================
// FÁBRICA DE VISTAS
// ============================================================

function crearVistaCatalogo(cfg) {
  return {
    title: cfg.title,
    sub: cfg.sub,
    endpoint: cfg.endpoint,
    newLabel: `+ ${cfg.nuevo}`,

    columns: [
      { key: 'id', label: 'ID' },
      { key: 'nombre', label: cfg.singular },
      {
        key: 'activo',
        label: 'Estado',
        render: (val) => `
          <span class="badge ${val ? 'on' : 'off'}">
            ${val ? 'Activo' : 'Inactivo'}
          </span>
        `
      },
      {
        key: 'creado_en',
        label: 'Creado',
        render: typeof formatFecha === 'function' ? formatFecha : (val) => val || '—'
      },
      {
        key: 'acciones',
        label: 'Acciones',
        render: (_, row) => {
          if (!row || typeof row.id === 'undefined') return '—';
          const id = row.id;
          const activo = row.activo === true || row.activo === 1;

          return `
            <button type="button" class="btn-secondary" onclick="editarCatalogo('${cfg.key}', ${id})" style="padding: 4px 8px; font-size: 12px; margin-right: 4px;">
              <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">edit</span> Editar
            </button>
            <button type="button" class="btn-secondary" onclick="toggleEstadoCatalogo('${cfg.key}', ${id}, ${activo})" style="padding: 4px 8px; font-size: 12px; color: ${activo ? 'var(--warn)' : '#2E8B57'};">
              <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">${activo ? 'block' : 'check_circle'}</span>
              ${activo ? 'Inactivar' : 'Activar'}
            </button>
          `;
        }
      }
    ],

    // createFields hace que se muestre el botón "+ Nuevo"
    createFields: camposCatalogo,

    // El botón "+ Nuevo" llama a esta función (ver modal.js)
    openNew: () => nuevoCatalogo(cfg.key)
  };
}

// ============================================================
// VISTAS (las lee VIEWS en app.js)
// ============================================================

const categoriasView = crearVistaCatalogo(CATALOGOS.categorias);
const marcasView = crearVistaCatalogo(CATALOGOS.marcas);
const areasView = crearVistaCatalogo(CATALOGOS.areas);
const sedesView = crearVistaCatalogo(CATALOGOS.sedes);
const puestosView = crearVistaCatalogo(CATALOGOS.puestos);