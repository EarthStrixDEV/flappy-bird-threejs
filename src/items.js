import * as THREE from 'three';
import {
  BIRD_X,
  SPAWN_Z,
  DESPAWN_Z,
  SCROLL_SPEED,
  GROUND_Y,
  BIRD_Y_MIN,
  BIRD_Y_MAX,
} from './constants.js';

export const ITEM_TYPES = Object.freeze({
  SHIELD: 'shield',
  SLOWMO: 'slowmo',
  SHRINK: 'shrink',
  MULTIPLIER: 'multiplier',
});

const ITEM_RADIUS = 0.35;
const BOB_SPEED = 2.5;
const BOB_AMPLITUDE = 0.25;
const ROTATION_SPEED = 2;
const ITEM_X_JITTER = 1;
const SPAWN_Z_OFFSET = -4;
const SPAWN_INTERVAL_Z = 8;
const MULTIPLIER_VALUE = 2;
const MIN_GAP_Y = 1.5;
const MAX_GAP_Y = 6.5;
const GAP_Y_MARGIN = 0.6;

const ITEM_DEFS = {
  [ITEM_TYPES.SHIELD]: {
    geometry: () => new THREE.IcosahedronGeometry(ITEM_RADIUS, 0),
    color: 0x33ccff,
    emissive: 0x1177aa,
  },
  [ITEM_TYPES.SLOWMO]: {
    geometry: () => new THREE.OctahedronGeometry(ITEM_RADIUS, 0),
    color: 0x9933ff,
    emissive: 0x551188,
  },
  [ITEM_TYPES.SHRINK]: {
    geometry: () => new THREE.TetrahedronGeometry(ITEM_RADIUS, 0),
    color: 0x33ff77,
    emissive: 0x117733,
  },
  [ITEM_TYPES.MULTIPLIER]: {
    geometry: () => new THREE.TorusGeometry(ITEM_RADIUS, ITEM_RADIUS * 0.4, 12, 24),
    color: 0xffcc33,
    emissive: 0xaa7711,
  },
};

const ITEM_TYPE_LIST = Object.values(ITEM_TYPES);

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function createItemMesh(type) {
  const def = ITEM_DEFS[type];
  const geometry = def.geometry();
  const material = new THREE.MeshStandardMaterial({
    color: def.color,
    emissive: def.emissive,
    emissiveIntensity: 0.6,
    metalness: 0.4,
    roughness: 0.3,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  return mesh;
}

class Item {
  constructor(type) {
    this.type = type;
    this.mesh = createItemMesh(type);
    this.baseY = 0;
    this.age = 0;
    this.active = false;
    this.value = type === ITEM_TYPES.MULTIPLIER ? MULTIPLIER_VALUE : 1;
    this.mesh.visible = false;
  }

  spawn(x, y, z) {
    this.baseY = y;
    this.age = randomRange(0, Math.PI * 2);
    this.mesh.position.set(x, y, z);
    this.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    this.mesh.visible = true;
    this.active = true;
  }

  despawn() {
    this.active = false;
    this.mesh.visible = false;
  }

  update(dt, speedMultiplier) {
    if (!this.active) return;
    this.age += dt;
    this.mesh.rotation.y += dt * ROTATION_SPEED;
    this.mesh.position.z += SCROLL_SPEED * speedMultiplier * dt;
    this.mesh.position.y = this.baseY + Math.sin(this.age * BOB_SPEED) * BOB_AMPLITUDE;

    if (this.mesh.position.z > DESPAWN_Z) {
      this.despawn();
    }
  }

  getCollider() {
    return {
      position: this.mesh.position,
      radius: ITEM_RADIUS,
    };
  }
}

const POOL_SIZE_PER_TYPE = 3;

const POP_DURATION = 0.35;
const POP_POOL_SIZE = 6;
const POP_START_SCALE = 0.4;
const POP_END_SCALE = 2.2;

class PopBurst {
  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(ITEM_RADIUS, 0),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    );
    this.mesh.visible = false;
    this.age = 0;
    this.active = false;
  }

  trigger(position, color) {
    this.mesh.position.copy(position);
    this.mesh.material.color.setHex(color);
    this.mesh.material.opacity = 0.85;
    this.mesh.scale.setScalar(POP_START_SCALE);
    this.mesh.visible = true;
    this.age = 0;
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    this.age += dt;
    const t = Math.min(1, this.age / POP_DURATION);
    const scale = THREE.MathUtils.lerp(POP_START_SCALE, POP_END_SCALE, t);
    this.mesh.scale.setScalar(scale);
    this.mesh.material.opacity = 0.85 * (1 - t);

    if (t >= 1) {
      this.active = false;
      this.mesh.visible = false;
    }
  }
}

