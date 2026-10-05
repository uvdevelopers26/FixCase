/* ============================================================
   FixCase — Módulo Dashboard
   ============================================================ */

const dashboardView = {
  title: '📊 Dashboard',
  sub: 'Vista general de activos, tareas y mantenimientos',

  render: async function(container) {
    if (!container) return;

    // 1. Inyectar estructura principal con el botón #btn-buscar
    container.innerHTML = `
      <div class="panel filters-panel">
        <div class="field">
          <label for="filter-categoria">Categoría de activo</label>
          <select id="filter-categoria">
            <option value="">Todo</option>
          </select>
        </div>

        <div class="field">
          <label for="filter-sede">Sede</label>
          <select id="filter-sede">
            <option value="">Todo</option>
          </select>
        </div>

        <div class="field">
          <label for="filter-area">Área</label>
          <select id="filter-area">
            <option value="">Todo</option>
          </select>
        </div>

        <div class="field">
          <label for="filter-estado">Estado de tarea</label>
          <select id="filter-estado">
            <option value="">Todo</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En proceso</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div class="field">
          <label for="filter-desde">Desde</label>
          <input type="date" id="filter-desde">
        </div>

        <button class="btn-search" id="btn-buscar" type="button">
          <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">search</span> Buscar
        </button>
      </div>

      <div id="dashboard-content">
        <div class="panel"><p>Cargando datos del dashboard...</p></div>
      </div>
    `;

    // 2. Escuchar el evento del botón solo si existe en el DOM
    const btnBuscar = document.getElementById('btn-buscar');
    if (btnBuscar) {
      btnBuscar.addEventListener('click', () => {
        this.fetchAndRenderData();
      });
    }

    // 3. Cargar las métricas
    await this.fetchAndRenderData();
  },

  fetchAndRenderData: async function() {
    const contentBox = document.getElementById('dashboard-content');
    if (!contentBox) return;

    try {
      const categoria = document.getElementById('filter-categoria')?.value || '';
      const sede = document.getElementById('filter-sede')?.value || '';
      const area = document.getElementById('filter-area')?.value || '';
      const estado = document.getElementById('filter-estado')?.value || '';
      const desde = document.getElementById('filter-desde')?.value || '';

      const params = new URLSearchParams();
      if (categoria) params.append('categoria', categoria);
      if (sede) params.append('sede', sede);
      if (area) params.append('area', area);
      if (estado) params.append('estado', estado);
      if (desde) params.append('desde', desde);

      const res = await fetch(`${API_BASE}/dashboard/resumen?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (res.status === 401) {
        clearToken();
        showLogin();
        return;
      }

      if (!res.ok) throw new Error('Error al consultar métricas del servidor.');

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Error en la respuesta del dashboard.');

      const t = data?.tareas || { total: 0, pendientes: 0, completadas: 0, en_proceso: 0, canceladas: 0 };
      const a = data?.activos || { total: 0, por_categoria: [], por_sede: [], por_area: [] };
      const c = data?.checklists || { total: 0, cumplimiento_preventivo: [] };

      this.populateSelects(a);

      let prevHtml = '';
      if (c.cumplimiento_preventivo && c.cumplimiento_preventivo.length > 0) {
        const comp = c.cumplimiento_preventivo.reduce((s, x) => s + (x.completados || 0), 0);
        const tot = c.cumplimiento_preventivo.reduce((s, x) => s + (x.totales || 0), 0) || 1;
        const pctGeneral = Math.round((comp / tot) * 100);

        const rows = c.cumplimiento_preventivo.map(cat => {
          return '<div class="progress-row">' +
            '<div class="plabel">' +
              '<span class="name">' + escapeHtml(cat.categoria) + '</span>' +
              '<span class="pct">' + cat.porcentaje + '%</span>' +
            '</div>' +
            '<div class="progress-track">' +
              '<div class="progress-fill" style="width: ' + cat.porcentaje + '%"></div>' +
            '</div>' +
          '</div>';
        }).join('');

        prevHtml = '<div class="panel compliance-panel" style="margin-bottom: 20px;">' +
          '<h3>Cumplimiento de mantenimientos preventivos</h3>' +
          '<div class="compliance-head" style="margin-top: 8px;">' +
            '<span class="big">Preventivos ' + comp + ' / ' + tot + '</span>' +
          '</div>' +
          '<div class="compliance-pct">' + pctGeneral + '% en el rango seleccionado</div>' +
          '<div style="margin-top: 14px;">' + rows + '</div>' +
        '</div>';
      }

      contentBox.innerHTML = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon tone-accent">
              <span class="material-symbols-outlined">precision_manufacturing</span>
            </div>
            <div>
              <div class="kpi-value">${a.total}</div>
              <div class="kpi-label">Activos registrados</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon tone-warn">
              <span class="material-symbols-outlined">pending_actions</span>
            </div>
            <div>
              <div class="kpi-value">${t.pendientes}</div>
              <div class="kpi-label">Tareas pendientes</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon tone-accent">
              <span class="material-symbols-outlined">task_alt</span>
            </div>
            <div>
              <div class="kpi-value">${t.completadas}</div>
              <div class="kpi-label">Tareas completadas</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon tone-ink">
              <span class="material-symbols-outlined">fact_check</span>
            </div>
            <div>
              <div class="kpi-value">${c.total}</div>
              <div class="kpi-label">Checklists</div>
            </div>
          </div>
        </div>

        ${prevHtml}

        <div class="charts-grid">
          <div class="panel chart-panel">
            <h3>Tareas por estado</h3>
            <div class="chart-body">
              <div class="donut" id="donut-estado">
                <div class="donut-center">
                  <div class="n">${t.total}</div>
                  <div class="l">tareas</div>
                </div>
              </div>
              <div class="legend" id="legend-estado"></div>
            </div>
          </div>

          <div class="panel chart-panel">
            <h3>Activos por categoría</h3>
            <div class="chart-body">
              <div class="donut" id="donut-categoria">
                <div class="donut-center">
                  <div class="n">${a.total}</div>
                  <div class="l">activos</div>
                </div>
              </div>
              <div class="legend" id="legend-categoria"></div>
            </div>
          </div>
        </div>
      `;

      const COLORS_ESTADO = ["#FFB84D", "#5FA8D6", "#6ECE9D", "#9B8DB1"];
      const tareasPorEstado = [
        { label: "Pendientes", value: t.pendientes, color: COLORS_ESTADO[0] },
        { label: "En proceso", value: t.en_proceso, color: COLORS_ESTADO[1] },
        { label: "Completadas", value: t.completadas, color: COLORS_ESTADO[2] },
        { label: "Canceladas", value: t.canceladas, color: COLORS_ESTADO[3] }
      ];
      renderDonut('donut-estado', 'legend-estado', tareasPorEstado);

      const COLORS_CATEGORIA = ["#3EA1C9", "#5FA8D6", "#7BBDE8", "#9FD1F0", "#C5E3F8", "#E8F4FC", "#FF6B6B", "#FFA500"];
      const activosPorCategoria = (a.por_categoria || []).map((cat, idx) => ({
        label: cat.categoria || 'Sin categoría',
        value: cat.cantidad,
        color: COLORS_CATEGORIA[idx % COLORS_CATEGORIA.length]
      }));
      renderDonut('donut-categoria', 'legend-categoria', activosPorCategoria);

    } catch (error) {
      console.error('Error Dashboard:', error);
      contentBox.innerHTML = `
        <div class="panel">
          <h3 style="color: var(--warn);">Error al cargar el Dashboard</h3>
          <p>${escapeHtml(error.message)}</p>
        </div>
      `;
    }
  },

  populateSelects: function(activosData) {
    const selectCategoria = document.getElementById('filter-categoria');
    const selectSede = document.getElementById('filter-sede');
    const selectArea = document.getElementById('filter-area');

    if (selectCategoria && selectCategoria.options.length <= 1) {
      (activosData.por_categoria || []).forEach(cat => {
        if (cat.categoria) {
          const opt = document.createElement('option');
          opt.value = cat.categoria;
          opt.textContent = cat.categoria;
          selectCategoria.appendChild(opt);
        }
      });
    }

    if (selectSede && selectSede.options.length <= 1) {
      (activosData.por_sede || []).forEach(sed => {
        if (sed.sede) {
          const opt = document.createElement('option');
          opt.value = sed.sede;
          opt.textContent = sed.sede;
          selectSede.appendChild(opt);
        }
      });
    }

    if (selectArea && selectArea.options.length <= 1) {
      (activosData.por_area || []).forEach(ar => {
        if (ar.area) {
          const opt = document.createElement('option');
          opt.value = ar.area;
          opt.textContent = ar.area;
          selectArea.appendChild(opt);
        }
      });
    }
  }
};

function renderDonut(elId, legendId, data) {
  const total = data.reduce((s, d) => s + Number(d.value || 0), 0);
  const donutEl = document.getElementById(elId);
  const legendEl = document.getElementById(legendId);

  if (!donutEl || !legendEl) return;

  if (total === 0) {
    donutEl.style.background = "#E7ECEB";
    legendEl.innerHTML = "<span class='view-sub'>Sin registros para mostrar</span>";
    return;
  }

  let acc = 0;
  const stops = data.map(d => {
    const val = Number(d.value || 0);
    const start = (acc / total) * 360;
    acc += val;
    const end = (acc / total) * 360;
    return `${d.color} ${start}deg ${end}deg`;
  }).join(", ");

  donutEl.style.background = `conic-gradient(${stops})`;

  legendEl.innerHTML = data.map(d => {
    const val = Number(d.value || 0);
    const pct = Math.round((val / total) * 100);
    return `
      <div class="legend-item">
        <span class="swatch" style="background:${d.color}"></span>
        <span>${escapeHtml(d.label)}</span>
        <span class="pct">${pct}%</span>
      </div>
    `;
  }).join("");
}