const geolib = require('geolib');

module.exports = (battleCoords, searchCoords, slider) => {

    if(geolib.isPointWithinRadius (
        {latitude: battleCoords.lat, longitude: battleCoords.lng},
        {latitude: searchCoords.lat, longitude: searchCoords.lng},
        slider
        )){
        return true;
    }
    return false;
}