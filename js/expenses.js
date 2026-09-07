/* expenses.js
   expenses module - PLACEHOLDER (not yet built). It registers itself so it
   appears in the left menu with its roadmap page. Build it out by adding a
   renderer: registerModule(def, function(m,el){ ... }). */
registerModule({id:"expenses",icon:"wallet",name:"Expenses",live:false,title:"Expenses Dashboard",
  tabs:["Summary","Expenses","Settings"],
  plan:["Expense categories and payees","Receipts by date, module and category",
        "Spend against budget, by period"],note:"New module - rules still to be defined."});
