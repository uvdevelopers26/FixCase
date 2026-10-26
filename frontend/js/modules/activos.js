// ---------- Módulo: Activos ----------

// Sugerencias para Marca, Área, Sede y Puesto (vienen de la base de datos).
// Los arreglos se llenan "en el lugar" para que el formulario siempre vea la última versión.
const opcionesActivos = { marca: [], area: [], sede: [], puesto: [] };

async function cargarOpcionesActivos() {
  try {
    const res = await fetch(`${API_BASE}/activos/opciones`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    Object.keys(opcionesActivos).forEach((k) => {
      opcionesActivos[k].length = 0;
      (data[k] || []).forEach((v) => opcionesActivos[k].push(v));
    });
  } catch (_) {
    // Si falla, los campos siguen funcionando como texto libre
  }
}

// Formulario "Nuevo Activo" agrupado en secciones (diseño nuevo del modal)
const activosSections = [
  {
    title: 'Información general del activo',
    icon: 'info',
    fields: [
      { key: 'nombre',         label: 'Nombre',    type: 'text', required: true, full: true },
      { key: 'categoria_tipo', label: 'Categoría', type: 'text' },
      { key: 'marca',          label: 'Marca',     type: 'combo', options: opcionesActivos.marca },
      { key: 'serial',         label: 'Serial',    type: 'text' },
      { key: 'asunto',         label: 'Asunto',    type: 'text' },
    ],
  },
  {
    title: 'Ubicación y asignación',
    icon: 'location_on',
    fields: [
      { key: 'area',   label: 'Área',   type: 'combo', options: opcionesActivos.area },
      { key: 'sede',   label: 'Sede',   type: 'combo', options: opcionesActivos.sede },
      { key: 'puesto', label: 'Puesto', type: 'combo', options: opcionesActivos.puesto, full: true },
    ],
  },
  {
    title: 'Estado',
    icon: 'toggle_on',
    fields: [
      { key: 'estado', label: 'Activo (disponible)', type: 'checkbox', default: true },
    ],
  },
];

const activosView = {
  title: 'Activos',
  sub: 'Inventario de activos gestionados por Infratrack.',
  endpoint: '/activos/',
  columns: [
    { key: 'id',             label: 'ID' },
    { key: 'nombre',         label: 'Nombre' },
    { key: 'categoria_tipo', label: 'Categoría' },
    { key: 'marca',          label: 'Marca' },
    { key: 'serial',         label: 'Serial' },
    { key: 'area',           label: 'Área' },
    { key: 'sede',           label: 'Sede' },
    { key: 'puesto',         label: 'Puesto' },
    {
      key: 'estado', label: 'Estado',
      render: (val) => `<span class="badge ${val ? 'on' : 'off'}">${val ? 'Activo' : 'Inactivo'}</span>`
    },
    { key: 'creado_en', label: 'Creado', render: formatFecha },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_, row) => {
        if (!row || typeof row.id === 'undefined') return '—';
        return `
          <button type="button" class="btn-secondary" onclick="editarActivo(${row.id})" style="padding: 4px 8px; font-size: 12px;">
            <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">edit</span> Editar
          </button>
        `;
      }
    },
  ],

  // modal.js dibuja el formulario con `sections`; `createFields` se mantiene
  // (misma lista, aplanada) porque el envío del formulario la usa para armar el payload.
  sections: activosSections,
  createFields: activosSections.flatMap((s) => s.fields),

  // El botón "+ Nuevo" llama a openNew: primero carga las sugerencias y luego abre el modal.
  async openNew() {
    await cargarOpcionesActivos();
    openModal('activos');
  },
};

// ---------- Edición ----------

// '' y null cuentan como "sin valor"; los textos se comparan sin espacios sobrantes
function normalizarValorActivo(v, esCheckbox) {
  if (esCheckbox) return !!v;
  if (typeof v === 'string') {
    v = v.trim();
    return v === '' ? null : v;
  }
  return v ?? null;
}

async function editarActivo(id) {
  try {
    await cargarOpcionesActivos();

    const res = await fetch(`${API_BASE}/activos/${id}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error('No se pudieron obtener los datos del activo.');
    const activo = await res.json();

    openModal({
      title: 'Editar Activo',
      sections: activosSections,
      data: activo,
      onSubmit: async (values) => {
        // Solo se envía lo que cambió: así no se borra ningún dato que el formulario no muestre
        const cambios = {};
        activosSections.forEach((s) => s.fields.forEach((f) => {
          const esCheck = f.type === 'checkbox';
          const nuevo = normalizarValorActivo(values[f.key], esCheck);
          const original = normalizarValorActivo(activo[f.key], esCheck);
          if (nuevo !== original) cambios[f.key] = nuevo;
        }));

        if (Object.keys(cambios).length === 0) return; // nada que guardar

        const upd = await fetch(`${API_BASE}/activos/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify(cambios)
        });
        const body = await upd.json().catch(() => null);
        if (!upd.ok) throw new Error(body?.error || 'No se pudieron guardar los cambios.');

        if (typeof loadView === 'function') loadView('activos');
      }
    });
  } catch (err) {
    alert(`Error al abrir edición: ${err.message}`);
  }
}