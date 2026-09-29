// 1. Initialize the map focus
const map = L.map('map').setView([7.85, 3.93], 11);

// 2. Add base map tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// 3. Official NGSA Color Mapping Function
function getRockColor(rockType) {
    switch (rockType) {
        case 'Migmatite': 
            return '#d95f02'; // Orange
        case 'Marble': 
            return '#7570b3'; // Purple
        case 'Undifferentiated Schist and Gneiss': 
            return '#66a61e'; // Olive Green
        case 'Biotite, biotite hornblende gneiss': 
            return '#e6ab02'; // Gold/Yellow
        case 'Biotite, Garnet gneiss and Schist': 
            return '#e7298a'; // Pink
        case 'Silicified Sheared rocks and Quartz veins': 
            return '#1b9e77'; // Teal/Green
        default: 
            return '#3388ff'; // Fallback Blue
    }
}

// 4. Click Interactivity Function (Popups)
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

// 5. Fetch spatial data, render polygons, bind popups
fetch('Oyo-East-Digitized.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: function(feature) {
                return {
                    fillColor: getRockColor(feature.properties["Rock Type"]),
                    weight: 2,
                    color: 'white',
                    fillOpacity: 0.7
                };
            },
            onEachFeature: onEachFeature
        }).addTo(map);

        // Render the map legend
        createLegend();
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

// 6. Dynamic Legend Generator Function
function createLegend() {
    const legendContainer = document.getElementById('legend');
    const rockFormations = [
        { name: 'Migmatite', color: '#d95f02' },
        { name: 'Marble', color: '#7570b3' },
        { name: 'Undifferentiated Schist and Gneiss', color: '#66a61e' },
        { name: 'Biotite, biotite hornblende gneiss', color: '#e6ab02' },
        { name: 'Biotite, Garnet gneiss and Schist', color: '#e7298a' },
        { name: 'Silicified Sheared rocks and Quartz veins', color: '#1b9e77' }
    ];

    let html = '<h4>Geological Legend</h4>';
    rockFormations.forEach(rock => {
        html += `
            <div class="legend-item">
                <span class="legend-color" style="background-color: ${rock.color};"></span>
                <span>${rock.name}</span>
            </div>
        `;
    });

    legendContainer.innerHTML = html;
}