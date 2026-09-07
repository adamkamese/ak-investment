/* bodaboda.js
   Bodaboda module: rollups, filters, dashboard, drivers, contracts, deposits, reports, tools, and exports.
   Part of the Boboda Business Dashboard. Loaded in order by index.html.
   Shared helpers live in core.js; edit a module file to change that module. */

/* --- module registration (Bodaboda) --- */
const BODA_TABS=[["Dashboard","dash"],["Drivers","people"],["Contracts","file"],
  ["Add Deposit","deposit"],["Reports","chart"],["Tools","tools"]];
registerModule({id:"bodaboda",icon:"scooter",name:"Bodaboda",live:true,title:"Bodaboda Business"},
  renderBodaboda);
function renderBodaboda(m,el){
  const R=resolveRange(), label=R[2], sel=selectedDrivers();
  el.innerHTML='<h1 class="pg">'+esc(m.title)+'</h1>'+
    '<div class="meta">Date: '+esc(label)+'</div>'+
    '<div class="meta">Driver(s): '+(FS.driverFilter==="All"?"All drivers":(sel.length?esc(sel.join(", ")):"None"))+'</div>'+
    (canEdit()?"":'<div class="banner warn" style="margin-top:12px">'+ic("lock")+
      ' <b>View only.</b> This account cannot add or change records in this module.</div>')+
    '<div class="tabs">'+BODA_TABS.map((t,i)=>
      '<button data-tab="'+i+'" aria-selected="'+(i===TAB)+'">'+ic(t[1],15)+t[0]+'</button>').join("")+'</div>'+
    '<div id="tabBody">'+[tabDashboard,tabDrivers,tabContracts,tabEntry,tabReports,tabTools][TAB]()+'</div>'+
    '<div class="foot">Developer: Adam Kamese \u00B7 Offline build \u00B7 Data stored on this device</div>';
}


/* =======================================================================
   ROLLUP - deposits grouped into weeks, fines assessed at week close
   ======================================================================= */
function contractRollup(c){
  const rows=depositsOf(c.id);
  const closeISO=(c.status!=="active"&&c.terminatedOn)?c.terminatedOn:null;
  /* every Monday from the contract start to the close (or today) */
  let firstWeek=mondayOfWeek(c.startDate);
  const lastRef=closeISO?closeISO:today();
  const lastWeek=mondayOfWeek(lastRef<c.startDate?c.startDate:lastRef);
  const byWeek=new Map();
  for(let w=dayNum(firstWeek);w<=dayNum(lastWeek);w+=7)
    byWeek.set(fromDayNum(w),{deposits:[],deposited:0});
  rows.forEach(r=>{
    const k=r.weekStart||mondayOfWeek(r.depositDate);
    if(!byWeek.has(k)) byWeek.set(k,{deposits:[],deposited:0});
    const b=byWeek.get(k); b.deposits.push(r); b.deposited+=Number(r.amount)||0;
  });
  const keys=Array.from(byWeek.keys()).sort((a,b)=>dayNum(a)-dayNum(b));
  const td=today();
  let carry=0,tExp=0,tDep=0,tFine=0,tFinePaid=0,late=0,weeksCounted=0,tLateDays=0;
  const weeks=keys.map(ws=>{
    const b=byWeek.get(ws);
    const expected=weekExpected(c,ws);
    const weekEnd=addDays(ws,6);
    /* A week is only closed once its Sunday has passed. */
    const closed=dayNum(weekEnd)<dayNum(td);
    const due=carry+expected;
    /* The fine test uses only money actually banked ON OR BEFORE the Sunday.
       A late payment settles the debt but does not undo the fine. */
    const paidBySunday=b.deposits.reduce((a,r)=>
      dayNum(r.depositDate)<=dayNum(weekEnd)?a+(Number(r.amount)||0):a,0);
    const shortfall=Math.max(due-paidBySunday,0);
    const daysOwed=(Number(c.dailyRate)||0)>0?Math.round(expected/(Number(c.dailyRate)||1)):0;
    const fine=closed?weekFineFor(c,shortfall,daysOwed):0;
    const finePaid=b.deposits.reduce((a,r)=>a+(Number(r.finePaid)||0),0);
    carry=Math.max(due-b.deposited,0);
    tExp+=expected; tDep+=b.deposited; tFine+=fine; tFinePaid+=finePaid;
    if(fine>0) late++;
    if(expected>0) weeksCounted++;
    /* Cumulative position to the end of this week: everything deposited so far
       against everything expected so far. Positive = ahead, negative = behind. */
    const rate=Number(c.dailyRate)||0;
    const lateDays=(closed&&rate>0&&shortfall>0)
      ?Math.min(Math.ceil(shortfall/rate),daysOwed||7):0;
    tLateDays+=lateDays;
    const cumBalance=tDep-tExp;
    return {weekStart:ws,weekEnd:weekEnd,expected:expected,carriedIn:due-expected,
      dueThisWeek:due+fine,deposited:b.deposited,paidBySunday:paidBySunday,
      fine:fine,finePaid:finePaid,lateDays:lateDays,
      balance:cumBalance,weekBalance:b.deposited-expected,
      cumExpected:tExp,cumDeposited:tDep,cumFine:tFine,cumFinePaid:tFinePaid,
      cumLateDays:tLateDays,carryOut:carry,closed:closed,
      deposits:b.deposits,count:b.deposits.length};
  });
  const endRef=closeISO||td;
  /* Contract total expected = duration x daily earning (to the termination
     date once closed). Outstanding and % repaid are measured against THIS,
     not the motorcycle purchase price. */
  const expectedTotal=contractExpectedTotal(c);
  const expectedTD=contractExpectedToDate(c);
  return {contract:c, weeks:weeks,
    weeksOperated:computeWeeks(c.startDate,endRef<c.startDate?c.startDate:endRef),
    weeksCounted:weeksCounted,
    weeklyExpectedSum:tExp,
    /* Expected EARNED so far, measured by duration operated up to date: to today
       for an active contract, to the close date for a terminated/completed one
       (so a closed contract's to-date equals its full total). */
    expectedToDate:expectedTD,
    amountDueToDate:expectedTD-tDep,
    percentToDate:expectedTD?tDep/expectedTD*100:0,
    totalExpected:expectedTotal,totalDeposited:tDep,
    amountDue:expectedTotal-tDep,outstandingCarry:carry,
    fines:tFine,finesPaid:tFinePaid,finesOutstanding:tFine-tFinePaid,
    weeksLate:late,lateDays:tLateDays,depositCount:rows.length,
    purchasePrice:Number(c.purchasePrice)||0,
    outstandingPrincipal:expectedTotal-tDep,
    percent:expectedTotal?tDep/expectedTotal*100:0};
}
const allRollups=()=>DB().contracts.map(contractRollup);
const rollupOf=cid=>{const c=contractById(cid);return c?contractRollup(c):null;};

/* Contract status AS AT a date. A contract that closed on 1 March was still
   active in February, so historical rows keep the status that applied then. */
function statusAt(c,iso){
  if(c.status==="active") return "active";
  if(!c.terminatedOn) return c.status;
  return dayNum(iso)>=dayNum(c.terminatedOn)?c.status:"active";
}
/* Derived vehicle status. Sold and Stolen are manual and stick; otherwise a
   vehicle follows its contracts, and sits at Pending when it has none. */
function vehicleStatus(v){
  if(MANUAL_VSTATUS.indexOf(v.status)>=0) return v.status;
  const cs=DB().contracts.filter(c=>(c.vehicleId||c.bikeId)===v.id);
  if(!cs.length) return "pending";
  if(cs.some(c=>c.status==="active")) return "active-contract";
  if(cs.some(c=>c.status==="completed")) return "completed";
  return "pending";
}

/* per-vehicle rollup: every contract that has used this motorcycle */
function vehicleRollup(v){
  const cs=DB().contracts.filter(c=>(c.vehicleId||c.bikeId)===v.id);
  let dep=0, exp=0;
  const drivers=new Set();
  cs.forEach(c=>{ const R=contractRollup(c);
    dep+=R.totalDeposited; exp+=R.totalExpected; drivers.add(c.driverId); });
  const cur=cs.filter(c=>c.status==="active")
    .sort((a,b)=>dayNum(b.startDate)-dayNum(a.startDate))[0];
  /* most recent driver on the vehicle, whether or not the contract is open */
  const recent=cs.slice().sort((a,b)=>dayNum(b.startDate)-dayNum(a.startDate))[0];
  const price=Number(v.purchaseAmount)||0;
  /* Total invested in the motorcycle = purchase price plus every repair booked
     against it. Outstanding and recovery are measured against THIS total. */
  const repairCost=(v.repairs||[]).reduce((a,r)=>a+(Number(r.cost)||0),0);
  const totalCost=price+repairCost;
  return {vehicle:v, contracts:cs, driverCount:drivers.size,
    currentDriver:cur?driverNameOf(cur):"\u2014",
    recentDriver:recent?driverNameOf(recent):"\u2014",
    recentContract:recent||null,
    status:vehicleStatus(v),
    active:isActiveVStatus(vehicleStatus(v)),
    currentContract:cur||null,
    totalDeposited:dep, totalExpected:exp,
    purchaseAmount:price,
    repairCost:repairCost,
    totalCost:totalCost,
    outstanding:totalCost-dep,
    percent:totalCost?dep/totalCost*100:0};
}
const allVehicleRollups=()=>DB().vehicles.map(vehicleRollup);

/* one flat row per deposit, used by Drivers / Reports / floating table */
/* One row per deposit, in ascending week order, each carrying the CUMULATIVE
   balance at that point: everything expected to date against everything
   deposited to date. Positive = ahead, negative = behind. */
function depositRows(){
  const out=[];
  allRollups().forEach(R=>{
    const c=R.contract, dn=driverNameOf(c), pl=plateOf(c);
    let cumDep=0;
    R.weeks.forEach(w=>{
      w.deposits.slice()
        .sort((a,b)=>dayNum(a.depositDate)-dayNum(b.depositDate))
        .forEach(dep=>{
          cumDep+=Number(dep.amount)||0;
          out.push({id:dep.id,contractId:c.id,code:c.code,driverId:c.driverId,driverName:dn,
            plate:pl,status:statusAt(c,dep.depositDate),contractStatus:c.status,
            weekStart:w.weekStart,weekEnd:w.weekEnd,
            depositDate:dep.depositDate,amount:Number(dep.amount)||0,
            finePaid:Number(dep.finePaid)||0,note:dep.note||"",
            weekExpected:w.expected,weekFine:w.fine,weekDue:w.dueThisWeek,
            weekDeposited:w.deposited,
            cumExpected:w.cumExpected,cumDeposited:cumDep,
            balance:cumDep-w.cumExpected});
        });
    });
  });
  return out.sort((a,b)=>dayNum(a.weekStart)-dayNum(b.weekStart)||
    dayNum(a.depositDate)-dayNum(b.depositDate));
}

/* FILTERS */
const FS={dateFilter:"Yearly",start:mondayOfWeek(today()),end:addDays(mondayOfWeek(today()),6),
  month:new Date().getMonth()+1,quarter:"Q"+(Math.floor(new Date().getMonth()/3)+1),
  year:new Date().getFullYear(),driverFilter:"All",single:"",multi:[]};
function resolveRange(){
  const y=Number(FS.year);
  if(FS.dateFilter==="Custom") return [FS.start,FS.end,fmtDate(FS.start)+" \u2013 "+fmtDate(FS.end)];
  if(FS.dateFilter==="Monthly"){const m=Number(FS.month);
    return [y+"-"+String(m).padStart(2,"0")+"-01",
      y+"-"+String(m).padStart(2,"0")+"-"+String(lastDayOfMonth(y,m)).padStart(2,"0"),
      MONS[m-1]+" "+y];}
  if(FS.dateFilter==="Quarterly"){const q={Q1:[1,3],Q2:[4,6],Q3:[7,9],Q4:[10,12]}[FS.quarter];
    return [y+"-"+String(q[0]).padStart(2,"0")+"-01",
      y+"-"+String(q[1]).padStart(2,"0")+"-"+String(lastDayOfMonth(y,q[1])).padStart(2,"0"),
      FS.quarter+" "+y];}
  return [y+"-01-01",y+"-12-31",String(y)];
}
function selectedDrivers(){
  const all=DB().drivers.map(d=>d.name).sort();
  if(FS.driverFilter==="All") return all;
  if(FS.driverFilter==="Single") return FS.single?[FS.single]:[];
  return FS.multi;
}
const inRange=iso=>{const R=resolveRange();
  return dayNum(iso)>=dayNum(R[0])&&dayNum(iso)<=dayNum(R[1]);};
