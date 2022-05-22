// To-do: make exception function for searching Irish battles (apparently there are 12 million fkn (VERY UNPROFESSIONAL DAVID tsk, tsk.) battles) 

// Stores the indices of the sections on the battles list.
// Aids in searching wikipedia
const countryIDs = {
    'austria': 5,
    'azerbaijan': 6,
    'belarus': 11,
    'belgium': 12,
    'bosnia and herzegovina': 13,
    'bulgaria': 15,
    'croatia': 23,
    'czech republic': 24,
    'denmark': 25,
    'england': 28,
    'estonia': 29,
    'finland': 31,
    'france': 32,
    'germany': 33,
    'georgia': 34,
    'greece': 35,
    'hungary': 36,
    'ireland': 40,
    'italy': 42,
    'latvia': 46,
    'lithuania': 48,
    'malta': 50,
    'netherlands': 57,
    'norway': 60,
    'poland': 66,
    'portugal': 67,
    'romania': 68,
    'russia': 69,
    'scotland': 71,
    'serbia': 72,
    'slovenia': 73,
    'spain': 75,
    'sweden': 76,
    'switzerland': 77,
    'turkey': 79,
    'ukraine': 80,
    'united kingdom': 81,
    'wales': 85
}
// Specialised error messages.
class SearchError extends Error
{
    constructor(message)
    {
        super(message);
        this.name = 'Search';
    }
}


/**
 * Communicates with the OpenCage API for coordinates and the country for a given place name.
 * @param {String} term Term to get coords for.
 */
async function opencageAPI(place){
    const opencage = "08461c88d44c4be6b23ddcdf36c650b8";
    const bounds = "-10.72266,34.19817,50.66895,71.21608";

    // Ask OpenCage for coordinates for a given place.
    const result = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${place}&key=${opencage}&bounds=${bounds}&limit=1`)
    .then(res => res.json()); // Parses result to JSON.
    
    // Get the first result.
    const output = result.results.pop();

    // If no results, exit.
    if(!output)
        throw new SearchError('Not a valid place.')

    const {lat,lng} = output.geometry;
    let country = output.components.country;

    // Special case for Ireland because Wikipedia has a separate page for Irish battles (evidently there are... a lot).
    // Also, Northern Ireland does not have its own section.
    if(output.components.state === 'Northern Ireland'){
        country = 'Ireland';
    }

    // OpenCage doesn't give Scotland, England and Wales as countries.
    else if(country === 'United Kingdom'){
        country = output.components.state;                          // They are given as states, though.
    }

    return { country, lat, lng }
}


/**
 * Communicates with the Wikipedia API for battles.
 * @param {String} country The country to find battles in.
 */
async function wikipediaBattles(country){
    const id = countryIDs[country.toLowerCase()];                   // Get the section id for the given country.

    // Construct the API URL to contact.
    const url = `https://en.wikipedia.org/w/api.php?origin=*&action=parse&page=List%20of%20battles%20(geographic)&prop=text&section=${id}&format=json`

    const results = await fetch(url).then(res => res.json());       // Send API request.

    // If no battles are found, exit.
    if(!results.parse)
        throw new SearchError('no results found.')
        // return;
    
    const html = results.parse.text['*'];                           // Get the html snippet of the response.
;

    return $(html).find('li');                                      // Parse with jQuery, then return the lines in the section.
}


/**
 * Communicates with the Wikipedia API for Coordinates.
 * @param {String} battles A pipe-delimited string of battles.
 */
async function wikipediaCoords(battles){
    const coordsResponse = await fetch(`https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=coordinates&redirects&titles=${battles}`).then(res => res.json());

    const pages = Object.values(coordsResponse.query.pages);
    const coordsList = [];

    for(const page of pages){
        if(page.coordinates){
            coordsList.push({
                name: page.title,
                lat: page.coordinates[0].lat,
                lng: page.coordinates[0].lon
            });
        }
    }

    return coordsList;
}


