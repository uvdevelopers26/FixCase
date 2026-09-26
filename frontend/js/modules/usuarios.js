// ---------- Módulo: Usuarios ----------
const usuariosView = {
  title: 'Usuarios',
  sub: 'Listado de usuarios registrados en el sistema.',
  endpoint: '/usuarios/',
  columns: [
    { key: 'id',        label: 'ID' },
    { key: 'user',      label: 'Usuario' },
    { key: 'rol',       label: 'Rol' },
    { key: 'id_activo', label: 'Activo asignado', render: (val) => val ?? '—' },
    { key: 'creado_en', label: 'Creado', render: formatFecha },
  ],
  createFields: [
    { key: 'user',  label: 'Usuario',     type: 'text',     required: true, full: true },
    { key: 'clave', label: 'Contraseña',  type: 'password', required: true, full: true },
    { key: 'rol',   label: 'Rol', type: 'select', required: true,
      options: [
        { value: 'Administrador', label: 'Administrador' },
        { value: 'Técnico',       label: 'Técnico' },
      ] },
  ],
};