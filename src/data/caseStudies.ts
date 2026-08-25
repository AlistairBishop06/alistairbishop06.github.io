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

export interface CaseStudyGroup {
  title: string;
  introduction?: string;
  items: string[];
}

export interface CaseStudyFact {
  label: string;
  value: string;
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
  relevantSkills: CaseStudySkill[];
  facts: CaseStudyFact[];
  overview: Array<{ title: string; detail: string }>;
  capabilities: CaseStudyGroup[];
  workflows: CaseStudyGroup[];
  architecture: CaseStudyGroup[];
  engineering: CaseStudyGroup[];
  dependencies: string[];
  scripts: Array<{ name: string; command: string }>;
  liveUrl?: string;
  repositoryUrl: string;
  screenshots?: CaseStudyScreenshot[];
  accent: string;
  generated: true;
  sourceUpdatedAt: string;
  sourceNote: string;
}

interface MarkdownSection {
  title: string;
  level: number;
  lines: string[];
  children: MarkdownSection[];
}

const languageAccents: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#c6a813', Python: '#3572a5', Java: '#b07219',
  'C#': '#178600', HTML: '#e34c26', CSS: '#563d7c', C: '#555', 'C++': '#f34b7d',
  Rust: '#9a4f24', Go: '#00add8', PHP: '#4f5d95', Ruby: '#701516',
};

const emptyContext: RepositoryContext = { readme: '', files: {}, combinedText: '' };

const capabilityHeadings = /feature|capabilit|what (?:it|this) does|functionality|highlights?|why .*stands out|gameplay|core systems?|filtering|auto-run/i;
const workflowHeadings = /workflow|usage|how (?:it|this) works|getting started|quick start|run (?:the app|locally)|controls?|mode$|schedul|upload/i;
const architectureHeadings = /architecture|project structure|directory structure|code structure|technology|tech stack|implementation|backend api|realtime socket api|github actions/i;
const engineeringHeadings = /security|privacy|test|deploy|performance|configuration|environment|troubleshoot|accessibility|legal|data|storage|caching|metadata|limitations?|browser support|content security|schedul|upload/i;

export function repositoryDisplayName(name: string) {
  return name
    .replace(/\u2014/g, '-')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
    .replace(/\bApi\b/g, 'API')
    .replace(/\bUi\b/g, 'UI')
    .replace(/\bUrl\b/g, 'URL');
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
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`*_>#|~]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([([])\s+/g, '$1')
    .trim();
}

function sentence(value: string, maximum = 560) {
  const clean = plainText(value);
  if (clean.length <= maximum) return clean;
  const shortened = clean.slice(0, maximum);
  const boundary = Math.max(shortened.lastIndexOf('. '), shortened.lastIndexOf('; '), shortened.lastIndexOf(', '));
  return `${shortened.slice(0, boundary > maximum * .6 ? boundary + 1 : maximum).trim()}...`;
}

function parseReadme(readme: string) {
  const source = readme.replace(/<!--[^]*?-->/g, '');
  const lines = source.split(/\r?\n/);
  const preamble: string[] = [];
  const sections: MarkdownSection[] = [];
  let parent: MarkdownSection | undefined;
  let current: MarkdownSection | undefined;
  let inCode = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      (current?.lines || parent?.lines || preamble).push(line);
      continue;
    }
    const heading = !inCode ? line.match(/^\s*(#{2,4})\s+(.+?)\s*#*\s*$/) : null;
    if (heading) {
      const section: MarkdownSection = { title: plainText(heading[2]), level: heading[1].length, lines: [], children: [] };
      if (section.level === 2 || !parent) {
        sections.push(section);
        parent = section;
      } else {
        parent.children.push(section);
      }
      current = section;
      continue;
    }
    (current?.lines || preamble).push(line);
  }
  return { preamble, sections };
}

function withoutCode(lines: string[]) {
  let inCode = false;
  return lines.filter(line => {
    if (/^\s*```/.test(line)) { inCode = !inCode; return false; }
    return !inCode;
  });
}

