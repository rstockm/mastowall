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
    const intervals = [
        { limit: 31536000, text: 'years' },
        { limit: 2592000, text: 'months' },
        { limit: 86400, text: 'days' },
        { limit: 3600, text: 'hours' },
        { limit: 60, text: 'minutes' }
    ];

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
        const posts = await $.get(`${serverUrl}/api/v1/timelines/tag/${hashtag}?limit=40`);
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

    const attachments = Array.isArray(post.media_attachments) ? post.media_attachments : [];
    const imageAttachments = attachments.filter(att => !(att.url || '').endsWith('.mp4'));
    const hasVideo = attachments.some(att => (att.url || '').endsWith('.mp4'));

    let mediaHTML = '';
    if (imageAttachments.length > 1) {
        const carouselId = `carousel-${post.id}`;
        const indicators = imageAttachments.map((_, idx) => `
            <li data-target="#${carouselId}" data-slide-to="${idx}"${idx === 0 ? ' class="active"' : ''}></li>
        `).join('');
        const slides = imageAttachments.map((att, idx) => `
            <div class="carousel-item${idx === 0 ? ' active' : ''}">
                <img src="${att.url}" class="card-img-top" alt="">
            </div>
        `).join('');
        mediaHTML = `
            <div id="${carouselId}" class="carousel carousel-fade mb-2" data-ride="carousel" data-interval="2000">
                <ol class="carousel-indicators">${indicators}</ol>
                <div class="carousel-inner">${slides}</div>
            </div>
        `;
    } else if (imageAttachments.length === 1) {
        mediaHTML = `<img src="${imageAttachments[0].url}" class="card-img-top mb-2" alt="">`;
    } else if (hasVideo) {
        const videoAtt = attachments.find(att => (att.url || '').endsWith('.mp4'));
        mediaHTML = `<video src="${videoAtt.url}" controls autoplay muted loop class="mb-2"></video>`;
    }

    let cardHTML = `
        <div class="col-sm-3">
            <div class="card m-2 p-2">
                <div class="d-flex align-items-center mb-2">
                    <img src="${post.account.avatar}" class="avatar-img rounded-circle mr-2">
                    <p class="m-0">${DOMPurify.sanitize(post.account.display_name)}</p>
                </div>
                ${mediaHTML}
                <p class="card-text">${DOMPurify.sanitize(post.content)}</p>
                ${post.spoiler_text ? `<p class="card-text text-muted spoiler">${DOMPurify.sanitize(post.spoiler_text)}</p>` : ''}
                <p class="card-text text-right"><small class="text-muted"><a href="${post.url}" target="_blank" data-time="${post.created_at}">${timeAgo(secondsAgo(new Date(post.created_at)))}</a></small></p>
            </div>
        </div>
    `;

    let $card = $(cardHTML);
    $('#wall').prepend($card);
    $('.masonry-grid').masonry('prepended', $card);

    // Initialize carousel if present and relayout Masonry on slide and image load
    const $carousel = $card.find('.carousel');
    if ($carousel.length) {
        $carousel.carousel({ interval: 2000 });

        // Lock height to first slide once it's loaded
        const $firstImg = $carousel.find('.carousel-item img').first();
        const setHeight = function() {
            const h = $firstImg.height();
            if (h) {
                $carousel.find('.carousel-inner').css('height', h + 'px');
                $('.masonry-grid').masonry('layout');
            }
        };
        if ($firstImg[0] && $firstImg[0].complete) {
            setHeight();
        } else {
            $firstImg.on('load', setHeight);
        }
        $carousel.on('slid.bs.carousel', function() {
            $('.masonry-grid').masonry('layout');
        });
        $carousel.imagesLoaded(function() {
            $('.masonry-grid').masonry('layout');
        });
    } else {
        $card.imagesLoaded(function() {
            $('.masonry-grid').masonry('layout');
        });
    }
};

// Set the document title based on the first hashtag in the URL
document.addEventListener('DOMContentLoaded', function() {
    const hashtags = getUrlParameter('hashtags');
    if (hashtags) {
        const firstHashtag = hashtags.split(',')[0];
        document.title = `#${firstHashtag} - Mastowall 1.3`;
    }
});

// updateWall displays all posts
const updateWall = function(posts) {
    if (!posts || posts.length === 0) return;

    posts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    posts.forEach(post => displayPost(post));
};

// hashtagsString returns a single string based on the given array of hashtags
const hashtagsString = function(hashtagsArray) {
  return `${hashtagsArray.map(hashtag => `#${hashtag}`).join(' ')}`;
}

// updateHashtagsOnPage updates the displayed hashtags
const updateHashtagsOnPage = function(hashtagsArray) {
    const settingsIcon = ' <span id="settings-icon">⚙️</span>';
    const hashtagsText = hashtagsArray.length > 0 ? hashtagsString(hashtagsArray) + settingsIcon : 'No hashtags set' + settingsIcon;
    $('#hashtag-display').html(hashtagsText);
};

// updateHashtagsInTitle updates the document title by appending the given array of hashtags
const updateHashtagsInTitle = function(hashtagsArray) {
    const baseTitle = document.title;
    document.title = `${baseTitle} | ${hashtagsString(hashtagsArray)}`;
}

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

// Initialize isFirstLoad flag
let isFirstLoad = true;

// On document ready, the script configures Masonry, handles events, fetches and displays posts
$(document).ready(async function() {
    const defaultServerUrl = await fetchConfig();
    $('.masonry-grid').masonry({
        itemSelector: '.col-sm-3',
        columnWidth: '.col-sm-3',
        percentPosition: true
    });

    // Initial reshuffle after 3 seconds only on first load
    if (isFirstLoad) {
        setTimeout(function() {
            $('.masonry-grid').masonry('layout');
            isFirstLoad = false;
        }, 3000);
    }

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
    updateHashtagsInTitle(hashtagsArray);

    $('#hashtag-form').on('submit', function(e) {
        handleHashtagFormSubmit(e, hashtagsArray);
    });

    updateTimesOnPage();
    setInterval(updateTimesOnPage, 60000);

    const showOverlayWithMedia = function(src, isVideo) {
        const $overlay = $('#media-overlay');
        const $content = $('#overlay-content');
        $content.empty();
        if (isVideo) {
            const $video = $('<video />', {
                src: src,
                controls: true,
                autoplay: true,
                muted: true,
                loop: true
            });
            $content.append($video);
        } else {
            const $img = $('<img />', { src: src, alt: '' });
            $content.append($img);
        }
        $overlay.removeClass('d-none');
    };

    const hideOverlay = function() {
        $('#media-overlay').addClass('d-none');
        $('#overlay-content').empty();
    };

    $('#wall').on('click', 'img.card-img-top', function() {
        const src = $(this).attr('src');
        showOverlayWithMedia(src, false);
    });

    $('#wall').on('click', 'video', function() {
        const src = $(this).attr('src');
        showOverlayWithMedia(src, true);
    });

    $('#overlay-close').on('click', function() {
        hideOverlay();
    });

    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
            hideOverlay();
        }
    });
});
