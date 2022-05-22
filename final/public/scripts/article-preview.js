async function grabArticle(articleURL){
    const articleTitle = articleURL
        .split('/') // split the url
        .pop() // get the last segment
        .replace(/ /g, '_') // format the title
    
    const queryURL = `https://en.wikipedia.org/w/api.php?action=query&titles=${articleTitle}&prop=extracts|pageimages&format=json&exintro=1&pithumbsize=250&origin=*`;
    const query = await fetch(queryURL)
    const results = await query.json()

    if(!results.query){
        return;
    }

    const data = Object.values(results.query.pages).shift();
    const { title, thumbnail } = data;
    // Parse html with jQuery
    const page = $(data.extract);

    const article = {
        title,
        html: page
    }

    if(thumbnail){
        article.img = thumbnail.source
    }

    // Return our formatted response.
    return article
}

function closePopup(){
    $('#article-preview').removeClass('visible');
}

async function openArticlePreview(articleURL){
    try {
        const article = await grabArticle(articleURL)

        if(!article){
            return;
        }

        $('#article-preview').html(`
        <button id="article-preview-close" onclick="closePopup()">X</button>
        <header>
            <div class="header-image" style="background-image: url(${article.img})"></div>
            <h2>${article.title}</h2>
        </header>
        <main id="article-preview-content"></main>
        <footer>
            <p>Read the <a target="_blank" href="${articleURL}">full article</a></p>
        </footer>
        `)

        $('#article-preview-content').html(article.html)

        // Once set up, make interactable and animate the popup.
        $('#article-preview').addClass('visible');
    // $('#article-preview').animate({opacity: 1});
    } catch(error){
        console.error(error)
    }
}