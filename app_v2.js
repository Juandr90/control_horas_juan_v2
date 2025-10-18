// Control Horas Juan v2 - app_v2.js (SpreadsheetML export)
const BASE_HOURS = 8;
const STORAGE_KEY = 'control_horas_v2';

function toYMD(d){ return new Date(d).toISOString().slice(0,10); }
function formatTime(date){ return date.toTimeString().slice(0,8); }
function timeDiffInMinutes(t1, t2){ if(!t1||!t2) return 0; const [h1,m1]=t1.split(':').map(Number); const [h2,m2]=t2.split(':').map(Number); return (h2*60+m2)-(h1*60+m1); }
function minsToHHMM(mins){ const h=Math.floor(mins/60); const m=Math.round(mins%60); return `${h}h ${m}m`; }

let records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let ch_m_start = localStorage.getItem('ch_m_start') || null;
let ch_a_start = localStorage.getItem('ch_a_start') || null;
let mInterval=null, aInterval=null;

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

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }

function ensureDate(){ if(!datePicker.value) datePicker.value = toYMD(new Date()); }

function getRec(d){ return records.find(r=>r.date===d); }

function startChrono(which, iso){ if(which==='m'){ ch_m_start=iso; localStorage.setItem('ch_m_start', iso); startMInterval(); } else { ch_a_start=iso; localStorage.setItem('ch_a_start', iso); startAInterval(); } }
function stopChrono(which){ if(which==='m'){ ch_m_start=null; localStorage.removeItem('ch_m_start'); stopMInterval(); chrono_m.innerText='00:00:00'; } else { ch_a_start=null; localStorage.removeItem('ch_a_start'); stopAInterval(); chrono_a.innerText='00:00:00'; } }

function startMInterval(){ if(mInterval) clearInterval(mInterval); mInterval=setInterval(()=>{ if(!ch_m_start) return; const diff=Math.floor((Date.now()-new Date(ch_m_start))/1000); chrono_m.innerText=new Date(diff*1000).toISOString().substr(11,8); },500); }
function stopMInterval(){ if(mInterval){ clearInterval(mInterval); mInterval=null; } }
function startAInterval(){ if(aInterval) clearInterval(aInterval); aInterval=setInterval(()=>{ if(!ch_a_start) return; const diff=Math.floor((Date.now()-new Date(ch_a_start))/1000); chrono_a.innerText=new Date(diff*1000).toISOString().substr(11,8); },500); }
function stopAInterval(){ if(aInterval){ clearInterval(aInterval); aInterval=null; } }

function computeTotals(d){ const r=getRec(d); if(!r) return {totalMins:0,totalHours:0,extra:0}; const mM=r.in_m&&r.out_m?timeDiffInMinutes(r.in_m,r.out_m):0; const aM=r.in_a&&r.out_a?timeDiffInMinutes(r.in_a,r.out_a):0; const totalM=Math.max(0,mM)+Math.max(0,aM); const totalH=+(totalM/60).toFixed(2); const extra=Math.max(0, +(totalH-BASE_HOURS).toFixed(2)); return {totalMins:totalM,totalHours:totalH,extra}; }

function renderSummary(d){ const t=computeTotals(d); total_today.innerText = t.totalMins>0? minsToHHMM(t.totalMins)+` (${t.totalHours} h)` : '--'; extra_today.innerText = t.extra + ' h'; }

