// 1. Rock catalogue: one source of truth for color + short label
const ROCKS = [
  { type: "Migmatite", label: "Migmatite", color: "#f27e9c" },
  { type: "Marble", label: "Marble", color: "#c36bd1" },
  {
    type: "Undifferentiated Schist and Gneiss",
    label: "Undifferentiated schist and gneiss",
    color: "#4b6b17",
  },
  {
    type: "Biotite, biotite hornblende gneiss",
    label: "Biotite hornblende gneiss",
    color: "#5ac2dc",
  },
  {
    type: "Biotite, Garnet gneiss and Schist",
    label: "Garnet gneiss and schist",
    color: "#b5a31c",
  },
  {
    type: "Silicified Sheared rocks and Quartz veins",
    label: "Quartz veins and sheared rocks",
    color: "#25d45c",
  },
  {
    type: "Not yet digitized",
    label: "Not yet digitized (no data)",
    color: "#8aa0a6",
  },
];
const GAP = "Not yet digitized";
const getRockColor = (t) =>
  (ROCKS.find((r) => r.type === t) || {}).color || "#3388ff";

const INSIGHTS = {
  Migmatite: {
    geo: "Extremely hard, ancient hybrid rock formed under deep crustal melting and pressure. Indicates strong structural basement stability.",
    public:
      "Premier source for crushed granite, road ballast, and concrete aggregate. Excellent solid foundation for high-rise buildings.",
    risk: "⚠️ High risk of dry boreholes if drilled shallow! Water is only stored inside deep rock fractures. Heavy explosives needed for trenching or basement digging.",
  },
  Marble: {
    geo: "Metamorphosed limestone formed from ancient seabed deposits altered under thermal regional metamorphism.",
    public:
      "High-value commercial mineral used for cement production, quicklime, terrazzo flooring, and treating acidic soils.",
    risk: "⚠️ Sinkhole & collapse risk! Water dissolves marble over time to form underground cavities. Never build heavy structures without subsurface geophysical tests.",
  },
  "Undifferentiated Schist and Gneiss": {
    geo: "Layered metamorphic rock showing distinct mineral alignment caused by intense earth compression.",
    public:
      "The weathered top soil layer (regolith) is the primary target for affordable domestic water boreholes and fertile farmland across Oyo East.",
    risk: "⚠️ Landslide and slope failure hazard on steep cuts! Unreinforced soil slopes can collapse. Soft upper layers can settle unevenly under heavy multi-story buildings.",
  },
  "Biotite, biotite hornblende gneiss": {
    geo: "Coarse, dark-colored metamorphic rock rich in iron and amphibole minerals formed under medium-grade heat and pressure.",
    public:
      "High-strength building stone for heavy road foundations and durable concrete. Fractured fault zones yield strong commercial water wells.",
    risk: "⚠️ High drilling cost! Requires heavy-duty rotary rigs. Deep well water may have a metallic iron taste requiring basic household aeration or filtering.",
  },
  "Biotite, Garnet gneiss and Schist": {
    geo: "High-grade metamorphic rock embedded with red garnet crystals; marks intense pressure shearing zones.",
    public:
      "Quarried for industrial abrasive garnet sand and durable heavy construction stone.",
    risk: "⚠️ Unpredictable groundwater! Hard rock sits near the surface—avoid hand-dug wells. Local mineral pockets can make unmanaged well water slightly salty or hard.",
  },
  "Silicified Sheared rocks and Quartz veins": {
    geo: "Ultra-hard silica ridges formed along ancient fault lines where hot mineral-rich fluids cooled underground.",
    public:
      "Primary exploration zone for gold and valuable minerals. Excellent source of pure quartz sand for glass manufacturing.",
    risk: "⚠️ Extreme drilling difficulty and fault risk! The glass-hard rock quickly ruins standard drill bits. Avoid building on high ridge crests due to steep slopes.",
  },
};

const map = L.map("map", { zoomControl: true }).setView([7.85, 3.93], 11);
map.createPane("labels");
map.getPane("labels").style.zIndex = 640;
map.getPane("labels").style.pointerEvents = "none";

const satellite = L.layerGroup([
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    },
  ),
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    {
      pane: "labels",
      attribution: "Labels &copy; Esri",
    },
  ),
]).addTo(map);

const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
});
const layersCtl = L.control
  .layers({ "Satellite + labels": satellite, OpenStreetMap: osm }, null, {
    position: "topright",
  })
  .addTo(map);

