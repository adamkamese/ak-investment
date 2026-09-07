/* core.js
   Framework: helpers, data + cloud sync, login, shell, settings, shared widgets/charts, events, date picker.
   Part of the Boboda Business Dashboard. Loaded in order by index.html.
   Shared helpers live in core.js; edit a module file to change that module. */
"use strict";

/* ICONS - Bootstrap-style line icons */
const I={
 dash:'<path d="M2 12a6 6 0 1 1 12 0"/><path d="M8 12 11 7"/><circle cx="8" cy="12" r=".8"/>',
 people:'<circle cx="6" cy="5.5" r="2.3"/><path d="M1.8 13c0-2.3 1.9-3.8 4.2-3.8s4.2 1.5 4.2 3.8"/><path d="M11 3.5a2.3 2.3 0 0 1 0 4.2M11.6 9.5c1.7.3 2.7 1.7 2.7 3.5"/>',
 file:'<path d="M4 1.8h5l3 3v9.4H4z"/><path d="M9 1.8v3h3"/><path d="M6 8.5h4M6 11h4"/>',
 pencil:'<path d="M11.2 2.3 13.7 4.8 5.6 12.9l-3.1.6.6-3.1z"/><path d="M10 3.5 12.5 6"/>',
 chart:'<path d="M2 13.5h12"/><rect x="3" y="8" width="2.4" height="4"/><rect x="6.8" y="5" width="2.4" height="7"/><rect x="10.6" y="2.5" width="2.4" height="9.5"/>',
 scooter:'<circle cx="3.4" cy="11.6" r="2.2"/><circle cx="12.6" cy="11.6" r="2.2"/><path d="M5.6 11.6h4.8L8 5.2h2.6"/><path d="M10.4 5.2h1.6l.6 6.4"/>',
 phone:'<rect x="4.5" y="1.5" width="7" height="13" rx="1.6"/><path d="M7 12.6h2"/>',
 box:'<path d="M2 5.2 8 2.3l6 2.9v5.6L8 13.7 2 10.8z"/><path d="M2 5.2 8 8.1l6-2.9M8 8.1v5.6"/>',
 house:'<path d="M2 7.4 8 2.2l6 5.2"/><path d="M3.5 8.6V14h9V8.6"/><path d="M6.6 14v-3.6h2.8V14"/>',
 wallet:'<rect x="1.8" y="3.6" width="12.4" height="9.4" rx="1.6"/><path d="M1.8 6.6h12.4"/><circle cx="11.4" cy="9.8" r=".9"/>',
 coin:'<circle cx="8" cy="8" r="6.2"/><path d="M8 4.6v6.8M6.2 6.4h3a1.4 1.4 0 0 1 0 2.8h-2.4a1.4 1.4 0 0 0 0 2.8h3"/>',
 deposit:'<path d="M8 2.2v7"/><path d="M5.2 6.4 8 9.2l2.8-2.8"/><rect x="2" y="10.6" width="12" height="3.4" rx="1"/>',
 plus:'<path d="M8 3.2v9.6M3.2 8h9.6"/>',
 download:'<path d="M8 2v7.6"/><path d="M5 7l3 3 3-3"/><path d="M2.5 11.5V13a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1.5"/>',
 upload:'<path d="M8 9.8V2.2"/><path d="M5 5.2 8 2.2l3 3"/><path d="M2.5 11.5V13a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1.5"/>',
 printer:'<path d="M4 6V2.5h8V6"/><rect x="1.8" y="6" width="12.4" height="5" rx="1"/><path d="M4 10h8v4H4z"/>',
 eye:'<path d="M1.3 8S3.6 3.8 8 3.8 14.7 8 14.7 8 12.4 12.2 8 12.2 1.3 8 1.3 8z"/><circle cx="8" cy="8" r="1.9"/>',
 trash:'<path d="M2.6 4h10.8"/><path d="M5.4 4V2.6h5.2V4"/><path d="M4 4l.7 9.4h6.6L12 4"/>',
 gear:'<circle cx="8" cy="8" r="2.1"/><path d="M8 1.6v1.9M8 12.5v1.9M14.4 8h-1.9M3.5 8H1.6M12.5 3.5l-1.3 1.3M4.8 11.2l-1.3 1.3M12.5 12.5l-1.3-1.3M4.8 4.8 3.5 3.5"/>',
 tools:'<path d="M10.4 2.4a3.2 3.2 0 0 0-3.9 4.2L2.4 10.7a1.4 1.4 0 0 0 2 2l4.1-4.1a3.2 3.2 0 0 0 4.2-3.9l-1.9 1.9-1.6-.4-.4-1.6z"/>',
 out:'<path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3"/><path d="M10.5 11 14 8l-3.5-3"/><path d="M14 8H6"/>',
 check:'<path d="M2.8 8.4l3.4 3.4L13.2 4.8"/>',
 menu:'<path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/>',
 lock:'<rect x="3.2" y="7" width="9.6" height="7" rx="1.4"/><path d="M5.4 7V5.2a2.6 2.6 0 0 1 5.2 0V7"/>'
};
const ic=(n,s)=>'<svg class="bi" viewBox="0 0 16 16" width="'+(s||16)+'" height="'+(s||16)+'" fill="none" '+
 'stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">'+(I[n]||"")+'</svg>';
document.getElementById("burger").innerHTML=ic("menu",19);

/* DATE MATHS - integer day numbers, timezone-proof */
function dayNum(iso){
  const p=iso.split("-").map(Number), y=p[0], m=p[1], d=p[2];
  const yy=y-(m<=2?1:0), era=Math.floor((yy>=0?yy:yy-399)/400), yoe=yy-era*400;
  const doy=Math.floor((153*(m+(m>2?-3:9))+2)/5)+d-1;
  return era*146097+(yoe*365+Math.floor(yoe/4)-Math.floor(yoe/100)+doy)-719468;
}
function fromDayNum(n){
  let z=n+719468; const era=Math.floor((z>=0?z:z-146096)/146097); z-=era*146097;
  const yoe=Math.floor((z-Math.floor(z/1460)+Math.floor(z/36524)-Math.floor(z/146096))/365);
  const doy=z-(365*yoe+Math.floor(yoe/4)-Math.floor(yoe/100));
  const mp=Math.floor((5*doy+2)/153);
  const d=doy-Math.floor((153*mp+2)/5)+1, m=mp+(mp<10?3:-9), y=yoe+era*400+(m<=2?1:0);
  return String(y).padStart(4,"0")+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0");
}
const MONDAY_ANCHOR=dayNum("1970-01-05");
const dayDiff=(a,b)=>dayNum(b)-dayNum(a);
const weekdayIdx=iso=>((dayNum(iso)-MONDAY_ANCHOR)%7+7)%7;
const isMonday=iso=>weekdayIdx(iso)===0;
const mondayOfWeek=iso=>fromDayNum(dayNum(iso)-weekdayIdx(iso));
const addDays=(iso,n)=>fromDayNum(dayNum(iso)+n);
const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL=["January","February","March","April","May","June","July","August",
  "September","October","November","December"];
const fmtDate=iso=>{ if(!iso) return "\u2014"; const p=iso.split("-").map(Number);
  return p[2]+" "+MONS[p[1]-1]+" "+p[0]; };
