/* ============================================================
   FixCase — Control Principal (app.js)
   ============================================================ */

// 1. Manejo seguro de elementos del DOM
function getEl(id) {
  return document.getElementById(id);
}

// 2. Mapeo global de vistas blindado contra 'undefined'
const VIEWS = {
  dashboard: typeof dashboardView !== 'undefined' ? dashboardView : null,
  usuarios: typeof usuariosView !== 'undefined' ? usuariosView : null,
  activos: typeof activosView !== 'undefined' ? activosView : null,
  dhv: typeof dhvView !== 'undefined' ? dhvView : null,
  tareas: typeof tareasView !== 'undefined' ? tareasView : null,
  checklists: typeof checklistsView !== 'undefined' ? checklistsView : null,
  plantillas: typeof plantillasView !== 'undefined' ? plantillasView : null,
};

let currentViewKey = 'dashboard';

// 3. Control de pantallas (Login <-> Dashboard)
function showApp() {
  const loginScreen = getEl('login-screen');
  const appScreen = getEl('app-screen');

  if (loginScreen) loginScreen.style.display = 'none';
  if (appScreen) appScreen.style.display = 'block';

  document.querySelectorAll('.menu .nav-item').forEach(item => item.classList.remove('active'));
  const activeBtn = document.querySelector(`.nav-item[data-view="${currentViewKey}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  loadView(currentViewKey);
}

function showLogin() {
  const loginScreen = getEl('login-screen');
  const appScreen = getEl('app-screen');

  if (appScreen) appScreen.style.display = 'none';
  if (loginScreen) loginScreen.style.display = 'flex';
  
  const loginForm = getEl('login-form');
  if (loginForm) loginForm.reset();
}

// 4. Cargar y renderizar vistas
async function loadView(viewKey) {
  const view = VIEWS[viewKey];
  const viewTitle = getEl('view-title');
  const viewSub = getEl('view-sub');
  const viewBody = getEl('view-body');
  const viewToolbar = getEl('view-toolbar');

  if (!view) {
    console.warn(`La vista "${viewKey}" no está definida o no fue cargada.`);
    if (viewTitle) viewTitle.textContent = 'Módulo no disponible';
    if (viewSub) viewSub.textContent = '';
    if (viewToolbar) viewToolbar.style.display = 'none';
    if (viewBody) {
      viewBody.innerHTML = `
        <div class="panel">
          <p>El módulo <strong>${escapeHtml(viewKey)}</strong> no se encuentra disponible actualmente.</p>
        </div>
      `;
    }
    return;
  }

  if (viewTitle) viewTitle.textContent = view.title || 'Sección';
  if (viewSub) viewSub.textContent = view.sub || '';
  const newButton = getEl('btn-new');
  if (newButton) newButton.textContent = view.newLabel || '+ Nuevo';

  // CASO 1: Vistas dinámicas con función render propia (ej: Dashboard)
  if (typeof view.render === 'function') {
    if (viewToolbar) viewToolbar.style.display = view.createFields ? 'flex' : 'none';
    await view.render(viewBody);
    return;
  }

  // CASO 2: Vistas basadas en tablas estándar
  if (viewBody) viewBody.innerHTML = '<div class="empty-state">Cargando...</div>';
  if (viewToolbar) viewToolbar.style.display = view.columns ? 'flex' : 'none';

  try {
    const res = await fetch(`${API_BASE}${view.endpoint}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (res.status === 401) {
      clearToken();
      showLogin();
      return;
    }
    if (!res.ok) throw new Error('Error al cargar los datos.');

    const data = await res.json();
    if (viewBody) {
      viewBody.innerHTML = view.columns
        ? renderTable(data, view.columns)
        : `<div class="empty-state">${escapeHtml(JSON.stringify(data, null, 2))}</div>`;
    }
  } catch (err) {
    if (viewBody) {
      viewBody.innerHTML = `<div class="empty-state">No se pudieron cargar los datos: ${escapeHtml(err.message)}</div>`;
    }
  }
}

// 5. Configuración del Modo Oscuro
const THEME_STORAGE_KEY = 'fixcase_theme';
const themeToggle = getEl('theme-toggle');

function applyTheme(theme) {
  if (!themeToggle) return;
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  themeToggle.setAttribute('aria-pressed', String(isDark));
  
  const themeIcon = themeToggle.querySelector('.material-symbols-outlined');
  const themeLabel = themeToggle.querySelector('.theme-label');
  const themeState = themeToggle.querySelector('.theme-state');

  if (themeIcon) themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
  if (themeLabel) themeLabel.textContent = isDark ? 'Modo claro' : 'Modo oscuro';
  if (themeState) themeState.textContent = isDark ? 'OSCURO' : 'CLARO';
}

if (themeToggle) {
  applyTheme(localStorage.getItem(THEME_STORAGE_KEY) || 'light');
  themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  });
}

// 6. Navegación del Menú Lateral
document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.menu .nav-item').forEach(item => item.classList.remove('active'));
    btn.classList.add('active');
    currentViewKey = btn.dataset.view;
    loadView(currentViewKey);
  });
});

// 7. Arranque
if (typeof getToken === 'function' && getToken()) {
  showApp();
} else {
  showLogin();
}
