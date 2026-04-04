// PLAYER CONTROLLER
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// INTERACTION SYSTEM
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const raycaster   = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);
let heldBook      = null;
let lookedAtBook  = null;

function getBookMeshes() {
  return books.filter(b => !b.isHeld).map(b => b.mesh);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
