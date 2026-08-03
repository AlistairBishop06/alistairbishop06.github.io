import type { GitHubRepo } from '../types';

// A small offline snapshot keeps the Projects folder useful before the first
// successful API request. Live GitHub data replaces it whenever available.
export const fallbackProjects: GitHubRepo[] = [
  {
    id: 900001, name: 'Simpsons-Episode-Archive', full_name: 'AlistairBishop06/Simpsons-Episode-Archive',
    html_url: 'https://github.com/AlistairBishop06/Simpsons-Episode-Archive', description: 'A polished media-library interface for browsing Simpsons episodes.',
    fork: false, stargazers_count: 0, forks_count: 0, language: 'TypeScript', topics: ['react', 'media-library'], visibility: 'public',
    updated_at: '2026-08-03T14:55:11Z', homepage: 'https://alistairbishop06.github.io/Simpsons-Episode-Archive', has_pages: true, default_branch: 'main',
  },
  {
    id: 900002, name: 'YoutubeShort-Ranked-Video-Maker', full_name: 'AlistairBishop06/YoutubeShort-Ranked-Video-Maker',
    html_url: 'https://github.com/AlistairBishop06/YoutubeShort-Ranked-Video-Maker', description: 'A Next.js app for generating vertical ranking videos from TikTok links.',
    fork: false, stargazers_count: 0, forks_count: 0, language: 'TypeScript', topics: ['nextjs', 'video'], visibility: 'public',
    updated_at: '2026-08-02T20:27:49Z', homepage: 'https://youtube-short-ranked-video-maker.vercel.app', has_pages: false, default_branch: 'main',
  },
  {
    id: 900003, name: 'Chaos-Chess', full_name: 'AlistairBishop06/Chaos-Chess', html_url: 'https://github.com/AlistairBishop06/Chaos-Chess',
    description: 'Browser-based multiplayer chess variant with rule cards.', fork: false, stargazers_count: 0, forks_count: 0, language: 'JavaScript', topics: ['chess', 'multiplayer'], visibility: 'public',
    updated_at: '2026-07-01T12:00:00Z', homepage: 'https://chaoschess.onrender.com/', has_pages: false, default_branch: 'main',
  },
  {
    id: 900004, name: 'World-Generator-and-Explorer', full_name: 'AlistairBishop06/World-Generator-and-Explorer', html_url: 'https://github.com/AlistairBishop06/World-Generator-and-Explorer',
    description: 'An interactive procedural terrain editor and explorer.', fork: false, stargazers_count: 0, forks_count: 0, language: 'JavaScript', topics: ['threejs', 'procedural-generation'], visibility: 'public',
    updated_at: '2026-06-01T12:00:00Z', homepage: 'https://explorableworldgenerator.vercel.app', has_pages: false, default_branch: 'main',
  },
];
