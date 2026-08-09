import type { GitHubRepo, IconName } from '../types';

export type SkillLevel = 'Core skill' | 'Proficient' | 'Working knowledge';

export interface PortfolioSkill {
  name: string;
  level: SkillLevel;
  description: string;
  signals?: { languages?: string[]; keywords?: string[]; allRepositories?: boolean };
}

export interface SkillGroup {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  items: PortfolioSkill[];
}

export const skillGroups: SkillGroup[] = [
  {
    id: 'languages', name: 'Programming Languages', icon: 'programs',
    description: 'Languages used across deployed applications, coursework and technical experiments.',
    items: [
      { name: 'TypeScript', level: 'Core skill', description: 'Type-safe application architecture for modern web products.', signals: { languages: ['TypeScript'], keywords: ['typescript'] } },
      { name: 'JavaScript', level: 'Core skill', description: 'Browser, server and realtime application development.', signals: { languages: ['JavaScript'], keywords: ['javascript'] } },
      { name: 'Python', level: 'Proficient', description: 'Automation, data processing, computer vision and machine-learning experiments.', signals: { languages: ['Python'], keywords: ['python'] } },
      { name: 'Java', level: 'Proficient', description: 'Object-oriented software development, algorithms and university projects.', signals: { languages: ['Java'], keywords: ['java'] } },
      { name: 'C#', level: 'Proficient', description: 'Gameplay systems and interactive application development with Unity.', signals: { languages: ['C#'], keywords: ['c sharp', 'c#', '.net'] } },
      { name: 'SQL', level: 'Proficient', description: 'Relational data modelling and application persistence.', signals: { keywords: ['sql', 'postgresql', 'postgres', 'sqlite', 'mysql', 'database', 'prisma', 'sequelize', 'typeorm', '"pg"'] } },
    ],
  },
  {
    id: 'web', name: 'Web Development', icon: 'globe',
    description: 'Frontend and backend technologies used to take applications from prototype to deployment.',
    items: [
      { name: 'React', level: 'Core skill', description: 'Component-driven interfaces, state management and accessible interaction design.', signals: { keywords: ['react', 'next.js', 'nextjs'] } },
      { name: 'Node.js', level: 'Core skill', description: 'APIs, media workflows and authoritative realtime servers.', signals: { keywords: ['node.js', 'nodejs', 'node runtime', '@types/node', '"node"', 'express', 'socket.io'] } },
      { name: 'Vite', level: 'Core skill', description: 'Fast, maintainable frontend tooling and static-site builds.', signals: { keywords: ['vite'] } },
      { name: 'HTML', level: 'Core skill', description: 'Semantic, accessible document and application structure.', signals: { languages: ['HTML'], keywords: ['html'] } },
      { name: 'CSS', level: 'Core skill', description: 'Responsive layouts, design systems and detailed interface recreation.', signals: { languages: ['CSS'], keywords: ['css', 'tailwind', 'sass', 'scss'] } },
      { name: 'REST APIs', level: 'Proficient', description: 'Designing and integrating reliable JSON and third-party service APIs.', signals: { keywords: ['rest api', 'restful', 'api endpoint', 'web api'] } },
    ],
  },
  {
    id: 'creative', name: 'Creative & Interactive', icon: 'display',
    description: 'Graphics, game development and human-computer interaction capabilities.',
    items: [
      { name: 'Unity', level: 'Proficient', description: 'Gameplay programming, scene construction and interactive prototyping.', signals: { keywords: ['unity', 'unity3d'] } },
      { name: 'Computer Vision', level: 'Proficient', description: 'Visual input, tracking and experimental human-computer interaction.', signals: { keywords: ['computer vision', 'opencv', 'gesture tracking', 'hand tracking', 'eye tracking'] } },
      { name: 'Canvas', level: 'Proficient', description: 'Custom rendering for games, captions and media composition.', signals: { keywords: ['html canvas', 'canvas api', 'canvas'] } },
      { name: 'WebGL / Three.js', level: 'Proficient', description: 'Realtime browser graphics and explorable 3D environments.', signals: { keywords: ['webgl', 'three.js', 'threejs', '"three"'] } },
    ],
  },
  {
    id: 'tools', name: 'Tools & Delivery', icon: 'control',
    description: 'Tools used to collaborate, ship software and keep development reproducible.',
    items: [
      { name: 'Git', level: 'Core skill', description: 'Version control, branching and maintainable development history.', signals: { allRepositories: true } },
      { name: 'GitHub', level: 'Core skill', description: 'Repository management, Pages deployment and automated workflows.', signals: { allRepositories: true } },
      { name: 'Linux', level: 'Proficient', description: 'Development environments, command-line workflows and server administration.', signals: { keywords: ['linux', 'ubuntu', 'bash', 'shell script'] } },
      { name: 'Docker', level: 'Working knowledge', description: 'Reproducible local environments and containerised services.', signals: { keywords: ['docker', 'dockerfile', 'containerised', 'containerized'] } },
      { name: 'Figma', level: 'Working knowledge', description: 'Interface planning, visual communication and design handoff.', signals: { keywords: ['figma'] } },
    ],
  },
];

export const allSkills = skillGroups.flatMap(group => group.items.map(skill => ({ ...skill, groupId: group.id, groupName: group.name, groupIcon: group.icon })));

function includesSignal(value: string, signal: string) {
  const escaped = signal.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i').test(value);
}

export function matchSkillToRepository(skill: PortfolioSkill, repo: GitHubRepo, contextText = '') {
  const signals = skill.signals;
  if (!signals) return [];
  if (signals.allRepositories) return ['Public GitHub repository'];
  const reasons: string[] = [];
  if (repo.language && signals.languages?.some(language => language.toLowerCase() === repo.language?.toLowerCase())) reasons.push(`Primary language: ${repo.language}`);
  const metadata = `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')}`.toLowerCase();
  const metadataMatches = signals.keywords?.filter(keyword => includesSignal(metadata, keyword)) || [];
  if (metadataMatches.length) reasons.push(`GitHub metadata: ${metadataMatches.slice(0, 2).join(', ')}`);
  const contextMatches = signals.keywords?.filter(keyword => includesSignal(contextText.toLowerCase(), keyword)) || [];
  if (contextMatches.length) reasons.push(`Repository context: ${contextMatches.slice(0, 2).join(', ')}`);
  return [...new Set(reasons)];
}
