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

// Function to update times
const updateTimes = function() {
    // Find each timestamp element in the DOM
    $('.card-text a').each(function() {
        // Get the original date of the post
        let date = new Date($(this).attr('data-time'));

        // Calculate the new relative time
        let newTimeAgo = timeAgo(date);

        // Update the timestamp with the new relative time
        $(this).text(newTimeAgo);
    });
};

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


// Get server from URL parameters or use default
let server = getUrlParameter('server') || 'https://mastodon.social';

// Function to fetch posts for a given hashtag
const getPosts = function(hashtag) {
    return $.get(`${server}/api/v1/timelines/tag/${hashtag}?limit=20`);
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
                        <p class="card-text text-right"><a href="${post.url}" target="_blank" data-time="${post.created_at}">${timeAgo(new Date(post.created_at))}</a></p>
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

    // Re-arrange Masonry layout every 30 seconds
    setInterval(function() {
        $('.masonry-grid').masonry('layout');
    }, 10000);

    // Event listener for clicking on the hashtags
    $('#hashtag-display').on('click', function() {
        // Hide the main app content
        $('#app-content').addClass('d-none');

        // Show the form screen
        $('#zero-state').removeClass('d-none');

        // Get the current hashtags
        let currentHashtags = $(this).text().split(' ');

        // Pre-fill the form fields with the current hashtags
        for (let i = 0; i < currentHashtags.length; i++) {
            $(`#hashtag${i+1}`).val(currentHashtags[i].substring(1)); // Remove the leading '#'
        }
    });

    // Check if hashtags are provided
    if (hashtagsArray[0] !== '') {
        // Fetch posts for each hashtag on page load
        fetchAndDisplayPosts();

        // Fetch posts for each hashtag every 10 seconds
        setInterval(fetchAndDisplayPosts, 10000);
    } else {
        // Show the zero state and hide the app content
        $('#zero-state').removeClass('d-none');
        $('#app-content').addClass('d-none');
    }

    // Update the navbar info with the provided hashtags
    $('#hashtag-display').text(`${hashtagsArray.map(hashtag => `#${hashtag}`).join(' ')}`);


    // Handle the form submit event
    $('#hashtag-form').on('submit', function(e) {
        // Prevent the default form submission
        e.preventDefault();

        // Get the entered hashtags
        let hashtags = [
            $('#hashtag1').val(),
            $('#hashtag2').val(),
            $('#hashtag3').val()
        ];

        // Filter out any empty strings and validate hashtag format
        hashtags = hashtags.filter(function(hashtag) {
            return hashtag !== '' && /^[\w]+$/.test(hashtag);
        });

        // Get the entered server URL
        let serverUrl = $('#serverUrl').val();

        // Validate server URL format
        if (!/^https:\/\/[\w.\-]+\/?$/.test(serverUrl)) {
            alert('Invalid server URL.');
            return;
        }

        // Create a new URL with the entered hashtags and server URL
        let newUrl = window.location.origin + window.location.pathname + `?hashtags=${hashtags.join(',')}&server=${serverUrl}`;

        // Reload the page with the new URL
        window.location.href = newUrl;
    });


    // Update the times once when the page loads
    updateTimes();

    // Then update every 60 seconds
    setInterval(updateTimes, 60000);
});