/* deposit rows limited to the sidebar filters */
function filteredDeposits(){
  const names=new Set(selectedDrivers());
  return depositRows().filter(r=>names.has(r.driverName)&&inRange(r.depositDate));
}
/* week rows limited to the sidebar filters */
function filteredWeeks(){
  const names=new Set(selectedDrivers()), out=[];
  allRollups().forEach(R=>{
    const c=R.contract, dn=driverNameOf(c); if(!names.has(dn)) return;
    R.weeks.forEach(w=>{ if(inRange(w.weekStart))
      out.push(Object.assign({},w,{driverName:dn,plate:plateOf(c),code:c.code,
        status:statusAt(c,w.weekEnd)})); });
  });
  return out.sort((a,b)=>dayNum(a.weekStart)-dayNum(b.weekStart));
}
function filteredDriverSummary(){
  const names=new Set(selectedDrivers()), map=new Map();
  allRollups().forEach(R=>{
    const c=R.contract, dn=driverNameOf(c); if(!names.has(dn)) return;
    const wk=R.weeks.filter(w=>inRange(w.weekStart));
    if(!wk.length) return;
    const m=map.get(dn)||{name:dn,plates:new Set(),weeks:0,expected:0,deposited:0,
      fines:0,finesPaid:0,late:0,fineMode:c.fineMode||"none",fineAmount:Number(c.fineAmount)||0,
      dailyRate:Number(c.dailyRate)||0};
    m.plates.add(plateOf(c));
    wk.forEach(w=>{ m.weeks++; m.expected+=w.expected; m.deposited+=w.deposited;
      m.fines+=w.fine; m.finesPaid+=w.finePaid; if(w.fine>0) m.late++; });
    map.set(dn,m);
  });
  return Array.from(map.values()).map(m=>Object.assign({},m,{
    plate:Array.from(m.plates).join(", ")||"\u2014",
    due:m.expected-m.deposited,finesOutstanding:m.fines-m.finesPaid}))
    .sort((a,b)=>a.name.localeCompare(b.name));
}
const reportTotals=rows=>({
  drivers:rows.length, weeks:rows.reduce((a,r)=>a+r.weeks,0),
  expected:rows.reduce((a,r)=>a+r.expected,0), deposited:rows.reduce((a,r)=>a+r.deposited,0),
  due:rows.reduce((a,r)=>a+r.due,0), fines:rows.reduce((a,r)=>a+r.fines,0),
  finesPaid:rows.reduce((a,r)=>a+r.finesPaid,0),
  finesOutstanding:rows.reduce((a,r)=>a+r.finesOutstanding,0),
  late:rows.reduce((a,r)=>a+r.late,0)
});
/* Buckets for the period-comparison chart, following the sidebar filter:
   a year shows months, a quarter shows its months, a month shows its weeks. */
function periodBuckets(){
  const R=resolveRange(), s=R[0], e=R[1], y=Number(FS.year), out=[];
  if(FS.dateFilter==="Monthly"){
    let w=mondayOfWeek(s);
    while(dayNum(w)<=dayNum(e)){
      out.push({label:"w/c "+Number(w.split("-")[2]),from:w,to:addDays(w,6)});
      w=addDays(w,7);
    }
  } else if(FS.dateFilter==="Quarterly"){
    const q={Q1:[1,3],Q2:[4,6],Q3:[7,9],Q4:[10,12]}[FS.quarter];
    for(let m=q[0];m<=q[1];m++) out.push({label:MONS[m-1],
      from:y+"-"+String(m).padStart(2,"0")+"-01",
      to:y+"-"+String(m).padStart(2,"0")+"-"+String(lastDayOfMonth(y,m)).padStart(2,"0")});
  } else if(FS.dateFilter==="Yearly"){
    for(let m=1;m<=12;m++) out.push({label:MONS[m-1],
      from:y+"-"+String(m).padStart(2,"0")+"-01",
      to:y+"-"+String(m).padStart(2,"0")+"-"+String(lastDayOfMonth(y,m)).padStart(2,"0")});
  } else {
    let cur=s.slice(0,7)+"-01";
    while(dayNum(cur)<=dayNum(e)){
      const yy=Number(cur.split("-")[0]), mm=Number(cur.split("-")[1]);
      out.push({label:MONS[mm-1]+" "+String(yy).slice(2),from:cur,
        to:yy+"-"+String(mm).padStart(2,"0")+"-"+String(lastDayOfMonth(yy,mm)).padStart(2,"0")});
      cur=addMonths(cur,1);
    }
  }
  return out;
}
/* expected vs deposited inside each bucket, for the selected drivers */
function periodSeries(){
  const b=periodBuckets(), names=new Set(selectedDrivers());
  const exp=b.map(()=>0), dep=b.map(()=>0);
  const idx=iso=>b.findIndex(x=>dayNum(iso)>=dayNum(x.from)&&dayNum(iso)<=dayNum(x.to));
  allRollups().forEach(R=>{
    if(!names.has(driverNameOf(R.contract))) return;
    R.weeks.forEach(w=>{
      const i=idx(w.weekStart); if(i>=0) exp[i]+=w.expected;
      w.deposits.forEach(d=>{ const j=idx(d.depositDate);
        if(j>=0) dep[j]+=Number(d.amount)||0; });
    });
  });
  return {labels:b.map(x=>x.label),expected:exp,deposited:dep};
}

/* averages by contract status, for the dashboard cards */
function statsByStatus(){
  const g={active:[],terminated:[],completed:[]};
  allRollups().forEach(R=>{ (g[R.contract.status]||(g[R.contract.status]=[])).push(R); });
  const agg=list=>{
    const n=list.length||1;
    const w=list.reduce((a,r)=>a+r.weeksOperated,0);
    const e=list.reduce((a,r)=>a+r.totalExpected,0);
    const eTD=list.reduce((a,r)=>a+r.expectedToDate,0);
    const d=list.reduce((a,r)=>a+r.totalDeposited,0);
    const o=list.reduce((a,r)=>a+r.amountDue,0);
    const oTD=list.reduce((a,r)=>a+r.amountDueToDate,0);
    return {count:list.length,weeks:w,expected:e,expectedToDate:eTD,deposited:d,
      outstanding:o,outstandingToDate:oTD,
      avgWeeks:w/n,avgExpected:e/n,avgDeposited:d/n,avgOutstanding:o/n};
  };
  return {active:agg(g.active||[]),terminated:agg(g.terminated||[]),
    completed:agg(g.completed||[]),all:agg(allRollups())};
}

/* ===================== DASHBOARD ===================== */
function tabDashboard(){
  const R=allRollups(); if(!R.length) return emptyState();
  const db=DB(), S=statsByStatus();
  const V=allVehicleRollups();
  const activeVeh=V.filter(v=>v.active).length;
  const drvIds=new Set(db.contracts.map(c=>c.driverId));
  const activeDrv=new Set(db.contracts.filter(c=>c.status==="active").map(c=>c.driverId));
  const weeks=R.reduce((a,r)=>a+r.weeksOperated,0);
  const exp=R.reduce((a,r)=>a+r.expectedToDate,0);
  const dep=R.reduce((a,r)=>a+r.totalDeposited,0);
  const out=R.reduce((a,r)=>a+r.amountDueToDate,0);

  const PS=periodSeries();
  const cnt={active:0,terminated:0,completed:0};
  R.forEach(r=>cnt[r.contract.status]=(cnt[r.contract.status]||0)+1);

  /* by-plate series, weeks dropped */
  const byPlate=V.filter(v=>v.contracts.length&&v.active)
    .map(v=>({plate:v.vehicle.plate,e:v.totalExpected,d:v.totalDeposited,
      o:Math.max(v.totalExpected-v.totalDeposited,0)}))
    .sort((a,b)=>b.e-a.e).slice(0,10);

  const q=TXT.dash;
  const rows=R.map(r=>{const c=r.contract;
    return {name:driverNameOf(c),plate:plateOf(c),code:c.code||"",status:c.status,
      w:r.weeksOperated,e:r.expectedToDate,dp:r.totalDeposited,du:r.amountDueToDate,did:c.driverId};})
    .filter(r=>matches([r.name,r.plate,r.code].join(" "),q))
    .sort((a,b)=>a.name.localeCompare(b.name));

  const vq=TXT.veh;
  const vrows=V.filter(v=>matches([v.vehicle.plate,v.currentDriver,v.vehicle.model||"",
      v.vehicle.colour||""].join(" "),vq));

  return '<div class="btnrow" style="margin-bottom:18px">'+depositBtn+
      '<button class="btn" data-act="goReports">'+ic("chart")+' Go to Reports</button></div>'+
    '<h3 class="sec">Summary</h3>'+
    '<div class="kpis">'+
      kpi("k1","Total Number of Vehicles",db.vehicles.length,"Active vehicles: "+activeVeh)+
      kpi("k2","Total Weeks Operated",weeks.toFixed(1),
        "Drivers: "+drvIds.size+" / active "+activeDrv.size)+
      kpi("k3","Total Expected to Date (TZS)",money(exp))+
      kpi("k4","Total Deposited Earnings (TZS)",money(dep),"Outstanding: "+money(out))+'</div>'+

    '<h3 class="sec">Charts</h3>'+
    '<div class="charts2">'+
      '<div class="chartbox"><h4>Contracts by status</h4><div class="plot">'+
        pieChart([{label:"Active",value:cnt.active||0,color:CGREEN},
                  {label:"Terminated",value:cnt.terminated||0,color:CRED},
                  {label:"Ended",value:cnt.completed||0,color:CBLUE}])+'</div></div>'+
      '<div class="chartbox"><h4>Expected, deposited and outstanding by status</h4><div class="plot">'+
        barChart(["Active","Terminated","Completed"],[
          {name:"Expected (TZS)",color:CGREEN,
           values:[S.active.expectedToDate,S.terminated.expectedToDate,S.completed.expectedToDate]},
          {name:"Deposited (TZS)",color:CBLUE,
           values:[S.active.deposited,S.terminated.deposited,S.completed.deposited]},
          {name:"Outstanding (TZS)",color:CRED,
           values:[S.active.outstandingToDate,S.terminated.outstandingToDate,S.completed.outstandingToDate]}
        ],{w:460,h:300})+'</div></div></div>'+
    '<div class="chartbox" style="margin-top:16px">'+
      '<h4>Expected vs deposited per period \u2014 '+esc(periodLabel())+'</h4>'+
      '<div class="plot" style="min-height:300px">'+
      barChart(PS.labels,[
        {name:"Expected",color:CGREEN,values:PS.expected},
        {name:"Deposited",color:CBLUE,values:PS.deposited}
      ],{w:940,h:320,rot:PS.labels.length>8})+'</div>'+
      '</div>'+
    '<div class="chartbox" style="margin-top:16px"><h4>By vehicle (plate number)</h4>'+
      '<div class="plot" style="min-height:320px">'+
      barChart(byPlate.map(p=>p.plate),[
        {name:"Expected",color:CGREEN,values:byPlate.map(p=>p.e)},
        {name:"Deposited",color:CBLUE,values:byPlate.map(p=>p.d)},
        {name:"Outstanding",color:CRED,values:byPlate.map(p=>p.o)}
      ],{w:940,h:340,rot:false})+'</div></div>'+

    '<h3 class="sec">Summary per vehicle</h3>'+
    filterBox("veh","Filter by plate, driver, model or colour\u2026")+
    table(["Plate #","Purchased Date","Purchased Amount (TZS)","Repair Cost (TZS)",
      "Total Cost (TZS)","Total Drivers Contracted",
      "Current Driver Name","Recent Driver","Vehicle Status",
      "Total Amount Deposited (TZS)","Outstanding Amount (TZS)",""],
      vrows.map(v=>[esc(v.vehicle.plate),
        v.vehicle.purchaseDate?fmtDate(v.vehicle.purchaseDate):"\u2014",
        {n:money(v.purchaseAmount)},{n:money(v.repairCost)},{n:money(v.totalCost)},
        {n:v.driverCount},esc(v.currentDriver),
        esc(v.recentDriver),statusLabel(v.status)+
          (v.active?"":' <span class="hint" style="display:inline">not tracked</span>'),
        {n:money(v.totalDeposited)},bal(v.totalDeposited-v.totalCost),
        '<button class="btn sm" data-act="viewVehicle" data-id="'+v.vehicle.id+'">'+
        ic("eye",13)+' View</button>']))+


    '<h3 class="sec">Summary Table per All Drivers</h3>'+
    filterBox("dash","Filter by plate, driver or contract ID\u2026")+
    table(["Driver Name","Plate","Contract ID","Contract Status","Total Weeks Operated",
      "Total Expected (to date)","Total Deposited Earnings","Total Amount Due",""],
      rows.map(r=>['<a class="lnk" data-act="drillDriver" data-id="'+r.did+'">'+esc(r.name)+'</a>',
        esc(r.plate),esc(r.code),statusLabel(r.status),{n:r.w.toFixed(1)},{n:money(r.e)},
        {n:money(r.dp)},bal(-r.du),
        '<button class="btn sm" data-act="viewDriver" data-id="'+r.did+'">'+
        ic("eye",13)+' View</button>']))+
    '';
}

/* floating, editable deposit table for one driver */
function drillDriver(driverId){
  const d=driverById(driverId); if(!d) return;
  const rows=depositRows().filter(r=>r.driverId===driverId&&inRange(r.depositDate));
  const R=resolveRange();
  const tot=rows.reduce((a,r)=>a+r.amount,0);
  openModal(d.name+" \u2014 deposits",
    '<div class="banner">Period <b>'+esc(R[2])+'</b> \u00B7 '+rows.length+' deposit(s) \u00B7 total <b>'+
      tzs(tot)+'</b></div>'+
    table(["Week Start","Week End","Deposit Date","Contract ID","Plate","Status","Amount",
      "Fine Paid","Balance to Date",""],
      rows.map(r=>[fmtDate(r.weekStart),fmtDate(r.weekEnd),fmtDate(r.depositDate),
        esc(r.code),esc(r.plate),statusLabel(r.status),{n:money(r.amount)},{n:money(r.finePaid)},
        bal(r.balance),
        canEdit()?('<button class="btn sm" data-act="editDep" data-id="'+r.id+'">'+ic("pencil",13)+
          '</button> <button class="btn sm dang" data-act="delDep" data-id="'+r.id+'">'+
          ic("trash",13)+'</button>'):""]))+
    '<div class="btnrow" style="margin-top:16px">'+
      '<button class="btn" data-act="closeModal">Close</button></div>',true);
}

/* floating driver detail card: a driver-level mirror of the vehicle card,
   built from every contract the driver holds. Expected is shown both to date
   (weeks operated so far) and at full term. */
