import { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';

const wallpapers = [
  { id: 'hills', label: 'Rolling Hills' }, { id: 'blue', label: 'Deep Blue' }, { id: 'teal', label: 'Windows Teal' }, { id: 'sunset', label: 'Sunset Gradient' },
];
export function DisplayProperties({ close }: { close: () => void }) {
  const { settings, setSettings } = useSystem();
  const [draft, setDraft] = useState(settings);
  const apply = () => setSettings(draft);
  return <div className="display-properties properties-app app-fill">
    <div className="property-tabs"><button>Themes</button><button className="active">Desktop</button><button>Screen Saver</button><button>Appearance</button><button>Settings</button></div>
    <div className="property-page">
      <div className={`monitor-preview wallpaper-${draft.wallpaper}`}><div style={{ backgroundImage: draft.wallpaper === 'hills' ? "url('./assets/wallpapers/rolling-hills.jpg')" : undefined }}><span><IconGlyph name="computer" size={46} /></span></div></div>
      <label>Background:</label><select value={draft.wallpaper} onChange={event => setDraft({ ...draft, wallpaper: event.target.value })}>{wallpapers.map(wallpaper => <option key={wallpaper.id} value={wallpaper.id}>{wallpaper.label}</option>)}</select>
      <label>Color scheme:</label><select value={draft.theme} onChange={event => setDraft({ ...draft, theme: event.target.value as typeof draft.theme })}><option value="luna">Windows XP Blue</option><option value="olive">Olive Green</option><option value="silver">Silver</option></select>
      <button className="browse-button">Browse...</button>
    </div>
    <div className="dialog-buttons"><button onClick={() => { apply(); close(); }}>OK</button><button onClick={close}>Cancel</button><button onClick={apply}>Apply</button></div>
  </div>;
}