function renderTable(){ const tbody=document.querySelector('#recordsTable tbody'); tbody.innerHTML=''; records.sort((a,b)=>b.date.localeCompare(a.date)); records.forEach(r=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${r.date}</td><td>${r.in_m||'-'}</td><td>${r.out_m||'-'}</td><td>${r.in_a||'-'}</td><td>${r.out_a||'-'}</td><td>${r.total_hours||0} h</td><td>${r.extra_hours||0} h</td><td><button class="small-btn" onclick="loadForEdit('${r.date}')">Editar</button> <button class="small-btn danger" onclick="deleteRecord('${r.date}')">Borrar</button></td>`; tbody.appendChild(tr); }); }

function loadForEdit(d){ const r=getRec(d); if(!r) return; datePicker.value=r.date; renderSummary(r.date); alert('Fecha cargada.'); }
function deleteRecord(d){ if(!confirm('Eliminar '+d+'?')) return; records=records.filter(x=>x.date!==d); save(); renderTable(); renderSummary(datePicker.value); }

function recordAction(type){ ensureDate(); const d=datePicker.value; let r=getRec(d); if(!r){ r={date:d,in_m:null,out_m:null,in_a:null,out_a:null,total_hours:0,extra_hours:0}; records.push(r);} const now=new Date(); const t=now.toTimeString().slice(0,8); if(type==='in_m'){ if(r.in_m){ alert('Ya entrada mañana.'); return;} r.in_m=t; startChrono('m', now.toISOString()); save(); renderTable(); renderSummary(d);} else if(type==='out_m'){ if(!r.in_m){ alert('No hay entrada mañana.'); return;} if(r.out_m){ alert('Ya salida mañana.'); return;} r.out_m=t; stopChrono('m'); const totals=computeTotals(d); r.total_hours=totals.totalHours; r.extra_hours=totals.extra; save(); renderTable(); renderSummary(d);} else if(type==='in_a'){ if(r.in_a){ alert('Ya entrada tarde.'); return;} r.in_a=t; startChrono('a', now.toISOString()); save(); renderTable(); renderSummary(d);} else if(type==='out_a'){ if(!r.in_a){ alert('No hay entrada tarde.'); return;} if(r.out_a){ alert('Ya salida tarde.'); return;} r.out_a=t; stopChrono('a'); const totals=computeTotals(d); r.total_hours=totals.totalHours; r.extra_hours=totals.extra; save(); renderTable(); renderSummary(d); alert('Día guardado automáticamente ✅'); } }

// Export: SpreadsheetML (.xls) with one sheet named "Mes Año"
function exportMonth(){
  const v=export_month.value; if(!v){ alert('Selecciona un mes'); return; }
  const [y,m]=v.split('-').map(Number);
  const filtered = records.filter(r=>{ const d=new Date(r.date+'T00:00:00'); return d.getFullYear()===y && (d.getMonth()+1)===m; });
  if(filtered.length===0){ alert('No hay registros en ese mes'); return; }

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const sheetName = monthNames[m-1] + ' ' + y;

  let rows = '';
  const headers = ['Fecha','Entrada mañana','Salida mañana','Entrada tarde','Salida tarde','Total horas (h)','Horas extra (h)'];
  rows += '<Row>' + headers.map(h=>' <Cell><Data ss:Type="String">'+h+'</Data></Cell>').join('') + '</Row>';
  filtered.forEach(r=>{
    rows += '<Row>' +
      `<Cell><Data ss:Type="String">${r.date}</Data></Cell>` +
      `<Cell><Data ss:Type="String">${r.in_m||''}</Data></Cell>` +
      `<Cell><Data ss:Type="String">${r.out_m||''}</Data></Cell>` +
      `<Cell><Data ss:Type="String">${r.in_a||''}</Data></Cell>` +
      `<Cell><Data ss:Type="String">${r.out_a||''}</Data></Cell>` +
      `<Cell><Data ss:Type="Number">${r.total_hours||0}</Data></Cell>` +
      `<Cell><Data ss:Type="Number">${r.extra_hours||0}</Data></Cell>` +
      '</Row>';
  });

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${sheetName}"><Table>${rows}</Table></Worksheet>
</Workbook>`;

  const blob = new Blob([xml], {type: 'application/vnd.ms-excel'});
  const fname = `Control_Horas_Juan_v2_${y}-${String(m).padStart(2,'0')}.xls`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fname;
  document.body.appendChild(link); link.click(); link.remove();
}

document.addEventListener('DOMContentLoaded', ()=>{
  const today=new Date(); datePicker.value=toYMD(today); export_month.value=today.toISOString().slice(0,7);
  if(localStorage.getItem('ch_m_start')){ ch_m_start=localStorage.getItem('ch_m_start'); startMInterval(); }
  if(localStorage.getItem('ch_a_start')){ ch_a_start=localStorage.getItem('ch_a_start'); startAInterval(); }
  renderTable(); renderSummary(datePicker.value);
});

in_m_btn.addEventListener('click', ()=>recordAction('in_m'));
out_m_btn.addEventListener('click', ()=>recordAction('out_m'));
in_a_btn.addEventListener('click', ()=>recordAction('in_a'));
out_a_btn.addEventListener('click', ()=>recordAction('out_a'));

exportBtn.addEventListener('click', exportMonth);
clearAllBtn.addEventListener('click', ()=>{ if(confirm('Borrar todo?')){ records=[]; save(); renderTable(); renderSummary(datePicker.value); } });

window.loadForEdit=loadForEdit;
window.deleteRecord=deleteRecord;

if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
