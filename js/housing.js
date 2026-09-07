/* housing.js
   housing module - PLACEHOLDER (not yet built). It registers itself so it
   appears in the left menu with its roadmap page. Build it out by adding a
   renderer: registerModule(def, function(m,el){ ... }). */
registerModule({id:"housing",icon:"house",name:"Housing",live:false,title:"Housing Dashboard",
  tabs:["Summary","Construction","Rentals","Settings"],
  plan:["Construction: projects, budgets, phases, material and labour costs",
        "Rentals: units, tenants, lease dates, rent invoices and payments",
        "Budget vs actual per phase; arrears ageing and occupancy rate"],
  note:"Construction and renting merged into one module as requested."});
