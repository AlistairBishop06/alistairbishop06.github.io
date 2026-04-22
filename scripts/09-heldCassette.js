// HELD CASSETTE ANIMATION
// ─────────────────────────────────────────────────────

let heldCassetteTime = 0;
const HELD_CASSETTE_POS = new THREE.Vector3(-0.28, -0.33, -0.55);
const HELD_CASSETTE_ROT = new THREE.Euler(0.12, 0.35, 0.02);

function easeOutCubicCassette(t) {
  return 1 - Math.pow(1 - t, 3);
}

function updateHeldCassette(dt) {
  if (!heldCassette) return;
  heldCassetteTime += dt;

  const cassette = heldCassette;
  const mesh = cassette.mesh;

  if (cassette.pickupPhase === 'lifting') {
    cassette.pickupT = Math.min(1, cassette.pickupT + dt / 0.45);
    const t = easeOutCubicCassette(cassette.pickupT);

    const camWorldPos = new THREE.Vector3();
    const camWorldQuat = new THREE.Quaternion();
    camera.getWorldPosition(camWorldPos);
    camera.getWorldQuaternion(camWorldQuat);

    const targetPos = HELD_CASSETTE_POS.clone().applyQuaternion(camWorldQuat).add(camWorldPos);
    const targetQuat = new THREE.Quaternion().setFromEuler(HELD_CASSETTE_ROT).premultiply(camWorldQuat);

    mesh.position.copy(cassette.pickupStartPos.clone().lerp(targetPos, t));
    mesh.quaternion.copy(cassette.pickupStartQuat.clone().slerp(targetQuat, t));

    if (cassette.pickupT >= 1) {
      scene.remove(mesh);
      camera.add(mesh);
      mesh.position.copy(HELD_CASSETTE_POS);
      mesh.rotation.copy(HELD_CASSETTE_ROT);
      cassette.pickupPhase = 'held';
      heldCassetteTime = 0;
    }
    return;
  }

  if (cassette.pickupPhase === 'held' && !bookOpen) {
    const bobY = Math.sin(heldCassetteTime * 1.9) * 0.006;
    const bobR = Math.sin(heldCassetteTime * 1.3) * 0.01;
    mesh.position.set(HELD_CASSETTE_POS.x, HELD_CASSETTE_POS.y + bobY, HELD_CASSETTE_POS.z);
    mesh.rotation.set(HELD_CASSETTE_ROT.x + bobR, HELD_CASSETTE_ROT.y, HELD_CASSETTE_ROT.z + bobR * 0.35);
  }
}

