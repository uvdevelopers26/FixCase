const form = document.getElementById("form-seguimiento");
const mensajeArea = document.getElementById("mensaje-area");

const params = new URLSearchParams(window.location.search);
const idEdicion = params.get("id");

function mostrarMensaje(texto, tipo = "ok") {
    mensajeArea.innerHTML = `<div class="mensaje ${tipo}">${texto}</div>`;
}

// -----------------------------------------------------------------------
// Lectura de los bloques de checkboxes (síntomas herida / neuro, 48h y D5)
// -----------------------------------------------------------------------
function leerGrupo(nombreGrupo) {
    const contenedor = document.querySelector(`[data-grupo="${nombreGrupo}"]`);
    const resultado = {};
    contenedor.querySelectorAll("input[type=checkbox]").forEach((input) => {
        resultado[input.dataset.campo] = input.checked;
    });
    return resultado;
}

function escribirGrupo(nombreGrupo, datos) {
    const contenedor = document.querySelector(`[data-grupo="${nombreGrupo}"]`);
    contenedor.querySelectorAll("input[type=checkbox]").forEach((input) => {
        input.checked = !!(datos && datos[input.dataset.campo]);
    });
}

function actualizarSemaforoEnVivo(sufijo, nombreGrupoHerida, nombreGrupoNeuro) {
    const herida = leerGrupo(nombreGrupoHerida);
    const neuro = leerGrupo(nombreGrupoNeuro);
    const resultado = calcularSemaforoLocal(herida, neuro);

    const contenedor = document.getElementById(`resultado-${sufijo}`);
    contenedor.querySelector(".puntos").textContent = `${resultado.puntaje_total} pts`;
    const badge = contenedor.querySelector(".badge");
    badge.className = `badge ${resultado.semaforo}`;
    badge.textContent = resultado.semaforo_label;

    const alertaDiv = document.getElementById(`alerta-neuro-${sufijo}`);
    alertaDiv.innerHTML = resultado.protocolo_neuro_activado
        ? `<div class="alerta-neuro">⚠ Protocolo neurológico activado: ${resultado.alertas_neuro} síntomas presentes (umbral ≥2)</div>`
        : "";
}

document.querySelectorAll('[data-grupo="herida_48h"] input, [data-grupo="neuro_48h"] input')
    .forEach((el) => el.addEventListener("change", () => actualizarSemaforoEnVivo("48h", "herida_48h", "neuro_48h")));

document.querySelectorAll('[data-grupo="herida_d5"] input, [data-grupo="neuro_d5"] input')
    .forEach((el) => el.addEventListener("change", () => actualizarSemaforoEnVivo("d5", "herida_d5", "neuro_d5")));

// -----------------------------------------------------------------------
// Construcción del payload y envío
// -----------------------------------------------------------------------
function construirPayload() {
    const fd = new FormData(form);
    const payload = {};

    for (const [nombre, valor] of fd.entries()) {
        if (nombre === "muestra_patologia") continue; // se maneja aparte (checkbox suelto)
        payload[nombre] = valor === "" ? null : valor;
    }

    payload.muestra_patologia = form.querySelector('input[name="muestra_patologia"]').checked;

    if (payload.contactado_48h !== undefined) {
        payload.contactado_48h = payload.contactado_48h === "true" ? true : payload.contactado_48h === "false" ? false : null;
    }
    if (payload.contactado_d5 !== undefined) {
        payload.contactado_d5 = payload.contactado_d5 === "true" ? true : payload.contactado_d5 === "false" ? false : null;
    }

    payload.sintomas_herida_48h = leerGrupo("herida_48h");
    payload.sintomas_neuro_48h = leerGrupo("neuro_48h");
    payload.sintomas_herida_d5 = leerGrupo("herida_d5");
    payload.sintomas_neuro_d5 = leerGrupo("neuro_d5");

    return payload;
}

form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const payload = construirPayload();

    try {
        if (idEdicion) {
            await Api.actualizar(idEdicion, payload);
            mostrarMensaje("Registro actualizado correctamente.");
        } else {
            await Api.crear(payload);
            mostrarMensaje("Registro creado correctamente.");
            form.reset();
            actualizarSemaforoEnVivo("48h", "herida_48h", "neuro_48h");
            actualizarSemaforoEnVivo("d5", "herida_d5", "neuro_d5");
        }
        setTimeout(() => (window.location.href = "index.html"), 900);
    } catch (error) {
        mostrarMensaje(`Error al guardar: ${error.message}`, "error");
    }
});

// -----------------------------------------------------------------------
// Modo edición: precargar datos si viene ?id= en la URL
// -----------------------------------------------------------------------
async function precargarSiEdicion() {
    if (!idEdicion) return;

    document.getElementById("titulo-form").textContent = "Editar registro de seguimiento";
    document.querySelector('a[href="formulario.html"]').textContent = "Editando registro";

    try {
        const r = await Api.obtener(idEdicion);

        const camposSimples = [
            "mes", "quirofano", "hora_ingreso_sala", "hora_salida_sala", "nombre_completo",
            "documento", "edad", "procedimiento", "telefono_contacto", "especialidad",
            "especialista", "aux_enfermeria", "instrumentadora_qx", "asegurador",
            "estudio_patologia", "profilaxis_antibiotica", "refuerzo_antibiotico_4h",
            "fecha_cirugia", "fecha_llamada_48h", "medico_llamada_48h", "quien_atendio_48h",
            "fecha_llamada_d5", "medico_llamada_d5", "quien_atendio_d5",
            "observaciones_llamada1", "observaciones_llamada2", "cita_control", "estado",
        ];

        camposSimples.forEach((campo) => {
            const input = form.querySelector(`[name="${campo}"]`);
            if (input && r[campo] != null) input.value = r[campo];
        });

        form.querySelector('input[name="muestra_patologia"]').checked = !!r.muestra_patologia;

        const contactado48 = form.querySelector('select[name="contactado_48h"]');
        if (contactado48) contactado48.value = r.contactado_48h === true ? "true" : r.contactado_48h === false ? "false" : "";
        const contactadoD5 = form.querySelector('select[name="contactado_d5"]');
        if (contactadoD5) contactadoD5.value = r.contactado_d5 === true ? "true" : r.contactado_d5 === false ? "false" : "";

        escribirGrupo("herida_48h", r.sintomas_herida_48h);
        escribirGrupo("neuro_48h", r.sintomas_neuro_48h);
        escribirGrupo("herida_d5", r.sintomas_herida_d5);
        escribirGrupo("neuro_d5", r.sintomas_neuro_d5);

        actualizarSemaforoEnVivo("48h", "herida_48h", "neuro_48h");
        actualizarSemaforoEnVivo("d5", "herida_d5", "neuro_d5");
    } catch (error) {
        mostrarMensaje(`No se pudo cargar el registro: ${error.message}`, "error");
    }
}

precargarSiEdicion();