function viewDriver(driverId){
  const d=driverById(driverId); if(!d) return;
  const mine=allRollups().filter(r=>r.contract.driverId===driverId);
  const sum=k=>mine.reduce((a,r)=>a+r[k],0);
  const weeks=sum("weeksOperated"), expTD=sum("expectedToDate"), expFull=sum("totalExpected");
  const dep=sum("totalDeposited"), dueTD=sum("amountDueToDate"), finesOut=sum("finesOutstanding");
  const plates=Array.from(new Set(mine.map(r=>plateOf(r.contract)))).join(", ")||"\u2014";
  const active=mine.filter(r=>r.contract.status==="active").length;
  const recent=depositRows().filter(r=>r.driverId===driverId)
    .sort((a,b)=>dayNum(b.depositDate)-dayNum(a.depositDate)).slice(0,8);
  const kv=[["Driver Name",esc(d.name)],["Phone",esc(d.phone||"\u2014")],
    ["Plate(s)",esc(plates)],["Contracts",mine.length+" ("+active+" active)"],
    ["Total Weeks Operated",weeks.toFixed(1)],
    ["Expected to Date",tzs(expTD)],["Expected (full term)",tzs(expFull)],
    ["Total Deposited",tzs(dep)],["Outstanding to Date",balText(-dueTD)],
    ["Fines Outstanding",tzs(finesOut)],
    ["% Repaid (to date)",(expTD?dep/expTD*100:0).toFixed(1)+"%"]];
  openModal("Driver \u2014 "+d.name,
    '<div class="kpis" style="grid-template-columns:1fr 1fr 1fr">'+
      kpi("k2","Weeks Operated",weeks.toFixed(1))+
      kpi("k3","Expected to Date (TZS)",money(expTD))+
      kpi("k4","Outstanding to Date (TZS)",balText(-dueTD))+'</div>'+
    '<table style="margin-top:16px"><tbody>'+kv.map(x=>
      '<tr><td style="color:var(--muted)">'+x[0]+'</td><td><b>'+x[1]+'</b></td></tr>').join("")+
    '</tbody></table>'+
    (mine.length?'<h3 class="sec" style="font-size:16px">Contracts</h3>'+
      table(["Contract ID","Plate","Status","Start","End","Weeks","Total Expected",
        "Expected to Date","Deposited","Outstanding"],
        mine.map(r=>{const c=r.contract;
          return [esc(c.code||""),esc(plateOf(c)),statusLabel(c.status),
            fmtDate(c.startDate),fmtDate(c.terminatedOn||c.endDate),{n:r.weeksOperated.toFixed(1)},
            {n:money(r.totalExpected)},{n:money(r.expectedToDate)},
            {n:money(r.totalDeposited)},bal(-r.amountDueToDate)];})):"")+
    (recent.length?'<h3 class="sec" style="font-size:16px">Recent deposits</h3>'+
      table(["Deposit Date","Week Start","Plate","Contract ID","Amount","Fine Paid"],
        recent.map(r=>[fmtDate(r.depositDate),fmtDate(r.weekStart||mondayOfWeek(r.depositDate)),
          esc(r.plate),esc(r.code),{n:money(r.amount)},{n:money(r.finePaid)}])):"")+
    '<div class="btnrow" style="margin-top:16px">'+
      '<button class="btn" data-act="drillDriver" data-id="'+driverId+'">'+ic("file",14)+
        ' All deposits</button>'+
      '<button class="btn" data-act="closeModal">Close</button></div>',true);
}

/* floating vehicle detail card */
function viewVehicle(id){
  const v=vehicleById(id); if(!v) return;
  const V=vehicleRollup(v);
  const ins=v.hasInsurance?("Yes \u00B7 "+(v.insuranceStart?fmtDate(v.insuranceStart):"?")+
    " \u2013 "+(v.insuranceEnd?fmtDate(v.insuranceEnd):"?")):"No";
  const vs=(VSTATUS.find(x=>x[0]===V.status)||["",""])[1]||"\u2014";
  const rows=[["Plate Number",esc(v.plate)],["Chassis Number",esc(v.chassis||"\u2014")],
    ["Colour",esc(v.colour||"\u2014")],["Model",esc(v.model||"\u2014")],
    ["Purchase Date",v.purchaseDate?fmtDate(v.purchaseDate):"\u2014"],
    ["Purchase Amount",tzs(v.purchaseAmount)],
    ["Repair cost",tzs(V.repairCost)],
    ["Total cost (purchase + repairs)",tzs(V.totalCost)],
    ["Insurance",esc(ins)],
    ["Vehicle Status",statusLabel(V.status)],["Status Date",v.statusDate?fmtDate(v.statusDate):"\u2014"],
    ["Contracts on this vehicle",V.contracts.length],
    ["Drivers contracted",V.driverCount],["Current driver",esc(V.currentDriver)],["Recent driver",esc(V.recentDriver)],
    ["Total expected across contracts",tzs(V.totalExpected)],
    ["Total deposited (all drivers)",tzs(V.totalDeposited)],
    ["Outstanding vs total cost",balText(V.totalDeposited-V.totalCost)],
    ["Recovered",V.percent.toFixed(1)+"%"]];
  const reps=(v.repairs||[]).slice().sort((a,b)=>dayNum(a.date||today())-dayNum(b.date||today()));
  openModal("Vehicle \u2014 "+v.plate,
    '<div class="kpis" style="grid-template-columns:1fr 1fr 1fr">'+
      kpi("k1","Total Cost (TZS)",money(V.totalCost),
        V.repairCost>0?"Purchase "+money(V.purchaseAmount)+" + repairs "+money(V.repairCost):"No repairs")+
      kpi("k3","Deposited (TZS)",money(V.totalDeposited))+
      kpi("k4","Outstanding (TZS)",balText(V.totalDeposited-V.totalCost))+'</div>'+
    '<table style="margin-top:16px"><tbody>'+rows.map(kv=>
      '<tr><td style="color:var(--muted)">'+kv[0]+'</td><td><b>'+kv[1]+'</b></td></tr>').join("")+
    '</tbody></table>'+
    (reps.length?'<h3 class="sec" style="font-size:16px">Repairs &amp; maintenance</h3>'+
      table(["Repair Type","Repair Date","Cost (TZS)"],
        reps.map(r=>[esc(r.type||"\u2014"),r.date?fmtDate(r.date):"\u2014",{n:money(r.cost)}]))
      +'<div class="hint" style="margin-top:6px">Total repair cost <b>'+money(V.repairCost)+
        '</b>, added to the purchase price for a total cost of <b>'+money(V.totalCost)+'</b>.</div>':"")+
    (V.contracts.length?'<h3 class="sec" style="font-size:16px">Contracts on this vehicle</h3>'+
      table(["Contract ID","Driver","Status","Start","End","Expected","Deposited","Outstanding"],
        V.contracts.map(c=>{const r=contractRollup(c);
          return [esc(c.code||""),esc(driverNameOf(c)),statusLabel(c.status),
            fmtDate(c.startDate),fmtDate(c.terminatedOn||c.endDate),
            {n:money(r.totalExpected)},{n:money(r.totalDeposited)},bal(-r.amountDue)];})):"")+
    '<div class="btnrow" style="margin-top:16px">'+
      (canEdit()?'<button class="btn pri" data-act="editVehicle" data-id="'+v.id+'">'+
        ic("pencil")+' Edit vehicle</button>':"")+
      '<button class="btn" data-act="closeModal">Close</button></div>',true);
}

/* ===================== DRIVERS ===================== */
function tabDrivers(){
  const db=DB(), R=allRollups();
  const sel=new Set(selectedDrivers());
  const mine=R.filter(r=>sel.has(driverNameOf(r.contract)));
  const weeks=mine.reduce((a,r)=>a+r.weeksOperated,0);
  const exp=mine.reduce((a,r)=>a+r.expectedToDate,0);
  const dep=mine.reduce((a,r)=>a+r.totalDeposited,0);
  const due=mine.reduce((a,r)=>a+r.amountDueToDate,0);
  const drvIds=new Set(db.contracts.map(c=>c.driverId));
  const activeDrv=new Set(db.contracts.filter(c=>c.status==="active").map(c=>c.driverId));

  const q=TXT.drv;
  const rows=filteredDeposits().filter(r=>
    matches([r.driverName,r.plate,r.code,r.depositDate].join(" "),q));

  return '<div class="btnrow" style="margin-bottom:18px">'+depositBtn+
      '<button class="btn" data-act="dlDriversXlsx">'+ic("download")+' Excel</button>'+
      '<button class="btn" data-act="dlDriversPdf">'+ic("printer")+' PDF</button>'+
      '<button class="btn" data-act="dlDriversCsv">'+ic("download")+' CSV</button></div>'+
    '<h3 class="sec">Summary</h3>'+
    '<div class="kpis">'+
      kpi("k2","Total Weeks Operated",weeks.toFixed(1),
        "Drivers: "+drvIds.size+" / active "+activeDrv.size)+
      kpi("k3","Total Expected to Date (TZS)",money(exp))+
      kpi("k1","Total Deposited Earnings (TZS)",money(dep))+
      kpi("k4","Total Amount Due",money(due))+'</div>'+
    '<h3 class="sec">Driver Register \u2014 every deposit</h3>'+
    filterBox("drv","Filter by driver, plate, contract ID or date\u2026")+
    table(["Week Start","Week End","Deposit Date","Driver Name","Plate","Contract ID",
      "Contract Status","Amount Deposited","Balance to Date",""],
      rows.map(r=>[fmtDate(r.weekStart),fmtDate(r.weekEnd),fmtDate(r.depositDate),
        esc(r.driverName),esc(r.plate),esc(r.code),statusLabel(r.status),
        {n:money(r.amount)},bal(r.balance),
        canEdit()?('<button class="btn sm" data-act="editDep" data-id="'+r.id+'">'+ic("pencil",13)+
          ' Edit</button> <button class="btn sm dang" data-act="delDep" data-id="'+r.id+'">'+
          ic("trash",13)+'</button>'):""]))+
    '<div class="hint" style="margin-top:8px">'+rows.length+' deposit(s) after filtering.</div>';
}

/* ===================== CONTRACTS ===================== */
function tabContracts(){
  const R=allRollups();
  let h='<div class="btnrow" style="margin-bottom:18px">'+
    '<button class="btn pri" data-act="newContract">'+ic("plus")+' New Contract</button>'+
    depositBtn+
    '<button class="btn" data-act="dlContractsXlsx">'+ic("download")+' Excel</button>'+
    '<button class="btn" data-act="dlContractsPdf">'+ic("printer")+' PDF</button></div>';
  if(!R.length) return h+'<div class="empty"><b>No contracts yet</b>Create one above.</div>';
  h+='<h3 class="sec">Contracts</h3>'+
    table(["Contract ID","Driver Name","Phone","Plate","Status","Start Date","End Date",
      "Duration","Daily Rate","Fine","Total Expected","Expected to Date","Deposited","Outstanding","%",""],
      R.map(r=>{const c=r.contract,d=driverById(c.driverId);
        const dur=(c.durationMonths?c.durationMonths+"m ":"")+(c.durationWeeks?c.durationWeeks+"w":"");
        const fin=c.fineMode==="none"?"None"
          :(c.fineMode==="weekly"?money(c.fineAmount)+" / week":money(c.fineAmount)+" / day");
        return [esc(c.code||""),esc(d?d.name:"?"),esc((d&&d.phone)||c.driverPhone||"\u2014"),
          esc(plateOf(c)),statusLabel(c.status),fmtDate(c.startDate),
          fmtDate(c.status==="terminated"&&c.terminatedOn?c.terminatedOn:c.endDate),
          (dur.trim()||"\u2014"),{n:money(c.dailyRate)},{n:fin},{n:money(r.totalExpected)},
          {n:money(r.expectedToDate)},
          {n:money(r.totalDeposited)},bal(-r.amountDue),
          {n:r.percent.toFixed(1)+"%"},
          '<button class="btn sm" data-act="viewContract" data-id="'+c.id+'">'+ic("eye",13)+'</button> '+
          (canEdit()?'<button class="btn sm" data-act="editContract" data-id="'+c.id+'">'+
            ic("pencil",13)+'</button>':"")];}))+
    '<h3 class="sec">Week-by-week ledger</h3>'+
    R.filter(r=>r.weeks.length).map(r=>{
      const c=r.contract;
      return '<details class="expander"><summary>'+esc(c.code||plateOf(c))+' \u2014 '+
        esc(driverNameOf(c))+' ('+r.weeksCounted+' weeks, '+tzs(r.outstandingCarry)+' carried)</summary>'+
        '<div class="body">'+
        table(["Week Start","Week End","Status","Expected","Deposits","Deposited",
          "Paid by Sunday","Fine","Week Balance","Balance to Date"],
          r.weeks.map(w=>[fmtDate(w.weekStart),fmtDate(w.weekEnd),
            statusLabel(statusAt(c,w.weekEnd)),
            {n:money(w.expected)},{n:w.count},{n:money(w.deposited)},{n:money(w.paidBySunday)},
            {n:money(w.fine),cls:w.fine>0?"neg":""},bal(w.weekBalance),bal(w.balance)]))+
        '<div class="hint" style="margin-top:8px">Fines are assessed when a week closes, based on '+
        'the shortfall at that point. Unpaid expected carries into the next week.</div>'+
        '</div></details>';
    }).join("");
  return h;
}

/* contract form state */
let CF=null;
const blankContract=()=>({id:"",driverName:"",driverPhone:"",plate:"",startDate:today(),
  durationMonths:"24",durationWeeks:"0",purchasePrice:"",dailyRate:"",
  fineMode:"daily",fineAmount:"1000",referralName:"",referralPhone:"",
  status:"active",terminatedOn:""});

