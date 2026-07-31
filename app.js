(() => {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const periods = ["Morning","Afternoon","Evening","All day"];
  const symbols = {AED:"AED",USD:"$",EUR:"€",GBP:"£"};
  const defaultMeta = () => ({name:"Bespoke Journey",client:"",startDate:"",guests:2,currency:"AED",taxPercent:0,serviceFee:0,quoteValidUntil:"",showItemPrices:true,includePdfImages:true,terms:"Prices are subject to availability at the time of confirmation. Final services are confirmed only after receipt of payment."});
  const emptyTrip = () => ({meta:defaultMeta(),days:[{id:crypto.randomUUID(),title:"Day 1",items:[]}],activeDay:0});
  let state = JSON.parse(localStorage.getItem("gh_itinerary") || "null") || emptyTrip();
  state.meta={...defaultMeta(),...state.meta};
  state.days=state.days.map(day=>({...day,items:(day.items||[]).map(item=>({...item,price:Number(item.price||0),supplierCost:Number(item.supplierCost||0),pricingBasis:item.pricingBasis==="per-person"?"per-person":"total"}))}));
  let database = null, attractions = [], activeCategory = "All", draggedId = null, pendingImageUrl = "";

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
  const money = value => `${symbols[state.meta.currency]} ${Number(value||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const activeDay = () => state.days[state.activeDay];
  const persist = () => localStorage.setItem("gh_itinerary",JSON.stringify(state));
  const itemMultiplier = item => item.pricingBasis==="per-person"?state.meta.guests:1;
  const itemSellTotal = item => Number(item.price||0)*itemMultiplier(item);
  const itemSupplierTotal = item => Number(item.supplierCost||0)*itemMultiplier(item);
  function quoteTotals(){
    const items=state.days.flatMap(day=>day.items);
    const subtotal=items.reduce((sum,item)=>sum+itemSellTotal(item),0);
    const supplier=items.reduce((sum,item)=>sum+itemSupplierTotal(item),0);
    const tax=subtotal*(Number(state.meta.taxPercent||0)/100);
    const serviceFee=Number(state.meta.serviceFee||0);
    const grandTotal=subtotal+tax+serviceFee;
    const profit=subtotal+serviceFee-supplier;
    const margin=subtotal+serviceFee>0?profit/(subtotal+serviceFee)*100:0;
    return {subtotal,supplier,tax,serviceFee,grandTotal,profit,margin};
  }
  function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),1800)}

  function syncMeta(){
    state.meta={...state.meta,name:$("#trip-name").value||"Bespoke Journey",client:$("#client-name").value,startDate:$("#start-date").value,guests:Math.max(1,Number($("#guests").value)||1),currency:$("#currency").value,taxPercent:Math.max(0,Number($("#tax-percent").value)||0),serviceFee:Math.max(0,Number($("#service-fee").value)||0),quoteValidUntil:$("#quote-valid-until").value,showItemPrices:$("#show-item-prices").checked,includePdfImages:$("#include-pdf-images").checked,terms:$("#quote-terms").value.trim()};
    $("#planner-title").textContent=state.meta.name;$("#guest-count").textContent=state.meta.guests;persist();renderTotals();
  }
  function renderTotals(){
    const totals=quoteTotals();
    $("#client-subtotal").textContent=money(totals.subtotal);$("#supplier-total").textContent=money(totals.supplier);$("#profit-margin").textContent=`${totals.margin.toFixed(1)}% · ${money(totals.profit)}`;$("#grand-total").textContent=money(totals.grandTotal);$("#day-count").textContent=state.days.length;
    document.querySelectorAll("[data-item-price]").forEach(el=>{const item=state.days.flatMap(day=>day.items).find(candidate=>candidate.id===el.dataset.itemPrice);if(item)el.firstChild.textContent=money(itemSellTotal(item))});
  }
  function renderDays(){
    $("#day-tabs").innerHTML=state.days.map((day,index)=>`<button class="day-tab${index===state.activeDay?" active":""}" data-day="${index}">${escapeHTML(day.title)}</button>`).join("");
    const day=activeDay();
    $("#day-content").innerHTML=`
      <div class="day-header"><input id="day-title" value="${escapeHTML(day.title)}" aria-label="Day title"><button id="delete-day">Delete day</button></div>
      <div class="timeline">${periods.map(period=>`
        <section class="period"><div class="period-label">${period}</div><div class="period-items" data-period="${period}">
          ${day.items.filter(item=>item.period===period).map(item=>itemCard(item)).join("")}
        </div></section>`).join("")}</div>`;
    if(!day.items.length)$("#day-content").insertAdjacentHTML("beforeend",'<div class="empty-day">Add an attraction from the library or create a hotel, transfer, car rental, flight, restaurant or detailed note.</div>');
    bindDragDrop();renderTotals();
  }
  function itemCard(item){return `<article class="itinerary-item" draggable="true" data-id="${item.id}">
    <span class="drag" aria-hidden="true">⋮⋮</span>${item.imageUrl?`<img class="item-image" src="${escapeHTML(item.imageUrl)}" alt="" loading="lazy">`:""}<div><span class="item-type">${escapeHTML(item.type)}</span><h3>${escapeHTML(item.name)}</h3>
    <p class="item-details">${escapeHTML([item.duration,item.location].filter(Boolean).join(" · "))}</p>${item.notes?`<p class="item-notes">${escapeHTML(item.notes)}</p>`:""}
    <div class="item-actions"><button data-edit="${item.id}">Edit details</button><button class="delete" data-delete="${item.id}">Remove</button></div></div>
    <strong class="item-price" data-item-price="${item.id}">${money(itemSellTotal(item))}<small>${item.pricingBasis==="per-person"?"per guest":"total"}</small></strong></article>`}
  function bindDragDrop(){
    document.querySelectorAll(".itinerary-item").forEach(item=>item.addEventListener("dragstart",()=>draggedId=item.dataset.id));
    document.querySelectorAll(".period-items").forEach(zone=>{
      zone.addEventListener("dragover",event=>{event.preventDefault();zone.classList.add("drag-over")});
      zone.addEventListener("dragleave",()=>zone.classList.remove("drag-over"));
      zone.addEventListener("drop",()=>{zone.classList.remove("drag-over");const index=activeDay().items.findIndex(x=>x.id===draggedId);if(index>=0){const [item]=activeDay().items.splice(index,1);item.period=zone.dataset.period;activeDay().items.push(item);persist();renderDays()}});
    });
  }
  function openDialog(item={}){
    pendingImageUrl=item.imageUrl||"";
    $("#dialog-title").textContent=item.id?"Edit itinerary item":"Add custom itinerary item";$("#item-id").value=item.id||"";
    $("#item-type").value=item.type||"Hotel";$("#item-period").value=item.period||"Morning";$("#item-name").value=item.name||"";
    $("#item-duration").value=item.duration||"";$("#supplier-cost").value=item.supplierCost||0;$("#item-price").value=item.price||0;$("#pricing-basis").value=item.pricingBasis||"total";$("#item-location").value=item.location||"";$("#item-notes").value=item.notes||"";
    $("#item-dialog").showModal();
  }
  function addAttraction(item){
    openDialog({type:"Attraction",period:"Morning",name:item.attraction_name,duration:item.ideal_timeframe_duration,supplierCost:0,price:0,pricingBasis:"total",location:item.exact_location_context,notes:item.bespoke_selling_point,imageUrl:item.imageUrl});
  }

  function renderLibrary(){
    const query=$("#search").value.trim().toLowerCase();
    const filtered=attractions.filter(item=>(activeCategory==="All"||item.thematic_category===activeCategory)&&(!query||`${item.attraction_name} ${item.exact_location_context}`.toLowerCase().includes(query)));
    $("#library-status").textContent=attractions.length?`${filtered.length} of ${attractions.length} attractions`:"Select a destination to browse attractions.";
    $("#library-cards").innerHTML=filtered.length?filtered.map((item,index)=>`<article class="library-card"><img class="library-image" src="${escapeHTML(item.imageUrl)}" alt="${escapeHTML(item.attraction_name)}" loading="lazy"><div class="library-card-body"><div class="row"><div><h3>${escapeHTML(item.attraction_name)}</h3><p>${escapeHTML(item.thematic_category)} · ${escapeHTML(item.ideal_timeframe_duration)}</p></div><button class="add" data-add="${index}" aria-label="Add ${escapeHTML(item.attraction_name)}">+</button></div><p class="location">${escapeHTML(item.exact_location_context)}</p></div></article>`).join(""):'<div class="library-empty"><span>✦</span><p>Select a destination or adjust your filters.</p></div>';
    $("#library-cards").querySelectorAll("[data-add]").forEach(button=>button.addEventListener("click",()=>addAttraction(filtered[Number(button.dataset.add)])));
  }
  function renderCategories(){
    const list=["All",...new Set(attractions.map(item=>item.thematic_category))];
    $("#categories").innerHTML=list.map(name=>`<button class="category${name==="All"?" active":""}" data-category="${escapeHTML(name)}">${escapeHTML(name)}</button>`).join("");
  }
  async function loadRegions(){
    const response=await fetch("data/regions.json");if(!response.ok)throw Error("Region index could not be loaded.");
    const data=await response.json();$("#region").innerHTML+=data.map(x=>`<option value="${escapeHTML(x.file)}">${escapeHTML(x.region)}</option>`).join("");
  }
  function dateForDay(index){
    if(!state.meta.startDate)return "";
    const date=new Date(`${state.meta.startDate}T12:00:00`);
    date.setDate(date.getDate()+index);
    return date.toLocaleDateString("en-GB",{day:"numeric",month:"long",weekday:"long"});
  }
  function buildDayCard(day,index){
    const hotel=day.items.find(item=>item.type==="Hotel")||state.days.flatMap(item=>item.items).find(item=>item.type==="Hotel");
    const image=state.meta.includePdfImages?day.items.find(item=>item.imageUrl)?.imageUrl:"";
    const narrative=day.items.length?day.items.map(item=>{
      const detail=item.notes||`${item.name}${item.location?` at ${item.location}`:""}.`;
      const price=state.meta.showItemPrices&&itemSellTotal(item)>0?`<span class="pdf-line-price">${money(itemSellTotal(item))}</span>`:"";
      return `<div class="pdf-schedule-line"><p><strong>${escapeHTML(item.period)} · ${escapeHTML(item.name)}</strong>${price}</p><p>${escapeHTML(detail)}</p>${item.duration||item.location?`<small>${escapeHTML([item.duration,item.location].filter(Boolean).join(" · "))}</small>`:""}</div>`;
    }).join(""):"<p>Details to be confirmed.</p>";
    return `<article class="pdf-day"><div class="pdf-day-head"><div class="pdf-day-number"><small>DAY</small><strong>${index+1}</strong></div><div><h3>${escapeHTML(day.title)}</h3><div class="pdf-day-date">${escapeHTML(dateForDay(index))}</div></div></div>${image?`<img class="pdf-day-image" src="${escapeHTML(image)}" alt="">`:""}<div class="pdf-day-body">${narrative}${hotel?`<p class="pdf-stay">Overnight Stay: ${escapeHTML(hotel.name)}${hotel.location?`, ${escapeHTML(hotel.location)}`:""}</p>`:""}</div></article>`;
  }
  function paginateDays(){
    const groups=[];let current=[],weight=0;
    state.days.forEach((day,index)=>{
      const dayWeight=280+day.items.reduce((sum,item)=>sum+String(item.notes||item.name||"").length,0);
      if(current.length&&(current.length>=2||weight+dayWeight>1050)){groups.push(current);current=[];weight=0}
      current.push({day,index});weight+=dayWeight;
    });
    if(current.length)groups.push(current);
    return groups;
  }
  function buildPrintDocument(){
    syncMeta();
    const allItems=state.days.flatMap(day=>day.items);
    const flights=allItems.filter(item=>item.type==="Flight");
    const hotel=allItems.find(item=>item.type==="Hotel");
    const attractions=allItems.filter(item=>item.type==="Attraction");
    const totals=quoteTotals();
    const perPerson=totals.grandTotal/Math.max(1,state.meta.guests);
    const subtitle=attractions.slice(0,4).map(item=>item.name).join(" · ")||"Bespoke itinerary crafted around your journey";
    const heroTitle=(state.meta.name||"Bespoke Journey").toUpperCase();
    const flightTable=flights.length?`<h2 class="pdf-heading">Flight Details</h2><table class="pdf-table"><thead><tr><th>Sector / Flight</th><th>Date</th><th>Departure</th><th>Arrival</th><th>Duration</th><th>Route / Notes</th></tr></thead><tbody>${flights.map(flight=>{const dayIndex=state.days.findIndex(day=>day.items.some(item=>item.id===flight.id));return `<tr><td>${escapeHTML(flight.name)}</td><td>${escapeHTML(dateForDay(Math.max(0,dayIndex)))}</td><td>${escapeHTML(flight.period)}</td><td>As scheduled</td><td>${escapeHTML(flight.duration||"—")}</td><td>${escapeHTML(flight.notes||flight.location||"Direct")}</td></tr>`}).join("")}</tbody></table>`:"";
    const inclusions=[...new Set(allItems.filter(item=>item.type!=="Note").map(item=>item.name))];
    const footer=`${escapeHTML(state.meta.name)} · Global Holidayz`;
    const cover=`<div class="pdf-logo">Global <span>holidayz</span></div><div class="pdf-hero"><h1>${escapeHTML(heroTitle)}</h1><p>Bespoke Travel Proposal</p></div>
      <h1 class="pdf-trip-title">${escapeHTML(state.meta.name)}</h1><p class="pdf-subtitle">${escapeHTML(subtitle)}</p>
      <div class="pdf-highlights"><div class="pdf-highlight"><span>Duration</span><strong>${state.days.length} Days / ${Math.max(0,state.days.length-1)} Nights</strong></div><div class="pdf-highlight"><span>Group Size</span><strong>${state.meta.guests} Guests</strong></div><div class="pdf-highlight"><span>Hotel</span><strong>${escapeHTML(hotel?.name||"To be confirmed")}</strong></div><div class="pdf-highlight"><span>Airline</span><strong>${escapeHTML(flights[0]?.name||"To be confirmed")}</strong></div></div>${flightTable}`;
    const itineraryPages=paginateDays().map((group,pageIndex)=>`<div class="pdf-logo">Global <span>holidayz</span></div><h2 class="pdf-section-title">Your Journey · ${pageIndex+1}</h2>${group.map(({day,index})=>buildDayCard(day,index)).join("")}`);
    const validity=state.meta.quoteValidUntil?new Date(`${state.meta.quoteValidUntil}T12:00:00`).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}):"As stated in your confirmation";
    const pricing=`<div class="pdf-logo">Global <span>holidayz</span></div><h2 class="pdf-section-title">Investment Summary</h2>
      <div class="pdf-price"><span>Total Bespoke Journey</span><strong>${money(totals.grandTotal)}</strong><small>${state.meta.guests} Guests · ${money(perPerson)} per person</small></div>
      <table class="pdf-summary-table"><tr><td>Itinerary subtotal</td><td>${money(totals.subtotal)}</td></tr>${totals.tax?`<tr><td>Tax / VAT (${Number(state.meta.taxPercent).toFixed(2)}%)</td><td>${money(totals.tax)}</td></tr>`:""}${totals.serviceFee?`<tr><td>Service fee</td><td>${money(totals.serviceFee)}</td></tr>`:""}<tr class="total"><td>Total quote</td><td>${money(totals.grandTotal)}</td></tr></table>
      <p class="pdf-validity"><strong>Quotation valid until:</strong> ${escapeHTML(validity)}</p>
      <div class="pdf-inclusions"><h3>✓ Package Cost Includes</h3><ul>${(inclusions.length?inclusions:["Services as detailed in the confirmed itinerary"]).map(item=>`<li>${escapeHTML(item)}</li>`).join("")}</ul></div>
      ${state.meta.terms?`<div class="pdf-terms"><h3>Terms & Conditions</h3><p>${escapeHTML(state.meta.terms)}</p></div>`:""}`;
    const pages=[cover,...itineraryPages,pricing];
    $("#print-document").innerHTML=pages.map((content,index)=>`<section class="pdf-page">${content}<div class="pdf-footer">${footer} · Page ${index+1} of ${pages.length}</div></section>`).join("");
  }
  async function downloadPdf(){
  buildPrintDocument();

  if(typeof html2pdf!=="function"){
    toast("PDF generator could not be loaded");
    return;
  }

  const printMediaRules=[];

  for(const sheet of document.styleSheets){
    try{
      for(const rule of sheet.cssRules){
        if(rule instanceof CSSMediaRule&&rule.conditionText==="print"){
          printMediaRules.push(rule);
          rule.media.mediaText="all";
        }
      }
    }catch(error){
      // Ignore stylesheets whose rules cannot be read.
    }
  }

  const documentElement=$("#print-document");
  const previousWidth=documentElement.style.width;
  documentElement.style.width="186mm";

  const filename=`${
    state.meta.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,"-")
      .replace(/^-|-$/g,"") || "itinerary"
  }.pdf`;

  try{
    await new Promise(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
    const pendingImages=[...documentElement.images].filter(image=>!image.complete);
    if(pendingImages.length){
      await Promise.race([
        Promise.all(pendingImages.map(image=>new Promise(resolve=>{image.addEventListener("load",resolve,{once:true});image.addEventListener("error",resolve,{once:true})}))),
        new Promise(resolve=>setTimeout(resolve,6000))
      ]);
    }

    await html2pdf().set({
      margin:[12,12,12,12],
      filename,
      image:{type:"jpeg",quality:0.98},
      html2canvas:{
        scale:2,
        useCORS:true,
        backgroundColor:"#ffffff"
      },
      jsPDF:{
        unit:"mm",
        format:"a4",
        orientation:"portrait"
      },
      pagebreak:{
        mode:["css","legacy"]
      }
    }).from(documentElement).save();

    toast("PDF downloaded");
  }catch(error){
    console.error("PDF generation failed",error);
    toast("PDF generation failed");
  }finally{
    documentElement.style.width=previousWidth;
    printMediaRules.forEach(rule => rule.media.mediaText="print");
  }
}
  function init(){
    $("#trip-name").value=state.meta.name;$("#client-name").value=state.meta.client;$("#start-date").value=state.meta.startDate;$("#guests").value=state.meta.guests;$("#currency").value=state.meta.currency;
    $("#tax-percent").value=state.meta.taxPercent;$("#service-fee").value=state.meta.serviceFee;$("#quote-valid-until").value=state.meta.quoteValidUntil;$("#show-item-prices").checked=state.meta.showItemPrices;$("#include-pdf-images").checked=state.meta.includePdfImages;$("#quote-terms").value=state.meta.terms;
    ["trip-name","client-name","start-date","guests","currency","tax-percent","service-fee","quote-valid-until","show-item-prices","include-pdf-images","quote-terms"].forEach(id=>$("#"+id).addEventListener("input",syncMeta));
    syncMeta();renderDays();loadRegions().catch(error=>$("#library-status").textContent=error.message);
  }

  $("#region").addEventListener("change",async()=>{attractions=[];$("#destination").disabled=true;$("#destination").innerHTML='<option value="">Select destination</option>';$("#search").disabled=true;$("#categories").innerHTML="";renderLibrary();if(!$("#region").value)return;try{const r=await fetch(`data/destinations/${encodeURIComponent($("#region").value)}`);database=await r.json();$("#destination").innerHTML+=database.destinations.map((d,i)=>`<option value="${i}">${escapeHTML(d.destination)}</option>`).join("");$("#destination").disabled=false}catch(error){$("#library-status").textContent="Destination data could not be loaded."}});
  $("#destination").addEventListener("change",()=>{activeCategory="All";$("#search").value="";attractions=$("#destination").value===""?[]:Object.values(database.destinations[Number($("#destination").value)].categories).flat();$("#search").disabled=!attractions.length;renderCategories();renderLibrary()});
  $("#categories").addEventListener("click",event=>{const button=event.target.closest("[data-category]");if(!button)return;activeCategory=button.dataset.category;$("#categories").querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===button));renderLibrary()});
  $("#search").addEventListener("input",renderLibrary);
  $("#reset-library").addEventListener("click",()=>{$("#region").value="";$("#destination").innerHTML='<option value="">Select destination</option>';$("#destination").disabled=true;$("#search").value="";$("#search").disabled=true;attractions=[];$("#categories").innerHTML="";renderLibrary()});
  $("#day-tabs").addEventListener("click",event=>{const button=event.target.closest("[data-day]");if(button){state.activeDay=Number(button.dataset.day);persist();renderDays()}});
  $("#day-content").addEventListener("change",event=>{if(event.target.id==="day-title"){activeDay().title=event.target.value||`Day ${state.activeDay+1}`;persist();renderDays()}});
  $("#day-content").addEventListener("click",event=>{const edit=event.target.dataset.edit,del=event.target.dataset.delete;if(edit)openDialog(activeDay().items.find(x=>x.id===edit));if(del){activeDay().items=activeDay().items.filter(x=>x.id!==del);persist();renderDays()}if(event.target.id==="delete-day"){if(state.days.length===1)return toast("At least one day is required");state.days.splice(state.activeDay,1);state.activeDay=Math.max(0,state.activeDay-1);persist();renderDays()}});
  $("#add-day").addEventListener("click",()=>{state.days.push({id:crypto.randomUUID(),title:`Day ${state.days.length+1}`,items:[]});state.activeDay=state.days.length-1;persist();renderDays()});
  $("#add-custom").addEventListener("click",()=>openDialog());
  $("#close-dialog").addEventListener("click",()=>$("#item-dialog").close());$("#cancel-dialog").addEventListener("click",()=>$("#item-dialog").close());
  $("#item-form").addEventListener("submit",event=>{event.preventDefault();const id=$("#item-id").value||crypto.randomUUID();const item={id,type:$("#item-type").value,period:$("#item-period").value,name:$("#item-name").value.trim(),duration:$("#item-duration").value.trim(),supplierCost:Number($("#supplier-cost").value)||0,price:Number($("#item-price").value)||0,pricingBasis:$("#pricing-basis").value,location:$("#item-location").value.trim(),notes:$("#item-notes").value.trim(),imageUrl:pendingImageUrl};const index=activeDay().items.findIndex(x=>x.id===id);if(index>=0)activeDay().items[index]=item;else activeDay().items.push(item);persist();$("#item-dialog").close();renderDays();toast(index>=0?"Item updated":"Item added")});
  $("#save").addEventListener("click",()=>{persist();toast("Working itinerary saved")});
  $("#print").addEventListener("click",downloadPdf);
  $("#export").addEventListener("click",()=>{syncMeta();const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`${state.meta.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")||"itinerary"}.json`;a.click();URL.revokeObjectURL(url)});
  init();
})();
