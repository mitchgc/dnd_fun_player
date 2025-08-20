# D&D Companion App 🎲

A beautiful, iPad-optimized D&D companion app designed specifically for new players learning the game mechanics. Built with React and designed to make D&D combat engaging and accessible.

**🌐 Live Demo:** [https://mitchgc.github.io/dnd_fun_player/](https://mitchgc.github.io/dnd_fun_player/)

## 🌟 Features

### 🎯 Action Economy Teaching
- Clear Action (1) / Bonus Action (1) / Movement (30ft) structure
- Visual Available/Used indicators prevent illegal moves
- Smart button disabling teaches turn limitations

### 🎲 Engaging Dice System
- 3-phase rolling: Animation → Raw Result → Final Calculation
- Authentic D&D suspense with BG3-style drama
- Consistent across all roll types (attacks, initiative, stealth)

### 🗡️ Character-Specific Optimization
- Built for Rogue Scout mechanics (Cunning Action, Sneak Attack)
- Smart damage calculation (advantage, critical hits, stealth)
- Weapon-specific attack options with clear damage ranges

### 📱 iPad-Optimized
- Large touch targets and clear visual hierarchy
- Landscape-oriented design perfect for tabletop use
- Smooth animations and playful design elements

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm start

# Open http://localhost:3000 in your browser
```

### Production Build
```bash
# Create production build
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 🎮 How to Use

1. **Start Battle**: Click "🎲 Start Battle" to roll initiative
2. **Take Actions**: Use your Action and Bonus Action each turn
3. **Attack**: Choose between Rapier and Shortbow attacks
4. **Hide**: Use Cunning Action to gain stealth advantage
5. **End Turn**: Reset your actions for the next round

## 🏗️ Built With

- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Create React App** - Zero-config build setup

## 🎨 Design Philosophy

**"Guided Discovery"** - Teach proper D&D mechanics through intuitive design rather than hiding them. Make every interaction feel authentic to tabletop D&D while removing cognitive overhead.

- **Engaging over Efficient** - Capture the magic of rolling dice
- **Beautiful & Playful** - Don't take yourself too seriously
- **iPad-First** - Designed for tabletop use

## 📂 Project Structure

```
src/
├── App.js          # Main application component
├── index.js        # React entry point
├── index.css       # Tailwind styles and custom animations
public/
├── index.html      # HTML template optimized for iPad
├── manifest.json   # PWA manifest
tailwind.config.js  # Tailwind configuration
package.json        # Dependencies and scripts
```

## 🔧 Customization

The app is currently hardcoded for a Yuan-ti Rogue Scout character. To customize:

1. **Character Stats**: Edit the `character` object in `App.js`
2. **Styling**: Modify colors and animations in `tailwind.config.js`
3. **Features**: Add new actions or abilities in the respective handler functions

## 📱 PWA Features

- **Offline Support**: Works without internet after first load
- **Add to Home Screen**: Install like a native app
- **Optimized for iPad**: Perfect for tabletop gaming

## 🤝 Contributing

This is a personal project designed for a specific use case, but suggestions and improvements are welcome!

## 📄 License

MIT License - feel free to use this for your own D&D adventures!

---

*Made with ❤️ for new D&D players everywhere* 🐉