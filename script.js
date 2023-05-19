// The existingPosts array is used to track already displayed posts
let existingPosts = [];

// getUrlParameter helps to fetch URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// secondsAgo calculates how many seconds have passed since the provided date
const secondsAgo = date => Math.floor((new Date() - date) / 1000);

// timeAgo formats the time elapsed in a human readable format
const timeAgo = function(seconds) {
    // An array of intervals for years, months, days, hours, and minutes.
    const intervals = [
        { limit: 31536000, text: 'years' },
        { limit: 2592000, text: 'months' },
        { limit: 86400, text: 'days' },
        { limit: 3600, text: 'hours' },
        { limit: 60, text: 'minutes' }
    ];

    // Loop through the intervals to find which one is the best fit.
    for (let interval of intervals) {
        if (seconds >= interval.limit) {
            return Math.floor(seconds / interval.limit) + ` ${interval.text} ago`;
        }
    }
    return Math.floor(seconds) + " seconds ago";
};

let includeReplies;

// fetchConfig fetches the configuration from the config.json file
const fetchConfig = async function() {
    try {
        const config = await $.getJSON('config.json');
        $('#navbar-brand').text(config.navbarBrandText);
        $('.navbar').css('background-color', config.navbarColor);
        includeReplies = config.includeReplies;
        return config.defaultServerUrl;
    } catch (error) {
        console.error("Error loading config.json:", error);
    }
}

// fetchPosts fetches posts from the server using the given hashtag
const fetchPosts = async function(serverUrl, hashtag) {
    try {
        const posts = await $.get(`${serverUrl}/api/v1/timelines/tag/${hashtag}?limit=20`);
        return posts;
    } catch (error) {
        console.error(`Error loading posts for hashtag #${hashtag}:`, error);
    }
};

// updateTimesOnPage updates the time information displayed for each post
const updateTimesOnPage = function() {
    $('.card-text a').each(function() {
        const date = new Date($(this).attr('data-time'));
        const newTimeAgo = timeAgo(secondsAgo(date));
        $(this).text(newTimeAgo);
    });
};

// displayPost creates and displays a post
const displayPost = function(post) {
    if (existingPosts.includes(post.id) || (!includeReplies && post.in_reply_to_id !== null)) return;

    existingPosts.push(post.id);

    let cardHTML = `
        <div class="col-sm-3">
            <div class="card m-2 p-2">
                <div class="d-flex align-items-center mb-2">
                    <img src="${post.account.avatar}" class="avatar-img rounded-circle mr-2">
                    <p class="m-0">${post.account.display_name}</p>
                </div>
                ${post.media_attachments[0] ? `<img src="${post.media_attachments[0].url}" class="card-img-top mb-2">` : ''}
                <p class="card-text">${post.content}</p>
                ${post.spoiler_text ? `<p class="card-text text-muted spoiler">${post.spoiler_text}</p>` : ''}
                <p class="card-text"><small class="text-muted"><a href="${post.url}" target="_blank" data-time="${post.created_at}">${timeAgo(secondsAgo(new Date(post.created_at)))}</a></small></p>
            </div>
        </div>
    `;

    let $card = $(cardHTML);
    $('#wall').prepend($card);
    $('.masonry-grid').masonry('prepended', $card);
};

// updateWall displays all posts
const updateWall = function(posts) {
    if (!posts || posts.length === 0) return;

    posts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    posts.forEach(post => displayPost(post));
};

// updateHashtagsOnPage updates the displayed hashtags
const updateHashtagsOnPage = function(hashtagsArray) {
    $('#hashtag-display').text(hashtagsArray.length > 0 ? `${hashtagsArray.map(hashtag => `#${hashtag}`).join(' ')}` : 'No hashtags set');
};

// handleHashtagDisplayClick handles the event when the hashtag display is clicked
const handleHashtagDisplayClick = function(serverUrl) {
    $('#app-content').addClass('d-none');
    $('#zero-state').removeClass('d-none');

    const currentHashtags = getUrlParameter('hashtags').split(',');

    for (let i = 0; i < currentHashtags.length; i++) {
        $(`#hashtag${i+1}`).val(currentHashtags[i]);
    }

    $('#serverUrl').val(serverUrl);
};

// handleHashtagFormSubmit handles the submission of the hashtag form
const handleHashtagFormSubmit = function(e, hashtagsArray) {
    e.preventDefault();

    let hashtags = [
        $('#hashtag1').val(),
        $('#hashtag2').val(),
        $('#hashtag3').val()
    ];

    hashtags = hashtags.filter(function(hashtag) {
        return hashtag !== '' && /^[\w]+$/.test(hashtag);
    });

    let serverUrl = $('#serverUrl').val();

    if (!/^https:\/\/[\w.\-]+\/?$/.test(serverUrl)) {
        alert('Invalid server URL.');
        return;
    }

    const newUrl = window.location.origin + window.location.pathname + `?hashtags=${hashtags.join(',')}&server=${serverUrl}`;

    window.location.href = newUrl;
};

// On document ready, the script configures Masonry, handles events, fetches and displays posts
$(document).ready(async function() {
    const defaultServerUrl = await fetchConfig();
    $('.masonry-grid').masonry({
        itemSelector: '.col-sm-3',
        columnWidth: '.col-sm-3',
        percentPosition: true
    });

    setInterval(function() {
        $('.masonry-grid').masonry('layout');
    }, 10000);

    const hashtags = getUrlParameter('hashtags');
    const hashtagsArray = hashtags ? hashtags.split(',') : [];
    const serverUrl = getUrlParameter('server') || defaultServerUrl;

    $('#hashtag-display').on('click', function() {
        handleHashtagDisplayClick(serverUrl);
    });

    if (hashtagsArray.length > 0 && hashtagsArray[0] !== '') {
        const allPosts = await Promise.all(hashtagsArray.map(hashtag => fetchPosts(serverUrl, hashtag)));
        updateWall(allPosts.flat());
        setInterval(async function() {
            const newPosts = await Promise.all(hashtagsArray.map(hashtag => fetchPosts(serverUrl, hashtag)));
            updateWall(newPosts.flat());
        }, 10000);
    } else {
        $('#zero-state').removeClass('d-none');
        $('#app-content').addClass('d-none');
    }

    updateHashtagsOnPage(hashtagsArray);

    $('#hashtag-form').on('submit', function(e) {
        handleHashtagFormSubmit(e, hashtagsArray);
    });

    updateTimesOnPage();
    setInterval(updateTimesOnPage, 60000);
});
