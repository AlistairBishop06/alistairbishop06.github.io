// CHECKOUT DESK
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DECORATIVE PROPS  (multiple per kind; layout.props is an array)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  rug:       { x: 4,    z: 3,   y: 0,    rotY: 0, color: '#7a3020' },
  plant:     { x: -2,   z: 4,   y: 0,    rotY: 0 },
  globe:     { x: 2,    z: -4,  y: 0,    rotY: 0 },
  light:     { x: -6,   z: -6,  y: 0,    rotY: 0 },
  bookStack: { x: 1,    z: -2,  y: 0,    rotY: 0 },
  vase:      { x: -2,   z: 2,   y: 0,    rotY: 0 },
  bench:     { x: -5,   z: 0,   y: 0,    rotY: 0 },
  stool:     { x: 5,    z: 1,   y: 0,    rotY: 0 },
  clock:     { x: -3,   z: -2,  y: 0,    rotY: 0 },
  painting:  { x: -3,   z: -3,  y: 0,    rotY: 0 },
  statue:    { x: 3,    z: -3,  y: 0,    rotY: 0 },
  basket:    { x: 4,    z: -1,  y: 0,    rotY: 0 },
  cushion:   { x: 4.5,  z: 2,   y: 0,    rotY: 0 },
  sideTable: { x: 3.5,  z: 2.5, y: 0,    rotY: 0 },
  deskLamp:  { x: 4.5,  z: 2.5, y: 0.65, rotY: 0 },
  lectern:   { x: -4,   z: 3,   y: 0,    rotY: 0 },
  barrel:    { x: -6,   z: 2,   y: 0,    rotY: 0 },
  mirror:    { x: -2,   z: -4,  y: 0,    rotY: 0 },
  pedestal:  { x: 0,    z: -5,  y: 0,    rotY: 0 },
  bust:      { x: 1.5,  z: -3,  y: 0,    rotY: 0 },
  cart:      { x: -4.5, z: -1,  y: 0,    rotY: 0 },
};

/** @param {string|number|undefined|null} c */
function parsePropHexColor(c) {
  if (c === undefined || c === null) return 0x7a3020;
  if (typeof c === 'number' && !Number.isNaN(c)) return c;
  const s = String(c).trim();
  if (s.startsWith('#')) return parseInt(s.slice(1), 16) || 0x7a3020;
  const n = parseInt(s, 16);
  return Number.isNaN(n) ? 0x7a3020 : n;
}

function rugColorToHexString(hexNum) {
  return '#' + hexNum.toString(16).padStart(6, '0');
}

