
// Control Horas Juan v2 - app_v2.js
const BASE_HOURS = 8;
const STORAGE_KEY = 'control_horas_v2';

// Utilities
function toYMD(d){ return new Date(d).toISOString().slice(0,10); }
function formatTimeISO(date){ return new Date(date).toTimeString().slice(0,8); }
function parseTimeToMinutes(t){ if(!t) return 0; const [h,m,s]=t.split(':').map(Number); return h*60 + m + (s>0? s/60 : 0); }
function minutesToHHMM(mins){ const h=Math.floor(mins/60); const m=Math.round(mins%60); return `${h}h ${m}m`; }
function decimalHours(mins){ return +(mins/60).toFixed(2); }

// State
let records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
// chrono state stored separately so it persists even if user closes tab
// morningStartISO and afternoonStartISO store ISO strings when chrono started
let morningStartISO = localStorage.getItem('ch_m_start') || null;
let afternoonStartISO = localStorage.getItem('ch_a_start') || null;
let morningInterval = null;
let afternoonInterval = null;

// Elements
const datePicker = document.getElementById('datePicker');
const chrono_m = document.getElementById('chrono_morning');
const chrono_a = document.getElementById('chrono_afternoon');
const in_m_btn = document.getElementById('in_morning_btn');
const out_m_btn = document.getElementById('out_morning_btn');
const in_a_btn = document.getElementById('in_afternoon_btn');
const out_a_btn = document.getElementById('out_afternoon_btn');
const total_today = document.getElementById('total_today');
const extra_today = document.getElementById('extra_today');
const export_month = document.getElementById('export_month');
const exportBtn = document.getElementById('exportBtn');
const clearAllBtn = document.getElementById('clearAll');

function saveRecords(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }

function ensureDate(){ if(!datePicker.value) datePicker.value = toYMD(new Date()); }

function getRecord(date){ return records.find(r=>r.date===date); }

function startChrono(which, iso){
  if(which==='morning'){ morningStartISO = iso; localStorage.setItem('ch_m_start', morningStartISO); startMorningInterval(); }
  else { afternoonStartISO = iso; localStorage.setItem('ch_a_start', afternoonStartISO); startAfternoonInterval(); }
}

function stopChrono(which){
  if(which==='morning'){ morningStartISO = null; localStorage.removeItem('ch_m_start'); stopMorningInterval(); chrono_m.innerText='00:00:00'; }
  else { afternoonStartISO = null; localStorage.removeItem('ch_a_start'); stopAfternoonInterval(); chrono_a.innerText='00:00:00'; }
}

function startMorningInterval(){
  if(morningInterval) clearInterval(morningInterval);
  morningInterval = setInterval(()=>{
    if(!morningStartISO) return;
    const diff = Math.floor((Date.now() - new Date(morningStartISO).getTime())/1000);
    chrono_m.innerText = new Date(diff*1000).toISOString().substr(11,8);
  }, 500);
}
function stopMorningInterval(){ if(morningInterval) { clearInterval(morningInterval); morningInterval=null; } }

function startAfternoonInterval(){
  if(afternoonInterval) clearInterval(afternoonInterval);
  afternoonInterval = setInterval(()=>{
    if(!afternoonStartISO) return;
    const diff = Math.floor((Date.now() - new Date(afternoonStartISO).getTime())/1000);
    chrono_a.innerText = new Date(diff*1000).toISOString().substr(11,8);
  }, 500);
}
function stopAfternoonInterval(){ if(afternoonInterval) { clearInterval(afternoonInterval); afternoonInterval=null; } }

// compute totals
function computeTotalsForDate(d){
  const rec = getRecord(d);
  if(!rec) return { totalMins:0, totalHours:0, extra:0 };
  const morningMins = rec.in_m && rec.out_m ? timeDiffInMinutes(rec.in_m, rec.out_m) : 0;
  const afternoonMins = rec.in_a && rec.out_a ? timeDiffInMinutes(rec.in_a, rec.out_a) : 0;
  const totalMins = Math.max(0, morningMins) + Math.max(0, afternoonMins);
  const totalHours = +(totalMins/60).toFixed(2);
  const extra = Math.max(0, +(totalHours - BASE_HOURS).toFixed(2));
  return { totalMins, totalHours, extra };
}

function timeDiffInMinutes(t1, t2){
  if(!t1 || !t2) return 0;
  const [h1,m1] = t1.split(':').map(Number);
  const [h2,m2] = t2.split(':').map(Number);
  return (h2*60 + m2) - (h1*60 + m1);
}

function renderSummary(d){
  const t = computeTotalsForDate(d);
  total_today.innerText = t.totalMins>0 ? minutesToHHMM(t.totalMins) + ` (${t.totalHours} h)` : '--';
  extra_today.innerText = t.extra + ' h';
}

function minutesToHHMM(mins){
  const h = Math.floor(mins/60); const m = Math.round(mins%60); return `${h}h ${m}m`;
}

