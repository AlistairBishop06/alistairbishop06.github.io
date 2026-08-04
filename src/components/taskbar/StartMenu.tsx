import type { IconName, WindowKind } from '../../types';
import { profile } from '../../data/profile';
import { IconGlyph } from '../common/IconGlyph';
import { useSystem } from '../../context/SystemContext';

const left: Array<[string, IconName, WindowKind, string?]> = [
  ['Start Here', 'windows', 'welcome', 'Portfolio guide'], ['Internet', 'browser', 'browser', 'Internet Explorer'],
  ['Achievements', 'favorites', 'achievements'], ['My Projects', 'folder', 'projects'], ['Deployed Websites', 'websites', 'websites'], ['About Me', 'about', 'about'], ['Contact Me', 'contact', 'contact'],
];
const right: Array<[string, IconName, WindowKind]> = [
  ['My Documents', 'documents', 'documents'], ['My Recent Documents', 'recent', 'recent'], ['My Computer', 'computer', 'computer'],
  ['Control Panel', 'control', 'control'], ['Search', 'search', 'search'], ['Run...', 'run', 'run'],
];

export function StartMenu({ close }: { close: () => void }) {
  const { open, settings, restart, play } = useSystem();
  const launch = (kind: WindowKind) => {
    play(['projects', 'websites', 'computer', 'documents', 'recent'].includes(kind) ? 'folder' : 'window');
    open(kind); close();
  };
  return <aside className="start-menu" aria-label="Start menu">
    <header><img className="start-profile-image" src={profile.profileImage} alt="" /><strong>{settings.username || profile.name}</strong></header>
    <div className="start-columns">
      <div className="start-left">
        {left.map(([label, icon, kind, subtitle]) => <button data-xp-sound key={label} className={subtitle ? 'primary' : ''} onClick={() => launch(kind)}>
          <IconGlyph name={icon} size={subtitle ? 31 : 26} /><span>{label}{subtitle && <small>{subtitle}</small>}</span>
        </button>)}
        <button data-xp-sound className="all-programs" onClick={() => launch('control')}>All Programs <b>▶</b></button>
      </div>
      <div className="start-right">
        {right.map(([label, icon, kind]) => <button data-xp-sound key={label} onClick={() => launch(kind)}><IconGlyph name={icon} size={22} />{label}</button>)}
      </div>
    </div>
    <footer>
      <button data-xp-sound onClick={() => { close(); restart(); }}><span className="logoff-icon"><IconGlyph name="logoff" size={25} /></span> Log Off</button>
      <button data-xp-sound onClick={() => launch('shutdown')}><span className="power-icon"><IconGlyph name="power" size={25} /></span> Turn Off Computer</button>
    </footer>
  </aside>;
}
