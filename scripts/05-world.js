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
