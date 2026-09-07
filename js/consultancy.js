/* consultancy.js
   Consultancy module: dashboard, add service, update payment, tools, and its exports.
   Part of the Boboda Business Dashboard. Loaded in order by index.html.
   Shared helpers live in core.js; edit a module file to change that module. */

/* --- module registration (Consultancy) --- */
const CONS_TABS=[["Dashboard","dash"],["Add Service","plus"],["Update Payment","coin"],["Tools","tools"]];
const CONSUI={year:new Date().getFullYear(), payId:""};
let NCS=null;   // new/edit consultancy form scratch
registerModule({id:"consultancy",icon:"file",name:"Consultancy",live:true,title:"Consultancy Services"},
  renderConsultancy);


/* ============================================================================
   CONSULTANCY SERVICES MODULE
   A self-contained module for tracking consultancy contracts, their payments
   and earnings. Data lives in DB().consultancy and syncs/back-ups like the rest.
   ========================================================================== */
const CLIENT_TYPES=["NGO","Individual","Public Institution"];
const CONTRACT_TYPES=["Data analysis","Report writing","Data collection","Report design"];
const PAYMENT_TYPES=["One-time payment","Instalment","Per diem"];
const CTYPE_COLORS={"Data analysis":"#1f77b4","Report writing":"#ff7f0e",
  "Data collection":"#2ca02c","Report design":"#d62728"};
let PAYNEW={amount:"",date:today(),note:""};

const blankConsultancy=()=>({id:"",client:"",clientType:"NGO",project:"",focal:"",phone:"",email:"",
  durationType:"One-time",startDate:"",endDate:"",contractTypes:[],paymentType:"One-time payment",
  expected:"",withholdTax:false,status:"active",payments:[],createdAt:""});

function genConId(){
  const ch="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const ex=new Set((DB().consultancy||[]).map(c=>c.id));
  let id; do{ id="CONTR-"+Array.from({length:4},()=>ch[Math.floor(Math.random()*ch.length)]).join(""); }
  while(ex.has(id));
  return id;
}
/* Per-contract money view. WHT (5%) is treated as tax withheld at source, so the
   amount you actually collect ("net") is expected minus tax; outstanding is net
   minus what has been paid. Contracts with no expected amount show n/a. */
function conRollup(c){
  const gross=numOf(c.expected)||0;
  const tax=c.withholdTax?Math.round(gross*0.05):0;
  const net=gross-tax;
  const paid=(c.payments||[]).reduce((a,p)=>a+(numOf(p.amount)||0),0);
  const hasExp=gross>0;
  return {c,gross,tax,net,paid,hasExp,outstanding:hasExp?net-paid:0};
}
const conAll=()=>(DB().consultancy||[]).map(conRollup);
const conStatusWord=s=>s==="completed"?"Completed":(s==="terminated"?"Terminated":"Active");
const conStatusPill=s=>s==="completed"?'<span class="pill b">Completed</span>'
  :(s==="terminated"?'<span class="pill r">Terminated</span>':'<span class="pill g">Active</span>');

function renderConsultancy(m,el){
  el.innerHTML='<h1 class="pg">'+esc(m.title)+'</h1>'+
    '<div class="meta">Track consultancy contracts, payments and earnings.</div>'+
    (canEdit()?"":'<div class="banner warn" style="margin-top:12px">'+ic("lock")+
      ' <b>View only.</b> This account cannot add or change consultancy records.</div>')+
    '<div class="tabs">'+CONS_TABS.map((t,i)=>
      '<button data-tab="'+i+'" aria-selected="'+(i===TAB)+'">'+ic(t[1],15)+t[0]+'</button>').join("")+'</div>'+
    '<div id="tabBody">'+[conDashboard,conAdd,conPay,conTools][TAB]()+'</div>'+
    '<div class="foot">Developer: Adam Kamese \u00B7 Consultancy module</div>';
}
function conRefresh(){ const b=document.getElementById("tabBody");
  if(b) b.innerHTML=[conDashboard,conAdd,conPay,conTools][TAB](); }

