import { useEffect, useState } from 'react';
import { skillGroups } from '../../data/skills';
import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';
import type { IconName } from '../../types';

const panels: Array<{ id: string; name: string; description: string; icon: IconName }> = [
  { id: 'display', name: 'Display', description: 'Change the desktop background and colour scheme.', icon: 'computer' },
  { id: 'sounds', name: 'Sounds and Audio Devices', description: 'Adjust audio volume or turn sound off.', icon: 'sound' },
  { id: 'mouse', name: 'Mouse', description: 'Change pointer style and movement.', icon: 'app' },
  { id: 'users', name: 'User Accounts', description: 'Change the name shown around Portfolio XP.', icon: 'user' },
  { id: 'access', name: 'Accessibility Options', description: 'Adjust contrast and text size.', icon: 'help' },
  { id: 'date', name: 'Date and Time', description: 'View your computer’s local date and time.', icon: 'info' },
  { id: 'programs', name: 'Add or Remove Programs', description: 'Inspect installed skills and technologies.', icon: 'app' },
];
export function ControlPanel({ initialPanel }: { initialPanel?: string }) {
  const { open, settings, setSettings } = useSystem();
  const [panel, setPanel] = useState(initialPanel || '');
  const [now, setNow] = useState(new Date());
  useEffect(() => { if (initialPanel) setPanel(initialPanel); }, [initialPanel]);
  useEffect(() => { if (panel !== 'date') return; const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, [panel]);
  return <div className="control-panel app-fill">
    <header><IconGlyph name="control" size={34} /><div><h1>Control Panel</h1><p>Pick a category or change a system setting.</p></div></header>
    {!panel ? <div className="control-grid">{panels.map(item => <button key={item.id} onClick={() => item.id === 'display' ? open('display') : setPanel(item.id)}><IconGlyph name={item.icon} size={42} /><span><b>{item.name}</b><small>{item.description}</small></span></button>)}</div> : <div className="control-detail">
      <button className="back-link" onClick={() => setPanel('')}>‹ Back to Control Panel</button>
      <h2>{panels.find(item => item.id === panel)?.name}</h2>
      {panel === 'sounds' && <fieldset><legend>Device volume</legend><label className="range-row">Low <input type="range" min="0" max="100" value={settings.volume * 100} onChange={event => setSettings({ ...settings, volume: Number(event.target.value) / 100, soundEnabled: Number(event.target.value) > 0 })} /> High</label><label><input type="checkbox" checked={!settings.soundEnabled} onChange={() => setSettings({ ...settings, soundEnabled: !settings.soundEnabled })} /> Mute</label></fieldset>}
      {panel === 'mouse' && <fieldset><legend>Pointers</legend><p>Select a pointer scheme:</p><select value={settings.pointer} onChange={event => setSettings({ ...settings, pointer: event.target.value as typeof settings.pointer })}><option value="classic">Windows Default (system scheme)</option><option value="large">Windows Standard (large)</option><option value="black">Windows Black</option></select><div className="pointer-preview">↖</div></fieldset>}
      {panel === 'users' && <fieldset><legend>Pick a user name</legend><label>Name: <input value={settings.username} onChange={event => setSettings({ ...settings, username: event.target.value })} /></label><p>This changes the Start menu and simulated file paths only.</p></fieldset>}
      {panel === 'access' && <fieldset><legend>Display accessibility</legend><label><input type="checkbox" checked={settings.highContrast} onChange={() => setSettings({ ...settings, highContrast: !settings.highContrast })} /> Use High Contrast</label><label className="range-row">Text size <input type="range" min="90" max="125" value={settings.textScale * 100} onChange={event => setSettings({ ...settings, textScale: Number(event.target.value) / 100 })} /> {Math.round(settings.textScale * 100)}%</label></fieldset>}
      {panel === 'date' && <div className="date-time-panel"><div className="analog-clock"><span>{now.toLocaleTimeString()}</span></div><h3>{now.toLocaleDateString(undefined, { dateStyle: 'full' })}</h3><p>Time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p></div>}
      {panel === 'programs' && <div className="program-list">{skillGroups.flatMap(group => group.items.map(item => <div key={item}><IconGlyph name="app" size={25} /><span><b>{item}</b><small>{group.name} · Installed</small></span><button>Change/Remove</button></div>))}</div>}
    </div>}
  </div>;
}
