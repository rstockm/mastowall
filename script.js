// The existingPosts array is used to track already displayed posts
let existingPosts = [];

// Author metadata: authorId -> {count, displayName, avatarUrl, representativeNode}
let authorData = new Map();

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
        // Split text to style "Mastowall 2" darker
        const text = config.navbarBrandText;
        const parts = text.split(' - ');
        if (parts.length >= 2) {
            const styledText = `<span class="navbar-brand-dark">${parts[0]}</span> - ${parts.slice(1).join(' - ')}`;
            $('#navbar-brand').html(styledText);
        } else {
            $('#navbar-brand').text(text);
        }
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

    // Collect author metadata
    const authorId = post.account.id;
    const acctRaw = (post.account.acct || '').trim();
    const username = (post.account.username || '').trim();
    let acctFull = acctRaw;
    if (!acctFull || acctFull.indexOf('@') === -1) {
        // Try to derive full acct user@domain
        try {
            const urlObj = new URL(post.account.url || '');
            const host = urlObj.hostname;
            const userFromUrl = (urlObj.pathname || '').split('/').filter(Boolean).pop() || username || acctRaw;
            if (userFromUrl && host) acctFull = `${userFromUrl.replace(/^@/, '')}@${host}`;
        } catch (e) {
            if (username && (post.account.url || '').length > 0) {
                try {
                    const host = new URL(post.account.url).hostname;
                    acctFull = `${username}@${host}`;
                } catch(e2) {}
            }
        }
    }
    if (authorData.has(authorId)) {
        const meta = authorData.get(authorId);
        meta.count++;
        if (!meta.acct && acctFull) meta.acct = acctFull;
        if (!meta.displayName && post.account.display_name) meta.displayName = post.account.display_name;
        if (!meta.avatarUrl && post.account.avatar) meta.avatarUrl = post.account.avatar;
        if (!meta.bio && post.account.note) meta.bio = post.account.note;
        // Keep all posts
        meta.recentPosts.push(post);
    } else {
        authorData.set(authorId, {
            count: 1,
            displayName: post.account.display_name,
            avatarUrl: post.account.avatar,
            acct: acctFull || '',
            bio: post.account.note || '',
            recentPosts: [post],
            representativeNode: null  // Will be set after card is rendered
        });
    }

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

    // Construct profile URL
    let profileUrl = post.account.url || '';
    if (!profileUrl && acctFull && acctFull.includes('@')) {
        const parts = acctFull.split('@');
        const username = parts[0];
        const domain = parts[1];
        profileUrl = `https://${domain}/@${username}`;
    }
    
    let cardHTML = `
        <div class="col-sm-3">
            <div class="card m-2 p-2" data-author-id="${post.account.id}">
                <div class="d-flex align-items-center mb-2">
                    ${profileUrl ? `<a href="${profileUrl}" target="_blank" rel="noopener" class="avatar-link">` : ''}
                    <img src="${post.account.avatar}" class="avatar-img rounded-circle mr-2" data-author-id="${post.account.id}">
                    ${profileUrl ? `</a>` : ''}
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

    // Always set representative node to the most recently rendered avatar
    const avatarNode = $card.find('.avatar-img')[0];
    if (avatarNode && authorData.has(authorId)) {
        authorData.get(authorId).representativeNode = avatarNode;
        console.log('Set representativeNode for author', authorId, avatarNode);
    }

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
    const hashtagsText = hashtagsArray.length > 0 ? hashtagsString(hashtagsArray) : 'No hashtags set';
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

// Current view state: 'posts', 'people', or 'settings'
let currentView = 'posts';

// updateButtonStates updates the visual state of all navigation buttons
const updateButtonStates = function() {
    // Reset all buttons to outline style
    $('#toggle-posts, #toggle-people, #settings-btn').removeClass('btn-primary').addClass('btn-outline-primary');
    
    // Set active button based on current view
    switch(currentView) {
        case 'posts':
            $('#toggle-posts').removeClass('btn-outline-primary').addClass('btn-primary');
            break;
        case 'people':
            $('#toggle-people').removeClass('btn-outline-primary').addClass('btn-primary');
            break;
        case 'settings':
            $('#settings-btn').removeClass('btn-outline-primary').addClass('btn-primary');
            break;
    }
};

// renderPeopleList generates and displays the sorted author list
const renderPeopleList = function() {
    const $container = $('#people-container');
    $container.empty();

    if (authorData.size === 0) {
        $container.html('<div class="text-center py-5"><h3>People</h3><p class="text-muted">No authors yet</p></div>');
        return;
    }

    // Convert to array and sort by count descending
    const sortedAuthors = Array.from(authorData.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.count - a.count);

    let listHTML = '<div class="people-list py-4">';
    sortedAuthors.forEach(author => {
        const bioText = author.bio || '';
        const sanitizedBio = DOMPurify.sanitize(bioText, {ALLOWED_TAGS: []});
        
        // Prepare recent posts HTML
        let postsHTML = '';
        if (author.recentPosts && author.recentPosts.length > 0) {
            postsHTML = '<div class="people-posts">';
            // Sort by date descending (newest first)
            const sortedPosts = [...author.recentPosts].sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
            );
            sortedPosts.forEach(post => {
                const postContent = DOMPurify.sanitize(post.content);
                const postDate = new Date(post.created_at);
                const timeAgoText = timeAgo(secondsAgo(postDate));
                
                postsHTML += `
                    <div class="people-post">
                        <div class="people-post-content">${postContent}</div>
                        <div class="people-post-meta">
                            <a href="${post.url}" target="_blank" rel="noopener">${timeAgoText}</a>
                        </div>
                    </div>
                `;
            });
            postsHTML += '</div>';
        }
        
        // Construct profile URL from acct
        let profileUrl = '';
        if (author.acct && author.acct.includes('@')) {
            const parts = author.acct.split('@');
            const username = parts[0];
            const domain = parts[1];
            profileUrl = `https://${domain}/@${username}`;
        }
        
        listHTML += `
            <div class="people-item is-hidden" data-author-id="${author.id}">
                <img src="${author.avatarUrl}" class="people-avatar" data-author-id="${author.id}" width="50" height="50" alt="${DOMPurify.sanitize(author.displayName)}">
                <div class="people-info">
                    <div class="people-name-wrapper">
                        <span class="people-name">${DOMPurify.sanitize(author.displayName)}</span>
                        ${profileUrl ? `<a href="${profileUrl}" target="_blank" rel="noopener" class="people-profile-link" title="Profil auf ${author.acct} ansehen"><i class="fas fa-external-link-alt"></i></a>` : ''}
                    </div>
                    ${sanitizedBio ? `<div class="people-bio">${sanitizedBio}</div>` : ''}
                    ${postsHTML}
                </div>
                <div class="people-actions">
                    <span class="people-count">${author.count}</span>
                    <button class="btn btn-sm btn-outline-success follow-btn" data-acct="${(author.acct||'').replace(/"/g,'&quot;')}">+ Follow</button>
                </div>
            </div>
        `;
    });
    listHTML += '</div>';

    $container.html(listHTML);
    console.log(`People list rendered: ${authorData.size} authors`);
};

