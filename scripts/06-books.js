// BOOK CREATION
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const books = [];

function makeBookTexture(repo) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const col = langColor(repo.language);
  const r = (col >> 16) & 0xff;
  const g = (col >> 8) & 0xff;
  const b = col & 0xff;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0,   `rgb(${Math.min(r+30,255)},${Math.min(g+30,255)},${Math.min(b+30,255)})`);
  grad.addColorStop(0.5, `rgb(${r},${g},${b})`);
  grad.addColorStop(1,   `rgb(${Math.max(r-40,0)},${Math.max(g-40,0)},${Math.max(b-40,0)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 512);

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, 128, 48);
  ctx.fillRect(0, 464, 128, 48);

  ctx.fillStyle = 'rgba(255,210,80,0.7)';
  ctx.fillRect(8, 50, 112, 2);
  ctx.fillRect(8, 460, 112, 2);

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, 6, 512);
  ctx.fillRect(122, 0, 6, 512);

  const name = repo.name.replace(/-/g, ' ').replace(/_/g, ' ');
  ctx.save();
  ctx.translate(64, 470);
  ctx.rotate(-Math.PI / 2);

  const maxTextW = 380;
  ctx.font = 'bold 28px Georgia, serif';
  let displayName = name;
  while (ctx.measureText(displayName).width > maxTextW && displayName.length > 2)
    displayName = displayName.slice(0, -1);
  if (displayName !== name) displayName += '\u2026';

  const tw = ctx.measureText(displayName).width;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-8, -22, tw + 16, 34);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(displayName, 0, 0);
  ctx.restore();

  if (repo.language) {
    ctx.save();
    ctx.font = '500 18px Georgia, serif';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
    ctx.fillText(repo.language, 64, 24);
    ctx.restore();
  }

  return new THREE.CanvasTexture(canvas);
}

function createBook(repo, slotIndex) {
  const slot = shelfSlots[slotIndex];
  if (!slot) return null;

  const col      = langColor(repo.language);
  const spineTex = makeBookTexture(repo);
  const coverTex = makeCoverTextureForLanguage(repo.language);
  if (coverTex && renderer && renderer.capabilities) {
    coverTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  const bW = 0.075 + Math.random() * 0.035;
  const bH = 0.62  + Math.random() * 0.15;
  const bD = 0.4;

  const geo      = new THREE.BoxGeometry(bW, bH, bD);
  const spineMat = new THREE.MeshLambertMaterial({ map: spineTex });
  const coverMat = new THREE.MeshLambertMaterial({ map: coverTex, color: 0xffffff });
  const solidMat = new THREE.MeshLambertMaterial({ color: col });
  const pageMat  = new THREE.MeshLambertMaterial({ color: 0xe8d5b0 });
  // BoxGeometry material order: +x, -x, +y, -y, +z, -z
  // We treat Â±x as the front/back covers, +z as the spine.
  const materials = [coverMat, coverMat, pageMat, solidMat, spineMat, solidMat];

  const mesh = new THREE.Mesh(geo, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.copy(slot.position);
  mesh.position.y += bH / 2;
  mesh.rotation.y  = slot.rotY ?? 0;

  mesh.userData = {
    repo, slotIndex, bookHeight: bH, bookWidth: bW,
    isBook: true, shelfRotY: slot.rotY ?? 0,
  };

  scene.add(mesh);
  books.push({
    mesh, repo, slotIndex, isHeld: false,
    originalPosition: mesh.position.clone(),
    originalRotation: mesh.rotation.clone(),
  });

  return mesh;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
