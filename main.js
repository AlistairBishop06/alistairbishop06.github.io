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

// Language → logo (used on book front covers)
// Uses Devicon via jsDelivr which generally provides CORS headers needed for canvas usage.
const LANG_LOGO_URLS = {
  'JavaScript': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
  'TypeScript': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
  'Python':     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
  'Rust':       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg',
  'Go':         'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
  'C#':         'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
  'C++':        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
  'HTML':       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
  'CSS':        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg',
  'Shell':      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg',
  'Ruby':       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg',
  'Swift':      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg',
  'Kotlin':     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg',
  'Java':       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
  'PHP':        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
  'Lua':        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/lua/lua-original.svg',
  'ASP.NET':    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/windows11/windows11-original.svg'
};
function langLogoUrl(lang) { return LANG_LOGO_URLS[lang] ?? null; }

const logoImagePromiseCache = new Map(); // url -> Promise<HTMLImageElement|null>
function loadLogoImage(url) {
  if (!url) return Promise.resolve(null);
  if (logoImagePromiseCache.has(url)) return logoImagePromiseCache.get(url);

  const p = new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
  logoImagePromiseCache.set(url, p);
  return p;
}

function addRoundedRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const coverTextureCache = new Map(); // language|null -> THREE.CanvasTexture
function makeCoverTextureForLanguage(lang) {
  const key = lang ?? null;
  if (coverTextureCache.has(key)) return coverTextureCache.get(key);

  const W = 512, H = 768;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const col = langColor(lang);
  const r = (col >> 16) & 0xff;
  const g = (col >> 8) & 0xff;
  const b = col & 0xff;

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   `rgb(${Math.min(r+22,255)},${Math.min(g+22,255)},${Math.min(b+22,255)})`);
  grad.addColorStop(0.5, `rgb(${r},${g},${b})`);
  grad.addColorStop(1,   `rgb(${Math.max(r-48,0)},${Math.max(g-48,0)},${Math.max(b-48,0)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle border + vignette
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  const vignette = ctx.createRadialGradient(W/2, H/2, Math.min(W, H) * 0.1, W/2, H/2, Math.max(W, H) * 0.75);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  const tex = new THREE.CanvasTexture(canvas);
  coverTextureCache.set(key, tex);

  const url = langLogoUrl(lang);
  if (url) {
    loadLogoImage(url).then(img => {
      if (!img) return;

      const maxW = W * 0.68;
      const maxH = H * 0.46;
      const iw = img.naturalWidth || img.width || 1;
      const ih = img.naturalHeight || img.height || 1;
      const s = Math.min(maxW / iw, maxH / ih);
      const dw = Math.max(1, Math.floor(iw * s));
      const dh = Math.max(1, Math.floor(ih * s));
      const dx = Math.floor((W - dw) / 2);
      const dy = Math.floor((H - dh) / 2);

      // Soft backdrop to keep logos readable on dark colours
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      addRoundedRectPath(ctx, dx - 24, dy - 24, dw + 48, dh + 48, 22);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 8;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();

      tex.needsUpdate = true;
    });
  }

  return tex;
}

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
const SHELF_D         = 0.5;
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

  const bookColors = [0x8b2020, 0x204880, 0x206030];
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(0.25 - i * 0.02, 0.06, 0.18),
      new THREE.MeshLambertMaterial({ color: bookColors[i] })
    );
    b.position.set(-0.7, 1.09 + i * 0.065, -0.1);
    b.rotation.y = i * 0.08;
    b.castShadow = true;
    group.add(b);
  }

  group.traverse(child => { if (child.isMesh) child.userData.deskGroup = group; });
  scene.add(group);
  deskGroup = group;
  return group;
}

// ─────────────────────────────────────────────
// DECORATIVE PROPS  (multiple per kind; layout.props is an array)
// ─────────────────────────────────────────────

/** @type {{ id: string, group: THREE.Object3D }[]} */
const propInstances = [];
let propIdCounter = 0;

const EDITOR_POS_GRID = 0.05;

function snapEditorAxis(v) {
  const g = EDITOR_POS_GRID;
  return Math.round(v / g) * g;
}

const PROP_DEFAULTS = {
  chair:     { x: 3.5,  z: 3,   y: 0,    rotY: -0.4 },
  table:     { x: 4.8,  z: 2.5, y: 0,    rotY: 0 },
  candle:    { x: 4.8,  z: 2.5, y: 0.74, rotY: 0 },
  rug:       { x: 4,    z: 3,   y: 0,    rotY: 0 },
  plant:     { x: -2,   z: 4,   y: 0,    rotY: 0 },
  globe:     { x: 2,    z: -4,  y: 0,    rotY: 0 },
  light:     { x: -6,   z: -6,  y: 0,    rotY: 0 },
  bookStack: { x: 1,    z: -2,  y: 0,    rotY: 0 },
};

function normalizePropConfig(kind, raw) {
  const d = PROP_DEFAULTS[kind];
  if (!d) return null;
  return {
    x:    raw.x    !== undefined ? raw.x    : d.x,
    z:    raw.z    !== undefined ? raw.z    : d.z,
    y:    raw.y    !== undefined ? raw.y    : d.y,
    rotY: raw.rotY !== undefined ? raw.rotY : d.rotY,
  };
}

function clearProps() {
  propInstances.forEach(({ group }) => scene.remove(group));
  propInstances.length = 0;
}

function tagPropGroup(grp, kind, id) {
  grp.userData.isPropGroup = true;
  grp.userData.propKind = kind;
  grp.userData.propId = id;
  grp.userData.propKey = kind;
  grp.traverse(c => { if (c.isMesh) c.userData.propGroup = grp; });
}

function nextPropId() {
  propIdCounter += 1;
  return 'p' + propIdCounter;
}

function seedPropIdCounterFromList(list) {
  let max = 0;
  for (const p of list) {
    if (!p || !p.id) continue;
    const m = String(p.id).match(/^p(\d+)$/i);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  propIdCounter = max;
}

function ensurePropListIds(list) {
  seedPropIdCounterFromList(list);
  for (const p of list) {
    if (!p.id) p.id = nextPropId();
  }
}

/** Old layout.json: props as { chair: {x,z,...}, ... } */
function legacyPropsObjectToArray(obj) {
  return Object.entries(obj)
    .map(([kind, v]) => {
      if (!PROP_DEFAULTS[kind] || !v || typeof v !== 'object') return null;
      const { id, kind: _k, ...rest } = v;
      return { id: id || `legacy_${kind}`, kind, ...rest };
    })
    .filter(Boolean);
}

function defaultPropList() {
  return [
    { id: 'p1', kind: 'chair',  ...PROP_DEFAULTS.chair },
    { id: 'p2', kind: 'table',  ...PROP_DEFAULTS.table },
    { id: 'p3', kind: 'candle', ...PROP_DEFAULTS.candle },
    { id: 'p4', kind: 'rug',    ...PROP_DEFAULTS.rug },
  ];
}

function buildPropInstance(kind, c, id) {
  switch (kind) {
    case 'chair': {
      const chairMat = new THREE.MeshLambertMaterial({ color: 0x3d1a0a });
      const chairGrp = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.7), chairMat);
      seat.position.y = 0.45;
      seat.castShadow = true;
      chairGrp.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), chairMat);
      back.position.set(0, 0.88, -0.3);
      back.castShadow = true;
      chairGrp.add(back);
      [[-0.35, 0.2], [0.35, 0.2], [-0.35, -0.2], [0.35, -0.2]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), chairMat);
        leg.position.set(lx, 0.22, lz);
        leg.castShadow = true;
        chairGrp.add(leg);
      });
      chairGrp.position.set(c.x, c.y, c.z);
      chairGrp.rotation.y = c.rotY;
      tagPropGroup(chairGrp, 'chair', id);
      scene.add(chairGrp);
      propInstances.push({ id, group: chairGrp });
      break;
    }
    case 'table': {
      const tableMat = new THREE.MeshLambertMaterial({ color: 0x4a2a0d });
      const tableGrp = new THREE.Group();
      const tabTop = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 16), tableMat);
      tabTop.position.y = 0.65;
      tabTop.castShadow = true;
      tableGrp.add(tabTop);
      const tabLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.65, 8), tableMat);
      tabLeg.position.y = 0.32;
      tabLeg.castShadow = true;
      tableGrp.add(tabLeg);
      tableGrp.position.set(c.x, c.y, c.z);
      tableGrp.rotation.y = c.rotY;
      tagPropGroup(tableGrp, 'table', id);
      scene.add(tableGrp);
      propInstances.push({ id, group: tableGrp });
      break;
    }
    case 'candle': {
      const candleGrp = new THREE.Group();
      const wax = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.18, 8),
        new THREE.MeshLambertMaterial({ color: 0xe8d08a })
      );
      wax.position.y = 0.09;
      candleGrp.add(wax);
      const flame = new THREE.PointLight(0xff9933, 1.5, 4);
      flame.position.set(0, 0.22, 0);
      flame.userData.candleFlame = true;
      candleGrp.add(flame);
      candleGrp.position.set(c.x, c.y, c.z);
      candleGrp.rotation.y = c.rotY;
      tagPropGroup(candleGrp, 'candle', id);
      scene.add(candleGrp);
      propInstances.push({ id, group: candleGrp });
      break;
    }
    case 'rug': {
      const rugGrp = new THREE.Group();
      const rugMesh = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.02, 2.5),
        new THREE.MeshLambertMaterial({ color: 0x7a3020 })
      );
      rugMesh.position.y = 0.01;
      rugMesh.receiveShadow = true;
      rugGrp.add(rugMesh);
      rugGrp.position.set(c.x, c.y, c.z);
      rugGrp.rotation.y = c.rotY;
      tagPropGroup(rugGrp, 'rug', id);
      scene.add(rugGrp);
      propInstances.push({ id, group: rugGrp });
      break;
    }
    case 'plant': {
      const potMat = new THREE.MeshLambertMaterial({ color: 0x5a3a22 });
      const leafMat = new THREE.MeshLambertMaterial({ color: 0x2d5a28 });
      const grp = new THREE.Group();
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.35, 12), potMat);
      pot.position.y = 0.175;
      pot.castShadow = true;
      grp.add(pot);
      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18 + (i % 2) * 0.06, 8, 6), leafMat);
        const a = (i / 5) * Math.PI * 2;
        leaf.position.set(Math.cos(a) * 0.12, 0.52 + i * 0.05, Math.sin(a) * 0.12);
        leaf.scale.set(1, 1.4, 0.7);
        leaf.castShadow = true;
        grp.add(leaf);
      }
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'plant', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'globe': {
      const wood = new THREE.MeshLambertMaterial({ color: 0x3d2810 });
      const ocean = new THREE.MeshLambertMaterial({ color: 0x1a4080 });
      const grp = new THREE.Group();
      const meridian = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.015, 8, 24), wood);
      meridian.rotation.x = Math.PI / 2;
      meridian.position.y = 0.95;
      grp.add(meridian);
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 16), ocean);
      sphere.position.y = 0.95;
      sphere.castShadow = true;
      grp.add(sphere);
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.15, 8), wood);
      stand.position.y = 0.075;
      grp.add(stand);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 6), wood);
      pole.position.y = 0.55;
      grp.add(pole);
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'globe', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'light': {
      const metal = new THREE.MeshLambertMaterial({ color: 0x2a2218 });
      const shadeMat = new THREE.MeshLambertMaterial({ color: 0xd8c8a0 });
      const grp = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.06, 16), metal);
      base.position.y = 0.03;
      base.castShadow = true;
      grp.add(base);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.35, 8), metal);
      pole.position.y = 0.72;
      grp.add(pole);
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.35, 12, 1, true), shadeMat);
      shade.position.y = 1.52;
      grp.add(shade);
      const bulb = new THREE.PointLight(0xffddaa, 1.2, 10);
      bulb.position.set(0, 1.35, 0);
      grp.add(bulb);
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'light', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'bookStack': {
      const grp = new THREE.Group();
      const cols = [0x6b2020, 0x304878, 0x285028, 0x705020, 0x503070];
      let y = 0.03;
      for (let i = 0; i < 5; i++) {
        const w = 0.22 - (i % 2) * 0.02;
        const h = 0.045 + (i % 3) * 0.012;
        const d = 0.16;
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, d),
          new THREE.MeshLambertMaterial({ color: cols[i] })
        );
        book.position.set(0, y + h / 2, 0);
        book.rotation.y = (i - 2) * 0.12;
        book.castShadow = true;
        grp.add(book);
        y += h;
      }
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'bookStack', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    default:
      break;
  }
}

/**
 * @param cfg {null|undefined|object[]|Record<string,object>}
 *        null/undefined → default chair/table/candle/rug set
 *        [] → no props
 *        array → { id?, kind, x, z, y?, rotY? }[]
 *        object → legacy single-instance-per-kind map
 */
function buildProps(cfg) {
  clearProps();

  let list;
  if (cfg === null || cfg === undefined) {
    list = defaultPropList();
  } else if (Array.isArray(cfg)) {
    list = cfg.map(p => ({ ...p }));
  } else if (typeof cfg === 'object') {
    list = legacyPropsObjectToArray(cfg);
  } else {
    list = [];
  }

  ensurePropListIds(list);

  list.forEach(item => {
    if (!item || !item.kind || !PROP_DEFAULTS[item.kind]) return;
    const c = normalizePropConfig(item.kind, item);
    if (c) buildPropInstance(item.kind, c, item.id);
  });
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

  const p = layout.props;
  if (p == null) buildProps(null);
  else if (Array.isArray(p)) buildProps(p);
  else if (typeof p === 'object' && Object.keys(p).length === 0) buildProps([]);
  else buildProps(p);
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
  const coverTex = makeCoverTextureForLanguage(repo.language);
  if (coverTex && renderer && renderer.capabilities) {
    coverTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  const bW = 0.075 + Math.random() * 0.035;
  const bH = 0.62  + Math.random() * 0.15;
  const bD = 0.4;

  const geo      = new THREE.BoxGeometry(bW, bH, bD);
  const spineMat = new THREE.MeshLambertMaterial({ map: spineTex });
  const coverMat = new THREE.MeshLambertMaterial({ map: coverTex, color: 0xffffff });
  const solidMat = new THREE.MeshLambertMaterial({ color: col });
  const pageMat  = new THREE.MeshLambertMaterial({ color: 0xe8d5b0 });
  // BoxGeometry material order: +x, -x, +y, -y, +z, -z
  // We treat ±x as the front/back covers, +z as the spine.
  const materials = [coverMat, coverMat, pageMat, solidMat, spineMat, solidMat];

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
let pageTextureCache = new Map(); // pageIndex -> THREE.Texture
const FLIP_SPEED = 3.5;
const PAGE_W     = 0.38;
const PAGE_H     = 0.52;
const PAGE_GAP   = 0.005;

// Higher quality page textures + basic markdown layout for READMEs
const PAGE_TEX_W = 768;
const PAGE_TEX_H = 1024;
let paperPattern = null;
function getPaperPattern(ctx) {
  if (paperPattern) return paperPattern;
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const cctx = c.getContext('2d');
  cctx.fillStyle = '#f6eedc';
  cctx.fillRect(0, 0, c.width, c.height);
  const img = cctx.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() * 20) | 0;
    img.data[i + 0] = Math.min(255, img.data[i + 0] + n);
    img.data[i + 1] = Math.min(255, img.data[i + 1] + n);
    img.data[i + 2] = Math.min(255, img.data[i + 2] + n);
    img.data[i + 3] = 255;
  }
  cctx.putImageData(img, 0, 0);
  paperPattern = ctx.createPattern(c, 'repeat');
  return paperPattern;
}

function drawPaperBackground(ctx, W, H) {
  ctx.fillStyle = '#f6eedc';
  ctx.fillRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(255,255,255,0.45)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
  grad.addColorStop(1, 'rgba(0,0,0,0.06)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const pat = getPaperPattern(ctx);
  if (pat) {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  ctx.strokeStyle = 'rgba(60,35,15,0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, W - 36, H - 36);
}

function sanitizeInlineMarkdown(s) {
  return (s ?? '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '[image]')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function markdownToBlocks(md) {
  if (!md) return [{ type: 'p', text: 'No README found for this repository.' }];
  const lines = md.replace(/\r/g, '').split('\n');
  const blocks = [];
  let i = 0;

  const isCodeFence = line => /^\s*```/.test(line);
  const isHr = line => /^\s*---+\s*$/.test(line);

  while (i < lines.length) {
    const raw = lines[i] ?? '';
    const line = raw.replace(/\t/g, '  ');

    if (!line.trim()) {
      blocks.push({ type: 'blank' });
      i++;
      continue;
    }

    if (isCodeFence(line)) {
      i++;
      const codeLines = [];
      while (i < lines.length && !isCodeFence(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && isCodeFence(lines[i])) i++;
      const text = codeLines.join('\n').replace(/\s+$/g, '');
      if (text.trim()) blocks.push({ type: 'code', text });
      continue;
    }

    const h = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (h) {
      blocks.push({ type: 'h', level: h[1].length, text: sanitizeInlineMarkdown(h[2]) });
      i++;
      continue;
    }

    if (isHr(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) {
      blocks.push({ type: 'quote', text: sanitizeInlineMarkdown(quote[1]) });
      i++;
      continue;
    }

    const li = line.match(/^\s*([-*]|\d+\.)\s+(.*)$/);
    if (li) {
      blocks.push({ type: 'li', text: sanitizeInlineMarkdown(li[2]) });
      i++;
      continue;
    }

    // Paragraph: gather until blank or a new block marker
    const parts = [sanitizeInlineMarkdown(line)];
    i++;
    while (i < lines.length) {
      const peek = (lines[i] ?? '').replace(/\t/g, '  ');
      if (!peek.trim()) break;
      if (isCodeFence(peek)) break;
      if (/^\s*#{1,6}\s+/.test(peek)) break;
      if (isHr(peek)) break;
      if (/^\s*>\s?/.test(peek)) break;
      if (/^\s*([-*]|\d+\.)\s+/.test(peek)) break;
      parts.push(sanitizeInlineMarkdown(peek));
      i++;
    }
    const text = parts.filter(Boolean).join(' ').trim();
    if (text) blocks.push({ type: 'p', text });
  }

  while (blocks.length && blocks[0].type === 'blank') blocks.shift();
  while (blocks.length && blocks[blocks.length - 1].type === 'blank') blocks.pop();
  return blocks.length ? blocks : [{ type: 'p', text: 'No content.' }];
}

function makeMeasureContext() {
  const c = document.createElement('canvas');
  c.width = 2; c.height = 2;
  return c.getContext('2d');
}

function wrapText(ctx, text, font, maxW) {
  ctx.font = font;
  const words = (text ?? '').split(' ').filter(Boolean);
  const out = [];
  let line = '';
  for (const w of words) {
    const test = line ? (line + ' ' + w) : w;
    if (ctx.measureText(test).width > maxW && line) {
      out.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) out.push(line);
  return out.length ? out : [''];
}

function wrapCodeLine(ctx, text, font, maxW) {
  ctx.font = font;
  const out = [];
  let start = 0;
  const s = text ?? '';
  while (start < s.length) {
    let end = Math.min(s.length, start + 120);
    while (end > start + 1 && ctx.measureText(s.slice(start, end)).width > maxW) end--;
    if (end <= start) end = start + 1;
    out.push(s.slice(start, end));
    start = end;
  }
  return out.length ? out : [''];
}

function layoutMarkdownPages(md) {
  const ctx = makeMeasureContext();

  const W = PAGE_TEX_W, H = PAGE_TEX_H;
  const marginL = 66, marginR = W - 66;
  const maxW = marginR - marginL;
  const top = 126;
  const bottom = H - 116;

  const fonts = {
    h1: '700 34px Georgia, serif',
    h2: '700 28px Georgia, serif',
    h3: '700 24px Georgia, serif',
    h4: '700 21px Georgia, serif',
    p:  '400 20px Georgia, serif',
    code: '14px \"Courier New\", monospace',
    quote: 'italic 20px Georgia, serif',
  };

  const heights = {
    h1: 44, h2: 38, h3: 34, h4: 30,
    p: 28, li: 28, quote: 28, code: 22,
    blank: 14, hr: 20,
  };

  const blocks = markdownToBlocks(md);
  const lines = [];

  const pushBlank = () => lines.push({ type: 'blank' });

  for (const b of blocks) {
    if (b.type === 'blank') { pushBlank(); continue; }

    if (b.type === 'hr') {
      lines.push({ type: 'hr' });
      pushBlank();
      continue;
    }

    if (b.type === 'h') {
      const level = Math.max(1, Math.min(6, b.level ?? 2));
      const font = level === 1 ? fonts.h1 : level === 2 ? fonts.h2 : level === 3 ? fonts.h3 : fonts.h4;
      const wrap = wrapText(ctx, b.text, font, maxW);
      wrap.forEach((t, idx) => lines.push({ type: 'h', level, text: t, cont: idx > 0 }));
      pushBlank();
      continue;
    }

    if (b.type === 'quote') {
      const wrap = wrapText(ctx, b.text, fonts.quote, maxW - 26);
      wrap.forEach((t, idx) => lines.push({ type: 'quote', text: t, cont: idx > 0 }));
      pushBlank();
      continue;
    }

    if (b.type === 'li') {
      const wrap = wrapText(ctx, b.text, fonts.p, maxW - 32);
      wrap.forEach((t, idx) => lines.push({ type: 'li', text: t, cont: idx > 0 }));
      continue;
    }

    if (b.type === 'code') {
      const codeLines = (b.text ?? '').split('\n');
      for (const cl of codeLines) {
        const wrapped = wrapCodeLine(ctx, cl, fonts.code, maxW - 22);
        wrapped.forEach(t => lines.push({ type: 'code', text: t }));
      }
      pushBlank();
      continue;
    }

    if (b.type === 'p') {
      const wrap = wrapText(ctx, b.text, fonts.p, maxW);
      wrap.forEach(t => lines.push({ type: 'p', text: t }));
      pushBlank();
    }
  }

  const pages = [];
  let page = { kind: 'markdown', lines: [] };
  let y = top;
  const newPage = () => {
    if (page.lines.length) pages.push(page);
    page = { kind: 'markdown', lines: [] };
    y = top;
  };

  for (const ln of lines) {
    const h = ln.type === 'h'
      ? ((ln.level ?? 2) === 1 ? heights.h1 : (ln.level ?? 2) === 2 ? heights.h2 : (ln.level ?? 2) === 3 ? heights.h3 : heights.h4)
      : (heights[ln.type] ?? heights.p);

    if (y + h > bottom && page.lines.length) newPage();
    page.lines.push(ln);
    y += h;
  }
  if (page.lines.length) pages.push(page);
  return pages.length ? pages : [{ kind: 'markdown', lines: [{ type: 'p', text: 'No content.' }] }];
}

function buildBookPages(repo, readmeText) {
  const pages = [{ kind: 'cover', repo }];
  if (!readmeText) {
    pages.push({ kind: 'markdown', lines: [{ type: 'p', text: 'Loading README…' }] });
    return pages;
  }
  pages.push(...layoutMarkdownPages(readmeText));
  return pages;
}

function getPageTexture(bookData, pageIdx) {
  if (pageTextureCache.has(pageIdx)) return pageTextureCache.get(pageIdx);
  const tex = makePageTextureV2(pageChunks[pageIdx], pageIdx, pageChunks.length, bookData);
  if (tex && renderer && renderer.capabilities) tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  pageTextureCache.set(pageIdx, tex);
  return tex;
}

function makePageTextureV2(page, pageNum, totalPages, bookData) {
  const W = PAGE_TEX_W, H = PAGE_TEX_H;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  drawPaperBackground(ctx, W, H);

  const marginL = 66, marginR = W - 66;
  const maxW = marginR - marginL;
  const headerY = 62;
  const top = 126;
  const bottom = H - 116;

  const repo = bookData?.repo ?? page?.repo;

  // Header
  ctx.save();
  ctx.font = '600 14px \"Trebuchet MS\", Arial, sans-serif';
  ctx.fillStyle = 'rgba(60,35,15,0.72)';
  ctx.textAlign = 'left';
  ctx.fillText(repo?.name ?? 'Repository', marginL, headerY);
  ctx.textAlign = 'right';
  ctx.fillText(repo?.language ?? '', marginR, headerY);
  ctx.strokeStyle = 'rgba(60,35,15,0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(marginL, headerY + 12);
  ctx.lineTo(marginR, headerY + 12);
  ctx.stroke();
  ctx.restore();

  // Footer
  ctx.save();
  ctx.font = 'italic 14px Georgia, serif';
  ctx.fillStyle = 'rgba(100,70,40,0.55)';
  ctx.textAlign = 'center';
  ctx.fillText(`${pageNum + 1} / ${totalPages}`, W / 2, H - 54);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);

  if (page && typeof page === 'object' && page.kind === 'cover') {
    const title = repo?.name ?? 'Untitled';
    const desc = (repo?.description ?? 'No description provided.').trim();

    const col = langColor(repo?.language ?? null);
    const r = (col >> 16) & 0xff;
    const g = (col >> 8) & 0xff;
    const b = col & 0xff;

    // Accent ribbon
    ctx.save();
    ctx.fillStyle = `rgba(${r},${g},${b},0.12)`;
    ctx.fillRect(0, 0, W, 150);
    ctx.fillStyle = `rgba(${r},${g},${b},0.08)`;
    ctx.fillRect(0, H - 170, W, 170);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1a0e04';
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.font = '800 48px Georgia, serif';
    const titleLines = wrapText(ctx, sanitizeInlineMarkdown(title), ctx.font, maxW);
    // Leave extra room for larger language logos at the top.
    let y = 340;
    for (const t of titleLines) {
      ctx.fillText(t, W / 2, y);
      y += 56;
    }
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillStyle = 'rgba(60,35,15,0.75)';
    const subtitle = repo?.language ? `${repo.language} project` : 'Project';
    ctx.fillText(subtitle, W / 2, y + 10);

    ctx.strokeStyle = 'rgba(60,35,15,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 170, y + 36);
    ctx.lineTo(W / 2 + 170, y + 36);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '400 20px Georgia, serif';
    ctx.fillStyle = 'rgba(20,10,4,0.9)';
    const descLines = wrapText(ctx, sanitizeInlineMarkdown(desc), ctx.font, maxW);
    let dy = y + 90;
    for (const dl of descLines.slice(0, 6)) {
      ctx.fillText(dl, marginL, dy);
      dy += 30;
    }

    ctx.font = '600 14px \"Trebuchet MS\", Arial, sans-serif';
    ctx.fillStyle = 'rgba(60,35,15,0.62)';
    const stars = typeof repo?.stargazers_count === 'number' ? repo.stargazers_count : null;
    const updated = repo?.pushed_at || repo?.updated_at || '';
    const metaLeft = [
      stars != null ? `Stars: ${stars}` : null,
      repo?.html_url ? 'GitHub: ' + repo.html_url.replace(/^https?:\/\//, '') : null,
    ].filter(Boolean);
    const metaRight = updated ? `Last update: ${formatLastUpdated(updated)}` : '';
    ctx.fillText(metaLeft.join('   '), marginL, H - 150);
    ctx.textAlign = 'right';
    ctx.fillText(metaRight, marginR, H - 150);
    ctx.restore();

    // Logo (async)
    const url = langLogoUrl(repo?.language ?? null);
    if (url) {
      loadLogoImage(url).then(img => {
        if (!img) return;
        const maxLogoW = W * 0.22;
        const maxLogoH = H * 0.14;
        const iw = img.naturalWidth || img.width || 1;
        const ih = img.naturalHeight || img.height || 1;
        const s = Math.min(maxLogoW / iw, maxLogoH / ih);
        const dw = Math.max(1, Math.floor(iw * s));
        const dh = Math.max(1, Math.floor(ih * s));
        const dx = Math.floor(W / 2 - dw / 2);
        const dy = 120;

        ctx.save();
        ctx.globalAlpha = 0.94;
        ctx.shadowColor = 'rgba(0,0,0,0.22)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 10;
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();

        tex.needsUpdate = true;
      });
    }

    return tex;
  }

  const pageObj = (page && typeof page === 'object' && page.kind === 'markdown') ? page : null;
  const lines = pageObj?.lines ?? [{ type: 'p', text: String(page ?? '') }];

  const fonts = {
    h1: '700 34px Georgia, serif',
    h2: '700 28px Georgia, serif',
    h3: '700 24px Georgia, serif',
    h4: '700 21px Georgia, serif',
    p:  '400 20px Georgia, serif',
    quote: 'italic 20px Georgia, serif',
    code: '14px \"Courier New\", monospace',
  };

  const heights = {
    h1: 44, h2: 38, h3: 34, h4: 30,
    p: 28, li: 28, quote: 28, code: 22,
    blank: 14, hr: 20,
  };

  const lineHeight = ln => {
    if (ln.type === 'h') {
      const lvl = ln.level ?? 2;
      return lvl === 1 ? heights.h1 : lvl === 2 ? heights.h2 : lvl === 3 ? heights.h3 : heights.h4;
    }
    return heights[ln.type] ?? heights.p;
  };

  const yPos = [];
  let y = top;
  for (let i = 0; i < lines.length; i++) {
    yPos[i] = y;
    y += lineHeight(lines[i]);
    if (y > bottom) break;
  }

  // Code backplates (runs of code lines)
  for (let i = 0; i < lines.length; i++) {
    if (yPos[i] == null) break;
    if (lines[i].type !== 'code') continue;
    const start = i;
    let end = i;
    while (end + 1 < lines.length && lines[end + 1].type === 'code' && yPos[end + 1] != null) end++;

    const y0 = yPos[start] - 14;
    const y1 = yPos[end] + lineHeight(lines[end]) - 6;
    const x0 = marginL - 8;
    const w0 = maxW + 16;
    const h0 = y1 - y0;

    ctx.save();
    ctx.fillStyle = 'rgba(30,18,10,0.08)';
    ctx.strokeStyle = 'rgba(60,35,15,0.12)';
    ctx.lineWidth = 1;
    addRoundedRectPath(ctx, x0, y0, w0, h0, 12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    i = end;
  }

  ctx.save();
  ctx.fillStyle = '#1a0e04';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const yy = yPos[i];
    if (yy == null || yy > bottom) break;

    if (ln.type === 'blank') continue;

    if (ln.type === 'hr') {
      ctx.save();
      ctx.strokeStyle = 'rgba(60,35,15,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginL + 18, yy + 8);
      ctx.lineTo(marginR - 18, yy + 8);
      ctx.stroke();
      ctx.restore();
      continue;
    }

    if (ln.type === 'h') {
      const lvl = ln.level ?? 2;
      ctx.font = lvl === 1 ? fonts.h1 : lvl === 2 ? fonts.h2 : lvl === 3 ? fonts.h3 : fonts.h4;
      ctx.fillStyle = lvl <= 2 ? '#1a0804' : '#2a0e04';
      ctx.fillText(ln.text ?? '', marginL, yy);
      ctx.fillStyle = '#1a0e04';
      continue;
    }

    if (ln.type === 'quote') {
      ctx.save();
      ctx.strokeStyle = 'rgba(120,80,45,0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(marginL, yy - 16);
      ctx.lineTo(marginL, yy + 10);
      ctx.stroke();
      ctx.restore();

      ctx.font = fonts.quote;
      ctx.fillStyle = 'rgba(40,20,10,0.86)';
      ctx.fillText(ln.text ?? '', marginL + 18, yy);
      ctx.fillStyle = '#1a0e04';
      continue;
    }

    if (ln.type === 'code') {
      ctx.font = fonts.code;
      ctx.fillStyle = 'rgba(20,10,4,0.92)';
      ctx.fillText(ln.text ?? '', marginL + 10, yy);
      ctx.fillStyle = '#1a0e04';
      continue;
    }

    if (ln.type === 'li') {
      ctx.font = fonts.p;
      const bulletX = marginL + 6;
      const textX = marginL + 28;
      if (!ln.cont) {
        ctx.save();
        ctx.fillStyle = 'rgba(60,35,15,0.55)';
        ctx.font = '600 18px Georgia, serif';
        ctx.fillText('â€¢', bulletX, yy);
        ctx.restore();
      }
      ctx.fillText(ln.text ?? '', textX, yy);
      continue;
    }

    ctx.font = fonts.p;
    ctx.fillText(ln.text ?? '', marginL, yy);
  }

  ctx.restore();
  return tex;
}

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
      ? new THREE.MeshLambertMaterial({ map: getPageTexture(bookData, idx), side: THREE.FrontSide })
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
  pageTextureCache = new Map();
  pageChunks   = buildBookPages(bookData.repo, null);
  currentPage  = 0;
  bookData.mesh.visible = false;
  buildOpenBook(bookData);
  showPageHUD(true);
  fetchReadme(bookData.repo).then(text => {
    pageTextureCache = new Map();
    pageChunks  = buildBookPages(bookData.repo, text);
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

  if (EDIT_MODE) {
    if (moveDir.length() > 0) {
      moveDir.normalize().applyEuler(new THREE.Euler(0, yawObj.rotation.y, 0));
      const next = yawObj.position.clone().addScaledVector(moveDir, PLAYER_SPEED * dt);
      next.x = Math.max(-ROOM_W/2 + 0.5, Math.min(ROOM_W/2 - 0.5, next.x));
      next.z = Math.max(-ROOM_D/2 + 0.5, Math.min(ROOM_D/2 - 0.5, next.z));
      yawObj.position.x = next.x;
      yawObj.position.z = next.z;
    }
    if (keys['Space']) yawObj.position.y += PLAYER_SPEED * dt;
    if (keys['ShiftLeft'] || keys['ShiftRight']) yawObj.position.y -= PLAYER_SPEED * dt;
    yawObj.position.y = Math.max(0.35, Math.min(ROOM_H - 0.2, yawObj.position.y));
    return;
  }

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

  propInstances.forEach(({ group }) => {
    if (group.userData.propKind !== 'candle') return;
    group.traverse(child => {
      if (child.isPointLight && child.userData.candleFlame) {
        child.intensity = 1.3 + Math.sin(frameCount * 0.18) * 0.2 + Math.random() * 0.1;
      }
    });
  });

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
let editorSelectedType   = null; // 'shelf' | 'desk' | prop key string
let editorSelectedShelf    = null; // shelf metadata when type === 'shelf'
let editorSelectedPropId   = null;
let editorSelectedPropKind = null;
let editorRmbLook          = false;
let editorDragPlane      = null; // THREE.Plane for mouse-world intersection
let editorDragOffset     = new THREE.Vector3();
let editorIsDragging     = false;
let editorDragGroundY    = 0;
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
    #editor-panel .ed-decor-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
    }
    #editor-panel .ed-decor-grid .ed-add-btn { margin-bottom: 0; font-size: 0.7rem; padding: 6px 8px; }
  `;
  document.head.appendChild(style);
  document.body.classList.add('edit-mode');

  // Badge
  const badge = document.createElement('div');
  badge.id = 'editor-badge';
  badge.textContent = '✦ Editor — WASD walk · Space / Shift up-down · hold right-drag to look · click-drag to move';
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
    </div>

    <div class="ed-section">
      <div class="ed-label">Place decor</div>
      <div class="ed-decor-grid">
        <button class="ed-add-btn" data-ed-prop="table"><div class="swatch" style="background:#4a2a0d"></div>Table</button>
        <button class="ed-add-btn" data-ed-prop="chair"><div class="swatch" style="background:#3d1a0a"></div>Chair</button>
        <button class="ed-add-btn" data-ed-prop="plant"><div class="swatch" style="background:#2d5a28"></div>Plant</button>
        <button class="ed-add-btn" data-ed-prop="rug"><div class="swatch" style="background:#7a3020"></div>Rug</button>
        <button class="ed-add-btn" data-ed-prop="globe"><div class="swatch" style="background:#1a4080"></div>Globe</button>
        <button class="ed-add-btn" data-ed-prop="light"><div class="swatch" style="background:#d8c8a0"></div>Light</button>
        <button class="ed-add-btn" data-ed-prop="candle"><div class="swatch" style="background:#e8d08a"></div>Candle</button>
        <button class="ed-add-btn" data-ed-prop="bookStack"><div class="swatch" style="background:#503070"></div>Book stack</button>
      </div>
    </div>

    <div class="ed-props" id="ed-props">
      <div class="ed-hint">Click furniture or decor to select.<br><br>Drag on the floor plane to move X/Z. Adjust Y in the panel.</div>
    </div>

    <div class="ed-bottom">
      <button class="ed-export-btn" id="ed-export-btn">Copy layout.json ↗</button>
    </div>
  `;
  document.body.appendChild(panel);

  document.getElementById('ed-add-shelf').addEventListener('click', () => editorAddShelf());
  panel.querySelectorAll('[data-ed-prop]').forEach(btn => {
    btn.addEventListener('click', () => editorAddProp(btn.getAttribute('data-ed-prop')));
  });
  document.getElementById('ed-export-btn').addEventListener('click', editorCopyJSON);

  renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
  renderer.domElement.addEventListener('mousedown', e => {
    if (e.button === 2) editorRmbLook = true;
  });
  document.addEventListener('mouseup', e => {
    if (e.button === 2) editorRmbLook = false;
  });
  document.addEventListener('mousemove', e => {
    if (!editorRmbLook) return;
    yawObj.rotation.y -= e.movementX * 0.002;
    pitchObj.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitchObj.rotation.x - e.movementY * 0.002));
  });

  // Mouse events on the canvas
  renderer.domElement.addEventListener('mousedown', editorOnMouseDown);
  renderer.domElement.addEventListener('mousemove', editorOnMouseMove);
  renderer.domElement.addEventListener('mouseup',   editorOnMouseUp);

  document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
  });
  document.addEventListener('keyup', e => { keys[e.code] = false; });

  // Position camera above for a better editorial view
  yawObj.position.set(0, PLAYER_HEIGHT, 14);
  editorUpdateShelfNumbers();
}

