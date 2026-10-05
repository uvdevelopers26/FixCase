/* ============================================================
   FixCase — Manejo del Token y Autenticación (auth.js)
   ============================================================ */

// ---------- Manejo del token de sesión ----------
function getToken() { return localStorage.getItem('infratrack_token'); }
function setToken(t) { localStorage.setItem('infratrack_token', t); }
function clearToken() { localStorage.removeItem('infratrack_token'); }

// ---------- Envío del formulario de login ----------
document.addEventListener('submit', async (e) => {
  if (e.target && e.target.id === 'login-form') {
    e.preventDefault();

    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');

    if (loginError) loginError.style.display = 'none';
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = 'Ingresando...';
    }

    const user = document.getElementById('user')?.value || '';
    const clave = document.getElementById('clave')?.value || '';

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, clave })
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error('Usuario o contraseña incorrectos.');
        if (res.status === 422) throw new Error('Datos inválidos. Revisá los campos.');
        throw new Error('No se pudo iniciar sesión (error del servidor).');
      }

      const data = await res.json();
      
      if (data.token) {
        setToken(data.token);
      }

      // Transición segura a la pantalla principal
      if (typeof showApp === 'function') {
        showApp();
      } else {
        const loginEl = document.getElementById('login-screen');
        const appEl = document.getElementById('app-screen');
        if (loginEl) loginEl.style.display = 'none';
        if (appEl) appEl.style.display = 'block';
      }

    } catch (err) {
      if (loginError) {
        loginError.textContent = err.message.includes('fetch')
          ? 'No se pudo conectar con el servidor. ¿Está corriendo Flask?'
          : err.message;
        loginError.style.display = 'block';
      } else {
        alert(err.message);
      }
    } finally {
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Ingresar';
      }
    }
  }
});

// ---------- Cerrar sesión ----------
document.addEventListener('click', (e) => {
  const logoutBtn = e.target.closest('#logout-btn');
  if (logoutBtn) {
    clearToken();
    if (typeof showLogin === 'function') {
      showLogin();
    } else {
      const loginEl = document.getElementById('login-screen');
      const appEl = document.getElementById('app-screen');
      if (appEl) appEl.style.display = 'none';
      if (loginEl) loginEl.style.display = 'flex';
    }
  }
});