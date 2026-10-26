// ---------- Elementos del modal ----------
const modalOverlay=document.getElementById('modal-overlay');
const modalTitle=document.getElementById('modal-title');
const modalFields=document.getElementById('modal-fields');
const modalForm=document.getElementById('modal-form');
const modalError=document.getElementById('modal-error');
const modalSubmit=document.getElementById('modal-submit');
const btnNew=document.getElementById('btn-new');
const modalCard=document.querySelector('.modal-card');

// ---------- Render de campos ----------
// pro=true => diseño nuevo (asterisco rojo en obligatorios). Los demás modales no cambian.
function renderField(f,pro){
 const star=pro&&f.required?'<span class="req">*</span>':'';
 const label=`${star}${escapeHtml(f.label)}`;
 const max=f.maxlength?`maxlength="${Number(f.maxlength)}"`:'';
 const ph=f.placeholder?`placeholder="${escapeHtml(f.placeholder)}"`:'';
 if(f.type==='checkbox')return `<label class="checkbox-field"><input type="checkbox" id="f-${f.key}" name="${f.key}" ${f.default?'checked':''}>${escapeHtml(f.label)}</label>`;
 if(f.type==='combo'){const opts=(f.options||[]).map(o=>`<option value="${escapeHtml(typeof o==='object'?o.value:o)}"></option>`).join('');return `<div class="field ${f.full?'full':''}"><label for="f-${f.key}">${label}</label><input type="text" id="f-${f.key}" name="${f.key}" list="dl-${f.key}" autocomplete="off" ${max} ${ph} ${f.required?'required':''}><datalist id="dl-${f.key}">${opts}</datalist></div>`;}
 if(f.type==='select'){const opts=(f.options||[]).map(o=>`<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');return `<div class="field ${f.full?'full':''}"><label for="f-${f.key}">${label}</label><select id="f-${f.key}" name="${f.key}" ${f.required?'required':''}><option value="" disabled selected>Selecciona...</option>${opts}</select></div>`;}
 return `<div class="field ${f.full?'full':''}"><label for="f-${f.key}">${label}</label><input type="${f.type||'text'}" id="f-${f.key}" name="${f.key}" ${max} ${ph} ${f.required?'required':''}></div>`;
}

// Diseño por secciones: view.sections = [{ title, icon, fields:[...] }]
function renderSections(sections){
 return sections.map(s=>`<section class="modal-section"><div class="modal-section-head">${s.icon?`<span class="material-symbols-outlined">${escapeHtml(s.icon)}</span>`:''}<h3>${escapeHtml(s.title)}</h3></div><div class="modal-grid">${s.fields.map(f=>renderField(f,true)).join('')}</div></section>`).join('');
}

function setModalPro(on){
 if(!modalCard)return;
 modalCard.classList.toggle('modal-card-pro',!!on);
 // Botón "X" del encabezado (se crea una sola vez; el CSS lo muestra solo en el diseño nuevo)
 if(!modalCard.querySelector('.modal-close')){
  const x=document.createElement('button');
  x.type='button';x.className='modal-close';x.setAttribute('aria-label','Cerrar');
  x.innerHTML='<span class="material-symbols-outlined">close</span>';
  x.addEventListener('click',closeModal);
  modalCard.appendChild(x);
 }
}

function openCustomModal(title,html,onSubmit,submitLabel='Guardar',pro=false){
 if(modalCard)modalCard.classList.remove('modal-card-wide');
 setModalPro(pro);
 if(modalForm._customHandler)modalForm.removeEventListener('submit',modalForm._customHandler);
 modalTitle.textContent=title;modalError.style.display='none';modalError.textContent='';modalFields.innerHTML=html;modalForm.dataset.custom='true';modalSubmit.style.display=onSubmit?'block':'none';modalSubmit.textContent=submitLabel;modalSubmit.disabled=false;
 if(onSubmit){modalForm._customHandler=async e=>{e.preventDefault();modalError.style.display='none';modalSubmit.disabled=true;modalSubmit.textContent='Guardando...';try{await onSubmit();}catch(err){modalError.textContent=err.message||'No se pudo guardar.';modalError.style.display='block';}finally{modalSubmit.disabled=false;modalSubmit.textContent=submitLabel;}};modalForm.addEventListener('submit',modalForm._customHandler);}
 modalOverlay.classList.add('open');
}
function openModal(viewKey){
 if(typeof viewKey==='object'&&viewKey){const cfg=viewKey,secs=Array.isArray(cfg.sections)?cfg.sections:null,fields=secs?secs.flatMap(s=>s.fields):cfg.fields;openCustomModal(cfg.title,secs?renderSections(secs):fields.map(f=>renderField(f)).join(''),cfg.onSubmit?async()=>{const values={};fields.forEach(f=>{const el=document.getElementById(`f-${f.key}`);values[f.key]=f.type==='checkbox'?el.checked:el.value;});await cfg.onSubmit(values);closeModal();}:null,'Guardar',!!secs);fields.forEach(f=>{const el=document.getElementById(`f-${f.key}`);if(!el||!cfg.data||cfg.data[f.key]==null)return;if(f.type==='checkbox')el.checked=!!cfg.data[f.key];else el.value=cfg.data[f.key];});return;}
 const view=VIEWS[viewKey];if(!view||!view.createFields)return;
 const pro=Array.isArray(view.sections);
 if(modalCard)modalCard.classList.toggle('modal-card-wide',viewKey==='dhv');
 setModalPro(pro);
 if(modalForm._customHandler)modalForm.removeEventListener('submit',modalForm._customHandler);
 modalForm.dataset.custom='false';modalTitle.textContent=`Nuevo ${view.title.replace(/s$/,'')}`;modalError.style.display='none';modalForm.reset();modalSubmit.style.display='block';modalSubmit.textContent='Guardar';modalFields.innerHTML=pro?renderSections(view.sections):view.createFields.map(f=>renderField(f)).join('');
 view.createFields.forEach(f=>{if(f.onChange){const el=document.getElementById(`f-${f.key}`);if(el)el.addEventListener('change',e=>f.onChange(e.target.value));}});modalOverlay.classList.add('open');
}
function closeModal(){modalOverlay.classList.remove('open');if(modalForm._customHandler){modalForm.removeEventListener('submit',modalForm._customHandler);modalForm._customHandler=null;}modalForm.dataset.custom='false';modalSubmit.style.display='block';modalSubmit.textContent='Guardar';modalError.style.display='none';}
btnNew.addEventListener('click',()=>{const view=VIEWS[currentViewKey];if(view?.openNew)view.openNew();else openModal(currentViewKey);});
document.getElementById('modal-cancel').addEventListener('click',closeModal);
modalOverlay.addEventListener('click',e=>{if(e.target===modalOverlay)closeModal();});
modalForm.addEventListener('submit',async e=>{
 e.preventDefault();if(modalForm.dataset.custom==='true')return;
 const view=VIEWS[currentViewKey];modalError.style.display='none';modalSubmit.disabled=true;modalSubmit.textContent='Guardando...';const fd=new FormData(modalForm),payload={};
 view.createFields.forEach(f=>{let value=fd.get(f.key);if(f.type==='combo'&&typeof value==='string')value=value.trim();if(f.type==='checkbox')payload[f.key]=fd.has(f.key);else if(f.type==='number')payload[f.key]=value===''?null:Number(value);else payload[f.key]=value===''?null:value;});
 try{const res=await fetch(`${API_BASE}${view.endpoint}`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${getToken()}`},body:JSON.stringify(payload)});if(!res.ok){if(res.status===401){clearToken();showLogin();return;}const body=await res.json().catch(()=>null);throw new Error(body?.detail?JSON.stringify(body.detail):body?.error||'No se pudo guardar el registro.');}const saved=await res.json(),profile=document.getElementById('f-asunto_grupo')?.value,maintenance=document.getElementById('f-categoria_mantenimiento')?.value;closeModal();loadView(currentViewKey);if(currentViewKey==='tareas'&&profile&&maintenance&&window.checklistsModule)checklistsModule.iniciarAutomatico(saved.id,profile,maintenance);}catch(err){modalError.textContent=err.message;modalError.style.display='block';}finally{modalSubmit.disabled=false;modalSubmit.textContent='Guardar';}
});