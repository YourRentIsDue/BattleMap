// Create the global map object
const map = L.map('map', { zoomControl: false }).setView([49.611, 24.741], 5);

function initialiseTiles(){
    const theme = localStorage.getItem('url') || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

    // Some options for the map tiles
    const tiles = L.tileLayer(theme, {
        attribution: `&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>,
                    &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>
                    &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors`,
        maxZoom: 9,
        minZoom: 5,
        subdomains: ['a', 'b', 'c']
    });

    tiles.addTo(map);
    map.__tiles = tiles
}

// Checks if the marker has already been plotted.
function markerExists(lat, lng){
    const input = L.latLng(lat,lng)
    const layers = Object.values(map._layers)

    return layers.some(layer => {
        if(layer instanceof L.Marker){
            if(layer.getLatLng().equals(input)){
                return true;
            }
        }
        return false;
    })
}

// Checks if the exact radius exists
function radiusExists(lat, lng, radius){
    const input = L.latLng(lat,lng)
    const layers = Object.values(map._layers)
    
    return layers.some(layer => {
        if(layer instanceof L.Circle){
            if(layer.getRadius() === radius && layer.getLatLng().equals(input)){
                return true;
            }
        }
        return false;
    })
}

// Plots a market
function plotMarker(battle){
    const { lat, lng } = battle.coords

    if(markerExists(lat, lng)){
        return;
    }

    const battleIcon = L.icon({
        iconUrl: 'images/battlepin.png',
        iconSize: [43,51],
        iconAnchor: [21,51]
    });

    // Styles for the marker. It is hidden and unclickable by default.
    const marker = L.marker([lat,lng], {
        icon: battleIcon,
        keyboard: false
    });
    marker.setOpacity(1);
    marker.__name = battle.name

    // Add marker to map and add a popup.
    marker.addTo(map);

    // Set a popup on the pin with options to open an article and to save the battle.
    marker.bindPopup(
    `<h3 class="popup-title">${battle.name}</h3>
    <div class="popup-row">involving <b>${battle.country}</b></div>
    <div class="popup-row">part of <b>${battle.war || 'n/a'}</b></div>
    <div class="button-holder split">
        <button class="button" onclick="openArticlePreview('${battle.article}')">View article</button>
        <button class="button" onclick="addToFavourites(this, '${battle.name}', '${battle.article}')">Save</button>
    </div>`, { offset: [0, -30] });
    
    return marker;
}

// Plots a radius on the map
function plotRadius(lat, lng, name, radius){
    // Creates a circle on the map.
    const circle = L.circle([lat, lng], {
        color: '#892931',
        fillColor: 'red',
        fillOpacity: .2,
        radius: radius
    });

    circle.addTo(map);

    // Pan over to circle.
    map.setView([lat, lng], 7, {
        animate: true
    });

    // When area is clicked, show a popup with the area's name.
    circle.bindPopup(`Area around ${name}`);
}

// Wait for DOM to be loaded
$(document).ready(async function(){
    initialiseTiles();

    // Grab our GeoJSON
    const response = await fetch('/json/europe.json')
    const geoJSON = await response.json()

    // Country outline styling
    const style = {
        color: '#892931',
        fillColor: 'red',
        fillOpacity: 0,
        opacity: .2,
        weight: 1
    }

    const countries = L.geoJSON(geoJSON, { style }).addTo(map);
    
    // Apply hover styles
    countries.on('mouseover', (e) => {
        $('#country-name').html(e.layer.feature.properties.NAME);

        e.layer.setStyle({
            fillOpacity: .1,
            opacity: 1,
            weight: 3
        });
    });

    // Return to original styling
    countries.on('mouseout', (e) => {
        e.layer.setStyle(style);
    });
});