// FETCH REPOS & BUILD BOOKS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const REPO_CACHE_KEY = 'archive.repoCache.v1';
const REPO_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function pickRepoFields(r) {
  return {
    name: r?.name,
    description: r?.description ?? '',
    html_url: r?.html_url,
    homepage: r?.homepage ?? '',
    has_pages: !!r?.has_pages,
    language: r?.language ?? null,
    stargazers_count: r?.stargazers_count ?? 0,
    forks_count: r?.forks_count ?? 0,
    open_issues_count: r?.open_issues_count ?? 0,
    fork: !!r?.fork,
    pushed_at: r?.pushed_at,
    updated_at: r?.updated_at,
    default_branch: r?.default_branch,
    license: r?.license ?? null,
    size: r?.size ?? null,
  };
}

function readRepoCache() {
  try {
    const raw = localStorage.getItem(REPO_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.ts !== 'number') return null;
    if (!Array.isArray(parsed.repos)) return null;
    if (Date.now() - parsed.ts > REPO_CACHE_MAX_AGE_MS) return null;
    return parsed.repos;
  } catch (_) {
    return null;
  }
}

function writeRepoCache(repos) {
  try {
    const payload = { ts: Date.now(), repos: repos.map(pickRepoFields) };
    localStorage.setItem(REPO_CACHE_KEY, JSON.stringify(payload));
  } catch (_) {}
}

async function tryParseJson(res) {
  try { return await res.json(); } catch (_) { return null; }
}

async function fetchAndBuildBooks(progressCb) {
  let repos = [];
  let lastError = null;
  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`,
      { headers: typeof githubHeaders === 'function' ? githubHeaders() : { Accept: 'application/vnd.github+json' } }
    );

    if (res.ok) {
      repos = await res.json();
      // Include forks as well (user requested).
      repos = repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
      if (repos.length) writeRepoCache(repos);
    } else {
      const err = await tryParseJson(res);
      const msg = err?.message ? ` (${err.message})` : '';
      const remaining = res.headers.get('X-RateLimit-Remaining');
      const reset = res.headers.get('X-RateLimit-Reset');
      let rateNote = '';
      if (res.status === 403 && remaining === '0' && reset && /^\d+$/.test(reset)) {
        const resetMs = parseInt(reset, 10) * 1000;
        const mins = Math.max(1, Math.ceil((resetMs - Date.now()) / 60000));
        rateNote = ` (rate limited; resets in ~${mins}m)`;
      }
      lastError = `${res.status} ${res.statusText}${msg}${rateNote}`.trim();
      console.warn(`GitHub repos request failed: ${lastError}`);
      const cached = readRepoCache();
      if (cached && cached.length) repos = cached;
    }
  } catch (e) {
    lastError = e?.message ? e.message : String(e);
    console.warn('Could not fetch repos, using placeholder data.', e);
    const cached = readRepoCache();
    if (cached && cached.length) repos = cached;
  }

  if (!repos.length || repos.error) {
    if (typeof loadingEl !== 'undefined' && loadingEl) {
      const p = loadingEl.querySelector('.loading-text') || loadingEl.querySelector('p');
      if (p) {
        const why = lastError ? ` (${lastError})` : '';
        p.textContent = `GitHub API unavailable${why} \u2014 showing example repositories.`;
      }
    }
    repos = Array.from({ length: 12 }, (_, i) => ({
      name: `project-${i + 1}`,
      description: 'A placeholder repository.',
      html_url: 'https://github.com/' + GITHUB_USER,
      language: ['JavaScript', 'Python', 'TypeScript', 'Rust', 'HTML', null][i % 6],
      stargazers_count: 0, fork: false,
    }));
  }

  const count = Math.min(repos.length, shelfSlots.length);
  for (let i = 0; i < count; i++) {
    createBook(repos[i], i);
    progressCb(i / count);
    if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
  }
  progressCb(1);

  // Build website cassettes (only for repos with a deployed URL).
  if (typeof createCassette === 'function' && Array.isArray(cassetteShelfSlots) && cassetteShelfSlots.length) {
    const normalizeUrl = (s) => {
      if (!s || typeof s !== 'string') return '';
      const t = s.trim();
      if (!t) return '';
      if (/^https?:\/\//i.test(t)) return t;
      if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(t)) return 'https://' + t;
      return '';
    };

    const getDeployedUrl = (repo) => {
      const home = normalizeUrl(repo?.homepage);
      if (home) return home;
      if (repo?.has_pages) {
        const user = (typeof GITHUB_USER === 'string' && GITHUB_USER) ? GITHUB_USER : '';
        if (!user || !repo?.name) return '';
        const isUserPagesRepo = repo.name.toLowerCase() === `${user.toLowerCase()}.github.io`;
        return isUserPagesRepo ? `https://${user}.github.io/` : `https://${user}.github.io/${repo.name}/`;
      }
      return '';
    };

    const deployedRepos = repos
      .slice(0, count)
      .map(r => ({ repo: r, url: getDeployedUrl(r) }))
      .filter(x => !!x.url);

    const cassetteCount = Math.min(deployedRepos.length, cassetteShelfSlots.length);
    for (let i = 0; i < cassetteCount; i++) {
      createCassette(deployedRepos[i].repo, i, deployedRepos[i].url);
    }
  }

  // Some repos (commonly forks) can have a null `language` field from the repos listing.
  // Fix up by querying the languages endpoint and refreshing the book textures in-place.
  resolveMissingBookLanguages().catch(() => {});
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function pickTopLanguage(languages) {
  if (!languages || typeof languages !== 'object') return null;
  const entries = Object.entries(languages).filter(([, v]) => typeof v === 'number' && v > 0);
  if (!entries.length) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0] || null;
}

function applyBookLanguageAndRefresh(bookData, language) {
  if (!bookData?.mesh || !bookData.repo) return;
  if (!language) return;

  bookData.repo.language = language;
  if (bookData.mesh.userData?.repo) bookData.mesh.userData.repo.language = language;

  const col = langColor(language);
  const spineTex = makeBookTexture(bookData.repo);
  const coverTex = makeCoverTextureForLanguage(language);
  if (renderer?.capabilities) {
    if (spineTex) spineTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (coverTex) coverTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  const mats = bookData.mesh.material;
  if (Array.isArray(mats)) {
    // +x, -x, +y, -y, +z, -z
    if (mats[0]?.map !== undefined) { mats[0].map = coverTex; mats[0].color?.setHex?.(0xffffff); mats[0].needsUpdate = true; }
    if (mats[1]?.map !== undefined) { mats[1].map = coverTex; mats[1].color?.setHex?.(0xffffff); mats[1].needsUpdate = true; }
    if (mats[4]?.map !== undefined) { mats[4].map = spineTex; mats[4].needsUpdate = true; }
    if (mats[3]?.color) { mats[3].color.setHex(col); mats[3].needsUpdate = true; }
    if (mats[5]?.color) { mats[5].color.setHex(col); mats[5].needsUpdate = true; }
  }
}

async function resolveMissingBookLanguages() {
  if (typeof fetchRepoLanguages !== 'function') return;
  if (!Array.isArray(books) || books.length === 0) return;

  const targets = books.filter(b => !b?.repo?.language);
  if (!targets.length) return;

  const concurrency = 3;
  let idx = 0;
  const worker = async () => {
    while (idx < targets.length) {
      const i = idx++;
      const bookData = targets[i];
      try {
        const languages = await fetchRepoLanguages(bookData.repo);
        const top = pickTopLanguage(languages);
        if (top) applyBookLanguageAndRefresh(bookData, top);
      } catch (_) {}
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, targets.length) }, worker));
}
