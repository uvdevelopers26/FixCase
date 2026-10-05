// ==========================================================
// MÓDULO: DHV - Hoja de Vida del Activo
// ==========================================================

let dhvActivosCache = [];

// ==========================================================
// CARGAR ACTIVOS PARA EL SELECTOR
// ==========================================================
async function cargarActivosParaDHV() {
  try {
    const res = await fetch(`${API_BASE}/activos/`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!res.ok) {
      throw new Error('No se pudieron cargar los activos.');
    }

    dhvActivosCache = await res.json();
    return dhvActivosCache;
  } catch (error) {
    console.error('Error cargando activos para DHV:', error);
    return [];
  }
}

// ==========================================================
// MOSTRAR INFORMACIÓN DEL ACTIVO SELECCIONADO
// ==========================================================
function mostrarInformacionActivo(idActivo) {
  const contenedor = document.getElementById('dhv-activo-info');
  if (!contenedor) return;

  if (!idActivo) {
    contenedor.innerHTML = `
      <div class="empty-state">
        Selecciona un activo para consultar su información.
      </div>
    `;
    return;
  }

  const activo = dhvActivosCache.find(
    a => Number(a.id) === Number(idActivo)
  );

  if (!activo) {
    contenedor.innerHTML = `
      <div class="empty-state">
        No se encontró información del activo.
      </div>
    `;
    return;
  }

  contenedor.innerHTML = `
    <div class="dhv-activo-header" style="padding: 10px; background: var(--bg); border-radius: 8px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>${escapeHtml(activo.nombre || 'Sin nombre')}</strong>
        <span class="badge ${activo.estado ? 'on' : 'off'}">
          ${activo.estado ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      <span class="mono" style="font-size: 11px; color: var(--ink-soft);">
        ID #${activo.id}
      </span>
    </div>

    <div class="dhv-info-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; font-size: 12px;">
      <div><span>Tipo:</span> <strong>${escapeHtml(activo.tipo || '-')}</strong></div>
      <div><span>Categoría:</span> <strong>${escapeHtml(activo.categoria_tipo || '-')}</strong></div>
      <div><span>Marca:</span> <strong>${escapeHtml(activo.marca || '-')}</strong></div>
      <div><span>Modelo:</span> <strong>${escapeHtml(activo.modelo || '-')}</strong></div>
      <div><span>Serial:</span> <strong>${escapeHtml(activo.serial || '-')}</strong></div>
      <div><span>Placa:</span> <strong>${escapeHtml(activo.placa || '-')}</strong></div>
      <div><span>Sede:</span> <strong>${escapeHtml(activo.sede || '-')}</strong></div>
      <div><span>Área:</span> <strong>${escapeHtml(activo.area || '-')}</strong></div>
      <div><span>Ubicación:</span> <strong>${escapeHtml(activo.ubicacion || '-')}</strong></div>
    </div>
  `;
}

// ==========================================================
// SELECTOR DE ACTIVOS
// ==========================================================
async function prepararSelectorActivosDHV() {
  const select = document.getElementById('f-id_activo');
  if (!select) return;

  select.innerHTML = `
    <option value="" disabled selected>
      Cargando activos...
    </option>
  `;

  const activos = await cargarActivosParaDHV();

  select.innerHTML = `
    <option value="" disabled selected>
      Selecciona un activo...
    </option>
  `;

  activos.forEach(activo => {
    const option = document.createElement('option');
    option.value = activo.id;

    const partes = [
      activo.nombre,
      activo.marca,
      activo.modelo,
      activo.serial
    ].filter(Boolean);

    option.textContent = `#${activo.id} · ${partes.join(' · ')}`;
    select.appendChild(option);
  });

  select.addEventListener('change', function () {
    mostrarInformacionActivo(this.value);
  });
}