// animatePostsToPeople performs FLIP animation from posts to people view
const animatePostsToPeople = async function() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        // Simple crossfade without animation
        $('#app-content').fadeOut(200);
        renderPeopleList();
        $('#people-container').fadeIn(200);
        return;
    }

    const $layer = $('#animation-layer');
    const clones = [];
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // STEP 1: Measure start positions from avatars with actual layout
    const startRects = new Map();
    
    // Get all avatars WITHOUT :visible filter (it's unreliable with Masonry)
    const $allAvatars = $('#wall .avatar-img');
    console.log('Total avatars in wall:', $allAvatars.length);
    
    $allAvatars.each(function() {
        const authorId = $(this).attr('data-author-id');
        if (!authorId) return;
        
        // Skip if we already have this author (use first/topmost avatar only)
        if (startRects.has(authorId)) return;
        
        // Check if element has dimensions using offsetWidth/offsetHeight
        const hasSize = this.offsetWidth > 0 && this.offsetHeight > 0;
        
        if (hasSize) {
            const rect = this.getBoundingClientRect();
            
            if (rect.width > 0 && rect.height > 0) {
                const startPos = {
                    left: rect.left,
                    top: rect.top + scrollTop,
                    width: rect.width,
                    height: rect.height
                };
                startRects.set(authorId, startPos);
                if (startRects.size <= 2) {
                    console.log(`Start: ${authorId.substr(0,8)} - left:${rect.left.toFixed(0)} top:${rect.top.toFixed(0)} scroll:${scrollTop}`);
                }
            }
        }
    });
    
    console.log('Start rects collected:', startRects.size, 'of', $allAvatars.length, 'avatars');

    // STEP 2: Render people list and measure end positions in final on-screen placement
    renderPeopleList();
    // Parallel: Follow-Status vorab laden, damit Buttons korrekt angezeigt werden
    prefetchFollowStatuses().catch(() => {});
    const navbarHeight = $('.navbar').outerHeight() || 54;
    
    // Measure scrollTop AGAIN before showing people-container (it may have changed)
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    console.log('scrollTop changed from', scrollTop, 'to', currentScrollTop);
    
    // Show container, but keep it invisible and fixed at final position to get correct rects
    $('#people-container')
        .removeClass('d-none')
        .css({ visibility: 'hidden', position: 'absolute', top: (navbarHeight + currentScrollTop) + 'px', left: 0, right: 0 });

    // Force layout and give a tick for styles
    $('#people-container')[0].offsetHeight;
    await new Promise(resolve => setTimeout(resolve, 10));

    const endRects = new Map();
    $('#people-container .people-avatar').each(function() {
        const authorId = $(this).attr('data-author-id');
        const rect = this.getBoundingClientRect();
        const endRect = {
            left: rect.left,
            top: rect.top + currentScrollTop, // Absolute Position with current scroll
            width: rect.width,
            height: rect.height
        };
        endRects.set(authorId, endRect);
        if (endRects.size <= 2) {
            console.log(`End: ${authorId.substr(0,8)} - left:${rect.left.toFixed(0)} top:${rect.top.toFixed(0)} scroll:${currentScrollTop}`);
        }
    });

    // Hide again and reset positioning; will be shown for real after animation
    $('#people-container')
        .addClass('d-none')
        .css({ visibility: '', position: '', top: '', left: '', right: '' });

    console.log('Animation setup complete - Start rects:', startRects.size, 'End rects:', endRects.size);
    
    // Debug first start rect
    const firstStart = Array.from(startRects.values())[0];
    console.log('First start rect:', firstStart);

    // STEP 3: Create clones for each author
    $layer.addClass('active').empty();
    console.log('Animation layer active, creating clones...');

    authorData.forEach((data, authorId) => {
        const start = startRects.get(authorId);
        const end = endRects.get(authorId);

        if (!start || !end) {
            console.log('Skipping author', authorId, '- missing positions');
            return;
        }

        // Use initial scrollTop for positioning (from when start positions were measured)
        const $clone = $('<img>', {
            src: data.avatarUrl,
            class: 'fly-avatar',
            css: {
                position: 'absolute',
                left: start.left + 'px',
                top: (start.top - scrollTop) + 'px', // Use initial scrollTop (viewport-relative for fixed layer)
                width: start.width + 'px',
                height: start.height + 'px',
                opacity: 1,
                zIndex: 2001,
                display: 'block',
                visibility: 'visible'
            }
        });

        $layer.append($clone);
        clones.push({ $clone, start, end });
        if (clones.length <= 2) {
            console.log(`Clone ${clones.length}: ${authorId.substr(0,8)} start(${start.left.toFixed(0)},${start.top.toFixed(0)}) -> end(${end.left.toFixed(0)},${end.top.toFixed(0)})`);
        }
    });

    // STEP 4: Shrink and move post cards toward center
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    
    $('#wall .card').each(function() {
        const rect = this.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        const deltaX = viewportCenterX - cardCenterX;
        const deltaY = viewportCenterY - cardCenterY;
        
        $(this).css({
            transition: 'transform 800ms ease-out, opacity 800ms ease-out',
            transform: `translate(${deltaX * 0.3}px, ${deltaY * 0.3}px) scale(0.3)`,
            opacity: 0
        });
    });

    // STEP 5: Animate clones to end positions
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            clones.forEach(({ $clone, start, end }) => {
                const deltaX = end.left - start.left;
                // Use currentScrollTop for end position (measured when people-container was positioned)
                const deltaY = (end.top - currentScrollTop) - (start.top - scrollTop); // Viewport-relative
                const scaleX = end.width / start.width;
                const scaleY = end.height / start.height;

                $clone.css({
                    transition: 'transform 1800ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 1800ms ease-out',
                    transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`
                });
            });
        });
    });

    console.log('Animation started with', clones.length, 'clones');

    // STEP 6: Hide app-content NOW (after measurement) and show people container during flight
    $('#app-content').addClass('d-none');
    
    setTimeout(() => {
        $('#people-container').removeClass('d-none').css({ visibility: '' });
        
        // Staggered reveal for organic build-up (boxes without avatars)
        const items = Array.from(document.querySelectorAll('#people-container .people-item'));
        items.forEach((el, idx) => {
            setTimeout(() => el.classList.remove('is-hidden'), 80 * idx);
        });
        // Zweiter Versuch, sobald die DOM-Elemente sichtbar sind
        prefetchFollowStatuses().catch(() => {});
    }, 400);

    // STEP 7: Crossfade from clones to real avatars in boxes
    setTimeout(() => {
        // Show real avatars in boxes
        document.querySelectorAll('#people-container .people-avatar').forEach(av => {
            av.style.visibility = 'visible';
            av.style.opacity = '0';
            av.style.transition = 'opacity 300ms ease';
            // Force reflow
            av.offsetHeight;
            av.style.opacity = '1';
        });
        
        // Fade out clones simultaneously
        $('.fly-avatar').css({
            transition: 'opacity 300ms ease',
            opacity: 0
        });
        
        // Remove clones and layer after crossfade
        setTimeout(() => {
            $layer.removeClass('active').empty();
        }, 350);
        
        // Reset wall cards for next time
        $('#wall .card').css({ transition: '', opacity: '', transform: '' });
    }, 1800);
};

// Lädt Follow-Status (ausschließlich über Backend-Proxy) und aktualisiert Buttons
async function prefetchFollowStatuses() {
    const token = sessionStorage.getItem('mw_token');
    const home  = sessionStorage.getItem('mw_home');
    if (!token || !home) return;

    // Sammle eindeutige accts aus der gerade gerenderten Liste
    const accts = [];
    $('#people-container .follow-btn').each(function() {
        const a = ($(this).attr('data-acct') || '').trim();
        if (a) accts.push(a.toLowerCase());
    });
    const uniqueAccts = Array.from(new Set(accts)).slice(0, 50); // Limit für Performance
    console.log('Prefetch start. unique accts:', uniqueAccts.length, uniqueAccts.slice(0, 5));
    if (uniqueAccts.length === 0) { console.log('No accts to check.'); return; }

    // Serverseitig über relations.php (vermeidet CORS/403 und ist stabiler)
    try {
        const resp = await fetch('https://follow.wolkenbar.de/relations.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, home, accts: uniqueAccts })
        });
        if (!resp.ok) { console.warn('relations.php HTTP', resp.status); return; }
        const data = await resp.json();
        if (!data || !Array.isArray(data.relations)) { console.warn('relations.php: malformed response'); return; }
        const map = new Map();
        data.relations.forEach(r => { if (r && r.acct) map.set(String(r.acct).toLowerCase(), r); });
        console.log('Relations fetched:', data.relations.length, 'map size:', map.size);
        $('#people-container .follow-btn').each(function() {
            const $btn = $(this);
            const acct = ($btn.attr('data-acct') || '').trim().toLowerCase();
            const r = map.get(acct);
            if (!r) return;
            if (r.following) {
                $btn.prop('disabled', true).removeClass('btn-outline-success btn-warning btn-outline-danger btn-secondary').addClass('btn-success').text('Following');
            } else if (r.requested) {
                $btn.prop('disabled', true).removeClass('btn-outline-success btn-success btn-outline-danger btn-secondary').addClass('btn-warning').text('Requested');
            } else {
                $btn.prop('disabled', false).removeClass('btn-success btn-warning btn-outline-danger btn-secondary').addClass('btn-outline-success').text('+ Follow');
            }
        });
    } catch (e) {
        console.error('relations.php fetch failed:', e);
        // Buttons bleiben im Default
    }
}

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

    // Settings button handler is now in the view toggle handlers section

    if (hashtagsArray.length > 0 && hashtagsArray[0] !== '') {
        $('#view-toggle').removeClass('d-none');
        updateButtonStates(); // Initialize button states
        const allPosts = await Promise.all(hashtagsArray.map(hashtag => fetchPosts(serverUrl, hashtag)));
        updateWall(allPosts.flat());
        setInterval(async function() {
            const newPosts = await Promise.all(hashtagsArray.map(hashtag => fetchPosts(serverUrl, hashtag)));
            updateWall(newPosts.flat());
        }, 10000);
    } else {
        $('#zero-state').removeClass('d-none');
        $('#app-content').addClass('d-none');
        currentView = 'settings'; // Set to settings when in zero state
        $('#view-toggle').removeClass('d-none');
        updateButtonStates(); // Initialize button states for settings view
    }

    updateHashtagsOnPage(hashtagsArray);
    updateHashtagsInTitle(hashtagsArray);

    $('#hashtag-form').on('submit', function(e) {
        handleHashtagFormSubmit(e, hashtagsArray);
    });

    updateTimesOnPage();
    setInterval(updateTimesOnPage, 60000);

    // If we just returned from OAuth, optimistically show connected
    if (getUrlParameter('mw_auth') === '1') {
        $('#connect-status-icon').removeClass('fa-unlink').addClass('fa-link connected').attr('title', 'Verbunden');
        // Clean URL (remove mw_auth)
        try {
            const url = new URL(window.location.href);
            url.searchParams.delete('mw_auth');
            window.history.replaceState({}, document.title, url.toString());
        } catch (e) {}
    }

    // OAuth: Token aus URL-Fragment übernehmen (weitergereicht vom Backend)
    (function storeTokenFromHash(){
        try {
            const hash = window.location.hash;
            if (!hash) return;
            const params = new URLSearchParams(hash.slice(1));
            const token = params.get('mw_token');
            const home = params.get('mw_home');
            if (token && home) {
                sessionStorage.setItem('mw_token', token);
                sessionStorage.setItem('mw_home', home);
                // Fragment entfernen
                const hrefNoHash = window.location.href.split('#')[0];
                window.history.replaceState({}, document.title, hrefNoHash);
            }
        } catch (err) {
            console.warn('Konnte Token-Fragment nicht parsen:', err);
        }
    })();

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

    // View toggle handlers
    $('#toggle-posts').on('click', function() {
        if (currentView === 'posts') return;
        currentView = 'posts';
        updateButtonStates();
        $('#people-container').addClass('d-none');
        $('#zero-state').addClass('d-none');
        $('#app-content').removeClass('d-none');
    });

    $('#toggle-people').on('click', function() {
        if (currentView === 'people') return;
        currentView = 'people';
        updateButtonStates();
        $('#zero-state').addClass('d-none');
        // DON'T hide app-content yet - measure avatars first!
        animatePostsToPeople();
    });

    $('#share-btn').on('click', async function() {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            // Visual feedback
            const $btn = $(this);
            const originalIcon = $btn.html();
            $btn.html('<i class="fas fa-check"></i>');
            $btn.addClass('btn-success').removeClass('btn-outline-primary');
            
            // Show modern styled message
            showNotification('URL copied to clipboard!');
            
            // Reset button after 2 seconds
            setTimeout(() => {
                $btn.html(originalIcon);
                $btn.removeClass('btn-success').addClass('btn-outline-primary');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy URL:', err);
            showNotification('Failed to copy URL. Please copy manually: ' + url, 'error');
        }
    });
    
    // Modern notification function
    function showNotification(message, type = 'success') {
        // Remove existing notification if any
        $('.notification-toast').remove();
        
        const $notification = $(`
            <div class="notification-toast notification-${type}">
                <div class="notification-content">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                    <span>${message}</span>
                </div>
            </div>
        `);
        
        $('body').append($notification);
        
        // Trigger animation
        setTimeout(() => $notification.addClass('show'), 10);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            $notification.removeClass('show');
            setTimeout(() => $notification.remove(), 300);
        }, 3000);
    }

    $('#settings-btn').on('click', function() {
        if (currentView === 'settings') return;
        currentView = 'settings';
        updateButtonStates();
        $('#people-container').addClass('d-none');
        $('#app-content').addClass('d-none');
        handleHashtagDisplayClick(serverUrl);
    });

    // Click on people-item to expand/collapse bio
    $('#people-container').on('click', '.people-item', function(e) {
        // Don't toggle if clicking on the follow button or profile link
        if ($(e.target).closest('.follow-btn, .people-profile-link').length) return;
        
        $(this).toggleClass('expanded');
    });

    // Follow-Buttons (Delegation)
    $('#people-container').on('click', '.follow-btn', async function(e) {
        e.stopPropagation(); // Prevent triggering the people-item click
        const $btn = $(this);
        const acct = ($btn.attr('data-acct') || '').trim();
        if (!acct) { alert('Kein Konto-Handle verfügbar.'); return; }

        const token = sessionStorage.getItem('mw_token');
        const home  = sessionStorage.getItem('mw_home');
        if (!token || !home) { alert('Bitte zuerst verbinden.'); return; }

        $btn.prop('disabled', true).removeClass('btn-outline-success').addClass('btn-secondary').text('…');
        try {
            const resp = await fetch('https://follow.wolkenbar.de/follow.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, home, acct })
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.error || ('HTTP '+resp.status));
            }
            const data = await resp.json();
            if (data.ok) {
                if (data.following) {
                    $btn.removeClass('btn-secondary').addClass('btn-success').text('Following');
                } else if (data.requested) {
                    $btn.removeClass('btn-secondary').addClass('btn-warning').text('Requested');
                } else {
                    $btn.removeClass('btn-secondary').addClass('btn-success').text('OK');
                }
            } else {
                throw new Error('Unexpected response');
            }
        } catch (e) {
            console.error('Follow failed:', e);
            $btn.removeClass('btn-secondary').addClass('btn-outline-danger').prop('disabled', false).text('Retry');
        }
    });

    // Connect flow - now using status icon
    $('#connect-status-icon').on('click', function() {
        const token = sessionStorage.getItem('mw_token');
        const home = sessionStorage.getItem('mw_home');
        
        // Wenn verbunden, Disconnect-Dialog zeigen
        if (token && home) {
            $('#disconnect-overlay').removeClass('d-none');
        } else {
            // Wenn nicht verbunden, Verbindungs-Dialog öffnen
            $('#connect-overlay').removeClass('d-none');
            const existing = sessionStorage.getItem('mw_home_instance') || serverUrl || defaultServerUrl || 'https://mastodon.social';
            // Remove https:// prefix for display
            const displayValue = existing.replace(/^https:\/\//, '');
            $('#home-instance-input').val(displayValue);
            $('#home-instance-input')[0].focus();
        }
    });

    $('#connect-cancel').on('click', function() {
        $('#connect-overlay').addClass('d-none');
    });

    // Disconnect dialog handlers
    $('#disconnect-cancel').on('click', function() {
        $('#disconnect-overlay').addClass('d-none');
    });

    $('#disconnect-confirm').on('click', function() {
        sessionStorage.removeItem('mw_token');
        sessionStorage.removeItem('mw_home');
        sessionStorage.removeItem('mw_home_instance');
        $('#disconnect-overlay').addClass('d-none');
        refreshAuthIndicator();
        showNotification('Successfully disconnected');
    });

    // Handle form submission (Enter key or button click)
    $('#connect-form').on('submit', function(e) {
        e.preventDefault();
        let instanceValue = ($('#home-instance-input').val() || '').trim();
        
        // Add https:// prefix if not present
        if (!instanceValue.startsWith('http://') && !instanceValue.startsWith('https://')) {
            instanceValue = 'https://' + instanceValue;
        }
        
        // Validate
        if (!/^https:\/\/[\w.-]+(\:[0-9]+)?\/?$/.test(instanceValue)) {
            alert('Please enter a valid instance URL (e.g., mastodon.social)');
            return;
        }
        
        sessionStorage.setItem('mw_home_instance', instanceValue);
        const returnTo = encodeURIComponent(window.location.href);
        const startUrl = `https://follow.wolkenbar.de/auth_start.php?home=${encodeURIComponent(instanceValue)}&return_to=${returnTo}`;
        window.location.href = startUrl;
    });

    // Auth-Status prüfen (clientseitig via sessionStorage)
    function refreshAuthIndicator() {
        const token = sessionStorage.getItem('mw_token');
        const home = sessionStorage.getItem('mw_home');
        if (token && home) {
            $('#connect-status-icon')
              .removeClass('fa-unlink')
              .addClass('fa-link connected')
              .attr('title', 'Verbunden');
        } else {
            $('#connect-status-icon')
              .removeClass('fa-link connected')
              .addClass('fa-unlink')
              .attr('title', 'Nicht verbunden');
        }
    }
    refreshAuthIndicator();
    setInterval(refreshAuthIndicator, 5000);
});
/* Cache bust: 1759264298 */