function today(){ const d=new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
const lastDayOfMonth=(y,m)=>new Date(Date.UTC(y,m,0)).getUTCDate();
/* add whole months then whole weeks - used for the auto contract end date */
function addMonths(iso,n){
  const p=iso.split("-").map(Number);
  let y=p[0], m=p[1]+n, d=p[2];
  y+=Math.floor((m-1)/12); m=((m-1)%12+12)%12+1;
  const last=lastDayOfMonth(y,m); if(d>last) d=last;
  return String(y).padStart(4,"0")+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0");
}
/* end date = start + months + weeks, minus a day so the term is inclusive */
function contractEndDate(start,months,weeks){
  if(!start) return "";
  let e=addMonths(start,Number(months)||0);
  e=addDays(e,(Number(weeks)||0)*7);
  return addDays(e,-1);
}

/* =======================================================================
   BUSINESS RULES  (v4)

   Deposits are now individual payments; a driver may pay several times in
   one week. The week is a ROLLUP, and the fine is assessed when the week
   closes - not when a single payment is entered.

   Fine modes, per contract:
     none    - never fined
     daily   - fineAmount for every day the week ended short
     weekly  - fineAmount once, flat, if the week ended short at all
   ======================================================================= */
const FINE_MODES=[["none","No fine"],["daily","Daily fine"],["weekly","Weekly fine"]];
const CSTATUS=[["active","Active"],["completed","Completed"],["terminated","Terminated"]];
const VSTATUS=[["pending","Pending"],["active-contract","Active-contract"],
  ["completed","Completed"],["sold","Sold"],["stolen","Stolen"]];
/* Sold and Stolen are set by hand and stick. Everything else is derived from
   the contracts on the vehicle, so the register cannot drift out of step. */
const MANUAL_VSTATUS=["sold","stolen"];
/* A vehicle is active only while it is running a contract or waiting for one.
   Completed, Sold and Stolen vehicles are no longer tracked: they stop
   accruing, drop out of the active count and leave the by-vehicle chart. */
const ACTIVE_VSTATUS=["active-contract","pending"];
const isActiveVStatus=st=>ACTIVE_VSTATUS.indexOf(st)>=0;
const SEED_COLOURS=["Black","Blue","Red","White","Green","Silver"];
const SEED_MODELS=["Boxer BM100","Boxer BM150","TVS HLX 125","Honda CG 125","Sanlg","Toyo"];

/* Effective end of a contract: the termination date once closed, otherwise
   the scheduled end date. Drives both weekly and total expected earnings. */
function effectiveEnd(c){
  let end=(c.status!=="active"&&c.terminatedOn)?c.terminatedOn:(c.endDate||c.startDate);
  /* A sold or stolen motorcycle stops earning on the day it left service,
     however long the contract had left to run. */
  const v=vehicleById(c.vehicleId||c.bikeId);
  if(v&&MANUAL_VSTATUS.indexOf(v.status)>=0&&v.statusDate&&
     dayNum(v.statusDate)<dayNum(end)) end=v.statusDate;
  return end<c.startDate?c.startDate:end;
}
/* TOTAL expected earnings = contract duration in days x daily earning.
   A closed contract is measured to its termination date, not its full term. */
function contractExpectedTotal(c){
  const end=effectiveEnd(c);
  const days=dayDiff(c.startDate,end)+1;
  return days<=0?0:days*(Number(c.dailyRate)||0);
}
/* Expected EARNED up to date = duration OPERATED so far x daily earning.
   Active contracts are measured to today (capped at their scheduled end);
   closed contracts are already done, so this equals their full total. */
function contractExpectedToDate(c){
  const end=effectiveEnd(c);
  const cap=(c.status==="active"&&dayNum(today())<dayNum(end))?today():end;
  const days=dayDiff(c.startDate,cap)+1;
  return days<=0?0:days*(Number(c.dailyRate)||0);
}
/* Expected for ONE week = the full 7 days, week start to week end.
   Only the contract's own end clips it: a week that runs past the end
   (or past a termination) is cut short, and a week entirely beyond is zero. */
function weekExpected(c,weekStart){
  const rate=Number(c.dailyRate)||0;
  const ws=dayNum(weekStart), we=ws+6;
  const ce=dayNum(effectiveEnd(c));
  if(ws>ce) return 0;
  const to=Math.min(we,ce);
  const days=to-ws+1;
  return days<=0?0:Math.min(days,7)*rate;
}
/* Fine for a closed week that ended short. daysShort is derived from the
   shortfall at the contracted daily rate, capped at the days actually owed. */
function weekFineFor(c,shortfall,daysOwed){
  const mode=c.fineMode||"none", amt=Number(c.fineAmount)||0;
  if(mode==="none"||amt<=0||shortfall<=0) return 0;
  if(mode==="weekly") return amt;
  const rate=Number(c.dailyRate)||0;
  if(rate<=0) return 0;
  const daysShort=Math.min(Math.ceil(shortfall/rate),Math.max(daysOwed,0));
  return daysShort*amt;
}
/* Contract ID: PLATE-YYYYMMDD-INITIALS  e.g. T123B-20260130-AK */
const initialsOf=name=>String(name||"").trim().split(/\s+/)
  .filter(Boolean).map(w=>w[0].toUpperCase()).join("").slice(0,3);
const plateKey=p=>String(p||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
function makeContractCode(plate,startDate,driverName){
  const d=(startDate||"").replace(/-/g,"");
  return plateKey(plate)+"-"+d+"-"+initialsOf(driverName);
}
/* Human reporting period for report headers, following the sidebar filter:
   "from 01/08/2026 to 23/09/2026" | "Jan 2026" | "Q3 2026" | "2026" */
const dmy=iso=>{const p=iso.split("-");return p[2]+"/"+p[1]+"/"+p[0];};
function periodLabel(){
  const y=Number(FS.year);
  if(FS.dateFilter==="Monthly") return MONS[Number(FS.month)-1]+" "+y;
  if(FS.dateFilter==="Quarterly") return FS.quarter+" "+y;
  if(FS.dateFilter==="Yearly") return String(y);
  return "from "+dmy(FS.start)+" to "+dmy(FS.end);
}
function computeWeeks(a,b){ const t=dayDiff(a,b)+1;
  return t<=0?0:Number(Math.floor(t/7)+"."+(t%7)); }

/* STORAGE (v4 schema) */
const KEY="dashboard.v4";
let mem=null;
const uid=()=>"id"+Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const canStore=(()=>{try{localStorage.setItem("_t","1");localStorage.removeItem("_t");return true}catch(e){return false}})();
const freshDB=()=>({
  owner:null, ownerName:"", users:[], session:null,
  drivers:[], vehicles:[], contracts:[], deposits:[],
  consultancy:[],
  colours:SEED_COLOURS.slice(), models:SEED_MODELS.slice()
});
function load(){ if(mem) return mem;
  try{ const r=canStore?localStorage.getItem(KEY):null; mem=r?JSON.parse(r):freshDB(); }
  catch(e){ mem=freshDB(); }
  ["drivers","vehicles","contracts","deposits","users","consultancy"].forEach(k=>{ if(!mem[k]) mem[k]=[]; });
  if(!mem.colours||!mem.colours.length) mem.colours=SEED_COLOURS.slice();
  if(!mem.models||!mem.models.length) mem.models=SEED_MODELS.slice();
  return mem; }
function save(){ if(canStore){ try{ localStorage.setItem(KEY,JSON.stringify(mem)); }catch(e){} }
  cloudPushSoon(); }
const DB=()=>load();

/* ============================================================================
   CLOUD SYNC (Supabase) - one shared, live dataset for the whole team.
   Paste your project URL and anon (public) key below. Leave BOTH blank to keep
   the dashboard fully offline (localStorage only).  The login session is kept
   on each device, never uploaded, so signing in on one phone doesn't sign in
   everyone. localStorage stays as an offline cache/fallback.
   ========================================================================== */
const CLOUD={
  url:"",                 // e.g.  https://abcdefghijkl.supabase.co
  key:"",                 // the anon / public key (safe to expose in the page)
  table:"app_state",
  row:"main"
};
CLOUD.on=/^https:\/\/.+/.test(CLOUD.url)&&CLOUD.key.length>20;
let CLOUD_TS=null, CLOUD_DIRTY=false, CLOUD_BOOT=false, CLOUD_TIMER=null, CLOUD_PUSH=null;

function normalizeDB(m){
  ["drivers","vehicles","contracts","deposits","users","consultancy"].forEach(k=>{ if(!m[k]) m[k]=[]; });
  if(!m.colours||!m.colours.length) m.colours=SEED_COLOURS.slice();
  if(!m.models||!m.models.length) m.models=SEED_MODELS.slice();
  return m;
}
const cloudHeaders=()=>({apikey:CLOUD.key,Authorization:"Bearer "+CLOUD.key,
  "Content-Type":"application/json"});

function setSync(state){
  let el=document.getElementById("syncBadge");
  if(!el){ el=document.createElement("div"); el.id="syncBadge"; document.body.appendChild(el); }
  if(!CLOUD.on){ el.style.display="none"; return; }
  el.style.display="";
  const map={ok:["#1a7f4b","\u25CF Synced"],sync:["#8a6d00","\u21BB Syncing\u2026"],
    off:["#b23b3b","\u26A0 Offline \u2014 saved here"]};
  const m=map[state]||map.ok; el.style.background=m[0]; el.textContent=m[1];
}

/* Pull the shared dataset. Adopts a newer remote copy unless the user is in the
   middle of an edit (a modal is open, a field is focused, or a local change is
   still being pushed) - in which case it waits for the next poll. */
async function cloudPull(){
  if(!CLOUD.on) return;
  try{
    const r=await fetch(CLOUD.url+"/rest/v1/"+CLOUD.table+"?id=eq."+CLOUD.row+
      "&select=data,updated_at",{headers:cloudHeaders()});
    if(!r.ok) throw new Error("HTTP "+r.status);
    const rows=await r.json();
    if(rows&&rows.length){
      const ts=rows[0].updated_at, data=rows[0].data;
      if(ts!==CLOUD_TS&&data){
        const modal=document.getElementById("modal");
        const busy=(modal&&modal.classList.contains("on"))||
          (document.activeElement&&/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName));
        if(!busy&&!CLOUD_DIRTY){
          const sess=mem?mem.session:null;
          mem=normalizeDB(Object.assign(freshDB(),data)); mem.session=sess;
          try{ if(canStore) localStorage.setItem(KEY,JSON.stringify(mem)); }catch(e){}
          CLOUD_TS=ts;
          if(!CLOUD_BOOT){
            const app=document.getElementById("app");
            if(app&&app.classList.contains("hide")) renderLogin(); else render();
          }
        }
      }else if(ts) CLOUD_TS=ts;
    }else if(mem&&mem.owner){ await cloudPush(); }   // empty cloud: seed from this device
    setSync("ok");
  }catch(e){ setSync("off"); }
}

/* Push the whole dataset (minus the device-local session) as one JSON row. */
async function cloudPush(){
  if(!CLOUD.on) return;
  const payload=[{id:CLOUD.row,data:Object.assign({},mem,{session:null}),
    updated_at:new Date().toISOString()}];
  try{
    setSync("sync");
    const r=await fetch(CLOUD.url+"/rest/v1/"+CLOUD.table,{method:"POST",
      headers:Object.assign(cloudHeaders(),{Prefer:"resolution=merge-duplicates,return=minimal"}),
      body:JSON.stringify(payload)});
    if(!r.ok) throw new Error("HTTP "+r.status);
    CLOUD_TS=payload[0].updated_at; CLOUD_DIRTY=false; setSync("ok");
  }catch(e){ CLOUD_DIRTY=true; setSync("off"); }
}
/* Debounce rapid saves into a single upload. */
function cloudPushSoon(){
  if(!CLOUD.on) return;
  CLOUD_DIRTY=true; setSync("sync");
  clearTimeout(CLOUD_PUSH); CLOUD_PUSH=setTimeout(cloudPush,900);
}
function startPoller(){ if(CLOUD.on&&!CLOUD_TIMER) CLOUD_TIMER=setInterval(cloudPull,12000); }

const money=n=>(n<0?"-":"")+Math.abs(Math.round(n||0)).toLocaleString("en-US");
const tzs=n=>(n<0?"-":"")+"TZS "+Math.abs(Math.round(n||0)).toLocaleString("en-US");
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const numOf=v=>{ const n=Number(String(v==null?"":v).replace(/[^\d.-]/g,"")); return isNaN(n)?0:n; };
const driverById=id=>DB().drivers.find(d=>d.id===id);
const vehicleById=id=>DB().vehicles.find(b=>b.id===id);
const bikeById=vehicleById;
const contractById=id=>DB().contracts.find(c=>c.id===id);
const contractByCode=code=>DB().contracts.find(c=>c.code===code);
const activeContracts=()=>DB().contracts.filter(c=>c.status==="active");
const depositsOf=cid=>DB().deposits.filter(r=>r.contractId===cid)
  .sort((a,b)=>dayNum(a.depositDate)-dayNum(b.depositDate));
const plateOf=c=>{const b=vehicleById(c.vehicleId||c.bikeId);return b?b.plate:"\u2014";};
const driverNameOf=c=>{const d=driverById(c.driverId);return d?d.name:"?";};
const vehicleByPlate=p=>DB().vehicles.find(x=>plateKey(x.plate)===plateKey(p));
/* Vehicles are registered under Tools; contracts pick from that list. */
function findOrCreateBike(plate){
  const db=DB(); let b=vehicleByPlate(plate);
  if(!b){ b={id:uid(),plate:String(plate).trim().toUpperCase(),chassis:"",
    purchaseDate:"",purchaseAmount:0,colour:"",model:"",hasInsurance:false,
    insuranceStart:"",insuranceEnd:"",status:"active-contract",statusDate:""};
    db.vehicles.push(b); }
  return b;
}
/* drivers are created by typing a name on the contract form */
function findOrCreateDriver(name,phone){
  const db=DB(), nm=String(name||"").trim();
  let d=db.drivers.find(x=>x.name.toLowerCase()===nm.toLowerCase());
  if(!d){ d={id:uid(),name:nm,phone:phone||"",active:true}; db.drivers.push(d); }
  else if(phone&&!d.phone) d.phone=phone;
  return d;
}

/* MODULES + PERMISSIONS */
const MODULES=[];                      /* modules register themselves (see js/*.js) */
const MODULE_RENDERERS={};             /* id -> function(module, el) */
function registerModule(def, renderer){
  MODULES.push(def);
  if(typeof renderer==="function") MODULE_RENDERERS[def.id]=renderer;
}
let MOD="bodaboda", TAB=0;

/* permission for the current session: "edit" | "view" | "none" */
function permFor(modId){
  const db=DB(), s=db.session;
  if(!s||s.type==="owner") return "edit";
  const u=db.users.find(x=>x.id===s.userId);
  if(!u) return "none";
  return u.perms&&u.perms[modId]?u.perms[modId]:"none";
}
const canEdit=modId=>permFor(modId||MOD)==="edit";
const isOwner=()=>{const s=DB().session;return !!s&&s.type==="owner";};
function guard(){ if(!canEdit()){ alert("Your account has view-only access to this module."); return false; } return true; }

/* LOGIN - owner PIN, plus accounts granted from Settings */
const hash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return String(h)};
function renderLogin(){
  const db=DB(), first=!db.owner;
  document.getElementById("loginSub").textContent=first
    ?"Create the owner PIN for this device":"Enter your credentials";
  document.getElementById("loginFields").innerHTML=first?
    '<label class="f">Your name</label><input class="i" id="lgName" placeholder="e.g. Adam Kamese">'+
    '<label class="f">Choose a PIN <span class="req">*</span></label>'+
    '<input class="i num" id="lgPin" type="password" inputmode="numeric" placeholder="At least 4 digits">'+
    '<label class="f">Confirm PIN <span class="req">*</span></label>'+
    '<input class="i num" id="lgPin2" type="password" inputmode="numeric" placeholder="Repeat it">'+
    '<div class="errmsg hide" id="lgErr"></div>'+
    '<button class="btn pri full" id="lgGo" style="margin-top:18px">Create PIN and continue</button>'
   :'<label class="f">Username <span class="hint" style="display:inline">(leave blank for owner)</span></label>'+
    '<input class="i" id="lgUser" placeholder="Owner" autocapitalize="none">'+
    '<label class="f">PIN</label>'+
    '<input class="i num" id="lgPin" type="password" inputmode="numeric" placeholder="Your PIN">'+
    '<div class="errmsg hide" id="lgErr"></div>'+
    '<button class="btn pri full" id="lgGo" style="margin-top:18px">Sign in</button>'+
    '<button class="btn full" id="lgForgot" style="margin-top:10px">Forgot PIN</button>';
  document.getElementById("loginNote").innerHTML=first
    ?"The PIN is stored on this device only. It stops someone picking up the phone and reading "+
     "your records \u2014 it is not account security and it does not encrypt the data."
    :(canStore?"":"<b>Storage is unavailable here, so data will not persist.</b><br>")+
     "Works offline. Extra accounts are created under Settings.";
}
function doLogin(){
  const db=DB(), first=!db.owner, err=document.getElementById("lgErr");
  const show=m=>{err.textContent=m;err.classList.remove("hide")};
  const pin=(document.getElementById("lgPin").value||"").trim();
  if(first){
    const p2=(document.getElementById("lgPin2").value||"").trim();
    if(pin.length<4) return show("Use at least 4 digits.");
    if(pin!==p2) return show("The two PINs do not match.");
    db.owner=hash(pin); db.ownerName=(document.getElementById("lgName").value||"").trim()||"Owner";
    db.session={type:"owner",name:db.ownerName}; save(); enterApp(); return;
  }
  const un=(document.getElementById("lgUser").value||"").trim();
  if(!un){
    if(hash(pin)!==db.owner) return show("Incorrect PIN.");
    db.session={type:"owner",name:db.ownerName||"Owner"}; save(); enterApp(); return;
  }
  const u=db.users.find(x=>x.username.toLowerCase()===un.toLowerCase());
  if(!u||u.pin!==hash(pin)) return show("Incorrect username or PIN.");
  if(u.disabled) return show("That account has been disabled.");
  db.session={type:"user",userId:u.id,name:u.name}; save(); enterApp();
}
function enterApp(){
  const first=MODULES.find(m=>permFor(m.id)!=="none");
  MOD=first?first.id:"bodaboda"; TAB=0;
  document.getElementById("login").classList.add("hide");
  document.getElementById("app").classList.remove("hide");
  document.getElementById("burger").classList.remove("hide"); render();
}
function signOut(){
  const db=DB(); db.session=null; save();
  document.getElementById("app").classList.add("hide");
  document.getElementById("burger").classList.add("hide");
  document.getElementById("login").classList.remove("hide");
  closeSide(); closeModal(); renderLogin();
}