map.createPane("mask");
map.getPane("mask").style.zIndex = 645;
map.getPane("mask").style.pointerEvents = "none";
map.createPane("outline");
map.getPane("outline").style.zIndex = 646;
map.getPane("outline").style.pointerEvents = "none";
map.createPane("places");
map.getPane("places").style.zIndex = 647;

fetch("Oyo-East-Boundary.geojson")
  .then((r) => r.json())
  .then((b) => {
    const g = b.features[0].geometry;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
    const holes = polys.map((p) => L.GeoJSON.coordsToLatLngs(p[0], 0));
    L.polygon(
      [
        [
          [-85, -180],
          [-85, 180],
          [85, 180],
          [85, -180],
        ],
        ...holes,
      ],
      {
        pane: "mask",
        interactive: false,
        stroke: false,
        fillColor: "#0e1517",
        fillOpacity: 0.9,
        fillRule: "evenodd",
      },
    ).addTo(map);
    const bb = L.geoJSON(b).getBounds();
    map.setMaxBounds(bb.pad(0.2));
    map.setMinZoom(map.getBoundsZoom(bb.pad(0.2)));
    map.fitBounds(bb, { padding: [20, 20] });
  })
  .catch(() => {});

[
  [
    "boundary-osgof.geojson",
    "OSGOF 2017 boundary (357 km²)",
    { color: "#e6ab02", weight: 3, dashArray: "8 6" },
  ],
  [
    "boundary-osm.geojson",
    "OpenStreetMap boundary (143 km²)",
    { color: "#ffffff", weight: 2, dashArray: "2 6" },
  ],
].forEach(([file, name, st]) =>
  fetch(file)
    .then((r) => r.json())
    .then((b) => {
      const l = L.geoJSON(b, {
        pane: "outline",
        interactive: false,
        style: { ...st, fill: false },
      }).addTo(map);
      layersCtl.addOverlay(l, name);
    })
    .catch(() => {}),
);

let communities = [];
let commStatus = "loading";
const KIND_RANK = {
  local: 0,
  city: 1,
  town: 2,
  suburb: 3,
  village: 4,
  quarter: 5,
  neighbourhood: 5,
  hamlet: 6,
  locality: 7,
};

let geojsonData = null;
let geojsonLayer = null;
let selectedLayer = null;

const baseStyle = (f) =>
  f.properties["Rock Type"] === GAP
    ? {
        fillColor: "#8aa0a6",
        color: "#8aa0a6",
        weight: 1,
        dashArray: "4 4",
        fillOpacity: 0.15,
      }
    : {
        fillColor: getRockColor(f.properties["Rock Type"]),
        color: "#0e1517",
        weight: 1.5,
        fillOpacity: 0.55,
      };

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

function selectLayer(layer, place) {
  if (selectedLayer) geojsonLayer.resetStyle(selectedLayer);
  selectedLayer = layer;
  layer.setStyle({ fillOpacity: 0.85, weight: 3.5, color: "#ffffff" });
  layer.bringToFront();
  showDetails(layer.feature, layer, place);
}

function onEachFeature(feature, layer) {
  const rockType = feature.properties["Rock Type"] || "Unknown formation";
  layer.bindTooltip(`<strong>${esc(rockType)}</strong>`, {
    sticky: true,
    className: "rock-tip",
  });

  layer.on({
    mouseover: () =>
      layer !== selectedLayer &&
      layer.setStyle({ fillOpacity: 0.8, weight: 2.5 }),
    mouseout: () => layer !== selectedLayer && geojsonLayer.resetStyle(layer),
    click: () => selectLayer(layer),
  });
}

