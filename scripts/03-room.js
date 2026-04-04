// ROOM GEOMETRY
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