function contractForm(){
  const f=CF, db=DB();
  /* only vehicles that are on active-contract status, plus whichever this
     contract already uses, so an existing contract can still be edited */
  const taken=new Set(db.contracts.filter(c=>c.status==="active"&&c.id!==f.id)
    .map(c=>c.vehicleId||c.bikeId));
  const avail=db.vehicles.filter(v=>{
    if(v.plate===f.plate) return true;
    if(MANUAL_VSTATUS.indexOf(v.status)>=0) return false;   /* sold or stolen */
    return !taken.has(v.id);
  });
  const endAuto=contractEndDate(f.startDate,f.numMonths||f.durationMonths,f.durationWeeks);
  const code=makeContractCode(f.plate||"PLATE",f.startDate,f.driverName||"");
  const term=f.status==="terminated"||f.status==="completed";
  /* A contract cannot be closed on a date that has not happened yet: earnings
     would keep accruing past the closure and the balance would read wrong. */
  const futureClose=term&&f.terminatedOn&&dayNum(f.terminatedOn)>dayNum(today());
  const earlyClose=term&&f.terminatedOn&&dayNum(f.terminatedOn)<dayNum(f.startDate);
  const endEff=term&&f.terminatedOn?f.terminatedOn:endAuto;
  const dspan=(f.startDate&&endEff)?dayDiff(f.startDate,endEff)+1:0;
  const expTotal=dspan>0?dspan*numOf(f.dailyRate):0;
  return '<div class="grid2">'+
    '<div><label class="f">Driver Name <span class="req">*</span></label>'+
      '<input class="i" data-cf="driverName" value="'+esc(f.driverName)+
      '" placeholder="Type the full name" autocapitalize="words">'+
      '<div class="hint">Typed here, then reused as a dropdown everywhere else.</div></div>'+
    '<div><label class="f">Driver Phone Number</label>'+
      '<input class="i" type="tel" data-cf="driverPhone" value="'+esc(f.driverPhone)+
      '" placeholder="0712 345 678"></div>'+
    '<div><label class="f">Motorcycle Plate Number <span class="req">*</span></label>'+
      (avail.length||f.plate
        ?'<select class="i" data-cf="plate"><option value="">\u2014 select \u2014</option>'+
          avail.map(v=>'<option'+(f.plate===v.plate?" selected":"")+'>'+esc(v.plate)+
          '</option>').join("")+'</select>'+
          '<div class="hint">From the motorcycle register under Tools.</div>'
        :'<div class="errmsg">No motorcycles registered yet.</div>'+
          '<div class="hint">Add one under Tools \u2192 Add Motorcycle first.</div>')+'</div>'+
    '<div><label class="f">Contract ID (auto)</label>'+
      '<input class="i" id="cfCode" value="'+esc(code)+'" readonly>'+
      '<div class="hint">Plate \u2013 start date \u2013 driver initials.</div></div>'+
    '<div><label class="f">Contract Start Date <span class="req">*</span></label>'+
      '<input class="i" type="date" data-cf="startDate" value="'+f.startDate+'"></div>'+
    '<div><label class="f">Contract End Date (auto)</label>'+
      '<input class="i" id="cfEnd" value="'+(endAuto?fmtDate(endAuto):"")+'" readonly>'+
      '<div class="hint">Start + duration, calculated for you.</div></div>'+
    '<div><label class="f">Duration \u2014 Months</label>'+
      '<input class="i num" type="text" inputmode="numeric" data-cf="durationMonths" data-numeric="1" value="'+
      esc(f.durationMonths)+'" placeholder="24"></div>'+
    '<div><label class="f">Duration \u2014 Weeks</label>'+
      '<input class="i num" type="text" inputmode="numeric" data-cf="durationWeeks" data-numeric="1" value="'+
      esc(f.durationWeeks)+'" placeholder="0"></div>'+
    '<div><label class="f">Contracted Daily Earning (TZS) <span class="req">*</span></label>'+
      '<input class="i num" type="text" inputmode="numeric" data-cf="dailyRate" data-numeric="1" value="'+
      esc(f.dailyRate)+'" placeholder="15000">'+
      '<div class="echo">'+(String(f.dailyRate).length?money(numOf(f.dailyRate))+
        " \u00B7 week "+money(numOf(f.dailyRate)*7):"")+'</div></div>'+
    '<div><label class="f">Total Expected Earnings (auto)</label>'+
      '<input class="i" id="cfExp" value="'+(expTotal?tzs(expTotal):"")+'" readonly>'+
      '<div class="hint">Duration \u00D7 daily earning. Outstanding is measured against this.</div></div>'+
    '<div><label class="f">Fine Type</label>'+
      '<select class="i" data-cf="fineMode">'+FINE_MODES.map(m=>
        '<option value="'+m[0]+'"'+(f.fineMode===m[0]?" selected":"")+'>'+m[1]+'</option>').join("")+
      '</select></div>'+
    '<div><label class="f">Fine Amount (TZS)</label>'+
      '<input class="i num" type="text" inputmode="numeric" data-cf="fineAmount" data-numeric="1" value="'+
      (f.fineMode==="none"?"0":esc(f.fineAmount))+'" placeholder="1000"'+
      (f.fineMode==="none"?" disabled":"")+'>'+
      '<div class="hint">'+(f.fineMode==="none"?"No fine will be charged."
        :(f.fineMode==="weekly"?"Charged once for any week that ends short."
        :"Charged for each day the week ends short."))+'</div></div>'+
    '<div><label class="f">Referral Name</label>'+
      '<input class="i" data-cf="referralName" value="'+esc(f.referralName)+
      '" placeholder="Who introduced the driver" autocapitalize="words"></div>'+
    '<div><label class="f">Referral Phone Number</label>'+
      '<input class="i" type="tel" data-cf="referralPhone" value="'+esc(f.referralPhone)+
      '" placeholder="0712 345 678"></div>'+
    '<div><label class="f">Status</label>'+
      '<select class="i" data-cf="status">'+CSTATUS.map(s=>
        '<option value="'+s[0]+'"'+(f.status===s[0]?" selected":"")+'>'+s[1]+'</option>').join("")+
      '</select>'+
      '<div class="hint">Completed requires a nil balance. Use Terminated to close a '+
      'contract that still owes money.</div></div>'+
    '<div>'+(term?'<label class="f">'+(f.status==="completed"?"Completion":"Termination")+
      ' Date <span class="req">*</span></label>'+
      '<input class="i" type="date" data-cf="terminatedOn" value="'+(f.terminatedOn||today())+
      '" min="'+f.startDate+'" max="'+today()+'">'+
      (futureClose?'<div class="errmsg">A contract cannot be closed on a future date. '+
        'The latest allowed date is '+fmtDate(today())+'.</div>'+
        '<button class="btn sm" data-act="closeToday" style="margin-top:6px">Use today</button>'
       :(earlyClose?'<div class="errmsg">The closing date is before the contract started ('+
        fmtDate(f.startDate)+').</div>'
       :'<div class="hint">Earnings stop accruing on this date and all outstanding weeks close.'+
        '</div>'))+"":"")+
    '</div></div>'+
    '<div class="btnrow" style="margin-top:18px">'+
      '<button class="btn pri" data-act="saveContract"'+
        ((futureClose||earlyClose)?" disabled":"")+'>'+ic("check")+' Save Contract</button>'+
      (f.id?'<button class="btn dang" data-act="delContract" data-id="'+f.id+'">'+
        ic("trash")+' Delete</button>':"")+
      '<button class="btn" data-act="closeModal">Cancel</button></div>';
}
function openContract(id){
  const c=id?contractById(id):null;
  if(c){ const d=driverById(c.driverId);
    CF={id:c.id,driverName:d?d.name:"",driverPhone:(d&&d.phone)||c.driverPhone||"",
      plate:plateOf(c),startDate:c.startDate,durationMonths:String(c.durationMonths||0),
      durationWeeks:String(c.durationWeeks||0),purchasePrice:String(c.purchasePrice||""),
      dailyRate:String(c.dailyRate||""),fineMode:c.fineMode||"none",
      fineAmount:String(c.fineAmount||0),referralName:c.referralName||"",
      referralPhone:c.referralPhone||"",status:c.status,terminatedOn:c.terminatedOn||""};
  } else CF=blankContract();
  openModal(id?"Edit Contract":"New Contract",contractForm());
}
function refreshContractForm(){
  const b=document.getElementById("mBody"), a=document.activeElement;
  const k=a&&a.dataset?a.dataset.cf:null, pos=a&&a.selectionStart;
  b.innerHTML=contractForm();
  if(k){ const n=b.querySelector('[data-cf="'+k+'"]');
    if(n){ n.focus(); try{ if(pos!=null&&n.setSelectionRange) n.setSelectionRange(pos,pos); }catch(e){} } }
}
function saveContract(){
  if(!guard()) return;
  const db=DB(), f=CF;
  if(!f.driverName.trim()) return alert("Type the driver's name.");
  if(!f.plate.trim()) return alert("Enter the motorcycle plate number.");
  if(!(numOf(f.dailyRate)>0)) return alert("Enter the contracted daily earning.");
  const veh=vehicleByPlate(f.plate);
  if(!veh) return alert("Pick a registered motorcycle. Add one under Tools first.");
  const term=f.status!=="active";
  const word=f.status==="completed"?"completion":"termination";
  if(term&&!f.terminatedOn) return alert("Enter the "+word+" date.");
  if(term&&dayNum(f.terminatedOn)<dayNum(f.startDate))
    return alert("The "+word+" date cannot be before the start date.");
  if(term&&dayNum(f.terminatedOn)>dayNum(today()))
    return alert("A contract cannot be closed on a future date.\n\n"+
      word.charAt(0).toUpperCase()+word.slice(1)+" date: "+fmtDate(f.terminatedOn)+
      "\nToday: "+fmtDate(today()));
  const d=findOrCreateDriver(f.driverName,f.driverPhone);
  if(f.driverPhone) d.phone=f.driverPhone;
  const bike=veh;
  const clash=db.contracts.find(x=>(x.vehicleId||x.bikeId)===bike.id&&x.status==="active"&&x.id!==f.id);
  if(clash&&f.status==="active")
    return alert("That motorcycle already has an active contract ("+(clash.code||"")+").");
  const fields={driverId:d.id,vehicleId:bike.id,bikeId:bike.id,driverPhone:f.driverPhone,
    startDate:f.startDate,durationMonths:numOf(f.durationMonths),durationWeeks:numOf(f.durationWeeks),
    endDate:contractEndDate(f.startDate,numOf(f.durationMonths),numOf(f.durationWeeks)),
    purchasePrice:Number(bike.purchaseAmount)||0,dailyRate:numOf(f.dailyRate),
    fineMode:f.fineMode,fineAmount:f.fineMode==="none"?0:numOf(f.fineAmount),
    referralName:f.referralName,referralPhone:f.referralPhone,
    status:f.status,terminatedOn:term?f.terminatedOn:null,
    code:makeContractCode(f.plate,f.startDate,f.driverName)};
  /* A contract may only be marked Completed once nothing is outstanding.
     Terminated exists precisely for closing one that still owes money. */
  if(f.status==="completed"){
    const probe=Object.assign({},contractById(f.id)||{},fields,{id:f.id||"probe"});
    const R=contractRollup(probe);
    if(R.amountDue>0)
      return alert("This contract cannot be marked Completed.\n\nOutstanding: "+
        tzs(R.amountDue)+" (expected "+tzs(R.totalExpected)+", deposited "+
        tzs(R.totalDeposited)+").\n\nRecord the remaining deposits first, or use "+
        "Terminated to close it while money is still owed.");
    if(R.finesOutstanding>0)
      return alert("This contract cannot be marked Completed.\n\nUnpaid fines: "+
        tzs(R.finesOutstanding)+".\n\nRecord the fine payments first, or use Terminated.");
  }
  const done=function(){
    if(f.id) Object.assign(contractById(f.id),fields);
    else db.contracts.push(Object.assign({id:uid()},fields));
    save(); closeModal(); renderMain();
  };
  if(f.id) requirePin("update this contract",done); else done();
}
function viewContract(id){
  const r=rollupOf(id); if(!r) return; const c=r.contract, d=driverById(c.driverId);
  const dur=(c.durationMonths?c.durationMonths+" months ":"")+(c.durationWeeks?c.durationWeeks+" weeks":"");
  const fin=c.fineMode==="none"?"No fine"
    :(c.fineMode==="weekly"?tzs(c.fineAmount)+" per week":tzs(c.fineAmount)+" per day");
  const rows=[["Contract ID",esc(c.code||"")],["Driver",esc(d?d.name:"?")],
    ["Driver Phone",esc((d&&d.phone)||c.driverPhone||"\u2014")],["Plate",esc(plateOf(c))],
    ["Status",statusLabel(c.status)],["Start Date",fmtDate(c.startDate)],
    ["End Date",fmtDate(c.endDate)],["Termination Date",c.terminatedOn?fmtDate(c.terminatedOn):"\u2014"],
    ["Duration",dur.trim()||"\u2014"],["Contracted Daily Earning",tzs(c.dailyRate)],
    ["Contracted Weekly Earning",tzs((Number(c.dailyRate)||0)*7)],["Fine",fin],
    ["Referral",esc(c.referralName||"\u2014")],["Referral Phone",esc(c.referralPhone||"\u2014")],
    ["Weeks Recorded",r.weeksCounted],["Deposits",r.depositCount],["Late Weeks",r.weeksLate],
    ["Total Expected Amount",tzs(r.totalExpected)],["Deposited Amount",tzs(r.totalDeposited)],
    ["Outstanding",tzs(r.amountDue)],["Fines Charged",tzs(r.fines)],
    ["Fines Outstanding",tzs(r.finesOutstanding)],
    ["% Repaid (of expected)",r.percent.toFixed(1)+"%"],
    ["Motorcycle Purchase Price",tzs(c.purchasePrice)]];
  openModal("Contract Details",
    '<div class="kpis" style="grid-template-columns:1fr 1fr 1fr">'+
      kpi("k3","Total Expected (TZS)",money(r.totalExpected))+
      kpi("k1","Deposited (TZS)",money(r.totalDeposited))+
      kpi("k4","Outstanding (TZS)",money(r.amountDue))+'</div>'+
    '<table style="margin-top:16px"><tbody>'+rows.map(kv=>
      '<tr><td style="color:var(--muted)">'+kv[0]+'</td><td><b>'+kv[1]+'</b></td></tr>').join("")+
    '</tbody></table><div class="btnrow" style="margin-top:18px">'+
      (canEdit()?'<button class="btn pri" data-act="editContract" data-id="'+id+'">'+
        ic("pencil")+' Edit</button>':"")+
      '<button class="btn" data-act="closeModal">Close</button></div>');
}

