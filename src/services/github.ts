import type { DeployedWebsite, GitHubRepo } from '../types';
import { featuredProjects } from '../data/featuredProjects';
import { fallbackProjects } from '../data/fallbackProjects';

const API = 'https://api.github.com';
const CACHE_TTL = 30 * 60 * 1000;

type Cache<T> = { timestamp: number; value: T };

export interface RepositoryContext {
  readme: string;
  files: Record<string, string>;
  combinedText: string;
}

function readCache<T>(key: string): Cache<T> | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null') as Cache<T> | null;
    return parsed?.value ? parsed : null;
  } catch { return null; }
}

function writeCache<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), value })); } catch { /* storage can be unavailable */ }
}

function normaliseRepositories(repositories: GitHubRepo[]) {
  return repositories.map(repo => ({ ...repo, description: repo.description?.replace(/\u2014/g, '-') || null }));
}

async function githubFetch(url: string): Promise<Response> {
  const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!response.ok) {
    const reset = response.headers.get('x-ratelimit-reset');
    const detail = response.status === 403 && reset
      ? `GitHub rate limit reached. It resets at ${new Date(Number(reset) * 1000).toLocaleTimeString()}.`
      : `GitHub returned ${response.status}.`;
    throw new Error(detail);
  }
  return response;
}

export async function getAllRepositories(username: string, force = false): Promise<{ repos: GitHubRepo[]; cached: boolean; stale: boolean }> {
  const key = `xp-github-repos:${username}`;
  const cached = readCache<GitHubRepo[]>(key);
  if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { repos: normaliseRepositories(cached.value), cached: true, stale: false };
  }
  try {
    const repos: GitHubRepo[] = [];
    for (let page = 1; ; page += 1) {
      const response = await githubFetch(`${API}/users/${username}/repos?per_page=100&page=${page}&sort=updated`);
      const chunk = await response.json() as GitHubRepo[];
      repos.push(...chunk);
      if (chunk.length < 100) break;
    }
    const normalised = normaliseRepositories(repos);
    writeCache(key, normalised);
    return { repos: normalised, cached: false, stale: false };
  } catch (error) {
    if (cached) return { repos: normaliseRepositories(cached.value), cached: true, stale: true };
    if (fallbackProjects.length) return { repos: normaliseRepositories(fallbackProjects), cached: true, stale: true };
    throw error;
  }
}

export function sortRepositories(repos: GitHubRepo[], includeForks: boolean) {
  const featured = new Map(featuredProjects.map((name, index) => [name.toLowerCase(), index]));
  return repos
    .filter(repo => includeForks || !repo.fork)
    .sort((a, b) => {
      const af = featured.get(a.name.toLowerCase());
      const bf = featured.get(b.name.toLowerCase());
      if (af !== undefined || bf !== undefined) return (af ?? 999) - (bf ?? 999);
      const recent = +new Date(b.updated_at) - +new Date(a.updated_at);
      if (recent) return recent;
      if (b.stargazers_count !== a.stargazers_count) return b.stargazers_count - a.stargazers_count;
      return a.name.localeCompare(b.name);
    });
}

export async function getRepositoryReadme(repo: GitHubRepo, force = false): Promise<string> {
  const key = `xp-readme:${repo.full_name}:${repo.updated_at}`;
  const cached = readCache<string>(key);
  if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL * 4) return cached.value;
  const indexKey = `xp-readme-index:${repo.full_name}:${repo.default_branch}:${repo.updated_at}`;
  const indexed = readCache<string>(indexKey);
  if (!force && indexed && indexed.value.trim() && Date.now() - indexed.timestamp < CACHE_TTL * 24) return indexed.value;

  try {
    // GitHub's /readme endpoint resolves common README names and casing in one
    // request, preserving the unauthenticated API budget.
    const response = await githubFetch(`${API}/repos/${repo.full_name}/readme`);
    const data = await response.json() as { content?: string; encoding?: string };
    if (data.content && data.encoding === 'base64') {
      const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, '')), char => char.charCodeAt(0));
      const content = new TextDecoder().decode(bytes);
      writeCache(key, content);
      writeCache(indexKey, content);
      return content;
    }
  } catch { /* handled as a friendly missing file below */ }
  throw new Error('No README file was found in this repository.');
}

