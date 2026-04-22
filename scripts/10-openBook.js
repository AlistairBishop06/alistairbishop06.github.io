// 3D OPEN BOOK SYSTEM
// ─────────────────────────────────────────────────────

let bookOpen     = false;
let openBookData = null;
let pageGroup    = null;
let currentPage  = 0;
let pageChunks   = [];
let flipState    = null;
let pageTextureCache = new Map(); // pageIndex -> THREE.Texture
const FLIP_DURATION_SEC = 0.52;
const PAGE_W     = 0.38;
const PAGE_H     = 0.52;
const PAGE_GAP   = 0.005;

// Higher quality page textures + basic markdown layout for READMEs
const PAGE_TEX_W = 768;
const PAGE_TEX_H = 1024;
let paperPattern = null;
function getPaperPattern(ctx) {
  if (paperPattern) return paperPattern;
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const cctx = c.getContext('2d');
  cctx.fillStyle = '#f6eedc';
  cctx.fillRect(0, 0, c.width, c.height);
  const img = cctx.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() * 20) | 0;
    img.data[i + 0] = Math.min(255, img.data[i + 0] + n);
    img.data[i + 1] = Math.min(255, img.data[i + 1] + n);
    img.data[i + 2] = Math.min(255, img.data[i + 2] + n);
    img.data[i + 3] = 255;
  }
  cctx.putImageData(img, 0, 0);
  paperPattern = ctx.createPattern(c, 'repeat');
  return paperPattern;
}

