import * as THREE from 'three';
import {
  GRAVITY,
  FLAP_FORCE,
  BIRD_X,
  BIRD_Y_MIN,
  BIRD_Y_MAX,
} from './constants.js';

const SPAWN_Y = 3;
const MAX_TILT = 0.6;
const WING_FLAP_SPEED = 14;
const WING_FLAP_DECAY = 3.5;
const WING_MAX_ANGLE = 0.9;

export class Bird {
  constructor(scene) {
    this.scene = scene;

    this.velocity = 0;
    this.wingTimer = 0;
    this.wingIntensity = 0;
    this.shrinkFactor = 1;

    this.group = new THREE.Group();
    this.group.position.set(BIRD_X, SPAWN_Y, 0);

    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffd23f, roughness: 0.5, metalness: 0.05 });
    const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xff8c1a, roughness: 0.4, metalness: 0.05 });
    const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xf2b705, roughness: 0.6, metalness: 0.05 });
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.2, metalness: 0.1 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 16), bodyMaterial);
    body.scale.set(1, 0.85, 1.05);
    body.castShadow = true;
    body.receiveShadow = true;
    this.group.add(body);

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 12), beakMaterial);
    beak.rotation.z = -Math.PI / 2;
    beak.position.set(0.5, 0.02, 0);
    beak.castShadow = true;
    this.group.add(beak);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), eyeMaterial);
    eye.position.set(0.32, 0.2, 0.24);
    eye.castShadow = true;
    this.group.add(eye);

    const wingGeometry = new THREE.BoxGeometry(0.42, 0.06, 0.3);

    this.leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    this.leftWing.position.set(-0.05, 0, -0.17);
    this.leftWing.castShadow = true;
    this.leftWingPivot = new THREE.Group();
    this.leftWingPivot.position.set(0, 0.05, -0.15);
    this.leftWingPivot.add(this.leftWing);
    this.group.add(this.leftWingPivot);

    this.rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    this.rightWing.castShadow = true;
    this.rightWingPivot = new THREE.Group();
    this.rightWingPivot.position.set(0, 0.05, 0.15);
    this.rightWing.position.set(-0.05, 0, 0.17);
    this.rightWingPivot.add(this.rightWing);
    this.group.add(this.rightWingPivot);

    this.spawnPosition = new THREE.Vector3(BIRD_X, SPAWN_Y, 0);

    this.scene.add(this.group);
  }

  flap() {
    this.velocity = FLAP_FORCE;
    this.wingIntensity = 1;
  }

  update(dt) {
    this.velocity += GRAVITY * dt;

    const nextY = this.group.position.y + this.velocity * dt;
    this.group.position.y = THREE.MathUtils.clamp(nextY, BIRD_Y_MIN, BIRD_Y_MAX);

    if (this.group.position.y === BIRD_Y_MIN || this.group.position.y === BIRD_Y_MAX) {
      this.velocity = 0;
    }

    const targetTilt = THREE.MathUtils.clamp(this.velocity * 0.15, -MAX_TILT, MAX_TILT);
    this.group.rotation.z = targetTilt;

    this.wingTimer += dt * WING_FLAP_SPEED * (0.4 + this.wingIntensity);
    this.wingIntensity = Math.max(0, this.wingIntensity - WING_FLAP_DECAY * dt);

    const flapAngle = Math.sin(this.wingTimer) * WING_MAX_ANGLE * (0.25 + this.wingIntensity);
    this.leftWingPivot.rotation.z = flapAngle;
    this.rightWingPivot.rotation.z = -flapAngle;
  }

  getBoundingBox() {
    return new THREE.Box3().setFromObject(this.group);
  }

  reset() {
    this.velocity = 0;
    this.wingTimer = 0;
    this.wingIntensity = 0;
    this.group.position.copy(this.spawnPosition);
    this.group.rotation.set(0, 0, 0);
    this.removeShrink();
  }

  applyShrink(factor) {
    this.shrinkFactor = factor;
    this.group.scale.setScalar(factor);
  }

  removeShrink() {
    this.shrinkFactor = 1;
    this.group.scale.setScalar(1);
  }

  getPosition() {
    return this.group.position.clone();
  }
}

export default Bird;
