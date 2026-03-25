/**
 * The Archive — 3D Portfolio Library
 * A first-person Three.js experience where GitHub repos are books
 *
 * Edit mode: append ?edit to the URL to open the layout editor panel.
 * Drag furniture, adjust rotation, then hit "Copy JSON" and paste into layout.json.
 */

// ─────────────────────────────────────────────
// CONSTANTS & CONFIG
// ─────────────────────────────────────────────

const GITHUB_USER          = 'AlistairBishop06';
const PLAYER_SPEED         = 6;
const PLAYER_HEIGHT        = 1.7;
const BOOK_PICKUP_DISTANCE = 4.0;
const DESK_INTERACT_DISTANCE = 3.5;
const EDIT_MODE            = new URLSearchParams(location.search).has('edit');

// Language → warm library colour palette
const LANG_COLORS = {
  'JavaScript': 0xc8a820,
  'TypeScript': 0x4a7fc1,
  'Python':     0x4a8fc8,
  'Rust':       0xb85530,
  'Go':         0x5ab8c8,
  'C#':         0x6a3bc8,
  'C++':        0x8a4ab8,
  'HTML':       0xc85030,
  'CSS':        0x2060b8,
  'Shell':      0x508050,
  'Ruby':       0xb82030,
  'Swift':      0xc86040,
  'Kotlin':     0x7050c8,
  'Java':       0xb87030,
  'PHP':        0x7070c8,
  null:         0x8a7060,
};
function langColor(lang) { return LANG_COLORS[lang] ?? LANG_COLORS[null]; }

// ─────────────────────────────────────────────
// DOM REFS
// ─────────────────────────────────────────────

const container        = document.getElementById('canvas-container');
const loadingEl        = document.getElementById('loading');
const loadingBar       = document.getElementById('loading-bar');
const overlayEl        = document.getElementById('overlay');
const enterBtn         = document.getElementById('enter-btn');
const bookInfoEl       = document.getElementById('book-info');
const bookInfoName     = document.getElementById('book-info-name');
const bookInfoDesc     = document.getElementById('book-info-desc');
const heldInfoEl       = document.getElementById('held-info');
const heldNameEl       = document.getElementById('held-name');
const deskPromptEl     = document.getElementById('desk-prompt');
const readmeBackdrop   = document.getElementById('readme-backdrop');

// ─────────────────────────────────────────────
// THREE.JS SCENE SETUP
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// LIGHTING
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// MATERIALS
// ─────────────────────────────────────────────

const floorMat = new THREE.MeshLambertMaterial({ color: 0x2a1f0f });
const wallMat  = new THREE.MeshLambertMaterial({ color: 0x1e150a });
const ceilMat  = new THREE.MeshLambertMaterial({ color: 0x100b05 });
const shelfMat = new THREE.MeshLambertMaterial({ color: 0x4a2e10 });
const deskMat  = new THREE.MeshLambertMaterial({ color: 0x3d2408 });

// ─────────────────────────────────────────────
// ROOM GEOMETRY
// ─────────────────────────────────────────────

const ROOM_W = 28;
const ROOM_D = 32;
const ROOM_H = 6;

function buildRoom() {
  const floor = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 0.3, ROOM_D), floorMat);
  floor.position.set(0, -0.15, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  const ceil = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 0.3, ROOM_D), ceilMat);
  ceil.position.set(0, ROOM_H + 0.15, 0);
  scene.add(ceil);

  [
    { pos: [0, ROOM_H/2, -ROOM_D/2], size: [ROOM_W, ROOM_H, 0.4] },
    { pos: [0, ROOM_H/2,  ROOM_D/2], size: [ROOM_W, ROOM_H, 0.4] },
    { pos: [-ROOM_W/2, ROOM_H/2, 0], size: [0.4, ROOM_H, ROOM_D] },
    { pos: [ ROOM_W/2, ROOM_H/2, 0], size: [0.4, ROOM_H, ROOM_D] },
  ].forEach(({ pos, size }) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(...size), wallMat);
    w.position.set(...pos);
    w.receiveShadow = true;
    w.castShadow = true;
    scene.add(w);
  });

  for (let i = -ROOM_D/2; i < ROOM_D/2; i += 1.2) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM_W - 0.5, 0.01, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x1a1005 })
    );
    plank.position.set(0, 0.02, i);
    scene.add(plank);
  }
}

// ─────────────────────────────────────────────
// BOOKSHELVES
// ─────────────────────────────────────────────

const shelfSlots   = [];
const shelfObjects = [];

const SHELF_H         = 0.12;
const SHELF_D         = 0.28;
const BOOKS_PER_SHELF = 8;
const SHELF_ROWS      = 3;
const SHELF_SPACING   = 1.1;

// Each shelf unit now stores a reference so the editor can move it
const shelfGroups = []; // { group, slotIndices }

function addShelfUnit(x, z, rotY) {
  const unitW = 3.0;
  const baseH = 0.2;

  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotY;

  // Back panel
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(unitW, SHELF_ROWS * SHELF_SPACING + 0.5, 0.05),
    shelfMat
  );
  back.position.set(0, (SHELF_ROWS * SHELF_SPACING + 0.5) / 2 + baseH, -SHELF_D / 2 + 0.025);
  back.castShadow = true;
  back.receiveShadow = true;
  group.add(back);

  [-unitW/2, unitW/2].forEach(sx => {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.05, SHELF_ROWS * SHELF_SPACING + 0.5, SHELF_D), shelfMat);
    side.position.set(sx, (SHELF_ROWS * SHELF_SPACING + 0.5) / 2 + baseH, 0);
    side.castShadow = true;
    group.add(side);
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(unitW, baseH, SHELF_D), shelfMat);
  base.position.set(0, baseH / 2, 0);
  group.add(base);

  const slotIndices = [];

  for (let row = 0; row < SHELF_ROWS; row++) {
    const shelfY = baseH + 0.45 + row * SHELF_SPACING;
    const plank  = new THREE.Mesh(new THREE.BoxGeometry(unitW, SHELF_H, SHELF_D), shelfMat);
    plank.position.set(0, shelfY, 0);
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);

    const slotStartX = -unitW / 2 + 0.2;
    const slotWidth  = (unitW - 0.4) / BOOKS_PER_SHELF;

    for (let col = 0; col < BOOKS_PER_SHELF; col++) {
      const localPos = new THREE.Vector3(
        slotStartX + col * slotWidth + slotWidth / 2,
        shelfY + SHELF_H / 2 + 0.001,
        0
      );
      group.updateWorldMatrix(true, false);
      const worldPos = localPos.clone().applyMatrix4(group.matrixWorld);
      const normal   = new THREE.Vector3(0, 0, 1).applyQuaternion(group.quaternion);
      const idx      = shelfSlots.length;
      shelfSlots.push({ position: worldPos, normal, rotY });
      slotIndices.push(idx);
    }
  }

  scene.add(group);
  shelfObjects.push(group);

  // Tag each mesh so the editor raycaster can find the group
  group.traverse(child => { if (child.isMesh) child.userData.shelfGroup = group; });
  group.userData.isShelfGroup = true;

  shelfGroups.push({ group, slotIndices, x, z, rotY });
  return group;
}

// ─────────────────────────────────────────────
// CHECKOUT DESK
// ─────────────────────────────────────────────