/* ---- Tab 0: Dashboard ---- */
function conDashboard(){
  const R=conAll();
  const expNet=R.reduce((a,r)=>a+r.net,0), gross=R.reduce((a,r)=>a+r.gross,0);
  const tax=R.reduce((a,r)=>a+r.tax,0), paid=R.reduce((a,r)=>a+r.paid,0);
  const outstanding=R.reduce((a,r)=>a+r.outstanding,0);
  const cats=CLIENT_TYPES;
  const series=CONTRACT_TYPES.map(ct=>({name:ct,color:CTYPE_COLORS[ct],
    values:cats.map(clt=>R.filter(r=>r.c.clientType===clt&&(r.c.contractTypes||[]).indexOf(ct)>=0).length)}));
  const yr=CONSUI.year, monthly=Array(12).fill(0);
  R.forEach(r=>(r.c.payments||[]).forEach(p=>{
    if(p.date&&Number(String(p.date).slice(0,4))===yr){
      const mi=Number(String(p.date).slice(5,7))-1; if(mi>=0&&mi<12) monthly[mi]+=numOf(p.amount)||0; }}));
  const years=[]; for(let y=2024;y<=new Date().getFullYear()+1;y++) years.push(y);
  const q=TXT.con||"";
  const rows=R.slice().sort((a,b)=>String(b.c.createdAt||"").localeCompare(String(a.c.createdAt||"")))
    .filter(r=>matches([r.c.id,r.c.client,r.c.clientType,r.c.project].join(" "),q))
    .map(r=>[esc(r.c.id),esc(r.c.client||"\u2014"),esc(r.c.clientType),
      {n:money(r.net)},{n:money(r.paid)},r.hasExp?bal(-r.outstanding):{n:"\u2014"},
      conStatusPill(r.c.status),
      '<button class="btn sm" data-act="viewCon" data-id="'+r.c.id+'">'+ic("eye",13)+' View</button>'+
      (canEdit()?' <button class="btn sm" data-act="payCon" data-id="'+r.c.id+'">'+ic("coin",13)+' Pay</button>':"")]);
  return '<div class="kpis">'+
      kpi("k2","Total Consultancy Contracts",String(R.length))+
      kpi("k3","Expected Amount (TZS)",money(expNet),
        tax>0?"Gross "+money(gross)+" \u00B7 WHT "+money(tax):"After any 5% WHT")+
      kpi("k1","Paid Amount (TZS)",money(paid))+
      kpi("k4","Outstanding Amount (TZS)",money(outstanding))+
    '</div>'+
    (canEdit()?'<div class="btnrow" style="margin-top:14px">'+
      '<button class="btn pri" data-act="goConAdd">'+ic("plus")+' Add consultancy service</button></div>':"")+
    '<div class="grid2" style="margin-top:16px">'+
      '<div class="card"><h3 class="sec" style="margin-top:0">Contract types by client type</h3>'+
        barChart(cats,series,{w:460,h:300})+'</div>'+
      '<div class="card"><h3 class="sec" style="margin-top:0">Earnings trend '+yr+
        ' <select class="i" data-conyear style="width:auto;display:inline-block;margin-left:8px;padding:4px 8px">'+
        years.map(y=>'<option'+(y===yr?" selected":"")+'>'+y+'</option>').join("")+'</select></h3>'+
        barChart(MONS,[{name:"Paid (TZS)",color:CGREEN,values:monthly}],{w:460,h:300})+'</div>'+
    '</div>'+
    '<h3 class="sec">Recent contracts</h3>'+
    filterBox("con","Filter by contract ID, client, project\u2026")+
    table(["Contract ID","Client","Client Type","Expected","Paid","Outstanding","Status",""],rows);
}

