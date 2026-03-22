/**
 * The Archive — 3D Portfolio Library
 * A first-person Three.js experience where GitHub repos are books
 */

// ─────────────────────────────────────────────
// CONSTANTS & CONFIG
// ─────────────────────────────────────────────

const GITHUB_USER = 'AlistairBishop06';
const PLAYER_SPEED = 6;
const PLAYER_HEIGHT = 1.7;
const BOOK_PICKUP_DISTANCE = 4.0;
const DESK_INTERACT_DISTANCE = 3.5;

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

function langColor(lang) {
  return LANG_COLORS[lang] ?? LANG_COLORS[null];
}

// ─────────────────────────────────────────────
// DOM REFS
// ─────────────────────────────────────────────

const container      = document.getElementById('canvas-container');
const loadingEl      = document.getElementById('loading');
const loadingBar     = document.getElementById('loading-bar');
const overlayEl      = document.getElementById('overlay');
const enterBtn       = document.getElementById('enter-btn');
const bookInfoEl     = document.getElementById('book-info');
const bookInfoName   = document.getElementById('book-info-name');
const bookInfoDesc   = document.getElementById('book-info-desc');
const heldInfoEl     = document.getElementById('held-info');
const heldNameEl     = document.getElementById('held-name');
const deskPromptEl   = document.getElementById('desk-prompt');
const readmeModal    = document.getElementById('readme-modal');
const readmeCover    = document.getElementById('readme-cover');
const readmeCoverTitle = document.getElementById('readme-cover-title');
const readmeCoverLang  = document.getElementById('readme-cover-lang');
const readmeCoverStars = document.getElementById('readme-cover-stars');
const readmeRepoName   = document.getElementById('readme-repo-name');
const readmeContent    = document.getElementById('readme-content');
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

// Fog for atmosphere
scene.fog = new THREE.FogExp2(0x1a1005, 0.045);

// ─────────────────────────────────────────────
// LIGHTING
// ─────────────────────────────────────────────

// Warm ambient
const ambient = new THREE.AmbientLight(0x3d2a15, 0.8);
scene.add(ambient);

// Main warm directional light (simulates overhead lamp)
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

// Warm point lights for candlelight effect
const pointLights = [
  { pos: [6, 3, 0],   color: 0xff9933, intensity: 1.5 },
  { pos: [-6, 3, 0],  color: 0xff8822, intensity: 1.5 },
  { pos: [0, 3, -10], color: 0xffaa44, intensity: 1.2 },
  { pos: [0, 3, 10],  color: 0xff9933, intensity: 1.0 },
];
pointLights.forEach(({ pos, color, intensity }) => {
  const pl = new THREE.PointLight(color, intensity, 18);
  pl.position.set(...pos);
  pl.castShadow = false;
  scene.add(pl);
});

// ─────────────────────────────────────────────
// MATERIALS (shared)
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
  // Floor
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM_W, 0.3, ROOM_D),
    floorMat
  );
  floor.position.set(0, -0.15, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  // Ceiling
  const ceil = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM_W, 0.3, ROOM_D),
    ceilMat
  );
  ceil.position.set(0, ROOM_H + 0.15, 0);
  scene.add(ceil);

  // Walls — back, front, left, right
  const walls = [
    { pos: [0, ROOM_H/2, -ROOM_D/2], size: [ROOM_W, ROOM_H, 0.4] },
    { pos: [0, ROOM_H/2,  ROOM_D/2], size: [ROOM_W, ROOM_H, 0.4] },
    { pos: [-ROOM_W/2, ROOM_H/2, 0], size: [0.4, ROOM_H, ROOM_D] },
    { pos: [ ROOM_W/2, ROOM_H/2, 0], size: [0.4, ROOM_H, ROOM_D] },
  ];
  walls.forEach(({ pos, size }) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(...size), wallMat);
    w.position.set(...pos);
    w.receiveShadow = true;
    w.castShadow = true;
    scene.add(w);
  });

  // Floor planks (visual detail — thin lines)
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

// Returns array of shelf "slots" — each slot has { position, normal }
// Books will be placed into these slots
const shelfSlots = [];   // { position: Vector3, normal: Vector3 }
const shelfObjects = []; // collidable shelf meshes

