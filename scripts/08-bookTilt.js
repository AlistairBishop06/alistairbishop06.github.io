// BOOK TILT
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const tiltingBooks = new Map();
const TILT_AMOUNT  = 0.18;
const TILT_SPEED   = 8;

const tiltingCassettes = new Map();
const CASSETTE_TILT_AMOUNT = 0.1;
const CASSETTE_TILT_SPEED = 10;

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

  for (const [cassetteData, tilt] of tiltingCassettes) {
    const isTarget = cassetteData === lookedAtCassette && !cassetteData.isHeld;
    const target = isTarget ? 1 : 0;
    const next = THREE.MathUtils.lerp(tilt, target, 1 - Math.exp(-CASSETTE_TILT_SPEED * dt));
    const angle = cassetteData.mesh.userData.shelfRotY ?? 0;
    const outDir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    const base = cassetteData.originalPosition.clone();
    cassetteData.mesh.position.copy(base).addScaledVector(outDir, next * CASSETTE_TILT_AMOUNT);

    if (Math.abs(next - target) < 0.001) {
      cassetteData.mesh.position.copy(base).addScaledVector(outDir, target * CASSETTE_TILT_AMOUNT);
      if (target === 0) tiltingCassettes.delete(cassetteData);
      else tiltingCassettes.set(cassetteData, target);
    } else {
      tiltingCassettes.set(cassetteData, next);
    }
  }
}

let hoveredBook = null;
let hoveredCassette = null;

function setBookHover(bookData, on) {
  if (on && !tiltingBooks.has(bookData))  tiltingBooks.set(bookData, 0);
  if (!on && tiltingBooks.has(bookData))  tiltingBooks.set(bookData, tiltingBooks.get(bookData));
}

function setCassetteHover(cassetteData, on) {
  if (on && !tiltingCassettes.has(cassetteData)) tiltingCassettes.set(cassetteData, 0);
  if (!on && tiltingCassettes.has(cassetteData)) tiltingCassettes.set(cassetteData, tiltingCassettes.get(cassetteData));
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
  const targets = [...getBookMeshes(), ...getCassetteMeshes()];
  const hits = raycaster.intersectObjects(targets);

  if (hits.length > 0 && hits[0].distance < BOOK_PICKUP_DISTANCE) {
    const hitObj = hits[0].object;

    const bookData = books.find(b => b.mesh === hitObj);
    if (bookData) {
      if (hoveredCassette) { setCassetteHover(hoveredCassette, false); hoveredCassette = null; }
      lookedAtCassette = null;

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

    const cassetteData = cassettes.find(c => c.mesh === hitObj);
    if (cassetteData) {
      if (hoveredBook) { setBookHover(hoveredBook, false); hoveredBook = null; }
      lookedAtBook = null;

      if (hoveredCassette && hoveredCassette !== cassetteData) setCassetteHover(hoveredCassette, false);
      if (hoveredCassette !== cassetteData) { setCassetteHover(cassetteData, true); hoveredCassette = cassetteData; }
      lookedAtCassette = cassetteData;
      bookInfoName.textContent = cassetteData.repo.name;
      bookInfoDesc.textContent = cassetteData.repo.description || 'Deployed website.';
      document.getElementById('book-info-updated').textContent = 'Website cassette';
      bookInfoEl.classList.add('visible');
      return;
    }
  }

  if (hoveredBook) { setBookHover(hoveredBook, false); hoveredBook = null; }
  if (hoveredCassette) { setCassetteHover(hoveredCassette, false); hoveredCassette = null; }
  lookedAtBook = null;
  lookedAtCassette = null;
  bookInfoEl.classList.remove('visible');
}

function handleClick() {
  if (heldBook || heldCassette) return;

  if (lookedAtBook) {
    const bookData = lookedAtBook;

    tiltingBooks.delete(bookData);
    bookData.mesh.position.copy(bookData.originalPosition);
    hoveredBook = null; lookedAtBook = null;
    bookInfoEl.classList.remove('visible');

    bookData.isHeld = true;
    bookData.pickupPhase = 'lifting';
    bookData.pickupT = 0;
    bookData.pickupStartPos = bookData.mesh.position.clone();
    bookData.pickupStartQuat = bookData.mesh.quaternion.clone();

    heldBook = bookData;
    if (window.AudioFX) window.AudioFX.play('pickup');
    heldInfoEl.classList.add('visible');
    heldNameEl.textContent = bookData.repo.name;
    if (heldActionTextEl) {
      heldActionTextEl.innerHTML =
        'Press <span class="key-inline">E</span> to open &nbsp;Â·&nbsp; desk + <span class="key-inline">E</span> to check out &nbsp;Â·&nbsp;<span class="key-inline">â†</span><span class="key-inline">â†’</span> to change pages &nbsp;Â·&nbsp; <span class="key-inline">Q</span> to shelve';
    }
    return;
  }

  if (!lookedAtCassette) return;
  const cassetteData = lookedAtCassette;

  tiltingCassettes.delete(cassetteData);
  cassetteData.mesh.position.copy(cassetteData.originalPosition);
  hoveredCassette = null;
  lookedAtCassette = null;
  bookInfoEl.classList.remove('visible');

  cassetteData.isHeld = true;
  cassetteData.pickupPhase = 'lifting';
  cassetteData.pickupT = 0;
  cassetteData.pickupStartPos = cassetteData.mesh.position.clone();
  cassetteData.pickupStartQuat = cassetteData.mesh.quaternion.clone();

  heldCassette = cassetteData;
  if (window.AudioFX) window.AudioFX.play('pickup');
  heldInfoEl.classList.add('visible');
  heldNameEl.textContent = cassetteData.repo.name;
  if (heldActionTextEl) {
    heldActionTextEl.innerHTML =
      'Bring to a computer + <span class="key-inline">E</span> to play &nbsp;Â·&nbsp; <span class="key-inline">Q</span> to shelve';
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
