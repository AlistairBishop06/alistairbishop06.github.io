// BOOKSHELVES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
