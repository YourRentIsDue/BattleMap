
// Manipulate DOM when it's fully parsed.
$(document).ready(function(){

    // Add submit event listener to form.
    $('#search-box').submit(function(e){
        e.preventDefault();

        $('#search-output').html('');                   // Clear search results.

        for(const marker of markers){                   // Hide all existing markers.
            marker.setOpacity(0);
        }

        const form = new FormData(this);                // Stores the form fields in a FormData object (specifically made for getting values from forms).
        const place = form.get('place');                // Gets the search query from search bar.
        const hascountry = form.get('hascountry');      // Searches whole country for battles, too.
        const date = parseInt(form.get('year'));
        const earlier = form.get('earlier');
        
        wikiSearch(place, hascountry, date, earlier)    // Use wikiSearch function to search wikipedia with the given filters.
        .catch(error => {                               // Returns a promise, so use .catch() to handle errors.
            $('#search-output').text(error);            // Output any errors to the menu.
        });
    });
});