export async function getRepositoryReadmeIndex(repo: GitHubRepo): Promise<string> {
  const key = `xp-readme-index:${repo.full_name}:${repo.default_branch}:${repo.updated_at}`;
  const cached = readCache<string>(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL * 24) return cached.value.trim();
  const repositoryPath = repo.full_name.split('/').map(encodeURIComponent).join('/');
  const branch = encodeURIComponent(repo.default_branch || 'main');
  try {
    const response = await fetch(`https://raw.githubusercontent.com/${repositoryPath}/${branch}/README.md`);
    const content = response.ok ? (await response.text()).slice(0, 200_000) : '';
    writeCache(key, content || ' ');
    return content;
  } catch {
    writeCache(key, ' ');
    return '';
  }
}

async function getRawRepositoryFile(repo: GitHubRepo, path: string): Promise<string> {
  const key = `xp-repo-context:${repo.full_name}:${repo.default_branch}:${repo.updated_at}:${path}`;
  const cached = readCache<string>(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL * 24) return cached.value.trim();
  const repositoryPath = repo.full_name.split('/').map(encodeURIComponent).join('/');
  const branch = encodeURIComponent(repo.default_branch || 'main');
  const filePath = path.split('/').map(encodeURIComponent).join('/');
  try {
    const response = await fetch(`https://raw.githubusercontent.com/${repositoryPath}/${branch}/${filePath}`);
    const content = response.ok ? (await response.text()).slice(0, 120_000) : '';
    writeCache(key, content || ' ');
    return content;
  } catch {
    writeCache(key, ' ');
    return '';
  }
}

function contextFileCandidates(repo: GitHubRepo, readme: string) {
  const language = repo.language?.toLowerCase();
  const files: string[] = [];
  if (['typescript', 'javascript', 'html', 'css'].includes(language || '')) files.push('package.json');
  if (language === 'python') files.push('pyproject.toml', 'requirements.txt');
  if (language === 'java') files.push('pom.xml', 'build.gradle');
  if (language === 'c#') files.push('ProjectSettings/ProjectVersion.txt', `${repo.name}.csproj`);
  if (language === 'c' || language === 'c++') files.push('CMakeLists.txt');
  if (language === 'rust') files.push('Cargo.toml');
  if (language === 'go') files.push('go.mod');
  if (language === 'php') files.push('composer.json');
  if (language === 'ruby') files.push('Gemfile');
  if (/\bdocker(file| compose)?\b/i.test(readme)) files.push('Dockerfile', 'docker-compose.yml');
  return [...new Set(files)];
}

function assembleRepositoryContext(readme: string, files: Record<string, string>): RepositoryContext {
  const fileText = Object.entries(files).map(([name, content]) => `\n[${name}]\n${content}`).join('');
  return { readme, files, combinedText: `[README]\n${readme}${fileText}` };
}

export async function getRepositoryContextIndex(repo: GitHubRepo): Promise<RepositoryContext> {
  const readme = await getRepositoryReadmeIndex(repo);
  const entries = await Promise.all(contextFileCandidates(repo, readme).map(async path => [path, await getRawRepositoryFile(repo, path)] as const));
  const files = Object.fromEntries(entries.filter(([, content]) => content.trim()));
  return assembleRepositoryContext(readme, files);
}

export async function getRepositoryContext(repo: GitHubRepo): Promise<RepositoryContext> {
  const indexed = await getRepositoryContextIndex(repo);
  if (indexed.readme.trim()) return indexed;
  try {
    const readme = await getRepositoryReadme(repo);
    return assembleRepositoryContext(readme, indexed.files);
  } catch {
    return indexed;
  }
}

export function normaliseWebsiteUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (['github.com', 'www.github.com', 'api.github.com'].includes(url.hostname.toLowerCase())) return null;
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.replace(/\/+$/, '') || '/';
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export async function discoverDeployedWebsites(repos: GitHubRepo[]): Promise<DeployedWebsite[]> {
  const found = new Map<string, DeployedWebsite>();
  for (const repo of repos) {
    if (repo.fork || !repo.homepage) continue;
    const url = normaliseWebsiteUrl(repo.homepage);
    if (!url) continue;
    const urlKey = url.toLowerCase();
    if (!found.has(urlKey)) {
      found.set(urlKey, {
        name: repo.name,
        url,
        description: repo.description ?? undefined,
        repository: repo.html_url,
      });
    }
  }
  return [...found.values()];
}
