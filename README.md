# Neon Pong Game 🏓

A modern, responsive arcade-style Pong game built with pure HTML5, CSS3, and JavaScript featuring intelligent computer AI, mobile-friendly touch controls, customizable difficulty levels, and synthesized Web Audio sound effects.

---

## 🌟 Key Features

- 🎮 **Computer AI Opponent**: Play against an AI paddle with 3 distinct difficulty modes (*Easy*, *Medium*, and *Hard*).
- 📱 **Mobile & Desktop Support**:
  - **Desktop**: Keyboard controls (`W` / `S` or `Up` / `Down` arrow keys) and `Spacebar` for pause.
  - **Mobile**: Touch-and-drag directly on the canvas or use the responsive on-screen **UP** / **DOWN** buttons.
- 🔊 **Retro Sound Effects**: Built-in Web Audio API synthesizer for retro sound effects without external audio files. Audio toggle included.
- 🎨 **Neon Cyberpunk Design**: Clean glowing arcade aesthetic with smooth canvas rendering (`requestAnimationFrame`).
- ⚡ **Dynamic Ball Physics**: Spin and angle calculation based on paddle contact point, with progressive speed acceleration.

---

## 🚀 How to Play Locally

Since this is a client-side static web application, no complex backend or build process is required!

1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/your-username/pong-game.git
   cd pong-game
   ```

2. **Run Locally**:
   - Simply double click `index.html` to open it in any modern web browser.
   - Or serve with any static web server (e.g. Python, Node.js http-server, Live Server VS Code extension):
     ```bash
     python3 -m http.server 8000
     ```
     Then navigate to `http://localhost:8000` in your web browser.

---

## 🕹️ Game Controls Guide

| Device | Control | Action |
| :--- | :--- | :--- |
| **Keyboard** | <kbd>W</kbd> / <kbd>S</kbd> or <kbd>↑</kbd> / <kbd>↓</kbd> | Move Left Paddle Up / Down |
| **Keyboard** | <kbd>Space</kbd> | Pause / Resume Game |
| **Touch / Mobile** | Drag on Canvas | Smoothly move paddle to touch position |
| **Touch / Mobile** | On-screen ▲ / ▼ Buttons | Move paddle Up / Down |
| **Mouse / UI** | Start / Pause / Reset | Control match flow and restart game |

---

## 🎯 Winning Condition

First to score **7 points** wins the match!

---

## 🛠️ Built With

- **HTML5**: Game layout and canvas element
- **CSS3**: Cyberpunk neon theme, flexbox, CSS grid, and responsive media queries
- **JavaScript (ES6+)**: HTML5 Canvas rendering engine, physics simulation, AI tracking algorithm, and Web Audio API synthesizer
