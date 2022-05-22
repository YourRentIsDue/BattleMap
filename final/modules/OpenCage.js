const superagent = require('superagent')
const {OPENCAGE_API_TOKEN} = require('../config')

module.exports = async (place) => {
    const baseURL = 'https://api.opencagedata.com/geocode/v1/json'
    const querystring = {
        q: place,
        key: OPENCAGE_API_TOKEN,
        bounds: "-10.72266,34.19817,50.66895,71.21608",
        limit: 1
    }

    // Ask OpenCage for coordinates for a given place.
    let results = null;
    try {
        const res = await superagent.get(baseURL).query(querystring);
        results = res.body.results;
    } catch(e){
        throw new Error('OpenCage: ' + e.message)
    }

    // Get the first result.
    const output = results.shift();

    // If no results, exit.
    if(!output){
        return null
    }

    const {lat,lng} = output.geometry;
    let country = output.components.country;

    //console.log(output.components);

    // Special case for Ireland because Wikipedia has a separate page for Irish battles (evidently there are... a lot).
    // Also, Northern Ireland does not have its own section.
    if(output.components.state === 'Northern Ireland'){
        country = 'Ireland';
    }

    // OpenCage doesn't give Scotland, England and Wales as countries.
    else if(country === 'United Kingdom'){
        // They are listed as states.
        country = output.components.state;
    }

    return { country, state: output.components.state, city: output.components.city, lat, lng }
}