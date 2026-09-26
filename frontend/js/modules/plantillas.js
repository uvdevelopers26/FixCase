const plantillasView = {
  title: 'Plantillas de Checklist',
  sub: 'Configuración de listas de chequeo por tipo de equipo y mantenimiento.',
  endpoint: '/checklists/plantillas',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'perfil_activo', label: 'Perfil' },
    { key: 'categoria_mantenimiento', label: 'Tipo Mantenimiento' },
    {
        key: 'items',
        label: 'Items',
        render: (val) => val ? `<span class="badge neutral">${val.length} puntos</span>` : '0'
    }
  ],
  createFields: [
    { key: 'nombre', label: 'Nombre de la Plantilla', type: 'text', required: true, full: true },
    { key: 'perfil_activo', label: 'Perfil del Activo', type: 'select', required: true,
      // Mismos valores exactos que asunto_grupo en tareas.js — tienen que coincidir
      // carácter por carácter para que el matching automático funcione.
      options: [
        { value: 'AIO', label: '🖥️ Todo en Uno' },
        { value: 'SOFTWARE', label: '💿 Software / Aplicativo' },
        { value: 'IMPRESORA', label: '🖨️ Impresora' },
        { value: 'PORTATIL', label: '💻 Portátil / Laptop' },
        { value: 'TELEVISOR', label: '📺 Televisor' }
      ]
    },
    { key: 'categoria_mantenimiento', label: 'Categoría', type: 'select', required: true,
      // Mismos valores exactos que categoria_mantenimiento en tareas.js
      options: [
        { value: 'Preventivo', label: '🛠️ Mantenimiento Preventivo' },
        { value: 'Correctivo', label: '🚨 Mantenimiento Correctivo' },
        { value: 'Reinstalacion', label: '📦 Reinstalación / Cambio' }
      ]
    },
    { key: 'descripcion', label: 'Descripción breve', type: 'text', full: true }
  ],
};