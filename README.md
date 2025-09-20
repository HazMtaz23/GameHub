# GameHub - Your Gaming Destination

A modern, clean website built with Tailwind CSS for hosting multiple games with a beautiful, responsive home screen.

## Features

- **Clean, Modern Design**: Built with Tailwind CSS for a sleek, professional look
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Interactive Elements**: Smooth animations and hover effects
- **Game Cards**: Ready-to-use template for adding new games
- **Navigation**: Smooth scrolling navigation with mobile menu support
- **Accessibility**: Focus states and semantic HTML for better accessibility

## Project Structure

```
/
├── index.html              # Main home page
├── styles/
│   └── custom.css          # Custom CSS styles
├── js/
│   └── main.js            # Main JavaScript functionality
├── games/                 # Directory for individual games
├── assets/                # Images and other assets
└── .github/
    └── copilot-instructions.md
```

## Getting Started

1. **Clone or download the project**
2. **Open `index.html` in your web browser** or use a local server
3. **Start adding your games** in the `games/` directory

### Using a Local Server (Recommended)

For the best development experience, use a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using VS Code Live Server extension
# Right-click index.html and select "Open with Live Server"
```

Then navigate to `http://localhost:8000` in your browser.

## Adding New Games

To add a new game to your GameHub:

1. **Create a new directory** in the `games/` folder for your game
2. **Add your game files** (HTML, CSS, JS, assets)
3. **Update the home screen** by modifying the game cards in `index.html`
4. **Use the GameHub.addGame() function** in JavaScript for dynamic game addition

### Example Game Card

```javascript
GameHub.addGame({
    title: "My New Game",
    description: "An exciting new game to play",
    icon: "🎮",
    gradientColors: "from-blue-500 to-purple-600",
    hoverGradient: "from-purple-500 to-blue-600",
    buttonColors: "from-blue-500 to-purple-600",
    buttonHover: "from-purple-500 to-blue-600",
    available: true,
    onClick: () => GameHub.navigateToGame('my-new-game')
});
```

## Customization

### Colors
The project uses a custom color palette defined in the Tailwind config:
- `game-primary`: #6366f1 (Indigo)
- `game-secondary`: #8b5cf6 (Violet) 
- `game-accent`: #ec4899 (Pink)

### Styling
- Modify `styles/custom.css` for additional custom styles
- Update the Tailwind config in `index.html` for theme changes
- Game cards use glassmorphism effects with backdrop blur

### JavaScript
- Main functionality is in `js/main.js`
- The `GameHub` object provides utilities for game management
- Mobile menu, smooth scrolling, and animations are included

## Browser Support

This project supports all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Technologies Used

- **HTML5**: Semantic markup
- **Tailwind CSS**: Utility-first CSS framework
- **Vanilla JavaScript**: No dependencies, pure JavaScript
- **CSS3**: Custom animations and effects

## Future Enhancements

- [ ] Game categories and filtering
- [ ] Search functionality
- [ ] User accounts and progress tracking
- [ ] Leaderboards and achievements
- [ ] Social features and sharing
- [ ] PWA support for offline play

## Contributing

Feel free to contribute by:
1. Adding new games
2. Improving the UI/UX
3. Adding new features
4. Fixing bugs

## License

This project is open source and available under the MIT License.
