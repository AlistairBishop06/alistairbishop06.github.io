import type { ReactNode } from 'react';
import { useState } from 'react';
import { IconGlyph } from '../common/IconGlyph';
import { MenuBar, type MenuItem } from '../common/MenuBar';

export type ExplorerView = 'large' | 'small' | 'list' | 'details';

export function ExplorerShell({ title, address, children, count, view, setView, extraViewItems = [], status, onRefresh }: {
  title: string; address: string; children: ReactNode; count: number; view: ExplorerView;
  setView: (view: ExplorerView) => void; extraViewItems?: MenuItem[]; status?: string; onRefresh?: () => void;
}) {
  const [history, setHistory] = useState(0);
  const viewItems: MenuItem[] = [
    { label: 'Large Icons', checked: view === 'large', action: () => setView('large') },
    { label: 'Small Icons', checked: view === 'small', action: () => setView('small') },
    { label: 'List', checked: view === 'list', action: () => setView('list') },
    { label: 'Details', checked: view === 'details', action: () => setView('details') },
    { separator: true, label: '' }, ...extraViewItems,
  ];
  return <div className="explorer app-fill">
    <MenuBar menus={[
      { label: 'File', items: [{ label: 'Close', action: () => window.dispatchEvent(new Event('xp-close-active')) }] },
      { label: 'Edit', items: [{ label: 'Select All', action: () => undefined }, { label: 'Invert Selection', disabled: true }] },
      { label: 'View', items: viewItems },
      { label: 'Favorites', items: [{ label: 'Add to Favorites...', disabled: true }] },
      { label: 'Tools', items: [{ label: 'Folder Options...', disabled: true }] },
      { label: 'Help', items: [{ label: `About ${title}`, action: () => undefined }] },
    ]} />
    <div className="explorer-toolbar">
      <button disabled={history <= 0} onClick={() => setHistory(Math.max(0, history - 1))}><IconGlyph name="back" size={26} /><span>Back</span></button>
      <button disabled><IconGlyph name="forward" size={26} /></button>
      <button><IconGlyph name="up" size={26} /></button><i />
      <button><IconGlyph name="search" size={25} /><span>Search</span></button>
      <button><IconGlyph name="folder" size={25} /><span>Folders</span></button><i />
      <button onClick={onRefresh} aria-label="Refresh"><span className="view-grid">▦</span></button>
    </div>
    <div className="address-row"><label>Address</label><div><IconGlyph name="folder" size={18} /><span>{address}</span><button>⌄</button></div><button className="go-button"><IconGlyph name="go" size={19} /> Go</button></div>
    <div className="explorer-body">
      <aside className="explorer-sidebar">
        <section><h3>File and Folder Tasks <span>⌃</span></h3><button>Make a new folder</button><button>Publish this folder to the Web</button><button>Share this folder</button></section>
        <section><h3>Other Places <span>⌃</span></h3><button>My Documents</button><button>Shared Documents</button><button>My Computer</button><button>My Network Places</button></section>
        <section><h3>Details <span>⌃</span></h3><p>{title}<br />File Folder</p></section>
      </aside>
      <div className={`file-area view-${view}`}>{children}</div>
    </div>
    <div className="status-bar"><span>{count} object{count === 1 ? '' : 's'}</span><span>{status || 'My Computer'}</span><i /></div>
  </div>;
}
