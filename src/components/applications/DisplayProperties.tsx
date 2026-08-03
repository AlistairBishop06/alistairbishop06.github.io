import { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { resolveWallpaper, wallpapers } from '../../data/wallpapers';
import { IconGlyph } from '../common/IconGlyph';

export function DisplayProperties({ close }: { close: () => void }) {
  const { settings, setSettings } = useSystem();
  const [draft, setDraft] = useState(() => ({
    ...settings,
    wallpaper: resolveWallpaper(settings.wallpaper)?.id || '',
  }));
  const selectedWallpaper = resolveWallpaper(draft.wallpaper);
  const apply = () => setSettings(draft);

  return <div className="display-properties properties-app app-fill">
    <div className="property-tabs"><button>Themes</button><button className="active">Desktop</button><button>Screen Saver</button><button>Appearance</button><button>Settings</button></div>
    <div className="property-page">
      <div className="monitor-preview"><div style={{ backgroundImage: selectedWallpaper ? `url("${selectedWallpaper.url}")` : undefined }}><span><IconGlyph name="computer" size={46} /></span></div></div>
      <label>Background:</label>
      <select
        value={selectedWallpaper?.id || ''}
        disabled={!wallpapers.length}
        onChange={event => setDraft({ ...draft, wallpaper: event.target.value })}
      >
        {!wallpapers.length && <option value="">No wallpaper images found</option>}
        {wallpapers.map(wallpaper => <option key={wallpaper.id} value={wallpaper.id}>{wallpaper.label}</option>)}
      </select>
      <p className="wallpaper-source">{selectedWallpaper?.fileName || 'Add an image to public/assets/wallpapers'}</p>
      <label>Color scheme:</label><select value={draft.theme} onChange={event => setDraft({ ...draft, theme: event.target.value as typeof draft.theme })}><option value="luna">Windows XP Blue</option><option value="olive">Olive Green</option><option value="silver">Silver</option></select>
    </div>
    <div className="dialog-buttons"><button onClick={() => { apply(); close(); }}>OK</button><button onClick={close}>Cancel</button><button onClick={apply}>Apply</button></div>
  </div>;
}