/* ---------------------------------------------------------------------
   PIN confirmation. Any update or delete must be re-authorised with the
   signed-in account's own PIN, so a mis-tap cannot quietly change a record.
   --------------------------------------------------------------------- */
let PENDING=null;
function currentPinHash(){
  const db=DB(), s=db.session;
  if(!s) return null;
  if(s.type==="owner") return db.owner;
  const u=db.users.find(x=>x.id===s.userId);
  return u?u.pin:null;
}
function requirePin(what,fn){
  PENDING={fn:fn};
  const prev=document.getElementById("modal").classList.contains("on")
    ? {t:document.getElementById("mTitle").textContent,
       h:document.getElementById("mBody").innerHTML,
       w:document.getElementById("mSheet").className.indexOf("wide")>=0}
    : null;
  PENDING.prev=prev;
  openModal("Confirm with your PIN",
    '<div class="banner warn">'+ic("lock")+' You are about to <b>'+esc(what)+'</b>. '+
    'Enter your PIN to continue.</div>'+
    '<label class="f">PIN <span class="req">*</span></label>'+
    '<input class="i num" id="pinConfirm" type="password" inputmode="numeric" placeholder="Your PIN">'+
    '<div class="errmsg hide" id="pinErr">Incorrect PIN.</div>'+
    '<div class="btnrow" style="margin-top:16px">'+
      '<button class="btn pri" data-act="pinOk">'+ic("check")+' Confirm</button>'+
      '<button class="btn" data-act="pinCancel">Cancel</button></div>');
  setTimeout(function(){const f=document.getElementById("pinConfirm");if(f)f.focus();},40);
}
function pinConfirmOk(){
  const el=document.getElementById("pinConfirm"); if(!el) return;
  const want=currentPinHash();
  if(!want||hash(el.value.trim())!==want){
    document.getElementById("pinErr").classList.remove("hide");
    el.value=""; el.focus(); return;
  }
  const p=PENDING; PENDING=null; closeModal();
  if(p&&p.fn) p.fn();
}
function pinCancel(){
  const p=PENDING; PENDING=null;
  if(p&&p.prev) openModal(p.prev.t,p.prev.h,p.prev.w); else closeModal();
}

/* SHELL */
const render=()=>{renderSide();renderMain();};
const openSide=()=>{document.getElementById("side").classList.add("open");
  document.getElementById("scrim").classList.add("on")};
const closeSide=()=>{document.getElementById("side").classList.remove("open");
  document.getElementById("scrim").classList.remove("on")};