/**
 * Creates a search result which opens the preview for the battle's article.
 * @param {Number} lat 
 * @param {Number} lng 
 * @param {String} title 
 */
function createSearchResult(lat, lng, title){
    const result = $('<div></div>');
    result.addClass('search-result');
    result.css('display', 'none');

    // Create the link to open the article preview.
    const link = $('<a></a>');
    link.text(title)
    link.click(function(){
        createArticlePreview(title)
    });

    // Create the button to pan to the pin on the map
    const button = $('<button></button>');
    button.attr('title', 'Show on map');
    button.click(function(){
        // Pan over to circle.
        map.setView([lat, lng], 8, {
            animate: true
        });
    });

    // Add the created elements to the search result.
    result.append(link);
    result.append(button);
    
    // Finally, add the search result to the page.
    $('#search-output').append(result);
    result.fadeIn();
}


/**
 * Searches wikipedia and plots battles on the map.
 * @param {String} place Name of the place to find battles in and around for.
 * @param {String|undefined} hascountry Do you want all the battles in the country?
 * @param {Number} givenYear A given year to use for filtering.
 * @param {String|undefined} earlier Do you want to find battles before the given year?
 */
async function wikiSearch(place, hascountry, givenYear, earlier){
    const placeInfo = await opencageAPI(place);                     // Get the coordinates for the place, as well as its country.

    if(!placeInfo)
        throw new SearchError('either a mispelling or a non-European country');

    plotRadius(placeInfo.lat, placeInfo.lng, place);                // Plot a radius around the place.

    /* Searching for battles */

    const wikiResults = await wikipediaBattles(placeInfo.country);  // Get a list of the battles from the country.

    /* Getting coorindates for battles */

    const battles = [];                                             // List for storing names of battles.

    wikiResults.each(function(){                                    // Iterate through each item with jQuery's each function.
        const text = $(this).text()
        const title = text.split('–')[0].trim();                    // Splits by the dash, then remove white space.
        const match = text.match(/\d+/);
        
        // If no date found, skip this entry.
        if(!match){                                                 // Search for a group of numbers, effectively grabbing the year.)
            return;
        }
        
        const year = parseInt(match[0]);

        /* Filter by years */
        if(givenYear){
            // If a battle's year passes NEITHER filter inspection, skip this battle.
            // So, if searching for the year 1850 and above and a battle's year is 1700, skip it.
            if(earlier && year >= givenYear){
                return;
            }
            // Likewise, if searching for years less than 1850 and a battle's year is 1945, skip it.
            else if(!earlier && year < givenYear){
                return;
            }
        }
        
        // Add battle to list.
        battles.push(title);
    });

    // While there is no rate limit for wikipedia, querying for each individual page is inconsiderate.
    // The Wikipedia API lets you query for 50 pages at a time, so we will split up the list of battles
    // into groups of 50 in order to requests in bulk.
    const coordRequests = [];
    let endOf = false;
    let i = 0;

    while(!endOf){
        // Get the next 50 names.
        const bulk = battles.slice(i, i+50);

        // If the length is 0 (equal to false), nothing has been sliced, so break out of the loop.
        if(!bulk.length){
            break;
        }
        
        // If less than 50, not enough to group for next iteration, so end after this one.
        else if(bulk.length < 50){
            endOf = true;
        }

        // Join the titles together and add them to the array.
        coordRequests.push(bulk.join('|'))
        i += 50; // Steps of 50.
    }

    // Execute each bulk request.
    coordRequests.forEach(async list => {
        // Get coordinates from wikipedia.
        const coordsList = await wikipediaCoords(list);

        for(const item of coordsList){
            const marker = plotPoint(item.lat, item.lng, item.name);
            
            // Hide current marker.
            marker.setOpacity(0);

            // If we are not getting all battles in a country,
            // find the battles which are plotted within a radius.
            if(!hascountry){
                if(showIfInArea(marker)){
                    createSearchResult(item.lat, item.lng, item.name);
                }
            } else {
                // Otherwise, just show all the markers.
                marker.setOpacity(1);
            }
        }
    });
}