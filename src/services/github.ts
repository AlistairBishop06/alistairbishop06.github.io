import type { DeployedWebsite, GitHubRepo } from '../types';
import { featuredProjects } from '../data/featuredProjects';
import { fallbackProjects } from '../data/fallbackProjects';

const API = 'https://api.github.com';
const CACHE_TTL = 30 * 60 * 1000;

type Cache<T> = { timestamp: number; value: T };

function readCache<T>(key: string): Cache<T> | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null') as Cache<T> | null;
    return parsed?.value ? parsed : null;
  } catch { return null; }
}

function writeCache<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), value })); } catch { /* storage can be unavailable */ }
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
    return { repos: cached.value, cached: true, stale: false };
  }
  try {
    const repos: GitHubRepo[] = [];
    for (let page = 1; ; page += 1) {
      const response = await githubFetch(`${API}/users/${username}/repos?per_page=100&page=${page}&sort=updated`);
      const chunk = await response.json() as GitHubRepo[];
      repos.push(...chunk);
      if (chunk.length < 100) break;
    }
    writeCache(key, repos);
    return { repos, cached: false, stale: false };
  } catch (error) {
    if (cached) return { repos: cached.value, cached: true, stale: true };
    if (fallbackProjects.length) return { repos: fallbackProjects, cached: true, stale: true };
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
  const key = `xp-readme:${repo.full_name}`;
  const cached = readCache<string>(key);
  if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL * 4) return cached.value;

  try {
    // GitHub's /readme endpoint resolves common README names and casing in one
    // request, preserving the unauthenticated API budget.
    const response = await githubFetch(`${API}/repos/${repo.full_name}/readme`);
    const data = await response.json() as { content?: string; encoding?: string };
    if (data.content && data.encoding === 'base64') {
      const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, '')), char => char.charCodeAt(0));
      const content = new TextDecoder().decode(bytes);
      writeCache(key, content);
      return content;
    }
  } catch { /* handled as a friendly missing file below */ }
  throw new Error('No README file was found in this repository.');
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