let deskGroup = null;
let DESK_POS  = new THREE.Vector3(0, 0, 6);

function buildDesk(x = 0, z = 6) {
  if (deskGroup) scene.remove(deskGroup);

  DESK_POS.set(x, 0, z);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.userData.isDeskGroup = true;

  const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 1.2), deskMat);
  top.position.y = 1.0;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 1.1), deskMat);
  body.position.y = 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  [[-1.4, -0.45], [1.4, -0.45], [-1.4, 0.45], [1.4, 0.45]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.08), deskMat);
    leg.position.set(lx, 0.5, lz);
    group.add(leg);
  });

  const lampPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.5),
    new THREE.MeshLambertMaterial({ color: 0x1a1208 })
  );
  lampPole.position.set(1.2, 1.31, 0);
  group.add(lampPole);

  const lampShade = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.2, 8),
    new THREE.MeshLambertMaterial({ color: 0xc8a030 })
  );
  lampShade.position.set(1.2, 1.62, 0);
  group.add(lampShade);

  const lampLight = new THREE.PointLight(0xffcc66, 2.0, 6);
  lampLight.position.set(1.2, 1.7, 0);
  group.add(lampLight);

  const signGeo    = new THREE.BoxGeometry(1.2, 0.3, 0.05);
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 256; signCanvas.height = 64;
  const ctx = signCanvas.getContext('2d');
  ctx.fillStyle = '#2a1a06'; ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#e8d5a3'; ctx.font = 'bold 22px Georgia';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('CHECKOUT', 128, 32);
  const sign = new THREE.Mesh(signGeo, new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(signCanvas) }));
  sign.position.set(0, 1.22, -0.65);
  group.add(sign);

  group.traverse(child => { if (child.isMesh) child.userData.deskGroup = group; });
  scene.add(group);
  deskGroup = group;
  return group;
}

// ─────────────────────────────────────────────
// DECORATIVE PROPS
// ─────────────────────────────────────────────

const propGroups = {}; // keyed by prop name

function buildProps(cfg = {}) {
  const chair  = cfg.chair  || { x: 3.5, z: 3,   rotY: -0.4 };
  const table  = cfg.table  || { x: 4.8, z: 2.5 };
  const candle = cfg.candle || { x: 4.8, z: 2.5 };
  const rug    = cfg.rug    || { x: 4,   z: 3   };

  // ── Reading chair ──
  const chairMat = new THREE.MeshLambertMaterial({ color: 0x3d1a0a });
  const chairGrp = new THREE.Group();

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.7), chairMat);
  seat.position.y = 0.45;
  chairGrp.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), chairMat);
  back.position.set(0, 0.88, -0.3);
  chairGrp.add(back);

  [[-0.35, 0.2], [0.35, 0.2], [-0.35, -0.2], [0.35, -0.2]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), chairMat);
    leg.position.set(lx, 0.22, lz);
    chairGrp.add(leg);
  });

  chairGrp.position.set(chair.x, 0, chair.z);
  chairGrp.rotation.y = chair.rotY ?? -0.4;
  chairGrp.castShadow = true;
  chairGrp.userData.isPropGroup = true;
  chairGrp.userData.propKey = 'chair';
  chairGrp.traverse(c => { if (c.isMesh) c.userData.propGroup = chairGrp; });
  scene.add(chairGrp);
  propGroups.chair = chairGrp;

  // ── Side table ──
  const tableMat = new THREE.MeshLambertMaterial({ color: 0x4a2a0d });
  const tableGrp = new THREE.Group();
  const tabTop = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 16), tableMat);
  tabTop.position.y = 0.65;
  tableGrp.add(tabTop);
  const tabLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.65, 8), tableMat);
  tabLeg.position.y = 0.32;
  tableGrp.add(tabLeg);
  tableGrp.position.set(table.x, 0, table.z);
  tableGrp.userData.isPropGroup = true;
  tableGrp.userData.propKey = 'table';
  tableGrp.traverse(c => { if (c.isMesh) c.userData.propGroup = tableGrp; });
  scene.add(tableGrp);
  propGroups.table = tableGrp;

  // ── Candle ──
  const candleGrp = new THREE.Group();
  const candleMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.18, 8),
    new THREE.MeshLambertMaterial({ color: 0xe8d08a })
  );
  candleGrp.add(candleMesh);
  candleGrp.position.set(candle.x, 0.74, candle.z);
  candleGrp.userData.isPropGroup = true;
  candleGrp.userData.propKey = 'candle';
  scene.add(candleGrp);
  propGroups.candle = candleGrp;

  const flame = new THREE.PointLight(0xff9933, 1.5, 4);
  flame.position.set(candle.x, 0.95, candle.z);
  scene.add(flame);
  window._flameLight = flame;

  // ── Rug ──
  const rugMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.02, 2.5),
    new THREE.MeshLambertMaterial({ color: 0x7a3020 })
  );
  rugMesh.position.set(rug.x, 0.01, rug.z);
  rugMesh.userData.isPropGroup = true;
  rugMesh.userData.propKey = 'rug';
  scene.add(rugMesh);
  propGroups.rug = rugMesh;

  // ── Books on desk ──
  const colors = [0x8b2020, 0x204880, 0x206030];
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(0.25 - i * 0.02, 0.06, 0.18),
      new THREE.MeshLambertMaterial({ color: colors[i] })
    );
    b.position.set(DESK_POS.x - 0.7, 1.09 + i * 0.065, DESK_POS.z - 0.1);
    b.rotation.y = i * 0.08;
    scene.add(b);
  }
}

// ─────────────────────────────────────────────
// LAYOUT LOAD / SAVE
// ─────────────────────────────────────────────

async function loadLayout() {
  try {
    const res = await fetch('layout.json');
    if (res.ok) return await res.json();
  } catch (_) {}
  return null;
}

function buildFromLayout(layout) {
  if (!layout) {
    // Defaults
    buildShelves();
    buildDesk(0, 6);
    buildProps();
    return;
  }

  if (layout.shelves) {
    layout.shelves.forEach(s => addShelfUnit(s.x, s.z, s.rotY));
  } else {
    buildShelves();
  }

  const d = layout.desk || { x: 0, z: 6 };
  buildDesk(d.x, d.z);

  buildProps(layout.props || {});
}

function buildShelves() {
  // Default layout (used when no layout.json)
  for (let i = 0; i < 3; i++) addShelfUnit(-ROOM_W/2 + 1.8, -10 + i * 7, 0);
  for (let i = 0; i < 3; i++) addShelfUnit( ROOM_W/2 - 1.8, -10 + i * 7, Math.PI);
  for (let i = 0; i < 2; i++) addShelfUnit(-3.5 + i * 7, -ROOM_D/2 + 1.8, Math.PI / 2);
  addShelfUnit(-4, 0, 0);
  addShelfUnit( 4, 0, Math.PI);
}

// ─────────────────────────────────────────────
// BOOK CREATION
// ─────────────────────────────────────────────

const books = [];

