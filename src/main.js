import * as THREE from 'three';
import './style.css';
import { createScene, renderScene } from './scene.js';
import { Bird } from './bird.js';
import { PipeManager } from './pipes.js';
import { ItemManager } from './items.js';
import { createGameState } from './gameState.js';
import { createSkillManager } from './skills.js';
import { UIManager } from './ui.js';
import { BIRD_X, BIRD_Y_MIN } from './constants.js';

// ---- Core Three.js setup ----
const { scene, renderer } = createScene();
document.querySelector('#app').appendChild(renderer.domElement);

// ---- Game systems ----
const skillManager = createSkillManager();
const gameState = createGameState(skillManager);
const bird = new Bird(scene);
const pipeManager = new PipeManager(scene);
const itemManager = new ItemManager(scene);
const ui = new UIManager(document.body);

const clock = new THREE.Clock();

function flap() {
  if (gameState.getState() !== 'playing') return;
  bird.flap();
}

function startGame() {
  gameState.startGame();
  bird.reset();
  pipeManager.reset();
  itemManager.reset();
  ui.showHUD();
  ui.updateScore(0);
  ui.updateMultiplier(1);
  ui.updateActiveEffects([]);
}

function endGame() {
  gameState.endGame();
  ui.showGameOver(
    { score: gameState.getScore(), highScore: gameState.getHighScore() },
    startGame
  );
}

// ---- Input wiring: spacebar / click / tap = flap ----
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.key === ' ') {
    event.preventDefault();
    flap();
  }
});
renderer.domElement.addEventListener('pointerdown', () => {
  flap();
});

// ---- Main loop ----
function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.1); // clamp to avoid huge steps on tab-switch

  if (gameState.getState() === 'playing') {
    const speedMultiplier = skillManager.getSpeedMultiplier();

    skillManager.update(dt);
    bird.update(dt);

    const shrinkFactor = skillManager.getShrinkFactor();
    if (shrinkFactor !== 1) {
      bird.applyShrink(shrinkFactor);
    } else {
      bird.removeShrink();
    }

    pipeManager.update(dt, speedMultiplier);
    itemManager.update(dt, speedMultiplier);

    const birdBox = bird.getBoundingBox();

    // Item pickups
    const collected = itemManager.checkPickups(birdBox);
    for (const pickup of collected) {
      skillManager.applyItem(pickup);
    }

    // Scoring: award a point the first time a pipe pair's Z crosses BIRD_X
    // (i.e. the pipe has passed the bird) while moving toward the camera (+Z).
    const activePipes = pipeManager.getActivePipes();
    for (const pipe of activePipes) {
      if (!pipe.scored && pipe.z >= BIRD_X) {
        pipeManager.markScored(pipe.id);
        gameState.addScore(1);
      }
    }

    // Collision detection
    const pipeBoxes = [];
    for (const pipe of activePipes) {
      pipeBoxes.push(pipe.topBox, pipe.bottomBox);
    }
    const groundHit = bird.getPosition().y <= BIRD_Y_MIN;
    const collided = groundHit || gameState.checkPipeCollision(birdBox, pipeBoxes);

    if (collided) {
      endGame();
    } else {
      ui.updateScore(gameState.getScore());
      ui.updateMultiplier(skillManager.getScoreMultiplier());
      ui.updateActiveEffects(skillManager.getActiveEffects());
    }
  }

  renderScene();
}

// ---- Initial state: start screen ----
ui.showStartScreen(startGame);
animate();