/* ---- Tab 1: Add / edit a consultancy service ---- */
function conAdd(){
  if(!canEdit()) return '<div class="banner warn">'+ic("lock")+' You have view-only access to this module.</div>';
  if(!NCS){ NCS=blankConsultancy(); NCS.id=genConId(); }
  const f=NCS, editing=(DB().consultancy||[]).some(x=>x.id===f.id);
  const gross=numOf(f.expected)||0, tax=f.withholdTax?Math.round(gross*0.05):0;
  const chk=(v,label,ds)=>'<label class="chk"><input type="checkbox" '+ds+(v?" checked":"")+'> '+label+'</label>';
  return '<div class="card" style="max-width:720px">'+
    '<h3 class="sec" style="margin-top:0">'+(editing?"Edit consultancy service":"Add new consultancy service")+'</h3>'+
    '<div class="grid2">'+
      '<div><label class="f">Contract ID</label><input class="i" value="'+esc(f.id)+'" readonly></div>'+
      '<div><label class="f">Client Type</label><select class="i" data-ncf="clientType">'+
        CLIENT_TYPES.map(t=>'<option'+(f.clientType===t?" selected":"")+'>'+t+'</option>').join("")+'</select></div>'+
    '</div>'+
    '<label class="f">Name of client <span class="req">*</span></label>'+
      '<input class="i" data-ncf="client" value="'+esc(f.client)+'" placeholder="e.g. Save the Children">'+
    '<label class="f">Name of the project (consultation)</label>'+
      '<input class="i" data-ncf="project" value="'+esc(f.project)+'" placeholder="e.g. Baseline survey report">'+
    '<div class="grid3">'+
      '<div><label class="f">Contract focal person</label><input class="i" data-ncf="focal" value="'+esc(f.focal)+'"></div>'+
      '<div><label class="f">Contract phone number</label><input class="i" data-ncf="phone" value="'+esc(f.phone)+'"></div>'+
      '<div><label class="f">Contract email</label><input class="i" data-ncf="email" value="'+esc(f.email)+'" placeholder="name@org.org"></div>'+
    '</div>'+
    '<label class="f">Contract duration</label>'+
      '<select class="i" data-ncf="durationType">'+["One-time","Period"].map(t=>
        '<option'+(f.durationType===t?" selected":"")+'>'+t+'</option>').join("")+'</select>'+
    (f.durationType==="Period"?'<div class="grid2">'+
      '<div><label class="f">From</label><input class="i" type="date" data-ncf="startDate" value="'+(f.startDate||"")+'"></div>'+
      '<div><label class="f">To</label><input class="i" type="date" data-ncf="endDate" value="'+(f.endDate||"")+'"></div>'+
    '</div>':"")+
    '<label class="f">Type of contract(s)</label>'+
    '<div style="display:flex;flex-wrap:wrap;gap:6px 18px">'+CONTRACT_TYPES.map(t=>
      chk(f.contractTypes.indexOf(t)>=0,t,'data-ncct="'+t+'"')).join("")+'</div>'+
    '<label class="f" style="margin-top:12px">Type of payment</label>'+
      '<select class="i" data-ncf="paymentType">'+PAYMENT_TYPES.map(t=>
        '<option'+(f.paymentType===t?" selected":"")+'>'+t+'</option>').join("")+'</select>'+
    '<label class="f">Expected paid amount (TZS) <span class="hint" style="display:inline">(optional)</span></label>'+
      '<input class="i num" type="text" inputmode="numeric" data-numeric="1" data-ncf="expected" value="'+
        esc(f.expected)+'" placeholder="e.g. 5000000"><div class="echo">'+
        (String(f.expected).length?money(gross):"")+'</div>'+
    chk(f.withholdTax,"Withhold TAX (5%)",'data-ncf="withholdTax"')+
    (f.withholdTax&&gross>0?'<div class="hint">WHT 5% = <b>'+money(tax)+
      '</b> \u00B7 net expected = <b>'+money(gross-tax)+'</b></div>':"")+
    '<div class="btnrow" style="margin-top:18px">'+
      '<button class="btn pri" data-act="saveConsultancy">'+ic("check")+
        (editing?" Save changes":" Add service")+'</button>'+
      '<button class="btn" data-act="conNew">'+ic("plus")+' New / clear</button></div>'+
  '</div>';
}
function refreshConForm(){
  const b=document.getElementById("tabBody"), a=document.activeElement;
  const k=a&&a.dataset?a.dataset.ncf:null, pos=a&&a.selectionStart;
  if(!b) return; b.innerHTML=conAdd();
  if(k){ const n=b.querySelector('[data-ncf="'+k+'"]');
    if(n){ n.focus(); try{ if(pos!=null&&n.setSelectionRange) n.setSelectionRange(pos,pos); }catch(e){} } }
}
function saveConsultancy(){
  if(!guard()) return; const f=NCS; if(!f) return;
  if(!(f.client||"").trim()) return alert("Enter the client name.");
  if(f.durationType==="Period"){
    if(!f.startDate||!f.endDate) return alert("Select the start and end dates for the period.");
    if(dayNum(f.endDate)<dayNum(f.startDate)) return alert("The period end date is before the start date."); }
  if(f.email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim()))
    return alert("Enter a valid email address, or leave it blank.");
  const rec={id:f.id||genConId(),client:f.client.trim(),clientType:f.clientType,
    project:(f.project||"").trim(),focal:(f.focal||"").trim(),phone:(f.phone||"").trim(),
    email:(f.email||"").trim(),durationType:f.durationType,
    startDate:f.durationType==="Period"?f.startDate:"",endDate:f.durationType==="Period"?f.endDate:"",
    contractTypes:(f.contractTypes||[]).slice(),paymentType:f.paymentType,expected:numOf(f.expected)||0,
    withholdTax:!!f.withholdTax,status:f.status||"active",payments:f.payments||[],
    createdAt:f.createdAt||new Date().toISOString()};
  const db=DB(), i=db.consultancy.findIndex(x=>x.id===rec.id);
  const done=()=>{ if(i>=0) db.consultancy[i]=rec; else db.consultancy.push(rec);
    save(); NCS=null; TAB=0; render();
    alert(i>=0?"Consultancy contract updated.":"Consultancy contract added ("+rec.id+")."); };
  if(i>=0) requirePin("update this consultancy contract",done); else done();
}
function editConsultancy(id){
  const c=(DB().consultancy||[]).find(x=>x.id===id); if(!c) return;
  NCS=Object.assign(blankConsultancy(),JSON.parse(JSON.stringify(c)));
  NCS.expected=String(c.expected||""); TAB=1; render();
}
function deleteConsultancy(id){
  const c=(DB().consultancy||[]).find(x=>x.id===id); if(!c) return;
  requirePin("delete this consultancy contract",()=>{
    const db=DB(); db.consultancy=db.consultancy.filter(x=>x.id!==id);
    save(); if(CONSUI.payId===id) CONSUI.payId=""; render(); alert("Consultancy contract deleted."); });
}