function normalizePropConfig(kind, raw) {
  const d = PROP_DEFAULTS[kind];
  if (!d) return null;
  const out = {
    x:    raw.x    !== undefined ? raw.x    : d.x,
    z:    raw.z    !== undefined ? raw.z    : d.z,
    y:    raw.y    !== undefined ? raw.y    : d.y,
    rotY: raw.rotY !== undefined ? raw.rotY : d.rotY,
  };
  if (kind === 'rug') {
    out.color = raw.color !== undefined ? raw.color : (d.color !== undefined ? d.color : '#7a3020');
  }
  return out;
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
      const hex = parsePropHexColor(c.color);
      const rugMesh = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.02, 2.5),
        new THREE.MeshLambertMaterial({ color: hex })
      );
      rugMesh.userData.isRugSurface = true;
      rugMesh.position.y = 0.01;
      rugMesh.receiveShadow = true;
      rugGrp.add(rugMesh);
      rugGrp.position.set(c.x, c.y, c.z);
      rugGrp.rotation.y = c.rotY;
      rugGrp.userData.rugColor = typeof c.color === 'string' ? c.color : rugColorToHexString(hex);
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
    case 'vase': {
      const ceramic = new THREE.MeshLambertMaterial({ color: 0x9a8a7a });
      const grp = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.42, 16), ceramic);
      body.position.y = 0.27;
      body.castShadow = true;
      grp.add(body);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.12, 12), ceramic);
      neck.position.y = 0.52;
      neck.castShadow = true;
      grp.add(neck);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 8, 16), ceramic);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.58;
      grp.add(rim);
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'vase', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'bench': {
      const wood = new THREE.MeshLambertMaterial({ color: 0x4a3218 });
      const grp = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.42), wood);
      seat.position.y = 0.45;
      seat.castShadow = true;
      seat.receiveShadow = true;
      grp.add(seat);
      [[-0.68, -0.16], [0.68, -0.16], [-0.68, 0.16], [0.68, 0.16]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), wood);
        leg.position.set(lx, 0.22, lz);
        leg.castShadow = true;
        grp.add(leg);
      });
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'bench', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'stool': {
      const wood = new THREE.MeshLambertMaterial({ color: 0x5a3820 });
      const grp = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.06, 20), wood);
      seat.position.y = 0.52;
      seat.castShadow = true;
      grp.add(seat);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.5, 8), wood);
      leg.position.y = 0.26;
      leg.castShadow = true;
      grp.add(leg);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 16), wood);
      foot.position.y = 0.015;
      foot.receiveShadow = true;
      grp.add(foot);
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'stool', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'clock': {
      const wood = new THREE.MeshLambertMaterial({ color: 0x3d2810 });
      const faceMat = new THREE.MeshLambertMaterial({ color: 0xe8e0d0 });
      const grp = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.35), wood);
      base.position.y = 0.04;
      base.castShadow = true;
      grp.add(base);
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), wood);
      pole.position.y = 0.53;
      pole.castShadow = true;
      grp.add(pole);
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), faceMat);
      face.position.set(0, 1.05, 0.06);
      face.castShadow = true;
      grp.add(face);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 8, 24), wood);
      rim.position.set(0, 1.05, 0.06);
      grp.add(rim);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.01), wood);
      hand.position.set(0, 1.08, 0.09);
      grp.add(hand);
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'clock', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'painting': {
      const frame = new THREE.MeshLambertMaterial({ color: 0x3d2810 });
      const canvasMat = new THREE.MeshLambertMaterial({ color: 0x6a5040 });
      const grp = new THREE.Group();
      const outer = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.15, 0.05), frame);
      outer.position.set(0, 0.65, 0);
      outer.castShadow = true;
      grp.add(outer);
      const inner = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.95, 0.02), canvasMat);
      inner.position.set(0, 0.65, 0.035);
      grp.add(inner);
      const hook = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.04), frame);
      hook.position.set(0, 1.22, -0.02);
      grp.add(hook);
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'painting', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'statue': {
      const stone = new THREE.MeshLambertMaterial({ color: 0x8a8a88 });
      const grp = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.45), stone);
      base.position.y = 0.06;
      base.castShadow = true;
      grp.add(base);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.55, 12), stone);
      col.position.y = 0.4;
      col.castShadow = true;
      grp.add(col);
      const bust = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), stone);
      bust.position.y = 0.88;
      bust.scale.set(1, 1.15, 0.85);
      bust.castShadow = true;
      grp.add(bust);
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'statue', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'basket': {
      const wicker = new THREE.MeshLambertMaterial({ color: 0x7a6040 });
      const grp = new THREE.Group();
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.22, 16, 1, true), wicker);
      bowl.position.y = 0.14;
      bowl.castShadow = true;
      grp.add(bowl);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.02, 8, 20), wicker);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.24;
      grp.add(rim);
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'basket', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'cushion': {
      const fabric = new THREE.MeshLambertMaterial({ color: 0x6a4070 });
      const grp = new THREE.Group();
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.55), fabric);
      pad.position.y = 0.06;
      pad.castShadow = true;
      pad.receiveShadow = true;
      grp.add(pad);
      const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), fabric);
      tuft.position.y = 0.14;
      grp.add(tuft);
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'cushion', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'sideTable': {
      const wood = new THREE.MeshLambertMaterial({ color: 0x4a3018 });
      const grp = new THREE.Group();
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 18), wood);
      top.position.y = 0.52;
      top.castShadow = true;
      grp.add(top);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.52, 8), wood);
      leg.position.y = 0.26;
      leg.castShadow = true;
      grp.add(leg);
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'sideTable', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'deskLamp': {
      const metal = new THREE.MeshLambertMaterial({ color: 0x3a3530 });
      const shadeMat = new THREE.MeshLambertMaterial({ color: 0xf0e8d8 });
      const grp = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 16), metal);
      base.position.y = 0.02;
      grp.add(base);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8), metal);
      stem.position.y = 0.16;
      grp.add(stem);
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.12, 12, 1, true), shadeMat);
      shade.position.y = 0.32;
      grp.add(shade);
      const bulb = new THREE.PointLight(0xffeedd, 0.9, 5);
      bulb.position.set(0, 0.28, 0);
      grp.add(bulb);
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'deskLamp', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'lectern': {
      const wood = new THREE.MeshLambertMaterial({ color: 0x3d2810 });
      const grp = new THREE.Group();
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.85, 10), wood);
      stand.position.y = 0.42;
      stand.castShadow = true;
      grp.add(stand);
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.4), wood);
      top.position.set(0, 0.88, 0.08);
      top.rotation.x = -0.35;
      top.castShadow = true;
      grp.add(top);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.06, 12), wood);
      base.position.y = 0.03;
      base.receiveShadow = true;
      grp.add(base);
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'lectern', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'barrel': {
      const oak = new THREE.MeshLambertMaterial({ color: 0x5a3a18 });
      const band = new THREE.MeshLambertMaterial({ color: 0x2a2218 });
      const grp = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.65, 16), oak);
      body.position.y = 0.35;
      body.castShadow = true;
      grp.add(body);
      [0.2, 0.5].forEach(y => {
        const r = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.02, 8, 20), band);
        r.rotation.x = Math.PI / 2;
        r.position.y = y;
        grp.add(r);
      });
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'barrel', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'mirror': {
      const frame = new THREE.MeshLambertMaterial({ color: 0x2a1a08 });
      const glass = new THREE.MeshLambertMaterial({ color: 0xa8c0d0, opacity: 0.85, transparent: true });
      const grp = new THREE.Group();
      const outer = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.05, 0.06), frame);
      outer.position.set(0, 0.6, 0);
      outer.castShadow = true;
      grp.add(outer);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.88), glass);
      pane.position.set(0, 0.6, 0.035);
      grp.add(pane);
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'mirror', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'pedestal': {
      const marble = new THREE.MeshLambertMaterial({ color: 0xc8c4c0 });
      const grp = new THREE.Group();
      const bottom = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.45), marble);
      bottom.position.y = 0.05;
      bottom.castShadow = true;
      grp.add(bottom);
      const mid = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.5, 12), marble);
      mid.position.y = 0.35;
      mid.castShadow = true;
      grp.add(mid);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 12), marble);
      top.position.y = 0.66;
      top.castShadow = true;
      grp.add(top);
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'pedestal', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'bust': {
      const stone = new THREE.MeshLambertMaterial({ color: 0x9a9894 });
      const grp = new THREE.Group();
      const socle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.15, 12), stone);
      socle.position.y = 0.075;
      socle.castShadow = true;
      grp.add(socle);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 14), stone);
      head.position.y = 0.32;
      head.scale.set(0.85, 1.1, 0.9);
      head.castShadow = true;
      grp.add(head);
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.15, 0.22), stone);
      shoulder.position.y = 0.18;
      shoulder.castShadow = true;
      grp.add(shoulder);
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'bust', id);
      scene.add(grp);
      propInstances.push({ id, group: grp });
      break;
    }
    case 'cart': {
      const wood = new THREE.MeshLambertMaterial({ color: 0x4a3218 });
      const metal = new THREE.MeshLambertMaterial({ color: 0x3a3835 });
      const grp = new THREE.Group();
      const tray = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.45), wood);
      tray.position.y = 0.55;
      tray.castShadow = true;
      grp.add(tray);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.35, 0.06), wood);
      frame.position.set(0, 0.72, -0.22);
      frame.castShadow = true;
      grp.add(frame);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 12, Math.PI), metal);
      handle.rotation.z = Math.PI / 2;
      handle.position.set(0, 0.85, 0.28);
      grp.add(handle);
      [[-0.28, -0.18], [0.28, -0.18], [-0.28, 0.18], [0.28, 0.18]].forEach(([lx, lz]) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.55, 6), metal);
        post.position.set(lx, 0.27, lz);
        grp.add(post);
      });
      const ax = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), metal);
      ax.rotation.z = Math.PI / 2;
      ax.position.set(0, 0.12, 0);
      grp.add(ax);
      [[-0.22, 0], [0.22, 0]].forEach((lx) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12), metal);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(lx, 0.1, 0);
        grp.add(wheel);
      });
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rotY;
      tagPropGroup(grp, 'cart', id);
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
 *        null/undefined â†’ default chair/table/candle/rug set
 *        [] â†’ no props
 *        array â†’ { id?, kind, x, z, y?, rotY? }[]
 *        object â†’ legacy single-instance-per-kind map
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// LAYOUT LOAD / SAVE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