function renderSide(){
  const db=DB(), m=MODULES.find(x=>x.id===MOD)||MODULES[0];
  const visible=MODULES.filter(x=>permFor(x.id)!=="none");
  const who=db.session?db.session.name:"";
  const role=isOwner()?"Owner":"Limited account";
  document.getElementById("side").innerHTML=
    '<h2>'+ic("dash",18)+' Business Dashboard</h2>'+
    '<div class="sgroup">Modules</div>'+
    visible.map(x=>'<button class="modbtn" data-mod="'+x.id+'" aria-current="'+(x.id===MOD)+'">'+
      ic(x.icon)+esc(x.name)+
      (x.live?(permFor(x.id)==="view"?'<span class="ro">VIEW</span>':"")
             :'<span class="soon">SOON</span>')+'</button>').join("")+
    (m&&m.id==="bodaboda"?sidebarFilters():"")+
    '<div class="sgroup">Settings</div>'+
    '<button class="modbtn" data-act="openSettings">'+ic("gear")+' Settings</button>'+
    '<div class="whobox"><b>'+esc(who)+'</b>Signed in as '+role+
      '<button class="btn full" data-act="signout" style="margin-top:9px">'+
      ic("out")+' Sign out</button></div>';
}
function sidebarFilters(){
  const drivers=DB().drivers.map(d=>d.name).sort(), yrs=[];
  for(let y=2024;y<=new Date().getFullYear()+1;y++) yrs.push(y);
  let dd="";
  if(FS.dateFilter==="Custom") dd=
    '<label class="f">Start Date</label><input class="i" type="date" data-fs="start" value="'+FS.start+'">'+
    '<label class="f">End Date</label><input class="i" type="date" data-fs="end" value="'+FS.end+'">';
  else if(FS.dateFilter==="Monthly") dd=
    '<label class="f">Month</label><select class="i" data-fs="month">'+MONTHS_FULL.map((n,i)=>
      '<option value="'+(i+1)+'"'+(Number(FS.month)===i+1?" selected":"")+'>'+n+'</option>').join("")+'</select>'+
    '<label class="f">Year</label><select class="i" data-fs="year">'+yrs.map(y=>
      '<option'+(Number(FS.year)===y?" selected":"")+'>'+y+'</option>').join("")+'</select>';
  else if(FS.dateFilter==="Quarterly") dd=
    '<label class="f">Quarter</label><select class="i" data-fs="quarter">'+["Q1","Q2","Q3","Q4"].map(q=>
      '<option'+(FS.quarter===q?" selected":"")+'>'+q+'</option>').join("")+'</select>'+
    '<label class="f">Year</label><select class="i" data-fs="year">'+yrs.map(y=>
      '<option'+(Number(FS.year)===y?" selected":"")+'>'+y+'</option>').join("")+'</select>';
  else dd='<label class="f">Year</label><select class="i" data-fs="year">'+yrs.map(y=>
      '<option'+(Number(FS.year)===y?" selected":"")+'>'+y+'</option>').join("")+'</select>';
  let dv="";
  if(FS.driverFilter==="Single") dv='<label class="f">Select Driver</label>'+
    '<select class="i" data-fs="single"><option value="">\u2014 none \u2014</option>'+drivers.map(n=>
      '<option'+(FS.single===n?" selected":"")+'>'+esc(n)+'</option>').join("")+'</select>';
  else if(FS.driverFilter==="Multiple") dv='<label class="f">Select Drivers</label>'+
    '<select class="i" data-fs="multi" multiple size="8" style="padding:6px">'+drivers.map(n=>
      '<option'+(FS.multi.indexOf(n)>=0?" selected":"")+'>'+esc(n)+'</option>').join("")+'</select>'+
    '<div class="hint">Hold Ctrl / drag to pick several.</div>';
  return '<div class="sgroup">Filters</div>'+
    '<label class="f">Select Date Filter</label>'+
    '<select class="i" data-fs="dateFilter">'+["Custom","Monthly","Quarterly","Yearly"].map(o=>
      '<option'+(FS.dateFilter===o?" selected":"")+'>'+o+'</option>').join("")+'</select>'+dd+
    '<label class="f">Select Driver Filter</label>'+
    '<select class="i" data-fs="driverFilter">'+["All","Single","Multiple"].map(o=>
      '<option'+(FS.driverFilter===o?" selected":"")+'>'+o+'</option>').join("")+'</select>'+dv;
}
function renderMain(){
  const m=MODULES.find(x=>x.id===MOD)||MODULES[0], el=document.getElementById("main");
  const r=MODULE_RENDERERS[m.id];
  if(r) r(m,el); else el.innerHTML=placeholder(m);
}
const placeholder=m=>'<h1 class="pg">'+esc(m.title)+'</h1>'+
  '<div class="meta">Planned module \u2014 not built yet</div>'+
  '<div class="tabs">'+(m.tabs||[]).map((t,i)=>
    '<button aria-selected="'+(i===0)+'">'+t+'</button>').join("")+'</div>'+
  '<div class="banner"><b>'+esc(m.name)+'</b> is scaffolded but has no logic yet. '+esc(m.note||"")+'</div>'+
  '<h3 class="sec">What this module will do</h3>'+
  '<div class="card"><ul style="margin:0;padding-left:20px">'+(m.plan||[]).map(p=>
    '<li style="margin-bottom:6px">'+esc(p)+'</li>').join("")+'</ul></div>'+
  '<div class="foot">Developer: Adam Kamese</div>';

/* SHARED WIDGETS */
const kpi=(c,l,v,sub)=>'<div class="kpi '+c+'"><div class="l">'+l+'</div>'+
  '<div class="v num">'+v+'</div>'+(sub?'<div class="sub">'+sub+'</div>':"")+'</div>';
const depositBtn='<button class="btn pri" data-act="goEntry">'+ic("deposit")+' Add Deposit</button>';
/* Signed balance: + and green when deposits exceed expected, - and red when
   they fall short. Used for every outstanding / balance figure in the app. */
function bal(n){
  n=Math.round(n||0);
  return {n:(n>0?"+":"")+money(n),cls:n>0?"pos":(n<0?"neg":"")};
}
const balText=n=>(n>0?"+":"")+tzs(n);
const statusLabel=s=>s==="active"?'<span class="pill g">Active</span>'
  :(s==="completed"?'<span class="pill b">Completed</span>'
  :(s==="pending"?'<span class="pill">Pending</span>'
  :(s==="sold"?'<span class="pill o">Sold</span>'
  :(s==="stolen"?'<span class="pill r">Stolen</span>'
  :(s==="active-contract"?'<span class="pill g">Active-contract</span>'
  :'<span class="pill r">Terminated</span>')))));
const emptyState=()=>'<div class="empty"><b>No contracts yet</b>'+
  'Create a contract first \u2014 deposits are recorded against it.</div>'+
  '<div class="btnrow" style="margin-top:14px;justify-content:center">'+
  '<button class="btn pri" data-act="goContracts">'+ic("plus")+' Create first contract</button>'+
  depositBtn+'</div>';
function table(headers,rows,id){
  const cell=v=>(v&&typeof v==="object"&&!Array.isArray(v))
    ? '<td class="n '+(v.cls||"")+'">'+v.n+'</td>' : '<td>'+v+'</td>';
  return '<div class="tw"'+(id?' id="'+id+'"':"")+'><table><thead><tr>'+headers.map(h=>
    '<th class="'+(/TZS|Total|Weeks|%|Price|Paid|Outstanding|Balance|Expected|Fine|Deposit|Daily|Carried|Due|Late|Rate|Amount|Count/.test(h)?"n":"")+'">'+h+'</th>'
    ).join("")+'</tr></thead><tbody>'+(rows.length?rows.map(r=>'<tr>'+r.map(cell).join("")+'</tr>').join("")
    :'<tr><td colspan="'+headers.length+'" style="text-align:center;color:var(--muted);padding:22px">No matching rows.</td></tr>')+
    '</tbody></table></div>';
}
/* live text filter over a rendered table */
const TXT={drv:"",rec:"",tool:"",dash:"",veh:"",con:""};
function filterBox(key,ph,extra){
  return '<div class="filterbar"><input data-txt="'+key+'" value="'+esc(TXT[key]||"")+
    '" placeholder="'+(ph||"Filter by plate, driver, contract ID\u2026")+'">'+(extra||"")+'</div>';
}
const matches=(row,q)=>{ if(!q) return true;
  const s=q.toLowerCase();
  return String(row).toLowerCase().indexOf(s)>=0; };

