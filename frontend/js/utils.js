// ---------- Utilidades genéricas, usadas por todos los módulos ----------

// Escapa HTML para evitar inyección al mostrar datos que vienen de la API
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

// Construye una tabla HTML a partir de filas + definición de columnas.
// Cada columna puede traer un `render(valor, fila)` opcional para formatear celdas.
function renderTable(rows, columns) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return '<div class="empty-state">No hay registros todavía.</div>';
  }

  // Filtrar posibles elementos nulos o no definidos de la respuesta
  const validRows = rows.filter(r => r !== null && r !== undefined);

  if (validRows.length === 0) {
    return '<div class="empty-state">No hay registros válidos para mostrar.</div>';
  }

  const thead = columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join('');
  
  const tbody = validRows.map(row => {
    const cells = columns.map(c => {
      const raw = row[c.key];
      // Pasamos `raw` como primer parámetro y la fila entera `row` como segundo parámetro
      const value = typeof c.render === 'function' 
        ? c.render(raw, row) 
        : escapeHtml(raw ?? '—');
        
      return `<td>${value}</td>`;
    }).join('');
    
    return `<tr>${cells}</tr>`;
  }).join('');

  return `<table class="data-table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
}

// Formatea una fecha ISO al formato local (usado en columnas "creado_en")
function formatFecha(val) {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-CO');
}