// ==========================================================
// DEFINICIÓN DE LA VISTA DHV
// ==========================================================
const dhvView = {
  title: 'Hojas de Vida',
  sub: 'Gestión de instalación, garantía, devolución, préstamo y documentación del activo.',
  endpoint: '/dhv/',

  columns: [
    { key: 'id', label: 'ID' },
    { key: 'id_activo', label: 'Activo' },
    {
      key: 'fecha_instalacion',
      label: 'Instalación',
      render: (val) => val ? formatFecha(val) : '-'
    },
    {
      key: 'garantia',
      label: 'Garantía',
      render: (val) => val || '-'
    },
    {
      key: 'inicio_garantia',
      label: 'Inicio garantía',
      render: (val) => val ? formatFecha(val) : '-'
    },
    {
      key: 'finalizacion_garantia',
      label: 'Fin garantía',
      render: (val) => val ? formatFecha(val) : '-'
    },
    {
      key: 'estado_prestamo',
      label: 'Préstamo',
      render: (val) => `
        <span class="badge ${val ? 'on' : 'off'}">
          ${val ? 'Prestado' : 'Disponible'}
        </span>
      `
    },
    {
      key: 'fecha_prestamo',
      label: 'Fecha préstamo',
      render: (val) => val ? formatFecha(val) : '-'
    },
    {
      key: 'creado_en',
      label: 'Creado',
      render: formatFecha
    }
  ],

  createFields: [
    // ACTIVO
    { type: 'section', title: 'Activo', full: true },
    {
      key: 'id_activo',
      label: 'Activo',
      type: 'select',
      required: true,
      full: true,
      options: []
    },
    { type: 'custom', key: 'dhv_activo_info', full: true },

    // INSTALACIÓN
    { type: 'section', title: 'Instalación', full: true },
    { key: 'fecha_instalacion', label: 'Fecha de instalación', type: 'date' },
    { key: 'responsable_instalacion', label: 'Responsable instalación', type: 'number' },
    { key: 'observaciones_instalacion', label: 'Observaciones instalación', type: 'textarea', full: true },

    // GARANTÍA
    { type: 'section', title: 'Garantía', full: true },
    { key: 'garantia', label: 'Garantía', type: 'text' },
    { key: 'inicio_garantia', label: 'Inicio garantía', type: 'date' },
    { key: 'finalizacion_garantia', label: 'Finalización garantía', type: 'date' },
    { key: 'proveedor_garantia', label: 'Proveedor garantía', type: 'text' },
    { key: 'observaciones_garantia', label: 'Observaciones garantía', type: 'textarea', full: true },

    // DEVOLUCIÓN
    { type: 'section', title: 'Devolución', full: true },
    { key: 'fecha_devolucion', label: 'Fecha devolución', type: 'date' },
    { key: 'responsable_devolucion', label: 'Responsable devolución', type: 'number' },
    { key: 'motivo_devolucion', label: 'Motivo devolución', type: 'text' },
    { key: 'estado_devolucion', label: 'Estado devolución', type: 'text' },
    { key: 'observaciones_devolucion', label: 'Observaciones devolución', type: 'textarea', full: true },

    // PRÉSTAMO
    { type: 'section', title: 'Préstamo', full: true },
    { key: 'estado_prestamo', label: 'Activo en préstamo', type: 'checkbox', default: false },
    { key: 'fecha_prestamo', label: 'Fecha préstamo', type: 'date' },
    { key: 'fecha_devolucion_prestamo', label: 'Fecha devolución préstamo', type: 'date' },
    { key: 'responsable_prestamo', label: 'Responsable préstamo', type: 'number' },
    { key: 'entregado_a', label: 'Entregado a', type: 'number' },
    { key: 'observaciones_prestamo', label: 'Observaciones préstamo', type: 'textarea', full: true },

    // METADATOS
    { type: 'section', title: 'Información del registro', full: true },
    { key: 'creado_por', label: 'Creado por', type: 'number' }
  ]
};

// Exportar funciones globalmente
window.prepararSelectorActivosDHV = prepararSelectorActivosDHV;