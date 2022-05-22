function handleSubmit(e){
    e.preventDefault()

    $('output').html('Loading...')

    const data = {
        username: this.username.value, 
        password: this.password.value, 
    }

    post("/signup", data)
    .then(res => {
        if(res.status === 'good'){
            $('output').html('Successfully created account')
        } else {
            $('output').html(res.reason)
        }
    })
    .catch(res => {
        $('output').html(res.message)
    })
}

$(document).ready(function(){
    $('#signup-form').submit(handleSubmit)
})