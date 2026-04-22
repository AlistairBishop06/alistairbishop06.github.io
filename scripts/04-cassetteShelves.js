// CASSETTE SHELVES (vertical stacks)
// ─────────────────────────────────────────────────────

const cassetteShelfSlots = [];
const cassetteShelfObjects = [];

// A cassette shelf is a single vertical stack of cassette slots.
const CASSETTES_PER_SHELF = 7;
const CASSETTE_SLOT_SPACING = 0.055;
const CASSETTE_SHELF_W = 0.72;
const CASSETTE_SHELF_D = 0.36;
const CASSETTE_SHELF_BASE_H = 0.12;
const CASSETTE_SHELF_BACK_H = 0.5;

// { group, slotIndices, x, z, rotY }
const cassetteShelfGroups = [];

function addCassetteShelfUnit(x, z, rotY) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotY;

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(CASSETTE_SHELF_W, CASSETTE_SHELF_BASE_H, CASSETTE_SHELF_D),
    shelfMat
  );
  base.position.set(0, CASSETTE_SHELF_BASE_H / 2, 0);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(CASSETTE_SHELF_W, CASSETTE_SHELF_BACK_H, 0.05),
    shelfMat
  );
  back.position.set(0, CASSETTE_SHELF_BASE_H + CASSETTE_SHELF_BACK_H / 2, -CASSETTE_SHELF_D / 2 + 0.025);
  back.castShadow = true;
  back.receiveShadow = true;
  group.add(back);

  [-CASSETTE_SHELF_W / 2, CASSETTE_SHELF_W / 2].forEach(sx => {
    const side = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, CASSETTE_SHELF_BACK_H, CASSETTE_SHELF_D),
      shelfMat
    );
    side.position.set(sx, CASSETTE_SHELF_BASE_H + CASSETTE_SHELF_BACK_H / 2, 0);
    side.castShadow = true;
    side.receiveShadow = true;
    group.add(side);
  });

  const slotIndices = [];
  const slotX = 0;
  const slotZ = 0.03;
  const startY = CASSETTE_SHELF_BASE_H + 0.08;

  group.updateWorldMatrix(true, false);
  for (let i = 0; i < CASSETTES_PER_SHELF; i++) {
    const localPos = new THREE.Vector3(slotX, startY + i * CASSETTE_SLOT_SPACING, slotZ);
    const worldPos = localPos.clone().applyMatrix4(group.matrixWorld);
    const idx = cassetteShelfSlots.length;
    cassetteShelfSlots.push({ position: worldPos, rotY });
    slotIndices.push(idx);
  }

  scene.add(group);
  cassetteShelfObjects.push(group);

  group.traverse(child => {
    if (child.isMesh) child.userData.cassetteShelfGroup = group;
  });
  group.userData.isCassetteShelfGroup = true;

  cassetteShelfGroups.push({ group, slotIndices, x, z, rotY });
  return group;
}

function buildCassetteShelves() {
  // Default placement: near the checkout desk area.
  addCassetteShelfUnit(2.4, 6.9, 0);
}

