// ---------- Utilidades genéricas, usadas por todos los módulos ----------

// Escapa HTML para evitar inyección al mostrar datos que vienen de la API
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

// Construye una tabla HTML a partir de filas + definición de columnas.
// Cada columna puede traer un `render(valor)` opcional para formatear celdas
// (badges, fechas, etc.); si no lo trae, se muestra el valor escapado tal cual.
function renderTable(rows, columns) {
  if (!rows || rows.length === 0) {
    return '<div class="empty-state">No hay registros todavía.</div>';
  }
  const thead = columns.map(c => `<th>${c.label}</th>`).join('');
  const tbody = rows.map(row => {
    const cells = columns.map(c => {
      const raw = row[c.key];
      const value = c.render ? c.render(raw) : escapeHtml(raw ?? '—');
      return `<td>${value}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  return `<table class="data-table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
}

// Formatea una fecha ISO al formato local (usado en columnas "creado_en")
function formatFecha(val) {
  return val ? new Date(val).toLocaleDateString('es-CO') : '—';
}
