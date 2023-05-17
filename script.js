let existingPosts = [];

// Function to calculate relative time
const timeAgo = function(date) {
    let seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) {
        return Math.floor(interval) + " years ago";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + " months ago";
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + " days ago";
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + " hours ago";
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " minutes ago";
    }
    return Math.floor(seconds) + " seconds ago";
}

// Function to get a parameter by name from URL
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Get hashtags from URL parameters
let hashtags = getUrlParameter('hashtags');

// Split the hashtags string into an array
let hashtagsArray = hashtags.split(',');


// Function to fetch posts for a given hashtag
const getPosts = function(hashtag) {
    return $.get(`https://openbiblio.social/api/v1/timelines/tag/${hashtag}`);
}


// Function to fetch and display posts
const fetchAndDisplayPosts = function() {
        // Fetch posts for each hashtag
        $.when(...hashtagsArray.map(hashtag => getPosts(hashtag))).then(function(...hashtagPosts) {
            let allPosts;

            // Check if there are multiple hashtags or just one
            if (hashtagsArray.length > 1) {
                // If there are multiple hashtags, `hashtagPosts` is an array of arrays
                // We use Array.prototype.flat() to combine them into one array
                allPosts = hashtagPosts.map(postData => postData[0]).flat();
            } else {
                // If there's only one hashtag, `hashtagPosts` is a single array
                allPosts = hashtagPosts[0];
            }
    
        // Sort the posts by date/time
        allPosts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        // Loop through the sorted posts
        $.each(allPosts, function(i, post) {
            // Check if the post is not already displayed and is not a mention
            if (!existingPosts.includes(post.id) && post.in_reply_to_id === null) {
                // Add the post id to existingPosts
                existingPosts.push(post.id);

                let cardHTML = `
                <div class="col-sm-3">
                    <div class="card m-2 p-2">
                        <div class="d-flex align-items-center mb-2">
                            <img src="${post.account.avatar}" class="rounded-circle mr-2" width="50" height="50">
                            <h5 class="card-title m-0"><a href="${post.account.url}" target="_blank">${post.account.username}</a></h5>
                        </div>
                        <p class="card-text">${post.content}</p>
                        ${post.media_attachments.length > 0 ? `<img src="${post.media_attachments[0].preview_url}" class="card-img-top mb-2" alt="Image">` : ''}
                        <p class="card-text text-right"><a href="${post.url}" target="_blank">${timeAgo(new Date(post.created_at))}</a></p>
                    </div>
                </div>
            `;

                // Convert the HTML string into a jQuery object
                let $card = $(cardHTML);

                // Prepend the new card to the wall
                $('#wall').prepend($card);

                // Refresh Masonry layout after all new cards have been added
                $('.masonry-grid').masonry('prepended', $card);
            }
        });
    });
};

$(document).ready(function() {
    // Initialize Masonry
    $('.masonry-grid').masonry({
        itemSelector: '.col-sm-3',
        columnWidth: '.col-sm-3',
        percentPosition: true
    });

    // Fetch posts for each hashtag on page load
    fetchAndDisplayPosts();

    // Fetch posts for each hashtag every 10 seconds
    setInterval(fetchAndDisplayPosts, 10000);
});