function drawPaperBackground(ctx, W, H) {
  ctx.fillStyle = '#f6eedc';
  ctx.fillRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(255,255,255,0.45)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
  grad.addColorStop(1, 'rgba(0,0,0,0.06)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const pat = getPaperPattern(ctx);
  if (pat) {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  ctx.strokeStyle = 'rgba(60,35,15,0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, W - 36, H - 36);
}

function sanitizeInlineMarkdown(s) {
  return (s ?? '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '[image]')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function markdownToBlocks(md) {
  if (!md) return [{ type: 'p', text: 'No README found for this repository.' }];
  const lines = md.replace(/\r/g, '').split('\n');
  const blocks = [];
  let i = 0;

  const isCodeFence = line => /^\s*```/.test(line);
  const isHr = line => /^\s*---+\s*$/.test(line);

  while (i < lines.length) {
    const raw = lines[i] ?? '';
    const line = raw.replace(/\t/g, '  ');

    if (!line.trim()) {
      blocks.push({ type: 'blank' });
      i++;
      continue;
    }

    if (isCodeFence(line)) {
      i++;
      const codeLines = [];
      while (i < lines.length && !isCodeFence(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && isCodeFence(lines[i])) i++;
      const text = codeLines.join('\n').replace(/\s+$/g, '');
      if (text.trim()) blocks.push({ type: 'code', text });
      continue;
    }

    const h = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (h) {
      blocks.push({ type: 'h', level: h[1].length, text: sanitizeInlineMarkdown(h[2]) });
      i++;
      continue;
    }

    if (isHr(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) {
      blocks.push({ type: 'quote', text: sanitizeInlineMarkdown(quote[1]) });
      i++;
      continue;
    }

    const li = line.match(/^\s*([-*]|\d+\.)\s+(.*)$/);
    if (li) {
      blocks.push({ type: 'li', text: sanitizeInlineMarkdown(li[2]) });
      i++;
      continue;
    }

    // Paragraph: gather until blank or a new block marker
    const parts = [sanitizeInlineMarkdown(line)];
    i++;
    while (i < lines.length) {
      const peek = (lines[i] ?? '').replace(/\t/g, '  ');
      if (!peek.trim()) break;
      if (isCodeFence(peek)) break;
      if (/^\s*#{1,6}\s+/.test(peek)) break;
      if (isHr(peek)) break;
      if (/^\s*>\s?/.test(peek)) break;
      if (/^\s*([-*]|\d+\.)\s+/.test(peek)) break;
      parts.push(sanitizeInlineMarkdown(peek));
      i++;
    }
    const text = parts.filter(Boolean).join(' ').trim();
    if (text) blocks.push({ type: 'p', text });
  }

  while (blocks.length && blocks[0].type === 'blank') blocks.shift();
  while (blocks.length && blocks[blocks.length - 1].type === 'blank') blocks.pop();
  return blocks.length ? blocks : [{ type: 'p', text: 'No content.' }];
}

function makeMeasureContext() {
  const c = document.createElement('canvas');
  c.width = 2; c.height = 2;
  return c.getContext('2d');
}

function wrapText(ctx, text, font, maxW) {
  ctx.font = font;
  const words = (text ?? '').split(' ').filter(Boolean);
  const out = [];
  let line = '';
  for (const w of words) {
    const test = line ? (line + ' ' + w) : w;
    if (ctx.measureText(test).width > maxW && line) {
      out.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) out.push(line);
  return out.length ? out : [''];
}

function wrapCodeLine(ctx, text, font, maxW) {
  ctx.font = font;
  const out = [];
  let start = 0;
  const s = text ?? '';
  while (start < s.length) {
    let end = Math.min(s.length, start + 120);
    while (end > start + 1 && ctx.measureText(s.slice(start, end)).width > maxW) end--;
    if (end <= start) end = start + 1;
    out.push(s.slice(start, end));
    start = end;
  }
  return out.length ? out : [''];
}

function layoutMarkdownPages(md) {
  const ctx = makeMeasureContext();

  const W = PAGE_TEX_W, H = PAGE_TEX_H;
  const marginL = 66, marginR = W - 66;
  const maxW = marginR - marginL;
  const top = 126;
  const bottom = H - 116;

  const fonts = {
    h1: '700 34px Georgia, serif',
    h2: '700 28px Georgia, serif',
    h3: '700 24px Georgia, serif',
    h4: '700 21px Georgia, serif',
    p:  '400 20px Georgia, serif',
    code: '14px \"Courier New\", monospace',
    quote: 'italic 20px Georgia, serif',
  };

  const heights = {
    h1: 44, h2: 38, h3: 34, h4: 30,
    p: 28, li: 28, quote: 28, code: 22,
    blank: 14, hr: 20,
  };

  const blocks = markdownToBlocks(md);
  const lines = [];

  const pushBlank = () => lines.push({ type: 'blank' });

  for (const b of blocks) {
    if (b.type === 'blank') { pushBlank(); continue; }

    if (b.type === 'hr') {
      lines.push({ type: 'hr' });
      pushBlank();
      continue;
    }

    if (b.type === 'h') {
      const level = Math.max(1, Math.min(6, b.level ?? 2));
      const font = level === 1 ? fonts.h1 : level === 2 ? fonts.h2 : level === 3 ? fonts.h3 : fonts.h4;
      const wrap = wrapText(ctx, b.text, font, maxW);
      wrap.forEach((t, idx) => lines.push({ type: 'h', level, text: t, cont: idx > 0 }));
      pushBlank();
      continue;
    }

    if (b.type === 'quote') {
      const wrap = wrapText(ctx, b.text, fonts.quote, maxW - 26);
      wrap.forEach((t, idx) => lines.push({ type: 'quote', text: t, cont: idx > 0 }));
      pushBlank();
      continue;
    }

    if (b.type === 'li') {
      const wrap = wrapText(ctx, b.text, fonts.p, maxW - 32);
      wrap.forEach((t, idx) => lines.push({ type: 'li', text: t, cont: idx > 0 }));
      continue;
    }

    if (b.type === 'code') {
      const codeLines = (b.text ?? '').split('\n');
      for (const cl of codeLines) {
        const wrapped = wrapCodeLine(ctx, cl, fonts.code, maxW - 22);
        wrapped.forEach(t => lines.push({ type: 'code', text: t }));
      }
      pushBlank();
      continue;
    }

    if (b.type === 'p') {
      const wrap = wrapText(ctx, b.text, fonts.p, maxW);
      wrap.forEach(t => lines.push({ type: 'p', text: t }));
      pushBlank();
    }
  }

  const pages = [];
  let page = { kind: 'markdown', lines: [] };
  let y = top;
  const newPage = () => {
    if (page.lines.length) pages.push(page);
    page = { kind: 'markdown', lines: [] };
    y = top;
  };

  for (const ln of lines) {
    const h = ln.type === 'h'
      ? ((ln.level ?? 2) === 1 ? heights.h1 : (ln.level ?? 2) === 2 ? heights.h2 : (ln.level ?? 2) === 3 ? heights.h3 : heights.h4)
      : (heights[ln.type] ?? heights.p);

    if (y + h > bottom && page.lines.length) newPage();
    page.lines.push(ln);
    y += h;
  }
  if (page.lines.length) pages.push(page);
  return pages.length ? pages : [{ kind: 'markdown', lines: [{ type: 'p', text: 'No content.' }] }];
}

function formatBytes(bytes) {
  if (bytes == null || !Number.isFinite(bytes)) return '';
  const abs = Math.abs(bytes);
  if (abs < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (Math.abs(kb) < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (Math.abs(mb) < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

function repoExtraToMarkdown(repo, extra) {
  const lines = [];
  lines.push('# Repository Appendix');
  lines.push('');

  lines.push('## Overview');
  if (repo?.description) lines.push(repo.description);
  lines.push('');
  const license = repo?.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION' ? repo.license.spdx_id : null;
  const sizeKb = typeof repo?.size === 'number' ? repo.size : null; // GitHub API returns KB
  [
    repo?.html_url ? `- URL: ${repo.html_url}` : null,
    repo?.default_branch ? `- Default branch: ${repo.default_branch}` : null,
    license ? `- License: ${license}` : null,
    typeof repo?.stargazers_count === 'number' ? `- Stars: ${repo.stargazers_count}` : null,
    typeof repo?.forks_count === 'number' ? `- Forks: ${repo.forks_count}` : null,
    typeof repo?.open_issues_count === 'number' ? `- Open issues: ${repo.open_issues_count}` : null,
    sizeKb != null ? `- Repo size: ${formatBytes(sizeKb * 1024)}` : null,
    repo?.pushed_at || repo?.updated_at ? `- Last updated: ${formatLastUpdated(repo.pushed_at || repo.updated_at)}` : null,
  ].filter(Boolean).forEach(l => lines.push(l));
  lines.push('');

  // Languages
  lines.push('## Languages');
  const languages = extra?.languages && typeof extra.languages === 'object' ? extra.languages : null;
  if (languages && Object.keys(languages).length) {
    const entries = Object.entries(languages).filter(([, v]) => typeof v === 'number' && v > 0);
    const total = entries.reduce((a, [, v]) => a + v, 0) || 1;
    entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([name, v]) => {
        const pct = Math.round((v / total) * 100);
        lines.push(`- ${name} — ${pct}%`);
      });
    if (entries.length > 10) lines.push(`- …and ${entries.length - 10} more`);
  } else {
    lines.push('- Not available (rate limited or disabled).');
  }
  lines.push('');

  // File structure + types
  lines.push('## File Structure');
  const tree = extra?.tree && typeof extra.tree === 'object' ? extra.tree : null;
  const contents = Array.isArray(extra?.contents) ? extra.contents : null;

  const rootDirs = new Set();
  const rootFiles = new Set();
  const extCounts = new Map();
  let fileCount = 0;
  let dirCount = 0;
  let truncated = false;

  if (tree && Array.isArray(tree.tree)) {
    truncated = !!tree.truncated;
    for (const entry of tree.tree) {
      if (!entry || typeof entry.path !== 'string') continue;
      const path = entry.path;
      const first = path.split('/')[0];
      if (!first) continue;

      if (path.includes('/')) rootDirs.add(first);
      else if (entry.type === 'tree') rootDirs.add(first);
      else rootFiles.add(first);

      if (entry.type === 'tree') {
        dirCount++;
        continue;
      }
      if (entry.type !== 'blob') continue;
      fileCount++;
      const base = path.split('/').pop() || '';
      const dot = base.lastIndexOf('.');
      const ext = dot > 0 ? base.slice(dot).toLowerCase() : '(no ext)';
      extCounts.set(ext, (extCounts.get(ext) || 0) + 1);
    }
  } else if (contents) {
    for (const item of contents) {
      if (!item || typeof item.name !== 'string') continue;
      if (item.type === 'dir') { rootDirs.add(item.name); dirCount++; continue; }
      if (item.type === 'file') {
        rootFiles.add(item.name);
        fileCount++;
        const dot = item.name.lastIndexOf('.');
        const ext = dot > 0 ? item.name.slice(dot).toLowerCase() : '(no ext)';
        extCounts.set(ext, (extCounts.get(ext) || 0) + 1);
      }
    }
  }

  const rootDirsArr = Array.from(rootDirs).sort();
  const rootFilesArr = Array.from(rootFiles).sort();

  if (rootDirsArr.length || rootFilesArr.length) {
    lines.push(`- Folders: ${rootDirsArr.length}`);
    lines.push(`- Files: ${rootFilesArr.length}`);
    if (truncated) lines.push('- Note: file tree is truncated by the GitHub API.');
    lines.push('');
    lines.push('```');
    lines.push('/');
    rootDirsArr.slice(0, 18).forEach(d => lines.push(`  ${d}/`));
    if (rootDirsArr.length > 18) lines.push(`  … (${rootDirsArr.length - 18} more folders)`);
    rootFilesArr.slice(0, 22).forEach(f => lines.push(`  ${f}`));
    if (rootFilesArr.length > 22) lines.push(`  … (${rootFilesArr.length - 22} more files)`);
    lines.push('```');
  } else {
    lines.push('- Not available (rate limited or disabled).');
  }
  lines.push('');

  lines.push('## File Types');
  const extArr = Array.from(extCounts.entries()).sort((a, b) => b[1] - a[1]);
  if (extArr.length) {
    extArr.slice(0, 12).forEach(([ext, n]) => lines.push(`- ${ext} — ${n} file${n === 1 ? '' : 's'}`));
    if (extArr.length > 12) lines.push(`- …and ${extArr.length - 12} more`);
  } else {
    lines.push('- Not available.');
  }
  lines.push('');

  // Commit history
  lines.push('## Commit History');
  const commitObj = extra?.commits ?? null;
  const commits = Array.isArray(commitObj) ? commitObj : Array.isArray(commitObj?.items) ? commitObj.items : null;
  const commitsTruncated = !!commitObj?.truncated;
  if (commits && commits.length) {
    commits.forEach(c => {
      const sha = typeof c?.sha === 'string' ? c.sha.slice(0, 7) : '';
      const msg = typeof c?.commit?.message === 'string' ? c.commit.message.split('\n')[0] : '';
      const author = c?.commit?.author?.name || c?.author?.login || '';
      const date = c?.commit?.author?.date ? new Date(c.commit.author.date) : null;
      const day = date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : '';
      let title = msg.trim();
      if (title.length > 72) title = title.slice(0, 71) + '…';
      const parts = [
        day ? `${day} —` : null,
        title || null,
        sha ? `(${sha})` : null,
        author ? `— ${author}` : null,
      ].filter(Boolean);
      lines.push(`- ${parts.join(' ')}`);
    });
    if (commitsTruncated) {
      lines.push('');
      lines.push(`- Note: commit list truncated at ${commits.length} commits. Increase MAX_COMMITS_APPENDIX to fetch more.`);
    }
  } else {
    lines.push('- Not available (rate limited or disabled).');
  }

  return lines.join('\n');
}

function buildBookPages(repo, readmeText, extra) {
  const pages = [{ kind: 'cover', repo }];
  if (!readmeText) {
    pages.push({ kind: 'markdown', lines: [{ type: 'p', text: 'Loading README…' }] });
    return pages;
  }
  pages.push(...layoutMarkdownPages(readmeText));

  const appendix = repoExtraToMarkdown(repo, extra);
  if (appendix) pages.push(...layoutMarkdownPages(appendix));
  return pages;
}

function getPageTexture(bookData, pageIdx) {
  if (pageTextureCache.has(pageIdx)) return pageTextureCache.get(pageIdx);
  const tex = makePageTextureV2(pageChunks[pageIdx], pageIdx, pageChunks.length, bookData);
  if (tex && renderer && renderer.capabilities) tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  pageTextureCache.set(pageIdx, tex);
  return tex;
}

function makePageTextureV2(page, pageNum, totalPages, bookData) {
  const W = PAGE_TEX_W, H = PAGE_TEX_H;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  drawPaperBackground(ctx, W, H);

  const marginL = 66, marginR = W - 66;
  const maxW = marginR - marginL;
  const headerY = 62;
  const top = 126;
  const bottom = H - 116;

  const repo = bookData?.repo ?? page?.repo;

  // Header
  ctx.save();
  ctx.font = '600 14px \"Trebuchet MS\", Arial, sans-serif';
  ctx.fillStyle = 'rgba(60,35,15,0.72)';
  ctx.textAlign = 'left';
  ctx.fillText(repo?.name ?? 'Repository', marginL, headerY);
  ctx.textAlign = 'right';
  ctx.fillText(repo?.language ?? '', marginR, headerY);
  ctx.strokeStyle = 'rgba(60,35,15,0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(marginL, headerY + 12);
  ctx.lineTo(marginR, headerY + 12);
  ctx.stroke();
  ctx.restore();

  // Footer
  ctx.save();
  ctx.font = 'italic 14px Georgia, serif';
  ctx.fillStyle = 'rgba(100,70,40,0.55)';
  ctx.textAlign = 'center';
  ctx.fillText(`${pageNum + 1} / ${totalPages}`, W / 2, H - 54);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);

  if (page && typeof page === 'object' && page.kind === 'cover') {
    const title = repo?.name ?? 'Untitled';
    const desc = (repo?.description ?? 'No description provided.').trim();

    const col = langColor(repo?.language ?? null);
    const r = (col >> 16) & 0xff;
    const g = (col >> 8) & 0xff;
    const b = col & 0xff;

    // Accent ribbon
    ctx.save();
    ctx.fillStyle = `rgba(${r},${g},${b},0.12)`;
    ctx.fillRect(0, 0, W, 150);
    ctx.fillStyle = `rgba(${r},${g},${b},0.08)`;
    ctx.fillRect(0, H - 170, W, 170);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1a0e04';
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.font = '800 48px Georgia, serif';
    const titleLines = wrapText(ctx, sanitizeInlineMarkdown(title), ctx.font, maxW);
    // Leave extra room for larger language logos at the top.
    let y = 340;
    for (const t of titleLines) {
      ctx.fillText(t, W / 2, y);
      y += 56;
    }
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillStyle = 'rgba(60,35,15,0.75)';
    const subtitle = repo?.language ? `${repo.language} project` : 'Project';
    ctx.fillText(subtitle, W / 2, y + 10);

    ctx.strokeStyle = 'rgba(60,35,15,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 170, y + 36);
    ctx.lineTo(W / 2 + 170, y + 36);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '400 20px Georgia, serif';
    ctx.fillStyle = 'rgba(20,10,4,0.9)';
    const descLines = wrapText(ctx, sanitizeInlineMarkdown(desc), ctx.font, maxW);
    let dy = y + 90;
    for (const dl of descLines.slice(0, 6)) {
      ctx.fillText(dl, marginL, dy);
      dy += 30;
    }

    ctx.font = '600 14px \"Trebuchet MS\", Arial, sans-serif';
    ctx.fillStyle = 'rgba(60,35,15,0.62)';
    const stars = typeof repo?.stargazers_count === 'number' ? repo.stargazers_count : null;
    const updated = repo?.pushed_at || repo?.updated_at || '';
    const metaLeft = [
      stars != null ? `Stars: ${stars}` : null,
      repo?.html_url ? 'GitHub: ' + repo.html_url.replace(/^https?:\/\//, '') : null,
    ].filter(Boolean);
    const metaRight = updated ? `Last update: ${formatLastUpdated(updated)}` : '';
    ctx.fillText(metaLeft.join('   '), marginL, H - 150);
    ctx.textAlign = 'right';
    ctx.fillText(metaRight, marginR, H - 150);
    ctx.restore();

    // Logo (async)
    const url = langLogoUrl(repo?.language ?? null);
    if (url) {
      loadLogoImage(url).then(img => {
        if (!img) return;
        const maxLogoW = W * 0.22;
        const maxLogoH = H * 0.14;
        const iw = img.naturalWidth || img.width || 1;
        const ih = img.naturalHeight || img.height || 1;
        const s = Math.min(maxLogoW / iw, maxLogoH / ih);
        const dw = Math.max(1, Math.floor(iw * s));
        const dh = Math.max(1, Math.floor(ih * s));
        const dx = Math.floor(W / 2 - dw / 2);
        const dy = 120;

        ctx.save();
        ctx.globalAlpha = 0.94;
        ctx.shadowColor = 'rgba(0,0,0,0.22)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 10;
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();

        tex.needsUpdate = true;
      });
    }

    return tex;
  }

  const pageObj = (page && typeof page === 'object' && page.kind === 'markdown') ? page : null;
  const lines = pageObj?.lines ?? [{ type: 'p', text: String(page ?? '') }];

  const fonts = {
    h1: '700 34px Georgia, serif',
    h2: '700 28px Georgia, serif',
    h3: '700 24px Georgia, serif',
    h4: '700 21px Georgia, serif',
    p:  '400 20px Georgia, serif',
    quote: 'italic 20px Georgia, serif',
    code: '14px \"Courier New\", monospace',
  };

  const heights = {
    h1: 44, h2: 38, h3: 34, h4: 30,
    p: 28, li: 28, quote: 28, code: 22,
    blank: 14, hr: 20,
  };

  const lineHeight = ln => {
    if (ln.type === 'h') {
      const lvl = ln.level ?? 2;
      return lvl === 1 ? heights.h1 : lvl === 2 ? heights.h2 : lvl === 3 ? heights.h3 : heights.h4;
    }
    return heights[ln.type] ?? heights.p;
  };

  const yPos = [];
  let y = top;
  for (let i = 0; i < lines.length; i++) {
    yPos[i] = y;
    y += lineHeight(lines[i]);
    if (y > bottom) break;
  }

  // Code backplates (runs of code lines)
  for (let i = 0; i < lines.length; i++) {
    if (yPos[i] == null) break;
    if (lines[i].type !== 'code') continue;
    const start = i;
    let end = i;
    while (end + 1 < lines.length && lines[end + 1].type === 'code' && yPos[end + 1] != null) end++;

    const y0 = yPos[start] - 14;
    const y1 = yPos[end] + lineHeight(lines[end]) - 6;
    const x0 = marginL - 8;
    const w0 = maxW + 16;
    const h0 = y1 - y0;

    ctx.save();
    ctx.fillStyle = 'rgba(30,18,10,0.08)';
    ctx.strokeStyle = 'rgba(60,35,15,0.12)';
    ctx.lineWidth = 1;
    addRoundedRectPath(ctx, x0, y0, w0, h0, 12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    i = end;
  }

  ctx.save();
  ctx.fillStyle = '#1a0e04';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const yy = yPos[i];
    if (yy == null || yy > bottom) break;

    if (ln.type === 'blank') continue;

    if (ln.type === 'hr') {
      ctx.save();
      ctx.strokeStyle = 'rgba(60,35,15,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginL + 18, yy + 8);
      ctx.lineTo(marginR - 18, yy + 8);
      ctx.stroke();
      ctx.restore();
      continue;
    }

    if (ln.type === 'h') {
      const lvl = ln.level ?? 2;
      ctx.font = lvl === 1 ? fonts.h1 : lvl === 2 ? fonts.h2 : lvl === 3 ? fonts.h3 : fonts.h4;
      ctx.fillStyle = lvl <= 2 ? '#1a0804' : '#2a0e04';
      ctx.fillText(ln.text ?? '', marginL, yy);
      ctx.fillStyle = '#1a0e04';
      continue;
    }

    if (ln.type === 'quote') {
      ctx.save();
      ctx.strokeStyle = 'rgba(120,80,45,0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(marginL, yy - 16);
      ctx.lineTo(marginL, yy + 10);
      ctx.stroke();
      ctx.restore();

      ctx.font = fonts.quote;
      ctx.fillStyle = 'rgba(40,20,10,0.86)';
      ctx.fillText(ln.text ?? '', marginL + 18, yy);
      ctx.fillStyle = '#1a0e04';
      continue;
    }

    if (ln.type === 'code') {
      ctx.font = fonts.code;
      ctx.fillStyle = 'rgba(20,10,4,0.92)';
      ctx.fillText(ln.text ?? '', marginL + 10, yy);
      ctx.fillStyle = '#1a0e04';
      continue;
    }

    if (ln.type === 'li') {
      ctx.font = fonts.p;
      const bulletX = marginL + 6;
      const textX = marginL + 28;
      if (!ln.cont) {
        ctx.save();
        ctx.fillStyle = 'rgba(60,35,15,0.55)';
        ctx.font = '600 18px Georgia, serif';
        ctx.fillText('\u2022', bulletX, yy);
        ctx.restore();
      }
      ctx.fillText(ln.text ?? '', textX, yy);
      continue;
    }

    ctx.font = fonts.p;
    ctx.fillText(ln.text ?? '', marginL, yy);
  }

  ctx.restore();
  return tex;
}

function makePageTexture(text, pageNum, totalPages) {
  const W = 512, H = 700;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f2e8d0';
  ctx.fillRect(0, 0, W, H);

  const border = ctx.createLinearGradient(0, 0, 30, 0);
  border.addColorStop(0, 'rgba(0,0,0,0.08)');
  border.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = border;
  ctx.fillRect(0, 0, 30, H);

  ctx.strokeStyle = 'rgba(150,120,80,0.12)';
  ctx.lineWidth = 1;
  for (let y = 80; y < H - 40; y += 26) {
    ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(W - 28, y); ctx.stroke();
  }

  ctx.fillStyle = '#1a0e04';
  ctx.font = '500 18px Georgia, serif';

  const lines  = text.split('\n');
  let y        = 52;
  const lineH  = 26;
  const marginL = 36, marginR = W - 36;
  const maxW   = marginR - marginL;

  for (const rawLine of lines) {
    if (y > H - 55) break;

    if (rawLine.startsWith('### ')) {
      ctx.font = 'bold 17px Georgia, serif'; ctx.fillStyle = '#3a1a08';
      ctx.fillText(rawLine.slice(4), marginL, y);
      ctx.font = '500 18px Georgia, serif'; ctx.fillStyle = '#1a0e04';
      y += lineH + 4; continue;
    }
    if (rawLine.startsWith('## ')) {
      ctx.font = 'bold 20px Georgia, serif'; ctx.fillStyle = '#2a0e04';
      ctx.fillText(rawLine.slice(3), marginL, y);
      ctx.font = '500 18px Georgia, serif'; ctx.fillStyle = '#1a0e04';
      y += lineH + 6; continue;
    }
    if (rawLine.startsWith('# ')) {
      ctx.font = 'bold 22px Georgia, serif'; ctx.fillStyle = '#1a0804';
      ctx.fillText(rawLine.slice(2), marginL, y);
      ctx.font = '500 18px Georgia, serif'; ctx.fillStyle = '#1a0e04';
      y += lineH + 8;
      ctx.strokeStyle = 'rgba(80,40,10,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(marginL, y - 6); ctx.lineTo(marginR, y - 6); ctx.stroke();
      continue;
    }

    const displayLine = (rawLine.startsWith('- ') || rawLine.startsWith('* '))
      ? '\u2022 ' + rawLine.slice(2) : rawLine;

    const words = displayLine.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, marginL, y); y += lineH; line = word;
        if (y > H - 55) break;
      } else { line = test; }
    }
    if (line && y <= H - 55) { ctx.fillText(line, marginL, y); y += lineH; }
    if (!rawLine.trim()) y += 4;
  }

  ctx.font = 'italic 14px Georgia, serif';
  ctx.fillStyle = 'rgba(100,70,40,0.5)';
  ctx.textAlign = 'center';
  ctx.fillText(`${pageNum + 1} / ${totalPages}`, W / 2, H - 18);

  return new THREE.CanvasTexture(canvas);
}

