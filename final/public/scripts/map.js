function openTab(){
    // Find the active button and tab and remove their active class
    $('.tab-button.active').removeClass('active')
    $('.tab.active').removeClass('active')
    
    // Then set the button and its target as active.
    $(this).addClass('active')
    const index = this.dataset.target
    $(`.tab:nth-child(${index})`).addClass('active')
}

function clearMap(){
    // map comes from leaflet.js (global variable)
    map.eachLayer(layer => {
        // L is the leaflet object
        if(layer instanceof L.Marker || layer instanceof L.Circle){
            map.removeLayer(layer)
        }
    })
}

function showOnMap(marker){
    map.setView(marker.getLatLng(), 7, {
        animate: true
    });
}

async function searchPlace(e){
    e.preventDefault()

    $('#form-output').html('Searching...')

    const form = this
    const data = {
        // this = the form
        place: form.place.value,
        radius: form.radius.value
    }

    const res = await post('/map/search-place', data)

    if(res.status === 'good'){
        const { place, battles } = res;

        // Before anything, clear the map if ticked.
        if(form.does_clear.checked){
            clearMap()
        }
        
        // Check if the radius has already been plotted.
        if(radiusExists(place.lat, place.lng, data.radius)){
            return;
        }

        plotRadius(
            place.lat,
            place.lng,
            // Re-use the form inputs
            data.place,
            data.radius
        );

        // Plot each battle
        battles.forEach(battle => {
            plotMarker(battle);
        })
        $('#form-output').html('')
    } else {
        $('#form-output').html("Not a valid place name. Make sure it's in Europe and it's spelled correctly.")
    }
}

async function searchBattle(e){
    e.preventDefault()
    $('#battle-search-results').html('Searching...')

    const data = { battle: this.battle.value }
    const res = await post('/map/search-battle', data)

    if(res.status === 'good'){
        // Clear the previous message
        $('#battle-search-results').html('')

        // Populate the search results
        res.results.forEach(battle => {
            const row = $('<div></div>')
            row.addClass('battle-search-result')
            row.attr('title', 'Show on map')
            row.html(battle.name)
            row.click(function(){
                // Create marker
                const marker = plotMarker(battle)

                // Then pan to it
                showOnMap(marker)
            })

            $('#battle-search-results').append(row)
        })
    } else {
        $('#battle-search-results').html(res.reason)
    }
}

function changeTheme(){
    if(localStorage.getItem('type') === 'dark'){
        map.__tiles.setUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
        localStorage.setItem('type', 'light')
        localStorage.setItem('url', 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    } else {
        map.__tiles.setUrl('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png')
        localStorage.setItem('type', 'dark')
        localStorage.setItem('url', 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png')
    }
}

async function addToFavourites(elem, name, article){
    try {
        const result = await post('/profile/save-battle', { name, article })
        $(elem).parent().append('<div id="popup-response"></div>')

        if(result.status === 'good'){
            $('#popup-response').html('saved')
        } else {
            $('#popup-response').html(result.reason)
        }
        
        $(elem).attr('disabled', 'disabled')
    } catch(error){
        console.log(error)
    }
}

$(document).ready(function(){
    // Initialise tooltips
    $(document).tooltip();

    // Handle form submits
    $('#battle-form').submit(searchBattle)
    $('#place-form').submit(searchPlace)

    // Add click handlers for the tab buttons.
    $('.tab-button').click(openTab)
    
    // Add night mode/light mode button handler
    $("#theme-changer").click(changeTheme)
});