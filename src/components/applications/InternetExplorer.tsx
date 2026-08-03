import { useEffect, useMemo, useState } from 'react';
import type { BrowserTarget } from '../../types';
import { IconGlyph } from '../common/IconGlyph';
import { MenuBar } from '../common/MenuBar';

interface Tab extends BrowserTarget { id: string; history: string[]; historyIndex: number; loading: boolean; embed: boolean; reloadKey: number }

const home: BrowserTarget = {
  title: 'Alistair Home',
  url: 'xp://home',
  description: 'Welcome to the Internet. Where do you want to go today?',
};

const createTab = (target: BrowserTarget): Tab => ({
  ...target, id: `tab-${Date.now()}-${Math.random()}`, history: [target.url], historyIndex: 0,
  loading: false, embed: !/github\.com/i.test(target.url) && /^https?:/i.test(target.url),
  reloadKey: 0,
});

export function InternetExplorer({ initialTarget, requestId }: { initialTarget?: BrowserTarget; requestId?: number }) {
  const [tabs, setTabs] = useState<Tab[]>(() => [createTab(initialTarget || home)]);
  const [activeId, setActiveId] = useState(tabs[0].id);
  const [address, setAddress] = useState(tabs[0].url);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const active = tabs.find(tab => tab.id === activeId) || tabs[0];
  useEffect(() => setAddress(active?.url || ''), [active?.url]);
  useEffect(() => {
    if (!initialTarget || !requestId) return;
    const next = createTab(initialTarget);
    setTabs(current => [...current, next]);
    setActiveId(next.id);
  }, [requestId]); // the request id represents a new internal navigation request

  const newTab = (target: BrowserTarget = home) => { const next = createTab(target); setTabs(current => [...current, next]); setActiveId(next.id); };
  const closeTab = (id: string) => setTabs(current => {
    const remaining = current.filter(tab => tab.id !== id);
    if (!remaining.length) { const next = createTab(home); setActiveId(next.id); return [next]; }
    if (id === activeId) setActiveId(remaining[remaining.length - 1].id);
    return remaining;
  });
  const update = (values: Partial<Tab>) => setTabs(current => current.map(tab => tab.id === activeId ? { ...tab, ...values } : tab));
  const go = (raw = address) => {
    const url = /^(https?:\/\/|xp:\/\/)/i.test(raw) ? raw : `https://${raw}`;
    const history = active.history.slice(0, active.historyIndex + 1).concat(url);
    update({ url, title: url.replace(/^https?:\/\//, ''), history, historyIndex: history.length - 1, loading: /^https?:/.test(url), embed: !/github\.com/i.test(url) });
  };
  const moveHistory = (amount: number) => {
    const index = active.historyIndex + amount;
    if (index < 0 || index >= active.history.length) return;
    update({ historyIndex: index, url: active.history[index], embed: !/github\.com/i.test(active.history[index]) });
  };
  const refresh = () => update({ embed: /^https?:/.test(active.url) && !/github\.com/i.test(active.url), loading: /^https?:/.test(active.url), reloadKey: active.reloadKey + 1 });
  const menus = [
    { label: 'File', items: [{ label: 'New Tab', action: () => newTab() }, { label: 'Open in real browser', disabled: !/^https?:/.test(active.url), action: () => window.open(active.url, '_blank', 'noopener,noreferrer') }] },
    { label: 'Edit', items: [{ label: 'Copy address', action: () => void navigator.clipboard.writeText(active.url) }] },
    { label: 'View', items: [{ label: 'Refresh', action: refresh }, { label: 'Source', disabled: true }] },
    { label: 'Favorites', items: [{ label: 'GitHub', action: () => newTab({ title: 'GitHub', url: 'https://github.com/alistairbishop06' }) }] },
    { label: 'Tools', items: [{ label: 'Internet Options...', disabled: true }] }, { label: 'Help', items: [{ label: 'About Internet Explorer' }] },
  ];
  const canBack = active.historyIndex > 0;
  const canForward = active.historyIndex < active.history.length - 1;
  return <div className="ie app-fill">
    <MenuBar menus={menus} />
    <div className="ie-toolbar">
      <button disabled={!canBack} onClick={() => moveHistory(-1)}><IconGlyph name="back" size={27} /><span>Back</span></button><button disabled={!canForward} onClick={() => moveHistory(1)}><IconGlyph name="forward" size={27} /></button>
      <button onClick={() => update({ embed: false, loading: false })}><IconGlyph name="stop" size={25} /><span>Stop</span></button>
      <button onClick={refresh}><IconGlyph name="refresh" size={25} /><span>Refresh</span></button>
      <button onClick={() => go('xp://home')}><IconGlyph name="home" size={26} /><span>Home</span></button><i />
      <button onClick={() => setFavoritesOpen(value => !value)}><IconGlyph name="favorites" size={25} /><span>Favorites</span></button>
    </div>
    <div className="address-row ie-address"><label>Address</label><div><IconGlyph name="browser" size={18} /><input value={address} onChange={event => setAddress(event.target.value)} onKeyDown={event => event.key === 'Enter' && go()} /><button>⌄</button></div><button className="go-button" onClick={() => go()}><IconGlyph name="go" size={19} /> Go</button></div>
    <div className="browser-tabs" role="tablist">
      {tabs.map(tab => <button role="tab" aria-selected={tab.id === activeId} className={tab.id === activeId ? 'active' : ''} key={tab.id} onClick={() => setActiveId(tab.id)}>
        <IconGlyph name="browser" size={15} /><span>{tab.title}</span><i onClick={event => { event.stopPropagation(); closeTab(tab.id); }}>×</i>
      </button>)}
      <button className="new-tab" aria-label="New tab" onClick={() => newTab()}>＋</button>
    </div>
    <div className="browser-viewport">
      {favoritesOpen && <aside className="favorites-pane"><header>Favorites <button onClick={() => setFavoritesOpen(false)}>×</button></header><button onClick={() => newTab({ title: 'Alistair on GitHub', url: 'https://github.com/alistairbishop06' })}><IconGlyph name="favorites" size={17} /> Alistair on GitHub</button><button onClick={() => newTab(home)}><IconGlyph name="home" size={17} /> Portfolio Home</button></aside>}
      {active.url === 'xp://home' ? <BrowserHome onNavigate={newTab} /> : active.embed ? <div className="iframe-wrap">
        {active.loading && <div className="browser-loading"><div className="xp-spinner" />Opening page...</div>}
        <iframe key={`${active.id}-${active.reloadKey}`} title={active.title} src={active.url} onLoad={() => update({ loading: false })} onError={() => update({ embed: false, loading: false })} sandbox="allow-forms allow-modals allow-popups allow-scripts allow-same-origin" />
        <button className="embed-fallback" onClick={() => update({ embed: false, loading: false })}>Page blank or refused to connect?</button>
      </div> : <BrowserInfoPage tab={active} tryEmbed={() => update({ embed: true, loading: true })} />}
    </div>
    <div className="ie-status"><span><IconGlyph name="globe" size={16} /> {active.loading ? 'Opening page...' : 'Done'}</span><span>Internet</span><span className={active.loading ? 'loading-flag' : ''}>▰</span></div>
  </div>;
}

function BrowserHome({ onNavigate }: { onNavigate: (target: BrowserTarget) => void }) {
  return <div className="browser-home">
    <div className="ie-hero"><IconGlyph name="browser" size={74} /><div><h1>Welcome to Alistair's Internet</h1><p>Explore projects and live software without leaving Portfolio XP.</p></div></div>
    <h2>Pick a place to begin</h2>
    <div className="home-links">
      <button onClick={() => onNavigate({ title: 'Alistair on GitHub', url: 'https://github.com/alistairbishop06', description: 'Public repositories, source code and project history.' })}><IconGlyph name="folder" size={38} /><span><b>GitHub projects</b><small>Browse source code and README files</small></span></button>
      <button onClick={() => onNavigate({ title: 'University of Exeter', url: 'https://www.exeter.ac.uk/', description: 'University of Exeter website.' })}><IconGlyph name="globe" size={38} /><span><b>University of Exeter</b><small>Education and campus</small></span></button>
    </div>
    <p className="browser-tip"><IconGlyph name="info" size={22} /> Some modern websites prevent display inside frames. Portfolio XP detects the common case and provides a safe external-browser button.</p>
  </div>;
}

function BrowserInfoPage({ tab, tryEmbed }: { tab: Tab; tryEmbed: () => void }) {
  const language = tab.repo?.language;
  return <div className="browser-info-page">
    <div className="info-banner"><IconGlyph name="info" size={45} /><div><h1>This page is represented inside Portfolio XP</h1><p>The website may not permit embedding in another page. You can still inspect its details here or open it in your real browser.</p></div></div>
    <div className="site-preview-card">
      <div className="preview-sky"><IconGlyph name="globe" size={72} /><span>{new URL(tab.url).hostname}</span></div>
      <div className="preview-content"><h2>{tab.title}</h2><p>{tab.description || 'A project or deployed website by Alistair Bishop.'}</p>
        {tab.repo && <div className="repo-facts"><span>{language || 'Code'}</span><span>★ {tab.repo.stargazers_count}</span><span>⑂ {tab.repo.forks_count}</span><span>{tab.repo.visibility}</span></div>}
        {tab.readme && <pre className="readme-preview">{tab.readme.slice(0, 500)}{tab.readme.length > 500 ? '…' : ''}</pre>}
        <div className="browser-actions"><button onClick={tryEmbed}>Try live website</button><button className="primary" onClick={() => window.open(tab.url, '_blank', 'noopener,noreferrer')}>Open in real browser</button></div>
        {tab.repository && <button className="text-link" onClick={() => window.open(tab.repository, '_blank', 'noopener,noreferrer')}>View repository</button>}
      </div>
    </div>
  </div>;
}