function makeBookTexture(repo) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const col = langColor(repo.language);
  const r = (col >> 16) & 0xff;
  const g = (col >> 8) & 0xff;
  const b = col & 0xff;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0,   `rgb(${Math.min(r+30,255)},${Math.min(g+30,255)},${Math.min(b+30,255)})`);
  grad.addColorStop(0.5, `rgb(${r},${g},${b})`);
  grad.addColorStop(1,   `rgb(${Math.max(r-40,0)},${Math.max(g-40,0)},${Math.max(b-40,0)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 512);

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, 128, 48);
  ctx.fillRect(0, 464, 128, 48);

  ctx.fillStyle = 'rgba(255,210,80,0.7)';
  ctx.fillRect(8, 50, 112, 2);
  ctx.fillRect(8, 460, 112, 2);

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, 6, 512);
  ctx.fillRect(122, 0, 6, 512);

  const name = repo.name.replace(/-/g, ' ').replace(/_/g, ' ');
  ctx.save();
  ctx.translate(64, 470);
  ctx.rotate(-Math.PI / 2);

  const maxTextW = 380;
  ctx.font = 'bold 28px Georgia, serif';
  let displayName = name;
  while (ctx.measureText(displayName).width > maxTextW && displayName.length > 2)
    displayName = displayName.slice(0, -1);
  if (displayName !== name) displayName += '…';

  const tw = ctx.measureText(displayName).width;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-8, -22, tw + 16, 34);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(displayName, 0, 0);
  ctx.restore();

  if (repo.language) {
    ctx.save();
    ctx.font = '500 18px Georgia, serif';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
    ctx.fillText(repo.language, 64, 24);
    ctx.restore();
  }

  return new THREE.CanvasTexture(canvas);
}

function createBook(repo, slotIndex) {
  const slot = shelfSlots[slotIndex];
  if (!slot) return null;

  const col      = langColor(repo.language);
  const spineTex = makeBookTexture(repo);

  const bW = 0.075 + Math.random() * 0.035;
  const bH = 0.62  + Math.random() * 0.15;
  const bD = 0.22;

  const geo      = new THREE.BoxGeometry(bW, bH, bD);
  const spineMat = new THREE.MeshLambertMaterial({ map: spineTex });
  const solidMat = new THREE.MeshLambertMaterial({ color: col });
  const pageMat  = new THREE.MeshLambertMaterial({ color: 0xe8d5b0 });
  const materials = [solidMat, solidMat, pageMat, solidMat, spineMat, solidMat];

  const mesh = new THREE.Mesh(geo, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.copy(slot.position);
  mesh.position.y += bH / 2;
  mesh.rotation.y  = slot.rotY ?? 0;

  mesh.userData = {
    repo, slotIndex, bookHeight: bH, bookWidth: bW,
    isBook: true, shelfRotY: slot.rotY ?? 0,
  };

  scene.add(mesh);
  books.push({
    mesh, repo, slotIndex, isHeld: false,
    originalPosition: mesh.position.clone(),
    originalRotation: mesh.rotation.clone(),
  });

  return mesh;
}

// ─────────────────────────────────────────────
// PLAYER CONTROLLER
// ─────────────────────────────────────────────

const keys = {};
let pointerLocked = false;
let pitchObj = new THREE.Object3D();
let yawObj   = new THREE.Object3D();

yawObj.add(pitchObj);
pitchObj.add(camera);
yawObj.position.set(0, PLAYER_HEIGHT, 8);
scene.add(yawObj);
camera.position.set(0, 0, 0);

function setupControls() {
  document.addEventListener('keydown', e => { keys[e.code] = true; });
  document.addEventListener('keyup',   e => { keys[e.code] = false; });

  document.addEventListener('mousemove', e => {
    if (!pointerLocked) return;
    yawObj.rotation.y  -= e.movementX * 0.002;
    pitchObj.rotation.x = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, pitchObj.rotation.x - e.movementY * 0.002));
  });

  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === renderer.domElement;
  });

  renderer.domElement.addEventListener('click', () => {
    if (EDIT_MODE) return;
    if (!pointerLocked) renderer.domElement.requestPointerLock();
    else handleClick();
  });

  document.addEventListener('keydown', e => {
    if (e.code === 'KeyE')         handleCheckout();
    if (e.code === 'KeyQ')         returnHeldBook();
    if (e.code === 'Escape' && bookOpen) closeBook();
    if (e.code === 'ArrowRight' && bookOpen) flipPage(1);
    if (e.code === 'ArrowLeft'  && bookOpen) flipPage(-1);
    if (e.code === 'KeyD' && bookOpen) { flipPage(1);  e.stopPropagation(); }
    if (e.code === 'KeyA' && bookOpen) { flipPage(-1); e.stopPropagation(); }
  });

  readmeBackdrop.addEventListener('click', () => { if (bookOpen) closeBook(); });
}

// ─────────────────────────────────────────────
// INTERACTION SYSTEM
// ─────────────────────────────────────────────

const raycaster   = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);
let heldBook      = null;
let lookedAtBook  = null;

function getBookMeshes() {
  return books.filter(b => !b.isHeld).map(b => b.mesh);
}

// ─────────────────────────────────────────────
// BOOK TILT
// ─────────────────────────────────────────────

const tiltingBooks = new Map();
const TILT_AMOUNT  = 0.18;
const TILT_SPEED   = 8;

function updateBookTilts(dt) {
  for (const [bookData, tilt] of tiltingBooks) {
    const isTarget = bookData === lookedAtBook && !bookData.isHeld;
    const target   = isTarget ? 1 : 0;
    const next     = THREE.MathUtils.lerp(tilt, target, 1 - Math.exp(-TILT_SPEED * dt));
    const angle    = bookData.mesh.userData.shelfRotY ?? 0;
    const outDir   = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    const base     = bookData.originalPosition.clone();
    bookData.mesh.position.copy(base).addScaledVector(outDir, next * TILT_AMOUNT);

    if (Math.abs(next - target) < 0.001) {
      bookData.mesh.position.copy(base).addScaledVector(outDir, target * TILT_AMOUNT);
      if (target === 0) tiltingBooks.delete(bookData);
      else              tiltingBooks.set(bookData, target);
    } else {
      tiltingBooks.set(bookData, next);
    }
  }
}

let hoveredBook = null;

function setBookHover(bookData, on) {
  if (on && !tiltingBooks.has(bookData))  tiltingBooks.set(bookData, 0);
  if (!on && tiltingBooks.has(bookData))  tiltingBooks.set(bookData, tiltingBooks.get(bookData));
}

function formatLastUpdated(dateStr) {
  if (!dateStr) return '';
  const diff   = Date.now() - new Date(dateStr).getTime();
  const days   = Math.floor(diff / 86400000);
  if (days === 0) return 'Updated today';
  if (days === 1) return 'Updated yesterday';
  if (days < 30)  return `Updated ${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Updated ${months}mo ago`;
  return `Updated ${Math.floor(months / 12)}y ago`;
}

function updateRaycast() {
  raycaster.setFromCamera(screenCenter, camera);
  const hits = raycaster.intersectObjects(getBookMeshes());

  if (hits.length > 0 && hits[0].distance < BOOK_PICKUP_DISTANCE) {
    const bookData = books.find(b => b.mesh === hits[0].object);
    if (bookData) {
      if (hoveredBook && hoveredBook !== bookData) setBookHover(hoveredBook, false);
      if (hoveredBook !== bookData) { setBookHover(bookData, true); hoveredBook = bookData; }
      lookedAtBook = bookData;
      bookInfoName.textContent = bookData.repo.name;
      bookInfoDesc.textContent = bookData.repo.description || 'No description provided.';
      document.getElementById('book-info-updated').textContent =
        formatLastUpdated(bookData.repo.pushed_at || bookData.repo.updated_at);
      bookInfoEl.classList.add('visible');
      return;
    }
  }

  if (hoveredBook) { setBookHover(hoveredBook, false); hoveredBook = null; }
  lookedAtBook = null;
  bookInfoEl.classList.remove('visible');
}

function handleClick() {
  if (!lookedAtBook || heldBook) return;
  const bookData = lookedAtBook;

  tiltingBooks.delete(bookData);
  bookData.mesh.position.copy(bookData.originalPosition);
  hoveredBook = null; lookedAtBook = null;
  bookInfoEl.classList.remove('visible');

  bookData.isHeld      = true;
  bookData.pickupPhase = 'lifting';
  bookData.pickupT     = 0;
  bookData.pickupStartPos  = bookData.mesh.position.clone();
  bookData.pickupStartQuat = bookData.mesh.quaternion.clone();

  heldBook = bookData;
  heldInfoEl.classList.add('visible');
  heldNameEl.textContent = bookData.repo.name;
}

// ─────────────────────────────────────────────
// HELD BOOK ANIMATION
// ─────────────────────────────────────────────

let heldBookTime = 0;
const HELD_POS = new THREE.Vector3(0.3, -0.26, -0.5);
const HELD_ROT = new THREE.Euler(0.05, -0.25, 0.03);
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function updateHeldBook(dt) {
  if (!heldBook) return;
  heldBookTime += dt;
  const book = heldBook;
  const mesh = book.mesh;

  if (book.pickupPhase === 'lifting') {
    book.pickupT = Math.min(1, book.pickupT + dt / 0.55);
    const t = easeOutCubic(book.pickupT);

    const camWorldPos  = new THREE.Vector3();
    const camWorldQuat = new THREE.Quaternion();
    camera.getWorldPosition(camWorldPos);
    camera.getWorldQuaternion(camWorldQuat);

    const targetPos  = HELD_POS.clone().applyQuaternion(camWorldQuat).add(camWorldPos);
    const targetQuat = new THREE.Quaternion().setFromEuler(HELD_ROT).premultiply(camWorldQuat);

    mesh.position.copy(book.pickupStartPos.clone().lerp(targetPos, t));
    mesh.quaternion.copy(book.pickupStartQuat.clone().slerp(targetQuat, t));

    if (book.pickupT >= 1) {
      scene.remove(mesh);
      camera.add(mesh);
      mesh.position.copy(HELD_POS);
      mesh.rotation.copy(HELD_ROT);
      book.pickupPhase = 'held';
      heldBookTime = 0;
    }
    return;
  }

  if (book.pickupPhase === 'held' && !bookOpen) {
    const bobY = Math.sin(heldBookTime * 1.8) * 0.007;
    const bobR = Math.sin(heldBookTime * 1.2) * 0.012;
    mesh.position.set(HELD_POS.x, HELD_POS.y + bobY, HELD_POS.z);
    mesh.rotation.set(HELD_ROT.x + bobR, HELD_ROT.y, HELD_ROT.z + bobR * 0.4);
  }
}

// ─────────────────────────────────────────────
// 3D OPEN BOOK SYSTEM
// ─────────────────────────────────────────────

let bookOpen     = false;
let openBookData = null;
let pageGroup    = null;
let currentPage  = 0;
let pageChunks   = [];
let flipState    = null;
const FLIP_SPEED = 3.5;
const PAGE_W     = 0.38;
const PAGE_H     = 0.52;
const PAGE_GAP   = 0.005;

function makePageTexture(text, pageNum, totalPages) {
  const W = 512, H = 700;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f2e8d0';
  ctx.fillRect(0, 0, W, H);

  const border = ctx.createLinearGradient(0, 0, 30, 0);
  border.addColorStop(0, 'rgba(0,0,0,0.08)');
  border.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = border;
  ctx.fillRect(0, 0, 30, H);

  ctx.strokeStyle = 'rgba(150,120,80,0.12)';
  ctx.lineWidth = 1;
  for (let y = 80; y < H - 40; y += 26) {
    ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(W - 28, y); ctx.stroke();
  }

  ctx.fillStyle = '#1a0e04';
  ctx.font = '500 18px Georgia, serif';

  const lines  = text.split('\n');
  let y        = 52;
  const lineH  = 26;
  const marginL = 36, marginR = W - 36;
  const maxW   = marginR - marginL;

  for (const rawLine of lines) {
    if (y > H - 55) break;

    if (rawLine.startsWith('### ')) {
      ctx.font = 'bold 17px Georgia, serif'; ctx.fillStyle = '#3a1a08';
      ctx.fillText(rawLine.slice(4), marginL, y);
      ctx.font = '500 18px Georgia, serif'; ctx.fillStyle = '#1a0e04';
      y += lineH + 4; continue;
    }
    if (rawLine.startsWith('## ')) {
      ctx.font = 'bold 20px Georgia, serif'; ctx.fillStyle = '#2a0e04';
      ctx.fillText(rawLine.slice(3), marginL, y);
      ctx.font = '500 18px Georgia, serif'; ctx.fillStyle = '#1a0e04';
      y += lineH + 6; continue;
    }
    if (rawLine.startsWith('# ')) {
      ctx.font = 'bold 22px Georgia, serif'; ctx.fillStyle = '#1a0804';
      ctx.fillText(rawLine.slice(2), marginL, y);
      ctx.font = '500 18px Georgia, serif'; ctx.fillStyle = '#1a0e04';
      y += lineH + 8;
      ctx.strokeStyle = 'rgba(80,40,10,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(marginL, y - 6); ctx.lineTo(marginR, y - 6); ctx.stroke();
      continue;
    }

    const displayLine = (rawLine.startsWith('- ') || rawLine.startsWith('* '))
      ? '• ' + rawLine.slice(2) : rawLine;

    const words = displayLine.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, marginL, y); y += lineH; line = word;
        if (y > H - 55) break;
      } else { line = test; }
    }
    if (line && y <= H - 55) { ctx.fillText(line, marginL, y); y += lineH; }
    if (!rawLine.trim()) y += 4;
  }

  ctx.font = 'italic 14px Georgia, serif';
  ctx.fillStyle = 'rgba(100,70,40,0.5)';
  ctx.textAlign = 'center';
  ctx.fillText(`${pageNum + 1} / ${totalPages}`, W / 2, H - 18);

  return new THREE.CanvasTexture(canvas);
}

function splitIntoPages(md) {
  if (!md) return ['No README found for this repository.'];
  const plain = md
    .replace(/```[\s\S]*?```/g, '[code block]')
    .replace(/!\[.*?\]\(.*?\)/g, '[image]')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/^#{1,6} /gm, '')
    .replace(/^\s*[-*]\s/gm, '- ')
    .replace(/\r/g, '');

  const lines = plain.split('\n');
  const chunks = [];
  let current = [], lineCount = 0;
  const LINES_PER_PAGE = 22;

  for (const line of lines) {
    const weight = line.trim() === '' ? 0.4 : (line.length > 60 ? 2 : 1);
    if (lineCount + weight > LINES_PER_PAGE && current.length) {
      chunks.push(current.join('\n')); current = []; lineCount = 0;
    }
    current.push(line); lineCount += weight;
  }
  if (current.length) chunks.push(current.join('\n'));
  return chunks.length ? chunks : ['No content.'];
}

function buildOpenBook(bookData) {
  if (pageGroup) { camera.remove(pageGroup); pageGroup = null; }
  pageGroup = new THREE.Group();
  pageGroup.position.set(0, -0.08, -0.58);
  pageGroup.rotation.set(0.18, 0, 0);
  camera.add(pageGroup);
  renderPageSpread(bookData);
}

function renderPageSpread(bookData) {
  while (pageGroup.children.length) pageGroup.remove(pageGroup.children[0]);

  const chunks   = pageChunks;
  const leftIdx  = currentPage;
  const rightIdx = currentPage + 1;
  const col      = langColor(bookData.repo.language);
  const coverMat = new THREE.MeshLambertMaterial({ color: col });

  const leftCover = new THREE.Mesh(new THREE.BoxGeometry(PAGE_W, PAGE_H, 0.018), coverMat);
  leftCover.position.set(-PAGE_W/2 - PAGE_GAP, 0, 0);
  pageGroup.add(leftCover);

  const rightCover = new THREE.Mesh(new THREE.BoxGeometry(PAGE_W, PAGE_H, 0.018), coverMat);
  rightCover.position.set(PAGE_W/2 + PAGE_GAP, 0, 0);
  pageGroup.add(rightCover);

  const spine = new THREE.Mesh(new THREE.BoxGeometry(PAGE_GAP * 2, PAGE_H, 0.02), coverMat);
  pageGroup.add(spine);

  const makePagePlane = (idx, xPos) => {
    const mat = idx < chunks.length
      ? new THREE.MeshLambertMaterial({ map: makePageTexture(chunks[idx], idx, chunks.length), side: THREE.FrontSide })
      : new THREE.MeshLambertMaterial({ color: 0xf2e8d0 });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(PAGE_W - 0.01, PAGE_H - 0.01), mat);
    plane.position.set(xPos, 0, 0.011);
    pageGroup.add(plane);
  };

  makePagePlane(leftIdx,  -PAGE_W/2 - PAGE_GAP);
  makePagePlane(rightIdx,  PAGE_W/2 + PAGE_GAP);
  updatePageHUD();
}

function updatePageHUD() {
  const el = document.getElementById('page-counter');
  if (!el || !bookOpen) return;
  const total = pageChunks.length;
  const spread = Math.floor(currentPage / 2) + 1;
  el.textContent = `${spread} / ${Math.ceil(total / 2)}`;
  el.style.opacity = '1';
  document.getElementById('page-prev').style.opacity = currentPage > 0 ? '1' : '0.2';
  document.getElementById('page-next').style.opacity = currentPage + 2 < total ? '1' : '0.2';
}

function flipPage(dir) {
  if (flipState) return;
  const next = currentPage + dir * 2;
  if (next < 0 || next >= pageChunks.length) return;
  flipState = { dir, t: 0, fromPage: currentPage };
}

function updateFlip(dt) {
  if (!flipState || !pageGroup) return;
  flipState.t += dt * FLIP_SPEED;
  pageGroup.rotation.z = Math.sin(Math.PI * Math.min(flipState.t, 1)) * 0.06 * flipState.dir;

  if (flipState.t >= 0.5 && !flipState.swapped) {
    currentPage += flipState.dir * 2;
    renderPageSpread(openBookData);
    flipState.swapped = true;
  }
  if (flipState.t >= 1) { pageGroup.rotation.z = 0; flipState = null; }
}

async function openBook(bookData) {
  if (bookData.pickupPhase !== 'held') return;
  openBookData = bookData;
  bookOpen     = true;
  pageChunks   = ['Loading…'];
  currentPage  = 0;
  bookData.mesh.visible = false;
  buildOpenBook(bookData);
  showPageHUD(true);
  fetchReadme(bookData.repo).then(text => {
    pageChunks  = splitIntoPages(text);
    currentPage = 0;
    renderPageSpread(bookData);
  });
  document.exitPointerLock();
}

function closeBook() {
  if (!bookOpen) return;
  bookOpen = false;
  if (pageGroup) { camera.remove(pageGroup); pageGroup = null; }
  if (openBookData) openBookData.mesh.visible = true;
  openBookData = null; flipState = null;
  showPageHUD(false);
  renderer.domElement.requestPointerLock();
}

function showPageHUD(on) {
  const el = document.getElementById('page-hud');
  if (el) el.style.opacity = on ? '1' : '0';
  if (!on) { const c = document.getElementById('page-counter'); if (c) c.style.opacity = '0'; }
}

function updateDeskProximity() {
  if (bookOpen) return;
  const dist = yawObj.position.distanceTo(DESK_POS);
  if (dist < DESK_INTERACT_DISTANCE && heldBook && heldBook.pickupPhase === 'held')
    deskPromptEl.classList.add('visible');
  else
    deskPromptEl.classList.remove('visible');
}

// ─────────────────────────────────────────────
// PLAYER MOVEMENT
// ─────────────────────────────────────────────

const moveDir = new THREE.Vector3();
const clock   = new THREE.Clock();

function updateMovement(dt) {
  if (bookOpen) return;
  moveDir.set(0, 0, 0);
  if (keys['KeyW']) moveDir.z -= 1;
  if (keys['KeyS']) moveDir.z += 1;
  if (keys['KeyA']) moveDir.x -= 1;
  if (keys['KeyD']) moveDir.x += 1;
  if (moveDir.length() === 0) return;
  moveDir.normalize().applyEuler(new THREE.Euler(0, yawObj.rotation.y, 0));

  const next = yawObj.position.clone().addScaledVector(moveDir, PLAYER_SPEED * dt);
  next.x = Math.max(-ROOM_W/2 + 0.5, Math.min(ROOM_W/2 - 0.5, next.x));
  next.z = Math.max(-ROOM_D/2 + 0.5, Math.min(ROOM_D/2 - 0.5, next.z));
  next.y = PLAYER_HEIGHT;
  yawObj.position.copy(next);
}

// ─────────────────────────────────────────────
// README FETCH
// ─────────────────────────────────────────────

async function fetchReadme(repo) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${repo.name}/readme`,
      { headers: { Accept: 'application/vnd.github.raw' } }
    );
    if (res.ok) return await res.text();
  } catch (_) {}
  return null;
}