function splitIntoPages(md) {
  if (!md) return ['No README found for this repository.'];
  const plain = md
    .replace(/```[\s\S]*?```/g, '[code block]')
    .replace(/!\[.*?\]\(.*?\)/g, '[image]')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/^#{1,6} /gm, '')
    .replace(/^\s*[-*]\s/gm, '- ')
    .replace(/\r/g, '');

  const lines = plain.split('\n');
  const chunks = [];
  let current = [], lineCount = 0;
  const LINES_PER_PAGE = 22;

  for (const line of lines) {
    const weight = line.trim() === '' ? 0.4 : (line.length > 60 ? 2 : 1);
    if (lineCount + weight > LINES_PER_PAGE && current.length) {
      chunks.push(current.join('\n')); current = []; lineCount = 0;
    }
    current.push(line); lineCount += weight;
  }
  if (current.length) chunks.push(current.join('\n'));
  return chunks.length ? chunks : ['No content.'];
}

function buildOpenBook(bookData) {
  if (pageGroup) { camera.remove(pageGroup); pageGroup = null; }
  pageGroup = new THREE.Group();
  pageGroup.position.set(0, -0.08, -0.58);
  pageGroup.rotation.set(0.18, 0, 0);
  camera.add(pageGroup);
  renderPageSpread(bookData);
}

