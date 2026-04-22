// CHECKOUT / RETURN
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function handleCheckout() {
  if (!heldBook) return;
  if (bookOpen) { closeBook(); return; }
  if (heldBook.pickupPhase !== 'held') return;

  const dist = yawObj.position.distanceTo(DESK_POS);
  if (dist <= DESK_INTERACT_DISTANCE) {
    if (window.AudioFX) window.AudioFX.play('checkout');
    window.open(heldBook.repo.html_url, '_blank');
    returnHeldBook();
  } else {
    openBook(heldBook);
  }
}

function handleInteractE() {
  if (heldCassette) {
    if (heldCassette.pickupPhase !== 'held') return;
    if (heldCassette.inUse) return;

    const comp = typeof findNearestComputer === 'function' ? findNearestComputer(yawObj.position) : null;
    if (comp && typeof startComputerPlayback === 'function') {
      const started = startComputerPlayback(comp, heldCassette);
      if (started) {
        heldCassette.inUse = true;
        if (window.AudioFX) window.AudioFX.play('checkout');
        heldInfoEl.classList.remove('visible');
        deskPromptEl.classList.remove('visible');
      }
    }
    return;
  }
  handleCheckout();
}

function returnHeldAny() {
  if (heldCassette) {
    if (heldCassette.inUse) return;
    returnHeldCassette();
    return;
  }
  returnHeldBook();
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
  if (window.AudioFX) window.AudioFX.play('return');
  heldInfoEl.classList.remove('visible');
  deskPromptEl.classList.remove('visible');
}

function returnHeldCassette() {
  if (!heldCassette) return;
  const mesh = heldCassette.mesh;
  if (heldCassette.pickupPhase === 'held') {
    camera.remove(mesh);
    scene.add(mesh);
  }
  mesh.visible = true;
  mesh.position.copy(heldCassette.originalPosition);
  mesh.rotation.copy(heldCassette.originalRotation);
  heldCassette.isHeld = false;
  heldCassette.pickupPhase = null;
  heldCassette.inUse = false;
  heldCassette = null;
  heldCassetteTime = 0;
  if (window.AudioFX) window.AudioFX.play('return');
  heldInfoEl.classList.remove('visible');
  deskPromptEl.classList.remove('visible');
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
