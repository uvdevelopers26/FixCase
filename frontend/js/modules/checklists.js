/**
 * Módulo: Checklists
 * Maneja la lógica de visualización y actualización de las listas de chequeo.
 */
const checklistsModule = {

  /**
   * Se llama automáticamente cuando se crea una Tarea desde el modal de Tareas.
   * Busca la plantilla adecuada, crea la instancia y abre el modal.
   */
  iniciarAutomatico: async function(tareaId, perfil, mantenimiento) {
    try {
      console.log(`Iniciando auto-checklist para Tarea ${tareaId} (${perfil} - ${mantenimiento})`);

      // 1. Buscar la plantilla que coincida con el equipo y el tipo de trabajo
      const resMatch = await fetch(`${API_BASE}/checklists/plantillas/buscar-match/?perfil=${encodeURIComponent(perfil)}&mantenimiento=${encodeURIComponent(mantenimiento)}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      if (!resMatch.ok) {
        throw new Error("No se encontró una plantilla específica para este equipo y trabajo.");
      }
      const plantilla = await resMatch.json();

      // 2. Crear la instancia (el checklist real) para esta tarea
      const resInstancia = await fetch(`${API_BASE}/checklists/instancias/desde-plantilla`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          id_tarea: tareaId,
          id_plantilla: plantilla.id
        })
      });

      if (!resInstancia.ok) throw new Error("Error al generar la instancia del checklist.");
      const nuevaInstancia = await resInstancia.json();

      // 3. Renderizar el modal con el checklist
      // Usamos un pequeño delay para asegurar que el modal anterior se cerró completamente
      setTimeout(() => {
        this.renderizar(nuevaInstancia);
      }, 400);

    } catch (err) {
      console.warn("Checklist automático omitido:", err.message);
      // No bloqueamos al usuario con alertas intrusivas si falla el auto-inicio,
      // pero dejamos el log para debug.
    }
  },

  /**
   * Abre un checklist ya existente desde la tabla de tareas (botón 📋 Checklist).
   */
  abrirParaTarea: async function(tareaId) {
    try {
      const res = await fetch(`${API_BASE}/checklists/tareas/${tareaId}/instancias`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const instancias = await res.json();

      if (instancias.length === 0) {
        alert("Esta tarea no tiene un checklist iniciado. Por favor, asegúrese de que el activo y el tipo de mantenimiento tengan una plantilla configurada.");
        return;
      }

      // Renderizamos la instancia más reciente vinculada a la tarea
      this.renderizar(instancias[0]);
    } catch (err) {
      alert("Error al cargar checklist: " + err.message);
    }
  },

  /**
   * Dibuja los ítems del checklist dentro del modal genérico.
   */
  renderizar: function(instancia) {
    const fields = document.getElementById('modal-fields');
    const title = document.getElementById('modal-title');
    const sub = document.querySelector('#modal-overlay .modal-sub'); // antes: getElementById('modal-sub'), no existía
    const submitBtn = document.getElementById('modal-submit');

    title.textContent = "Checklist: " + instancia.nombre;
    if (sub) sub.textContent = "Marque los puntos completados para esta tarea.";

    // Ocultamos el botón de 'Guardar' del formulario normal
    // porque los ítems se guardan individualmente al hacer clic.
    submitBtn.style.display = 'none';

    let html = `<div class="checklist-container" style="display:flex; flex-direction:column; gap:8px; width:100%;">`;

    // Ordenamos los ítems por el campo 'orden' antes de mostrar
    const itemsOrdenados = [...instancia.items].sort((a, b) => a.orden - b.orden);

    itemsOrdenados.forEach(item => {
      html += `
        <label class="checklist-row ${item.completado ? 'done' : ''}" id="item-row-${item.id}"
               style="display:flex; align-items:center; gap:12px; padding:12px; background:var(--bg); border:1px solid var(--border); border-radius:8px; cursor:pointer;">
          <input type="checkbox" ${item.completado ? 'checked' : ''}
                 onchange="checklistsModule.toggleItem(${item.id}, this.checked)"
                 style="width:18px; height:18px; accent-color:var(--accent);">
          <span style="${item.completado ? 'text-decoration:line-through; opacity:0.6' : ''}">${item.texto}</span>
        </label>`;
    });

    html += `</div>`;

    fields.innerHTML = html;
    document.getElementById('modal-overlay').classList.add('open');
  },

  /**
   * Guarda el estado de un ítem en tiempo real.
   */
  toggleItem: async function(itemId, completado) {
    try {
      const res = await fetch(`${API_BASE}/checklists/instancias/items/${itemId}`, {  // antes: item_id (indefinido)
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ completado: completado })
      });

      if (res.ok) {
        const row = document.getElementById(`item-row-${itemId}`);
        const span = row.querySelector('span');
        if (completado) {
          row.classList.add('done');
          span.style.textDecoration = 'line-through';
          span.style.opacity = '0.6';
        } else {
          row.classList.remove('done');
          span.style.textDecoration = 'none';
          span.style.opacity = '1';
        }
      } else {
        alert("El servidor rechazó el cambio. No se guardó.");
      }
    } catch (err) {
      console.error("Error al guardar ítem:", err);
      alert("No se pudo guardar el cambio. Verifique la conexión.");
    }
  }
};