function renderPageSpread(bookData, opts = {}) {
  const omitLeft = !!opts.omitLeft;
  const omitRight = !!opts.omitRight;
  const preserveFlipLeaf = !!opts.preserveFlipLeaf;

  for (let i = pageGroup.children.length - 1; i >= 0; i--) {
    const ch = pageGroup.children[i];
    if (preserveFlipLeaf && ch.userData && ch.userData.isFlipLeaf) continue;
    pageGroup.remove(ch);
  }

  const chunks   = pageChunks;
  const leftIdx  = currentPage;
  const rightIdx = currentPage + 1;
  const col      = langColor(bookData.repo.language);
  const coverMat = new THREE.MeshLambertMaterial({ color: col });

  const leftCover = new THREE.Mesh(new THREE.BoxGeometry(PAGE_W, PAGE_H, 0.018), coverMat);
  leftCover.position.set(-PAGE_W/2 - PAGE_GAP, 0, 0);
  pageGroup.add(leftCover);

  const rightCover = new THREE.Mesh(new THREE.BoxGeometry(PAGE_W, PAGE_H, 0.018), coverMat);
  rightCover.position.set(PAGE_W/2 + PAGE_GAP, 0, 0);
  pageGroup.add(rightCover);

  const spine = new THREE.Mesh(new THREE.BoxGeometry(PAGE_GAP * 2, PAGE_H, 0.02), coverMat);
  pageGroup.add(spine);

  const makePagePlane = (idx, xPos) => {
    const mat = idx < chunks.length
      ? new THREE.MeshLambertMaterial({ map: getPageTexture(bookData, idx), side: THREE.FrontSide })
      : new THREE.MeshLambertMaterial({ color: 0xf2e8d0 });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(PAGE_W - 0.01, PAGE_H - 0.01), mat);
    plane.position.set(xPos, 0, 0.011);
    pageGroup.add(plane);
  };

  if (!omitLeft) makePagePlane(leftIdx,  -PAGE_W/2 - PAGE_GAP);
  if (!omitRight) makePagePlane(rightIdx,  PAGE_W/2 + PAGE_GAP);

  const fd = opts.flipDir;
  if (fd === 1 || fd === -1) {
    addFlipSpreadBacking();
    if (fd === 1) {
      // FIX: show currentPage + 2 (the new right page after flip completes)
      const idx = currentPage + 2;
      addFlipUnderStack(bookData, PAGE_W / 2 + PAGE_GAP, idx >= 0 && idx < chunks.length ? idx : null);
    } else {
      // FIX: show currentPage - 1 (the new left page after flip completes)
      const idx = currentPage - 1;
      addFlipUnderStack(bookData, -PAGE_W / 2 - PAGE_GAP, idx >= 0 && idx < chunks.length ? idx : null);
    }
  }

  updatePageHUD();
}

