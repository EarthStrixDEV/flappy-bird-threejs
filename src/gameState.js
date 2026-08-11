import { createSkillManager } from './skills.js'

const HIGH_SCORE_KEY = 'flappy-bird-high-score'

const STATES = Object.freeze({
  START: 'start',
  PLAYING: 'playing',
  GAMEOVER: 'gameover',
})

function readHighScore() {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY)
    const parsed = Number(stored)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  } catch {
    return 0
  }
}

function writeHighScore(value) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(value))
  } catch {
    // localStorage unavailable (e.g. private mode) — fail silently, in-memory value still holds
  }
}

function toRange(min, max) {
  return { min, max }
}

function boxToRanges(box) {
  return {
    x: toRange(box.min.x, box.max.x),
    y: toRange(box.min.y, box.max.y),
    z: toRange(box.min.z, box.max.z),
  }
}

function sphereToRanges(collider) {
  const { position, radius } = collider
  return {
    x: toRange(position.x - radius, position.x + radius),
    y: toRange(position.y - radius, position.y + radius),
    z: toRange(position.z - radius, position.z + radius),
  }
}

function isBox3Like(collider) {
  return collider && collider.min && collider.max
}

function toAabbRanges(collider) {
  return isBox3Like(collider) ? boxToRanges(collider) : sphereToRanges(collider)
}

function rangesIntersect(a, b) {
  return (
    a.x.min <= b.x.max &&
    a.x.max >= b.x.min &&
    a.y.min <= b.y.max &&
    a.y.max >= b.y.min &&
    a.z.min <= b.z.max &&
    a.z.max >= b.z.min
  )
}

function boxesIntersect(colliderA, colliderB) {
  return rangesIntersect(toAabbRanges(colliderA), toAabbRanges(colliderB))
}

export class GameState {
  constructor(skillManager = createSkillManager()) {
    this.skills = skillManager
    this._state = STATES.START
    this._score = 0
    this._highScore = readHighScore()
  }

  startGame() {
    this._state = STATES.PLAYING
    this._score = 0
    this.skills.reset()
  }

  endGame() {
    this._state = STATES.GAMEOVER
    if (this._score > this._highScore) {
      this._highScore = this._score
      writeHighScore(this._highScore)
    }
  }

  restart() {
    this._state = STATES.PLAYING
    this._score = 0
    this.skills.reset()
  }

  getState() {
    return this._state
  }

  addScore(basePoints = 1) {
    const multiplier = this.skills.getScoreMultiplier()
    this._score += basePoints * multiplier
    return this._score
  }

  getScore() {
    return this._score
  }

  getHighScore() {
    return this._highScore
  }

  checkPipeCollision(birdBox, pipeBoxes) {
    const collided = pipeBoxes.some((pipeBox) => boxesIntersect(birdBox, pipeBox))
    if (!collided) return false

    if (this.skills.hasShield()) {
      this.skills.consumeShield()
      return false
    }

    return true
  }
}

export function createGameState(skillManager) {
  return new GameState(skillManager)
}
