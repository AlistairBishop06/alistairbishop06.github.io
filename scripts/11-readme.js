// README FETCH
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function fetchReadme(repo) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${repo.name}/readme`,
      { headers: typeof githubHeaders === 'function' ? githubHeaders('application/vnd.github.raw') : { Accept: 'application/vnd.github.raw' } }
    );
    if (res.ok) return await res.text();
  } catch (_) {}
  return null;
}

const repoExtraCache = new Map(); // repoName -> Promise<object>

async function fetchRepoJson(url) {
  try {
    const res = await fetch(url, { headers: typeof githubHeaders === 'function' ? githubHeaders() : { Accept: 'application/vnd.github+json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

async function fetchRepoLanguages(repo) {
  return await fetchRepoJson(`https://api.github.com/repos/${GITHUB_USER}/${repo.name}/languages`);
}

async function fetchRepoCommits(repo, perPage = 12) {
  const maxCommits = (typeof MAX_COMMITS_APPENDIX === 'number' && Number.isFinite(MAX_COMMITS_APPENDIX))
    ? Math.max(1, Math.floor(MAX_COMMITS_APPENDIX))
    : 2000;

  const sha = repo.default_branch ? `&sha=${encodeURIComponent(repo.default_branch)}` : '';
  const per = 100;
  const items = [];
  let truncated = false;

  for (let page = 1; page <= 999; page++) {
    const url = `https://api.github.com/repos/${GITHUB_USER}/${repo.name}/commits?per_page=${per}&page=${page}${sha}`;
    try {
      const res = await fetch(url, { headers: typeof githubHeaders === 'function' ? githubHeaders() : { Accept: 'application/vnd.github+json' } });
      if (!res.ok) break;
      const batch = await res.json();
      if (!Array.isArray(batch) || batch.length === 0) break;
      items.push(...batch);

      if (items.length >= maxCommits) {
        items.length = maxCommits;
        truncated = true;
        break;
      }

      const link = res.headers.get('Link') || '';
      if (link && !/rel=\"next\"/.test(link)) break;
      if (!link && batch.length < per) break;
    } catch (_) {
      break;
    }
  }

  return { items, truncated };
}

async function fetchRepoTree(repo) {
  const ref = repo.default_branch ? encodeURIComponent(repo.default_branch) : 'HEAD';
  return await fetchRepoJson(
    `https://api.github.com/repos/${GITHUB_USER}/${repo.name}/git/trees/${ref}?recursive=1`
  );
}

async function fetchRepoRootContents(repo) {
  const ref = repo.default_branch ? `?ref=${encodeURIComponent(repo.default_branch)}` : '';
  return await fetchRepoJson(`https://api.github.com/repos/${GITHUB_USER}/${repo.name}/contents/${ref}`);
}

function fetchRepoExtraInfo(repo) {
  if (!repo || !repo.name) return Promise.resolve(null);
  if (repoExtraCache.has(repo.name)) return repoExtraCache.get(repo.name);

  const p = (async () => {
    const [languages, commits, tree, contents] = await Promise.all([
      fetchRepoLanguages(repo),
      fetchRepoCommits(repo),
      fetchRepoTree(repo),
      fetchRepoRootContents(repo),
    ]);

    return { languages, commits, tree, contents };
  })();

  repoExtraCache.set(repo.name, p);
  return p;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
