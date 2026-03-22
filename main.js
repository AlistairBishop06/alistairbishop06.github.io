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
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const col = langColor(repo.language);
  const r = (col >> 16) & 0xff;
  const g = (col >> 8) & 0xff;
  const b = col & 0xff;

  // Spine background
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, 64, 256);

  // Darker top and bottom strips
  ctx.fillStyle = `rgba(0,0,0,0.3)`;
  ctx.fillRect(0, 0, 64, 20);
  ctx.fillRect(0, 236, 64, 20);

  // Gold line accents
  ctx.fillStyle = 'rgba(255,215,100,0.5)';
  ctx.fillRect(4, 22, 56, 2);
  ctx.fillRect(4, 232, 56, 2);

  // Title text (rotated along spine)
  ctx.save();
  ctx.translate(32, 230);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 4;

  const name = repo.name.replace(/-/g, ' ').replace(/_/g, ' ');
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Truncate if too long
  const maxW = 190;
  let displayName = name;
  while (ctx.measureText(displayName).width > maxW && displayName.length > 3) {
    displayName = displayName.slice(0, -1);
  }
  if (displayName !== name) displayName += '…';

  ctx.fillText(displayName, 0, 0);
  ctx.restore();

  return new THREE.CanvasTexture(canvas);
}

function createBook(repo, slotIndex) {
  const slot = shelfSlots[slotIndex];
  if (!slot) return null;

  const col = langColor(repo.language);
  const spineTex = makeBookTexture(repo);

  // Book dimensions: width=spine, height=tall, depth=page thickness
  const bW = 0.055 + Math.random() * 0.03;
  const bH = 0.6 + Math.random() * 0.15;
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
    if (e.code === 'Escape' && readmeOpen) closeReadme();
  });

  // Click backdrop to close readme
  readmeBackdrop.addEventListener('click', () => {
    if (readmeOpen) closeReadme();
  });
}

// ─────────────────────────────────────────────
// INTERACTION SYSTEM
// ─────────────────────────────────────────────

const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);
let heldBook = null;
let lookedAtBook = null;
let readmeOpen = false;

// Smooth held book target
const heldTarget = new THREE.Object3D();
camera.add(heldTarget);
heldTarget.position.set(0.35, -0.28, -0.55);

function getBookMeshes() {
  return books.filter(b => !b.isHeld).map(b => b.mesh);
}

function updateRaycast() {
  raycaster.setFromCamera(screenCenter, camera);
  const meshes = getBookMeshes();
  const hits = raycaster.intersectObjects(meshes);

  if (hits.length > 0 && hits[0].distance < BOOK_PICKUP_DISTANCE) {
    const hit = hits[0].object;
    const bookData = books.find(b => b.mesh === hit);
    if (bookData) {
      lookedAtBook = bookData;
      bookInfoName.textContent = bookData.repo.name;
      bookInfoDesc.textContent = bookData.repo.description || 'No description provided.';
      bookInfoEl.classList.add('visible');
      return;
    }
  }

  lookedAtBook = null;
  bookInfoEl.classList.remove('visible');
}

function handleClick() {
  if (!lookedAtBook || heldBook) return;

  const bookData = lookedAtBook;
  bookData.isHeld = true;
  heldBook = bookData;

  heldNameEl.textContent = bookData.repo.name;
  heldInfoEl.classList.add('visible');
  bookInfoEl.classList.remove('visible');

  // Attach book mesh to camera
  scene.remove(bookData.mesh);
  camera.add(bookData.mesh);
  bookData.mesh.position.copy(heldTarget.position);
  bookData.mesh.rotation.set(0.1, -0.3, 0.05);
}

function handleCheckout() {
  if (!heldBook) return;

  // If readme is open, E closes it
  if (readmeOpen) {
    closeReadme();
    return;
  }

  const dist = yawObj.position.distanceTo(DESK_POS);

  if (dist <= DESK_INTERACT_DISTANCE) {
    // At desk → open repo in new tab and return book
    window.open(heldBook.repo.html_url, '_blank');
    returnHeldBook();
  } else {
    // Not at desk → open README viewer
    openReadme(heldBook);
  }
}

function returnHeldBook() {
  if (!heldBook) return;
  camera.remove(heldBook.mesh);
  scene.add(heldBook.mesh);
  heldBook.mesh.position.copy(heldBook.originalPosition);
  heldBook.mesh.rotation.copy(heldBook.originalRotation);
  heldBook.isHeld = false;
  heldBook = null;
  heldInfoEl.classList.remove('visible');
  deskPromptEl.classList.remove('visible');
}