/* ---- Tab 2: Update payment ---- */
function conPay(){
  if(!canEdit()) return '<div class="banner warn">'+ic("lock")+' You have view-only access to this module.</div>';
  const list=DB().consultancy||[];
  if(!list.length) return '<div class="empty"><b>No consultancy contracts yet</b>'+
    'Add a service first, then record payments against it.</div>'+
    '<div class="btnrow" style="margin-top:14px;justify-content:center">'+
    '<button class="btn pri" data-act="goConAdd">'+ic("plus")+' Add service</button></div>';
  const c=list.find(x=>x.id===CONSUI.payId)||list[0];
  const r=conRollup(c), rem=r.hasExp?r.net-r.paid:null;
  const after=rem!=null?rem-(numOf(PAYNEW.amount)||0):null;
  return '<div class="card" style="max-width:780px">'+
    '<label class="f">Select contract</label>'+
    '<select class="i" data-conpick>'+list.map(x=>'<option value="'+x.id+'"'+(x.id===c.id?" selected":"")+'>'+
      esc(x.id+"  \u00B7  "+(x.client||"")+(x.project?"  \u2014  "+x.project:""))+'</option>').join("")+'</select>'+
    '<div class="kpis" style="margin-top:14px;grid-template-columns:1fr 1fr 1fr">'+
      kpi("k3","Expected (TZS)",r.hasExp?money(r.net):"\u2014")+
      kpi("k1","Paid (TZS)",money(r.paid))+
      kpi("k4","Remaining (TZS)",rem==null?"\u2014":money(rem))+'</div>'+
    '<h3 class="sec">Record a payment</h3>'+
    '<div class="grid3">'+
      '<div><label class="f">Paid amount (TZS) <span class="req">*</span></label>'+
        '<input class="i num" type="text" inputmode="numeric" data-numeric="1" data-payf="amount" value="'+
        esc(PAYNEW.amount)+'" placeholder="e.g. 500000"><div class="echo">'+
        (String(PAYNEW.amount).length?money(numOf(PAYNEW.amount)):"")+'</div></div>'+
      '<div><label class="f">Paid date</label>'+
        '<input class="i" type="date" data-payf="date" value="'+(PAYNEW.date||today())+'" max="'+today()+'"></div>'+
      '<div><label class="f">Note (optional)</label>'+
        '<input class="i" data-payf="note" value="'+esc(PAYNEW.note||"")+'" placeholder="e.g. 1st instalment"></div>'+
    '</div>'+
    (after!=null&&String(PAYNEW.amount).length?'<div class="hint">After this payment, remaining would be <b>'+
      money(after)+'</b>.</div>':"")+
    '<div class="btnrow" style="margin-top:8px">'+
      '<button class="btn pri" data-act="addConPay" data-id="'+c.id+'">'+ic("plus")+' Add payment</button></div>'+
    '<h3 class="sec">Contract status</h3>'+
    '<div class="btnrow">'+["active","completed","terminated"].map(s=>
      '<button class="btn'+(c.status===s?" pri":"")+'" data-act="conStatus" data-id="'+c.id+'" data-s="'+s+'">'+
      conStatusWord(s)+'</button>').join("")+'</div>'+
    '<h3 class="sec">Payments</h3>'+
    ((c.payments||[]).length?table(["Date","Amount","Note",""],
      c.payments.slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).map(p=>
        [p.date?fmtDate(p.date):"\u2014",{n:money(numOf(p.amount))},esc(p.note||"\u2014"),
         '<button class="btn sm dang" data-act="delConPay" data-id="'+c.id+'" data-pid="'+p.id+'">'+
         ic("trash",13)+'</button>'])):'<div class="hint">No payments recorded yet.</div>')+
    '<div class="btnrow" style="margin-top:16px">'+
      '<button class="btn" data-act="editCon" data-id="'+c.id+'">'+ic("pencil",14)+' Edit details</button>'+
      '<button class="btn dang" data-act="delCon" data-id="'+c.id+'">'+ic("trash",14)+' Delete contract</button></div>'+
  '</div>';
}
function refreshConPay(){
  const b=document.getElementById("tabBody"), a=document.activeElement;
  const k=a&&a.dataset?a.dataset.payf:null, pos=a&&a.selectionStart;
  if(!b) return; b.innerHTML=conPay();
  if(k){ const n=b.querySelector('[data-payf="'+k+'"]');
    if(n){ n.focus(); try{ if(pos!=null&&n.setSelectionRange) n.setSelectionRange(pos,pos); }catch(e){} } }
}
function addConPay(id){
  if(!guard()) return;
  const c=(DB().consultancy||[]).find(x=>x.id===id); if(!c) return;
  const amt=numOf(PAYNEW.amount)||0;
  if(!(amt>0)) return alert("Enter a payment amount greater than zero.");
  if(PAYNEW.date&&dayNum(PAYNEW.date)>dayNum(today())) return alert("The paid date cannot be in the future.");
  c.payments=c.payments||[];
  c.payments.push({id:uid(),amount:amt,date:PAYNEW.date||today(),note:(PAYNEW.note||"").trim()});
  PAYNEW={amount:"",date:today(),note:""}; save(); conRefresh();
}
function delConPay(id,pid){
  const c=(DB().consultancy||[]).find(x=>x.id===id); if(!c) return;
  requirePin("delete this payment",()=>{ c.payments=(c.payments||[]).filter(p=>p.id!==pid);
    save(); conRefresh(); });
}
function conSetStatus(id,s){
  if(!guard()) return; const c=(DB().consultancy||[]).find(x=>x.id===id); if(!c) return;
  c.status=s; save(); conRefresh();
}

