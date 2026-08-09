import type { GitHubRepo } from '../types';
import type { RepositoryContext } from '../services/github';
import { allSkills, matchSkillToRepository } from './skills';

export interface CaseStudyScreenshot {
  src: string;
  alt: string;
  caption: string;
}

export interface CaseStudySkill {
  name: string;
  level: string;
  reasons: string[];
}

export interface CaseStudy {
  id: string;
  repository: string;
  title: string;
  tagline: string;
  summary: string;
  problem: string;
  solution: string;
  role: string;
  status: string;
  stack: string[];
  relevantSkills: CaseStudySkill[];
  highlights: string[];
  technical: Array<{ title: string; detail: string }>;
  challenges: Array<{ title: string; detail: string }>;
  results: string[];
  nextSteps: string[];
  liveUrl?: string;
  repositoryUrl: string;
  screenshots?: CaseStudyScreenshot[];
  accent: string;
  generated: true;
  sourceUpdatedAt: string;
}

const languageAccents: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#d8bb18', Python: '#3572a5', Java: '#b07219',
  'C#': '#178600', HTML: '#e34c26', CSS: '#563d7c', C: '#555', 'C++': '#f34b7d',
};

const emptyContext: RepositoryContext = { readme: '', files: {}, combinedText: '' };

export function repositoryDisplayName(name: string) {
  return name
    .replace(/\u2014/g, '-')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
    .replace(/\bApi\b/g, 'API')
    .replace(/\bUi\b/g, 'UI');
}

function cleanHomepage(homepage: string | null) {
  if (!homepage) return undefined;
  try {
    const url = new URL(homepage);
    if (!['http:', 'https:'].includes(url.protocol) || /(^|\.)github\.com$/i.test(url.hostname)) return undefined;
    return url.toString();
  } catch { return undefined; }
}

