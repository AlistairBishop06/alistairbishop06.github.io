import type { DeployedWebsite } from '../types';

// Manual entries are merged with deployment URLs discovered from GitHub.
export const deployedWebsites: DeployedWebsite[] = [
  {
    name: 'Springfield Shelf',
    url: 'https://alistairbishop06.github.io/Simpsons-Episode-Archive',
    description: 'A polished media-library interface for browsing Simpsons episodes.',
    repository: 'https://github.com/AlistairBishop06/Simpsons-Episode-Archive',
    featured: true,
  },
  {
    name: 'Chaos Chess',
    url: 'https://chaoschess.onrender.com/',
    description: 'A browser-based multiplayer chess variant with rule cards.',
    repository: 'https://github.com/AlistairBishop06/Chaos-Chess',
    featured: true,
  },
  {
    name: 'Explorable World Generator',
    url: 'https://explorableworldgenerator.vercel.app',
    description: 'An interactive procedural terrain editor and first-person world explorer.',
    repository: 'https://github.com/AlistairBishop06/World-Generator-and-Explorer',
    featured: true,
  },
];
