import { useMemo, useState } from 'react';
import type { GitHubRepo } from '../../types';
import { caseStudyById, type CaseStudy } from '../../data/caseStudies';
import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';

type ProjectTab = 'Overview' | 'Technical' | 'Challenges' | 'Results' | 'Screenshots';

export function ProjectCaseStudy({ projectId, repo }: { projectId?: string; repo?: GitHubRepo }) {
  const project = projectId ? caseStudyById.get(projectId) : undefined;
  const [tab, setTab] = useState<ProjectTab>('Overview');
  const { open, unlockAchievement } = useSystem();
  const tabs = useMemo<ProjectTab[]>(() => [
    'Overview', 'Technical', 'Challenges', 'Results',
    ...(project?.screenshots?.length ? ['Screenshots' as const] : []),
  ], [project]);

  if (!project) return <div className="missing-app">This project case study could not be found.</div>;

  const openExternal = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');
  const openReadme = () => {
    unlockAchievement('readme_opened');
    if (repo) open('notepad', { repo }, `${repo.name} - Notepad`);
    else openExternal(project.repositoryUrl);
  };

  return <div className="project-properties app-fill">
    <div className="property-tabs project-tabs" role="tablist">
      {tabs.map(item => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}
    </div>
    <div className="property-page project-page">
      <ProjectHeader project={project} />

      {tab === 'Overview' && <div className="project-overview">
        <p className="project-summary">{project.summary}</p>
        <dl className="project-facts"><dt>Role:</dt><dd>{project.role}</dd><dt>Status:</dt><dd>{project.status}</dd><dt>Repository:</dt><dd>{project.repository}</dd></dl>
        <h2>Key features</h2>
        <BulletList items={project.highlights} />
      </div>}

      {tab === 'Technical' && <div className="project-section">
        <h2>Technology</h2>
        <div className="project-stack">{project.stack.map(item => <span key={item}>{item}</span>)}</div>
        <h2>Engineering decisions</h2>
        <DetailCards items={project.technical} />
      </div>}

      {tab === 'Challenges' && <div className="project-section">
        <h2>Problems solved</h2>
        <DetailCards items={project.challenges} />
      </div>}

      {tab === 'Results' && <div className="project-section project-results">
        <h2>Outcome</h2>
        <BulletList items={project.results} />
        <div className="project-result-banner"><IconGlyph name="info" size={32} /><p>This case study describes shipped functionality from the public project. More measurements can be added to the modular case-study data as they become available.</p></div>
      </div>}

      {tab === 'Screenshots' && <div className="project-gallery">
        {project.screenshots?.map(image => <figure key={image.src}><img src={image.src} alt={image.alt} /><figcaption>{image.caption}</figcaption></figure>)}
      </div>}
    </div>
    <footer className="project-actions">
      <button onClick={openReadme}><IconGlyph name="notepad" size={18} /> Read README</button>
      <span />
      {project.liveUrl && <button className="primary" onClick={() => { unlockAchievement('live_demo'); openExternal(project.liveUrl!); }}><IconGlyph name="websites" size={18} /> Launch Live Demo</button>}
      <button onClick={() => openExternal(project.repositoryUrl)}><IconGlyph name="folder" size={18} /> View Source</button>
    </footer>
  </div>;
}

function ProjectHeader({ project }: { project: CaseStudy }) {
  return <header className="project-header" style={{ borderLeftColor: project.accent }}>
    <div className="project-header-icon" style={{ background: `linear-gradient(135deg, ${project.accent}, #174c9d)` }}><IconGlyph name="app" size={45} /></div>
    <div><h1>{project.title}</h1><p>{project.tagline}</p></div>
  </header>;
}

function BulletList({ items }: { items: string[] }) {
  return <ul className="project-bullets">{items.map(item => <li key={item}>{item}</li>)}</ul>;
}

function DetailCards({ items }: { items: Array<{ title: string; detail: string }> }) {
  return <div className="project-detail-cards">{items.map(item => <section key={item.title}><h3>{item.title}</h3><p>{item.detail}</p></section>)}</div>;
}