// ─────────────────────────────────────────────
// CHECKOUT / RETURN
// ─────────────────────────────────────────────

function handleCheckout() {
  if (!heldBook) return;
  if (bookOpen) { closeBook(); return; }
  if (heldBook.pickupPhase !== 'held') return;

  const dist = yawObj.position.distanceTo(DESK_POS);
  if (dist <= DESK_INTERACT_DISTANCE) {
    window.open(heldBook.repo.html_url, '_blank');
    returnHeldBook();
  } else {
    openBook(heldBook);
  }
}

function returnHeldBook() {
  if (!heldBook) return;
  if (bookOpen) closeBook();
  const mesh = heldBook.mesh;
  if (heldBook.pickupPhase === 'held') { camera.remove(mesh); scene.add(mesh); }
  mesh.visible = true;
  mesh.position.copy(heldBook.originalPosition);
  mesh.rotation.copy(heldBook.originalRotation);
  heldBook.isHeld = false; heldBook.pickupPhase = null;
  heldBook = null; heldBookTime = 0;
  heldInfoEl.classList.remove('visible');
  deskPromptEl.classList.remove('visible');
}

// ─────────────────────────────────────────────
// FETCH REPOS & BUILD BOOKS
// ─────────────────────────────────────────────

async function fetchAndBuildBooks(progressCb) {
  let repos = [];
  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`);
    if (res.ok) {
      repos = await res.json();
      repos = repos.filter(r => !r.fork).sort((a, b) => b.stargazers_count - a.stargazers_count);
    }
  } catch (e) {
    console.warn('Could not fetch repos, using placeholder data.', e);
  }

  if (!repos.length || repos.error) {
    repos = Array.from({ length: 12 }, (_, i) => ({
      name: `project-${i + 1}`,
      description: 'A placeholder repository.',
      html_url: 'https://github.com/' + GITHUB_USER,
      language: ['JavaScript', 'Python', 'TypeScript', 'Rust', 'HTML', null][i % 6],
      stargazers_count: 0, fork: false,
    }));
  }

  const count = Math.min(repos.length, shelfSlots.length);
  for (let i = 0; i < count; i++) {
    createBook(repos[i], i);
    progressCb(i / count);
    if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
  }
  progressCb(1);
}

// ─────────────────────────────────────────────
// RENDER LOOP
// ─────────────────────────────────────────────

let frameCount = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  frameCount++;

  updateMovement(dt);
  updateHeldBook(dt);
  updateBookTilts(dt);
  updateFlip(dt);

  if (frameCount % 2 === 0 && !bookOpen && !EDIT_MODE) updateRaycast();
  updateDeskProximity();

  if (window._flameLight) {
    window._flameLight.intensity = 1.3 + Math.sin(frameCount * 0.18) * 0.2 + Math.random() * 0.1;
  }

  if (EDIT_MODE) editorTick();

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─────────────────────────────────────────────
// ══════════════════════════════════════════════
//  EDITOR SYSTEM  (only active with ?edit)
// ══════════════════════════════════════════════
// ─────────────────────────────────────────────

let editorSelectedObject = null; // the Three.js Group being dragged
let editorSelectedType   = null; // 'shelf' | 'desk' | 'chair' | 'table' | 'candle' | 'rug'
let editorSelectedIndex  = null; // index in shelfGroups array (for shelves)
let editorDragPlane      = null; // THREE.Plane for mouse-world intersection
let editorDragOffset     = new THREE.Vector3();
let editorIsDragging     = false;
const editorRaycaster    = new THREE.Raycaster();

function initEditor() {
  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    #editor-panel {
      position: fixed;
      top: 0; right: 0; bottom: 0;
      width: 280px;
      background: rgba(8,5,3,0.96);
      border-left: 1px solid rgba(232,213,163,0.12);
      display: flex;
      flex-direction: column;
      z-index: 200;
      font-family: 'Georgia', serif;
      color: #e8d5a3;
      overflow: hidden;
    }
    #editor-panel h2 {
      font-size: 0.75rem;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #a08050;
      padding: 18px 18px 0;
      margin-bottom: 14px;
    }
    #editor-panel .ed-section {
      padding: 0 18px 14px;
      border-bottom: 1px solid rgba(232,213,163,0.08);
      margin-bottom: 4px;
    }
    #editor-panel .ed-label {
      font-size: 0.62rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #6a5030;
      margin-bottom: 8px;
    }
    #editor-panel .ed-add-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 7px 10px;
      margin-bottom: 5px;
      background: transparent;
      border: 1px solid rgba(232,213,163,0.15);
      border-radius: 3px;
      color: #c8a870;
      font-family: 'Georgia', serif;
      font-size: 0.8rem;
      cursor: pointer;
      text-align: left;
      transition: background 0.2s, border-color 0.2s;
    }
    #editor-panel .ed-add-btn:hover { background: rgba(232,213,163,0.06); border-color: rgba(232,213,163,0.3); }
    #editor-panel .ed-add-btn .swatch { width:10px; height:20px; border-radius:2px; flex-shrink:0; }
    #editor-panel .ed-props { flex:1; overflow-y:auto; padding: 12px 18px; }
    #editor-panel .ed-hint {
      font-size: 0.72rem;
      color: #4a3820;
      text-align: center;
      padding: 30px 10px;
      line-height: 1.6;
    }
    #editor-panel .ed-prop-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    #editor-panel .ed-prop-label {
      font-size: 0.75rem;
      color: #8a7050;
      min-width: 50px;
    }
    #editor-panel .ed-prop-input {
      width: 80px;
      padding: 4px 8px;
      background: rgba(232,213,163,0.05);
      border: 1px solid rgba(232,213,163,0.18);
      border-radius: 3px;
      color: #e8d5a3;
      font-family: 'Courier New', monospace;
      font-size: 0.78rem;
      text-align: right;
    }
    #editor-panel .ed-prop-input:focus { outline: none; border-color: rgba(232,213,163,0.45); }
    #editor-panel .ed-rot-row {
      display: flex; gap: 6px; margin-bottom: 10px;
    }
    #editor-panel .ed-rot-btn {
      flex: 1;
      padding: 5px;
      background: transparent;
      border: 1px solid rgba(232,213,163,0.18);
      border-radius: 3px;
      color: #c8a870;
      font-size: 0.75rem;
      cursor: pointer;
      font-family: 'Georgia', serif;
    }
    #editor-panel .ed-rot-btn:hover { background: rgba(232,213,163,0.08); }
    #editor-panel .ed-delete-btn {
      width: 100%;
      padding: 7px;
      margin-top: 4px;
      background: transparent;
      border: 1px solid rgba(180,60,40,0.35);
      border-radius: 3px;
      color: #c05040;
      font-family: 'Georgia', serif;
      font-size: 0.75rem;
      cursor: pointer;
    }
    #editor-panel .ed-delete-btn:hover { background: rgba(180,60,40,0.1); }
    #editor-panel .ed-bottom {
      padding: 14px 18px;
      border-top: 1px solid rgba(232,213,163,0.08);
    }
    #editor-panel .ed-export-btn {
      width: 100%;
      padding: 10px;
      background: transparent;
      border: 1px solid rgba(232,213,163,0.35);
      border-radius: 3px;
      color: #e8d5a3;
      font-family: 'Georgia', serif;
      font-size: 0.82rem;
      letter-spacing: 0.1em;
      cursor: pointer;
      transition: background 0.2s;
    }
    #editor-panel .ed-export-btn:hover { background: rgba(232,213,163,0.08); }
    #editor-panel .ed-selected-name {
      font-size: 0.88rem;
      color: #e8d5a3;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(232,213,163,0.1);
    }
    #editor-badge {
      position: fixed;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(200,150,30,0.18);
      border: 1px solid rgba(200,150,30,0.4);
      color: #e8d5a3;
      font-family: 'Georgia', serif;
      font-size: 0.72rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      padding: 6px 18px;
      z-index: 300;
      pointer-events: none;
    }
    body.edit-mode #canvas-container { right: 280px; }
    body.edit-mode canvas { cursor: crosshair !important; }
    body.edit-mode .ed-obj-selected { cursor: move !important; }
  `;
  document.head.appendChild(style);
  document.body.classList.add('edit-mode');

  // Badge
  const badge = document.createElement('div');
  badge.id = 'editor-badge';
  badge.textContent = '✦ Editor Mode — click objects to select · drag to move';
  document.body.appendChild(badge);

  // Hide game UI that clutters the editor
  overlayEl.classList.add('hidden');

  // Panel
  const panel = document.createElement('div');
  panel.id = 'editor-panel';
  panel.innerHTML = `
    <h2>Library Editor</h2>

    <div class="ed-section">
      <div class="ed-label">Add furniture</div>
      <button class="ed-add-btn" id="ed-add-shelf">
        <div class="swatch" style="background:#4a2e10"></div>Shelf unit
      </button>
      <button class="ed-add-btn" id="ed-add-chair">
        <div class="swatch" style="background:#3d1a0a"></div>Reading chair
      </button>
    </div>

    <div class="ed-props" id="ed-props">
      <div class="ed-hint">Click any furniture piece in the 3D view to select and move it.<br><br>Drag to reposition · use rotate buttons to turn.</div>
    </div>

    <div class="ed-bottom">
      <button class="ed-export-btn" id="ed-export-btn">Copy layout.json ↗</button>
    </div>
  `;
  document.body.appendChild(panel);

  document.getElementById('ed-add-shelf').addEventListener('click', () => editorAddShelf());
  document.getElementById('ed-add-chair').addEventListener('click', () => editorAddProp('chair'));
  document.getElementById('ed-export-btn').addEventListener('click', editorCopyJSON);

  // Mouse events on the canvas
  renderer.domElement.addEventListener('mousedown', editorOnMouseDown);
  renderer.domElement.addEventListener('mousemove', editorOnMouseMove);
  renderer.domElement.addEventListener('mouseup',   editorOnMouseUp);

  // Free-look camera in edit mode (WASD + right-mouse drag)
  document.addEventListener('keydown', e => { keys[e.code] = true; });
  document.addEventListener('keyup',   e => { keys[e.code] = false; });

  // Position camera above for a better editorial view
  yawObj.position.set(0, PLAYER_HEIGHT, 14);
}

