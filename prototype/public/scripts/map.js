// Create the map object
const map = L.map('battlemap', { zoomControl: false }).setView([49.611, 24.741], 5);
const themes = {
    light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'
}

const attribution = '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

// Stores areas and pins to avoid repetition.
const areas = [];
const markers = [];

// Custom pin image
const battleIcon = L.icon({
    iconUrl: '/prototype/public/images/battlepin.png',
    iconSize: [43,51],
    iconAnchor: [21,51]
});

// Some options for the map tiles
const tiles = L.tileLayer(themes.light, {
    attribution,
    maxZoom: 9,
    minZoom: 5,
    subdomains: ['a', 'b', 'c']
});

tiles.addTo(map);

// Grab our GeoJSON
fetch('/prototype/data/europe.json')
.then(res => res.json())
.then(data => {
    // Country outline styling
    const style = {
        color: '#892931',
        fillColor: 'red',
        fillOpacity: 0,
        opacity: .2,
        weight: 1
    }

    const countries = L.geoJSON(data, { style }).addTo(map);
    
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
})
.catch(console.error);


/**
 * Checks if a given marker or area is already plotted on the map.
 * @param {String} type Specifies whether to check the areas or markers array.
 * @param {*} obj The area or marker in question.
 */
function existsOnMap(type, obj){
    let arr;
    let existingObj;

    if(type === 'marker'){
        arr = markers;
    } else if(type === 'area'){
        arr = areas;
    }

    let exists = false;

    arr.forEach(item => {
        // Already found, so just skip item.
        if(exists){
            return;
        }

        const itemCoords = item.getLatLng();
        const newCoords = obj.getLatLng();

        if(itemCoords.lat === newCoords.lat && itemCoords.lng === newCoords.lng){
            exists = true;
            existingObj = item;
        }
    })

    return exists ? existingObj : false;
}


/**
 * Shows all the markers inside of a given area.
 * @param {String} marker
 */
function showIfInArea(marker){
    const {lat, lng} = marker.getLatLng();      // Coords of the marker
    let shown = false;

    for(const area of areas){
        const bounds = area.getBounds();        // Bounds of the area

        // If a marker is within the bounds, add it.
        if((bounds._southWest.lat < lat && lat < bounds._northEast.lat) &&
           (bounds._southWest.lng < lng && lng < bounds._northEast.lng))
        {
            marker.setOpacity(1);
            shown = true;
            break;
        }
    }

    return shown;
}


/**
 * Capitalises the first letter.
 * @param {String} place 
 */
function formatTitle(place){
    return place.charAt().toUpperCase() + place.slice(1);
}


/**
 * 
 * @param {*} coords 
 */
function plotPoint(lat, lng, name){
    // Styles for the marker. It is hidden and unclickable by default.
    const marker = L.marker([lat,lng], {
        icon: battleIcon,
        keyboard: false
    });
    
    // If marker is already on the map, in the same spot, exit.
    const existingMarker = existsOnMap('marker', marker);

    if(existingMarker)
        return existingMarker;
    
    // Add marker to map and add a popup.
    const title = formatTitle(name)

    marker.addTo(map);

    // Set a popup on the pin with options to open an article and to save the battle.
    marker.bindPopup(
    `<h3 class="popup-title">${title}</h3>
    <div class="button-holder small">
        <button class="button button--small" onclick="createArticlePreview('${formatTitle(name)}')">View article</button>
        <button class="button button--small" onclick="saveBattle('${formatTitle(name)}')">Save</button>
    </div>`, { offset: [0, -30] });

    // Add to list of markers.
    markers.push(marker);
    return marker;
}


/**
 * Plots a radius around given coords and gives it a popup upon clicking.
 * @param {String} name Name to put in the popup
 * @param {LatLng} coords 
 */
function plotRadius(lat, lng, name){
    // Creates a circle on the map.
    const circle = L.circle([lat, lng], {
        color: '#892931',
        fillColor: 'red',
        fillOpacity: .2,
        radius: 100000
    });

    // If area is already on the map, in the same spot, exit.
    if(existsOnMap('area', circle))
        return;

    circle.addTo(map);

    // Pan over to circle.
    map.setView([lat, lng], 7, {
        animate: true
    });

    // When area is clicked, show a popup with the area's name.
    circle.bindPopup(`Area around ${formatTitle(name)}`);

    // Add area into list of existing coords.
    areas.push(circle);
}

function toggleTheme(){

    $(document).ready(function(){ // Waits for dom to be loaded
        const button = $("#theme-button");

        if(button.hasClass('light')){
            tiles.setUrl(themes.dark);

            button.removeClass("light");
            button.addClass("dark");
        } else {
            tiles.setUrl(themes.light);

            button.removeClass("dark");
            button.addClass("light");
        }
    });
    
}