# Mastowall 0.2

Mastowall is a social wall application that displays posts from the [Mastodon](https://joinmastodon.org/) social network based on specified hashtags. It has been updated with new features to improve its usability and appearance.

<img width="1520" alt="image" src="https://github.com/rstockm/mastowall/assets/3195116/d26fe65b-159b-4098-ad5b-bc551049b16d">

Try it live: [Mastowall for the BiblioCon conference](http://wp1187670.server-he.de/mastowall/?hashtags=111bibliocon,bibliocon,bibliocon23&server=https://openbiblio.social)

Use your own hashtags and server:

<img width="1188" alt="image" src="https://github.com/rstockm/mastowall/assets/3195116/98d7e33f-49a7-4f89-81d3-8762942440fa">


## Features

- **Display Posts:** The app fetches and displays posts from Mastodon based on the hashtags provided in the URL. If no hashtags are provided, it presents a form to enter up to three hashtags.

- **Custom Mastodon Server:** Allows users to specify a Mastodon server URL from which to fetch posts.

- **Real-Time Updates:** Mastowall updates the posts every 10 seconds, ensuring that the content displayed is always current.

- **Relative Timestamps:** The timestamps of the posts are displayed relative to the current time, and are updated every minute to reflect the passing time.

- **Masonry Grid Layout:** The posts are displayed in a masonry grid layout for a visually pleasing experience. 

- **Responsive Design:** The layout adjusts according to the screen size for better readability on different devices.

- **Navbar Hashtag Navigation:** Clicking on the hashtags in the navbar takes you to the form screen, allowing you to change the existing hashtags easily.

## Technology Stack

Mastowall is built using the following technologies:

- **HTML, CSS, and JavaScript**: For structuring, styling, and functionality.

- **[jQuery](https://jquery.com/)**: A fast, small, and feature-rich JavaScript library.

- **[Masonry](https://masonry.desandro.com/)**: A JavaScript grid layout library.

- **[Bootstrap](https://getbootstrap.com/)**: A popular CSS framework for responsive, mobile-first front-end web development.

## Usage

1. Load the application in a web browser. If no hashtags are specified in the URL, you will be presented with a form to enter up to three hashtags and a server URL.

2. After entering your hashtags and clicking 'Reload', the application will fetch and display posts from the specified Mastodon server that include those hashtags.

3. The displayed posts will update every 10 seconds. The relative timestamps will also update every minute.

4. To change the hashtags, click on them in the navbar to go back to the form screen.

## Sharing via URL

Mastowall supports URL parameters to easily share specific hashtag configurations and the Mastodon server. Simply append the desired hashtags and the server URL to the URL following this format: `?hashtags=hashtag1,hashtag2,hashtag3&server=serverUrl`

Enjoy using Mastowall 0.2!

## AI-Guided Development: A Proof of Concept

Mastowall 0.2 serves as an example of how artificial intelligence can aid and accelerate the software development process. The development of this version of the app was guided by OpenAI's GPT-4, a large language model.

In this process, the human developer posed problems, asked questions, and described the desired features and functionalities of the application. GPT-4 then provided solutions, answered queries, generated code snippets, and suggested optimal ways to implement these features.

Every single line of code was written by ChatGPT4.
