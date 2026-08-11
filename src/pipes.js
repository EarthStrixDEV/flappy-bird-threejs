import * as THREE from 'three';
import {
  SCROLL_SPEED,
  PIPE_SPACING_Z,
  PIPE_GAP,
  SPAWN_Z,
  DESPAWN_Z,
  BIRD_Y_MIN,
  BIRD_Y_MAX,
} from './constants.js';

const PIPE_COUNT = Math.max(4, Math.ceil((DESPAWN_Z - SPAWN_Z) / PIPE_SPACING_Z) + 2);
const PIPE_RADIUS = 0.6;
const RIM_RADIUS = PIPE_RADIUS + 0.08;
const RIM_HEIGHT = 0.35;
const PIPE_TALL_LENGTH = 12;
const MIN_PIPE_GAP = 1.6;
const GAP_CENTER_MIN = 1.5;
const GAP_CENTER_MAX = 6.5;
const GAP_MARGIN = 0.4;

const DIFFICULTY_TIER_SECONDS = 8;
const GAP_SHRINK_PER_TIER = 0.06;
const SPEED_GAIN_PER_TIER = 0.04;
const MAX_SPEED_MULTIPLIER_FROM_DIFFICULTY = 1.6;

const PIPE_BODY_COLOR = 0x3ea653;
const PIPE_RIM_COLOR = 0x2f7d43;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

class PipePair {
  constructor(scene, materials) {
    this.id = -1;
    this.z = SPAWN_Z;
    this.gapCenterY = 3;
    this.gapHeight = PIPE_GAP;
    this.scored = false;

    this.group = new THREE.Group();

    const bodyGeometry = new THREE.CylinderGeometry(
      PIPE_RADIUS,
      PIPE_RADIUS,
      PIPE_TALL_LENGTH,
      16,
      1
    );
    const rimGeometry = new THREE.CylinderGeometry(
      RIM_RADIUS,
      RIM_RADIUS,
      RIM_HEIGHT,
      16,
      1
    );

    this.topBody = new THREE.Mesh(bodyGeometry, materials.body);
    this.topBody.castShadow = true;
    this.topBody.receiveShadow = true;

    this.topRim = new THREE.Mesh(rimGeometry, materials.rim);
    this.topRim.castShadow = true;
    this.topRim.receiveShadow = true;

    this.bottomBody = new THREE.Mesh(bodyGeometry, materials.body);
    this.bottomBody.castShadow = true;
    this.bottomBody.receiveShadow = true;

    this.bottomRim = new THREE.Mesh(rimGeometry, materials.rim);
    this.bottomRim.castShadow = true;
    this.bottomRim.receiveShadow = true;

    this.group.add(this.topBody, this.topRim, this.bottomBody, this.bottomRim);
    scene.add(this.group);

    this.topBox = new THREE.Box3();
    this.bottomBox = new THREE.Box3();

    this._tmpBox = new THREE.Box3();
  }

  applyLayout(gapCenterY, gapHeight) {
    this.gapCenterY = gapCenterY;
    this.gapHeight = gapHeight;

    const gapTop = gapCenterY + gapHeight / 2;
    const gapBottom = gapCenterY - gapHeight / 2;

    const topBodyCenterY = gapTop + PIPE_TALL_LENGTH / 2;
    this.topBody.position.y = topBodyCenterY;
    this.topRim.position.y = gapTop + RIM_HEIGHT / 2;

    const bottomBodyCenterY = gapBottom - PIPE_TALL_LENGTH / 2;
    this.bottomBody.position.y = bottomBodyCenterY;
    this.bottomRim.position.y = gapBottom - RIM_HEIGHT / 2;
  }

  setZ(z) {
    this.z = z;
    this.group.position.z = z;
  }

  updateColliders() {
    this.group.updateMatrixWorld(true);

    this._tmpBox.setFromObject(this.topBody, true);
    this.topBox.copy(this._tmpBox);
    this._tmpBox.setFromObject(this.topRim, true);
    this.topBox.union(this._tmpBox);

    this._tmpBox.setFromObject(this.bottomBody, true);
    this.bottomBox.copy(this._tmpBox);
    this._tmpBox.setFromObject(this.bottomRim, true);
    this.bottomBox.union(this._tmpBox);
  }

