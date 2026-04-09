/**
 * The Archive â€” 3D Portfolio Library
 * A first-person Three.js experience where GitHub repos are books
 *
 * Edit mode: append ?edit to the URL to open the layout editor panel.
 * Drag furniture, adjust rotation, then hit "Copy JSON" and paste into layout.json.
 */

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CONSTANTS & CONFIG
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const GITHUB_USER          = 'AlistairBishop06';
const PLAYER_SPEED         = 6;
const PLAYER_HEIGHT        = 1.7;
const BOOK_PICKUP_DISTANCE = 2;
const DESK_INTERACT_DISTANCE = 3;
const EDIT_MODE            = new URLSearchParams(location.search).has('edit');
const MAX_COMMITS_APPENDIX = 2000;

// Optional: set a GitHub token in localStorage to avoid rate limits while developing.
// localStorage.setItem('archive.githubToken', 'ghp_...');
const GITHUB_TOKEN_STORAGE_KEY = 'archive.githubToken';
function getGitHubToken() {
  try { return localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY) || ''; }
  catch (_) { return ''; }
}
function githubHeaders(accept = 'application/vnd.github+json') {
  const headers = { Accept: accept, 'X-GitHub-Api-Version': '2022-11-28' };
  const token = getGitHubToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Language â†’ warm library colour palette
const LANG_COLORS = {
  'JavaScript': 0xc8a820,
  'TypeScript': 0x4a7fc1,
  'Python':     0x4a8fc8,
  'Rust':       0xb85530,
  'Go':         0x5ab8c8,
  'C#':         0x6a3bc8,
  'C++':        0x8a4ab8,
  'HTML':       0xc85030,
  'CSS':        0x2060b8,
  'Shell':      0x508050,
  'Ruby':       0xb82030,
  'Swift':      0xc86040,
  'Kotlin':     0x7050c8,
  'Java':       0xb87030,
  'PHP':        0x7070c8,
  null:         0x8a7060,
};
function langColor(lang) { return LANG_COLORS[lang] ?? LANG_COLORS[null]; }

// Language â†’ logo (used on book front covers)
// Uses Devicon via jsDelivr which generally provides CORS headers needed for canvas usage.
const LANG_LOGO_URLS = {
  'JavaScript': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
  'TypeScript': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
  'Python':     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
  'Rust':       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg',
  'Go':         'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
  'C#':         'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
  'C++':        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
  'HTML':       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
  'CSS':        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg',
  'Shell':      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg',
  'Ruby':       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg',
  'Swift':      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg',
  'Kotlin':     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg',
  'Java':       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
  'PHP':        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
  'Lua':        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/lua/lua-original.svg',
  'ASP.NET':    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/windows11/windows11-original.svg'
};
function langLogoUrl(lang) { return LANG_LOGO_URLS[lang] ?? null; }

const logoImagePromiseCache = new Map(); // url -> Promise<HTMLImageElement|null>
function loadLogoImage(url) {
  if (!url) return Promise.resolve(null);
  if (logoImagePromiseCache.has(url)) return logoImagePromiseCache.get(url);

  const p = new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
  logoImagePromiseCache.set(url, p);
  return p;
}

function addRoundedRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const coverTextureCache = new Map(); // language|null -> THREE.CanvasTexture
function makeCoverTextureForLanguage(lang) {
  const key = lang ?? null;
  if (coverTextureCache.has(key)) return coverTextureCache.get(key);

  const W = 512, H = 768;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const col = langColor(lang);
  const r = (col >> 16) & 0xff;
  const g = (col >> 8) & 0xff;
  const b = col & 0xff;

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   `rgb(${Math.min(r+22,255)},${Math.min(g+22,255)},${Math.min(b+22,255)})`);
  grad.addColorStop(0.5, `rgb(${r},${g},${b})`);
  grad.addColorStop(1,   `rgb(${Math.max(r-48,0)},${Math.max(g-48,0)},${Math.max(b-48,0)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle border + vignette
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  const vignette = ctx.createRadialGradient(W/2, H/2, Math.min(W, H) * 0.1, W/2, H/2, Math.max(W, H) * 0.75);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  const tex = new THREE.CanvasTexture(canvas);
  coverTextureCache.set(key, tex);

  const url = langLogoUrl(lang);
  if (url) {
    loadLogoImage(url).then(img => {
      if (!img) return;

      const maxW = W * 0.68;
      const maxH = H * 0.46;
      const iw = img.naturalWidth || img.width || 1;
      const ih = img.naturalHeight || img.height || 1;
      const s = Math.min(maxW / iw, maxH / ih);
      const dw = Math.max(1, Math.floor(iw * s));
      const dh = Math.max(1, Math.floor(ih * s));
      const dx = Math.floor((W - dw) / 2);
      const dy = Math.floor((H - dh) / 2);

      // Soft backdrop to keep logos readable on dark colours
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      addRoundedRectPath(ctx, dx - 24, dy - 24, dw + 48, dh + 48, 22);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 8;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();

      tex.needsUpdate = true;
    });
  }

  return tex;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
