# Boboda Business Dashboard

Web app for managing a bodaboda (motorcycle-financing) business and consultancy
services. Same app as before, now split into per-module scripts so each part can
be edited on its own.

## Folder structure
```
index.html                 HTML shell + styles + <script> tags (loads the files below in order)
js/core.js                 Framework: helpers, data + Supabase sync, login, shell/navigation,
                           settings, shared widgets & charts, events, date picker, module registry
js/bodaboda.js             Bodaboda module          (live)
js/consultancy.js          Consultancy module       (live)
js/mobilemoney.js          Mobile Money module      (placeholder)
js/stocks.js               Stocks module            (placeholder)
js/housing.js              Housing module           (placeholder)
js/expenses.js             Expenses module          (placeholder)
js/earnings.js             Other Earnings module    (placeholder)
js/app.js                  Boot (runs last)
manifest.webmanifest       App name + icons (home-screen install)
icon-180/192/512.png       App icons
supabase-setup.sql         Run once in Supabase to create all backend tables
```

Each module lives in its own file and **registers itself** into the menu via
`registerModule(...)`. `core.js` must load first (it defines the registry and
shared code); `app.js` must load last (it boots the app). Menu order = script
order in index.html.

## To modify a module
- Bodaboda   -> edit `js/bodaboda.js`
- Consultancy-> edit `js/consultancy.js`
- Any placeholder (Mobile Money, Stocks, Housing, Expenses, Other Earnings)
  -> edit its file in `js/`. Right now each just calls:
     ```js
     registerModule({ id:"stocks", name:"Stocks", live:false, ... });
     ```
     which shows its roadmap page. To make it a working module, add a renderer:
     ```js
     registerModule({ id:"stocks", name:"Stocks", live:true, title:"Stock Dashboard" },
       function(m, el){ el.innerHTML = "...your tabs and tables..."; });
     ```
- Shared things (login, settings, sync, widgets, styling) -> `js/core.js`

## To add a brand-new module
1. Create `js/<name>.js` with a `registerModule({...})` call.
2. Add `<script src="js/<name>.js"></script>` in index.html, before app.js.
That's it - no other file needs editing.

## Connect shared data (Supabase)
1. In Supabase -> SQL Editor -> New query, paste the **entire `supabase-setup.sql`**
   file (included in this package) and Run. It creates:
   - `app_state` - the one table the app reads/writes, and
   - reporting tables (drivers, vehicles, vehicle_repairs, contracts, deposits,
     consultancy_contracts, consultancy_payments, app_users) that are filled
     **automatically** from every save by a trigger, for browsing and SQL reports.
   You never edit the reporting tables by hand; the app keeps using `app_state`.
2. Supabase -> Project Settings -> API: copy the Project URL and anon/public key.
3. Open **`js/core.js`**, find `const CLOUD={` near the top, and paste them in:
   ```js
   const CLOUD={
     url:"https://YOURPROJECT.supabase.co",
     key:"your-anon-public-key",
   ```
   Leave both blank to run offline (this device only).

Example report once data exists (Supabase -> SQL editor):
```sql
select dr.name, count(d.*) deposits, sum(d.amount) collected
from deposits d
join contracts c on c.id = d.contract_id
join drivers  dr on dr.id = c.driver_id
group by dr.name order by collected desc;
```

## Deploy to Netlify
1. Go to https://app.netlify.com/drop
2. Drag the **whole folder** (this folder, containing index.html and the js/
   folder) onto the drop area. Netlify keeps the structure and gives you a link.
3. Make a free Netlify account when prompted so the link stays permanent.

(Also works on Cloudflare Pages or GitHub Pages - upload the same folder.)

## On an iPhone
Open the Netlify link in Safari -> Share -> Add to Home Screen. You get the app
icon, name, full-screen launch and splash screen.

## Backups
In the app: Settings -> Backup -> Download backup (JSON) regularly. That JSON is
your data; these files are the program.
