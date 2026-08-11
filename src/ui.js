const EFFECT_LABELS = {
  shield: 'Shield',
  slowmo: 'Slow-Mo',
  magnet: 'Magnet',
  multiplier: 'Multiplier',
  ghost: 'Ghost',
  shrink: 'Shrink',
}

const EFFECT_ICONS = {
  shield: '\u{1F6E1}',
  slowmo: '\u{23F3}',
  magnet: '\u{1F9F2}',
  multiplier: '\u{2716}',
  ghost: '\u{1F47B}',
  shrink: '\u{1F4E6}',
}

const DEFAULT_ICON = '\u{2728}'

function formatEffectLabel(type) {
  if (EFFECT_LABELS[type]) return EFFECT_LABELS[type]
  return type
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatTime(seconds) {
  return seconds >= 10 ? Math.ceil(seconds).toString() : seconds.toFixed(1)
}

export class UIManager {
  constructor(container = document.body) {
    this.root = document.createElement('div')
    this.root.id = 'ui-root'
    container.appendChild(this.root)

    this._buildStartScreen()
    this._buildHUD()
    this._buildGameOverScreen()

    this._onStartCallback = null
    this._onRestartCallback = null
    this._keydownHandler = null
    this._effectNodes = new Map()

    this.hideAll()
  }

  _buildStartScreen() {
    const screen = document.createElement('div')
    screen.className = 'ui-screen ui-start-screen ui-hidden'

    screen.innerHTML = `
      <div class="ui-panel">
        <h1 class="ui-title">Flappy Bird</h1>
        <p class="ui-subtitle">Tap / Click / Space to Start</p>
        <button type="button" class="ui-button ui-play-button">Play</button>
      </div>
    `

    this.root.appendChild(screen)
    this.startScreen = screen
    this.playButton = screen.querySelector('.ui-play-button')
  }

  _buildHUD() {
    const hud = document.createElement('div')
    hud.className = 'ui-hud ui-hidden'

    hud.innerHTML = `
      <div class="ui-score" aria-live="polite">0</div>
      <div class="ui-multiplier-badge ui-hidden">x1</div>
      <div class="ui-effects"></div>
    `

    this.root.appendChild(hud)
    this.hud = hud
    this.scoreEl = hud.querySelector('.ui-score')
    this.multiplierBadge = hud.querySelector('.ui-multiplier-badge')
    this.effectsContainer = hud.querySelector('.ui-effects')
  }

  _buildGameOverScreen() {
    const screen = document.createElement('div')
    screen.className = 'ui-screen ui-gameover-screen ui-hidden'

    screen.innerHTML = `
      <div class="ui-panel">
        <h1 class="ui-title">Game Over</h1>
        <div class="ui-score-row">
          <span class="ui-score-label">Score</span>
          <span class="ui-final-score">0</span>
        </div>
        <div class="ui-score-row">
          <span class="ui-score-label">Best</span>
          <span class="ui-high-score">0</span>
        </div>
        <button type="button" class="ui-button ui-restart-button">Restart</button>
      </div>
    `

    this.root.appendChild(screen)
    this.gameOverScreen = screen
    this.finalScoreEl = screen.querySelector('.ui-final-score')
    this.highScoreEl = screen.querySelector('.ui-high-score')
    this.restartButton = screen.querySelector('.ui-restart-button')
  }

  _teardownKeydownHandler() {
    if (this._keydownHandler) {
      window.removeEventListener('keydown', this._keydownHandler)
      this._keydownHandler = null
    }
  }

  showStartScreen(onStart) {
    this.hideAll()
    this._onStartCallback = typeof onStart === 'function' ? onStart : null

    this.startScreen.classList.remove('ui-hidden')
    this.startScreen.classList.add('ui-interactive')

    const trigger = (event) => {
      event.preventDefault()
      if (this._onStartCallback) this._onStartCallback()
    }

    this.playButton.addEventListener('click', trigger)
    this.startScreen.addEventListener('click', trigger)

    this._teardownKeydownHandler()
    this._keydownHandler = (event) => {
      if (event.code === 'Space' || event.key === ' ') trigger(event)
    }
    window.addEventListener('keydown', this._keydownHandler)

    this._startTrigger = trigger
  }

  showHUD() {
    this.startScreen.classList.add('ui-hidden')
    this.startScreen.classList.remove('ui-interactive')
    this.gameOverScreen.classList.add('ui-hidden')
    this.gameOverScreen.classList.remove('ui-interactive')
    this._teardownKeydownHandler()

    this.hud.classList.remove('ui-hidden')
  }

  updateScore(score) {
    this.scoreEl.textContent = Math.floor(score).toString()
  }

  updateActiveEffects(effectsArray = []) {
    const seenTypes = new Set()

    for (const effect of effectsArray) {
      const { type, remainingTime } = effect
      seenTypes.add(type)

      let node = this._effectNodes.get(type)
      if (!node) {
        node = document.createElement('div')
        node.className = 'ui-effect-icon'
        node.innerHTML = `
          <svg class="ui-effect-ring" viewBox="0 0 40 40">
            <circle class="ui-effect-ring-bg" cx="20" cy="20" r="17"></circle>
            <circle class="ui-effect-ring-fg" cx="20" cy="20" r="17"></circle>
          </svg>
          <span class="ui-effect-glyph">${EFFECT_ICONS[type] || DEFAULT_ICON}</span>
          <span class="ui-effect-time"></span>
          <span class="ui-effect-tooltip">${formatEffectLabel(type)}</span>
        `
        this.effectsContainer.appendChild(node)
        this._effectNodes.set(type, {
          el: node,
          ring: node.querySelector('.ui-effect-ring-fg'),
          time: node.querySelector('.ui-effect-time'),
          maxDuration: remainingTime,
        })
        node = this._effectNodes.get(type)
      }

      if (remainingTime > node.maxDuration) node.maxDuration = remainingTime

      const ratio = node.maxDuration > 0 ? Math.max(0, Math.min(1, remainingTime / node.maxDuration)) : 0
      const circumference = 2 * Math.PI * 17
      node.ring.style.strokeDasharray = `${circumference}`
      node.ring.style.strokeDashoffset = `${circumference * (1 - ratio)}`
      node.time.textContent = formatTime(remainingTime)
    }

    for (const [type, node] of this._effectNodes) {
      if (!seenTypes.has(type)) {
        node.el.remove()
        this._effectNodes.delete(type)
      }
    }
  }

  updateMultiplier(multiplier) {
    if (!multiplier || multiplier <= 1) {
      this.multiplierBadge.classList.add('ui-hidden')
      return
    }
    this.multiplierBadge.classList.remove('ui-hidden')
    this.multiplierBadge.textContent = `x${multiplier}`
  }

  showGameOver({ score, highScore }, onRestart) {
    this.hud.classList.add('ui-hidden')
    this.startScreen.classList.add('ui-hidden')
    this.startScreen.classList.remove('ui-interactive')
    this._teardownKeydownHandler()

    this._onRestartCallback = typeof onRestart === 'function' ? onRestart : null

    this.finalScoreEl.textContent = Math.floor(score).toString()
    this.highScoreEl.textContent = Math.floor(highScore).toString()

    this.gameOverScreen.classList.remove('ui-hidden')
    this.gameOverScreen.classList.add('ui-interactive')

    const trigger = (event) => {
      event.preventDefault()
      if (this._onRestartCallback) this._onRestartCallback()
    }

    this.restartButton.removeEventListener('click', this._restartTrigger || (() => {}))
    this.restartButton.addEventListener('click', trigger)
    this._restartTrigger = trigger

    this._teardownKeydownHandler()
    this._keydownHandler = (event) => {
      if (event.code === 'Space' || event.key === ' ') trigger(event)
    }
    window.addEventListener('keydown', this._keydownHandler)
  }

  hideAll() {
    this.startScreen.classList.add('ui-hidden')
    this.startScreen.classList.remove('ui-interactive')
    this.hud.classList.add('ui-hidden')
    this.gameOverScreen.classList.add('ui-hidden')
    this.gameOverScreen.classList.remove('ui-interactive')
    this._teardownKeydownHandler()
  }
}

export function createUI(container) {
  return new UIManager(container)
}