const SHELF_H    = 0.12;  // shelf plank thickness
const SHELF_D    = 0.28;  // shelf depth
const BOOKS_PER_SHELF = 8;
const SHELF_ROWS = 3;     // rows of shelves per unit
const SHELF_SPACING = 1.1; // vertical between shelves

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

  // Side panels
  [-unitW/2, unitW/2].forEach(sx => {
    const side = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, SHELF_ROWS * SHELF_SPACING + 0.5, SHELF_D),
      shelfMat
    );
    side.position.set(sx, (SHELF_ROWS * SHELF_SPACING + 0.5) / 2 + baseH, 0);
    side.castShadow = true;
    group.add(side);
  });

  // Base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(unitW, baseH, SHELF_D),
    shelfMat
  );
  base.position.set(0, baseH / 2, 0);
  group.add(base);

  // Shelves + slots
  for (let row = 0; row < SHELF_ROWS; row++) {
    const shelfY = baseH + 0.45 + row * SHELF_SPACING;

    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(unitW, SHELF_H, SHELF_D),
      shelfMat
    );
    plank.position.set(0, shelfY, 0);
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);

    // Create book slots on this shelf
    const slotStartX = -unitW / 2 + 0.2;
    const slotWidth  = (unitW - 0.4) / BOOKS_PER_SHELF;

    for (let col = 0; col < BOOKS_PER_SHELF; col++) {
      // Local slot position
      const localPos = new THREE.Vector3(
        slotStartX + col * slotWidth + slotWidth / 2,
        shelfY + SHELF_H / 2 + 0.001,
        0
      );
      // Transform to world
      group.updateWorldMatrix(true, false);
      const worldPos = localPos.clone().applyMatrix4(group.matrixWorld);

      // Normal points in same direction as shelf faces
      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(group.quaternion);

      shelfSlots.push({ position: worldPos, normal, rotY });
    }
  }

  scene.add(group);
  shelfObjects.push(group);
}

function buildShelves() {
  // Left wall row
  for (let i = 0; i < 3; i++) {
    addShelfUnit(-ROOM_W/2 + 1.8, -10 + i * 7, 0);
  }
  // Right wall row
  for (let i = 0; i < 3; i++) {
    addShelfUnit(ROOM_W/2 - 1.8, -10 + i * 7, Math.PI);
  }
  // Back wall row
  for (let i = 0; i < 2; i++) {
    addShelfUnit(-3.5 + i * 7, -ROOM_D/2 + 1.8, Math.PI / 2);
  }
  // Centre island shelves
  addShelfUnit(-4, 0, 0);
  addShelfUnit( 4, 0, Math.PI);
}

// ─────────────────────────────────────────────
// CHECKOUT DESK
// ─────────────────────────────────────────────

const DESK_POS = new THREE.Vector3(0, 0, 6);

function buildDesk() {
  const group = new THREE.Group();
  group.position.copy(DESK_POS);

  // Desk surface
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 1.2), deskMat);
  top.position.y = 1.0;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Desk body
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 1.1), deskMat);
  body.position.y = 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Legs
  [[-1.4, -0.45], [1.4, -0.45], [-1.4, 0.45], [1.4, 0.45]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.08), deskMat);
    leg.position.set(lx, 0.5, lz);
    group.add(leg);
  });

  // Small lamp on desk
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

  // Lamp light
  const lampLight = new THREE.PointLight(0xffcc66, 2.0, 6);
  lampLight.position.set(1.2, 1.7, 0);
  group.add(lampLight);

  // "CHECKOUT" sign
  const signGeo = new THREE.BoxGeometry(1.2, 0.3, 0.05);
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 256; signCanvas.height = 64;
  const ctx = signCanvas.getContext('2d');
  ctx.fillStyle = '#2a1a06';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#e8d5a3';
  ctx.font = 'bold 22px Georgia';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CHECKOUT', 128, 32);
  const signTex = new THREE.CanvasTexture(signCanvas);
  const sign = new THREE.Mesh(signGeo, new THREE.MeshLambertMaterial({ map: signTex }));
  sign.position.set(0, 1.22, -0.65);
  group.add(sign);

  scene.add(group);
}

// ─────────────────────────────────────────────
// BOOK CREATION
// ─────────────────────────────────────────────

const books = []; // { mesh, repo, slotIndex, isHeld, originalPosition, originalRotation }