export class ItemManager {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
    ITEM_TYPE_LIST.forEach((type) => {
      for (let i = 0; i < POOL_SIZE_PER_TYPE; i += 1) {
        this.pool.push(new Item(type));
      }
    });
    this.pool.forEach((item) => this.scene.add(item.mesh));
    this.distanceSinceLastSpawn = 0;
    this.nextSpawnDistance = SPAWN_INTERVAL_Z;

    this.popPool = [];
    for (let i = 0; i < POP_POOL_SIZE; i += 1) {
      const pop = new PopBurst();
      this.popPool.push(pop);
      this.scene.add(pop.mesh);
    }
  }

  _triggerPop(position, type) {
    const pop = this.popPool.find((p) => !p.active);
    if (!pop) return;
    pop.trigger(position, ITEM_DEFS[type].color);
  }

  _getFreeItem() {
    return this.pool.find((item) => !item.active) ?? null;
  }

  _spawnItem() {
    const item = this._getFreeItem();
    if (!item) return;

    const gapCenterY = randomRange(MIN_GAP_Y, MAX_GAP_Y);
    const minY = Math.max(BIRD_Y_MIN + GAP_Y_MARGIN, GROUND_Y + GAP_Y_MARGIN, gapCenterY - 0.6);
    const maxY = Math.min(BIRD_Y_MAX - GAP_Y_MARGIN, gapCenterY + 0.6);
    const y = randomRange(minY, Math.max(minY, maxY));
    const x = BIRD_X + randomRange(-ITEM_X_JITTER, ITEM_X_JITTER);
    const z = SPAWN_Z + SPAWN_Z_OFFSET;

    item.spawn(x, y, z);
  }

  update(dt, speedMultiplier = 1) {
    this.pool.forEach((item) => item.update(dt, speedMultiplier));
    this.popPool.forEach((pop) => pop.update(dt));

    this.distanceSinceLastSpawn += SCROLL_SPEED * speedMultiplier * dt;
    if (this.distanceSinceLastSpawn >= this.nextSpawnDistance) {
      this.distanceSinceLastSpawn = 0;
      this.nextSpawnDistance = SPAWN_INTERVAL_Z * randomRange(1.5, 2.5);
      this._spawnItem();
    }
  }

  checkPickups(birdBox) {
    const collected = [];

    for (const item of this.pool) {
      if (!item.active) continue;

      const collider = item.getCollider();
      const closestPoint = new THREE.Vector3(
        THREE.MathUtils.clamp(collider.position.x, birdBox.min.x, birdBox.max.x),
        THREE.MathUtils.clamp(collider.position.y, birdBox.min.y, birdBox.max.y),
        THREE.MathUtils.clamp(collider.position.z, birdBox.min.z, birdBox.max.z),
      );
      const distanceSq = closestPoint.distanceToSquared(collider.position);

      if (distanceSq <= collider.radius * collider.radius) {
        collected.push({ type: item.type, value: item.value });
        this._triggerPop(item.mesh.position, item.type);
        item.despawn();
      }
    }

    return collected;
  }

  reset() {
    this.pool.forEach((item) => item.despawn());
    this.popPool.forEach((pop) => {
      pop.active = false;
      pop.mesh.visible = false;
    });
    this.distanceSinceLastSpawn = 0;
    this.nextSpawnDistance = SPAWN_INTERVAL_Z;
  }
}