/* ===================== ADD DEPOSIT ===================== */
let F=null;
const blankDeposit=()=>({id:"",contractId:"",depositDate:today(),
  weekStart:mondayOfWeek(today()),weekTouched:false,amount:"",finePaid:"",note:""});
function tabEntry(){ if(!F) F=blankDeposit(); return entryHTML(); }

function entryHTML(){
  const db=DB();
  const list=db.contracts.filter(c=>c.status==="active"||c.id===F.contractId);
  const c=F.contractId?contractById(F.contractId):null;
  const R=c?contractRollup(c):null;
  const wk=R?R.weeks.find(w=>w.weekStart===F.weekStart):null;
  const rate=c?Number(c.dailyRate)||0:0;
  const alreadyAll=wk?wk.deposited:0;
  const already=F.id&&wk?alreadyAll-(Number((db.deposits.find(x=>x.id===F.id)||{}).amount)||0):alreadyAll;
  const expected=c?weekExpected(c,F.weekStart):0;
  const after=already+numOf(F.amount);

  const weekEnd=addDays(F.weekStart,6);
  const closed=dayNum(weekEnd)<dayNum(today());
  const daysOwed=rate>0?Math.round(expected/rate):0;
  const hasFine=!!(c&&c.fineMode&&c.fineMode!=="none"&&Number(c.fineAmount)>0);
  /* Week balance: everything banked against this week (including the entry
     being typed) minus what the week expects. Negative = still owed. */
  const weekBalance=after-expected;
  const shortNow=Math.max(-weekBalance,0);
  const entryCount=(wk?wk.count:0)+(F.id?0:(numOf(F.amount)>0?1:0));
  /* The fine follows the money actually banked by the Sunday, and it responds
     live to the entry being typed when that payment falls inside the week. */
  const selfDep=F.id?(db.deposits.find(x=>x.id===F.id)||{}):null;
  const priorBySunday=wk?wk.deposits.reduce(function(a,r){
    if(selfDep&&r.id===selfDep.id) return a;
    return dayNum(r.depositDate)<=dayNum(weekEnd)?a+(Number(r.amount)||0):a;},0):0;
  const paidBySundayNow=priorBySunday+
    (dayNum(F.depositDate)<=dayNum(weekEnd)?numOf(F.amount):0);
  const dueForFine=(wk?wk.carriedIn:0)+expected;
  const shortBySunday=Math.max(dueForFine-paidBySundayNow,0);
  const fineCharged=(c&&closed)?weekFineFor(c,shortBySunday,daysOwed):0;
  const lateDays=(rate>0&&shortBySunday>0&&closed)
    ?Math.min(Math.ceil(shortBySunday/rate),daysOwed||7):0;
  const finesPaidWeek=wk?wk.finePaid:0;
  /* Everything owed from earlier weeks that is still unpaid, fines included.
     wk holds the cumulative totals to the END of the selected week, so we
     subtract this week's own figures to get the position going into it. */
  const priorExpected=wk?wk.cumExpected-expected:0;
  const priorDeposited=wk?wk.cumDeposited-wk.deposited:0;
  const priorFine=wk?wk.cumFine-wk.fine:0;
  const priorFinePaid=wk?wk.cumFinePaid-wk.finePaid:0;
  const arrears=Math.max((priorExpected+priorFine)-(priorDeposited+priorFinePaid),0);
  /* position up to AND INCLUDING this week, with the entry being typed */
  const finePaidNow=(wk?wk.finePaid-(F.id?
    (Number((db.deposits.find(x=>x.id===F.id)||{}).finePaid)||0):0):0)+numOf(F.finePaid);
  const cumExpectedTo=priorExpected+expected;
  const cumDepositedTo=priorDeposited+after;
  const cumFineTo=priorFine+fineCharged;
  const cumFinePaidTo=priorFinePaid+finePaidNow;
  const totalDueUpTo=(cumExpectedTo+cumFineTo)-(cumDepositedTo+cumFinePaidTo);
  const priorLateDays=wk?wk.cumLateDays-wk.lateDays:0;
  const lateDaysUpTo=priorLateDays+lateDays;
  const cumBal=cumDepositedTo-cumExpectedTo;
  const dateOutside=dayNum(F.depositDate)<dayNum(F.weekStart);
  /* Nothing may be recorded ahead of today: a deposit that has not happened
     yet would inflate collections and mask a real arrears position. */
  const futureDate=dayNum(F.depositDate)>dayNum(today());
  const futureWeek=dayNum(F.weekStart)>dayNum(mondayOfWeek(today()));

  let h='<details class="expander" open><summary>'+ic("deposit",14)+
    (F.id?' Edit Deposit':' Add Deposit')+'</summary><div class="body">';
  if(!list.length) h+='<div class="banner warn">No active contracts. Create one on the Contracts tab first.</div>';
  h+='<div class="grid2">'+
    '<div><label class="f">Contract ID <span class="req">*</span></label>'+
      '<select class="i" data-f="contractId"><option value="">\u2014 select \u2014</option>'+
      list.map(x=>'<option value="'+x.id+'"'+(F.contractId===x.id?" selected":"")+'>'+
        esc(x.code||plateOf(x))+' \u00B7 '+esc(driverNameOf(x))+'</option>').join("")+
      '</select></div>'+
    '<div><label class="f">Driver / Plate</label>'+
      '<input class="i" value="'+(c?esc(driverNameOf(c))+"  \u00B7  "+esc(plateOf(c)):"")+'" readonly></div>'+
    '<div><label class="f">Deposit Date <span class="req">*</span></label>'+
      '<input class="i" type="date" data-f="depositDate" value="'+F.depositDate+
      '" max="'+today()+'">'+
      (futureDate?'<div class="errmsg">A deposit cannot be dated in the future. '+
        'The latest allowed date is '+fmtDate(today())+'.</div>'+
        '<button class="btn sm" data-act="depToday" style="margin-top:6px">Use today</button>'
       :'<div class="hint">'+DAYS[weekdayIdx(F.depositDate)]+
        ' \u00B7 several deposits may be recorded in the same week.</div>')+'</div>'+
    '<div><label class="f">Week (Monday) <span class="req">*</span></label>'+
      '<input class="i" type="date" data-f="weekStart" value="'+F.weekStart+
      '" max="'+mondayOfWeek(today())+'">'+
      (futureWeek?'<div class="errmsg">That week has not started yet. '+
        'The latest week you can record against begins '+fmtDate(mondayOfWeek(today()))+
        '.</div><button class="btn sm" data-act="weekNow" style="margin-top:6px">'+
        'Use the current week</button>':"")+
      (F.weekTouched&&!F.id?'<button class="btn sm" data-act="weekAuto" style="margin-top:6px">'+
        'Follow the deposit date again</button>':"")+
      (isMonday(F.weekStart)?'<div class="hint">Week '+fmtDate(F.weekStart)+' \u2013 '+fmtDate(weekEnd)+
        (closed?" \u00B7 closed":" \u00B7 still open")+
        (dayNum(F.depositDate)>dayNum(weekEnd)
          ?' \u00B7 <b>late payment for an earlier week</b>':"")+'</div>'
       :'<div class="errmsg">The week must start on a Monday.</div>'+
        '<button class="btn sm" data-act="snap" style="margin-top:6px">Snap to '+
        fmtDate(mondayOfWeek(F.weekStart))+'</button>')+
      (dateOutside?'<div class="warnmsg">The deposit date is before this week starts. '+
        'Confirm the week is right.</div>':"")+
      '</div>'+
    '<div><label class="f">Amount Deposited (TZS) <span class="req">*</span></label>'+
      '<input class="i num" type="text" inputmode="numeric" data-f="amount" data-numeric="1" value="'+
      esc(F.amount)+'" placeholder="15000">'+
      '<div class="echo">'+(String(F.amount).length?money(numOf(F.amount)):"")+'</div></div>'+
    (hasFine?'<div><label class="f">Fine Paid (TZS)</label>'+
      '<input class="i num" type="text" inputmode="numeric" data-f="finePaid" data-numeric="1" value="'+
      esc(F.finePaid)+'" placeholder="0">'+
      '<div class="hint">Contract fine: '+money(c.fineAmount)+' per '+
      (c.fineMode==="weekly"?"week":"day")+'</div></div>':"")+
    '</div>'+
    '<label class="f">Note</label>'+
    '<input class="i" data-f="note" value="'+esc(F.note)+'" placeholder="Optional reference">';

  if(c){
    h+='<div class="calc">'+
      '<div class="r"><span>Contracted daily earning (from contract)</span><b class="num">'+
        tzs(rate)+'</b></div>'+
      '<div class="r"><span>Expected this week (7 days)</span><b class="num">'+
        tzs(expected)+'</b></div>'+
      (arrears>0?'<div class="r"><span>Arrears brought forward'+
        (priorFine-priorFinePaid>0?' (incl. '+tzs(priorFine-priorFinePaid)+' unpaid fines)':"")+
        '</span><b class="num neg">'+tzs(arrears)+'</b></div>':"")+
      '<div class="r"><span>Already deposited this week ('+entryCount+' entr'+
        (entryCount===1?"y":"ies")+', including this one)</span><b class="num">'+
        tzs(after)+'</b></div>'+
      '<hr>'+
      '<div class="r"><span><b>'+(totalDueUpTo>0?"Total due up to this week (TZS)"
        :"Paid above expected up to this week (TZS)")+'</b></span>'+
        '<b class="num" style="font-size:18px;color:'+(totalDueUpTo>0?"#d62728":"#09ab3b")+'">'+
        balText(-totalDueUpTo)+'</b></div>'+
      '<div class="r"><span>Late payment up to this week (days)</span>'+
        '<b class="num'+(lateDaysUpTo>0?" neg":"")+'">'+lateDaysUpTo+'</b></div>'+
      '<div class="r"><span>Fines charged up to this week (TZS)</span>'+
        '<b class="num'+(cumFineTo>0?" neg":"")+'">'+tzs(cumFineTo)+'</b></div>'+
      '<div class="r"><span>Total fines paid up to this week (TZS)</span><b class="num">'+
        tzs(cumFinePaidTo)+'</b></div>'+
      '<div class="r"><span>Balance to date (all weeks)</span><b class="num '+
        (cumBal<0?"neg":"pos")+'">'+balText(cumBal)+'</b></div>'+
      '</div>'+
      '<div class="banner '+(totalDueUpTo<=0?"ok":"warn")+'">'+
        (totalDueUpTo<=0
          ?'<b>Nothing outstanding'+(totalDueUpTo<0?" \u2014 "+tzs(-totalDueUpTo)+
             " ahead":"")+'.</b> Settled up to the week of '+fmtDate(F.weekStart)+'.'
          :'<b>Still owed '+tzs(totalDueUpTo)+'</b> up to the week of '+fmtDate(F.weekStart)+
           (arrears>0?' \u2014 including '+tzs(arrears)+' carried from earlier weeks':"")+
           (weekBalance<0&&arrears>0?', and '+tzs(-weekBalance)+' short this week':"")+'.')+
      '</div>';
  }
  h+='<div class="btnrow" style="margin-top:16px">'+
    '<button class="btn pri" data-act="saveDep"'+((futureDate||futureWeek)?" disabled":"")+'>'+
    ic("check")+(F.id?' Update Deposit':' Add Deposit')+'</button>'+
    '<button class="btn" data-act="clearDep">Clear</button></div></div></details>';

  const q=TXT.rec;
  const recent=depositRows().filter(r=>matches([r.driverName,r.plate,r.code,r.depositDate].join(" "),q));
  h+='<h3 class="sec">Recent Records</h3>'+
    filterBox("rec","Filter by plate, driver, contract ID or date\u2026")+
    table(["Week Start","Week End","Deposit Date","Contract ID","Driver Name","Plate","Status",
      "Amount","Fine Paid","Balance to Date",""],
      recent.map(r=>[fmtDate(r.weekStart),fmtDate(r.weekEnd),fmtDate(r.depositDate),
        esc(r.code),esc(r.driverName),esc(r.plate),statusLabel(r.status),
        {n:money(r.amount)},{n:money(r.finePaid)},bal(r.balance),
        canEdit()?('<button class="btn sm" data-act="editDep" data-id="'+r.id+'">'+ic("pencil",13)+
          ' Edit</button> <button class="btn sm dang" data-act="delDep" data-id="'+r.id+'">'+
          ic("trash",13)+'</button>'):""]))+
    '<div class="hint" style="margin-top:8px">'+recent.length+' deposit(s) after filtering.</div>';
  return h;
}
function refreshEntry(){
  const a=document.activeElement, k=a&&a.dataset?a.dataset.f:null, pos=a&&a.selectionStart;
  const host=document.getElementById("depBody")||document.getElementById("tabBody");
  host.innerHTML=document.getElementById("depBody")?depModalHTML():entryHTML();
  const n=host.querySelector('[data-f="'+k+'"]');
  if(k&&n){ n.focus(); try{ if(pos!=null&&n.setSelectionRange) n.setSelectionRange(pos,pos); }catch(e){} }
}
function saveDeposit(){
  if(!guard()) return;
  const db=DB();
  if(!F.contractId) return alert("Select a contract.");
  if(!isMonday(F.weekStart)) return alert("The week must start on a Monday.");
  if(!(numOf(F.amount)>0)) return alert("Enter the amount deposited.");
  if(dayNum(F.depositDate)>dayNum(today()))
    return alert("A deposit cannot be dated in the future.\n\nDeposit date: "+
      fmtDate(F.depositDate)+"\nToday: "+fmtDate(today()));
  if(dayNum(F.weekStart)>dayNum(mondayOfWeek(today())))
    return alert("That week has not started yet.\n\nWeek beginning: "+
      fmtDate(F.weekStart)+"\nCurrent week begins: "+fmtDate(mondayOfWeek(today())));
  const c=contractById(F.contractId);
  if(dayNum(F.depositDate)<dayNum(c.startDate))
    return alert("The deposit date is before the contract start date.");
  const rec={contractId:F.contractId,depositDate:F.depositDate,weekStart:F.weekStart,
    amount:numOf(F.amount),finePaid:numOf(F.finePaid),note:F.note};
  const done=function(){
    if(F.id) Object.assign(db.deposits.find(x=>x.id===F.id),rec);
    else db.deposits.push(Object.assign({id:uid(),createdAt:new Date().toISOString()},rec));
    save();
    if(document.getElementById("depBody")){ closeModal(); renderMain(); }
    else { F=blankDeposit(); renderMain(); }
  };
  if(F.id) requirePin("update this deposit",done); else done();
}
/* edit a deposit from any table, in a modal */
function depModalHTML(){ return entryHTML(); }
function editDeposit(id){
  if(!guard()) return;
  const d=DB().deposits.find(x=>x.id===id); if(!d) return;
  F={id:d.id,contractId:d.contractId,depositDate:d.depositDate,weekStart:d.weekStart,
    amount:String(d.amount||""),finePaid:String(d.finePaid||""),note:d.note||""};
  openModal("Edit Deposit",'<div id="depBody">'+entryHTML()+'</div>',true);
}
function deleteDeposit(id){
  if(!guard()) return;
  requirePin("delete this deposit",function(){
    const db=DB(); db.deposits=db.deposits.filter(r=>r.id!==id); save();
    closeModal(); renderMain();
  });
}