function renderTable(){
  const tbody = document.querySelector('#recordsTable tbody'); tbody.innerHTML='';
  records.sort((a,b)=>b.date.localeCompare(a.date));
  records.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.date}</td><td>${r.in_m||'-'}</td><td>${r.out_m||'-'}</td><td>${r.in_a||'-'}</td><td>${r.out_a||'-'}</td><td>${r.total_hours||0} h</td><td>${r.extra_hours||0} h</td>
      <td><button class="small-btn" onclick="loadForEdit('${r.date}')">Editar</button> <button class="small-btn danger" onclick="deleteRecord('${r.date}')">Borrar</button></td>`;
    tbody.appendChild(tr);
  });
}

// load for edit
function loadForEdit(d){ const r = getRecord(d); if(!r) return; datePicker.value = r.date; renderSummary(r.date); alert('Fecha cargada. Puedes fichar manualmente para ese día.'); }
function deleteRecord(d){ if(!confirm('Eliminar registro ' + d + '?')) return; records = records.filter(x=>x.date!==d); saveRecords(); renderTable(); renderSummary(datePicker.value); }

// record actions
function recordAction(type){
  ensureDate();
  const d = datePicker.value;
  let rec = getRecord(d);
  if(!rec){ rec = { date: d, in_m:null, out_m:null, in_a:null, out_a:null, total_hours:0, extra_hours:0 }; records.push(rec); }
  const now = new Date();
  const t = now.toTimeString().slice(0,8);
  if(type==='in_m'){
    if(rec.in_m){ alert('Ya existe entrada mañana.'); return; }
    rec.in_m = t;
    // start persistent chrono
    startChrono('morning', now.toISOString());
    saveRecords(); renderTable(); renderSummary(d);
  } else if(type==='out_m'){
    if(!rec.in_m){ alert('No hay entrada mañana.'); return; }
    if(rec.out_m){ alert('Ya existe salida mañana.'); return; }
    rec.out_m = t;
    // stop chrono and update totals
    // compute using stored times; if chrono was running, compute from morningStartISO if needed
    stopChrono('morning');
    const totals = computeTotalsForDate(d);
    rec.total_hours = totals.totalHours;
    rec.extra_hours = totals.extra;
    saveRecords(); renderTable(); renderSummary(d);
  } else if(type==='in_a'){
    if(rec.in_a){ alert('Ya existe entrada tarde.'); return; }
    rec.in_a = t;
    startChrono('afternoon', now.toISOString());
    saveRecords(); renderTable(); renderSummary(d);
  } else if(type==='out_a'){
    if(!rec.in_a){ alert('No hay entrada tarde.'); return; }
    if(rec.out_a){ alert('Ya existe salida tarde.'); return; }
    rec.out_a = t;
    stopChrono('afternoon');
    const totals = computeTotalsForDate(d);
    rec.total_hours = totals.totalHours;
    rec.extra_hours = totals.extra;
    saveRecords(); renderTable(); renderSummary(d);
    alert('Día guardado automáticamente ✅');
  }
}

// export month
function exportMonth(){
  const v = export_month.value; if(!v){ alert('Selecciona un mes.'); return; }
  const [y,m] = v.split('-').map(Number);
  const filtered = records.filter(r=>{ const d = new Date(r.date + 'T00:00:00'); return d.getFullYear()===y && (d.getMonth()+1)===m; });
  if(filtered.length===0){ alert('No hay registros en ese mes.'); return; }
  const ws_data = [['Fecha','Entrada mañana','Salida mañana','Entrada tarde','Salida tarde','Total horas (h)','Horas extra (h)']];
  filtered.forEach(r=> ws_data.push([r.date, r.in_m||'', r.out_m||'', r.in_a||'', r.out_a||'', r.total_hours||0, r.extra_hours||0]));
  try{
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Horas');
    const wbout = XLSX.write(wb, {bookType:'xlsx', type:'array'});
    const blob = new Blob([wbout],{type:'application/octet-stream'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `control_horas_v2_${v}.xlsx`;
    document.body.appendChild(link); link.click(); link.remove();
  }catch(e){ alert('Error exportando: ' + e); }
}

// init on load
(function(){
  const today = new Date();
  datePicker.value = toYMD(today);
  export_month.value = today.toISOString().slice(0,7);
  // if chrono start times exist in localStorage, resume intervals
  if(localStorage.getItem('ch_m_start')){ morningStartISO = localStorage.getItem('ch_m_start'); startMorningInterval(); }
  if(localStorage.getItem('ch_a_start')){ afternoonStartISO = localStorage.getItem('ch_a_start'); startAfternoonInterval(); }
  renderTable(); renderSummary(datePicker.value);
})();

// attach events
in_m_btn.addEventListener('click', ()=>recordAction('in_m'));
out_m_btn.addEventListener('click', ()=>recordAction('out_m'));
in_a_btn.addEventListener('click', ()=>recordAction('in_a'));
out_a_btn.addEventListener('click', ()=>recordAction('out_a'));
exportBtn.addEventListener('click', exportMonth);
clearAllBtn.addEventListener('click', ()=>{ if(confirm('Borrar todos los registros?')){ records=[]; saveRecords(); renderTable(); renderSummary(datePicker.value); } });

// expose functions for table buttons
window.loadForEdit = loadForEdit;
window.deleteRecord = deleteRecord;

// service worker registration
if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
