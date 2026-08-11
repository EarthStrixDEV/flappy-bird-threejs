import * as THREE from 'three';

const CAMERA_POSITION = { x: 0, y: 2.2, z: 9 };
const CAMERA_LOOK_AT = { x: 0, y: 2.2, z: 0 };

const SHADOW_FRUSTUM = {
  left: -6,
  right: 6,
  top: 10,
  bottom: 0,
  near: 1,
  far: 55,
};

const GROUND_WIDTH = 200;
const GROUND_DEPTH = 200;
const GROUND_CENTER_Z = -15;

const SKY_TOP_COLOR = new THREE.Color(0x6ec6ff);
const SKY_BOTTOM_COLOR = new THREE.Color(0xbfe8ff);

function createSkyDome() {
  const skyGeometry = new THREE.SphereGeometry(120, 32, 16);
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: SKY_TOP_COLOR },
      bottomColor: { value: SKY_BOTTOM_COLOR },
      offset: { value: 10 },
      exponent: { value: 0.6 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });

  return new THREE.Mesh(skyGeometry, skyMaterial);
}

function createGround() {
  const groundGeometry = new THREE.PlaneGeometry(GROUND_WIDTH, GROUND_DEPTH);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x6b8e4e,
    roughness: 0.95,
    metalness: 0,
  });

  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, GROUND_CENTER_Z);
  ground.receiveShadow = true;

  return ground;
}

function createDirectionalLight() {
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(5, 10, 7);
  light.castShadow = true;

  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.bias = -0.0005;

  const cam = light.shadow.camera;
  cam.left = SHADOW_FRUSTUM.left;
  cam.right = SHADOW_FRUSTUM.right;
  cam.top = SHADOW_FRUSTUM.top;
  cam.bottom = SHADOW_FRUSTUM.bottom;
  cam.near = SHADOW_FRUSTUM.near;
  cam.far = SHADOW_FRUSTUM.far;
  cam.updateProjectionMatrix();

  return light;
}

function createHemisphereLight() {
  return new THREE.HemisphereLight(0xbfe8ff, 0x6b8e4e, 1.2);
}

let activeScene = null;
let activeCamera = null;
let activeRenderer = null;

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = SKY_BOTTOM_COLOR.clone();
  scene.fog = new THREE.Fog(SKY_BOTTOM_COLOR.clone(), 20, 48);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.set(CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z);
  camera.lookAt(CAMERA_LOOK_AT.x, CAMERA_LOOK_AT.y, CAMERA_LOOK_AT.z);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const directionalLight = createDirectionalLight();
  const hemisphereLight = createHemisphereLight();
  const sky = createSkyDome();
  const ground = createGround();

  scene.add(directionalLight);
  scene.add(directionalLight.target);
  scene.add(hemisphereLight);
  scene.add(sky);
  scene.add(ground);

  function updateLights(dt) {
    void dt;
  }

  activeScene = scene;
  activeCamera = camera;
  activeRenderer = renderer;
  window.addEventListener('resize', handleResize);

  return { scene, camera, renderer, updateLights };
}

/**
 * Resizes the active camera/renderer to the current window size.
 * Self-registered as a `window.resize` listener by `createScene()`, so
 * main.js does NOT need to call this manually. It is also exported in
 * case main.js prefers to own resize wiring explicitly (e.g. inside a
 * ResizeObserver or a custom container) — calling it a second time is
 * harmless, it just recomputes aspect/size from `window.innerWidth/Height`.
 */
export function handleResize() {
  if (!activeCamera || !activeRenderer) return;
  activeCamera.aspect = window.innerWidth / window.innerHeight;
  activeCamera.updateProjectionMatrix();
  activeRenderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Renders the scene most recently created by createScene() using its camera.
 */
export function renderScene() {
  if (!activeScene || !activeCamera || !activeRenderer) return;
  activeRenderer.render(activeScene, activeCamera);
}
