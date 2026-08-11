// Shared gameplay constants — imported by bird.js, pipes.js, items.js, main.js.
// Do not redefine these locally in other modules.

export const GRAVITY = -20; // units/sec^2, applied to bird velocity every frame
export const FLAP_FORCE = 6.5; // units/sec, instantaneous upward velocity on flap()

export const SCROLL_SPEED = 4; // units/sec, world scroll speed (pipes/items move in +Z)
export const PIPE_SPACING_Z = 8; // distance between consecutive pipe pairs
export const PIPE_GAP = 2.2; // vertical gap height between pipe pair (min 1.6 with difficulty)

export const GROUND_Y = 0; // ground/floor plane Y position

export const BIRD_X = 0; // bird fixed X position (world lane)
export const SPAWN_Z = -40; // Z position where pipes/items spawn
export const DESPAWN_Z = 10; // Z position where pipes/items are recycled/removed

export const BIRD_Y_MIN = 0.5; // ground collision threshold
export const BIRD_Y_MAX = 8; // ceiling clamp
