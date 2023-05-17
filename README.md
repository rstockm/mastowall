# Mastodon Wall

Mastodon Wall is a simple web application that fetches and displays posts from multiple hashtags on Mastodon, an open-source decentralized social network. The project aims to provide an easily accessible public display of Mastodon posts for event organizers, community managers, and users who want to keep up with specific topics on the platform.

## Technology

Mastodon Wall is built using HTML, CSS, and JavaScript with jQuery for making API requests and handling dynamic content. The project uses the [Mastodon API](https://docs.joinmastodon.org/client/public/) to fetch posts from specified hashtags.

The layout is responsive and mobile-friendly, thanks to the use of [Bootstrap](https://getbootstrap.com/), a popular CSS framework, and [Masonry](https://masonry.desandro.com/), a grid layout library.

## Features

- Displays posts from multiple hashtags
- Fetches new posts in real-time
- Shows post content, author, author avatar, relative time, and images
- Links to original post and author profile
- Responsive design that adjusts to screen size

## Installation

1. Clone the repository: `git clone https://github.com/rstockm/mastowall.git`
2. Open `index.html` in your web browser.
3. If you want to change the hashtags, replace the `#bibliocon23`, `#111bibliocon`, and `#bibliocon` in the HTML file with your desired hashtags.