/* ---- Tab 3: Tools & suggestions ---- */
function conTools(){
  const R=conAll();
  const active=R.filter(r=>r.c.status==="active").length;
  const withExp=R.filter(r=>r.hasExp);
  const owing=withExp.filter(r=>r.outstanding>0).length;
  const totalTax=R.reduce((a,r)=>a+r.tax,0);
  const perDiem=R.filter(r=>r.c.paymentType==="Per diem").length;
  const overdue=R.filter(r=>r.hasExp&&r.outstanding>0&&r.c.durationType==="Period"&&
    r.c.endDate&&dayNum(r.c.endDate)<dayNum(today())).length;
  const sug=[
    ["coin","Outstanding-payment reminders","You have "+owing+" contract(s) with money still owed"+
      (overdue?" and "+overdue+" past their end date":"")+". A weekly reminder of unpaid balances keeps collections on track."],
    ["file","Withholding-tax (WHT) report","WHT withheld so far totals "+money(totalTax)+
      ". A per-client tax summary makes it easy to reconcile the 5% at filing time."],
    ["deposit","Instalment schedules","For instalment contracts, planned due dates with a paid/overdue flag turn 'Update payment' into a follow-up list."],
    ["chart","Per-diem day log","You have "+perDiem+" per-diem contract(s). Logging days worked \u00D7 rate would auto-fill the expected amount and daily earnings."],
    ["people","Client directory","Group contracts by client to see lifetime value per NGO / institution and repeat-business trends."],
    ["printer","Invoices & receipts","Generate a branded invoice or receipt PDF straight from a contract and its payments."],
    ["download","Export & backup","Consultancy data is included in the JSON backup and syncs online; you can also export the register to Excel or CSV below."]];
  const kpis='<div class="kpis">'+
    kpi("k2","Active Contracts",String(active))+
    kpi("k3","Contracts Owing",String(owing))+
    kpi("k1","WHT Withheld (TZS)",money(totalTax))+
    kpi("k4","Per-diem Contracts",String(perDiem))+'</div>';
  const cards='<h3 class="sec">Suggested functionality &amp; settings</h3>'+
    '<div class="grid2">'+sug.map(s=>'<div class="card" style="display:flex;gap:12px;align-items:flex-start">'+
      '<div style="color:var(--nav-accent);flex:none">'+ic(s[0],20)+'</div>'+
      '<div><b>'+esc(s[1])+'</b><div class="hint" style="margin-top:3px">'+esc(s[2])+'</div></div></div>').join("")+'</div>';
  const exports='<h3 class="sec">Export</h3>'+
    '<div class="btnrow">'+
      '<button class="btn pri" data-act="conXlsx">'+ic("download")+' Export Excel</button>'+
      '<button class="btn" data-act="conCsv">'+ic("download")+' Export CSV</button></div>'+
    '<div class="hint" style="margin-top:6px">Exports every consultancy contract with expected, WHT, paid and outstanding.</div>';
  return kpis+cards+exports;
}
function viewConsultancy(id){
  const c=(DB().consultancy||[]).find(x=>x.id===id); if(!c) return;
  const r=conRollup(c);
  const kv=[["Contract ID",esc(c.id)],["Client",esc(c.client||"\u2014")],["Client type",esc(c.clientType)],
    ["Project",esc(c.project||"\u2014")],["Focal person",esc(c.focal||"\u2014")],
    ["Phone",esc(c.phone||"\u2014")],["Email",esc(c.email||"\u2014")],
    ["Duration",c.durationType==="Period"?("Period \u00B7 "+(c.startDate?fmtDate(c.startDate):"?")+" \u2013 "+
      (c.endDate?fmtDate(c.endDate):"?")):"One-time"],
    ["Contract type(s)",esc((c.contractTypes||[]).join(", ")||"\u2014")],
    ["Payment type",esc(c.paymentType)],
    ["Expected (gross)",r.gross?tzs(r.gross):"\u2014"],
    ["Withholding tax (5%)",r.tax?tzs(r.tax):"\u2014"],
    ["Expected (net)",r.hasExp?tzs(r.net):"\u2014"],
    ["Paid",tzs(r.paid)],["Outstanding",r.hasExp?balText(-r.outstanding):"\u2014"],
    ["Status",conStatusPill(c.status)]];
  openModal("Consultancy \u2014 "+c.id,
    '<div class="kpis" style="grid-template-columns:1fr 1fr 1fr">'+
      kpi("k3","Expected (TZS)",r.hasExp?money(r.net):"\u2014")+
      kpi("k1","Paid (TZS)",money(r.paid))+
      kpi("k4","Outstanding (TZS)",r.hasExp?balText(-r.outstanding):"\u2014")+'</div>'+
    '<table style="margin-top:16px"><tbody>'+kv.map(x=>
      '<tr><td style="color:var(--muted)">'+x[0]+'</td><td><b>'+x[1]+'</b></td></tr>').join("")+'</tbody></table>'+
    ((c.payments||[]).length?'<h3 class="sec" style="font-size:16px">Payments</h3>'+
      table(["Date","Amount","Note"],c.payments.slice()
        .sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))
        .map(p=>[p.date?fmtDate(p.date):"\u2014",{n:money(numOf(p.amount))},esc(p.note||"\u2014")])):"")+
    '<div class="btnrow" style="margin-top:16px">'+
      (canEdit()?'<button class="btn pri" data-act="payCon" data-id="'+c.id+'">'+ic("coin",14)+
        ' Update payment</button>':"")+
      '<button class="btn" data-act="closeModal">Close</button></div>',true);
}
function conExportRows(){
  const H=3;
  const out=[["Contract ID","Client","Client Type","Project","Focal Person","Phone","Email",
    "Duration","Start","End","Contract Types","Payment Type","Expected Gross","WHT 5%","Expected Net",
    "Paid","Outstanding","Status","Payments"].map(h=>({t:h,s:H}))];
  conAll().forEach(r=>{const c=r.c;
    out.push([{t:c.id},{t:c.client||""},{t:c.clientType||""},{t:c.project||""},{t:c.focal||""},
      {t:c.phone||""},{t:c.email||""},{t:c.durationType||""},{t:c.startDate||""},{t:c.endDate||""},
      {t:(c.contractTypes||[]).join(", ")},{t:c.paymentType||""},r.gross,r.tax,r.net,r.paid,
      r.hasExp?r.outstanding:0,{t:c.status||""},(c.payments||[]).length]);});
  return out;
}