function showDetails(feature, layer, place) {
  const rockType = feature.properties["Rock Type"] || "Unknown formation";
  const code = feature.properties["Map Code"] || "N/A";
  const p = feature.properties;
  const km2 = turf.area(feature) / 1e6;

  const info = INSIGHTS[rockType] || {
    geo: p.Mineralogy || "Metamorphic basement complex formation.",
    public: p.Uses || "Construction stone and aggregate.",
    risk: "Conduct local geophysical tests before drilling or excavation.",
  };

  document.getElementById("info-panel").className = "";
  document.getElementById("info-panel").innerHTML = `
    <div class="info-card" style="--c:${getRockColor(rockType)}">
      <div class="rock-banner"><span class="rock-code">${esc(code)}</span></div>
      <h3>${esc(rockType)}</h3>
      ${place ? `<div class="data-row"><span class="data-label">Selected Location</span><span class="data-value">${esc(place)}</span></div>` : ""}
      <div class="data-row"><span class="data-label">Map code</span><span class="data-value">${esc(code)}</span></div>
      <div class="data-row"><span class="data-label">Formation area</span><span class="data-value">${km2.toFixed(2)} km&sup2;</span></div>
      <div class="data-row"><span class="data-label">Geological age</span><span class="data-value">${esc(p.Age || "Precambrian")}</span></div>
      
      <div class="data-row stack">
        <span class="data-label">🧠 Geological Significance</span>
        <span class="data-value insight-text">${esc(info.geo)}</span>
      </div>
      
      <div class="data-row stack">
        <span class="data-label">🏗️ Public & Practical Utility</span>
        <span class="data-value insight-text">${esc(info.public)}</span>
      </div>

      <div class="data-row stack">
        <span class="data-label">⚠️ Risks & What NOT To Do</span>
        <span class="data-value insight-text risk-text">${esc(info.risk)}</span>
      </div>

      <div class="data-row stack">
        <span class="data-label">Communities on this unit</span>
        <span class="chips">${
          commStatus === "ok"
            ? communities
                .filter((c) => c.f === feature)
                .map((c) => `<span>${esc(c.name)}</span>`)
                .join("") || "<em>None named</em>"
            : commStatus === "error"
              ? "<em>Data unavailable</em>"
              : "<em>Loading…</em>"
        }</span>
      </div>
    </div>`;
}

fetch("Oyo-East-Digitized.geojson")
  .then((r) => r.json())
  .then((data) => {
    geojsonData = data;
    const present = new Set(
      geojsonData.features.map((f) => f.properties["Rock Type"]),
    );
    ROCKS.splice(0, ROCKS.length, ...ROCKS.filter((r) => present.has(r.type)));
    buildFilters();
    renderMap(true);
    loadCommunities();
  })
  .catch((err) => {
    console.error("Error loading GeoJSON:", err);
    document.getElementById("info-panel").innerHTML =
      "<p>Could not load map data. Run from a local server.</p>";
  });

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

  const toggle = document.getElementById("toggle-all");
  toggle.addEventListener("click", () => {
    const boxes = box.querySelectorAll("input");
    const anyOn = Array.from(boxes).some((b) => b.checked);
    boxes.forEach((b) => (b.checked = !anyOn));
    toggle.textContent = anyOn ? "Show all" : "Hide all";
    renderMap(false);
  });
}

function renderMap(fit) {
  const active = Array.from(
    document.querySelectorAll("#filters input:checked"),
  ).map((b) => b.value);
  if (geojsonLayer) map.removeLayer(geojsonLayer);
  selectedLayer = null;

  geojsonLayer = L.geoJSON(geojsonData, {
    filter: (f) => active.includes(f.properties["Rock Type"]),
    style: baseStyle,
    onEachFeature,
  }).addTo(map);

  if (fit && geojsonLayer.getBounds().isValid())
    map.fitBounds(geojsonLayer.getBounds(), { padding: [20, 20] });

  const visible = geojsonData.features.filter(
    (f) =>
      active.includes(f.properties["Rock Type"]) &&
      f.properties["Rock Type"] !== GAP,
  );
  const areas = {};
  visible.forEach((f) => {
    const t = f.properties["Rock Type"];
    areas[t] = (areas[t] || 0) + turf.area(f) / 1e6;
  });
  const total = Object.values(areas).reduce((a, b) => a + b, 0);
  document.getElementById("stat-shown").textContent =
    `${visible.length}/${geojsonData.features.filter((f) => f.properties["Rock Type"] !== GAP).length}`;
  document.getElementById("stat-types").textContent = new Set(
    visible.map((f) => f.properties["Rock Type"]),
  ).size;
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
    .map((r) => {
      const pct = total > 0 ? ((areas[r.type] / total) * 100).toFixed(0) : 0;
      return `<div class="legend-row" style="--c:${r.color}">
        <span class="legend-label"><i></i>${esc(r.label)}</span>
        <div class="legend-bar-track"><div class="legend-bar-fill" style="width:${pct}%;background:${r.color}"></div></div>
        <b class="legend-pct">${pct}%</b>
      </div>`;
    })
    .join("");
}