/* ===================== REPORTS ===================== */
function tabReports(){
  const sum=filteredDriverSummary(), T=reportTotals(sum), R=resolveRange();
  const deps=filteredDeposits();
  return '<div class="banner">Reporting period: <b>'+esc(periodLabel())+'</b> ('+
      esc(dmy(R[0]))+' \u2013 '+esc(dmy(R[1]))+') \u00B7 '+
      (FS.driverFilter==="All"?"all drivers":esc(selectedDrivers().join(", ")||"none"))+
      '. Every export carries this period in its header.</div>'+
    '<div class="btnrow" style="margin-bottom:20px">'+
      '<button class="btn pri" data-act="exportPdf">'+ic("printer")+' Export PDF</button>'+
      '<button class="btn pri" data-act="exportXlsx">'+ic("download")+' Export Excel</button>'+
      '<button class="btn" data-act="exportCsv">'+ic("download")+' Export CSV</button>'+
      depositBtn+'</div>'+
    '<h3 class="sec">Report Summary</h3>'+
    '<div class="kpis">'+
      kpi("k1","Drivers in Report",T.drivers)+
      kpi("k2","Weeks Covered",T.weeks)+
      kpi("k3","Total Expected Earnings (TZS)",money(T.expected))+
      kpi("k4","Total Deposited Earnings (TZS)",money(T.deposited))+'</div>'+
    '<div class="kpis" style="margin-top:14px">'+
      kpi("k4","Total Amount Due (TZS)",money(T.due))+
      kpi("k2","Fines Charged (TZS)",money(T.fines))+
      kpi("k1","Fines Outstanding (TZS)",money(T.finesOutstanding))+
      kpi("k3","Late Weeks",T.late)+'</div>'+
    '<h3 class="sec">All deposits in the period</h3>'+
    table(["Week Start","Week End","Deposit Date","Contract ID","Driver Name","Plate","Status",
      "Amount Deposited","Fine Paid","Balance to Date"],
      deps.map(r=>[fmtDate(r.weekStart),fmtDate(r.weekEnd),fmtDate(r.depositDate),
        esc(r.code),esc(r.driverName),esc(r.plate),statusLabel(r.status),
        {n:money(r.amount)},{n:money(r.finePaid)},bal(r.balance)]))+
    '<div class="hint" style="margin-top:8px">'+deps.length+' deposit(s) in this period.</div>'+
    '<h3 class="sec">Per-driver breakdown</h3>'+
    table(["Driver Name","Plate","Weeks","Expected","Deposited","Balance","Fine",
      "Fines Charged","Fines Paid","Fines Outstanding","Late Weeks"],
      sum.map(r=>[esc(r.name),esc(r.plate),{n:r.weeks},{n:money(r.expected)},{n:money(r.deposited)},
        bal(-r.due),
        {n:r.fineMode==="none"?"None":money(r.fineAmount)+"/"+(r.fineMode==="weekly"?"wk":"day")},
        {n:money(r.fines)},{n:money(r.finesPaid)},
        {n:money(r.finesOutstanding),cls:r.finesOutstanding>0?"neg":""},{n:r.late}]));
}

/* ===================== TOOLS ===================== */
function tabTools(){
  const db=DB(), q=TXT.tool;
  const V=allVehicleRollups().filter(v=>matches([v.vehicle.plate,v.vehicle.chassis||"",
    v.vehicle.model||"",v.vehicle.colour||"",v.currentDriver].join(" "),q));
  return '<h3 class="sec">Motorcycle register</h3>'+
    '<div class="btnrow" style="margin-bottom:14px">'+
      '<button class="btn pri" data-act="newVehicle">'+ic("plus")+' Add Motorcycle</button>'+
      '<button class="btn" data-act="editColours">'+ic("gear")+' Vehicle Colours</button>'+
      '<button class="btn" data-act="editModels">'+ic("gear")+' Vehicle Models</button>'+
      '<button class="btn" data-act="dlVehiclesXlsx">'+ic("download")+' Excel</button>'+
    '</div>'+
    filterBox("tool","Filter by plate, chassis, model, colour or driver\u2026")+
    table(["Plate #","Chassis","Model","Colour","Purchased Date","Purchased Amount (TZS)",
      "Repair Cost (TZS)","Total Cost (TZS)",
      "Insurance","Vehicle Status","Recent Driver","Total Drivers Contracted",
      "Total Amount Deposited (TZS)","Outstanding Amount (TZS)",""],
      V.map(v=>{const b=v.vehicle;
        const ins=b.hasInsurance?(b.insuranceEnd
          ?(dayNum(b.insuranceEnd)<dayNum(today())
            ?'<span class="pill r">Expired</span>':'<span class="pill g">To '+fmtDate(b.insuranceEnd)+'</span>')
          :'<span class="pill g">Yes</span>'):'<span class="pill">No</span>';
        return [esc(b.plate),esc(b.chassis||"\u2014"),esc(b.model||"\u2014"),
          esc(b.colour||"\u2014"),b.purchaseDate?fmtDate(b.purchaseDate):"\u2014",
          {n:money(b.purchaseAmount)},{n:money(v.repairCost)},{n:money(v.totalCost)},
          ins,statusLabel(v.status)+
            (v.active?"":' <span class="hint" style="display:inline">not tracked</span>'),
          esc(v.recentDriver),{n:v.driverCount},{n:money(v.totalDeposited)},
          bal(v.totalDeposited-v.totalCost),
          '<button class="btn sm" data-act="viewVehicle" data-id="'+b.id+'">'+ic("eye",13)+
          ' View</button>'+(canEdit()?' <button class="btn sm" data-act="editVehicle" data-id="'+
          b.id+'">'+ic("pencil",13)+'</button>':"")];}))+
    '<div class="hint" style="margin-top:8px">'+V.length+' of '+db.vehicles.length+
    ' motorcycle(s) \u00B7 '+V.filter(x=>x.active).length+' active.</div>'+
    '<h3 class="sec">Backup and restore</h3>'+
    '<div class="card"><div class="btnrow">'+
      '<button class="btn pri" data-act="json">'+ic("download")+' Download backup (JSON)</button>'+
      '<button class="btn" data-act="pickRestore">'+ic("upload")+' Upload backup (JSON)</button>'+
      '<input type="file" id="restoreFile" accept="application/json,.json" class="hide">'+
      '</div><div class="hint" style="margin-top:10px">Restoring replaces everything currently on '+
      'this device. Download a backup first if you are unsure.</div></div>'+
    '<h3 class="sec">Checks</h3>'+
    '<div class="card"><div class="btnrow">'+
      '<button class="btn" data-act="selftest">'+ic("check")+' Run calculation self-test</button>'+
      '<button class="btn dang" data-act="reset">'+ic("trash")+' Reset all data</button>'+
      '</div><div id="testOut"></div></div>';
}

/* --- colours and models: simple editable lists --- */
function listEditor(kind){
  const db=DB(), key=kind==="colour"?"colours":"models";
  const title=kind==="colour"?"Vehicle Colours":"Vehicle Models";
  openModal(title,
    '<div class="hint" style="margin-bottom:12px">These appear as choices when adding or '+
    'editing a motorcycle.</div>'+
    table(["Name","Used by",""],db[key].map((n,i)=>{
      const used=db.vehicles.filter(v=>(kind==="colour"?v.colour:v.model)===n).length;
      return [esc(n),{n:used+" vehicle"+(used===1?"":"s")},
        '<button class="btn sm dang" data-act="delListItem" data-kind="'+kind+
        '" data-idx="'+i+'">'+ic("trash",13)+'</button>'];}))+
    '<label class="f">Add a new '+kind+'</label>'+
    '<div class="btnrow"><input class="i" id="liNew" style="flex:1;min-width:180px" '+
      'placeholder="'+(kind==="colour"?"e.g. Maroon":"e.g. Boxer BM150")+'" autocapitalize="words">'+
      '<button class="btn pri" data-act="addListItem" data-kind="'+kind+'">'+ic("plus")+' Add</button>'+
    '</div>'+
    '<div class="btnrow" style="margin-top:16px">'+
      '<button class="btn" data-act="closeModal">Done</button></div>');
}
function addListItem(kind){
  const db=DB(), key=kind==="colour"?"colours":"models";
  const v=(document.getElementById("liNew").value||"").trim();
  if(!v) return alert("Type a name first.");
  if(db[key].some(x=>x.toLowerCase()===v.toLowerCase())) return alert("That entry already exists.");
  db[key].push(v); save(); listEditor(kind);
}
function delListItem(kind,idx){
  const db=DB(), key=kind==="colour"?"colours":"models";
  const name=db[key][idx];
  const used=db.vehicles.filter(v=>(kind==="colour"?v.colour:v.model)===name).length;
  if(used) return alert("\""+name+"\" is used by "+used+" motorcycle(s) and cannot be removed.");
  requirePin("remove \""+name+"\"",function(){
    db[key].splice(idx,1); save(); listEditor(kind);
  });
}

/* --- motorcycle form --- */
let VF=null;
/* Suggested repair categories (free text still allowed via the datalist). */
const REPAIR_TYPES=["Engine repair","Gearbox/clutch","Brakes","Tyres","Electrical",
  "Suspension","Bodywork/panels","Chain & sprocket","Battery","Service/maintenance","Other"];
const blankVehicle=()=>({id:"",plate:"",chassis:"",purchaseDate:today(),purchaseAmount:"",
  colour:"",model:"",hasInsurance:false,insuranceStart:today(),insuranceEnd:"",
  status:"active-contract",statusDate:today(),repairs:[]});