/** Full open-book paper sheet behind both sides so gaps never show the room during a flip. */
function addFlipSpreadBacking() {
  const w = PAGE_W * 2 + PAGE_GAP * 4;
  const h = PAGE_H - 0.02;
  const mat = new THREE.MeshLambertMaterial({ color: 0xd4c4b0 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.set(0, 0, 0);
  pageGroup.add(mesh);
}

/**
 * Next (or previous) printed page plus a few cream "stack" tiers behind the turning leaf.
 * @param {number|null} texIdx  null → plain paper only on the top tier
 */
function addFlipUnderStack(bookData, xPos, texIdx) {
  const pwTop = PAGE_W + 0.02;
  const ph = PAGE_H - 0.01;
  const topMat = texIdx != null
    ? new THREE.MeshLambertMaterial({ map: getPageTexture(bookData, texIdx), side: THREE.FrontSide })
    : new THREE.MeshLambertMaterial({ color: 0xf0e6d4 });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(pwTop, ph), topMat);
  top.position.set(xPos, 0, 0.0063);
  pageGroup.add(top);

  const cream = (hex, z, scale) => {
    const m = new THREE.MeshLambertMaterial({ color: hex });
    const s = scale;
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry((PAGE_W - 0.01) * s, (PAGE_H - 0.01) * s),
      m
    );
    p.position.set(xPos, 0, z);
    pageGroup.add(p);
  };
  cream(0xe4d6c4, 0.0047, 0.99);
  cream(0xd8c8b4, 0.0033, 0.97);
  cream(0xccbcaa, 0.0020, 0.94);
}

