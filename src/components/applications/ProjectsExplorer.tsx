import { useMemo, useState } from 'react';
import type { GitHubRepo } from '../../types';
import { useGitHubRepositories } from '../../hooks/useGitHubRepositories';
import { sortRepositories } from '../../services/github';
import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';
import { ExplorerShell, type ExplorerView } from './ExplorerShell';
import { caseStudyByRepository } from '../../data/caseStudies';

const languageColor: Record<string, string> = { TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572a5', Java: '#b07219', 'C#': '#178600', HTML: '#e34c26', CSS: '#563d7c', C: '#555' };

export function ProjectsExplorer() {
  const { repos, loading, error, source, reload } = useGitHubRepositories();
  const [includeForks, setIncludeForks] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [view, setView] = useState<ExplorerView>('large');
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState('');
  const { open, play, unlockAchievement } = useSystem();
  const visible = useMemo(() => sortRepositories(repos, includeForks).filter(repo => {
    const study = caseStudyByRepository.get(repo.name.toLowerCase());
    const matchesMode = showAll || Boolean(study);
    const query = filter.toLowerCase();
    return matchesMode && (!query || repo.name.toLowerCase().includes(query) || study?.title.toLowerCase().includes(query) || study?.tagline.toLowerCase().includes(query));
  }), [repos, includeForks, showAll, filter]);
  const openRepo = (repo: GitHubRepo) => {
    play('folder');
    const study = caseStudyByRepository.get(repo.name.toLowerCase());
    if (study) open('project', { projectId: study.id, repo }, `${study.title} - Project Properties`);
    else { unlockAchievement('readme_opened'); open('notepad', { repo }, `${repo.name} - Notepad`); }
  };
  return <ExplorerShell
    title="My Projects" address="P:\\GitHub\\Repositories" count={visible.length} view={view} setView={setView} onRefresh={reload}
    status={loading ? 'Contacting GitHub...' : `${showAll ? 'All projects' : 'Featured case studies'} · ${source === 'live' ? 'Live GitHub data' : source === 'stale' ? 'Offline cache' : 'Local cache'}`}
    extraViewItems={[{ label: 'Show all repositories', checked: showAll, action: () => { const next = !showAll; setShowAll(next); if (next) unlockAchievement('all_projects'); } }, { label: 'Show forks', checked: includeForks, action: () => setIncludeForks(value => !value) }]}
  >
    <div className="explorer-filter project-filter"><div className="project-mode" role="group" aria-label="Project view"><button className={!showAll ? 'active' : ''} onClick={() => setShowAll(false)}>Featured</button><button className={showAll ? 'active' : ''} onClick={() => { setShowAll(true); unlockAchievement('all_projects'); }}>All Projects</button></div><label>Search: <input value={filter} onChange={event => setFilter(event.target.value)} /></label></div>
    {loading && <div className="loading-state"><div className="xp-spinner" />Retrieving repositories from GitHub...</div>}
    {error && <div className="error-state"><IconGlyph name="error" size={36} /><div><b>GitHub is unavailable</b><p>{error}</p><button onClick={reload}>Retry</button></div></div>}
    {!loading && !error && view === 'details' && <div className="details-header"><span>Name</span><span>Type</span><span>Updated</span><span>Stars</span></div>}
    {!loading && visible.map(repo => {
      const study = caseStudyByRepository.get(repo.name.toLowerCase());
      return <button
      key={repo.id} className={`file-item ${selected === repo.id ? 'selected' : ''}`} onClick={() => setSelected(repo.id)} onDoubleClick={() => openRepo(repo)} onKeyDown={event => event.key === 'Enter' && openRepo(repo)}
    >
      <IconGlyph name={repo.fork ? 'document' : 'app'} size={view === 'large' ? 42 : 25} />
      <span className="file-name">{study?.title || repo.name}</span>
      <span className="file-type"><i style={{ background: languageColor[repo.language || ''] || '#777' }} />{repo.language || 'Repository'}</span>
      <span className="file-date">{new Date(repo.updated_at).toLocaleDateString()}</span>
      <span className="file-stars">★ {repo.stargazers_count}</span>
      <span className="file-description">{study?.tagline || repo.description || 'GitHub repository'}{repo.topics?.length ? ` · ${repo.topics.slice(0, 3).join(', ')}` : ''}</span>
    </button>})}
  </ExplorerShell>;
}
