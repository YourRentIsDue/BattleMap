window.addEventListener('load', e => {
    // Handle form submits
    document.getElementById('battle-form').addEventListener('submit', new FormSubmitHandler)
});

class FormSubmitHandler {
    handleEvent(e){
        e.preventDefault();
        const output = document.getElementById("outputBattleSubmit");

        const form = e.target;

        const data = new URLSearchParams({
            // accessing <input name="term">
            name: form.name.value,
            link: form.link.value,
            year: form.year.value,
            place: form.place.value,
            country: form.country.value,
            war: form.war.value,
            coords: {lat: form.lat.value, lng: form.lng.value}
        });
    
        postURLEncoded('/battle-form', data)
        .then(res => {
            if(res.status === 'success'){
                output.innerHTML = "Battle added succesfully";
            }
            else{
                output.innherHTML = "There was an error adding the battle";
            }
        })
        .catch (res => {
            output.innherHTML = "There was an error adding the battle";
        })
    }
}