/* SVG CHARTS - hand-drawn so the app stays offline with no chart library */
const CBLUE="#1f77b4",CORANGE="#ff7f0e",CGREEN="#2ca02c",CRED="#d62728";
function pieChart(data,size){
  const S=size||300, R=S/2-6, cx=S/2, cy=S/2;
  const total=data.reduce((a,d)=>a+d.value,0);
  if(!total) return '<div class="empty" style="padding:26px">No data</div>';
  let a0=-Math.PI/2, paths="";
  data.forEach(d=>{
    if(d.value<=0) return;
    const a1=a0+d.value/total*Math.PI*2;
    const x0=cx+R*Math.cos(a0), y0=cy+R*Math.sin(a0);
    const x1=cx+R*Math.cos(a1), y1=cy+R*Math.sin(a1);
    const big=(a1-a0)>Math.PI?1:0;
    paths+= (d.value===total)
      ? '<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="'+d.color+'"/>'
      : '<path d="M'+cx+' '+cy+' L'+x0.toFixed(2)+' '+y0.toFixed(2)+
        ' A'+R+' '+R+' 0 '+big+' 1 '+x1.toFixed(2)+' '+y1.toFixed(2)+' Z" fill="'+d.color+'"/>';
    a0=a1;
  });
  return '<svg viewBox="0 0 '+S+' '+S+'" width="100%" preserveAspectRatio="xMidYMid meet" '+
    'style="display:block;margin:0 auto">'+paths+'</svg>'+
    '<div class="lgd">'+data.map(d=>'<span><i style="background:'+d.color+'"></i>'+
      esc(d.label)+' ('+d.value+')</span>').join("")+'</div>';
}
function barChart(cats,series,opt){
  opt=opt||{};
  const W=opt.w||460, H=opt.h||300, L=56, Bm=opt.rot?70:38, T=20, Rm=12;
  const pw=W-L-Rm, ph=H-T-Bm;
  let max=0; series.forEach(s=>s.values.forEach(v=>{if(v>max)max=v}));
  if(max<=0) max=1;
  const nice=Math.pow(10,Math.floor(Math.log10(max)));
  const top=Math.ceil(max/nice)*nice;
  const gw=pw/Math.max(cats.length,1);
  const bw=Math.min((gw-8)/Math.max(series.length,1),36);
  const lbl=v=>v>=1000000?(Math.round(v/100000)/10)+"M"
    :(v>=1000?Math.round(v/1000)+"k":String(Math.round(v)));
  let g="";
  for(let i=0;i<=4;i++){
    const y=T+ph-ph*i/4, v=top*i/4;
    g+='<line x1="'+L+'" y1="'+y.toFixed(1)+'" x2="'+(W-Rm)+'" y2="'+y.toFixed(1)+
      '" stroke="#E6EAF1" stroke-width="1"/>'+
      '<text x="'+(L-6)+'" y="'+(y+4).toFixed(1)+'" text-anchor="end" font-size="10" fill="#7C8698">'+
      lbl(v)+'</text>';
  }
  cats.forEach((c,ci)=>{
    const x0=L+ci*gw+(gw-bw*series.length)/2;
    series.forEach((s,si)=>{
      const v=s.values[ci]||0;
      /* a non-zero bar never renders thinner than 3px, so a small deposit
         stays visible beside a large expected figure */
      const h=v>0?Math.max(ph*v/top,3):0;
      const bx=x0+si*bw, by=T+ph-h;
      g+='<rect x="'+bx.toFixed(1)+'" y="'+by.toFixed(1)+'" width="'+(bw-3).toFixed(1)+
        '" height="'+Math.max(h,0).toFixed(1)+'" fill="'+s.color+'" rx="2"><title>'+
        esc(c)+" \u2013 "+esc(s.name)+": "+money(v)+'</title></rect>';
      /* amount printed on top of every bar */
      if(v>0) g+='<text x="'+(bx+(bw-3)/2).toFixed(1)+'" y="'+(by-4).toFixed(1)+
        '" text-anchor="middle" font-size="9.5" font-weight="700" fill="'+s.color+'">'+
        lbl(v)+'</text>';
    });
    const lx=L+ci*gw+gw/2;
    g+= opt.rot
      ? '<text x="'+lx.toFixed(1)+'" y="'+(T+ph+12)+'" font-size="10" fill="#5C7799" '+
        'transform="rotate(-40 '+lx.toFixed(1)+' '+(T+ph+12)+')" text-anchor="end">'+esc(c)+'</text>'
      : '<text x="'+lx.toFixed(1)+'" y="'+(T+ph+15)+'" font-size="10.5" fill="#5C7799" '+
        'text-anchor="middle">'+esc(c)+'</text>';
  });
  return '<svg viewBox="0 0 '+W+' '+H+'" width="100%" preserveAspectRatio="xMidYMid meet" '+
    'style="display:block">'+g+
    '<line x1="'+L+'" y1="'+(T+ph)+'" x2="'+(W-Rm)+'" y2="'+(T+ph)+'" stroke="#D3DAE6"/></svg>'+
    '<div class="lgd">'+series.map(s=>'<span><i style="background:'+s.color+'"></i>'+
      esc(s.name)+'</span>').join("")+'</div>';
}

/* ===================== SETTINGS ===================== */
let SET_TAB=0;
function openSettings(){
  const owner=isOwner();
  const tabs=owner
    ? [["Backup","download"],["Users & Info","people"],["Help & Support","file"]]
    : [["My Account","people"],["Help & Support","file"]];
  if(SET_TAB>=tabs.length||SET_TAB<0) SET_TAB=0;
  const bar='<div class="tabs" style="margin:-2px 0 16px">'+tabs.map((t,i)=>
    '<button data-settab="'+i+'" aria-selected="'+(i===SET_TAB?"true":"false")+'">'+
    ic(t[1],15)+t[0]+'</button>').join("")+'</div>';
  const body=owner
    ? [settingsBackup,settingsUsers,settingsHelp][SET_TAB]()
    : [settingsAccount,settingsHelp][SET_TAB]();
  openModal("Settings",bar+body,true);
}

/* ---- Settings: Backup tab (download / restore the whole dashboard) ---- */
function settingsBackup(){
  const db=DB();
  const counts=[["Drivers",db.drivers.length],["Motorcycles",db.vehicles.length],
    ["Bodaboda contracts",db.contracts.length],["Deposits",db.deposits.length],
    ["Consultancy contracts",(db.consultancy||[]).length],["User accounts",db.users.length]];
  const cloudLine=CLOUD.on
    ? '<div class="banner">'+ic("check")+' Online sync is <b>on</b>. The dashboard already saves to the '+
      'shared cloud automatically \u2014 this JSON download is an extra offline copy you can keep or move '+
      'to another setup.</div>'
    : '<div class="hint" style="margin-top:0">Online sync is off, so this JSON file is your only backup. '+
      'Download it regularly and keep it somewhere safe.</div>';
  return '<h3 class="sec" style="margin-top:0">Download a full backup</h3>'+
    '<div class="card">'+cloudLine+
    '<div class="btnrow" style="margin-top:12px">'+
      '<button class="btn pri" data-act="json">'+ic("download")+' Download backup (JSON)</button></div>'+
    '<div class="hint" style="margin-top:8px">One file containing the <b>entire business dashboard</b> \u2014 '+
      'every module (Bodaboda and Consultancy), all records, settings and accounts.</div>'+
    '<table style="margin-top:12px"><tbody>'+counts.map(c=>
      '<tr><td style="color:var(--muted)">'+c[0]+'</td><td><b>'+c[1]+'</b></td></tr>').join("")+
    '</tbody></table></div>'+
    '<h3 class="sec">Restore from a backup</h3>'+
    '<div class="card">'+
      '<div class="banner warn">'+ic("lock")+' Restoring <b>replaces everything</b> currently in the '+
      'dashboard'+(CLOUD.on?' and uploads it to the shared cloud for the whole team':'')+
      '. Download a backup first if you are unsure.</div>'+
      '<div class="btnrow" style="margin-top:12px">'+
        '<button class="btn" data-act="pickRestore">'+ic("upload")+' Upload backup (JSON)</button>'+
        '<input type="file" id="restoreFile" accept="application/json,.json" class="hide"></div>'+
      '<div class="hint" style="margin-top:8px">You will be asked for your PIN before anything is replaced.</div>'+
    '</div>'+
    '<div class="btnrow" style="margin-top:16px"><button class="btn" data-act="closeModal">Close</button></div>';
}

/* ---- Settings: Users & Information tab (owner) ---- */
function settingsUsers(){
  const db=DB(), s=db.session;
  const info=[["Signed in as",esc(s?s.name:"\u2014")],["Role","Owner"],
    ["Owner name",esc(db.ownerName||"\u2014")],
    ["User accounts",db.users.length],
    ["Online sync",CLOUD.on?"On (shared with the team)":"Off (this device only)"]];
  return '<h3 class="sec" style="margin-top:0">Your information</h3>'+
    '<div class="card"><table><tbody>'+info.map(x=>
      '<tr><td style="color:var(--muted)">'+x[0]+'</td><td><b>'+x[1]+'</b></td></tr>').join("")+
    '</tbody></table></div>'+
    '<h3 class="sec">Accounts</h3>'+
    table(["Name","Username","Access","Status",""],
      db.users.map(u=>{
        const mods=MODULES.filter(m=>u.perms&&u.perms[m.id]&&u.perms[m.id]!=="none")
          .map(m=>m.name+" ("+u.perms[m.id]+")").join(", ")||"None";
        return [esc(u.name),esc(u.username),esc(mods),
          u.disabled?'<span class="pill r">Disabled</span>':'<span class="pill g">Active</span>',
          '<button class="btn sm" data-act="editUser" data-id="'+u.id+'">'+ic("pencil",13)+
          ' Edit</button> <button class="btn sm dang" data-act="delUser" data-id="'+u.id+'">'+
          ic("trash",13)+'</button>'];}))+
    '<div class="btnrow" style="margin-top:14px">'+
      '<button class="btn pri" data-act="newUser">'+ic("plus")+' Grant credentials</button>'+
      '<button class="btn" data-act="closeModal">Close</button></div>'+
    '<div class="hint" style="margin-top:12px">Each account controls which modules a person can open and '+
      'whether they can edit. '+(CLOUD.on?'Accounts are shared across the team through online sync.'
      :'Accounts are stored on this device only.')+'</div>';
}

/* ---- Settings: My Account (limited users) ---- */
function settingsAccount(){
  const db=DB(), s=db.session, u=s&&s.userId?db.users.find(x=>x.id===s.userId):null;
  const acc=MODULES.filter(m=>permFor(m.id)!=="none")
    .map(m=>m.name+" ("+(permFor(m.id)==="edit"?"can edit":"view only")+")").join(", ")||"None";
  return '<h3 class="sec" style="margin-top:0">My account</h3>'+
    '<div class="card"><table><tbody>'+
      '<tr><td style="color:var(--muted)">Name</td><td><b>'+esc(s?s.name:"\u2014")+'</b></td></tr>'+
      '<tr><td style="color:var(--muted)">Username</td><td><b>'+esc(u?u.username:"\u2014")+'</b></td></tr>'+
      '<tr><td style="color:var(--muted)">Role</td><td><b>Limited account</b></td></tr>'+
      '<tr><td style="color:var(--muted)">Access</td><td><b>'+esc(acc)+'</b></td></tr>'+
    '</tbody></table>'+
    '<div class="hint" style="margin-top:10px">Backup and account management are available to the owner '+
    'account. Ask the owner if you need a change to your access.</div></div>'+
    '<div class="btnrow" style="margin-top:16px"><button class="btn" data-act="closeModal">Close</button></div>';
}