  dispose() {
    this.group.parent?.remove(this.group);
    this.topBody.geometry.dispose();
    this.topRim.geometry.dispose();
    this.bottomBody.geometry.dispose();
    this.bottomRim.geometry.dispose();
  }
}

export class PipeManager {
  constructor(scene) {
    this.scene = scene;

    this.materials = {
      body: new THREE.MeshStandardMaterial({
        color: PIPE_BODY_COLOR,
        roughness: 0.6,
        metalness: 0.1,
      }),
      rim: new THREE.MeshStandardMaterial({
        color: PIPE_RIM_COLOR,
        roughness: 0.5,
        metalness: 0.15,
      }),
    };

    this.pool = [];
    this._nextId = 0;
    this._elapsedTime = 0;
    this._difficultyTier = 0;
    this.difficultyGapReduction = 0;
    this.difficultySpeedBonus = 0;

    for (let i = 0; i < PIPE_COUNT; i += 1) {
      this.pool.push(new PipePair(scene, this.materials));
    }

    this.reset();
  }

  _currentGapHeight() {
    return clamp(PIPE_GAP - this.difficultyGapReduction, MIN_PIPE_GAP, PIPE_GAP);
  }

  _randomGapCenter(gapHeight) {
    const min = GAP_CENTER_MIN + gapHeight / 2;
    const max = GAP_CENTER_MAX - gapHeight / 2;
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return clamp(randomRange(lo, hi), BIRD_Y_MIN + GAP_MARGIN, BIRD_Y_MAX - GAP_MARGIN);
  }

  _spawnAt(pipe, z) {
    const gapHeight = this._currentGapHeight();
    const gapCenterY = this._randomGapCenter(gapHeight);
    pipe.id = this._nextId;
    this._nextId += 1;
    pipe.scored = false;
    pipe.applyLayout(gapCenterY, gapHeight);
    pipe.setZ(z);
    pipe.updateColliders();
  }

  reset() {
    this._elapsedTime = 0;
    this._difficultyTier = 0;
    this.difficultyGapReduction = 0;
    this.difficultySpeedBonus = 0;
    this._nextId = 0;

    // Every pipe starts behind SPAWN_Z, spaced PIPE_SPACING_Z apart, so the
    // first one the bird meets is a full spacing away from Z=0 (the bird's
    // fixed Z) and none of them start on top of the bird or the camera.
    for (let i = 0; i < this.pool.length; i += 1) {
      const z = SPAWN_Z - i * PIPE_SPACING_Z;
      this._spawnAt(this.pool[i], z);
    }
  }

  _advanceDifficulty(dt) {
    this._elapsedTime += dt;
    const tier = Math.floor(this._elapsedTime / DIFFICULTY_TIER_SECONDS);
    if (tier === this._difficultyTier) return;
    this._difficultyTier = tier;
    this.difficultyGapReduction = tier * GAP_SHRINK_PER_TIER;
    this.difficultySpeedBonus = Math.min(
      tier * SPEED_GAIN_PER_TIER,
      MAX_SPEED_MULTIPLIER_FROM_DIFFICULTY - 1
    );
  }

  update(dt, speedMultiplier = 1) {
    this._advanceDifficulty(dt);

    const effectiveSpeed =
      SCROLL_SPEED * (1 + this.difficultySpeedBonus) * speedMultiplier * dt;

    for (const pipe of this.pool) {
      const newZ = pipe.z + effectiveSpeed;

      if (newZ > DESPAWN_Z) {
        this._spawnAt(pipe, newZ - (DESPAWN_Z - SPAWN_Z));
      } else {
        pipe.setZ(newZ);
        pipe.updateColliders();
      }
    }
  }

  getActivePipes() {
    return this.pool.map((pipe) => ({
      topBox: pipe.topBox,
      bottomBox: pipe.bottomBox,
      id: pipe.id,
      scored: pipe.scored,
      z: pipe.z,
    }));
  }

  markScored(id) {
    const pipe = this.pool.find((p) => p.id === id);
    if (pipe) pipe.scored = true;
  }

  dispose() {
    for (const pipe of this.pool) {
      pipe.dispose();
    }
    this.materials.body.dispose();
    this.materials.rim.dispose();
  }
}