// ─── editor helpers ───

function editorGetMouseNDC(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  return new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width)  * 2 - 1,
    -((e.clientY - rect.top)  / rect.height) * 2 + 1
  );
}

function editorUpdateShelfNumbers() {
  shelfGroups.forEach((sg, index) => {
    const orderNum = index + 1;
    let sprite = sg.group.children.find(c => c.userData.isOrderLabel);
    
    // If the sprite exists but has the wrong number (e.g., after a deletion), remove it
    if (sprite && sprite.userData.orderNum !== orderNum) {
      sg.group.remove(sprite);
      sprite.material.map.dispose();
      sprite.material.dispose();
      sprite = null;
    }

    // Create a new sprite if needed
    if (!sprite) {
      const canvas = document.createElement('canvas');
      canvas.width = 128; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      
      // Draw background circle
      ctx.fillStyle = 'rgba(232, 213, 163, 0.9)'; // Matches editor UI theme
      ctx.beginPath();
      ctx.arc(64, 64, 45, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw text
      ctx.fillStyle = '#1a1005';
      ctx.font = 'bold 50px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(orderNum.toString(), 64, 64);
      
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false }); // depthTest: false makes it visible through walls
      sprite = new THREE.Sprite(mat);
      
      sprite.scale.set(1.2, 1.2, 1);
      // Position it dynamically based on your shelf height constants
      sprite.position.set(0, SHELF_ROWS * SHELF_SPACING + 1.2, 0);
      sprite.userData = { isOrderLabel: true, orderNum };
      sprite.renderOrder = 999; 
      
      sg.group.add(sprite);
    }
  });
}