// ─── editor helpers ───

function editorGetMouseNDC(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  return new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width)  * 2 - 1,
    -((e.clientY - rect.top)  / rect.height) * 2 + 1
  );
}

function editorPickObject(e) {
  const ndc = editorGetMouseNDC(e);
  editorRaycaster.setFromCamera(ndc, camera);

  // Collect all selectable meshes
  const candidates = [];
  shelfGroups.forEach(sg => sg.group.traverse(c => { if (c.isMesh) candidates.push(c); }));
  if (deskGroup) deskGroup.traverse(c => { if (c.isMesh) candidates.push(c); });
  Object.values(propGroups).forEach(pg => {
    if (pg.traverse) pg.traverse(c => { if (c.isMesh) candidates.push(c); });
    else if (pg.isMesh) candidates.push(pg);
  });

  const hits = editorRaycaster.intersectObjects(candidates, false);
  if (!hits.length) return null;

  const hit = hits[0].object;

  // Walk up to find the owning group
  if (hit.userData.shelfGroup) {
    const sg = shelfGroups.find(s => s.group === hit.userData.shelfGroup);
    return { group: hit.userData.shelfGroup, type: 'shelf', shelfData: sg };
  }
  if (hit.userData.deskGroup) {
    return { group: hit.userData.deskGroup, type: 'desk' };
  }
  if (hit.userData.propGroup) {
    return { group: hit.userData.propGroup, type: hit.userData.propGroup.userData.propKey || 'prop' };
  }
  if (hit.userData.isPropGroup) {
    return { group: hit, type: hit.userData.propKey || 'prop' };
  }
  return null;
}

