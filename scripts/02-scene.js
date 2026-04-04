// THREE.JS SCENE SETUP
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 200);
camera.position.set(0, PLAYER_HEIGHT, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.setClearColor(0x0a0705);
container.appendChild(renderer.domElement);

scene.fog = new THREE.FogExp2(0x1a1005, 0.045);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// LIGHTING
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

scene.add(new THREE.AmbientLight(0x3d2a15, 0.8));

const dirLight = new THREE.DirectionalLight(0xffd580, 1.2);
dirLight.position.set(4, 10, 6);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -20;
dirLight.shadow.camera.right = 20;
dirLight.shadow.camera.top = 20;
dirLight.shadow.camera.bottom = -20;
scene.add(dirLight);

[
  { pos: [6,  3,  0],  color: 0xff9933, intensity: 1.5 },
  { pos: [-6, 3,  0],  color: 0xff8822, intensity: 1.5 },
  { pos: [0,  3, -10], color: 0xffaa44, intensity: 1.2 },
  { pos: [0,  3,  10], color: 0xff9933, intensity: 1.0 },
].forEach(({ pos, color, intensity }) => {
  const pl = new THREE.PointLight(color, intensity, 18);
  pl.position.set(...pos);
  scene.add(pl);
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MATERIALS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const floorMat = new THREE.MeshLambertMaterial({ color: 0x2a1f0f });
const wallMat  = new THREE.MeshLambertMaterial({ color: 0x1e150a });
const ceilMat  = new THREE.MeshLambertMaterial({ color: 0x100b05 });
const shelfMat = new THREE.MeshLambertMaterial({ color: 0x4a2e10 });
const deskMat  = new THREE.MeshLambertMaterial({ color: 0x3d2408 });

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