let placeMarker = null;
const searchInput = document.getElementById("search");
const resultsBox = document.getElementById("search-results");

function layerFor(feature) {
  let found = null;
  geojsonLayer.eachLayer((l) => {
    if (l.feature === feature) found = l;
  });
  return found;
}

function focusFormation(feature, place) {
  const t = feature.properties["Rock Type"];
  const box = document.querySelector(
    `#filters input[value="${t.replace(/"/g, '\\"')}"]`,
  );
  if (box && !box.checked) {
    box.checked = true;
    renderMap(false);
  }
  const layer = layerFor(feature);
  if (!layer) return;
  if (!place) map.flyToBounds(layer.getBounds(), { padding: [40, 40] });
  selectLayer(layer, place);
}

function goToPlace(p) {
  const lat = parseFloat(p.lat),
    lon = parseFloat(p.lon);
  const name = p.name || p.display_name.split(",")[0];
  if (placeMarker) map.removeLayer(placeMarker);
  placeMarker = L.circleMarker([lat, lon], {
    radius: 8,
    color: "#fff",
    weight: 3,
    fillColor: "#e6ab02",
    fillOpacity: 1,
  })
    .addTo(map)
    .bindTooltip(esc(name), {
      permanent: true,
      direction: "top",
      offset: [0, -8],
      className: "rock-tip",
    });
  map.flyTo([lat, lon], 14);

  const pt = turf.point([lon, lat]);
  const hit = geojsonData.features.find((f) =>
    turf.booleanPointInPolygon(pt, f),
  );
  if (hit) {
    focusFormation(hit, name);
  } else {
    document.getElementById("info-panel").className = "";
    document.getElementById("info-panel").innerHTML =
      `<p><strong>${esc(name)}</strong> is on the map, but outside the digitized formations.</p>`;
  }
}

