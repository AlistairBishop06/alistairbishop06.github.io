// BOOK TILT
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const tiltingBooks = new Map();
const TILT_AMOUNT  = 0.18;
const TILT_SPEED   = 8;

function updateBookTilts(dt) {
  for (const [bookData, tilt] of tiltingBooks) {
    const isTarget = bookData === lookedAtBook && !bookData.isHeld;
    const target   = isTarget ? 1 : 0;
    const next     = THREE.MathUtils.lerp(tilt, target, 1 - Math.exp(-TILT_SPEED * dt));
    const angle    = bookData.mesh.userData.shelfRotY ?? 0;
    const outDir   = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    const base     = bookData.originalPosition.clone();
    bookData.mesh.position.copy(base).addScaledVector(outDir, next * TILT_AMOUNT);

    if (Math.abs(next - target) < 0.001) {
      bookData.mesh.position.copy(base).addScaledVector(outDir, target * TILT_AMOUNT);
      if (target === 0) tiltingBooks.delete(bookData);
      else              tiltingBooks.set(bookData, target);
    } else {
      tiltingBooks.set(bookData, next);
    }
  }
}

let hoveredBook = null;

function setBookHover(bookData, on) {
  if (on && !tiltingBooks.has(bookData))  tiltingBooks.set(bookData, 0);
  if (!on && tiltingBooks.has(bookData))  tiltingBooks.set(bookData, tiltingBooks.get(bookData));
}

function formatLastUpdated(dateStr) {
  if (!dateStr) return '';
  const diff   = Date.now() - new Date(dateStr).getTime();
  const days   = Math.floor(diff / 86400000);
  if (days === 0) return 'Updated today';
  if (days === 1) return 'Updated yesterday';
  if (days < 30)  return `Updated ${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Updated ${months}mo ago`;
  return `Updated ${Math.floor(months / 12)}y ago`;
}

function updateRaycast() {
  raycaster.setFromCamera(screenCenter, camera);
  const hits = raycaster.intersectObjects(getBookMeshes());

  if (hits.length > 0 && hits[0].distance < BOOK_PICKUP_DISTANCE) {
    const bookData = books.find(b => b.mesh === hits[0].object);
    if (bookData) {
      if (hoveredBook && hoveredBook !== bookData) setBookHover(hoveredBook, false);
      if (hoveredBook !== bookData) { setBookHover(bookData, true); hoveredBook = bookData; }
      lookedAtBook = bookData;
      bookInfoName.textContent = bookData.repo.name;
      bookInfoDesc.textContent = bookData.repo.description || 'No description provided.';
      document.getElementById('book-info-updated').textContent =
        formatLastUpdated(bookData.repo.pushed_at || bookData.repo.updated_at);
      bookInfoEl.classList.add('visible');
      return;
    }
  }

  if (hoveredBook) { setBookHover(hoveredBook, false); hoveredBook = null; }
  lookedAtBook = null;
  bookInfoEl.classList.remove('visible');
}

function handleClick() {
  if (!lookedAtBook || heldBook) return;
  const bookData = lookedAtBook;

  tiltingBooks.delete(bookData);
  bookData.mesh.position.copy(bookData.originalPosition);
  hoveredBook = null; lookedAtBook = null;
  bookInfoEl.classList.remove('visible');

  bookData.isHeld      = true;
  bookData.pickupPhase = 'lifting';
  bookData.pickupT     = 0;
  bookData.pickupStartPos  = bookData.mesh.position.clone();
  bookData.pickupStartQuat = bookData.mesh.quaternion.clone();

  heldBook = bookData;
  if (window.AudioFX) window.AudioFX.play('pickup');
  heldInfoEl.classList.add('visible');
  heldNameEl.textContent = bookData.repo.name;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
