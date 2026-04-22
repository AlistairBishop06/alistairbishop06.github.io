// CASSETTE CREATION
// ─────────────────────────────────────────────────────

const cassettes = [];

function isProbablyUrl(s) {
  if (!s || typeof s !== 'string') return false;
  const t = s.trim();
  return /^https?:\/\//i.test(t);
}

function makeCassetteTexture(repo) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const col = langColor(repo.language);
  const r = (col >> 16) & 0xff;
  const g = (col >> 8) & 0xff;
  const b = col & 0xff;

  ctx.fillStyle = `rgb(${Math.max(r - 35, 0)},${Math.max(g - 35, 0)},${Math.max(b - 35, 0)})`;
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(16, 16, 480, 224);

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(32, 32, 448, 64);

  const name = (repo.name || 'project').replace(/[-_]/g, ' ');
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let displayName = name;
  while (ctx.measureText(displayName).width > 420 && displayName.length > 2) displayName = displayName.slice(0, -1);
  if (displayName !== name) displayName += '\u2026';
  ctx.fillText(displayName, 44, 64);

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '500 18px Georgia, serif';
  ctx.fillText('DEPLOYED SITE', 44, 118);

  return new THREE.CanvasTexture(canvas);
}

function createCassette(repo, slotIndex, deployedUrl) {
  const slot = cassetteShelfSlots[slotIndex];
  if (!slot) return null;

  const url = isProbablyUrl(deployedUrl) ? deployedUrl.trim() : null;
  if (!url) return null;

  const tex = makeCassetteTexture(repo);
  if (renderer?.capabilities) tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const cassetteW = 0.26;
  const cassetteH = 0.05;
  const cassetteD = 0.16;

  const geo = new THREE.BoxGeometry(cassetteW, cassetteH, cassetteD);
  const mat = new THREE.MeshLambertMaterial({ map: tex, color: 0xffffff });
  const mesh = new THREE.Mesh(geo, mat);

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.copy(slot.position);
  mesh.position.y += cassetteH / 2;
  mesh.rotation.y = slot.rotY ?? 0;

  mesh.userData = {
    repo,
    deployedUrl: url,
    slotIndex,
    isCassette: true,
    shelfRotY: slot.rotY ?? 0,
    cassetteH,
  };

  scene.add(mesh);
  cassettes.push({
    mesh,
    repo,
    deployedUrl: url,
    slotIndex,
    isHeld: false,
    originalPosition: mesh.position.clone(),
    originalRotation: mesh.rotation.clone(),
  });

  return mesh;
}

function getCassetteMeshes() {
  return cassettes.filter(c => !c.isHeld).map(c => c.mesh);
}