function editorPickObject(e) {
  const ndc = editorGetMouseNDC(e);
  editorRaycaster.setFromCamera(ndc, camera);

  // Collect all selectable meshes
  const candidates = [];
  shelfGroups.forEach(sg => sg.group.traverse(c => { if (c.isMesh) candidates.push(c); }));
  if (deskGroup) deskGroup.traverse(c => { if (c.isMesh) candidates.push(c); });
  propInstances.forEach(({ group: pg }) => {
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
    const g = hit.userData.propGroup;
    return {
      group: g,
      type: 'prop',
      propKind: g.userData.propKind || g.userData.propKey || 'prop',
      propId: g.userData.propId,
    };
  }
  if (hit.userData.isPropGroup) {
    return {
      group: hit,
      type: 'prop',
      propKind: hit.userData.propKind || hit.userData.propKey || 'prop',
      propId: hit.userData.propId,
    };
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
  editorSelectedPropId   = picked && picked.type === 'prop' ? picked.propId : null;
  editorSelectedPropKind = picked && picked.type === 'prop' ? picked.propKind : null;
  if (editorSelectedObject) editorHighlight(editorSelectedObject, true);
  editorRenderProps();
}

function editorRenderProps() {
  const el = document.getElementById('ed-props');
  if (!editorSelectedObject) {
    el.innerHTML = '<div class="ed-hint">Click furniture or decor to select.<br><br>Drag to move X/Z. Set Y in the panel · rotate with buttons.</div>';
    return;
  }

  const p = editorSelectedObject.position;
  const rDeg = Math.round((editorSelectedObject.rotation.y * 180 / Math.PI) % 360);
  const title = editorSelectedType === 'prop'
    ? `${editorSelectedPropKind} · ${editorSelectedPropId}`
    : editorSelectedType;

  el.innerHTML = `
    <div class="ed-selected-name">${title}</div>
    <div class="ed-prop-row">
      <span class="ed-prop-label">X</span>
      <input class="ed-prop-input" id="ed-px" type="number" step="0.05" value="${p.x.toFixed(2)}" />
    </div>
    <div class="ed-prop-row">
      <span class="ed-prop-label">Z</span>
      <input class="ed-prop-input" id="ed-pz" type="number" step="0.05" value="${p.z.toFixed(2)}" />
    </div>
    <div class="ed-prop-row">
      <span class="ed-prop-label">Y</span>
      <input class="ed-prop-input" id="ed-py" type="number" step="0.05" value="${p.y.toFixed(2)}" />
    </div>
    <div class="ed-label" style="margin-top:8px;margin-bottom:6px;">Rotation</div>
    <div class="ed-rot-row">
      <button class="ed-rot-btn" id="ed-rot-l">↺ 90°</button>
      <button class="ed-rot-btn" id="ed-rot-r">↻ 90°</button>
      <button class="ed-rot-btn" id="ed-rot-flip">180°</button>
    </div>
    <div class="ed-prop-row">
      <span class="ed-prop-label">Angle</span>
      <input class="ed-prop-input" id="ed-rot-deg" type="number" step="5" value="${rDeg}" />
    </div>
    ${editorSelectedType === 'shelf' ? `<button class="ed-delete-btn" id="ed-delete-btn">Remove shelf</button>` : ''}
    ${editorSelectedType === 'prop' ? `<button class="ed-delete-btn" id="ed-delete-prop-btn">Remove this decor</button>` : ''}
  `;

  document.getElementById('ed-px').addEventListener('change', e => {
    editorSelectedObject.position.x = parseFloat(e.target.value);
    editorSyncShelfSlots();
  });
  document.getElementById('ed-pz').addEventListener('change', e => {
    editorSelectedObject.position.z = parseFloat(e.target.value);
    editorSyncShelfSlots();
  });
  document.getElementById('ed-py').addEventListener('change', e => {
    editorSelectedObject.position.y = parseFloat(e.target.value);
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
  const delPropBtn = document.getElementById('ed-delete-prop-btn');
  if (delPropBtn) delPropBtn.addEventListener('click', editorDeleteSelectedProp);
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
  editorUpdateShelfNumbers();
}

function editorGatherPropsConfig() {
  return propInstances.map(({ id, group: g }) => ({
    id,
    kind: g.userData.propKind,
    x: g.position.x,
    z: g.position.z,
    y: g.position.y,
    rotY: g.rotation ? g.rotation.y : 0,
  }));
}

function editorAddProp(kind) {
  if (!PROP_DEFAULTS[kind]) return;
  const list = editorGatherPropsConfig();
  list.push({
    kind,
    x: 0,
    z: 0,
    y: PROP_DEFAULTS[kind].y,
    rotY: 0,
  });
  buildProps(list);
  editorSelect(null);
}

function editorDeleteSelectedProp() {
  if (!editorSelectedPropId) return;
  const idx = propInstances.findIndex(p => p.id === editorSelectedPropId);
  if (idx < 0) return;
  scene.remove(propInstances[idx].group);
  propInstances.splice(idx, 1);
  editorSelect(null);
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
  editorUpdateShelfNumbers();
}

// Mouse drag in world space on the ground plane
function editorOnMouseDown(e) {
  if (e.button !== 0) return;
  const picked = editorPickObject(e);
  if (!picked) { editorSelect(null); return; }
  editorSelect(picked);

  editorDragGroundY = editorSelectedObject.position.y;
  editorDragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -editorDragGroundY);
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

  editorSelectedObject.position.x = snapEditorAxis(pt.x - editorDragOffset.x);
  editorSelectedObject.position.z = snapEditorAxis(pt.z - editorDragOffset.z);
  editorSelectedObject.position.y = editorDragGroundY;

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

  const props = editorGatherPropsConfig().map(entry => ({
    id:   entry.id,
    kind: entry.kind,
    x:    parseFloat(entry.x.toFixed(2)),
    z:    parseFloat(entry.z.toFixed(2)),
    y:    parseFloat(entry.y.toFixed(2)),
    rotY: parseFloat(entry.rotY.toFixed(4)),
  }));

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
