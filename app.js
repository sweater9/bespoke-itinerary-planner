(() => {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const region = $("#region"), destination = $("#destination"), search = $("#search");
  const categories = $("#categories"), cards = $("#cards"), status = $("#status"), reset = $("#reset");
  let database = null, attractions = [], activeCategory = "All";

  const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  })[character]);

  function flatten(destinationRecord) {
    return Object.values(destinationRecord.categories || {}).flat();
  }

  function render() {
    const query = search.value.trim().toLowerCase();
    const filtered = attractions.filter(item => {
      const categoryMatch = activeCategory === "All" || item.thematic_category === activeCategory;
      const haystack = `${item.attraction_name} ${item.exact_location_context} ${item.bespoke_selling_point}`.toLowerCase();
      return categoryMatch && (!query || haystack.includes(query));
    });
    status.textContent = attractions.length ? `${filtered.length} of ${attractions.length} attractions shown` : "Choose a region and destination to begin.";
    cards.innerHTML = filtered.length ? filtered.map(item => `
      <article class="card">
        <div class="meta"><span>${escapeHTML(item.thematic_category)}</span><span>${escapeHTML(item.ideal_timeframe_duration)}</span></div>
        <h2>${escapeHTML(item.attraction_name)}</h2>
        <p class="location">${escapeHTML(item.exact_location_context)}</p>
        <p class="selling">${escapeHTML(item.bespoke_selling_point)}</p>
        <details><summary>View image-generation prompt</summary><p class="prompt">${escapeHTML(item.image_prompt)}</p></details>
      </article>`).join("") : '<div class="empty"><h2>No matching attractions</h2><p>Change the category or search phrase.</p></div>';
  }

  function renderCategories() {
    const list = ["All", ...new Set(attractions.map(item => item.thematic_category))];
    categories.innerHTML = list.map(name => `<button type="button" class="category${name === "All" ? " active" : ""}" data-category="${escapeHTML(name)}" aria-pressed="${name === "All"}">${escapeHTML(name)}</button>`).join("");
  }

  async function loadRegions() {
    const response = await fetch("data/regions.json");
    if (!response.ok) throw new Error("Region index could not be loaded.");
    const regions = await response.json();
    region.innerHTML += regions.map(item => `<option value="${escapeHTML(item.file)}">${escapeHTML(item.region)}</option>`).join("");
  }

  region.addEventListener("change", async () => {
    destination.disabled = true; search.disabled = true; attractions = []; activeCategory = "All";
    destination.innerHTML = '<option value="">Select a destination</option>'; categories.innerHTML = ""; render();
    if (!region.value) return;
    try {
      const response = await fetch(`data/destinations/${encodeURIComponent(region.value)}`);
      if (!response.ok) throw new Error("Destination file could not be loaded.");
      database = await response.json();
      destination.innerHTML += database.destinations.map((item,index) => `<option value="${index}">${escapeHTML(item.destination)}</option>`).join("");
      destination.disabled = false;
    } catch (error) { console.error(error); status.textContent = error.message; }
  });

  destination.addEventListener("change", () => {
    search.value = ""; activeCategory = "All";
    attractions = destination.value === "" ? [] : flatten(database.destinations[Number(destination.value)]);
    search.disabled = !attractions.length; renderCategories(); render();
  });
  categories.addEventListener("click", event => {
    const button = event.target.closest("[data-category]"); if (!button) return;
    activeCategory = button.dataset.category;
    categories.querySelectorAll(".category").forEach(item => {
      const selected = item === button; item.classList.toggle("active", selected); item.setAttribute("aria-pressed", String(selected));
    });
    render();
  });
  search.addEventListener("input", render);
  reset.addEventListener("click", () => {
    region.value = ""; destination.innerHTML = '<option value="">Select a destination</option>';
    destination.disabled = true; search.value = ""; search.disabled = true;
    database = null; attractions = []; activeCategory = "All"; categories.innerHTML = ""; render();
  });

  loadRegions().catch(error => { console.error(error); status.textContent = error.message; });
})();