function plainText(value: string) {
  return value
    .replace(/\u2014/g, '-')
    .replace(/<!--[^]*?-->/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#|]/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readmeIntro(readme: string) {
  const body = readme
    .replace(/<!--[^]*?-->/g, '')
    .split(/\r?\n/)
    .filter(line => !/^\s*(#|!\[|\[!\[|<img|<div|<p align|[-*]\s|```)/i.test(line))
    .join('\n');
  return body.split(/\n\s*\n/).map(plainText).find(value => value.length >= 45)?.slice(0, 520);
}

function readmeTitle(readme: string) {
  const heading = readme.split(/\r?\n/).find(line => /^#\s+\S/.test(line));
  const value = heading ? plainText(heading.replace(/^#\s+/, '')) : '';
  return value.length >= 2 && value.length <= 90 ? value : undefined;
}

function findSection(readme: string, names: string[]) {
  const lines = readme.split(/\r?\n/);
  const heading = lines.findIndex(line => {
    const match = line.match(/^#{1,4}\s+(.+?)\s*#*$/);
    return Boolean(match && names.some(name => match[1].toLowerCase().includes(name)));
  });
  if (heading < 0) return [];
  const content: string[] = [];
  for (const line of lines.slice(heading + 1)) {
    if (/^#{1,4}\s+/.test(line)) break;
    content.push(line);
  }
  return content;
}

function sectionItems(readme: string, names: string[]) {
  const items = findSection(readme, names)
    .map(line => line.match(/^\s*[-*+]\s+(.*)$/)?.[1])
    .filter((value): value is string => Boolean(value))
    .map(plainText)
    .filter(value => value.length > 12);
  return [...new Set(items)].slice(0, 4).map(value => value.slice(0, 260));
}

function sectionParagraph(readme: string, names: string[]) {
  const value = plainText(findSection(readme, names).join(' '));
  return value.length > 25 ? value.slice(0, 520) : undefined;
}

function readmeScreenshots(readme: string, repo: GitHubRepo): CaseStudyScreenshot[] {
  const screenshots: CaseStudyScreenshot[] = [];
  const pattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(readme)) && screenshots.length < 4) {
    const alt = plainText(match[1]) || 'Project screenshot';
    const source = match[2].replace(/^<|>$/g, '');
    if (/badge|shield|license|coverage|build status|logo|icon/i.test(`${alt} ${source}`)) continue;
    let src = source;
    if (!/^https?:\/\//i.test(source)) {
      const path = source.replace(/^\.\//, '').replace(/^\//, '');
      const repositoryPath = repo.full_name.split('/').map(encodeURIComponent).join('/');
      src = `https://raw.githubusercontent.com/${repositoryPath}/${encodeURIComponent(repo.default_branch || 'main')}/${path}`;
    }
    screenshots.push({ src, alt, caption: alt });
  }
  return screenshots;
}

function detectedDependencies(context: RepositoryContext) {
  const manifest = context.files['package.json'];
  if (!manifest) return [];
  try {
    const parsed = JSON.parse(manifest) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    return [...new Set([...Object.keys(parsed.dependencies || {}), ...Object.keys(parsed.devDependencies || {})])].slice(0, 12);
  } catch { return []; }
}

function generateChallenges(
  repo: GitHubRepo,
  repositoryContext: RepositoryContext,
  relevantSkills: CaseStudySkill[],
  documentedChallenges: string[],
) {
  const challenges: Array<{ title: string; detail: string }> = [];
  const context = repositoryContext.combinedText.toLowerCase();
  const skills = new Set(relevantSkills.map(skill => skill.name));
  const approach = sectionParagraph(repositoryContext.readme, ['solution', 'approach', 'architecture', 'implementation', 'how it works']);
  const add = (title: string, detail: string) => {
    if (!challenges.some(item => item.title === title)) challenges.push({ title, detail });
  };

  documentedChallenges.slice(0, 3).forEach((detail, index) => {
    const resolution = approach
      ? `I addressed this through the documented project approach: ${approach.slice(0, 280)}`
      : `I addressed this within the repository's ${repo.language || 'software'} implementation and documented project structure.`;
    add(`Documented challenge ${index + 1}`, `${detail.replace(/[.\s]+$/, '')}. ${resolution}`);
  });

  if (/socket\.io|websocket|multiplayer|real[ -]?time/.test(context)) {
    add('Synchronising real-time state', `Real-time clients can drift apart or miss important updates. I addressed this with the event-driven client and server structure detected in the repository, keeping shared state changes within one coordinated flow.`);
  }
  if (/ffmpeg|video processing|media processing|caption|audio pipeline/.test(context)) {
    add('Coordinating the media pipeline', `Media inputs, timing and generated outputs need to remain aligned across several processing stages. I addressed this with the detected media tooling and a staged workflow that keeps conversion, composition and output responsibilities separate.`);
  }
  if (skills.has('WebGL / Three.js') || /procedural (world|terrain|generation)/.test(context)) {
    add('Keeping interactive graphics responsive', `Rendering and updating an interactive scene in the browser can quickly become expensive. I addressed this with the detected WebGL or Three.js stack and a focused rendering pipeline built around the project's interactive requirements.`);
  }
  if (skills.has('Computer Vision')) {
    add('Handling variable visual input', `Computer-vision input changes with lighting, framing and movement. I addressed this through the tracking and image-processing tools documented in the repository, keeping visual interpretation separate from application behaviour.`);
  }
  if (skills.has('React')) {
    add('Structuring a growing interface', `A feature-rich interface can become difficult to reason about as state and interactions expand. I addressed this with the detected React component structure, splitting the experience into reusable interface and state boundaries.`);
  }
  if (skills.has('Node.js') || skills.has('REST APIs') || skills.has('SQL')) {
    const detected = ['Node.js', 'REST APIs', 'SQL'].filter(skill => skills.has(skill)).join(', ');
    add('Keeping service and data boundaries consistent', `Requests, application logic and persisted data need predictable boundaries. I addressed this through the repository's detected ${detected} stack, separating those responsibilities within the implementation.`);
  }
  if (Object.keys(repositoryContext.files).length > 0) {
    add('Keeping the development setup reproducible', `Dependencies and build requirements can vary between environments. I addressed this with the checked-in ${Object.keys(repositoryContext.files).join(', ')} context detected in the repository.`);
  }
  add('Keeping the implementation maintainable', `The project is built primarily with ${repo.language || 'its documented software stack'}. I addressed its technical scope by keeping the implementation, dependencies and supporting documentation together in a version-controlled repository.`);

  const contextScore = documentedChallenges.length * 2
    + relevantSkills.filter(skill => !['Git', 'GitHub'].includes(skill.name)).length
    + Object.keys(repositoryContext.files).length;
  const target = Math.min(3, Math.max(documentedChallenges.length, contextScore >= 7 ? 3 : contextScore >= 3 ? 2 : 1));
  return challenges.slice(0, target);
}

function generateOutcomes(
  repo: GitHubRepo,
  repositoryContext: RepositoryContext,
  relevantSkills: CaseStudySkill[],
  documentedOutcomes: string[],
  description: string | undefined,
  liveUrl: string | undefined,
) {
  const outcomes: string[] = [];
  const context = repositoryContext.combinedText.toLowerCase();
  const skills = new Set(relevantSkills.map(skill => skill.name));
  const add = (outcome: string) => {
    const cleanOutcome = plainText(outcome).replace(/[.\s]+$/, '');
    if (cleanOutcome && !outcomes.some(item => item.toLowerCase() === cleanOutcome.toLowerCase())) {
      outcomes.push(`${cleanOutcome}.`);
    }
  };

  documentedOutcomes.forEach(add);

  if (/socket\.io|websocket|multiplayer|real[ -]?time/.test(context)) {
    add('Built a coordinated real-time experience that keeps shared client and server interactions within one event-driven flow');
  }
  if (/ffmpeg|video processing|media processing|caption|audio pipeline/.test(context)) {
    add('Combined media input, processing and output stages into a single usable workflow');
  }
  if (skills.has('WebGL / Three.js') || /procedural (world|terrain|generation)/.test(context)) {
    add('Turned procedural or spatial data into an interactive browser experience rather than a static demonstration');
  }
  if (skills.has('Computer Vision')) {
    add('Connected visual input and tracking data to meaningful application behaviour');
  }
  if (skills.has('React')) {
    add('Delivered the interface through reusable components that can support continued feature growth');
  }
  if (skills.has('Node.js') || skills.has('REST APIs') || skills.has('SQL')) {
    const capabilities = [
      skills.has('REST APIs') ? 'API communication' : '',
      skills.has('Node.js') ? 'server-side logic' : '',
      skills.has('SQL') ? 'persistent data' : '',
    ].filter(Boolean);
    add(`Connected ${capabilities.join(', ').replace(/, ([^,]*)$/, ' and $1')} into a working application flow`);
  }
  if (liveUrl) {
    add('Made the project available as a public deployment so the finished experience can be evaluated directly');
  }
  if (description && outcomes.length < 2) {
    add(`Delivered the repository's stated goal: ${description}`);
  }
  if (outcomes.length < 2 && repo.language) {
    add(`Produced a working ${repo.language} implementation with its source, dependencies and project history kept together in version control`);
  }
  if (!outcomes.length) {
    add('Produced a working implementation that can be inspected and developed further through the public repository');
  }

  const contextScore = documentedOutcomes.length * 2
    + relevantSkills.filter(skill => !['Git', 'GitHub'].includes(skill.name)).length
    + Object.keys(repositoryContext.files).length
    + (liveUrl ? 1 : 0);
  const target = contextScore >= 7 ? 3 : contextScore >= 3 ? 2 : 1;
  return outcomes.slice(0, Math.max(Math.min(documentedOutcomes.length, 3), target));
}

function generateNextSteps(
  repo: GitHubRepo,
  repositoryContext: RepositoryContext,
  relevantSkills: CaseStudySkill[],
  documentedNextSteps: string[],
  liveUrl: string | undefined,
) {
  const nextSteps: string[] = [];
  const context = repositoryContext.combinedText.toLowerCase();
  const skills = new Set(relevantSkills.map(skill => skill.name));
  const files = new Set(Object.keys(repositoryContext.files));
  const add = (nextStep: string) => {
    const cleanNextStep = plainText(nextStep).replace(/[.\s]+$/, '');
    if (cleanNextStep && !nextSteps.some(item => item.toLowerCase() === cleanNextStep.toLowerCase())) {
      nextSteps.push(`${cleanNextStep}.`);
    }
  };

  documentedNextSteps.forEach(add);

  if (/socket\.io|websocket|multiplayer|real[ -]?time/.test(context)) {
    add('Add reconnect, recovery and concurrent-user tests to verify state stays consistent when connections fail or activity increases');
  }
  if (/ffmpeg|video processing|media processing|caption|audio pipeline/.test(context)) {
    add('Move long-running media work into resilient background jobs with progress reporting, retries and resource limits');
  }
  if (skills.has('WebGL / Three.js') || /procedural (world|terrain|generation)/.test(context)) {
    add('Profile frame time and memory use, then introduce adaptive detail, object reuse or worker-based generation where the measurements show a bottleneck');
  }
  if (skills.has('Computer Vision')) {
    add('Test a wider range of lighting, camera and movement conditions, then tune confidence thresholds and fallback behaviour around the results');
  }
  if (skills.has('React')) {
    add('Strengthen the interface with accessibility checks, interaction tests and targeted render or bundle profiling');
  }
  if (skills.has('REST APIs') || skills.has('Node.js')) {
    add('Add integration tests, request validation and structured diagnostics around the main service boundaries');
  }
  if (skills.has('SQL')) {
    add('Formalise database migrations and profile the most important queries before adding indexes, backup and recovery checks');
  }
  if (liveUrl) {
    add('Add deployment smoke tests and lightweight performance and error monitoring so regressions are visible after release');
  }
  if (files.has('Dockerfile') || files.has('docker-compose.yml') || files.has('docker-compose.yaml')) {
    add('Run the container build in CI and verify local, test and deployed environments use the same reproducible configuration');
  }
  if (!nextSteps.length && repo.language) {
    add(`Add automated tests around the core ${repo.language} workflows, then profile the paths most likely to limit reliability or performance`);
  }
  if (!nextSteps.length) {
    add('Add automated coverage for the main user journey and use the results to prioritise the next reliability and usability improvements');
  }

  const contextScore = documentedNextSteps.length * 2
    + relevantSkills.filter(skill => !['Git', 'GitHub'].includes(skill.name)).length
    + Object.keys(repositoryContext.files).length
    + (liveUrl ? 1 : 0);
  const target = contextScore >= 7 ? 3 : contextScore >= 3 ? 2 : 1;
  return nextSteps.slice(0, Math.max(Math.min(documentedNextSteps.length, 3), target));
}

export function createGeneratedCaseStudy(repo: GitHubRepo, repositoryContext: RepositoryContext = emptyContext): CaseStudy {
  const { readme, files, combinedText } = repositoryContext;
  const title = readmeTitle(readme) || repositoryDisplayName(repo.name);
  const liveUrl = cleanHomepage(repo.homepage);
  const description = repo.description ? plainText(repo.description) : undefined;
  const introduction = readmeIntro(readme);
  const topics = [...new Set(repo.topics || [])];
  const dependencies = detectedDependencies(repositoryContext);
  const relevantSkills = allSkills
    .map(skill => ({ name: skill.name, level: skill.level, reasons: matchSkillToRepository(skill, repo, combinedText) }))
    .filter(skill => skill.reasons.length);
  const skillNames = relevantSkills.filter(skill => !['Git', 'GitHub'].includes(skill.name)).map(skill => skill.name);
  const stack = [...new Set([repo.language, ...skillNames, ...topics.map(repositoryDisplayName)].filter((value): value is string => Boolean(value)))].slice(0, 12);
  const documentedFeatures = sectionItems(readme, ['feature', 'highlight', 'capabilit', 'what it does']);
  const documentedChallenges = sectionItems(readme, ['challenge', 'trade-off', 'tradeoff', 'limitation']);
  const documentedOutcomes = sectionItems(readme, ['result', 'outcome', 'impact', 'achievement']);
  const documentedNextSteps = sectionItems(readme, ['roadmap', 'next step', 'future', 'todo']);
  const screenshots = readmeScreenshots(readme, repo);
  const problem = sectionParagraph(readme, ['problem', 'motivation', 'why'])
    || (description
      ? `This project addresses the need described in its repository: ${description}`
      : 'The repository does not yet state a specific problem. Adding a Problem or Motivation section to its README will populate this section automatically.');
  const solution = sectionParagraph(readme, ['solution', 'overview', 'about'])
    || introduction
    || (description
      ? `The implementation provides ${description.charAt(0).toLowerCase()}${description.slice(1)}`
      : `${title} is a public software project whose implementation is documented by its source and repository history.`);
  const highlights = documentedFeatures.length ? documentedFeatures : [
    ...(repo.language ? [`Primarily implemented in ${repo.language}.`] : []),
    ...(skillNames.length ? [`Demonstrates ${skillNames.slice(0, 5).join(', ')}.`] : []),
    ...(topics.length ? [`Covers ${topics.slice(0, 4).map(repositoryDisplayName).join(', ')}.`] : []),
    ...(liveUrl ? ['Includes a public live deployment linked from GitHub.'] : ['Source code and project history are publicly available on GitHub.']),
  ];
  const contextFiles = Object.keys(files);
  const technical = [
    { title: 'Primary implementation', detail: repo.language ? `GitHub identifies ${repo.language} as the repository’s primary language.` : 'GitHub does not currently report a primary language for this repository.' },
    { title: 'Detected project context', detail: contextFiles.length ? `The generator inspected the README and ${contextFiles.join(', ')}.` : readme ? 'The generator inspected the repository README and GitHub metadata.' : 'Only GitHub metadata is currently available; adding a README will enrich this analysis.' },
    ...(dependencies.length ? [{ title: 'Detected dependencies', detail: dependencies.join(', ') }] : []),
    { title: 'Delivery', detail: liveUrl ? `A public deployment is available at ${liveUrl}.` : 'The source, commit history and releases are available through the public repository.' },
  ];
  const challenges = generateChallenges(repo, repositoryContext, relevantSkills, documentedChallenges);
  const results = generateOutcomes(repo, repositoryContext, relevantSkills, documentedOutcomes, description, liveUrl);
  const nextSteps = generateNextSteps(repo, repositoryContext, relevantSkills, documentedNextSteps, liveUrl);

  return {
    id: `github-${repo.id}`,
    repository: repo.name,
    title,
    tagline: description || introduction?.split(/(?<=[.!?])\s/)[0] || `${repo.language || 'Software'} project from ${repo.full_name}.`,
    summary: introduction || description || 'An automatically documented public repository maintained by Alistair Bishop.',
    problem,
    solution,
    role: repo.fork ? 'Fork maintainer / contributor' : 'Repository owner and developer',
    status: liveUrl ? 'Live deployment' : 'Public GitHub repository',
    stack: stack.length ? stack : ['See repository'],
    relevantSkills,
    highlights,
    technical,
    challenges,
    results,
    nextSteps,
    liveUrl,
    repositoryUrl: repo.html_url,
    accent: languageAccents[repo.language || ''] || '#3d6ea8',
    screenshots: screenshots.length ? screenshots : undefined,
    generated: true,
    sourceUpdatedAt: repo.updated_at,
  };
}

export const getCaseStudyForRepository = createGeneratedCaseStudy;