function buildFlipLeafGroup(bookData, dir) {
  const pw = PAGE_W - 0.01;
  const ph = PAGE_H - 0.01;
  const thick = 0.004;
  const chunks = pageChunks;

  let pivotX;
  let offsetX;
  if (dir > 0) {
    const cx = PAGE_W / 2 + PAGE_GAP;
    pivotX = cx - pw / 2;
    offsetX = pw / 2;
  } else {
    const cx = -PAGE_W / 2 - PAGE_GAP;
    pivotX = cx + pw / 2;
    offsetX = -pw / 2;
  }

  let frontIdx;
  let backIdx;
  if (dir > 0) {
    frontIdx = currentPage + 1;
    backIdx = currentPage + 2;
  } else {
    frontIdx = currentPage;
    backIdx = currentPage - 1;
  }

  const cream = () => new THREE.MeshLambertMaterial({ color: 0xf2e8d0 });
  // Reuse cached CanvasTextures from getPageTexture — do not clone/dispose them or static pages break.
  const frontMat = frontIdx < chunks.length && frontIdx >= 0
    ? new THREE.MeshLambertMaterial({
        map: getPageTexture(bookData, frontIdx),
        side: THREE.FrontSide,
      })
    : cream();
  const backMat = backIdx >= 0 && backIdx < chunks.length
    ? new THREE.MeshLambertMaterial({
        map: getPageTexture(bookData, backIdx),
        side: THREE.FrontSide,
      })
    : cream();

  const edgeMat = new THREE.MeshLambertMaterial({ color: 0xe8dcc8 });
  const mats = [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, thick), mats);
  mesh.position.set(offsetX, 0, 0.014);

  const pivot = new THREE.Group();
  pivot.position.set(pivotX, 0, 0.011);
  pivot.add(mesh);
  pivot.userData.isFlipLeaf = true;
  mesh.renderOrder = 4;
  return pivot;
}

