// 1. Initialize the map focus
const map = L.map('map').setView([7.85, 3.93], 11);

// 2. Add Esri Satellite Base Map
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
}).addTo(map);

// 3. Official NGSA Color Mapping Function
function getRockColor(rockType) {
    switch (rockType) {
        case 'Migmatite': 
            return '#d95f02'; 
        case 'Marble': 
            return '#7570b3'; 
        case 'Undifferentiated Schist and Gneiss': 
            return '#66a61e'; 
        case 'Biotite, biotite hornblende gneiss': 
            return '#e6ab02'; 
        case 'Biotite, Garnet gneiss and Schist': 
            return '#e7298a'; 
        case 'Silicified Sheared rocks and Quartz veins': 
            return '#1b9e77'; 
        default: 
            return '#3388ff'; 
    }
}

// 4. Click Interactivity Function (Temporary Popup)
function onEachFeature(feature, layer) {
    if (feature.properties) {
        const rockType = feature.properties["Rock Type"] || "Unknown Formation";
        const mapCode = feature.properties["Map Code"] || "N/A";
        
        const popupContent = `
            <div style="font-family: sans-serif; padding: 2px;">
                <h3 style="margin: 0 0 6px 0; color: #2c3e50; font-size: 14px;">${rockType}</h3>
                <p style="margin: 0; color: #666; font-size: 12px;"><strong>Map Code:</strong> <span style="color: #27ae60;">${mapCode}</span></p>
            </div>
        `;
        layer.bindPopup(popupContent);
    }
}

// 5. Fetch spatial data and render polygons
fetch('Oyo-East-Digitized.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: function(feature) {
                return {
                    fillColor: getRockColor(feature.properties["Rock Type"]),
                    weight: 2, // Border thickness
                    color: '#ffffff', // White borders look striking on satellite
                    fillOpacity: 0.6 // Slightly transparent to see the terrain underneath
                };
            },
            onEachFeature: onEachFeature
        }).addTo(map);
    })
    .catch(error => console.error('Error loading GeoJSON:', error));