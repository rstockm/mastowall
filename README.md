# Mastowall 2

Mastowall is a modern social wall application that displays posts from the [Mastodon](https://joinmastodon.org/) social network. It was written entirely by AI ([Claude Sonnet 4.5](https://www.anthropic.com/), ChatGPT 4, and ChatGPT 5), guided only by text prompts.

<img width="1348" alt="image" src="https://github.com/rstockm/mastowall/assets/3195116/7060536e-4847-4e38-801e-3c0312b8b194">

🔗 **[Try it live](https://rstockm.github.io/mastowall/)**

## Screenshots

*Coming soon - Screenshots will be added after deployment*

## ✨ Features

### 🎨 **Modern UI Design**
- **Three View Modes:** Switch between Grid (Posts), People (Avatar Cards), and Settings
- **Sticky Header:** Always accessible navigation with smooth animations
- **Responsive Masonry Layout:** Beautiful grid that adapts to any screen size
- **Clean & Modern:** Professional white design with subtle gradients and shadows

### 📱 **Content Display**
- **Real-Time Updates:** Posts refresh every 10 seconds automatically
- **Rich Media Support:** Display images, videos, and multi-image carousals
- **Lightbox View:** Click any media to see it in full-screen overlay
- **Relative Timestamps:** Human-readable time display (e.g., "5 minutes ago")
- **Avatar Cards:** View contributors grouped by author with post counts
- **Smart Filtering:** Exclude replies or include them based on your needs

### 🔧 **Configuration**
- **URL Parameters:** Easy sharing with `?hashtags=tag1,tag2&server=mastodon.social`
- **Zero State Screen:** Intuitive setup for first-time visitors
- **Multi-Server Support:** Connect to any Mastodon instance
- **Follow Feature:** Authenticated users can follow contributors directly
- **Share Function:** Copy current configuration to clipboard

### 🔐 **Privacy & Security**
- **Client-Side First:** Most processing happens in your browser
- **Secure Authentication:** OAuth 2.0 for Mastodon connections
- **No Data Storage:** Your configuration stays in the URL, not on servers

## 🛠️ Technology Stack

- **[Bootstrap 5](https://getbootstrap.com/)** - Modern responsive framework
- **[jQuery](https://jquery.com/)** - DOM manipulation and AJAX
- **[Masonry](https://masonry.desandro.com/)** - Cascading grid layout
- **[DOMPurify](https://github.com/cure53/DOMPurify)** - XSS protection for user-generated content
- **[Bootstrap Icons](https://icons.getbootstrap.com/)** - Icon library
- **Vanilla JavaScript** - Modern ES6+ for application logic

## 🚀 Quick Start

### Basic Usage

1. **Visit** [https://rstockm.github.io/mastowall/](https://rstockm.github.io/mastowall/)
2. **Enter** up to 3 hashtags you want to follow
3. **Select** a Mastodon server (default: mastodon.social)
4. **Click** "Start" and watch the wall come alive!

### URL Parameters

Share specific configurations by using URL parameters:

```
https://rstockm.github.io/mastowall/?hashtags=wwdc,apple&server=mastodon.social
```

**Parameters:**
- `hashtags` - Comma-separated list of hashtags (no # symbol needed)
- `server` - Mastodon instance URL (e.g., `mastodon.social`)

### Connect to Mastodon (Optional)

To use the Follow feature:

1. Click the **Connect** button (🔗 icon) in the header
2. Enter your own Mastodon instance URL
3. Authorize the connection
4. Follow contributors directly from the People view

*Note: Authentication is handled securely via OAuth 2.0. Your credentials are never stored.*

## 🤝 Related Projects

- **[Mastotags](https://rstockm.github.io/mastotags/)** - Discover trending hashtag combinations

## 🤖 AI-Powered Development

Mastowall 2 demonstrates the potential of AI-assisted software development. The entire application—including all code, UI/UX design, and documentation—was created through conversations with multiple AI models: **Claude Sonnet 4.5** (Anthropic), **ChatGPT 4** (OpenAI), and **ChatGPT 5** (OpenAI).

The development process:
- Human developer described desired features and requirements
- AI models provided solutions, code implementations, and optimization suggestions
- Iterative refinement through natural language conversation
- **Every line of code** was written by AI

This project serves as a proof of concept for modern AI-assisted development workflows.

## 📝 License

This project is open source and available under the MIT License.

## 👤 Author

**Ralf Stockmann** ([@rstockm](https://github.com/rstockm))
- Prompting & Project Direction
- AI Collaboration & Workflow Design

---

**Powered by AI** 🤖 | **Built for Mastodon** 🐘 | **Made with ❤️**
