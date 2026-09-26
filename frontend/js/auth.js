// ---------- Manejo del token de sesión ----------
function getToken() { return localStorage.getItem('infratrack_token'); }
function setToken(t) { localStorage.setItem('infratrack_token', t); }
function clearToken() { localStorage.removeItem('infratrack_token'); }

// ---------- Envío del formulario de login ----------
// Nota: showApp, showLogin, loginScreen y appScreen están definidos en app.js
// (que se carga después de este archivo), pero como esta función solo se
// ejecuta al enviar el formulario (no al cargar la página), para entonces
// ya están disponibles.
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const loginBtn = document.getElementById('login-btn');
  const loginError = document.getElementById('login-error');

  loginError.style.display = 'none';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Ingresando...';

  const user = document.getElementById('user').value;
  const clave = document.getElementById('clave').value;

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
setToken(data.token);
showApp();

  } catch (err) {
    loginError.textContent = err.message.includes('fetch')
  ? 'No se pudo conectar con el servidor. ¿Está corriendo Flask (python app.py)?'
  : err.message;
    loginError.style.display = 'block';
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Ingresar';
  }
});

// ---------- Cerrar sesión ----------
document.getElementById('logout-btn').addEventListener('click', () => {
  clearToken();
  showLogin();
});
