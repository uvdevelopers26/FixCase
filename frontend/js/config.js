// Opción A: Indicar explícitamente el puerto 8085
// Flask corre en el puerto 5000; usamos el mismo host desde el que se abrió la página
const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000/api`;

// O Opción B (Dinámica): Tomar automáticamente el puerto actual desde el que se abrió la página
// const API_BASE = `http://${window.location.hostname}:${window.location.port}/api`;