/* ---- Settings: Help & Support tab ---- */
function settingsHelp(){
  const faq=[
    ["Backing up your data","Open Settings \u2192 Backup and use \u201CDownload backup (JSON)\u201D to save "+
      "one file with everything. To move to a new device or recover, use \u201CUpload backup (JSON)\u201D "+
      "on the same tab \u2014 it replaces the current data after asking for your PIN."],
    ["Sharing across devices",CLOUD.on
      ? "Online sync is on, so every change saves to a shared cloud and appears on your team's devices "+
        "within a few seconds. The badge in the corner shows Synced, Syncing or Offline."
      : "Online sync is currently off. To let the team share one live dataset, an owner can add a "+
        "Supabase URL and key in the file's CLOUD settings, then host the page online."],
    ["Adding people","Owner \u2192 Settings \u2192 Users & Info \u2192 Grant credentials. Choose per-module "+
      "access: no access, view only, or can edit."],
    ["Consultancy vs Bodaboda","Use the left menu to switch modules. Bodaboda tracks motorcycles, drivers, "+
      "contracts and deposits; Consultancy tracks service contracts, payments and earnings. Both are "+
      "included in the same backup."],
    ["Security note","The PIN login controls who can open and edit records. On an online-shared setup the "+
      "link should be treated as semi-private, since the dashboard runs in the browser."]];
  return '<h3 class="sec" style="margin-top:0">Help &amp; Support</h3>'+
    '<div class="card">'+faq.map((f,i)=>'<div style="padding:'+(i?"12px":"0")+' 0 12px;'+
      (i?'border-top:1px solid var(--border)':'')+'"><b>'+esc(f[0])+'</b>'+
      '<div class="hint" style="margin-top:4px">'+esc(f[1])+'</div></div>').join("")+'</div>'+
    '<h3 class="sec">Contact</h3>'+
    '<div class="card"><div class="hint" style="margin-top:0">Built by <b>Adam Kamese</b>. For changes or '+
      'help with this dashboard, keep a recent JSON backup and note the steps that led to any issue \u2014 '+
      'it makes fixes much faster.</div></div>'+
    '<div class="btnrow" style="margin-top:16px"><button class="btn" data-act="closeModal">Close</button></div>';
}
function editUser(id){
  const db=DB(), u=id?db.users.find(x=>x.id===id):null;
  openModal(u?"Edit account":"Grant credentials",
    '<div class="grid2">'+
      '<div><label class="f">Full name <span class="req">*</span></label>'+
        '<input class="i" id="uName" value="'+esc(u?u.name:"")+'" autocapitalize="words"></div>'+
      '<div><label class="f">Username <span class="req">*</span></label>'+
        '<input class="i" id="uUser" value="'+esc(u?u.username:"")+'" autocapitalize="none"></div>'+
      '<div><label class="f">PIN '+(u?'<span class="hint" style="display:inline">(blank = unchanged)</span>':
        '<span class="req">*</span>')+'</label>'+
        '<input class="i num" id="uPin" type="password" inputmode="numeric" placeholder="At least 4 digits"></div>'+
      '<div><label class="f">Status</label><select class="i" id="uDis">'+
        '<option value="0"'+(u&&u.disabled?"":" selected")+'>Active</option>'+
        '<option value="1"'+(u&&u.disabled?" selected":"")+'>Disabled</option></select></div>'+
    '</div>'+
    '<h3 class="sec" style="font-size:16px">Module access</h3>'+
    MODULES.map(m=>{
      const cur=(u&&u.perms&&u.perms[m.id])||"none";
      return '<div style="display:flex;align-items:center;gap:12px;padding:7px 0;'+
        'border-bottom:1px solid var(--border)">'+
        '<div style="flex:1;font-weight:600;font-size:14.5px">'+ic(m.icon,15)+' '+esc(m.name)+'</div>'+
        '<select class="i" id="perm_'+m.id+'" style="width:150px">'+
          ['none','view','edit'].map(p=>'<option value="'+p+'"'+(cur===p?" selected":"")+'>'+
            (p==="none"?"No access":(p==="view"?"View only":"Can edit"))+'</option>').join("")+
        '</select></div>';}).join("")+
    '<div class="btnrow" style="margin-top:18px">'+
      '<button class="btn pri" data-act="saveUser" data-id="'+(id||"")+'">'+ic("check")+' Save</button>'+
      '<button class="btn" data-act="openSettings">Back</button></div>');
}
function saveUser(id){
  const db=DB();
  const name=document.getElementById("uName").value.trim();
  const un=document.getElementById("uUser").value.trim();
  const pin=document.getElementById("uPin").value.trim();
  if(!name) return alert("Enter the person's name.");
  if(!un) return alert("Enter a username.");
  if(db.users.some(x=>x.id!==id&&x.username.toLowerCase()===un.toLowerCase()))
    return alert("That username is already taken.");
  const u=id?db.users.find(x=>x.id===id):{id:uid(),perms:{}};
  if(!id&&pin.length<4) return alert("Set a PIN of at least 4 digits.");
  if(pin&&pin.length<4) return alert("The PIN must be at least 4 digits.");
  u.name=name; u.username=un;
  if(pin) u.pin=hash(pin);
  u.disabled=document.getElementById("uDis").value==="1";
  u.perms=u.perms||{};
  MODULES.forEach(m=>{ u.perms[m.id]=document.getElementById("perm_"+m.id).value; });
  if(!id) db.users.push(u);
  save(); openSettings();
}

/* ===================== SELF-TEST ===================== */
/* The fine model changed at your request: fines are now assessed when a week
   closes, from the shortfall, at the contract's own rate. The old per-deposit
   vectors no longer apply, so these cases test the NEW rules. The date engine
   is unchanged and is still swept against the workbook's own Monday formula. */
function runSelfTest(){
  const cases=[];
  const mk=(o)=>Object.assign({startDate:"2026-01-05",status:"active",terminatedOn:null,
    dailyRate:15000,fineMode:"daily",fineAmount:1000},o);
  const T=(name,got,want)=>cases.push([name,got,want]);

  T("full week expected = rate x 7",weekExpected(mk({endDate:"2027-01-04"}),"2026-01-05"),105000);
  T("week is a full 7 days even when the contract starts mid-week",
    weekExpected(mk({startDate:"2026-01-07",endDate:"2027-01-06"}),"2026-01-05"),105000);
  T("week beyond the contract end = 0",
    weekExpected(mk({endDate:"2026-01-11"}),"2026-01-12"),0);
  T("terminated mid-week clips the week",
    weekExpected(mk({status:"terminated",terminatedOn:"2026-01-07"}),"2026-01-05"),45000);
  T("total expected = duration x daily rate",
    contractExpectedTotal(mk({startDate:"2026-01-05",endDate:"2026-01-11"})),105000);
  T("total expected uses termination date once closed",
    contractExpectedTotal(mk({startDate:"2026-01-05",endDate:"2027-01-04",
      status:"terminated",terminatedOn:"2026-01-11"})),105000);
  T("daily fine: 2 days short at 1000",weekFineFor(mk({}),30000,7),2000);
  T("daily fine: fully paid = 0",weekFineFor(mk({}),0,7),0);
  T("daily fine capped at days owed",weekFineFor(mk({}),999999,7),7000);
  T("weekly fine: flat once",weekFineFor(mk({fineMode:"weekly",fineAmount:5000}),30000,7),5000);
  T("weekly fine: fully paid = 0",weekFineFor(mk({fineMode:"weekly",fineAmount:5000}),0,7),0);
  T("no-fine contract never charged",weekFineFor(mk({fineMode:"none"}),99999,7),0);
  T("contract end = start + 24 months - 1 day",
    contractEndDate("2026-01-30",24,0),"2028-01-29");
  T("contract end = start + 6 months + 2 weeks",
    contractEndDate("2026-01-05",6,2),"2026-07-18");
  T("contract end handles month-end clamp",contractEndDate("2026-01-31",1,0),"2026-02-27");
  T("contract ID format",makeContractCode("T 123 B","2026-01-30","Adam Kamese"),"T123B-20260130-AK");
  T("contract ID strips punctuation",makeContractCode("t-123-b","2026-12-01","juma daudi"),
    "T123B-20261201-JD");
  T("weeks.days notation",computeWeeks("2026-01-05","2026-01-15"),1.4);

  let mBad=0,mN=0;
  for(let n=dayNum("2020-01-01");n<dayNum("2035-01-01");n++){
    if((((n-MONDAY_ANCHOR)%7+7)%7===0)!==isMonday(fromDayNum(n))) mBad++; mN++;
  }
  let pass=0;
  const rows=cases.map(c=>{
    const ok=String(c[1])===String(c[2]); if(ok) pass++;
    return [c[0],ok?'<span class="pos">PASS</span>':'<span class="neg">FAIL</span>',
      {n:String(c[2])},{n:String(c[1])}];
  });
  const ok=pass===cases.length&&mBad===0;
  const out=document.getElementById("testOut");
  out.innerHTML='<div class="banner '+(ok?"ok":"warn")+'" style="margin-top:16px">'+
    '<b>'+pass+'/'+cases.length+' rule checks passed.</b> Monday rule swept across '+
    mN.toLocaleString("en-US")+' days (2020\u20132035): '+mBad+' mismatch(es).</div>'+
    table(["Check","Result","Expected","Actual"],rows);
}