function editorHighlight(group, on) {
  group.traverse(child => {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => { if (m.emissive) m.emissive.setScalar(on ? 0.12 : 0); });
      } else {
        if (child.material.emissive) child.material.emissive.setScalar(on ? 0.12 : 0);
      }
    }
  });
}

function editorSelect(picked) {
  if (editorSelectedObject) editorHighlight(editorSelectedObject, false);
  editorSelectedObject = picked ? picked.group : null;
  editorSelectedType   = picked ? picked.type  : null;
  editorSelectedShelf  = picked ? picked.shelfData : null;
  if (editorSelectedObject) editorHighlight(editorSelectedObject, true);
  editorRenderProps();
}

function editorRenderProps() {
  const el = document.getElementById('ed-props');
  if (!editorSelectedObject) {
    el.innerHTML = '<div class="ed-hint">Click any furniture piece in the 3D view to select and move it.<br><br>Drag to reposition · use rotate buttons to turn.</div>';
    return;
  }

  const p = editorSelectedObject.position;
  const rDeg = Math.round((editorSelectedObject.rotation.y * 180 / Math.PI) % 360);

  el.innerHTML = `
    <div class="ed-selected-name">${editorSelectedType}</div>
    <div class="ed-prop-row">
      <span class="ed-prop-label">X</span>
      <input class="ed-prop-input" id="ed-px" type="number" step="0.5" value="${p.x.toFixed(2)}" />
    </div>
    <div class="ed-prop-row">
      <span class="ed-prop-label">Z</span>
      <input class="ed-prop-input" id="ed-pz" type="number" step="0.5" value="${p.z.toFixed(2)}" />
    </div>
    <div class="ed-label" style="margin-top:8px;margin-bottom:6px;">Rotation</div>
    <div class="ed-rot-row">
      <button class="ed-rot-btn" id="ed-rot-l">↺ 90°</button>
      <button class="ed-rot-btn" id="ed-rot-r">↻ 90°</button>
      <button class="ed-rot-btn" id="ed-rot-flip">180°</button>
    </div>
    <div class="ed-prop-row">
      <span class="ed-prop-label">Angle</span>
      <input class="ed-prop-input" id="ed-rot-deg" type="number" step="15" value="${rDeg}" />
    </div>
    ${editorSelectedType === 'shelf' ? `<button class="ed-delete-btn" id="ed-delete-btn">Remove shelf</button>` : ''}
  `;

  document.getElementById('ed-px').addEventListener('change', e => {
    editorSelectedObject.position.x = parseFloat(e.target.value);
    editorSyncShelfSlots();
  });
  document.getElementById('ed-pz').addEventListener('change', e => {
    editorSelectedObject.position.z = parseFloat(e.target.value);
    editorSyncShelfSlots();
  });
  document.getElementById('ed-rot-l').addEventListener('click', () => editorRotate(-Math.PI/2));
  document.getElementById('ed-rot-r').addEventListener('click', () => editorRotate( Math.PI/2));
  document.getElementById('ed-rot-flip').addEventListener('click', () => editorRotate(Math.PI));
  document.getElementById('ed-rot-deg').addEventListener('change', e => {
    editorSelectedObject.rotation.y = parseFloat(e.target.value) * Math.PI / 180;
    editorSyncShelfSlots();
    editorRenderProps();
  });
  const delBtn = document.getElementById('ed-delete-btn');
  if (delBtn) delBtn.addEventListener('click', editorDeleteSelected);
}

