// 1. Rock catalogue: one source of truth for color + short label
const ROCKS = [
  { type: "Migmatite", label: "Migmatite", color: "#d95f02" },
  { type: "Marble", label: "Marble", color: "#7570b3" },
  {
    type: "Undifferentiated Schist and Gneiss",
    label: "Undifferentiated schist and gneiss",
    color: "#66a61e",
  },
  {
    type: "Biotite, biotite hornblende gneiss",
    label: "Biotite hornblende gneiss",
    color: "#e6ab02",
  },
  {
    type: "Biotite, Garnet gneiss and Schist",
    label: "Garnet gneiss and schist",
    color: "#e7298a",
  },
  {
    type: "Silicified Sheared rocks and Quartz veins",
    label: "Quartz veins and sheared rocks",
    color: "#1b9e77",
  },
];
const getRockColor = (t) =>
  (ROCKS.find((r) => r.type === t) || {}).color || "#3388ff";

// 2. Map + basemap
const map = L.map("map", { zoomControl: true }).setView([7.85, 3.93], 11);
L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  },
).addTo(map);

let geojsonData = null;
let geojsonLayer = null;
let selectedLayer = null;

const baseStyle = (f) => ({
  fillColor: getRockColor(f.properties["Rock Type"]),
  color: "#0e1517",
  weight: 1.5,
  fillOpacity: 0.55,
});

// 3. Escape text before putting it in innerHTML
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

// 4. Interactivity
function onEachFeature(feature, layer) {
  const rockType = feature.properties["Rock Type"] || "Unknown formation";
  layer.bindTooltip(esc(rockType), { sticky: true, className: "rock-tip" });

  layer.on({
    mouseover: () =>
      layer !== selectedLayer &&
      layer.setStyle({ fillOpacity: 0.8, weight: 2.5 }),
    mouseout: () => layer !== selectedLayer && geojsonLayer.resetStyle(layer),
    click: () => {
      if (selectedLayer) geojsonLayer.resetStyle(selectedLayer);
      selectedLayer = layer;
      layer.setStyle({ fillOpacity: 0.85, weight: 3.5, color: "#ffffff" });
      layer.bringToFront();
      showDetails(feature, layer);
    },
  });
}

function showDetails(feature, layer) {
  const rockType = feature.properties["Rock Type"] || "Unknown formation";
  const code = feature.properties["Map Code"] || "N/A";
  const p = feature.properties;
  const km2 = turf.area(feature) / 1e6;
  const c = layer.getBounds().getCenter();

  document.getElementById("info-panel").className = "";
  document.getElementById("info-panel").innerHTML = `
    <div class="info-card" style="--c:${getRockColor(rockType)}">
      <div class="rock-banner"><span class="rock-code">${esc(code)}</span></div>
      <h3>${esc(rockType)}</h3>
      <div class="data-row"><span class="data-label">Map code</span><span class="data-value">${esc(code)}</span></div>
      <div class="data-row"><span class="data-label">Area</span><span class="data-value">${km2.toFixed(2)} km&sup2;</span></div>
      <div class="data-row"><span class="data-label">Age</span><span class="data-value">${esc(p.Age || "No data")}</span></div>
      <div class="data-row"><span class="data-label">Mineralogy</span><span class="data-value">${esc(p.Mineralogy || "No data")}</span></div>
      <div class="data-row"><span class="data-label">Uses</span><span class="data-value">${esc(p.Uses || "No data")}</span></div>
      <div class="data-row"><span class="data-label">Centre point</span><span class="data-value">${c.lat.toFixed(3)}, ${c.lng.toFixed(3)}</span></div>
    </div>`;
}

// 5. Load data once
fetch("Oyo-East-Digitized.geojson")
  .then((r) => r.json())
  .then((data) => {
    geojsonData = data;
    buildFilters();
    renderMap(true);
  })
  .catch((err) => {
    console.error("Error loading GeoJSON:", err);
    document.getElementById("info-panel").innerHTML =
      "<p>Could not load the map data. Run the project from a local server (not by double-clicking index.html) and check the GeoJSON file name.</p>";
  });

// 6. Build filter list from the catalogue, with live counts
function buildFilters() {
  const box = document.getElementById("filters");
  box.innerHTML = ROCKS.map((r) => {
    const n = geojsonData.features.filter(
      (f) => f.properties["Rock Type"] === r.type,
    ).length;
    return `<label class="filter-label" style="--c:${r.color}">
      <input type="checkbox" value="${esc(r.type)}" checked>
      <span>${esc(r.label)}</span><span class="filter-count">${n}</span>
    </label>`;
  }).join("");

  box.addEventListener("change", () => renderMap(false));
  document
    .getElementById("search")
    .addEventListener("input", () => renderMap(false, true));

  const toggle = document.getElementById("toggle-all");
  toggle.addEventListener("click", () => {
    const boxes = box.querySelectorAll("input");
    const anyOn = Array.from(boxes).some((b) => b.checked);
    boxes.forEach((b) => (b.checked = !anyOn));
    toggle.textContent = anyOn ? "Show all" : "Hide all";
    renderMap(false);
  });
}

// 7. Draw based on checked filters
function matchesSearch(f) {
  const q = document.getElementById("search").value.trim().toLowerCase();
  if (!q) return true;
  const p = f.properties;
  return `${p["Map Code"] || ""} ${p["Rock Type"] || ""}`
    .toLowerCase()
    .includes(q);
}

function renderMap(fit, fromSearch) {
  const active = Array.from(
    document.querySelectorAll("#filters input:checked"),
  ).map((b) => b.value);
  if (geojsonLayer) map.removeLayer(geojsonLayer);
  selectedLayer = null;

  geojsonLayer = L.geoJSON(geojsonData, {
    filter: (f) =>
      active.includes(f.properties["Rock Type"]) && matchesSearch(f),
    style: baseStyle,
    onEachFeature,
  }).addTo(map);

  if ((fit || fromSearch) && geojsonLayer.getBounds().isValid())
    map.fitBounds(geojsonLayer.getBounds(), { padding: [20, 20] });

  // Live stats: count, total area, area share per rock type (Turf.js)
  const visible = geojsonData.features.filter(
    (f) => active.includes(f.properties["Rock Type"]) && matchesSearch(f),
  );
  const areas = {};
  visible.forEach((f) => {
    const t = f.properties["Rock Type"];
    areas[t] = (areas[t] || 0) + turf.area(f) / 1e6;
  });
  const total = Object.values(areas).reduce((a, b) => a + b, 0);
  document.getElementById("stat-shown").textContent =
    `${visible.length}/${geojsonData.features.length}`;
  document.getElementById("stat-area").textContent = total.toFixed(1);

  const rows = ROCKS.filter((r) => areas[r.type]).sort(
    (a, b) => areas[b.type] - areas[a.type],
  );
  document.getElementById("area-bar").innerHTML = rows
    .map(
      (r) =>
        `<span style="flex-grow:${areas[r.type]};background:${r.color}" title="${esc(r.label)}: ${areas[r.type].toFixed(1)} km&sup2;"></span>`,
    )
    .join("");
  document.getElementById("area-legend").innerHTML = rows
    .map(
      (r) =>
        `<span style="--c:${r.color}"><i></i>${esc(r.label)} <b>${((areas[r.type] / total) * 100).toFixed(0)}%</b></span>`,
    )
    .join("");
}