function vehicleForm(){
  const db=DB(), f=VF;
  const futurePurchase=f.purchaseDate&&dayNum(f.purchaseDate)>dayNum(today());
  const futureStatus=f.statusDate&&dayNum(f.statusDate)>dayNum(today());
  const repairs=f.repairs||[];
  const repSum=repairs.reduce((a,r)=>a+(numOf(r.cost)||0),0);
  const purchase=numOf(f.purchaseAmount)||0;
  return '<div class="grid2">'+
    '<div><label class="f">Plate Number <span class="req">*</span></label>'+
      '<input class="i" data-vf="plate" value="'+esc(f.plate)+
      '" placeholder="T 123 ABC" autocapitalize="characters"></div>'+
    '<div><label class="f">Chassis Number <span class="req">*</span></label>'+
      '<input class="i" data-vf="chassis" value="'+esc(f.chassis)+
      '" placeholder="MD2A11CY9KWJ12345" autocapitalize="characters"></div>'+
    '<div><label class="f">Purchase Date <span class="req">*</span></label>'+
      '<input class="i" type="date" data-vf="purchaseDate" value="'+f.purchaseDate+
      '" max="'+today()+'">'+
      (futurePurchase?'<div class="errmsg">The purchase date cannot be in the future.</div>':"")+
      '</div>'+
    '<div><label class="f">Purchase Amount (TZS) <span class="req">*</span></label>'+
      '<input class="i num" type="text" inputmode="numeric" data-vf="purchaseAmount" '+
      'data-numeric="1" value="'+esc(f.purchaseAmount)+'" placeholder="3000000">'+
      '<div class="echo">'+(String(f.purchaseAmount).length?money(numOf(f.purchaseAmount)):"")+'</div></div>'+
    '<div><label class="f">Colour</label><select class="i" data-vf="colour">'+
      '<option value="">\u2014 select \u2014</option>'+db.colours.map(c=>
        '<option'+(f.colour===c?" selected":"")+'>'+esc(c)+'</option>').join("")+'</select>'+
      '<div class="hint">Managed under Vehicle Colours.</div></div>'+
    '<div><label class="f">Model</label><select class="i" data-vf="model">'+
      '<option value="">\u2014 select \u2014</option>'+db.models.map(c=>
        '<option'+(f.model===c?" selected":"")+'>'+esc(c)+'</option>').join("")+'</select>'+
      '<div class="hint">Managed under Vehicle Models.</div></div>'+
    '</div>'+
    '<label class="chk"><input type="checkbox" data-vf="hasInsurance" '+
      (f.hasInsurance?"checked":"")+'> Has insurance</label>'+
    (f.hasInsurance?'<div class="grid2">'+
      '<div><label class="f">Insurance Start</label>'+
        '<input class="i" type="date" data-vf="insuranceStart" value="'+(f.insuranceStart||"")+'"></div>'+
      '<div><label class="f">Insurance End</label>'+
        '<input class="i" type="date" data-vf="insuranceEnd" value="'+(f.insuranceEnd||"")+'"></div>'+
      '</div>':"")+
    '<h4 class="sec" style="font-size:15px;margin:20px 0 4px">Repairs &amp; maintenance</h4>'+
    '<datalist id="repairTypes">'+REPAIR_TYPES.map(t=>'<option value="'+esc(t)+'">').join("")+'</datalist>'+
    (repairs.length?repairs.map((r,i)=>
      '<div style="border:1px solid var(--border2);border-radius:10px;padding:10px;margin-bottom:10px">'+
        '<div class="grid3">'+
          '<div><label class="f">Repair Type</label>'+
            '<input class="i" list="repairTypes" data-rep="'+i+':type" value="'+esc(r.type||"")+
            '" placeholder="e.g. Engine repair"></div>'+
          '<div><label class="f">Repair Date</label>'+
            '<input class="i" type="date" data-rep="'+i+':date" value="'+(r.date||"")+
            '" max="'+today()+'"></div>'+
          '<div><label class="f">Cost (TZS)</label>'+
            '<input class="i num" type="text" inputmode="numeric" data-numeric="1" data-rep="'+i+
            ':cost" value="'+esc(r.cost||"")+'" placeholder="50000">'+
            '<div class="echo">'+(String(r.cost||"").length?money(numOf(r.cost)):"")+'</div></div>'+
        '</div>'+
        '<button class="btn sm dang" data-act="delRepair" data-id="'+i+'">'+ic("trash",13)+
          ' Remove repair</button>'+
      '</div>').join("")
     :'<div class="hint">No repairs recorded yet.</div>')+
    '<div class="btnrow" style="margin-top:6px">'+
      '<button class="btn sm" data-act="addRepair">'+ic("plus",13)+' Add repair</button></div>'+
    '<div class="hint" style="margin-bottom:6px">Repair cost <b>'+money(repSum)+
      '</b> \u00B7 total cost of motorcycle (purchase + repairs) <b>'+money(purchase+repSum)+'</b></div>'+
    '<div class="grid2">'+
    '<div><label class="f">Vehicle Status</label><select class="i" data-vf="status">'+
      VSTATUS.map(x=>'<option value="'+x[0]+'"'+(f.status===x[0]?" selected":"")+'>'+x[1]+
      '</option>').join("")+'</select>'+
      '<div class="hint">Pending, Active-contract and Completed are set automatically from the '+
      'vehicle\'s contracts. Choose <b>Sold</b> or <b>Stolen</b> to override and hold it there.</div></div>'+
    '<div><label class="f">Vehicle Status Date</label>'+
      '<input class="i" type="date" data-vf="statusDate" value="'+(f.statusDate||"")+
      '" max="'+today()+'">'+
      (futureStatus?'<div class="errmsg">The status date cannot be in the future.'+
        (MANUAL_VSTATUS.indexOf(f.status)>=0
          ?' A '+f.status+' motorcycle stops earning on this date, so it must have passed.':"")+
        '</div>':"")+'</div>'+
    '</div>'+
    '<div class="btnrow" style="margin-top:18px">'+
      '<button class="btn pri" data-act="saveVehicle"'+
        ((futurePurchase||futureStatus)?" disabled":"")+'>'+
        ic("check")+' Save Motorcycle</button>'+
      (f.id?'<button class="btn dang" data-act="delVehicle" data-id="'+f.id+'">'+
        ic("trash")+' Delete</button>':"")+
      '<button class="btn" data-act="closeModal">Cancel</button></div>';
}
function openVehicle(id){
  const v=id?vehicleById(id):null;
  VF=v?{id:v.id,plate:v.plate,chassis:v.chassis||"",purchaseDate:v.purchaseDate||today(),
    purchaseAmount:String(v.purchaseAmount||""),colour:v.colour||"",model:v.model||"",
    hasInsurance:!!v.hasInsurance,insuranceStart:v.insuranceStart||"",
    insuranceEnd:v.insuranceEnd||"",status:v.status||"active-contract",
    statusDate:v.statusDate||today(),
    repairs:(v.repairs||[]).map(r=>({id:r.id||"",type:r.type||"",date:r.date||"",
      cost:String(r.cost||"")}))}:blankVehicle();
  openModal(id?"Edit Motorcycle":"Add Motorcycle",vehicleForm());
}
function refreshVehicleForm(){
  const b=document.getElementById("mBody"), a=document.activeElement;
  const k=a&&a.dataset?a.dataset.vf:null, rk=a&&a.dataset?a.dataset.rep:null;
  const pos=a&&a.selectionStart;
  b.innerHTML=vehicleForm();
  const n=k?b.querySelector('[data-vf="'+k+'"]')
          :(rk?b.querySelector('[data-rep="'+rk+'"]'):null);
  if(n){ n.focus(); try{ if(pos!=null&&n.setSelectionRange) n.setSelectionRange(pos,pos); }catch(e){} }
}
function saveVehicle(){
  if(!guard()) return;
  const db=DB(), f=VF;
  if(!f.plate.trim()) return alert("Enter the plate number.");
  if(!f.chassis.trim()) return alert("Enter the chassis number.");
  if(!f.purchaseDate) return alert("Enter the purchase date.");
  if(!(numOf(f.purchaseAmount)>0)) return alert("Enter the purchase amount.");
  if(dayNum(f.purchaseDate)>dayNum(today()))
    return alert("The purchase date cannot be in the future.");
  if(f.statusDate&&dayNum(f.statusDate)>dayNum(today()))
    return alert("The vehicle status date cannot be in the future.\n\n"+
      "Status date: "+fmtDate(f.statusDate)+"\nToday: "+fmtDate(today()));
  const clash=db.vehicles.find(v=>plateKey(v.plate)===plateKey(f.plate)&&v.id!==f.id);
  if(clash) return alert("A motorcycle with that plate is already registered.");
  const chClash=db.vehicles.find(v=>v.chassis&&f.chassis&&
    v.chassis.toUpperCase().replace(/\s+/g,"")===f.chassis.toUpperCase().replace(/\s+/g,"")&&v.id!==f.id);
  if(chClash) return alert("That chassis number is already registered to "+chClash.plate+".");
  if(f.hasInsurance&&f.insuranceStart&&f.insuranceEnd&&
     dayNum(f.insuranceEnd)<dayNum(f.insuranceStart))
    return alert("The insurance end date is before the start date.");
  /* Clean and validate repairs: skip blank rows, require a type, a non-future
     date and a positive cost for any repair that is kept. */
  const cleanRepairs=[];
  for(const r of (f.repairs||[])){
    const type=(r.type||"").trim(), cost=numOf(r.cost)||0, date=r.date||"";
    if(!type&&!date&&!cost) continue;
    if(!type) return alert("Give a repair type for each repair, or remove the empty row.");
    if(!date) return alert("Give a repair date for the \u201C"+type+"\u201D repair.");
    if(dayNum(date)>dayNum(today()))
      return alert("A repair date cannot be in the future (\u201C"+type+"\u201D).");
    if(!(cost>0)) return alert("Enter a cost greater than zero for the \u201C"+type+"\u201D repair.");
    cleanRepairs.push({id:r.id||uid(),type:type,date:date,cost:cost});
  }
  const fields={plate:f.plate.trim().toUpperCase(),chassis:f.chassis.trim().toUpperCase(),
    purchaseDate:f.purchaseDate,purchaseAmount:numOf(f.purchaseAmount),
    colour:f.colour,model:f.model,hasInsurance:!!f.hasInsurance,
    insuranceStart:f.hasInsurance?f.insuranceStart:"",insuranceEnd:f.hasInsurance?f.insuranceEnd:"",
    status:f.status,statusDate:f.statusDate,repairs:cleanRepairs};
  const done=function(){
    if(f.id) Object.assign(vehicleById(f.id),fields);
    else db.vehicles.push(Object.assign({id:uid()},fields));
    save(); closeModal(); renderMain();
  };
  if(f.id) requirePin("update this motorcycle",done); else done();
}
function deleteVehicle(id){
  if(!guard()) return;
  const used=DB().contracts.filter(c=>(c.vehicleId||c.bikeId)===id).length;
  if(used) return alert("This motorcycle has "+used+" contract(s) and cannot be deleted.");
  requirePin("delete this motorcycle",function(){
    const db=DB(); db.vehicles=db.vehicles.filter(v=>v.id!==id);
    save(); closeModal(); renderMain();
  });
}
function pickRestore(){
  const el=document.getElementById("restoreFile"); if(el) el.click();
}
function handleRestore(file){
  const fr=new FileReader();
  fr.onload=function(){
    try{
      const j=JSON.parse(fr.result);
      if(!j||!Array.isArray(j.contracts)||!Array.isArray(j.deposits))
        return alert("That file is not a dashboard backup.");
      requirePin("replace all data on this device",function(){
        const keepOwner=DB().owner, keepName=DB().ownerName, keepSession=DB().session;
        mem=Object.assign(freshDB(),j);
        if(!mem.owner){ mem.owner=keepOwner; mem.ownerName=keepName; }
        mem.session=keepSession;
        save(); render(); alert("Backup restored.");
      });
    }catch(e){ alert("Could not read that file: "+e.message); }
  };
  fr.readAsText(file);
}

/* ===================== EXPORT ===================== */
const CRC=(function(){const t=new Uint32Array(256);
  for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}
  return t;})();
function crc32(b){let c=0xFFFFFFFF;
  for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&0xFF]^(c>>>8);
  return (c^0xFFFFFFFF)>>>0;}
