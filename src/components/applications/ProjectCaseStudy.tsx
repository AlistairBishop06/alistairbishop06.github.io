import { useEffect, useMemo, useState } from 'react';
import type { GitHubRepo } from '../../types';
import { getCaseStudyForRepository, type CaseStudy, type CaseStudyGroup } from '../../data/caseStudies';
import { getRepositoryContext } from '../../services/github';
import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';

type ProjectTab = 'Overview' | 'Capabilities' | 'Build' | 'Engineering' | 'Skills' | 'Gallery';

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
    setProject(getCaseStudyForRepository(repo));
    setLoadingDetails(true);
    void getRepositoryContext(repo)
      .then(context => { if (live) setProject(getCaseStudyForRepository(repo, context)); })
      .catch(() => { /* The verified metadata view remains available. */ })
      .finally(() => { if (live) setLoadingDetails(false); });
    return () => { live = false; };
  }, [repo]);

  const tabs = useMemo<ProjectTab[]>(() => {
    if (!project) return ['Overview'];
    return [
      'Overview',
      ...(project.capabilities.length ? ['Capabilities' as const] : []),
      ...(project.workflows.length || project.architecture.length || project.scripts.length ? ['Build' as const] : []),
      ...(project.engineering.length ? ['Engineering' as const] : []),
      ...(project.relevantSkills.length ? ['Skills' as const] : []),
      ...(project.screenshots?.length ? ['Gallery' as const] : []),
    ];
  }, [project]);

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
      {loadingDetails && <div className="project-auto-status"><div className="xp-spinner" /><span><b>Building the detailed project profile</b> Reading the README and manifest...</span></div>}

      {tab === 'Overview' && <div className="project-overview">
        <div className="project-lede"><small>PROJECT OVERVIEW</small><p>{project.summary}</p></div>
        <dl className="project-facts">{project.facts.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
        {project.overview.length > 0 && <>
          <SectionHeading eyebrow="01" title="The story in brief" />
          <DetailCards items={project.overview} />
        </>}
        {project.capabilities.length > 0 && <>
          <SectionHeading eyebrow="02" title="What you can do with it" />
          <div className="project-capability-preview">
            {project.capabilities.slice(0, 4).map((group, index) => <article key={`${group.title}-${index}`}>
              <span>{String(index + 1).padStart(2, '0')}</span><div><h3>{group.title}</h3><p>{group.introduction || group.items.slice(0, 2).join('. ')}</p></div>
            </article>)}
          </div>
          {project.capabilities.length > 4 && <button className="project-inline-link" onClick={() => setTab('Capabilities')}>Explore all {project.capabilities.length} capability areas →</button>}
        </>}
        <SourceNote project={project} />
      </div>}

      {tab === 'Capabilities' && <div className="project-section">
        <SectionIntro eyebrow="DOCUMENTED FEATURES" title="The product, feature by feature" text="Grouped from the README's own feature hierarchy, so each area reflects how the project was intentionally designed and documented." />
        <GroupCards groups={project.capabilities} numbered />
        <SourceNote project={project} />
      </div>}

      {tab === 'Build' && <div className="project-section">
        <SectionIntro eyebrow="UNDER THE HOOD" title="How the project comes together" text="Architecture, user flows and tooling extracted from the repository documentation and project manifest." />
        <h2>Technology palette</h2>
        <div className="project-stack">{project.stack.map(item => <span key={item}>{item}</span>)}</div>
        {project.workflows.length > 0 && <><h2>Workflows &amp; usage</h2><GroupCards groups={project.workflows} /></>}
        {project.architecture.length > 0 && <><h2>Architecture &amp; structure</h2><GroupCards groups={project.architecture} technical /></>}
        {project.scripts.length > 0 && <><h2>Useful project commands</h2><div className="project-commands">{project.scripts.map(script => <div key={script.name}><b>npm run {script.name}</b><code>{script.command}</code></div>)}</div></>}
        {project.dependencies.length > 0 && <details className="project-dependencies"><summary>Manifest packages ({project.dependencies.length})</summary><div>{project.dependencies.map(item => <code key={item}>{item}</code>)}</div></details>}
        <SourceNote project={project} />
      </div>}

      {tab === 'Engineering' && <div className="project-section">
        <SectionIntro eyebrow="DELIVERY &amp; QUALITY" title="The engineering details that matter" text="Security, privacy, testing, deployment, configuration and performance notes—shown when the README actually documents them." />
        <GroupCards groups={project.engineering} />
        <SourceNote project={project} />
      </div>}

      {tab === 'Skills' && <div className="project-section">
        <SectionIntro eyebrow="REPOSITORY EVIDENCE" title="Skills demonstrated here" text="Matches come from the primary language, repository metadata, README and recognised project files—not a hand-maintained list of claims." />
        <div className="project-skill-evidence">{project.relevantSkills.map(skill => <section key={skill.name}><div><IconGlyph name="skills" size={28} /><span><b>{skill.name}</b><small>{skill.level}</small></span></div><p>{skill.reasons.join(' · ')}</p></section>)}</div>
        <SourceNote project={project} />
      </div>}

      {tab === 'Gallery' && <div className="project-gallery">
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
    <div className="project-header-copy"><div><span className="project-status"><i />{project.status}</span><span className="project-repository">{project.repository}</span></div><h1>{project.title}</h1><p>{project.tagline}</p></div>
  </header>;
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <h2 className="project-section-heading"><span>{eyebrow}</span>{title}</h2>;
}

function SectionIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <header className="project-section-intro"><small>{eyebrow}</small><h2>{title}</h2><p>{text}</p></header>;
}

function SourceNote({ project }: { project: CaseStudy }) {
  return <aside className="project-source-note"><IconGlyph name="info" size={20} /><span>{project.sourceNote}</span></aside>;
}

function DetailCards({ items }: { items: Array<{ title: string; detail: string }> }) {
  return <div className="project-detail-cards">{items.map((item, index) => <section key={`${item.title}-${index}`}><h3>{item.title}</h3><p>{item.detail}</p></section>)}</div>;
}

function GroupCards({ groups, numbered = false, technical = false }: { groups: CaseStudyGroup[]; numbered?: boolean; technical?: boolean }) {
  return <div className={`project-group-cards${technical ? ' technical' : ''}`}>{groups.map((group, index) => <section key={`${group.title}-${index}`}>
    <header>{numbered && <span>{String(index + 1).padStart(2, '0')}</span>}<h3>{group.title}</h3></header>
    {group.introduction && <p>{group.introduction}</p>}
    {group.items.length > 0 && <ul>{group.items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}</ul>}
  </section>)}</div>;
}
