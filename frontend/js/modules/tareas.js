const tareasView = {
  title: 'Tarea Técnica',
  sub: 'El sistema abrirá el checklist automáticamente según el equipo y trabajo seleccionado.',
  endpoint: '/tareas/',

  columns: [
    { key: 'id', label: 'ID' },
    { key: 'activo', label: 'Activo', render: (val) => val ? `<strong>${val.nombre}</strong>` : '—' },
    { key: 'id_estado', label: 'Estado', render: (val) => {
        const clases = { completado: 'on', pendiente: 'neutral', en_proceso: 'warning' };
        return `<span class="badge ${clases[val] || ''}">${val}</span>`;
    }},
    { key: 'creado_en', label: 'Fecha', render: formatFecha }
  ],

  createFields: [
    {
      key: 'asunto_grupo',
      label: '1. Categoría de Equipo',
      type: 'select',
      required: true,
      options: [
        { value: 'AIO', label: '🖥️ Todo en Uno' },
        { value: 'SOFTWARE', label: '💿 Software / Aplicativo' },
        { value: 'IMPRESORA', label: '🖨️ Impresora' },
        { value: 'PORTATIL', label: '💻 Portátil / Laptop' },
        { value: 'TELEVISOR', label: '📺 Televisor' }
      ],
      onChange: (val) => { tareasView.actualizarActivos(val); }
    },
    {
      key: 'id_activo',
      label: '2. Equipo Específico',
      type: 'select',
      required: true,
      options: []
    },
    {
      key: 'categoria_mantenimiento',
      label: '3. Tipo de Trabajo',
      type: 'select',
      required: true,
      options: [
        { value: 'Preventivo', label: '🛠️ Mantenimiento Preventivo' },
        { value: 'Correctivo', label: '🚨 Mantenimiento Correctivo' },
        { value: 'Reinstalacion', label: '📦 Reinstalación / Cambio' }
      ],
      onChange: (val) => { tareasView.validarPlantilla(val); }
    },
    { key: 'id_usuario', label: 'ID Técnico', type: 'number', required: true }
  ],

  actualizarActivos: async function(tipo) {
    const select = document.getElementById('f-id_activo');
    select.innerHTML = '<option disabled>Cargando equipos...</option>';
    try {
      const res = await fetch(`${API_BASE}/activos/`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const activos = await res.json();
      const filtrados = activos.filter(a => a.categoria_tipo === tipo);
      select.innerHTML = filtrados.map(a => `<option value="${a.id}">${a.nombre} (${a.serial || 'S/N'})</option>`).join('')
                         || '<option disabled>No hay equipos registrados</option>';
    } catch (e) { console.error("Error filtrando activos:", e); }
  },

  validarPlantilla: async function(mant) {
    const perfil = document.getElementById('f-asunto_grupo').value;
    const errorBox = document.getElementById('modal-error');
    const submitBtn = document.getElementById('modal-submit');

    try {
      const res = await fetch(`${API_BASE}/checklists/plantillas/buscar-match/?perfil=${encodeURIComponent(perfil)}&mantenimiento=${encodeURIComponent(mant)}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) {
        errorBox.textContent = `⚠️ No hay plantilla para ${perfil} en modo ${mant}.`;
        errorBox.style.display = 'block';
        submitBtn.disabled = true;
      } else {
        errorBox.style.display = 'none';
        submitBtn.disabled = false;
      }
    } catch (e) { console.error(e); }
  }
};