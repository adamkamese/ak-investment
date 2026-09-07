/* earnings.js
   earnings module - PLACEHOLDER (not yet built). It registers itself so it
   appears in the left menu with its roadmap page. Build it out by adding a
   renderer: registerModule(def, function(m,el){ ... }). */
registerModule({id:"earnings",icon:"coin",name:"Other Earnings",live:false,title:"Other Earnings Dashboard",
  tabs:["Summary","Earnings","Settings"],
  plan:["Income sources outside the main modules","Amount, date, source and category",
        "Consolidated earnings across all modules"],note:"New module - rules still to be defined."});
