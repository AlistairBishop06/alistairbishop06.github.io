import { useEffect, useMemo, useState } from 'react';
import type { GitHubRepo } from '../../types';
import { getCaseStudyForRepository, type CaseStudy } from '../../data/caseStudies';
import { getRepositoryContext } from '../../services/github';
import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';

type ProjectTab = 'Overview' | 'Skills' | 'Technical' | 'Challenges' | 'Results' | 'Screenshots';

export function ProjectCaseStudy({ repo }: { repo?: GitHubRepo }) {
  const [project, setProject] = useState<CaseStudy | undefined>(() => repo ? getCaseStudyForRepository(repo) : undefined);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [tab, setTab] = useState<ProjectTab>('Overview');
  const { open, unlockAchievement } = useSystem();
  useEffect(() => {
    let live = true;
    setTab('Overview');
    if (!repo) {
      setProject(undefined);
      setLoadingDetails(false);
      return () => { live = false; };
    }
    const base = getCaseStudyForRepository(repo);
    setProject(base);
    setLoadingDetails(true);
    void getRepositoryContext(repo)
      .then(context => { if (live) setProject(getCaseStudyForRepository(repo, context)); })
      .catch(() => { /* Metadata-only case study remains available. */ })
      .finally(() => { if (live) setLoadingDetails(false); });
    return () => { live = false; };
  }, [repo]);
  const tabs = useMemo<ProjectTab[]>(() => [
    'Overview', 'Skills', 'Technical', 'Challenges', 'Results',
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
      {loadingDetails && <div className="project-auto-status"><div className="xp-spinner" />Reading the README and project files to build this case study...</div>}

      {tab === 'Overview' && <div className="project-overview">
        <p className="project-summary">{project.summary}</p>
        <dl className="project-facts"><dt>Role:</dt><dd>{project.role}</dd><dt>Status:</dt><dd>{project.status}</dd><dt>Repository:</dt><dd>{project.repository}</dd></dl>
        <div className="project-brief">
          <section><h2><span>1</span> The problem</h2><p>{project.problem}</p></section>
          <section><h2><span>2</span> The solution</h2><p>{project.solution}</p></section>
        </div>
        <h2>Key features</h2>
        <BulletList items={project.highlights} />
      </div>}

      {tab === 'Technical' && <div className="project-section">
        <h2>Technology</h2>
        <div className="project-stack">{project.stack.map(item => <span key={item}>{item}</span>)}</div>
        <h2>Engineering decisions</h2>
        <DetailCards items={project.technical} />
      </div>}

      {tab === 'Skills' && <div className="project-section">
        <h2>Relevant skills detected from this repository</h2>
        <p className="project-skills-intro">These links are generated from the repository’s language, description, topics, README and recognised project files.</p>
        <div className="project-skill-evidence">{project.relevantSkills.map(skill => <section key={skill.name}><div><IconGlyph name="skills" size={28} /><span><b>{skill.name}</b><small>{skill.level}</small></span></div><p>{skill.reasons.join(' · ')}</p></section>)}</div>
      </div>}

      {tab === 'Challenges' && <div className="project-section">
        <h2>Problems solved</h2>
        <DetailCards items={project.challenges} />
      </div>}

      {tab === 'Results' && <div className="project-section project-results">
        <h2>Outcome</h2>
        <BulletList items={project.results} />
        <h2>What I would improve next</h2>
        <BulletList items={project.nextSteps} />
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