// ─────────────────────────────────────────────
// README VIEWER
// ─────────────────────────────────────────────

// Very small Markdown → HTML renderer (no deps)
function simpleMarkdown(md) {
  if (!md) return '<p class="readme-empty">No README found.</p>';

  let html = md
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

    // Fenced code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="language-${lang}">${code.trim()}</code></pre>`)

    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')

    // Images before links (order matters)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">')

    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')

    // Horizontal rule
    .replace(/^---+$/gm, '<hr>')

    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,         '<em>$1</em>')
    .replace(/__(.+?)__/g,         '<strong>$1</strong>')
    .replace(/_(.+?)_/g,           '<em>$1</em>')

    // Blockquote
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')

    // Unordered lists (simple single-level)
    .replace(/^[\*\-] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>')
    // Collapse adjacent ul tags
    .replace(/<\/ul>\s*<ul>/g, '')

    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

    // Paragraphs — wrap blocks of text not already tagged
    .split(/\n{2,}/)
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (/^<(h[1-6]|ul|ol|li|pre|blockquote|hr|img)/.test(block)) return block;
      // Replace single newlines in paragraph with <br>
      return '<p>' + block.replace(/\n/g, '<br>') + '</p>';
    })
    .join('\n');

  return html;
}

async function fetchReadme(repo) {
  // Try default branch readme via GitHub contents API
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${repo.name}/readme`,
      { headers: { Accept: 'application/vnd.github.raw' } }
    );
    if (res.ok) return await res.text();
  } catch (_) {}
  return null;
}

function openReadme(bookData) {
  const { repo } = bookData;
  const col = langColor(repo.language);
  const r = (col >> 16) & 0xff;
  const g = (col >> 8) & 0xff;
  const b = col & 0xff;

  // Darken the colour for the cover
  const darken = v => Math.max(0, Math.round(v * 0.55));
  readmeCover.style.background =
    `linear-gradient(160deg, rgb(${darken(r)},${darken(g)},${darken(b)}), rgb(${darken(r*0.6)},${darken(g*0.6)},${darken(b*0.6)}))`;

  readmeCoverTitle.textContent = repo.name.replace(/-/g, ' ').replace(/_/g, ' ');
  readmeCoverLang.textContent  = repo.language || 'Unknown';
  readmeCoverStars.innerHTML   = repo.stargazers_count > 0
    ? `★ ${repo.stargazers_count}` : '';

  readmeRepoName.textContent = repo.name;

  // Show loading state
  readmeContent.innerHTML = `<div class="readme-loading"><div class="readme-spinner"></div> Fetching README…</div>`;

  readmeModal.classList.add('visible');
  readmeOpen = true;

  // Release pointer lock so cursor is free
  document.exitPointerLock();

  // Fetch and render
  fetchReadme(repo).then(text => {
    if (text) {
      readmeContent.innerHTML = simpleMarkdown(text);
    } else {
      readmeContent.innerHTML = `
        <p class="readme-empty">No README found for this repository.</p>
        <p style="text-align:center;margin-top:8px;">
          <a href="${repo.html_url}" target="_blank" rel="noopener" style="color:#7a3a10;font-size:0.85rem;">
            View on GitHub →
          </a>
        </p>`;
    }
  });
}

function closeReadme() {
  readmeModal.classList.remove('visible');
  readmeOpen = false;
  // Re-lock pointer
  renderer.domElement.requestPointerLock();
}

function updateDeskProximity() {
  if (readmeOpen) return;
  const dist = yawObj.position.distanceTo(DESK_POS);
  if (dist < DESK_INTERACT_DISTANCE && heldBook) {
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
  if (readmeOpen) return; // freeze player while reading
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
// HELD BOOK ANIMATION
// ─────────────────────────────────────────────

let heldBookTime = 0;

function updateHeldBook(dt) {
  if (!heldBook) return;
  heldBookTime += dt;

  // Gentle bob
  const bobY = Math.sin(heldBookTime * 1.8) * 0.008;
  const bobR = Math.sin(heldBookTime * 1.2) * 0.015;

  heldBook.mesh.position.set(
    heldTarget.position.x,
    heldTarget.position.y + bobY,
    heldTarget.position.z
  );
  heldBook.mesh.rotation.set(0.1 + bobR, -0.3, 0.05 + bobR * 0.5);
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

  // Raycast every other frame for performance
  if (frameCount % 2 === 0) updateRaycast();
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