// Script containing functions related to any popups (advanced search form and article preview).

/**
 * Gets wikipedia link for a title.
 * @param {String} title 
 */
function getWikiURL(title){
    return 'https://en.wikipedia.org/wiki/' + title.replace(/ /g, '_');
}


/**
 * Get data for popup from wikipedia
 * @param {String} name Title of the article to get information from.
 */
async function grabArticle(name){
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${name}&prop=extracts|pageimages&format=json&exintro=1&pithumbsize=250&origin=*`;
    const result = await fetch(url).then(res => res.json());

    if(!result.query)
        return;

    const article = Object.values(result.query.pages).pop();    // Get the result.
    const { title, thumbnail } = article;                       // Get the title and thumbnail
    const page = $(article.extract);                            // Parse html extract into a jQuery object.

    // Return our formatted response.
    return {
        title,
        url: getWikiURL(title),
        img: thumbnail.source,
        html: page
    }
}


/**
 * Remove the article preview from view.
 */
function closePopup(){
    $('#article-preview').removeClass('show');
    $('#article-preview').animate({opacity: 0});
}


/**
 * Takes a given article title and creates an article preview using wiki data.
 */
function createArticlePreview(title){
    grabArticle(title)
    .then(article => {
        if(!article)
            return;

        // Add the elements of the article to our page (title, image, etc.)
        $('#article-image').css('background-image', `url(${article.img})`);
        $('#article-title').text(article.title);
        $('#article-content').html(article.html);
        $('#article-link').prop('href', article.url);

        // Once set up, make interactable and animate the popup.
        $('#article-preview').addClass('show');
        $('#article-preview').animate({opacity: 1});
    });
}


/**
 * Toggle the secondary (advanced) search box.
 */
function toggleAdvancedSearch(){
    const advForm = $('#advanced-search');
    
    if(advForm.hasClass('hidden')){

        advForm.removeClass('hidden');
        advForm.animate({
            left: -166
        });

    } else {

        // Delay the hidden class to not hide right away.
        setTimeout(function(){
            advForm.addClass('hidden');
        }, 350);

        advForm.animate({
            left: 0
        });
        
    }
}


/**
 * Purely demonstrative implementation. Will be fully implemented in semester 2.
 */
function saveBattle(title){

    if($('#saved-battles').hasClass('empty')){
        $('#saved-battles').removeClass('empty');
    }

    const battle = $('<div class="search-result"></div>')

    battle.css('display', 'none');
    
    battle.html(`
        <a>${title}</a>
        <button title="show on map"></button>
    `);

    $('#saved-battles').append(battle);
    
    battle.fadeIn();
}

$(document).ready(function(){
    $('#open-advanced-search').click(toggleAdvancedSearch)
});