// CHECKOUT / RETURN
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
