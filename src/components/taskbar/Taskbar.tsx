import { useEffect, useState } from 'react';
import type { XPWindow } from '../../types';
import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';
import { StartMenu } from './StartMenu';

export function Taskbar({ windows, toggleWindow, showDesktop }: { windows: XPWindow[]; toggleWindow: (id: string) => void; showDesktop: () => void }) {
  const [startOpen, setStartOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [clockClicks, setClockClicks] = useState(0);
  const { settings, setSettings, play, open } = useSystem();
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!(event.target as HTMLElement).closest('.start-zone')) setStartOpen(false); };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, []);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setStartOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  const topZ = Math.max(0, ...windows.filter(win => !win.minimized).map(win => win.z));
  const clickClock = () => {
    const next = clockClicks + 1;
    setClockClicks(next);
    if (next >= 5) { setClockClicks(0); open('mines'); }
  };
  return <footer className="taskbar">
    <div className="start-zone">
      {startOpen && <StartMenu close={() => setStartOpen(false)} />}
      <button className={`start-button ${startOpen ? 'pressed' : ''}`} onClick={() => { setStartOpen(value => !value); play('start'); }}>
        <span className="windows-flag"><i /><i /><i /><i /></span><b>start</b>
      </button>
    </div>
    <div className="quick-launch">
      <button aria-label="Show Desktop" onClick={showDesktop}><span className="tiny-desktop" /></button>
      <button aria-label="Internet Explorer" onClick={() => open('browser')}><IconGlyph name="browser" size={19} /></button>
      <button aria-label="My Projects" onClick={() => open('projects')}><IconGlyph name="folder" size={19} /></button>
    </div>
    <div className="task-buttons">
      {windows.map(win => <button key={win.id} className={!win.minimized && win.z === topZ ? 'active' : ''} onClick={() => toggleWindow(win.id)}>
        <IconGlyph name={win.icon || 'app'} size={17} /><span>{win.title}</span>
      </button>)}
    </div>
    <div className="system-tray">
      <button className="tray-icon" aria-label={settings.soundEnabled ? 'Mute sound' : 'Enable sound'} onClick={() => setSettings(current => ({ ...current, soundEnabled: !current.soundEnabled }))}>
        <span>{settings.soundEnabled ? (settings.volume > .55 ? '🔊' : '🔉') : '🔇'}</span>
      </button>
      <span title="Network connected">📡</span>
      <button className="clock" title={now.toLocaleDateString(undefined, { dateStyle: 'full' })} onClick={clickClock}>{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</button>
    </div>
    <button className="show-desktop-edge" aria-label="Show Desktop" onClick={showDesktop} />
  </footer>;
}