/* ===================== MODALS ===================== */
function openModal(t,h,wide){
  document.getElementById("mTitle").textContent=t;
  document.getElementById("mBody").innerHTML=h;
  document.getElementById("mSheet").className="sheet"+(wide?" wide":"");
  document.getElementById("modal").classList.add("on");
}
function closeModal(){ document.getElementById("modal").classList.remove("on"); }

/* ===================== EVENTS ===================== */
document.addEventListener("click",function(e){
  const t=e.target;
  if(t.closest("#lgGo")) return doLogin();
  if(t.closest("#lgForgot")) return alert(
    "PINs are stored on this device only and cannot be recovered.\n\n"+
    "You would need to clear this site's data in browser settings, which also erases records. "+
    "Download a backup from Tools regularly.");
  if(t.closest("#burger")) return openSide();
  if(t.closest("#scrim")) return closeSide();
  if(t===document.getElementById("modal")) return closeModal();

  const mb=t.closest("[data-mod]");
  if(mb){ MOD=mb.dataset.mod; TAB=0; closeSide(); render(); window.scrollTo(0,0); return; }
  const tb=t.closest("[data-tab]");
  if(tb){ TAB=Number(tb.dataset.tab); renderMain(); window.scrollTo(0,0); return; }
  const stb=t.closest("[data-settab]");
  if(stb){ SET_TAB=Number(stb.dataset.settab); openSettings(); return; }

  const ab=t.closest("[data-act]"); if(!ab) return;
  const a=ab.dataset.act, id=ab.dataset.id||"";
  const goTab=n=>{closeModal();TAB=n;renderMain();window.scrollTo(0,0);};
  if(a==="signout") signOut();
  else if(a==="goEntry"){ F=blankDeposit(); goTab(3); }
  else if(a==="goReports") goTab(4);
  else if(a==="goContracts") goTab(2);
  else if(a==="goTools") goTab(5);
  else if(a==="pinOk") pinConfirmOk();
  else if(a==="pinCancel") pinCancel();
  else if(a==="newVehicle"){ if(guard()) openVehicle(null); }
  else if(a==="editVehicle"){ if(guard()){ closeModal(); openVehicle(id); } }
  else if(a==="viewVehicle") viewVehicle(id);
  else if(a==="saveVehicle") saveVehicle();
  else if(a==="addRepair"){ if(VF){ VF.repairs=VF.repairs||[];
    VF.repairs.push({id:"",type:"",date:today(),cost:""}); refreshVehicleForm(); } }
  else if(a==="delRepair"){ if(VF&&VF.repairs){ VF.repairs.splice(Number(id),1); refreshVehicleForm(); } }
  else if(a==="delVehicle") deleteVehicle(id);
  else if(a==="editColours") listEditor("colour");
  else if(a==="editModels") listEditor("model");
  else if(a==="addListItem") addListItem(ab.dataset.kind);
  else if(a==="delListItem") delListItem(ab.dataset.kind,Number(ab.dataset.idx));
  else if(a==="dlVehiclesXlsx") download("motorcycles_"+stamp()+".xlsx",
    buildXlsx(vehicleRows(),"Motorcycles"),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  else if(a==="closeModal") closeModal();
  else if(a==="openSettings") openSettings();
  else if(a==="newUser") editUser(null);
  else if(a==="editUser") editUser(id);
  else if(a==="saveUser") saveUser(id);
  else if(a==="delUser"){ requirePin("remove this account",function(){
      const db=DB(); db.users=db.users.filter(u=>u.id!==id); save(); openSettings(); }); }
  else if(a==="newContract"){ if(guard()) openContract(null); }
  else if(a==="editContract"){ if(guard()) openContract(id); }
  else if(a==="viewContract") viewContract(id);
  else if(a==="saveContract") saveContract();
  else if(a==="delContract"){ if(guard()) requirePin("delete this contract and all its deposits",
      function(){ const db=DB(); db.contracts=db.contracts.filter(c=>c.id!==id);
        db.deposits=db.deposits.filter(r=>r.contractId!==id); save(); closeModal(); renderMain(); }); }
  else if(a==="drillDriver") drillDriver(id);
  else if(a==="viewDriver") viewDriver(id);
  else if(a==="goConAdd"){ if(guard()){ NCS=null; TAB=1; render(); } }
  else if(a==="conNew"){ if(guard()){ NCS=blankConsultancy(); NCS.id=genConId(); conRefresh(); } }
  else if(a==="saveConsultancy") saveConsultancy();
  else if(a==="viewCon") viewConsultancy(id);
  else if(a==="payCon"){ if(guard()){ CONSUI.payId=id; TAB=2; closeModal(); render(); } }
  else if(a==="addConPay") addConPay(id);
  else if(a==="delConPay") delConPay(id,ab.dataset.pid);
  else if(a==="conStatus") conSetStatus(id,ab.dataset.s);
  else if(a==="editCon") editConsultancy(id);
  else if(a==="delCon") deleteConsultancy(id);
  else if(a==="conXlsx") download("consultancy_"+stamp()+".xlsx",
    buildXlsx(conExportRows(),"Consultancy"),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  else if(a==="conCsv") download("consultancy_"+stamp()+".csv",
    toCsv(conExportRows()),"text/csv;charset=utf-8");
  else if(a==="editDep") editDeposit(id);
  else if(a==="delDep") deleteDeposit(id);
  else if(a==="saveDep") saveDeposit();
  else if(a==="clearDep"){ F=blankDeposit(); renderMain(); }
  else if(a==="snap"){ F.weekStart=mondayOfWeek(F.weekStart); F.weekTouched=true; refreshEntry(); }
  else if(a==="weekAuto"){ F.weekTouched=false;
    F.weekStart=mondayOfWeek(F.depositDate); refreshEntry(); }
  else if(a==="depToday"){ F.depositDate=today();
    if(!F.weekTouched) F.weekStart=mondayOfWeek(today()); refreshEntry(); }
  else if(a==="weekNow"){ F.weekStart=mondayOfWeek(today()); F.weekTouched=true; refreshEntry(); }
  else if(a==="closeToday"){ CF.terminatedOn=today(); refreshContractForm(); }
  else if(a==="selftest") runSelfTest();
  else if(a==="exportPdf") exportPdf();
  else if(a==="exportXlsx") download("bodaboda_report_"+stamp()+".xlsx",
    buildXlsx(reportRows(),"Driver Report"),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  else if(a==="exportCsv") download("bodaboda_report_"+stamp()+".csv",
    toCsv(reportRows()),"text/csv;charset=utf-8");
  else if(a==="dlContractsXlsx") download("contracts_"+stamp()+".xlsx",
    buildXlsx(contractRows(),"Contracts"),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  else if(a==="dlContractsPdf") exportContractsPdf();
  else if(a==="dlDriversXlsx") download("driver_register_"+stamp()+".xlsx",
    buildXlsx(driverRows(),"Driver Register"),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  else if(a==="dlDriversCsv") download("driver_register_"+stamp()+".csv",
    toCsv(driverRows()),"text/csv;charset=utf-8");
  else if(a==="dlDriversPdf") exportDriversPdf();
  else if(a==="dlToolsCsv"){
    const q=TXT.tool;
    const rows=depositRows().filter(r=>matches([r.driverName,r.plate,r.code,r.depositDate].join(" "),q));
    download("deposits_"+stamp()+".csv",toCsv([["Deposit Date","Contract ID","Driver Name",
      "Plate","Week Start","Amount","Fine Paid"]].concat(rows.map(r=>[fmtDate(r.depositDate),
      r.code,r.driverName,r.plate,fmtDate(r.weekStart),r.amount,r.finePaid]))),
      "text/csv;charset=utf-8");
  }
  else if(a==="json") download("dashboard-backup-"+stamp()+".json",
    JSON.stringify(DB(),null,2),"application/json");
  else if(a==="pickRestore") pickRestore();
  else if(a==="reset"){ requirePin("erase every record on this device",function(){
      const o=DB().owner,n=DB().ownerName,s=DB().session,u=DB().users;
      mem=freshDB(); mem.owner=o; mem.ownerName=n; mem.session=s; mem.users=u;
      save(); F=blankDeposit(); render(); }); }
});

function onField(e){
  const el=e.target, f=el.dataset.f, fs=el.dataset.fs, cf=el.dataset.cf, tx=el.dataset.txt;
  const val=el.dataset.numeric?el.value.replace(/[^\d]/g,""):el.value;
  if(tx!=null){ TXT[tx]=el.value; const p=el.selectionStart;
    renderMain(); const n=document.querySelector('[data-txt="'+tx+'"]');
    if(n){ n.focus(); try{ n.setSelectionRange(p,p); }catch(x){} } return; }
  if(cf&&CF){ CF[cf]=val; if(cf==="fineMode"&&val==="none") CF.fineAmount="0";
    return refreshContractForm(); }
  if(el.dataset.rep!=null&&VF){
    const parts=el.dataset.rep.split(":"), rp=VF.repairs&&VF.repairs[Number(parts[0])];
    if(rp) rp[parts[1]]=val;
    return refreshVehicleForm(); }
  if(el.dataset.vf&&VF){ VF[el.dataset.vf]=el.type==="checkbox"?el.checked:val;
    return refreshVehicleForm(); }
  if(el.dataset.ncf!=null&&NCS){ NCS[el.dataset.ncf]=el.type==="checkbox"?el.checked:val;
    return refreshConForm(); }
  if(el.dataset.ncct!=null&&NCS){ const t=el.dataset.ncct, i=NCS.contractTypes.indexOf(t);
    if(el.checked&&i<0) NCS.contractTypes.push(t); else if(!el.checked&&i>=0) NCS.contractTypes.splice(i,1);
    return refreshConForm(); }
  if(el.dataset.payf!=null){ PAYNEW[el.dataset.payf]=val; return refreshConPay(); }
  if(el.dataset.conpick!=null){ CONSUI.payId=el.value; return refreshConPay(); }
  if(el.dataset.conyear!=null){ CONSUI.year=Number(el.value); return conRefresh(); }
  if(f&&F){
    F[f]=val;
    /* The week follows the deposit date only until the user picks a week
       themselves. Otherwise recording a late payment against an earlier week
       would be impossible - the date would keep dragging the week with it. */
    if(f==="weekStart") F.weekTouched=true;
    if(f==="depositDate"&&!F.id&&!F.weekTouched) F.weekStart=mondayOfWeek(el.value);
    if(f==="contractId"){ const c=contractById(el.value);
      if(c&&dayNum(F.depositDate)<dayNum(c.startDate)){ F.depositDate=c.startDate;
        F.weekStart=mondayOfWeek(c.startDate); } }
    return refreshEntry();
  }
  if(fs){ FS[fs]= fs==="multi"
      ?Array.prototype.slice.call(el.selectedOptions).map(o=>o.value):el.value;
    if(fs==="dateFilter"||fs==="driverFilter") renderSide();
    return renderMain(); }
  if(el.id==="restoreFile"&&el.files&&el.files[0]) handleRestore(el.files[0]);
}
document.addEventListener("input",onField);
document.addEventListener("change",onField);
document.addEventListener("keydown",function(e){
  if(e.key==="Escape"){ if(PENDING) pinCancel(); else closeModal(); }
  if(e.key==="Enter"&&document.getElementById("pinConfirm")) return pinConfirmOk();
  if(e.key==="Enter"&&document.getElementById("lgPin")&&
     !document.getElementById("login").classList.contains("hide")) doLogin();
});

/* ============================================================================
   GLOBAL CASCADING DATE PICKER
   Replaces the browser's native calendar on every date field in the system.
   Each field keeps its ISO "YYYY-MM-DD" value and its data-* binding, so the
   existing onField handler continues to do all the real work - we only change
   how the value is chosen: tap a year -> months -> tap a month -> days.
   ========================================================================== */
(function(){
  var MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var DOW=["M","T","W","T","F","S","S"];               // week starts Monday, like the app
  var pop=null, S={input:null,view:"day",decade:0,y:0,m:0};   // m is 0-11

  var p2=function(n){return String(n).padStart(2,"0");};
  function parse(v){ if(!v||!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    var a=v.split("-").map(Number); return [a[0],a[1]-1,a[2]]; }
  function nowP(){ var d=new Date(); return [d.getFullYear(),d.getMonth(),d.getDate()]; }
  var daysIn=function(y,m){ return new Date(y,m+1,0).getDate(); };
  var firstDow=function(y,m){ return (new Date(y,m,1).getDay()+6)%7; };   // Mon=0 .. Sun=6

  /* Turn a native date field into a plain read-only text field so the OS picker
     never opens; the value stays ISO and every data-* attribute is untouched. */
  function convert(inp){
    if(inp.dataset.dp) return;
    inp.dataset.dp="1"; inp.type="text"; inp.readOnly=true;
    inp.autocomplete="off"; inp.setAttribute("inputmode","none");
  }
  function scan(root){ (root||document).querySelectorAll('input[type="date"]').forEach(convert); }

  function ensure(){
    if(pop) return;
    pop=document.createElement("div"); pop.className="dp-pop"; pop.style.display="none";
    pop.addEventListener("click",onClick);
    document.body.appendChild(pop);
  }
  function place(){
    if(!S.input) return;
    var r=S.input.getBoundingClientRect(), w=pop.offsetWidth||266, h=pop.offsetHeight||300;
    var left=Math.max(8,Math.min(r.left,window.innerWidth-w-8));
    var top=r.bottom+6; if(top+h>window.innerHeight-8) top=Math.max(8,r.top-h-6);
    pop.style.left=left+"px"; pop.style.top=top+"px";
  }
  function open(inp){
    ensure(); S.input=inp;
    var p=parse(inp.value)||nowP();
    S.y=p[0]; S.m=p[1]; S.decade=Math.floor(S.y/10)*10; S.view="day";
    render(); pop.style.display=""; place();
  }
  function close(){ if(pop) pop.style.display="none"; S.input=null; }

  function render(){
    var t=nowP(), sel=parse(S.input&&S.input.value), title, up=false, body="";
    if(S.view==="year"){
      title=S.decade+" \u2013 "+(S.decade+11);
      body='<div class="dp-grid ym">';
      for(var i=0;i<12;i++){ var yr=S.decade+i;
        var c="dp-c"+(sel&&sel[0]===yr?" on":(yr===t[0]?" now":""));
        body+='<button type="button" class="'+c+'" data-a="year" data-v="'+yr+'">'+yr+'</button>'; }
      body+='</div>';
    } else if(S.view==="month"){
      up=true; title=String(S.y);
      body='<div class="dp-grid ym">';
      for(var j=0;j<12;j++){
        var on=sel&&sel[0]===S.y&&sel[1]===j, nw=t[0]===S.y&&t[1]===j;
        body+='<button type="button" class="dp-c'+(on?" on":(nw?" now":""))+
          '" data-a="month" data-v="'+j+'">'+MON[j]+'</button>'; }
      body+='</div>';
    } else {
      up=true; title=MON[S.m]+" "+S.y;
      var f=firstDow(S.y,S.m), n=daysIn(S.y,S.m);
      body='<div class="dp-grid d">'+DOW.map(function(d){return '<div class="dp-dow">'+d+'</div>';}).join("");
      for(var k=0;k<f;k++) body+='<div></div>';
      for(var d=1;d<=n;d++){
        var onD=sel&&sel[0]===S.y&&sel[1]===S.m&&sel[2]===d, nwD=t[0]===S.y&&t[1]===S.m&&t[2]===d;
        body+='<button type="button" class="dp-c day'+(onD?" on":(nwD?" now":""))+
          '" data-a="day" data-v="'+d+'">'+d+'</button>'; }
      body+='</div>';
    }
    pop.innerHTML=
      '<div class="dp-hd">'+
        '<button type="button" class="dp-nav" data-a="prev" aria-label="Previous">\u2039</button>'+
        '<button type="button" class="dp-title" data-a="up"'+(up?"":" disabled")+'>'+
          title+(up?' <span class="u">\u25B2</span>':'')+'</button>'+
        '<button type="button" class="dp-nav" data-a="next" aria-label="Next">\u203A</button>'+
      '</div>'+body+
      '<div class="dp-ft"><a class="lnk" data-a="today">Today</a></div>';
  }
  function commit(iso){
    var inp=S.input; if(!inp) return;
    inp.value=iso; close();
    inp.dispatchEvent(new Event("change",{bubbles:true}));   // drives the app's onField
  }
  function onClick(e){
    var b=e.target.closest("[data-a]"); if(!b) return;
    e.stopPropagation();
    var a=b.dataset.a, v=b.dataset.v, s;
    if(a==="prev"||a==="next"){ s=a==="next"?1:-1;
      if(S.view==="year") S.decade+=s*12;
      else if(S.view==="month") S.y+=s;
      else { S.m+=s; if(S.m<0){S.m=11;S.y--;} if(S.m>11){S.m=0;S.y++;} }
      return render(); }
    if(a==="up"){ if(S.view==="day") S.view="month";
      else if(S.view==="month"){ S.view="year"; S.decade=Math.floor(S.y/10)*10; } return render(); }
    if(a==="year"){ S.y=Number(v); S.view="month"; return render(); }
    if(a==="month"){ S.m=Number(v); S.view="day"; return render(); }
    if(a==="day") return commit(S.y+"-"+p2(S.m+1)+"-"+p2(Number(v)));
    if(a==="today"){ var t=nowP(); return commit(t[0]+"-"+p2(t[1]+1)+"-"+p2(t[2])); }
  }

  /* Open the picker whenever a date field is focused or tapped. Convert on the
     fly too, in case a field is interacted with before the observer sees it. */
  function grab(e){
    var inp=e.target.closest?e.target.closest('input[data-dp],input[type="date"]'):null;
    if(!inp) return null; convert(inp); return inp;
  }
  document.addEventListener("focusin",function(e){ var i=grab(e); if(i) open(i); });
  document.addEventListener("click",function(e){
    var i=grab(e); if(i){ open(i); return; }
    if(pop&&pop.style.display!=="none"&&!e.target.closest(".dp-pop")) close();
  },true);
  document.addEventListener("keydown",function(e){
    if(e.key==="Escape"&&pop&&pop.style.display!=="none") close(); });
  window.addEventListener("scroll",function(){ if(pop&&pop.style.display!=="none") place(); },true);
  window.addEventListener("resize",function(){ if(pop&&pop.style.display!=="none") place(); });

  /* Convert the fields present now, and any the app renders later. */
  scan(document);
  new MutationObserver(function(muts){
    for(var i=0;i<muts.length;i++){ var nodes=muts[i].addedNodes;
      for(var j=0;j<nodes.length;j++){ var nd=nodes[j]; if(nd.nodeType!==1) continue;
        if(nd.matches&&nd.matches('input[type="date"]')) convert(nd);
        if(nd.querySelectorAll) scan(nd); } }
  }).observe(document.body,{childList:true,subtree:true});
})();