function disposeFlipLeafPivot(pivot) {
  const mesh = pivot && pivot.children[0];
  if (!mesh || !mesh.geometry) return;
  mesh.geometry.dispose();
  // Leaf front/back materials share pageTextureCache maps — never dispose those here.
  const mats = mesh.material;
  if (Array.isArray(mats) && mats[0] && !mats[0].map) mats[0].dispose();
}

function updatePageHUD() {
  const el = document.getElementById('page-counter');
  if (!el || !bookOpen) return;
  const total = pageChunks.length;
  const spread = Math.floor(currentPage / 2) + 1;
  el.textContent = `${spread} / ${Math.ceil(total / 2)}`;
  el.style.opacity = '1';
  document.getElementById('page-prev').style.opacity = currentPage > 0 ? '1' : '0.2';
  document.getElementById('page-next').style.opacity = currentPage + 2 < total ? '1' : '0.2';
}

function flipPage(dir) {
  if (flipState || !pageGroup || !openBookData) return;
  const next = currentPage + dir * 2;
  if (next < 0 || next >= pageChunks.length) return;
  if (window.AudioFX) window.AudioFX.play('page');

  renderPageSpread(openBookData, {
    omitRight: dir > 0,
    omitLeft: dir < 0,
    preserveFlipLeaf: false,
    flipDir: dir,
  });

  const leaf = buildFlipLeafGroup(openBookData, dir);
  pageGroup.add(leaf);

  flipState = { dir, t: 0, leaf };
}

