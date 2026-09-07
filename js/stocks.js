/* stocks.js
   stocks module - PLACEHOLDER (not yet built). It registers itself so it
   appears in the left menu with its roadmap page. Build it out by adding a
   renderer: registerModule(def, function(m,el){ ... }). */
registerModule({id:"stocks",icon:"box",name:"Stocks",live:false,title:"Stock Dashboard",
  tabs:["Summary","Stock Table","Settings"],
  plan:["Item catalogue with unit cost and reorder level","Stock in / stock out movements",
        "Valuation and low-stock alerts"],
  note:"3_Stocks.py is empty, so the rules still need defining."});
