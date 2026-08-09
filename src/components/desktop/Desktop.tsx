import { useEffect, useRef, useState } from 'react';
import type { IconName, WindowKind } from '../../types';
import { useSystem } from '../../context/SystemContext';
import { DesktopIcon } from './DesktopIcon';
import { DesktopContextMenu } from './DesktopContextMenu';
import { resolveWallpaper } from '../../data/wallpapers';

const icons: Array<{ id: string; name: string; icon: IconName; kind: WindowKind }> = [
  { id: 'welcome', name: 'Start Here', icon: 'windows', kind: 'welcome' },
  { id: 'achievements', name: 'Achievements', icon: 'favorites', kind: 'achievements' },
  { id: 'hire', name: 'Hire Me', icon: 'contact', kind: 'hire' },
  { id: 'skills', name: 'Skills & Tools', icon: 'skills', kind: 'skills' },
  { id: 'projects', name: 'My Projects', icon: 'folder', kind: 'projects' },
  { id: 'websites', name: 'Deployed Websites', icon: 'websites', kind: 'websites' },
  { id: 'about', name: 'About Me', icon: 'about', kind: 'about' },
  { id: 'cv', name: 'My CV', icon: 'cv', kind: 'cv' },
  { id: 'computer', name: 'My Computer', icon: 'computer', kind: 'computer' },
  { id: 'browser', name: 'Internet Explorer', icon: 'browser', kind: 'browser' },
  { id: 'contact', name: 'Contact Me', icon: 'contact', kind: 'contact' },
  { id: 'pinball', name: '3D Pinball Space Cadet', icon: 'pinball', kind: 'pinball' },
  { id: 'recycle', name: 'Recycle Bin', icon: 'recycle', kind: 'recycle' },
];

export function Desktop() {
  const { open, play, notify, settings, unlockAchievement } = useSystem();
  const [selected, setSelected] = useState<string | null>(null);
  const [context, setContext] = useState<{ x: number; y: number } | null>(null);
  const [iconsVisible, setIconsVisible] = useState(true);
  const sequence = useRef<string[]>([]);
  const computerClicks = useRef(0);
  const wallpaper = resolveWallpaper(settings.wallpaper);

  useEffect(() => {
    const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    const key = (event: KeyboardEvent) => {
      sequence.current = [...sequence.current.slice(-9), event.key];
      if (sequence.current.join(',') === konami.join(',')) {
        unlockAchievement('konami');
        document.documentElement.classList.toggle('secret-wallpaper');
        notify('Secret unlocked', 'The meadow has entered party mode. Type “matrix” in Command Prompt for another surprise.');
      }
      if (event.key === 'Escape') { setContext(null); setSelected(null); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [notify, unlockAchievement]);

  const openIcon = (kind: WindowKind) => {
    play(kind === 'computer' || kind === 'projects' ? 'folder' : 'window');
    if (kind === 'computer' && ++computerClicks.current >= 4) {
      computerClicks.current = 0;
      unlockAchievement('computer_clicks');
      notify('My Computer', 'Easy there! One computer at a time should be enough.', 'error');
    }
    open(kind);
  };

  const refresh = () => {
    setContext(null); setIconsVisible(false);
    window.setTimeout(() => setIconsVisible(true), 280);
  };

  return <main
    className="desktop"
    style={{ backgroundImage: wallpaper ? `url("${wallpaper.url}")` : undefined }}
    onClick={() => { setSelected(null); setContext(null); }}
    onContextMenu={event => { event.preventDefault(); setContext({ x: event.clientX, y: event.clientY }); }}
  >
    <div className={`desktop-icons ${iconsVisible ? '' : 'hidden'}`}>
      {icons.map(item => <DesktopIcon key={item.id} {...item} selected={selected === item.id} onSelect={setSelected} onOpen={() => openIcon(item.kind)} dropTarget={item.id === 'recycle'} />)}
    </div>
    {context && <DesktopContextMenu x={context.x} y={context.y} onClose={() => setContext(null)} onRefresh={refresh} onProperties={() => { setContext(null); open('display'); }} />}
    <div className="mobile-notice">Best experienced on a desktop - touch controls are enabled.</div>
  </main>;
}