function paragraphs(lines: string[]) {
  const values: string[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    const value = sentence(paragraph.join(' '));
    if (value.length >= 28 && !/^https?:\/\//i.test(value)) values.push(value);
    paragraph = [];
  };
  for (const line of withoutCode(lines)) {
    if (!line.trim()) { flush(); continue; }
    if (/^\s*#/.test(line) || /^\s*(?:[-*+] |\d+[.)] )/.test(line) || /^\s*\|/.test(line) || /^\s*[-:| ]{3,}\s*$/.test(line) || /^\s*!\[/.test(line)) {
      flush();
      continue;
    }
    paragraph.push(line);
  }
  flush();
  return [...new Set(values)];
}

function listItems(lines: string[], limit = 10) {
  const items: string[] = [];
  for (const line of withoutCode(lines)) {
    const match = line.match(/^\s*(?:[-*+] |\d+[.)]\s+)(?:\[[ xX]\]\s*)?(.+)$/);
    if (!match) continue;
    const value = sentence(match[1], 320).replace(/[.;\s]+$/, '');
    if (value.length >= 3 && !items.some(item => item.toLowerCase() === value.toLowerCase())) items.push(value);
  }
  return items.slice(0, limit);
}

function tableItems(lines: string[], limit = 8) {
  const rows = lines.filter(line => /^\s*\|.+\|\s*$/.test(line));
  if (rows.length < 3) return [];
  const cells = rows.map(row => row.split('|').slice(1, -1).map(plainText));
  return cells.slice(2).map(row => row.filter(Boolean).join(' - ')).filter(value => value.length > 4).slice(0, limit);
}

function codeBlocks(lines: string[]) {
  const blocks: string[][] = [];
  let active: string[] | undefined;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      if (active) { blocks.push(active); active = undefined; } else active = [];
      continue;
    }
    if (active) active.push(line);
  }
  return blocks;
}

function sectionIntroduction(section: MarkdownSection) {
  return paragraphs(section.lines)[0];
}

function sectionItems(section: MarkdownSection, limit = 10) {
  return [...listItems(section.lines, limit), ...tableItems(section.lines, limit)]
    .filter((item, index, all) => all.findIndex(candidate => candidate.toLowerCase() === item.toLowerCase()) === index)
    .slice(0, limit);
}

function sectionToGroups(section: MarkdownSection, fallbackTitle?: string): CaseStudyGroup[] {
  const groups: CaseStudyGroup[] = [];
  const directItems = sectionItems(section);
  const introduction = sectionIntroduction(section);
  if (section.children.length > 7) {
    const childItems = section.children.map(child => {
      const detail = sectionIntroduction(child) || sectionItems(child, 2).join('. ');
      return detail ? `${child.title} - ${detail}` : child.title;
    });
    return [{ title: fallbackTitle || section.title, introduction, items: [...directItems, ...childItems].slice(0, 14) }];
  }
  if (directItems.length || introduction) {
    groups.push({ title: fallbackTitle || section.title, introduction, items: directItems });
  }
  for (const child of section.children) {
    const items = sectionItems(child);
    const childIntroduction = sectionIntroduction(child);
    if (items.length || childIntroduction) groups.push({ title: child.title, introduction: childIntroduction, items });
  }
  return groups;
}

function findSections(sections: MarkdownSection[], pattern: RegExp) {
  return sections.filter(section => pattern.test(section.title));
}

function groupsFor(sections: MarkdownSection[], pattern: RegExp, maximum: number) {
  return findSections(sections, pattern).flatMap(section => sectionToGroups(section)).slice(0, maximum);
}

