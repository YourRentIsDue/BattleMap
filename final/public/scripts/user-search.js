function search(){
    if(!this.value.trim()){
        document.getElementById('user-search-results').innerHTML = "";
        return;
    }

    const data = {
        // the input field
        term: this.value
    }

    fetch('/user-search', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(res => {
        const users = res.results
        let row;

        // Clear previous results
        document.getElementById('user-search-results').innerHTML = "";

        // Add results
        for(const user of users){
            row = document.createElement('a')
            row.href = `/profile/${user.username}`
            row.innerHTML = user.username
            document.getElementById('user-search-results').appendChild(row)
        }
    })
    .catch(console.error);
}

window.addEventListener('load', e => {
    document.getElementById('user-search').addEventListener('input', search);
});