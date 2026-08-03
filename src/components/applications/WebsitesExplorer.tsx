import { useEffect, useMemo, useState } from 'react';
import type { DeployedWebsite } from '../../types';
import { deployedWebsites } from '../../data/deployedWebsites';
import { useGitHubRepositories } from '../../hooks/useGitHubRepositories';
import { discoverDeployedWebsites, normaliseWebsiteUrl } from '../../services/github';
import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';
import { ExplorerShell, type ExplorerView } from './ExplorerShell';

export function WebsitesExplorer() {
  const { repos } = useGitHubRepositories();
  const [discovered, setDiscovered] = useState<DeployedWebsite[]>([]);
  const [view, setView] = useState<ExplorerView>('large');
  const [selected, setSelected] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const { openBrowser, play } = useSystem();
  useEffect(() => {
    if (!repos.length) return;
    let live = true;
    setProgress('Checking GitHub website links...');
    void discoverDeployedWebsites(repos)
      .then(sites => { if (live) { setDiscovered(sites); setProgress(''); } });
    return () => { live = false; };
  }, [repos]);
  const websites = useMemo(() => {
    const overridesByRepository = new Map(deployedWebsites
      .filter(site => site.repository)
      .map(site => [site.repository!.replace(/\/$/, '').toLowerCase(), site]));
    const overridesByUrl = new Map(deployedWebsites
      .map(site => [normaliseWebsiteUrl(site.url)?.toLowerCase(), site] as const)
      .filter((entry): entry is readonly [string, DeployedWebsite] => Boolean(entry[0])));
    return discovered.map(site => {
      const repositoryKey = site.repository?.replace(/\/$/, '').toLowerCase();
      const override = (repositoryKey && overridesByRepository.get(repositoryKey))
        || overridesByUrl.get(site.url.toLowerCase());
      if (!override) return site;
      return {
        ...site,
        name: override.name,
        description: override.description || site.description,
        icon: override.icon,
        featured: override.featured,
      };
    })
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.name.localeCompare(b.name));
  }, [discovered]);
  const launch = (site: DeployedWebsite) => { play('folder'); openBrowser({ title: site.name, url: site.url, description: site.description, repository: site.repository }); };
  return <ExplorerShell title="Deployed Websites" address="C:\\Documents and Settings\\Alistair\\Favorites\\Web Apps" count={websites.length} view={view} setView={setView} status={progress || 'Internet shortcuts'}>
    {websites.map(site => <button key={site.url} className={`file-item website-item ${selected === site.url ? 'selected' : ''}`} onClick={() => setSelected(site.url)} onDoubleClick={() => launch(site)} onKeyDown={event => event.key === 'Enter' && launch(site)}>
      <span className="shortcut-icon"><IconGlyph name="websites" size={view === 'large' ? 43 : 25} /><small>↗</small></span>
      <span className="file-name">{site.name}</span><span className="file-type">Internet Shortcut</span><span className="file-date">{site.featured ? 'Featured' : ''}</span><span className="file-stars" />
      <span className="file-description">{site.description || site.url}</span>
    </button>)}
    {progress && <div className="scan-progress"><div className="xp-spinner" />{progress}</div>}
  </ExplorerShell>;
}
