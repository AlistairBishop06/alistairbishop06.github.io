// HELD BOOK ANIMATION
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