function editorRotate(delta) {
  if (!editorSelectedObject) return;
  editorSelectedObject.rotation.y += delta;
  editorSyncShelfSlots();
  editorRenderProps();
}

// After moving/rotating a shelf, recompute its world-space slot positions
function editorSyncShelfSlots() {
  if (editorSelectedType !== 'shelf' || !editorSelectedShelf) return;

  const group    = editorSelectedObject;
  const sd       = editorSelectedShelf;
  const unitW    = 3.0;
  const baseH    = 0.2;

  group.updateWorldMatrix(true, true);

  sd.slotIndices.forEach((slotIdx, i) => {
    const row  = Math.floor(i / BOOKS_PER_SHELF);
    const col  = i % BOOKS_PER_SHELF;
    const shelfY     = baseH + 0.45 + row * SHELF_SPACING;
    const slotStartX = -unitW / 2 + 0.2;
    const slotWidth  = (unitW - 0.4) / BOOKS_PER_SHELF;

    const localPos = new THREE.Vector3(
      slotStartX + col * slotWidth + slotWidth / 2,
      shelfY + SHELF_H / 2 + 0.001,
      0
    );
    const worldPos = localPos.clone().applyMatrix4(group.matrixWorld);
    shelfSlots[slotIdx].position.copy(worldPos);
    shelfSlots[slotIdx].rotY = group.rotation.y;
  });

  // Also reposition any books already placed on this shelf
  books.forEach(b => {
    if (!b.isHeld && sd.slotIndices.includes(b.slotIndex)) {
      const slot = shelfSlots[b.slotIndex];
      b.mesh.position.copy(slot.position);
      b.mesh.position.y += b.mesh.userData.bookHeight / 2;
      b.mesh.rotation.y  = slot.rotY;
      b.originalPosition.copy(b.mesh.position);
      b.originalRotation.copy(b.mesh.rotation);
    }
  });
}

