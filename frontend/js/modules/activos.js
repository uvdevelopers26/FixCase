// ---------- Módulo: Activos ----------
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
  ],
  createFields: [
    { key: 'nombre',         label: 'Nombre',    type: 'text', required: true, full: true },
    { key: 'categoria_tipo', label: 'Categoría', type: 'text' },
    { key: 'marca',          label: 'Marca',      type: 'text' },
    { key: 'serial',         label: 'Serial',     type: 'text' },
    { key: 'area',           label: 'Área',       type: 'text' },
    { key: 'sede',           label: 'Sede',       type: 'text' },
    { key: 'puesto',         label: 'Puesto',     type: 'text' },
    { key: 'asunto',         label: 'Asunto',     type: 'text', full: true },
    { key: 'estado',         label: 'Activo (disponible)', type: 'checkbox', default: true },
  ],
};