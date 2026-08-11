<div align="center">

```
██████╗ ██╗       █████╗ ██████╗ ██████╗ ██╗   ██╗
██╔══██╗██║      ██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝
██████╔╝██║      ███████║██████╔╝██████╔╝ ╚████╔╝
██╔══██╗██║      ██╔══██║██╔═══╝ ██╔═══╝   ╚██╔╝
██║  ██║███████╗ ██║  ██║██║     ██║        ██║
╚═╝  ╚═╝╚══════╝ ╚═╝  ╚═╝╚═╝     ╚═╝        ╚═╝
        ★ B I R D   3 D ★  —  I N S E R T   C O I N
```

**A semi-3D arcade remix of Flappy Bird — built with Three.js**

[![Play Now](https://img.shields.io/badge/▶_PLAY-NOW-ffcc33?style=for-the-badge&labelColor=1a1a2e)](#-getting-started)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-6ec6ff?style=for-the-badge&labelColor=1a1a2e)](#-license)

</div>

---

## 🕹️ ABOUT

A little yellow bird, an endless pipe corridor, and a camera that never blinks.
`flappy-bird-threejs` reimagines the classic in **semi-3D perspective** — real
shadow-casting light, a gradient sky dome, and pipes you fly *through*, not
past. Tap to flap, thread the gap, and don't clip the ceiling.

```
        ☁️                    ☁️
              🐦
               \
                \
      🟩│  │🟩          🟢 Score: 12
      🟩│  │🟩          ✨ x2 Multiplier
      🟩│  │🟩
  ══════════════════════════════════
```

## ✨ FEATURES

| | |
|---|---|
| 🌤️ | **Semi-3D visuals** — perspective camera, gradient sky dome, soft ground fog |
| 💡 | **Real-time lighting** — shadow-mapped directional light + hemisphere fill |
| 🐤 | **Procedural bird** — flapping wings, velocity-based tilt, no sprites |
| 🟢 | **Pooled pipe obstacles** — recycled geometry, scaling difficulty over time |
| 🎯 | **Score & high score** — persisted locally, always chasing your best run |
| 💎 | **Collectible power-ups** — grab orbs mid-flight for temporary skills |
| ✖️ | **Score multipliers** — stack points while the multiplier is active |
| 📱 | **Space / Click / Tap** — plays the same on desktop and mobile |

## 💎 POWER-UPS

| Icon | Skill | Effect |
|:---:|---|---|
| 🛡️ | **Shield** | Absorbs one pipe collision, then breaks |
| ⏳ | **Slow-Mo** | Halves world scroll speed for a few seconds |
| 📦 | **Shrink** | Shrinks the bird for a tighter hitbox through narrow gaps |
| ✖️ | **Multiplier** | Doubles points earned while active |

## 🚀 GETTING STARTED

```bash
# clone the cabinet
git clone https://github.com/EarthStrixDEV/flappy-bird-threejs.git
cd flappy-bird-threejs

# install dependencies
npm install

# insert coin
npm run dev
```

Open the printed `localhost` URL, hit **Play**, and start flapping.

### Other commands

```bash
npm run build      # production build → dist/
npm run preview    # preview the production build locally
```

## 🎮 CONTROLS

| Input | Action |
|---|---|
| `Space` | Flap |
| `Click` / `Tap` | Flap |
| `Space` on Game Over | Restart |

## 🛠️ TECH STACK

- **[Three.js](https://threejs.org/)** — 3D scene, lighting, shadows, rendering
- **[Vite](https://vitejs.dev/)** — dev server & build tooling
- Vanilla JavaScript (ES modules) — no framework, no build-step magic

## 📁 PROJECT STRUCTURE

```
src/
├── main.js         # game loop, input, state wiring
├── scene.js        # camera, renderer, lighting rig, sky & ground
├── bird.js         # bird mesh, flap physics, tilt animation
├── pipes.js        # pooled pipe obstacles, spawning, collision boxes
├── items.js        # collectible power-ups, pickup detection
├── skills.js        # active skill timers & effects
├── gameState.js     # start / playing / game-over state machine, scoring
├── ui.js            # HUD, start screen, game-over screen
└── style.css         # UI overlay styling
```

## 🏆 HIGH SCORE

Your best run is saved locally in the browser — come back anytime and try
to beat it. No account, no leaderboard server, just you versus the pipes.

---

<div align="center">

**GAME OVER? PRESS SPACE TO CONTINUE**

Made with 🐦 and Three.js

</div>
