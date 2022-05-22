async function handleSubmit(e){
    e.preventDefault()
    
    $('#output').html('Loading...')

    const form = this
    const data = {
        name: this.name.value,
        article: this.article.value,
        year: parseInt(this.year.value),
        place: this.place.value,
        country: this.country.value,
        war: this.war.value,
        lat: parseInt(this.lat.value),
        lng: parseInt(this.lng.value)
    }

    try {
        const result = await post('/missed-battle', data)

        if(result.status === 'good'){
            $('#output').html('Battle has been inserted!')
        } else {
            $('#output').html(result.reason)
        }
    } catch(error){
        console.error(error)
    }
}

$(document).ready(function(){
    $('#battle-submit-form').submit(handleSubmit)
})