function editorAddShelf() {
  addShelfUnit(0, 0, 0);
  editorSelect({ group: shelfGroups[shelfGroups.length - 1].group, type: 'shelf', shelfData: shelfGroups[shelfGroups.length - 1] });
}

function editorAddProp(key) {
  // Remove old, rebuild with new random position
  if (propGroups[key]) {
    scene.remove(propGroups[key]);
    delete propGroups[key];
  }
  const cfg = {};
  cfg[key] = { x: 0, z: 0, rotY: 0 };
  buildProps(cfg);
}

function editorDeleteSelected() {
  if (!editorSelectedObject || editorSelectedType !== 'shelf') return;
  const sd = editorSelectedShelf;
  // Remove books on this shelf
  sd.slotIndices.forEach(si => {
    const bi = books.findIndex(b => b.slotIndex === si);
    if (bi >= 0) { scene.remove(books[bi].mesh); books.splice(bi, 1); }
  });
  // Free the slots
  sd.slotIndices.forEach(si => { shelfSlots[si] = null; });
  // Remove from scene + arrays
  scene.remove(editorSelectedObject);
  const idx = shelfGroups.findIndex(s => s.group === editorSelectedObject);
  if (idx >= 0) shelfGroups.splice(idx, 1);
  editorSelect(null);
}

// Mouse drag in world space on the ground plane
function editorOnMouseDown(e) {
  if (e.button !== 0) return;
  const picked = editorPickObject(e);
  if (!picked) { editorSelect(null); return; }
  editorSelect(picked);

  // Set up drag plane at y=0
  editorDragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const ndc  = editorGetMouseNDC(e);
  editorRaycaster.setFromCamera(ndc, camera);
  const pt   = new THREE.Vector3();
  editorRaycaster.ray.intersectPlane(editorDragPlane, pt);
  editorDragOffset.copy(pt).sub(editorSelectedObject.position);
  editorIsDragging = true;
}

function editorOnMouseMove(e) {
  if (!editorIsDragging || !editorSelectedObject || !editorDragPlane) return;

  const ndc = editorGetMouseNDC(e);
  editorRaycaster.setFromCamera(ndc, camera);
  const pt = new THREE.Vector3();
  editorRaycaster.ray.intersectPlane(editorDragPlane, pt);

  // Snap to 0.5-unit grid
  editorSelectedObject.position.x = Math.round((pt.x - editorDragOffset.x) * 2) / 2;
  editorSelectedObject.position.z = Math.round((pt.z - editorDragOffset.z) * 2) / 2;

  editorSyncShelfSlots();
  editorRenderProps();
}

function editorOnMouseUp(e) {
  editorIsDragging = false;
}

// Build JSON representation of current layout
function editorBuildJSON() {
  const shelves = shelfGroups.map(sg => ({
    x:    parseFloat(sg.group.position.x.toFixed(2)),
    z:    parseFloat(sg.group.position.z.toFixed(2)),
    rotY: parseFloat(sg.group.rotation.y.toFixed(4)),
  }));

  const desk = deskGroup
    ? { x: parseFloat(deskGroup.position.x.toFixed(2)), z: parseFloat(deskGroup.position.z.toFixed(2)) }
    : { x: 0, z: 6 };

  const props = {};
  Object.entries(propGroups).forEach(([key, grp]) => {
    const g = grp.isGroup ? grp : grp;
    props[key] = {
      x:    parseFloat((g.position ? g.position.x : 0).toFixed(2)),
      z:    parseFloat((g.position ? g.position.z : 0).toFixed(2)),
      rotY: parseFloat((g.rotation ? g.rotation.y : 0).toFixed(4)),
    };
  });

  return JSON.stringify({ shelves, desk, props }, null, 2);
}

function editorCopyJSON() {
  const json = editorBuildJSON();
  navigator.clipboard.writeText(json).then(() => {
    const btn = document.getElementById('ed-export-btn');
    btn.textContent = 'Copied! Paste into layout.json';
    setTimeout(() => { btn.textContent = 'Copy layout.json ↗'; }, 2500);
  }).catch(() => {
    // Fallback: show in a textarea
    const ta = document.createElement('textarea');
    ta.style.cssText = 'position:fixed;top:20px;left:20px;width:calc(100%-320px);height:200px;z-index:999;background:#1a1005;color:#e8d5a3;font-family:monospace;font-size:12px;border:1px solid #a08050;padding:10px;';
    ta.value = json;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    setTimeout(() => document.body.removeChild(ta), 3000);
  });
}

// editor update tick — camera movement
function editorTick() {
  // Free-look WASD in edit mode (no pointer lock needed)
  // handled by updateMovement already
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

async function init() {
  buildRoom();

  // Load layout.json (falls back to defaults if missing)
  const layout = await loadLayout();
  buildFromLayout(layout);

  await fetchAndBuildBooks(p => {
    loadingBar.style.width = (p * 100).toFixed(0) + '%';
  });

  loadingEl.classList.add('hidden');

  if (EDIT_MODE) {
    // Editor mode — no overlay, free camera, panel
    initEditor();
    clock.start();
    animate();
    return;
  }

  enterBtn.addEventListener('click', () => {
    overlayEl.classList.add('hidden');
    renderer.domElement.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    if (!document.pointerLockElement) pointerLocked = false;
  });

  setupControls();
  animate();
}

init();