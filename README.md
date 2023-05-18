# Mastowall 0.2

Mastowall is a social wall application that displays posts from the Mastodon social network based on specified hashtags. It has been updated with new features to improve its usability and appearance.

## Features

- **Display Posts:** The app fetches and displays posts from Mastodon based on the hashtags provided in the URL. If no hashtags are provided, it presents a form to enter up to three hashtags.

- **Real-Time Updates:** Mastowall updates the posts every 10 seconds, ensuring that the content displayed is always current.

- **Relative Timestamps:** The timestamps of the posts are displayed relative to the current time, and are updated every minute to reflect the passing time.

- **Masonry Grid Layout:** The posts are displayed in a masonry grid layout for a visually pleasing experience. 

- **Responsive Design:** The layout adjusts according to the screen size for better readability on different devices.

- **Navbar Hashtag Navigation:** Clicking on the hashtags in the navbar takes you to the form screen, allowing you to change the existing hashtags easily.

## Technology Stack

Mastowall is built using the following technologies:

- **HTML, CSS, and JavaScript**: For structuring, styling, and functionality.

- **jQuery**: A fast, small, and feature-rich JavaScript library.

- **Masonry**: A JavaScript grid layout library.

- **Bootstrap**: A popular CSS framework for responsive, mobile-first front-end web development.

## Usage

1. Load the application in a web browser. If no hashtags are specified in the URL, you will be presented with a form to enter up to three hashtags.

2. After entering your hashtags and clicking 'Reload', the application will fetch and display posts from Mastodon that include those hashtags.

3. The displayed posts will update every 10 seconds. The relative timestamps will also update every minute.

4. To change the hashtags, click on them in the navbar to go back to the form screen.

## Sharing via URL

Mastowall supports URL parameters to easily share specific hashtag configurations. Simply append the desired hashtags to the URL following this format: `?hashtags=hashtag1,hashtag2,hashtag3`

Enjoy using Mastowall 0.2!
