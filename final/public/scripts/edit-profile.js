function handleSubmit(e){
    e.preventDefault()

    $('#output').html('Loading...')

    const data = {
        epithet: this.epithet.value
    }

    post("/profile/edit", data)
    .then(res => {
        if(res.status === 'good'){
            $('#output').html('Successfully updated')
        } else {
            $('#output').html(res.reason)
        }
    })
    .catch(res => {
        $('#output').html(res.message)
    })
}

$(document).ready(function(){
    $('#edit-profile-form').submit(handleSubmit)
})