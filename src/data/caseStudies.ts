export interface CaseStudyScreenshot {
  src: string;
  alt: string;
  caption: string;
}

export interface CaseStudy {
  id: string;
  repository: string;
  title: string;
  tagline: string;
  summary: string;
  role: string;
  status: string;
  stack: string[];
  highlights: string[];
  technical: Array<{ title: string; detail: string }>;
  challenges: Array<{ title: string; detail: string }>;
  results: string[];
  liveUrl?: string;
  repositoryUrl: string;
  screenshots?: CaseStudyScreenshot[];
  accent: string;
}

export const caseStudies: CaseStudy[] = [
  {
    id: 'springfield-shelf',
    repository: 'Simpsons-Episode-Archive',
    title: 'Springfield Shelf',
    tagline: 'A polished, local-first media library for an authorised episode collection.',
    summary: 'Springfield Shelf turns a configured Internet Archive item into a responsive streaming-style library, with robust episode discovery, viewing history and an accessible custom player.',
    role: 'Independent designer and developer',
    status: 'Live deployment',
    stack: ['TypeScript', 'React', 'Vite', 'Archive.org API', 'HTML5 Video', 'Local storage'],
    highlights: [
      'Search, sorting, season navigation and viewing-status filters.',
      'Custom player controls with keyboard shortcuts, Picture-in-Picture and resume support.',
      'Resilient episode parsing and automatic playback-source failover.',
    ],
    technical: [
      { title: 'Resilient media discovery', detail: 'Parses several season-and-episode filename conventions, filters duplicates and retains an Unsorted area instead of silently losing unknown files.' },
      { title: 'Reliable playback', detail: 'Uses stable Archive.org download URLs, validates the configured item and falls back between compatible media sources when necessary.' },
      { title: 'Local-first experience', detail: 'Caches library metadata and stores versioned progress locally, including continue-watching and completion state.' },
    ],
    challenges: [
      { title: 'Inconsistent source filenames', detail: 'Handled multiple naming conventions while keeping uncertain files visible for manual review.' },
      { title: 'Static-site routing', detail: 'Combined hash-based navigation with a Pages fallback so deep links remain dependable on static hosting.' },
    ],
    results: [
      'Delivered a complete browse-to-play experience without requiring a bespoke backend.',
      'Added lazy loading, debounced search and direct range-compatible playback for a responsive interface.',
      'Kept authorisation and legal-use safeguards explicit in both configuration and interface behaviour.',
    ],
    liveUrl: 'https://alistairbishop06.github.io/Simpsons-Episode-Archive',
    repositoryUrl: 'https://github.com/AlistairBishop06/Simpsons-Episode-Archive',
    accent: '#f1c40f',
  },
  {
    id: 'ranked-video-generator',
    repository: 'YoutubeShort-Ranked-Video-Maker',
    title: 'Ranked Video Generator',
    tagline: 'An end-to-end production workflow for vertical ranking and narrated story videos.',
    summary: 'This Next.js application combines idea generation, clip selection, rendering, captions, publishing copy and optional upload scheduling in one creator-focused workflow.',
    role: 'Independent full-stack developer',
    status: 'Active project',
    stack: ['TypeScript', 'Next.js', 'FFmpeg', 'yt-dlp', 'Canvas', 'Text-to-speech', 'GitHub Actions'],
    highlights: [
      'Builds 9:16 ranking videos with hooks, overlays, progress and generated sound cues.',
      'Creates narrated story videos with timed captions and reusable background footage.',
      'Supports scheduled automation and optional YouTube uploads.',
    ],
    technical: [
      { title: 'Two rendering pipelines', detail: 'Uses FFmpeg for ranked clips and browser-native recording for narration with synchronised word-timed captions.' },
      { title: 'Workflow automation', detail: 'Connects content discovery, temporary downloads, rendering, metadata generation and publishing schedules.' },
      { title: 'Failure-aware integrations', detail: 'Provides manual fallbacks for external services such as Reddit feeds, text-to-speech and hosted video imports.' },
    ],
    challenges: [
      { title: 'Media processing', detail: 'Coordinates source audio, multiple aspect ratios, hook timing, rank reveals and cleanup of temporary files.' },
      { title: 'Hosted-service constraints', detail: 'Balances browser capabilities and server-side tooling while keeping the local workflow usable when integrations are unavailable.' },
    ],
    results: [
      'Reduced a multi-tool editing process to a guided browser workflow.',
      'Supports both ranked-clip and narrated-story formats from the same application.',
      'Produces downloadable media plus titles, descriptions and hashtags ready for publishing.',
    ],
    liveUrl: 'https://youtube-short-ranked-video-maker.vercel.app',
    repositoryUrl: 'https://github.com/AlistairBishop06/YoutubeShort-Ranked-Video-Maker',
    accent: '#e62117',
  },
  {
    id: 'chaos-chess',
    repository: 'Chaos-Chess',
    title: 'Chaos Chess',
    tagline: 'Realtime multiplayer chess transformed by draftable rule cards and persistent progression.',
    summary: 'Chaos Chess combines an authoritative chess engine with 88 disruptive rule cards, realtime multiplayer, single-player progression, accounts, achievements and cosmetics.',
    role: 'Independent full-stack game developer',
    status: 'Live deployment',
    stack: ['JavaScript', 'Node.js', 'Socket.IO', 'Canvas', 'PostgreSQL', 'REST APIs'],
    highlights: [
      'Authoritative multiplayer with public and private lobbies, reconnects and server-side validation.',
      'A custom chess and rule engine supporting 88 instant, delayed, duration and permanent effects.',
      'Persistent profiles, ratings, history, achievements, social features and cosmetics.',
    ],
    technical: [
      { title: 'Authoritative game state', detail: 'Clients submit intentions while the server owns move legality, timers, rule resolution, private state and match results.' },
      { title: 'Composable rule lifecycle', detail: 'Separates chess rules, match state and effect timing so very different mutations can coexist without replacing the core engine.' },
      { title: 'Flexible persistence', detail: 'Supports lightweight local JSON during development and PostgreSQL for the deployed application.' },
    ],
    challenges: [
      { title: 'Rules interacting with rules', detail: 'Structured instant, delayed, duration and permanent effects around predictable lifecycle hooks.' },
      { title: 'Realtime recovery', detail: 'Added reconnect handling, socket rebinding, server-ticked deadlines and room cleanup for interrupted sessions.' },
    ],
    results: [
      'Built a playable full-stack game rather than a frontend-only chess demonstration.',
      'Delivered multiplayer, campaign and progression systems through one shared game engine.',
      'Created 88 rule cards alongside mini-games, hazards and alternative win conditions.',
    ],
    liveUrl: 'https://chaoschess.onrender.com/',
    repositoryUrl: 'https://github.com/AlistairBishop06/Chaos-Chess',
    accent: '#7b3fc6',
  },
  {
    id: 'procedural-world-builder',
    repository: 'World-Generator-and-Explorer',
    title: 'Procedural World Builder',
    tagline: 'Generate, sculpt and explore procedural terrain directly in the browser.',
    summary: 'An interactive terrain editor that combines seeded world generation, real-time sculpting, biome painting and first-person exploration with chunk-based Three.js rendering.',
    role: 'Independent graphics and interaction developer',
    status: 'Live deployment',
    stack: ['JavaScript', 'Three.js', 'WebGL', 'Procedural noise', 'HTML', 'CSS'],
    highlights: [
      'Seed-based height, moisture and biome generation.',
      'Real-time raise, lower, smooth, flatten and biome-painting tools.',
      'First-person exploration with dynamic terrain, objects, lighting and fog.',
    ],
    technical: [
      { title: 'Layered world generation', detail: 'Combines height and moisture fields to classify oceans, beaches, plains, forests, deserts, tundra, mountains and snow.' },
      { title: 'Direct manipulation', detail: 'Applies adjustable brushes to terrain and biome overrides with immediate visual feedback.' },
      { title: 'Scalable exploration', detail: 'Loads terrain in chunks and places environmental objects dynamically for first-person movement.' },
    ],
    challenges: [
      { title: 'Editor and explorer consistency', detail: 'Keeps map edits, biome overrides and the rendered Three.js world aligned across two interaction modes.' },
      { title: 'Browser rendering cost', detail: 'Uses chunk loading and adjustable vegetation density to balance detail with interactive performance.' },
    ],
    results: [
      'Combined generation, editing and exploration in a single browser application.',
      'Made procedural parameters understandable through immediate, visual controls.',
      'Delivered a live WebGL experience without requiring a native game-engine download.',
    ],
    liveUrl: 'https://explorableworldgenerator.vercel.app',
    repositoryUrl: 'https://github.com/AlistairBishop06/World-Generator-and-Explorer',
    accent: '#3c8d3c',
  },
];

export const caseStudyByRepository = new Map(caseStudies.map(project => [project.repository.toLowerCase(), project]));
export const caseStudyById = new Map(caseStudies.map(project => [project.id, project]));