function readmeTitle(readme: string) {
  const heading = readme.split(/\r?\n/).find(line => /^#\s+\S/.test(line));
  const value = heading ? plainText(heading.replace(/^#\s+/, '')) : '';
  return value.length >= 2 && value.length <= 100 ? value : undefined;
}

function readmeScreenshots(readme: string, repo: GitHubRepo): CaseStudyScreenshot[] {
  const screenshots: CaseStudyScreenshot[] = [];
  const pattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(readme)) && screenshots.length < 6) {
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

function packageDetails(context: RepositoryContext) {
  const manifest = context.files['package.json'];
  if (!manifest) return { dependencies: [] as string[], scripts: [] as Array<{ name: string; command: string }> };
  try {
    const parsed = JSON.parse(manifest) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    const dependencies = [...new Set([...Object.keys(parsed.dependencies || {}), ...Object.keys(parsed.devDependencies || {})])].slice(0, 24);
    const scripts = Object.entries(parsed.scripts || {}).slice(0, 10).map(([name, command]) => ({ name, command }));
    return { dependencies, scripts };
  } catch { return { dependencies: [], scripts: [] }; }
}

function projectStructureGroups(sections: MarkdownSection[]) {
  const groups: CaseStudyGroup[] = [];
  for (const section of findSections(sections, /project structure|directory structure|code structure/i)) {
    const items = codeBlocks(section.lines).flatMap(block => block.map(line => {
      const match = line.trim().match(/^([^\s#][^\s]*?)\s{2,}(.+)$/);
      return match ? `${match[1]} - ${plainText(match[2])}` : '';
    })).filter(Boolean).slice(0, 12);
    if (items.length) groups.push({ title: section.title, introduction: sectionIntroduction(section), items });
  }
  return groups;
}

function inferStack(repo: GitHubRepo, relevantSkills: CaseStudySkill[], dependencies: string[]) {
  const skillNames = relevantSkills.filter(skill => !['Git', 'GitHub'].includes(skill.name)).map(skill => skill.name);
  const recognisableDependencies: Record<string, string> = {
    next: 'Next.js', react: 'React', vite: 'Vite', express: 'Express', 'socket.io': 'Socket.IO',
    three: 'Three.js', prisma: 'Prisma', '@prisma/client': 'Prisma', pg: 'PostgreSQL',
    typescript: 'TypeScript', tailwindcss: 'Tailwind CSS', ffmpeg: 'FFmpeg', fluent_ffmpeg: 'FFmpeg',
    'react-router-dom': 'React Router', vitest: 'Vitest', jest: 'Jest', playwright: 'Playwright',
  };
  const dependencyLabels = dependencies.map(name => recognisableDependencies[name.toLowerCase()]).filter((value): value is string => Boolean(value));
  return [...new Set([repo.language, ...dependencyLabels, ...skillNames, ...(repo.topics || []).map(repositoryDisplayName)].filter((value): value is string => Boolean(value)))].slice(0, 14);
}

function overviewCards(parsed: ReturnType<typeof parseReadme>, repo: GitHubRepo) {
  const cards: Array<{ title: string; detail: string }> = [];
  const add = (title: string, detail?: string) => {
    if (detail && detail.length > 25 && !cards.some(card => card.title.toLowerCase() === title.toLowerCase())) cards.push({ title, detail: sentence(detail, 520) });
  };
  const overviewSection = parsed.sections.find(section => /^(overview|about|introduction|purpose)$/i.test(section.title));
  add('The project', paragraphs(parsed.preamble)[0] || (overviewSection ? sectionIntroduction(overviewSection) : undefined) || repo.description || undefined);

  const notablePatterns = [
    /why .*stands out|motivation|problem/i,
    /architecture|how (?:it|this) works/i,
    /privacy|security|legal/i,
    /performance|reliability|quality/i,
  ];
  for (const pattern of notablePatterns) {
    const section = parsed.sections.find(candidate => pattern.test(candidate.title));
    if (!section) continue;
    const detail = sectionIntroduction(section) || sectionItems(section, 3).join('. ');
    add(section.title, detail);
  }
  return cards.slice(0, 4);
}

function fallbackCapabilities(parsed: ReturnType<typeof parseReadme>) {
  const preambleItems = listItems(parsed.preamble, 12);
  if (preambleItems.length >= 2) return [{ title: 'What it does', items: preambleItems }];
  const firstRichSection = parsed.sections.find(section => sectionItems(section).length >= 3 && !workflowHeadings.test(section.title) && !engineeringHeadings.test(section.title));
  return firstRichSection ? sectionToGroups(firstRichSection) : [];
}

function fallbackWorkflow(parsed: ReturnType<typeof parseReadme>) {
  for (const section of parsed.sections) {
    const numbered = listItems(section.lines).filter(Boolean);
    if (numbered.length >= 3 && /workflow|usage|start|run|how/i.test(section.title)) return sectionToGroups(section);
  }
  return [];
}

function engineeringGroups(sections: MarkdownSection[]) {
  const groups = groupsFor(sections, engineeringHeadings, 12);
  return groups.map(group => ({ ...group, items: group.items.slice(0, 8) }));
}

export function createGeneratedCaseStudy(repo: GitHubRepo, repositoryContext: RepositoryContext = emptyContext): CaseStudy {
  const { readme, combinedText } = repositoryContext;
  const parsed = parseReadme(readme);
  const title = readmeTitle(readme) || repositoryDisplayName(repo.name);
  const liveUrl = cleanHomepage(repo.homepage);
  const introParagraphs = paragraphs(parsed.preamble);
  const description = repo.description ? sentence(repo.description) : undefined;
  const summary = introParagraphs.slice(0, 2).join(' ') || description || 'A public software project maintained by Alistair Bishop.';
  const firstSentence = summary.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  const relevantSkills = allSkills
    .map(skill => ({ name: skill.name, level: skill.level, reasons: matchSkillToRepository(skill, repo, combinedText) }))
    .filter(skill => skill.reasons.length);
  const { dependencies, scripts } = packageDetails(repositoryContext);
  const stack = inferStack(repo, relevantSkills, dependencies);
  const screenshots = readmeScreenshots(readme, repo);
  const openingCapabilities = listItems(parsed.preamble, 12);
  const detectedCapabilities = groupsFor(parsed.sections, capabilityHeadings, 10);
  const capabilities = openingCapabilities.length >= 2
    ? [{ title: 'What it does', items: openingCapabilities }, ...detectedCapabilities].slice(0, 10)
    : detectedCapabilities.length ? detectedCapabilities : fallbackCapabilities(parsed);
  const detectedWorkflows = groupsFor(parsed.sections, workflowHeadings, 7);
  const workflows = detectedWorkflows.length ? detectedWorkflows : fallbackWorkflow(parsed);
  const architecture = [
    ...projectStructureGroups(parsed.sections),
    ...groupsFor(parsed.sections, architectureHeadings, 8).filter(group => !/project structure|directory structure|code structure/i.test(group.title)),
  ].slice(0, 9);
  const engineering = engineeringGroups(parsed.sections);
  const facts: CaseStudyFact[] = [
    { label: 'Role', value: repo.fork ? 'Fork maintainer / contributor' : 'Creator & developer' },
    { label: 'Project state', value: liveUrl ? 'Deployed & publicly accessible' : 'Source available on GitHub' },
    ...(repo.language ? [{ label: 'Primary language', value: repo.language }] : []),
    { label: 'Last updated', value: new Date(repo.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) },
  ];
  const sourceParts = [
    readme ? `${parsed.sections.length} README sections` : 'GitHub metadata',
    Object.keys(repositoryContext.files).length ? Object.keys(repositoryContext.files).join(', ') : '',
  ].filter(Boolean);

  return {
    id: `github-${repo.id}`,
    repository: repo.name,
    title,
    tagline: description || firstSentence || `${repo.language || 'Software'} project from ${repo.full_name}.`,
    summary: sentence(summary, 900),
    role: repo.fork ? 'Fork maintainer / contributor' : 'Creator & developer',
    status: liveUrl ? 'Live' : 'Open source',
    stack: stack.length ? stack : ['See repository'],
    relevantSkills,
    facts,
    overview: overviewCards(parsed, repo),
    capabilities,
    workflows,
    architecture,
    engineering,
    dependencies,
    scripts,
    liveUrl,
    repositoryUrl: repo.html_url,
    accent: languageAccents[repo.language || ''] || '#3d6ea8',
    screenshots: screenshots.length ? screenshots : undefined,
    generated: true,
    sourceUpdatedAt: repo.updated_at,
    sourceNote: readme
      ? `Built from ${sourceParts.join(' and ')}. Every claim shown here is traceable to the repository.`
      : 'README content is unavailable, so this view currently uses verified GitHub metadata only.',
  };
}

export const getCaseStudyForRepository = createGeneratedCaseStudy;
