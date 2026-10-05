// Cambia esta URL si el backend Flask corre en otra dirección/puerto.
const API_BASE = "http://localhost:5000/api";

async function apiFetch(path, opciones = {}) {
    const respuesta = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...opciones,
    });

    if (!respuesta.ok) {
        let detalle = "";
        try {
            const cuerpo = await respuesta.json();
            detalle = cuerpo.error || JSON.stringify(cuerpo);
        } catch (_) {
            detalle = respuesta.statusText;
        }
        throw new Error(`Error ${respuesta.status}: ${detalle}`);
    }

    if (respuesta.status === 204) return null;
    return respuesta.json();
}

const Api = {
    listar(params = {}) {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`/seguimientos${query ? `?${query}` : ""}`);
    },
    obtener(id) {
        return apiFetch(`/seguimientos/${id}`);
    },
    crear(data) {
        return apiFetch("/seguimientos", { method: "POST", body: JSON.stringify(data) });
    },
    actualizar(id, data) {
        return apiFetch(`/seguimientos/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    eliminar(id) {
        return apiFetch(`/seguimientos/${id}`, { method: "DELETE" });
    },
    calcularSemaforoPreview(sintomasHerida, sintomasNeuro) {
        return apiFetch("/seguimientos/calcular-semaforo", {
            method: "POST",
            body: JSON.stringify({ sintomas_herida: sintomasHerida, sintomas_neuro: sintomasNeuro }),
        });
    },
};