function makeBookTexture(repo) {
  // High-res canvas: 128 wide × 512 tall — maps onto the narrow spine face
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const col = langColor(repo.language);
  const r = (col >> 16) & 0xff;
  const g = (col >> 8) & 0xff;
  const b = col & 0xff;

  // Spine background with a subtle vertical gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0,   `rgb(${Math.min(r+30,255)},${Math.min(g+30,255)},${Math.min(b+30,255)})`);
  grad.addColorStop(0.5, `rgb(${r},${g},${b})`);
  grad.addColorStop(1,   `rgb(${Math.max(r-40,0)},${Math.max(g-40,0)},${Math.max(b-40,0)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 512);

  // Dark header/footer bands
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0,   128, 48);
  ctx.fillRect(0, 464, 128, 48);

  // Gold rule lines inside the bands
  ctx.fillStyle = 'rgba(255,210,80,0.7)';
  ctx.fillRect(8, 50,  112, 2);
  ctx.fillRect(8, 460, 112, 2);

  // Thin side border lines for a classic bound-book look
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0,   0, 6, 512);
  ctx.fillRect(122, 0, 6, 512);

  // ── Title text, rotated to run bottom→top along spine ──
  const name = repo.name.replace(/-/g, ' ').replace(/_/g, ' ');

  ctx.save();
  ctx.translate(64, 470);   // start near bottom
  ctx.rotate(-Math.PI / 2); // rotate so text reads upward

  // Dark backing strip so text is legible on any colour
  const maxTextW = 380;
  ctx.font = 'bold 28px Georgia, serif';
  let displayName = name;
  while (ctx.measureText(displayName).width > maxTextW && displayName.length > 2) {
    displayName = displayName.slice(0, -1);
  }
  if (displayName !== name) displayName += '…';

  const tw = ctx.measureText(displayName).width;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-8, -22, tw + 16, 34);

  // White text with strong shadow
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayName, 0, 0);
  ctx.restore();

  // ── Language label in the header band ──
  if (repo.language) {
    ctx.save();
    ctx.font = '500 18px Georgia, serif';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(repo.language, 64, 24);
    ctx.restore();
  }

  return new THREE.CanvasTexture(canvas);
}

function createBook(repo, slotIndex) {
  const slot = shelfSlots[slotIndex];
  if (!slot) return null;

  const col = langColor(repo.language);
  const spineTex = makeBookTexture(repo);

  // Book dimensions: width=spine, height=tall, depth=page thickness
  const bW = 0.075 + Math.random() * 0.035;
  const bH = 0.62 + Math.random() * 0.15;
  const bD = 0.22;

  const geo = new THREE.BoxGeometry(bW, bH, bD);

  // Multi-material: spine gets texture, others get solid colour
  const spineMat = new THREE.MeshLambertMaterial({ map: spineTex });
  const solidMat = new THREE.MeshLambertMaterial({ color: col });
  const pageMat  = new THREE.MeshLambertMaterial({ color: 0xe8d5b0 });

  // BoxGeometry faces: +x, -x, +y, -y, +z(front/spine), -z(back)
  const materials = [solidMat, solidMat, pageMat, solidMat, spineMat, solidMat];

  const mesh = new THREE.Mesh(geo, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Position at slot
  mesh.position.copy(slot.position);
  mesh.position.y += bH / 2;
  mesh.rotation.y = slot.rotY ?? 0;

  mesh.userData = {
    repo,
    slotIndex,
    bookHeight: bH,
    bookWidth: bW,
    isBook: true,
    shelfRotY: slot.rotY ?? 0,
  };

  scene.add(mesh);

  books.push({
    mesh,
    repo,
    slotIndex,
    isHeld: false,
    originalPosition: mesh.position.clone(),
    originalRotation: mesh.rotation.clone(),
  });

  return mesh;
}

// ─────────────────────────────────────────────
// PLAYER CONTROLLER
// ─────────────────────────────────────────────

const keys = {};
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
let pointerLocked = false;
let pitchObj = new THREE.Object3D();
let yawObj   = new THREE.Object3D();

// Camera rig: yaw (left/right) → pitch (up/down) → camera
yawObj.add(pitchObj);
pitchObj.add(camera);
yawObj.position.set(0, PLAYER_HEIGHT, 8);
scene.add(yawObj);

// Reset camera local position
camera.position.set(0, 0, 0);

function setupControls() {
  document.addEventListener('keydown', e => { keys[e.code] = true; });
  document.addEventListener('keyup',   e => { keys[e.code] = false; });

  document.addEventListener('mousemove', e => {
    if (!pointerLocked) return;
    const dx = e.movementX * 0.002;
    const dy = e.movementY * 0.002;
    yawObj.rotation.y  -= dx;
    pitchObj.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitchObj.rotation.x - dy));
  });

  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === renderer.domElement;
  });

  renderer.domElement.addEventListener('click', () => {
    if (!pointerLocked) {
      renderer.domElement.requestPointerLock();
    } else {
      handleClick();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.code === 'KeyE') handleCheckout();
    if (e.code === 'KeyQ') returnHeldBook();
    if (e.code === 'Escape' && bookOpen) closeBook();
    if (e.code === 'ArrowRight' && bookOpen) flipPage(1);
    if (e.code === 'ArrowLeft'  && bookOpen) flipPage(-1);
    // Also allow D/A for page flipping when book is open
    if (e.code === 'KeyD' && bookOpen) { flipPage(1);  e.stopPropagation(); }
    if (e.code === 'KeyA' && bookOpen) { flipPage(-1); e.stopPropagation(); }
  });

  // Click backdrop to close readme (no longer used but harmless)
  readmeBackdrop.addEventListener('click', () => {
    if (bookOpen) closeBook();
  });
}

// ─────────────────────────────────────────────
// INTERACTION SYSTEM
// ─────────────────────────────────────────────

const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);
let heldBook = null;
let lookedAtBook = null;

function getBookMeshes() {
  return books.filter(b => !b.isHeld).map(b => b.mesh);
}

// ─────────────────────────────────────────────
// BOOK TILT (hover effect)
// ─────────────────────────────────────────────

// Each entry: { bookData, tilt } where tilt goes 0→1 (out) or 1→0 (back)
// We track ALL books that are mid-animation so they ease back smoothly.
const tiltingBooks = new Map(); // bookData → current tilt amount 0..1

const TILT_AMOUNT  = 0.18; // metres the book slides out toward the player
const TILT_SPEED   = 8;    // how fast it animates (units/sec, lerp-style)

function updateBookTilts(dt) {
  for (const [bookData, tilt] of tiltingBooks) {
    const isTarget = bookData === lookedAtBook && !bookData.isHeld;
    const target   = isTarget ? 1 : 0;
    const next     = THREE.MathUtils.lerp(tilt, target, 1 - Math.exp(-TILT_SPEED * dt));

    // Work out the direction the book's spine faces (outward from shelf)
    // Each shelf was built so +Z in local space faces the player side.
    // The book's rotation.y encodes the shelf's rotY, so we push along that.
    const angle = bookData.mesh.userData.shelfRotY ?? 0;
    const outDir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));

    const base = bookData.originalPosition.clone();
    bookData.mesh.position.copy(base).addScaledVector(outDir, next * TILT_AMOUNT);

    if (Math.abs(next - target) < 0.001) {
      // Snap to final value and stop tracking if fully settled
      bookData.mesh.position.copy(base).addScaledVector(outDir, target * TILT_AMOUNT);
      if (target === 0) {
        tiltingBooks.delete(bookData);
      } else {
        tiltingBooks.set(bookData, target);
      }
    } else {
      tiltingBooks.set(bookData, next);
    }
  }
}

let hoveredBook = null;

function setBookHover(bookData, on) {
  if (on && !tiltingBooks.has(bookData)) {
    tiltingBooks.set(bookData, 0); // start tilt-out from 0
  }
  if (!on && tiltingBooks.has(bookData)) {
    // Keep in map so it animates back to 0
    tiltingBooks.set(bookData, tiltingBooks.get(bookData));
  }
}

function formatLastUpdated(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days  = Math.floor(diff / 86400000);
  if (days === 0) return 'Updated today';
  if (days === 1) return 'Updated yesterday';
  if (days <  30) return `Updated ${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Updated ${months}mo ago`;
  return `Updated ${Math.floor(months / 12)}y ago`;
}

function updateRaycast() {
  raycaster.setFromCamera(screenCenter, camera);
  const meshes = getBookMeshes();
  const hits = raycaster.intersectObjects(meshes);

  if (hits.length > 0 && hits[0].distance < BOOK_PICKUP_DISTANCE) {
    const hit = hits[0].object;
    const bookData = books.find(b => b.mesh === hit);
    if (bookData) {
      if (hoveredBook && hoveredBook !== bookData) {
        setBookHover(hoveredBook, false);
      }
      if (hoveredBook !== bookData) {
        setBookHover(bookData, true);
        hoveredBook = bookData;
      }

      lookedAtBook = bookData;
      bookInfoName.textContent = bookData.repo.name;
      bookInfoDesc.textContent = bookData.repo.description || 'No description provided.';

      const updated = formatLastUpdated(bookData.repo.pushed_at || bookData.repo.updated_at);
      document.getElementById('book-info-updated').textContent = updated;

      bookInfoEl.classList.add('visible');
      return;
    }
  }

  // Nothing hit — retract any hoveredBook and clear HUD
  if (hoveredBook) {
    setBookHover(hoveredBook, false);
    hoveredBook = null;
  }
  lookedAtBook = null;
  bookInfoEl.classList.remove('visible');
}

function handleClick() {
  if (!lookedAtBook || heldBook) return;
  const bookData = lookedAtBook;

  // Stop tilt, restore shelf position cleanly
  tiltingBooks.delete(bookData);
  bookData.mesh.position.copy(bookData.originalPosition);
  hoveredBook  = null;
  lookedAtBook = null;
  bookInfoEl.classList.remove('visible');

  bookData.isHeld      = true;
  bookData.pickupPhase = 'lifting';
  bookData.pickupT     = 0;

  // Snapshot world position at start of lift
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

// Where the book rests in camera-local space once held
const HELD_POS = new THREE.Vector3(0.3, -0.26, -0.5);
const HELD_ROT = new THREE.Euler(0.05, -0.25, 0.03);

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function updateHeldBook(dt) {
  if (!heldBook) return;
  heldBookTime += dt;

  const book = heldBook;
  const mesh = book.mesh;

  // ── Phase: lifting from shelf into camera space ──────────────
  if (book.pickupPhase === 'lifting') {
    book.pickupT = Math.min(1, book.pickupT + dt / 0.55);
    const t = easeOutCubic(book.pickupT);

    // Target = HELD_POS expressed in world space
    const camWorldPos  = new THREE.Vector3();
    const camWorldQuat = new THREE.Quaternion();
    camera.getWorldPosition(camWorldPos);
    camera.getWorldQuaternion(camWorldQuat);

    const targetPos  = HELD_POS.clone().applyQuaternion(camWorldQuat).add(camWorldPos);
    const targetQuat = new THREE.Quaternion().setFromEuler(HELD_ROT).premultiply(camWorldQuat);

    mesh.position.copy(book.pickupStartPos.clone().lerp(targetPos, t));
    mesh.quaternion.copy(book.pickupStartQuat.clone().slerp(targetQuat, t));

    if (book.pickupT >= 1) {
      // Reparent to camera — now tracks camera movement for free
      scene.remove(mesh);
      camera.add(mesh);
      mesh.position.copy(HELD_POS);
      mesh.rotation.copy(HELD_ROT);
      book.pickupPhase = 'held';
      heldBookTime = 0;
    }
    return;
  }

  // ── Phase: idle bob in hand ───────────────────────────────────
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

let bookOpen      = false;
let openBookData  = null;
let pageGroup     = null;   // THREE.Group parented to camera, holds open pages
let currentPage   = 0;      // index into pageChunks (increments by 2 per flip)
let pageChunks    = [];      // array of plain-text strings, one per page

// Page flip animation state
let flipState     = null;   // null | { dir: +1/-1, t: 0, fromPage: n }
const FLIP_SPEED  = 3.5;

// Book open animation
let openT = 0;
let openAnimating = false;

const PAGE_W = 0.38;
const PAGE_H = 0.52;
const PAGE_GAP = 0.005;

// Render one page of text onto a canvas texture
function makePageTexture(text, pageNum, totalPages) {
  const W = 512, H = 700;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Aged paper background
  ctx.fillStyle = '#f2e8d0';
  ctx.fillRect(0, 0, W, H);

  // Subtle inner shadow border
  const border = ctx.createLinearGradient(0, 0, 30, 0);
  border.addColorStop(0, 'rgba(0,0,0,0.08)');
  border.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = border;
  ctx.fillRect(0, 0, 30, H);

  // Faint horizontal rules
  ctx.strokeStyle = 'rgba(150,120,80,0.12)';
  ctx.lineWidth = 1;
  for (let y = 80; y < H - 40; y += 26) {
    ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(W - 28, y); ctx.stroke();
  }

  // Text
  ctx.fillStyle = '#1a0e04';
  ctx.font = '500 18px Georgia, serif';

  const lines = text.split('\n');
  let y = 52;
  const lineH = 26;
  const marginL = 36, marginR = W - 36;
  const maxW = marginR - marginL;

  for (const rawLine of lines) {
    if (y > H - 55) break;

    // Heading styles
    if (rawLine.startsWith('### ')) {
      ctx.font = 'bold 17px Georgia, serif';
      ctx.fillStyle = '#3a1a08';
      ctx.fillText(rawLine.slice(4), marginL, y);
      ctx.font = '500 18px Georgia, serif';
      ctx.fillStyle = '#1a0e04';
      y += lineH + 4;
      continue;
    }
    if (rawLine.startsWith('## ')) {
      ctx.font = 'bold 20px Georgia, serif';
      ctx.fillStyle = '#2a0e04';
      ctx.fillText(rawLine.slice(3), marginL, y);
      ctx.font = '500 18px Georgia, serif';
      ctx.fillStyle = '#1a0e04';
      y += lineH + 6;
      continue;
    }
    if (rawLine.startsWith('# ')) {
      ctx.font = 'bold 22px Georgia, serif';
      ctx.fillStyle = '#1a0804';
      ctx.fillText(rawLine.slice(2), marginL, y);
      ctx.font = '500 18px Georgia, serif';
      ctx.fillStyle = '#1a0e04';
      y += lineH + 8;
      // Underline
      ctx.strokeStyle = 'rgba(80,40,10,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(marginL, y - 6); ctx.lineTo(marginR, y - 6); ctx.stroke();
      continue;
    }

    // Bullet
    const displayLine = rawLine.startsWith('- ') || rawLine.startsWith('* ')
      ? '• ' + rawLine.slice(2)
      : rawLine;

    // Word-wrap
    const words = displayLine.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, marginL, y);
        y += lineH;
        line = word;
        if (y > H - 55) break;
      } else {
        line = test;
      }
    }
    if (line && y <= H - 55) { ctx.fillText(line, marginL, y); y += lineH; }
    if (!rawLine.trim()) y += 4; // blank line spacing
  }

  // Page number
  ctx.font = 'italic 14px Georgia, serif';
  ctx.fillStyle = 'rgba(100,70,40,0.5)';
  ctx.textAlign = 'center';
  ctx.fillText(`${pageNum + 1} / ${totalPages}`, W / 2, H - 18);

  return new THREE.CanvasTexture(canvas);
}

// Split plain-text markdown into page-sized chunks
function splitIntoPages(md) {
  if (!md) return ['No README found for this repository.'];

  // Strip heavy markdown syntax to plain readable text
  const plain = md
    .replace(/```[\s\S]*?```/g, '[code block]')
    .replace(/!\[.*?\]\(.*?\)/g, '[image]')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/^#{1,6} /gm, '')
    .replace(/^\s*[-*]\s/gm, '- ')
    .replace(/\r/g, '');

  const lines    = plain.split('\n');
  const chunks   = [];
  let current    = [];
  let lineCount  = 0;
  const LINES_PER_PAGE = 22;

  for (const line of lines) {
    // Each blank line + content line = ~1 visual row
    const weight = line.trim() === '' ? 0.4 : (line.length > 60 ? 2 : 1);
    if (lineCount + weight > LINES_PER_PAGE && current.length) {
      chunks.push(current.join('\n'));
      current = [];
      lineCount = 0;
    }
    current.push(line);
    lineCount += weight;
  }
  if (current.length) chunks.push(current.join('\n'));
  return chunks.length ? chunks : ['No content.'];
}

function buildOpenBook(bookData) {
  if (pageGroup) {
    camera.remove(pageGroup);
    pageGroup = null;
  }

  pageGroup = new THREE.Group();
  // Position open book in front of camera, centred
  pageGroup.position.set(0, -0.08, -0.58);
  pageGroup.rotation.set(0.18, 0, 0);
  camera.add(pageGroup);

  renderPageSpread(bookData);
}

function renderPageSpread(bookData) {
  // Remove old page planes but keep group
  while (pageGroup.children.length) pageGroup.remove(pageGroup.children[0]);

  const chunks = pageChunks;
  const leftIdx  = currentPage;
  const rightIdx = currentPage + 1;

  // Cover (book body) — flat open, two halves
  const col = langColor(bookData.repo.language);
  const coverMat = new THREE.MeshLambertMaterial({ color: col });
  const pageMat  = new THREE.MeshLambertMaterial({ color: 0xe8d5b0 });

  // Left cover half
  const leftCover = new THREE.Mesh(new THREE.BoxGeometry(PAGE_W, PAGE_H, 0.018), coverMat);
  leftCover.position.set(-PAGE_W / 2 - PAGE_GAP, 0, 0);
  pageGroup.add(leftCover);

  // Right cover half
  const rightCover = new THREE.Mesh(new THREE.BoxGeometry(PAGE_W, PAGE_H, 0.018), coverMat);
  rightCover.position.set(PAGE_W / 2 + PAGE_GAP, 0, 0);
  pageGroup.add(rightCover);

  // Spine strip
  const spine = new THREE.Mesh(new THREE.BoxGeometry(PAGE_GAP * 2, PAGE_H, 0.02), coverMat);
  pageGroup.add(spine);

  // Left page
  if (leftIdx < chunks.length) {
    const tex  = makePageTexture(chunks[leftIdx], leftIdx, chunks.length);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(PAGE_W - 0.01, PAGE_H - 0.01),
      new THREE.MeshLambertMaterial({ map: tex, side: THREE.FrontSide })
    );
    plane.position.set(-PAGE_W / 2 - PAGE_GAP, 0, 0.011);
    pageGroup.add(plane);
  } else {
    // Blank page
    const blank = new THREE.Mesh(
      new THREE.PlaneGeometry(PAGE_W - 0.01, PAGE_H - 0.01),
      new THREE.MeshLambertMaterial({ color: 0xf2e8d0 })
    );
    blank.position.set(-PAGE_W / 2 - PAGE_GAP, 0, 0.011);
    pageGroup.add(blank);
  }

  // Right page
  if (rightIdx < chunks.length) {
    const tex  = makePageTexture(chunks[rightIdx], rightIdx, chunks.length);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(PAGE_W - 0.01, PAGE_H - 0.01),
      new THREE.MeshLambertMaterial({ map: tex, side: THREE.FrontSide })
    );
    plane.position.set(PAGE_W / 2 + PAGE_GAP, 0, 0.011);
    pageGroup.add(plane);
  } else {
    const blank = new THREE.Mesh(
      new THREE.PlaneGeometry(PAGE_W - 0.01, PAGE_H - 0.01),
      new THREE.MeshLambertMaterial({ color: 0xf2e8d0 })
    );
    blank.position.set(PAGE_W / 2 + PAGE_GAP, 0, 0.011);
    pageGroup.add(blank);
  }

  // Page counter HUD
  updatePageHUD();
}

function updatePageHUD() {
  const el = document.getElementById('page-counter');
  if (!el || !bookOpen) return;
  const total = pageChunks.length;
  const spread = Math.floor(currentPage / 2) + 1;
  const totalSpreads = Math.ceil(total / 2);
  el.textContent = `${spread} / ${totalSpreads}`;
  el.style.opacity = '1';

  // Arrow hints
  document.getElementById('page-prev').style.opacity = currentPage > 0 ? '1' : '0.2';
  document.getElementById('page-next').style.opacity = currentPage + 2 < total ? '1' : '0.2';
}

// Flip animation — we swap pages instantly at midpoint of the flip
function flipPage(dir) {
  if (flipState) return; // already flipping
  const next = currentPage + dir * 2;
  if (next < 0 || next >= pageChunks.length) return;
  flipState = { dir, t: 0, fromPage: currentPage };
}

function updateFlip(dt) {
  if (!flipState || !pageGroup) return;
  flipState.t += dt * FLIP_SPEED;

  // Tilt the whole page group slightly as a page-turn cue
  const t = flipState.t;
  const tilt = Math.sin(Math.PI * Math.min(t, 1)) * 0.06 * flipState.dir;
  pageGroup.rotation.z = tilt;

  if (t >= 0.5 && !flipState.swapped) {
    // Swap content at midpoint
    currentPage += flipState.dir * 2;
    renderPageSpread(openBookData);
    flipState.swapped = true;
  }

  if (t >= 1) {
    pageGroup.rotation.z = 0;
    flipState = null;
  }
}

async function openBook(bookData) {
  if (bookData.pickupPhase !== 'held') return;

  openBookData = bookData;
  bookOpen     = true;

  // Fetch README and split into pages
  pageChunks  = ['Loading…'];
  currentPage = 0;

  // Hide the spine book mesh
  bookData.mesh.visible = false;

  // Build the open book geometry immediately with loading state
  buildOpenBook(bookData);
  showPageHUD(true);

  // Fetch in background
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

  if (pageGroup) {
    camera.remove(pageGroup);
    pageGroup = null;
  }
  if (openBookData) {
    openBookData.mesh.visible = true;
  }
  openBookData = null;
  flipState    = null;
  showPageHUD(false);
  renderer.domElement.requestPointerLock();
}

function showPageHUD(on) {
  const el = document.getElementById('page-hud');
  if (el) el.style.opacity = on ? '1' : '0';
  if (!on) {
    const counter = document.getElementById('page-counter');
    if (counter) counter.style.opacity = '0';
  }
}

function updateDeskProximity() {
  if (bookOpen) return;
  const dist = yawObj.position.distanceTo(DESK_POS);
  if (dist < DESK_INTERACT_DISTANCE && heldBook && heldBook.pickupPhase === 'held') {
    deskPromptEl.classList.add('visible');
  } else {
    deskPromptEl.classList.remove('visible');
  }
}

// ─────────────────────────────────────────────
// PLAYER MOVEMENT
// ─────────────────────────────────────────────

const moveDir = new THREE.Vector3();
const clock   = new THREE.Clock();

function updateMovement(dt) {
  if (bookOpen) return; // freeze player while reading
  moveDir.set(0, 0, 0);

  if (keys['KeyW']) moveDir.z -= 1;
  if (keys['KeyS']) moveDir.z += 1;
  if (keys['KeyA']) moveDir.x -= 1;
  if (keys['KeyD']) moveDir.x += 1;

  if (moveDir.length() === 0) return;
  moveDir.normalize();

  // Rotate movement relative to yaw only
  moveDir.applyEuler(new THREE.Euler(0, yawObj.rotation.y, 0));

  const next = yawObj.position.clone().addScaledVector(moveDir, PLAYER_SPEED * dt);

  // Simple boundary clamping (room walls)
  const hw = ROOM_W / 2 - 0.5;
  const hd = ROOM_D / 2 - 0.5;
  next.x = Math.max(-hw, Math.min(hw, next.x));
  next.z = Math.max(-hd, Math.min(hd, next.z));
  next.y = PLAYER_HEIGHT;

  yawObj.position.copy(next);
}

// ─────────────────────────────────────────────
// DECORATIVE PROPS
// ─────────────────────────────────────────────

function buildProps() {
  // Reading chair
  const chairMat = new THREE.MeshLambertMaterial({ color: 0x3d1a0a });
  const chair = new THREE.Group();

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.7), chairMat);
  seat.position.y = 0.45;
  chair.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), chairMat);
  back.position.set(0, 0.88, -0.3);
  chair.add(back);

  [[-0.35, 0.2], [0.35, 0.2], [-0.35, -0.2], [0.35, -0.2]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), chairMat);
    leg.position.set(lx, 0.22, lz);
    chair.add(leg);
  });

  chair.position.set(3.5, 0, 3);
  chair.rotation.y = -0.4;
  chair.castShadow = true;
  scene.add(chair);

  // Small table near chair
  const tableMat = new THREE.MeshLambertMaterial({ color: 0x4a2a0d });
  const table = new THREE.Group();

  const tabTop = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 16), tableMat);
  tabTop.position.y = 0.65;
  table.add(tabTop);

  const tabLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.65, 8), tableMat);
  tabLeg.position.y = 0.32;
  table.add(tabLeg);

  table.position.set(4.8, 0, 2.5);
  scene.add(table);

  // Candle on table
  const candleMat = new THREE.MeshLambertMaterial({ color: 0xe8d08a });
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 8), candleMat);
  candle.position.set(4.8, 0.74, 2.5);
  scene.add(candle);

  const flame = new THREE.PointLight(0xff9933, 1.5, 4);
  flame.position.set(4.8, 0.95, 2.5);
  scene.add(flame);

  // Animate flame flicker
  window._flameLight = flame;

  // Rug under chair area
  const rugGeo = new THREE.BoxGeometry(3, 0.02, 2.5);
  const rugMat = new THREE.MeshLambertMaterial({ color: 0x7a3020 });
  const rug = new THREE.Mesh(rugGeo, rugMat);
  rug.position.set(4, 0.01, 3);
  scene.add(rug);

  // Stack of books on desk
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

  // If book is open, E closes it
  if (bookOpen) { closeBook(); return; }

  // Pickup must be complete before any action
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

  if (heldBook.pickupPhase === 'held') {
    camera.remove(mesh);
    scene.add(mesh);
  }

  mesh.visible = true;
  // Restore to exact shelf position (originalPosition already includes the y offset)
  mesh.position.copy(heldBook.originalPosition);
  mesh.rotation.copy(heldBook.originalRotation);

  heldBook.isHeld      = false;
  heldBook.pickupPhase = null;
  heldBook    = null;
  heldBookTime = 0;

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
      // Filter out forks, sort by stars
      repos = repos.filter(r => !r.fork).sort((a, b) => b.stargazers_count - a.stargazers_count);
    }
  } catch (e) {
    console.warn('Could not fetch repos, using placeholder data.', e);
  }

  // Fallback placeholder if no repos loaded
  if (!repos.length || repos.error) {
    repos = Array.from({ length: 12 }, (_, i) => ({
      name: `project-${i + 1}`,
      description: 'A placeholder repository.',
      html_url: 'https://github.com/' + GITHUB_USER,
      language: ['JavaScript', 'Python', 'TypeScript', 'Rust', 'HTML', null][i % 6],
      stargazers_count: 0,
      fork: false,
    }));
  }

  // Only place as many books as we have slots
  const count = Math.min(repos.length, shelfSlots.length);
  for (let i = 0; i < count; i++) {
    createBook(repos[i], i);
    progressCb(i / count);
    // Yield to keep page responsive
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

  // Raycast every other frame — skip when book is open
  if (frameCount % 2 === 0 && !bookOpen) updateRaycast();
  updateDeskProximity();

  // Candle flicker
  if (window._flameLight) {
    window._flameLight.intensity = 1.3 + Math.sin(frameCount * 0.18) * 0.2 + Math.random() * 0.1;
  }

  renderer.render(scene, camera);
}

// ─────────────────────────────────────────────
// WINDOW RESIZE
// ─────────────────────────────────────────────

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

async function init() {
  // Build static scene
  buildRoom();
  buildShelves();
  buildDesk();
  buildProps();

  // Fetch repos and populate books
  await fetchAndBuildBooks(p => {
    loadingBar.style.width = (p * 100).toFixed(0) + '%';
  });

  // Hide loading screen
  loadingEl.classList.add('hidden');

  // Set up enter button
  enterBtn.addEventListener('click', () => {
    overlayEl.classList.add('hidden');
    renderer.domElement.requestPointerLock();
  });

  // Re-show overlay when pointer unlocked
  document.addEventListener('pointerlockchange', () => {
    if (!document.pointerLockElement) {
      pointerLocked = false;
    }
  });

  setupControls();
  animate();
}

init();