// UPGRADED MULTI-INDEX SEARCH ENGINE
async function runSearch() {
  const q = searchInput.value.trim();
  if (!q) {
    resultsBox.hidden = true;
    return;
  }
  const ql = q.toLowerCase();

  // 1. Search Formations by Map Code or Rock Type
  const codeOrTypeMatches = geojsonData.features.filter((f) =>
    `${f.properties["Map Code"] || ""} ${f.properties["Rock Type"] || ""}`
      .toLowerCase()
      .includes(ql),
  );

  // 2. Search Formations by Practical Keywords (e.g. "borehole", "cement", "gold", "granite")
  const keywordMatches = geojsonData.features.filter((f) => {
    const t = f.properties["Rock Type"] || "";
    const info = INSIGHTS[t] || {};
    const fullText =
      `${info.geo || ""} ${info.public || ""} ${info.risk || ""}`.toLowerCase();
    return fullText.includes(ql) && !codeOrTypeMatches.includes(f);
  });

  // 3. Search Loaded Local Communities (Instant Offline Match!)
  const localCommMatches = communities.filter((c) =>
    c.name.toLowerCase().includes(ql),
  );

  resultsBox.hidden = false;
  const li = [];

  // Render Local Communities
  if (localCommMatches.length) {
    li.push('<li class="sr-group">🏘️ Local Communities & Quarters</li>');
    localCommMatches.forEach((c) => {
      li.push(
        `<li><button class="sr-item" data-kind="community" data-name="${esc(c.name)}" data-lat="${c.lat}" data-lon="${c.lon}">${esc(c.name)} <small>Oyo East LGA</small></button></li>`,
      );
    });
  }

  // Render Formation Code/Type Matches
  if (codeOrTypeMatches.length) {
    li.push('<li class="sr-group">🗺️ Geological Formations</li>');
    codeOrTypeMatches.forEach((f) => {
      const idx = geojsonData.features.indexOf(f);
      li.push(
        `<li><button class="sr-item" data-kind="formation" data-i="${idx}"><strong>${esc(f.properties["Map Code"] || "N/A")}</strong>: ${esc(f.properties["Rock Type"])}</button></li>`,
      );
    });
  }

  // Render Utility/Resource Keyword Matches
  if (keywordMatches.length) {
    li.push('<li class="sr-group">🛠️ Matching Practical Resources</li>');
    keywordMatches.forEach((f) => {
      const idx = geojsonData.features.indexOf(f);
      li.push(
        `<li><button class="sr-item" data-kind="formation" data-i="${idx}">${esc(f.properties["Rock Type"])} <small>Matches keyword "${esc(q)}"</small></button></li>`,
      );
    });
  }

  // Render Search UI or fetch Nominatim fallback
  if (!li.length) {
    resultsBox.innerHTML =
      '<li class="sr-empty">Searching external map sources…</li>';
    let places = [];
    try {
      const b = L.geoJSON(geojsonData).getBounds().pad(0.15);
      const url =
        "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=ng&bounded=1" +
        `&viewbox=${b.getWest()},${b.getNorth()},${b.getEast()},${b.getSouth()}&q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (res.ok) places = await res.json();
    } catch (e) {}

    if (places.length) {
      li.push('<li class="sr-group">🌐 External Map Places</li>');
      places.forEach((p) =>
        li.push(
          `<li><button class="sr-item" data-kind="place" data-lat="${p.lat}" data-lon="${p.lon}" data-name="${esc(p.name || p.display_name.split(",")[0])}">${esc(p.name || p.display_name.split(",")[0])}<small>${esc(p.display_name)}</small></button></li>`,
        ),
      );
      resultsBox.innerHTML = li.join("");
    } else {
      resultsBox.innerHTML =
        '<li class="sr-empty">No matching places, rocks, or resources found.</li>';
    }
  } else {
    resultsBox.innerHTML = li.join("");
  }

  resultsBox.onclick = (e) => {
    const btn = e.target.closest(".sr-item");
    if (!btn) return;
    const kind = btn.dataset.kind;

    if (kind === "community" || kind === "place") {
      goToPlace({
        lat: btn.dataset.lat,
        lon: btn.dataset.lon,
        name: btn.dataset.name,
      });
    } else if (kind === "formation") {
      const f = geojsonData.features[+btn.dataset.i];
      focusFormation(f);
    }
    resultsBox.hidden = true;
  };
}

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch();
  if (e.key === "Escape") resultsBox.hidden = true;
});
searchInput.addEventListener("input", () => {
  if (!searchInput.value) resultsBox.hidden = true;
  else runSearch();
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrap")) resultsBox.hidden = true;
});

async function loadCommunities() {
  const b = L.geoJSON(geojsonData).getBounds();
  const key = "oyo-east-places-final-v2";
  let els = null;
  try {
    els = JSON.parse(localStorage.getItem(key));
  } catch (e) {}
  try {
    if (!els) {
      const q = `[out:json][timeout:25];nwr["place"~"^(city|town|village|suburb|hamlet|neighbourhood|quarter|locality)$"]["name"](${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()});out center;`;
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: new URLSearchParams({ data: q }),
      });
      if (!res.ok) throw new Error(res.status);
      els = (await res.json()).elements;
      try {
        localStorage.setItem(key, JSON.stringify(els));
      } catch (e) {}
    }
    const seen = new Set();
    const local = await fetch("communities-local.json")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);
    communities = [
      ...local.map((c) => ({
        name: c.name,
        kind: "local",
        lat: +c.lat,
        lon: +c.lon,
      })),
      ...els.map((e) => ({
        name: e.tags.name,
        kind: e.tags.place,
        lat: e.lat ?? e.center?.lat,
        lon: e.lon ?? e.center?.lon,
      })),
    ]
      .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lon))
      .filter(
        (c) =>
          !seen.has(c.name.toLowerCase()) && seen.add(c.name.toLowerCase()),
      )
      .map((c) => ({
        ...c,
        f: geojsonData.features.find((f) =>
          turf.booleanPointInPolygon(turf.point([c.lon, c.lat]), f),
        ),
      }))
      .filter((c) => c.f)
      .sort(
        (a, b) =>
          (KIND_RANK[a.kind] ?? 9) - (KIND_RANK[b.kind] ?? 9) ||
          a.name.localeCompare(b.name),
      );
    commStatus = "ok";
    communities.forEach((c) =>
      L.circleMarker([c.lat, c.lon], {
        pane: "places",
        radius: 4,
        color: "#0e1517",
        weight: 1.5,
        fillColor: "#fff",
        fillOpacity: 1,
      })
        .bindTooltip(`<strong>${esc(c.name)}</strong>`, {
          className: "rock-tip",
        })
        .on("click", () => focusFormation(c.f, c.name))
        .addTo(map),
    );
  } catch (e) {
    console.error("Communities failed:", e);
    commStatus = "error";
  }
}
