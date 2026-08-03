import type { IconName, WindowKind } from '../../types';
import { profile } from '../../data/profile';
import { IconGlyph } from '../common/IconGlyph';
import { useSystem } from '../../context/SystemContext';

const left: Array<[string, IconName, WindowKind]> = [
  ['Internet', 'browser', 'browser'], ['E-mail', 'mail', 'email'], ['My Projects', 'folder', 'projects'],
  ['Deployed Websites', 'websites', 'websites'], ['About Me', 'about', 'about'], ['Contact Me', 'contact', 'contact'],
];
const right: Array<[string, IconName, WindowKind]> = [
  ['My Documents', 'folder', 'documents'], ['My Recent Documents', 'document', 'recent'], ['My Computer', 'computer', 'computer'],
  ['Control Panel', 'control', 'control'], ['Help and Support', 'help', 'help'], ['Search', 'search', 'search'], ['Run...', 'app', 'run'],
];

export function StartMenu({ close }: { close: () => void }) {
  const { open, settings, restart } = useSystem();
  const launch = (kind: WindowKind) => { open(kind); close(); };
  return <aside className="start-menu" aria-label="Start menu">
    <header><img className="start-profile-image" src={profile.profileImage} alt="" /><strong>{settings.username || profile.name}</strong></header>
    <div className="start-columns">
      <div className="start-left">
        {left.map(([label, icon, kind], index) => <button key={label} className={index < 2 ? 'primary' : ''} onClick={() => launch(kind)}>
          <IconGlyph name={icon} size={index < 2 ? 31 : 26} /><span>{label}{index < 2 && <small>{index === 0 ? 'Internet Explorer' : 'Outlook Express'}</small>}</span>
        </button>)}
        <button className="all-programs" onClick={() => launch('control')}>All Programs <b>▶</b></button>
      </div>
      <div className="start-right">
        {right.map(([label, icon, kind]) => <button key={label} onClick={() => launch(kind)}><IconGlyph name={icon} size={22} />{label}</button>)}
      </div>
    </div>
    <footer>
      <button onClick={() => { close(); restart(); }}><span className="logoff-icon">🔑</span> Log Off</button>
      <button onClick={() => launch('shutdown')}><span className="power-icon">⏻</span> Turn Off Computer</button>
    </footer>
  </aside>;
}
