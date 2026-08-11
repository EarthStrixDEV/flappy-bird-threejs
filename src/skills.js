// NOTE: values must match items.js's ITEM_TYPES exactly (lowercase) since
// applyItem() receives {type, value} objects produced by ItemManager.checkPickups().
export const SKILL_TYPES = Object.freeze({
  SHIELD: 'shield',
  SLOWMO: 'slowmo',
  SHRINK: 'shrink',
  MULTIPLIER: 'multiplier',
})

const SLOWMO_DURATION = 5
const SLOWMO_SPEED_MULTIPLIER = 0.5

const SHRINK_DURATION = 6
const SHRINK_FACTOR = 0.5

const MULTIPLIER_DURATION = 8

export class SkillManager {
  constructor() {
    this.reset()
  }

  reset() {
    this._shieldActive = false
    this._slowmoRemaining = 0
    this._shrinkRemaining = 0
    this._multiplierRemaining = 0
    this._multiplierValue = 1
  }

  applyItem({ type, value }) {
    switch (type) {
      case SKILL_TYPES.SHIELD:
        this._shieldActive = true
        break
      case SKILL_TYPES.SLOWMO:
        this._slowmoRemaining = SLOWMO_DURATION
        break
      case SKILL_TYPES.SHRINK:
        this._shrinkRemaining = SHRINK_DURATION
        break
      case SKILL_TYPES.MULTIPLIER:
        this._multiplierRemaining = MULTIPLIER_DURATION
        this._multiplierValue = typeof value === 'number' && value > 0 ? value : 2
        break
      default:
        break
    }
  }

  update(dt) {
    if (this._slowmoRemaining > 0) {
      this._slowmoRemaining = Math.max(0, this._slowmoRemaining - dt)
    }
    if (this._shrinkRemaining > 0) {
      this._shrinkRemaining = Math.max(0, this._shrinkRemaining - dt)
    }
    if (this._multiplierRemaining > 0) {
      this._multiplierRemaining = Math.max(0, this._multiplierRemaining - dt)
      if (this._multiplierRemaining === 0) {
        this._multiplierValue = 1
      }
    }
  }

  hasShield() {
    return this._shieldActive
  }

  consumeShield() {
    if (!this._shieldActive) return false
    this._shieldActive = false
    return true
  }

  getSpeedMultiplier() {
    return this._slowmoRemaining > 0 ? SLOWMO_SPEED_MULTIPLIER : 1
  }

  getShrinkFactor() {
    return this._shrinkRemaining > 0 ? SHRINK_FACTOR : 1
  }

  getScoreMultiplier() {
    return this._multiplierRemaining > 0 ? this._multiplierValue : 1
  }

  getActiveEffects() {
    const effects = []
    if (this._shieldActive) {
      effects.push({ type: SKILL_TYPES.SHIELD, remainingTime: Infinity })
    }
    if (this._slowmoRemaining > 0) {
      effects.push({ type: SKILL_TYPES.SLOWMO, remainingTime: this._slowmoRemaining })
    }
    if (this._shrinkRemaining > 0) {
      effects.push({ type: SKILL_TYPES.SHRINK, remainingTime: this._shrinkRemaining })
    }
    if (this._multiplierRemaining > 0) {
      effects.push({ type: SKILL_TYPES.MULTIPLIER, remainingTime: this._multiplierRemaining })
    }
    return effects
  }
}

export function createSkillManager() {
  return new SkillManager()
}
