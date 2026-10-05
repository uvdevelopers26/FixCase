// Debe reflejar exactamente backend/app/scoring.py. Este cálculo en el
// navegador es solo para dar feedback instantáneo; el valor que realmente
// se guarda siempre lo recalcula el servidor.

const PUNTOS_HERIDA = {
    fiebre: 2,
    dolor_intenso: 1,
    enrojecimiento: 1,
    herida_abierta: 2,
    secrecion: 2,
    inflamacion: 1,
    no_siguio_instrucciones: 1,
    no_completo_antibiotico: 1,
};

const PUNTOS_NEURO = {
    cefalea: 1,
    nauseas: 1,
    tinnitus: 1,
    vision_borrosa: 1,
    fotofobia: 1,
    dolor_rigidez_cuello: 2,
};

const UMBRAL_ALERTA_NEURO = 2;

const SEMAFORO_LABELS = {
    VERDE: "🟢 VERDE — SIN ALARMA",
    AMARILLO: "🟡 AMARILLO — SEGUIMIENTO",
    NARANJA: "🟠 NARANJA — SEGUIMIENTO PRIORITARIO",
    ROJO: "🔴 ROJO — REMITIR URGENTE",
};

function calcularSemaforoLocal(sintomasHerida, sintomasNeuro) {
    let puntaje = 0;
    for (const [campo, valor] of Object.entries(sintomasHerida)) {
        if (valor && PUNTOS_HERIDA[campo]) puntaje += PUNTOS_HERIDA[campo];
    }
    for (const [campo, valor] of Object.entries(sintomasNeuro)) {
        if (valor && PUNTOS_NEURO[campo]) puntaje += PUNTOS_NEURO[campo];
    }

    const alertasNeuro = Object.values(sintomasNeuro).filter(Boolean).length;

    let semaforo = "VERDE";
    if (puntaje >= 7) semaforo = "ROJO";
    else if (puntaje >= 5) semaforo = "NARANJA";
    else if (puntaje >= 3) semaforo = "AMARILLO";

    return {
        puntaje_total: puntaje,
        alertas_neuro: alertasNeuro,
        protocolo_neuro_activado: alertasNeuro >= UMBRAL_ALERTA_NEURO,
        semaforo,
        semaforo_label: SEMAFORO_LABELS[semaforo],
    };
}
