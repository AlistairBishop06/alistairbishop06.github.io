import { useEffect, useMemo, useState } from 'react';
import { allSkills, matchSkillToRepository, skillGroups } from '../../data/skills';
import { getCaseStudyForRepository } from '../../data/caseStudies';
import { useGitHubRepositories } from '../../hooks/useGitHubRepositories';
import { getRepositoryContextIndex, type RepositoryContext } from '../../services/github';
import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';

export function SkillsApp({ initialSkill }: { initialSkill?: string }) {
  const requested = allSkills.find(skill => skill.name === initialSkill) || allSkills[0];
  const [groupId, setGroupId] = useState(requested.groupId);
  const [selectedName, setSelectedName] = useState(requested.name);
  const [query, setQuery] = useState('');
  const [contexts, setContexts] = useState<Record<number, RepositoryContext>>({});
  const [indexedCount, setIndexedCount] = useState(0);
  const [indexing, setIndexing] = useState(false);
  const { open } = useSystem();
  const { repos, loading: repositoriesLoading, error: repositoriesError } = useGitHubRepositories();
  useEffect(() => {
    const skill = allSkills.find(item => item.name === initialSkill);
    if (!skill) return;
    setGroupId(skill.groupId);
    setSelectedName(skill.name);
  }, [initialSkill]);
  useEffect(() => {
    let live = true;
    let cursor = 0;
    const repositories = repos.filter(repo => !repo.fork);
    setContexts({});
    setIndexedCount(0);
    setIndexing(repositories.length > 0);
    const worker = async () => {
      while (live && cursor < repositories.length) {
        const repo = repositories[cursor++];
        const context = await getRepositoryContextIndex(repo);
        if (!live) return;
        setContexts(current => ({ ...current, [repo.id]: context }));
        setIndexedCount(count => count + 1);
      }
    };
    const workers = Array.from({ length: Math.min(5, repositories.length) }, () => worker());
    void Promise.all(workers).then(() => { if (live) setIndexing(false); });
    return () => { live = false; };
  }, [repos]);
  const visibleSkills = useMemo(() => allSkills.filter(skill => {
    const matchesGroup = groupId === 'all' || skill.groupId === groupId;
    const search = query.trim().toLowerCase();
    return matchesGroup && (!search || `${skill.name} ${skill.description} ${skill.groupName}`.toLowerCase().includes(search));
  }), [groupId, query]);
  const selected = visibleSkills.find(skill => skill.name === selectedName) || visibleSkills[0] || allSkills.find(skill => skill.name === selectedName) || allSkills[0];
  const projects = useMemo(() => repos
    .filter(repo => !repo.fork)
    .map(repo => ({ repo, reasons: matchSkillToRepository(selected, repo, contexts[repo.id]?.combinedText || '') }))
    .filter(item => item.reasons.length)
    .sort((a, b) => b.reasons.length - a.reasons.length || +new Date(b.repo.updated_at) - +new Date(a.repo.updated_at)), [contexts, repos, selected]);

  const chooseGroup = (id: string) => {
    setGroupId(id);
    const first = allSkills.find(skill => id === 'all' || skill.groupId === id);
    if (first) setSelectedName(first.name);
  };

  return <div className="skills-app app-fill">
    <header><IconGlyph name="skills" size={42} /><div><h1>Skills &amp; Technologies</h1><p>Select a capability to see how it has been applied.</p></div></header>
    <div className="skills-toolbar"><label><IconGlyph name="search" size={19} /> Find a skill <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Type to search..." /></label><span>{allSkills.length} skills installed</span></div>
    <div className="skills-layout">
      <nav aria-label="Skill categories">
        <h2>Pick a category</h2>
        <button className={groupId === 'all' ? 'active' : ''} onClick={() => chooseGroup('all')}><IconGlyph name="skills" size={28} /><span><b>All Skills</b><small>View every capability</small></span></button>
        {skillGroups.map(group => <button key={group.id} className={groupId === group.id ? 'active' : ''} onClick={() => chooseGroup(group.id)}><IconGlyph name={group.icon} size={28} /><span><b>{group.name}</b><small>{group.items.length} installed</small></span></button>)}
      </nav>

      <main>
        <div className="skills-list" role="listbox" aria-label="Portfolio skills">
          {visibleSkills.map(skill => <button key={skill.name} role="option" aria-selected={selected.name === skill.name} className={selected.name === skill.name ? 'selected' : ''} onClick={() => setSelectedName(skill.name)}><IconGlyph name="programs" size={25} /><span><b>{skill.name}</b><small>{skill.level}</small></span></button>)}
          {!visibleSkills.length && <p className="skills-empty">No installed skills match that search.</p>}
        </div>

        <article className="skill-detail">
          <div className="skill-detail-heading"><IconGlyph name={selected.groupIcon} size={46} /><div><small>{selected.groupName}</small><h2>{selected.name}</h2><span>{selected.level}</span></div></div>
          <p>{selected.description}</p>
          <h3>Evidence across all GitHub repositories</h3>
          {(repositoriesLoading || indexing) && <div className="skill-index-status"><div className="xp-spinner" /><span>{repositoriesLoading ? 'Loading repositories from GitHub...' : `Inspecting README and project context... ${indexedCount}/${repos.filter(repo => !repo.fork).length}`}</span></div>}
          {repositoriesError && <p className="skill-supporting">Live GitHub data is unavailable. Cached repositories will be used where possible.</p>}
          {projects.length ? <div className="skill-projects">{projects.map(({ repo, reasons }) => {
            const project = getCaseStudyForRepository(repo, contexts[repo.id]);
            return <button key={repo.id} onClick={() => open('project', { repo }, `${project.title} - Project Properties`)}><IconGlyph name="app" size={25} /><span><b>{project.title}</b><small>{repo.description || project.tagline}</small><em>{reasons.join(' · ')}</em></span><strong>Open ›</strong></button>;
          })}</div> : !repositoriesLoading && !indexing && <p className="skill-supporting">No repository currently advertises this skill in its language, description, topics or README. Add the relevant technology to a repository README and it will appear here automatically.</p>}
        </article>
      </main>
    </div>
  </div>;
}