function updateFlip(dt) {
  if (!flipState || !pageGroup || !flipState.leaf) return;

  flipState.t += dt / FLIP_DURATION_SEC;
  const u = Math.min(flipState.t, 1);
  const ease = u * u * (3 - 2 * u);
  const angle = ease * Math.PI;
  flipState.leaf.rotation.y = flipState.dir > 0 ? -angle : angle;

  if (flipState.t < 1) return;

  disposeFlipLeafPivot(flipState.leaf);
  pageGroup.remove(flipState.leaf);
  currentPage += flipState.dir * 2;
  renderPageSpread(openBookData);
  flipState = null;
  if (window.AudioFX) window.AudioFX.play('pageLand');
}

async function openBook(bookData) {
  if (bookData.pickupPhase !== 'held') return;
  openBookData = bookData;
  bookOpen     = true;
  if (window.AudioFX) window.AudioFX.play('open');
  pageTextureCache = new Map();
  pageChunks   = buildBookPages(bookData.repo, null, null);
  currentPage  = 0;
  bookData.mesh.visible = false;
  buildOpenBook(bookData);
  showPageHUD(true);
  Promise.all([
    fetchReadme(bookData.repo),
    typeof fetchRepoExtraInfo === 'function' ? fetchRepoExtraInfo(bookData.repo) : Promise.resolve(null),
  ]).then(([text, extra]) => {
    pageTextureCache = new Map();
    pageChunks  = buildBookPages(bookData.repo, text, extra);
    currentPage = 0;
    renderPageSpread(bookData);
  });
  document.exitPointerLock();
}

function closeBook() {
  if (!bookOpen) return;
  bookOpen = false;
  if (window.AudioFX) window.AudioFX.play('close');
  if (pageGroup) {
    if (flipState && flipState.leaf) disposeFlipLeafPivot(flipState.leaf);
    camera.remove(pageGroup);
    pageGroup = null;
  }
  if (openBookData) openBookData.mesh.visible = true;
  openBookData = null; flipState = null;
  showPageHUD(false);
  renderer.domElement.requestPointerLock();
}

function showPageHUD(on) {
  const el = document.getElementById('page-hud');
  if (el) el.style.opacity = on ? '1' : '0';
  if (!on) { const c = document.getElementById('page-counter'); if (c) c.style.opacity = '0'; }
}

function updateDeskProximity() {
  if (bookOpen) return;

  if (heldCassette && heldCassette.pickupPhase === 'held' && !heldCassette.inUse) {
    const comp = typeof findNearestComputer === 'function' ? findNearestComputer(yawObj.position) : null;
    if (comp) {
      if (deskPromptTextEl) deskPromptTextEl.innerHTML = 'Press <strong>E</strong> to play website';
      deskPromptEl.classList.add('visible');
      return;
    }
  }

  const dist = yawObj.position.distanceTo(DESK_POS);
  if (dist < DESK_INTERACT_DISTANCE && heldBook && heldBook.pickupPhase === 'held') {
    if (deskPromptTextEl) deskPromptTextEl.innerHTML = 'Press <strong>E</strong> to open repository';
    deskPromptEl.classList.add('visible');
  } else {
    deskPromptEl.classList.remove('visible');
  }
}

// ─────────────────────────────────────────────────────
// PLAYER MOVEMENT
// ─────────────────────────────────────────────────────

const moveDir = new THREE.Vector3();
const clock   = new THREE.Clock();

function updateMovement(dt) {
  if (bookOpen) {
    if (window.AudioFX) window.AudioFX.setMoving(false, 0);
    return;
  }
  moveDir.set(0, 0, 0);
  if (keys['KeyW']) moveDir.z -= 1;
  if (keys['KeyS']) moveDir.z += 1;
  if (keys['KeyA']) moveDir.x -= 1;
  if (keys['KeyD']) moveDir.x += 1;
  if (window.AudioFX) window.AudioFX.setMoving(moveDir.length() > 0 && pointerLocked && !EDIT_MODE, 1);

  if (EDIT_MODE) {
    if (moveDir.length() > 0) {
      moveDir.normalize().applyEuler(new THREE.Euler(0, yawObj.rotation.y, 0));
      const next = yawObj.position.clone().addScaledVector(moveDir, PLAYER_SPEED * dt);
      next.x = Math.max(-ROOM_W/2 + 0.5, Math.min(ROOM_W/2 - 0.5, next.x));
      next.z = Math.max(-ROOM_D/2 + 0.5, Math.min(ROOM_D/2 - 0.5, next.z));
      yawObj.position.x = next.x;
      yawObj.position.z = next.z;
    }
    if (keys['Space']) yawObj.position.y += PLAYER_SPEED * dt;
    if (keys['ShiftLeft'] || keys['ShiftRight']) yawObj.position.y -= PLAYER_SPEED * dt;
    yawObj.position.y = Math.max(0.35, Math.min(ROOM_H - 0.2, yawObj.position.y));
    return;
  }

  if (moveDir.length() === 0) return;
  moveDir.normalize().applyEuler(new THREE.Euler(0, yawObj.rotation.y, 0));

  const next = yawObj.position.clone().addScaledVector(moveDir, PLAYER_SPEED * dt);
  next.x = Math.max(-ROOM_W/2 + 0.5, Math.min(ROOM_W/2 - 0.5, next.x));
  next.z = Math.max(-ROOM_D/2 + 0.5, Math.min(ROOM_D/2 - 0.5, next.z));
  next.y = PLAYER_HEIGHT;
  yawObj.position.copy(next);
}

// ─────────────────────────────────────────────────────