function zipStore(files){
  const enc=new TextEncoder(), local=[], central=[]; let off=0;
  const u16=n=>[n&255,(n>>8)&255], u32=n=>[n&255,(n>>8)&255,(n>>16)&255,(n>>24)&255];
  files.forEach(f=>{
    const name=enc.encode(f.name);
    const data=typeof f.data==="string"?enc.encode(f.data):f.data;
    const crc=crc32(data);
    const lh=new Uint8Array([].concat(u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),
      u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0)));
    local.push(lh,name,data);
    central.push(new Uint8Array([].concat(u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),
      u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),
      u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(off))),name);
    off+=lh.length+name.length+data.length;
  });
  let cdLen=0; central.forEach(c=>cdLen+=c.length);
  const eocd=new Uint8Array([].concat(u32(0x06054b50),u16(0),u16(0),
    u16(files.length),u16(files.length),u32(cdLen),u32(off),u16(0)));
  const out=new Uint8Array(off+cdLen+eocd.length); let p=0;
  local.forEach(x=>{out.set(x,p);p+=x.length;});
  central.forEach(x=>{out.set(x,p);p+=x.length;});
  out.set(eocd,p); return out;
}
const colName=n=>{let s="";n++;while(n>0){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=(n-m-1)/26;}return s;};
const xesc=s=>String(s==null?"":s).replace(/[&<>"']/g,
  c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
function sheetXml(rows){
  const body=rows.map((r,ri)=>{
    const cells=r.map((c,ci)=>{
      if(c===null||c===undefined||c==="") return "";
      const ref=colName(ci)+(ri+1);
      if(typeof c==="number") return '<c r="'+ref+'" s="2"><v>'+c+'</v></c>';
      const t=typeof c==="object"?c.t:c, s=(typeof c==="object"&&c.s!=null)?c.s:0;
      if(t==="") return "";
      return '<c r="'+ref+'" t="inlineStr" s="'+s+'"><is><t xml:space="preserve">'+xesc(t)+'</t></is></c>';
    }).join("");
    return '<row r="'+(ri+1)+'">'+cells+'</row>';
  }).join("");
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
  '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
  '<cols><col min="1" max="1" width="26" customWidth="1"/>'+
  '<col min="2" max="14" width="16" customWidth="1"/></cols>'+
  '<sheetData>'+body+'</sheetData></worksheet>';
}
function buildXlsx(rows,sheetName){
  return zipStore([
   {name:"[Content_Types].xml",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
'<Default Extension="xml" ContentType="application/xml"/>'+
'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+
'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'},
   {name:"_rels/.rels",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
   {name:"xl/workbook.xml",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '+
'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+
'<sheets><sheet name="'+xesc(sheetName).slice(0,31)+'" sheetId="1" r:id="rId1"/></sheets></workbook>'},
   {name:"xl/_rels/workbook.xml.rels",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'+
'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
   {name:"xl/styles.xml",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
'<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts>'+
'<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font>'+
'<font><b/><sz val="11"/><name val="Calibri"/></font>'+
'<font><b/><sz val="14"/><color rgb="FF173A66"/><name val="Calibri"/></font></fonts>'+
'<fills count="3"><fill><patternFill patternType="none"/></fill>'+
'<fill><patternFill patternType="gray125"/></fill>'+
'<fill><patternFill patternType="solid"><fgColor rgb="FFE7EFFA"/><bgColor indexed="64"/></patternFill></fill></fills>'+
'<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'+
'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
'<cellXfs count="5">'+
'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'+
'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'+
'<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'+
'<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>'+
'<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>'+
'<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'},
   {name:"xl/worksheets/sheet1.xml",data:sheetXml(rows)}]);
}
function download(name,data,type){
  const b=new Blob([data],{type:type||"application/octet-stream"});
  const u=URL.createObjectURL(b);
  const a=document.createElement("a"); a.href=u; a.download=name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),3000);
}
const stamp=()=>today().replace(/-/g,"");
function toCsv(rows){
  return "\uFEFF"+rows.map(r=>r.map(c=>{
    const v=(c===null||c===undefined)?"":(typeof c==="object"?(c.t==null?"":c.t):c);
    const s=String(v); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
  }).join(",")).join("\n");
}
/* report rows: summary block then every deposit in the period */
function reportRows(){
  const sum=filteredDriverSummary(), T=reportTotals(sum), R=resolveRange(), deps=filteredDeposits();
  const B=1,H=3,TT=4;
  const out=[[{t:"Bodaboda Driver Report",s:TT}],
    [{t:"Reporting Period",s:B},{t:periodLabel()}],
    [{t:"Date Range",s:B},{t:dmy(R[0])+" \u2013 "+dmy(R[1])}],
    [{t:"Drivers",s:B},{t:FS.driverFilter==="All"?"All drivers":(selectedDrivers().join(", ")||"None")}],
    [{t:"Generated",s:B},{t:fmtDate(today())}],[],
    [{t:"SUMMARY",s:H}],
    [{t:"Drivers in Report",s:B},T.drivers],[{t:"Weeks Covered",s:B},T.weeks],
    [{t:"Total Expected Earnings (TZS)",s:B},T.expected],
    [{t:"Total Deposited Earnings (TZS)",s:B},T.deposited],
    [{t:"Total Amount Due (TZS)",s:B},T.due],
    [{t:"Fines Charged (TZS)",s:B},T.fines],
    [{t:"Fines Outstanding (TZS)",s:B},T.finesOutstanding],
    [{t:"Late Weeks",s:B},T.late],[],
    [{t:"DEPOSITS IN PERIOD",s:H}],
    ["Deposit Date","Contract ID","Driver Name","Plate","Week Start","Week End",
     "Amount Deposited","Fine Paid","Balance to Date"].map(h=>({t:h,s:H}))];
  deps.forEach(r=>out.push([{t:fmtDate(r.depositDate)},{t:r.code},{t:r.driverName},{t:r.plate},
    {t:fmtDate(r.weekStart)},{t:fmtDate(r.weekEnd)},r.amount,r.finePaid,r.balance]));
  out.push([{t:"TOTAL",s:B},{t:" "},{t:" "},{t:" "},{t:" "},{t:" "},
    deps.reduce((a,r)=>a+r.amount,0),deps.reduce((a,r)=>a+r.finePaid,0),{t:" "}]);
  return out;
}
function contractRows(){
  const B=1,H=3,TT=4;
  const out=[[{t:"Contracts",s:TT}],[{t:"Reporting Period",s:B},{t:periodLabel()}],
    [{t:"Generated",s:B},{t:fmtDate(today())}],[],
    ["Contract ID","Driver Name","Driver Phone","Plate","Status","Start Date","End Date",
     "Months","Weeks","Daily Rate","Fine Type","Fine Amount","Purchase Price",
     "Total Expected","Expected to Date","Deposited",
     "Outstanding","Referral","Referral Phone"].map(h=>({t:h,s:H}))];
  allRollups().forEach(r=>{const c=r.contract,d=driverById(c.driverId);
    out.push([{t:c.code||""},{t:d?d.name:""},{t:(d&&d.phone)||c.driverPhone||""},{t:plateOf(c)},
      {t:c.status},{t:c.startDate},{t:c.terminatedOn||c.endDate||""},
      Number(c.durationMonths)||0,Number(c.durationWeeks)||0,Number(c.dailyRate)||0,
      {t:c.fineMode||"none"},Number(c.fineAmount)||0,Number(c.purchasePrice)||0,
      r.totalExpected,r.expectedToDate,
      r.totalDeposited,r.outstandingPrincipal,{t:c.referralName||""},{t:c.referralPhone||""}]);});
  return out;
}
function vehicleRows(){
  const B=1,H=3,TT=4;
  const out=[[{t:"Registered Motorcycles",s:TT}],
    [{t:"Reporting Period",s:B},{t:periodLabel()}],
    [{t:"Generated",s:B},{t:fmtDate(today())}],[],
    ["Plate","Chassis","Model","Colour","Purchase Date","Purchase Amount",
     "Repair Cost","Total Cost","Insurance",
     "Insurance Start","Insurance End","Vehicle Status","Status Date","Drivers Contracted",
     "Total Deposited","Outstanding"].map(h=>({t:h,s:H}))];
  allVehicleRollups().forEach(v=>{const b=v.vehicle;
    out.push([{t:b.plate},{t:b.chassis||""},{t:b.model||""},{t:b.colour||""},
      {t:b.purchaseDate||""},Number(b.purchaseAmount)||0,v.repairCost,v.totalCost,
      {t:b.hasInsurance?"Yes":"No"},
      {t:b.insuranceStart||""},{t:b.insuranceEnd||""},{t:b.status||""},{t:b.statusDate||""},
      v.driverCount,v.totalDeposited,v.outstanding]);});
  return out;
}
function driverRows(){
  const B=1,H=3,TT=4, deps=filteredDeposits(), R=resolveRange();
  const out=[[{t:"Driver Deposit Register",s:TT}],
    [{t:"Reporting Period",s:B},{t:periodLabel()}],
    [{t:"Date Range",s:B},{t:dmy(R[0])+" \u2013 "+dmy(R[1])}],[],
    ["Driver Name","Plate","Contract ID","Status","Week Start","Week End","Deposit Date",
     "Amount Deposited","Balance to Date"].map(h=>({t:h,s:H}))];
  deps.forEach(r=>out.push([{t:r.driverName},{t:r.plate},{t:r.code},{t:r.status},
    {t:fmtDate(r.weekStart)},{t:fmtDate(r.weekEnd)},{t:fmtDate(r.depositDate)},
    r.amount,r.balance]));
  out.push([{t:"TOTAL",s:B},{t:" "},{t:" "},{t:" "},{t:" "},{t:" "},{t:" "},
    deps.reduce((a,r)=>a+r.amount,0),{t:" "}]);
  return out;
}
/* PDF: summary as ONE table pinned top-right, like a spreadsheet header block */
function printDoc(title,summaryPairs,headers,rows,meta){
  const css='@page{size:A4 landscape;margin:12mm}'+
   'body{font:11.5px/1.45 -apple-system,Segoe UI,Roboto,sans-serif;color:#262730;margin:0}'+
   'h1{font-size:19px;margin:0 0 2px;color:#173A66}'+
   '.meta{color:#7C8698;font-size:11px}'+
   '.top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:12px}'+
   '.sumt{border-collapse:collapse;min-width:290px}'+
   '.sumt td{border:1px solid #D3DAE6;padding:4px 9px;font-size:11px}'+
   '.sumt td:first-child{background:#E7EFFA;font-weight:600;'+
     '-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
   '.sumt td:last-child{text-align:right;font-variant-numeric:tabular-nums}'+
   'table.main{border-collapse:collapse;width:100%}'+
   'table.main th,table.main td{border:1px solid #D3DAE6;padding:4px 6px;text-align:left}'+
   'table.main th{background:#E7EFFA;font-size:10px;text-transform:uppercase;letter-spacing:.3px;'+
     '-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
   'table.main td.n,table.main th.n{text-align:right;font-variant-numeric:tabular-nums}'+
   'tfoot td{font-weight:bold;background:#F2F6FC;'+
     '-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
   'thead{display:table-header-group}'+
   '.foot{margin-top:12px;color:#7C8698;font-size:10px}';
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+xesc(title)+'</title>'+
    '<style>'+css+'</style></head><body>'+
    '<div class="top"><div><h1>'+xesc(title)+'</h1>'+
      (meta||[]).map(m=>'<div class="meta">'+xesc(m)+'</div>').join("")+'</div>'+
      '<table class="sumt"><tbody>'+summaryPairs.map(p=>
        '<tr><td>'+xesc(p[0])+'</td><td>'+xesc(p[1])+'</td></tr>').join("")+
      '</tbody></table></div>'+
    '<table class="main"><thead><tr>'+headers.map(h=>
      '<th'+(h.n?' class="n"':"")+'>'+xesc(h.t||h)+'</th>').join("")+'</tr></thead><tbody>'+
      rows.map(r=>'<tr>'+r.map(c=>{
        const o=(c&&typeof c==="object");
        return '<td'+(o&&c.n?' class="n"':"")+'>'+xesc(o?(c.t!=null?c.t:c.n):c)+'</td>';
      }).join("")+'</tr>').join("")+'</tbody></table>'+
    '<div class="foot">Developer: Adam Kamese \u00B7 Generated offline from device records</div>'+
    '</body></html>';
}
function openPrint(html){
  const w=window.open("","_blank");
  if(!w) return alert("Allow pop-ups so the report window can open.\n\n"+
    "On iPhone: Settings > Safari > turn off Block Pop-ups.");
  w.document.write(html); w.document.close();
  setTimeout(function(){try{w.focus();w.print();}catch(e){}},350);
}
function exportPdf(){
  const sum=filteredDriverSummary(), T=reportTotals(sum), R=resolveRange(), deps=filteredDeposits();
  openPrint(printDoc("Bodaboda Driver Report",
    [["Drivers in Report",String(T.drivers)],["Weeks Covered",String(T.weeks)],
     ["Total Expected (TZS)",money(T.expected)],["Total Deposited (TZS)",money(T.deposited)],
     ["Total Amount Due (TZS)",money(T.due)],["Fines Charged (TZS)",money(T.fines)],
     ["Fines Outstanding (TZS)",money(T.finesOutstanding)],["Late Weeks",String(T.late)]],
    [{t:"Deposit Date"},{t:"Contract ID"},{t:"Driver Name"},{t:"Plate"},{t:"Week Start"},
     {t:"Week End"},{t:"Amount Deposited",n:1},{t:"Fine Paid",n:1},{t:"Balance to Date",n:1}],
    deps.map(r=>[fmtDate(r.depositDate),r.code,r.driverName,r.plate,fmtDate(r.weekStart),
      fmtDate(r.weekEnd),{n:1,t:money(r.amount)},{n:1,t:money(r.finePaid)},{n:1,t:balText(r.balance)}]),
    ["Reporting period: "+periodLabel(),
     "Date range: "+dmy(R[0])+" \u2013 "+dmy(R[1]),
     "Drivers: "+(FS.driverFilter==="All"?"All drivers":(selectedDrivers().join(", ")||"None")),
     "Generated: "+fmtDate(today()),deps.length+" deposit(s)"]));
}
function exportContractsPdf(){
  const R=allRollups();
  const act=R.filter(r=>r.contract.status==="active").length;
  openPrint(printDoc("Driver Contracts",
    [["Contracts",String(R.length)],["Active",String(act)],
     ["Terminated",String(R.filter(r=>r.contract.status==="terminated").length)],
     ["Ended",String(R.filter(r=>r.contract.status==="completed").length)],
     ["Total Purchase Value (TZS)",money(R.reduce((a,r)=>a+r.purchasePrice,0))],
     ["Total Deposited (TZS)",money(R.reduce((a,r)=>a+r.totalDeposited,0))],
     ["Total Outstanding (TZS)",money(R.reduce((a,r)=>a+r.outstandingPrincipal,0))]],
    [{t:"Contract ID"},{t:"Driver"},{t:"Phone"},{t:"Plate"},{t:"Status"},{t:"Start"},{t:"End"},
     {t:"Daily Rate",n:1},{t:"Fine"},{t:"Purchase",n:1},{t:"Deposited",n:1},{t:"Outstanding",n:1}],
    R.map(r=>{const c=r.contract,d=driverById(c.driverId);
      return [c.code||"",d?d.name:"",(d&&d.phone)||c.driverPhone||"",plateOf(c),c.status,
        fmtDate(c.startDate),fmtDate(c.terminatedOn||c.endDate),{n:1,t:money(c.dailyRate)},
        c.fineMode==="none"?"None":money(c.fineAmount)+"/"+(c.fineMode==="weekly"?"wk":"day"),
        {n:1,t:money(c.purchasePrice)},{n:1,t:money(r.totalDeposited)},
        {n:1,t:money(r.outstandingPrincipal)}];}),
    ["Reporting period: "+periodLabel(),"Generated: "+fmtDate(today())]));
}
function exportDriversPdf(){
  const deps=filteredDeposits(), R=resolveRange();
  const db=DB();
  openPrint(printDoc("Driver Deposit Register",
    [["Reporting Period",periodLabel()],["Date Range",dmy(R[0])+" \u2013 "+dmy(R[1])],
     ["Deposits",String(deps.length)],
     ["Total Deposited (TZS)",money(deps.reduce((a,r)=>a+r.amount,0))],
     ["Total Amount Due (TZS)",money(deps.reduce((a,r)=>a+r.amountDue,0))],
     ["Drivers",String(db.drivers.length)],
     ["Active Drivers",String(new Set(db.contracts.filter(c=>c.status==="active")
       .map(c=>c.driverId)).size)]],
    [{t:"Driver Name"},{t:"Plate"},{t:"Contract ID"},{t:"Status"},{t:"Week Start"},{t:"Week End"},
     {t:"Deposit Date"},{t:"Amount Deposited",n:1},{t:"Balance to Date",n:1}],
    deps.map(r=>[r.driverName,r.plate,r.code,r.status,fmtDate(r.weekStart),fmtDate(r.weekEnd),
      fmtDate(r.depositDate),{n:1,t:money(r.amount)},{n:1,t:balText(r.balance)}]),
    ["Reporting period: "+periodLabel(),"Generated: "+fmtDate(today())]));
}

