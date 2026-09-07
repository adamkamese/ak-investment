/* mobilemoney.js
   mpesa module - PLACEHOLDER (not yet built). It registers itself so it
   appears in the left menu with its roadmap page. Build it out by adding a
   renderer: registerModule(def, function(m,el){ ... }). */
registerModule({id:"mpesa",icon:"phone",name:"Mobile Money",live:false,title:"Mobile Money Dashboard",
  tabs:["Summary","Data Table","Settings"],
  plan:["Transaction records: date, operator, float, cash-in/out counts, commission",
        "Commission limited to one entry per operator per month, days 1-5 only",
        "Float / Cash / Capital ledger with balance check: capital minus (float + cash)",
        "Float split per operator: M-Pesa, Mixx by Yas, Airtel Money, HaloPesa"],
  note:"2_Mpesa.py is complete, so this can be built next with no new decisions."});
