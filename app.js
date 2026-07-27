(() => {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const periods = ["Morning","Afternoon","Evening","All day"];
  const symbols = {AED:"AED",USD:"$",EUR:"€",GBP:"£"};
  const emptyTrip = () => ({meta:{name:"Bespoke Journey",client:"",startDate:"",guests:2,currency:"AED"},days:[{id:crypto.randomUUID(),title:"Day 1",items:[]}],activeDay:0});
  let state = JSON.parse(localStorage.getItem("gh_itinerary") || "null") || emptyTrip();
  let database = null, attractions = [], activeCategory = "All", draggedId = null;

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
  const money = value => `${symbols[state.meta.currency]} ${Number(value||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const activeDay = () => state.days[state.activeDay];
  const persist = () => localStorage.setItem("gh_itinerary",JSON.stringify(state));
  function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),1800)}

  function syncMeta(){
    state.meta={name:$("#trip-name").value||"Bespoke Journey",client:$("#client-name").value,startDate:$("#start-date").value,guests:Math.max(1,Number($("#guests").value)||1),currency:$("#currency").value};
    $("#planner-title").textContent=state.meta.name;$("#guest-count").textContent=state.meta.guests;persist();renderTotals();
  }
  function renderTotals(){
    const total=state.days.flatMap(day=>day.items).reduce((sum,item)=>sum+Number(item.price||0),0);
    $("#grand-total").textContent=money(total);$("#day-count").textContent=state.days.length;
    document.querySelectorAll("[data-price]").forEach(el=>el.textContent=money(el.dataset.price));
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
    <span class="drag" aria-hidden="true">⋮⋮</span><div><span class="item-type">${escapeHTML(item.type)}</span><h3>${escapeHTML(item.name)}</h3>
    <p class="item-details">${escapeHTML([item.duration,item.location].filter(Boolean).join(" · "))}</p>${item.notes?`<p class="item-notes">${escapeHTML(item.notes)}</p>`:""}
    <div class="item-actions"><button data-edit="${item.id}">Edit details</button><button class="delete" data-delete="${item.id}">Remove</button></div></div>
    <strong class="item-price" data-price="${Number(item.price||0)}">${money(item.price)}</strong></article>`}
  function bindDragDrop(){
    document.querySelectorAll(".itinerary-item").forEach(item=>item.addEventListener("dragstart",()=>draggedId=item.dataset.id));
    document.querySelectorAll(".period-items").forEach(zone=>{
      zone.addEventListener("dragover",event=>{event.preventDefault();zone.classList.add("drag-over")});
      zone.addEventListener("dragleave",()=>zone.classList.remove("drag-over"));
      zone.addEventListener("drop",()=>{zone.classList.remove("drag-over");const index=activeDay().items.findIndex(x=>x.id===draggedId);if(index>=0){const [item]=activeDay().items.splice(index,1);item.period=zone.dataset.period;activeDay().items.push(item);persist();renderDays()}});
    });
  }
  function openDialog(item={}){
    $("#dialog-title").textContent=item.id?"Edit itinerary item":"Add custom itinerary item";$("#item-id").value=item.id||"";
    $("#item-type").value=item.type||"Hotel";$("#item-period").value=item.period||"Morning";$("#item-name").value=item.name||"";
    $("#item-duration").value=item.duration||"";$("#item-price").value=item.price||0;$("#item-location").value=item.location||"";$("#item-notes").value=item.notes||"";
    $("#item-dialog").showModal();
  }
  function addAttraction(item){
    openDialog({type:"Attraction",period:"Morning",name:item.attraction_name,duration:item.ideal_timeframe_duration,price:0,location:item.exact_location_context,notes:item.bespoke_selling_point});
  }

  function renderLibrary(){
    const query=$("#search").value.trim().toLowerCase();
    const filtered=attractions.filter(item=>(activeCategory==="All"||item.thematic_category===activeCategory)&&(!query||`${item.attraction_name} ${item.exact_location_context}`.toLowerCase().includes(query)));
    $("#library-status").textContent=attractions.length?`${filtered.length} of ${attractions.length} attractions`:"Select a destination to browse attractions.";
    $("#library-cards").innerHTML=filtered.length?filtered.map((item,index)=>`<article class="library-card"><div class="row"><div><h3>${escapeHTML(item.attraction_name)}</h3><p>${escapeHTML(item.thematic_category)} · ${escapeHTML(item.ideal_timeframe_duration)}</p></div><button class="add" data-add="${index}" aria-label="Add ${escapeHTML(item.attraction_name)}">+</button></div><p class="location">${escapeHTML(item.exact_location_context)}</p></article>`).join(""):'<div class="library-empty"><span>✦</span><p>Select a destination or adjust your filters.</p></div>';
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
  function init(){
    $("#trip-name").value=state.meta.name;$("#client-name").value=state.meta.client;$("#start-date").value=state.meta.startDate;$("#guests").value=state.meta.guests;$("#currency").value=state.meta.currency;
    ["trip-name","client-name","start-date","guests","currency"].forEach(id=>$("#"+id).addEventListener("input",syncMeta));
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
  $("#item-form").addEventListener("submit",event=>{event.preventDefault();const id=$("#item-id").value||crypto.randomUUID();const item={id,type:$("#item-type").value,period:$("#item-period").value,name:$("#item-name").value.trim(),duration:$("#item-duration").value.trim(),price:Number($("#item-price").value)||0,location:$("#item-location").value.trim(),notes:$("#item-notes").value.trim()};const index=activeDay().items.findIndex(x=>x.id===id);if(index>=0)activeDay().items[index]=item;else activeDay().items.push(item);persist();$("#item-dialog").close();renderDays();toast(index>=0?"Item updated":"Item added")});
  $("#save").addEventListener("click",()=>{persist();toast("Working itinerary saved")});
  $("#print").addEventListener("click",()=>window.print());
  $("#export").addEventListener("click",()=>{syncMeta();const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`${state.meta.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")||"itinerary"}.json`;a.click();URL.revokeObjectURL(url)});
  init();
})();
