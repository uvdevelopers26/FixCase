// ---------- Junta las vistas definidas en cada módulo ----------
const VIEWS = {
  usuarios: usuariosView,
  activos: activosView,
  tareas: tareasView,
  plantillas: plantillasView,
};

// ---------- Elementos del dashboard ----------
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const viewTitle = document.getElementById('view-title');
const viewSub = document.getElementById('view-sub');
const viewBody = document.getElementById('view-body');
const viewToolbar = document.getElementById('view-toolbar');
const navItems = document.querySelectorAll('.nav-item[data-view]');

let currentViewKey = 'usuarios';

// ---------- Cambio de pantalla (login <-> dashboard) ----------
function showApp() {
  loginScreen.style.display = 'none';
  appScreen.style.display = 'block';
  currentViewKey = 'usuarios';
  loadView(currentViewKey);
}

function showLogin() {
  appScreen.style.display = 'none';
  loginScreen.style.display = 'flex';
  document.getElementById('login-form').reset();
}

// ---------- Carga y muestra los datos de una vista ----------
async function loadView(viewKey) {
  const view = VIEWS[viewKey];
  viewTitle.textContent = view.title;
  viewSub.textContent = view.sub;
  viewBody.innerHTML = '<div class="empty-state">Cargando...</div>';
  viewToolbar.style.display = view.columns ? 'flex' : 'none';

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
    viewBody.innerHTML = view.columns
      ? renderTable(data, view.columns)
      : `<div class="empty-state">${escapeHtml(JSON.stringify(data, null, 2))}</div>`;
  } catch (err) {
    viewBody.innerHTML = `<div class="empty-state">No se pudieron cargar los datos: ${escapeHtml(err.message)}</div>`;
  }
}

// ---------- Navegación entre vistas (clic en el sidebar) ----------
navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    navItems.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentViewKey = btn.dataset.view;
    loadView(currentViewKey);
  });
});

// ---------- Arranque ----------
// Si ya hay una sesión guardada, entra directo al dashboard; si no, login.
if (getToken()) {
  showApp();
} else {
  showLogin();
}
