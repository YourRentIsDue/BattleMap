function handleSubmit(e){
    e.preventDefault()

    $('output').html('Loading...')

    const data = {
        username: this.username.value, 
        password: this.password.value, 
    }

    post("/login/attempt", data)
    .then(res => {
        if(res.status === 'good'){
            window.location.href = "/profile/me"
        } else {
            $('output').html(res.reason)
        }
    })
    .catch(res => {
        $('output').html(res.message)
    })
}

$(document).ready(function(){
    $('#login-form').submit(handleSubmit)
})