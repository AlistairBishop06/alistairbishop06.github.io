import { useState } from 'react';
import { IconGlyph } from '../common/IconGlyph';

const gameUrl = 'https://98.js.org/programs/pinball/space-cadet.html';

export function SpaceCadetPinball() {
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => {
    setLoading(true);
    setReloadKey(value => value + 1);
  };

  return <div className="pinball-app app-fill">
    {loading && <div className="pinball-loading">
      <IconGlyph name="pinball" size={48} />
      <div><strong>3D Pinball</strong><span>Loading Space Cadet...</span></div>
    </div>}
    <iframe
      key={reloadKey}
      src={gameUrl}
      title="3D Pinball for Windows - Space Cadet"
      allow="autoplay; fullscreen; gamepad"
      sandbox="allow-downloads allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts"
      onLoad={() => setLoading(false)}
    />
    <div className="pinball-fallback">
      <button onClick={reload}>Reload</button>
      <a href={gameUrl} target="_blank" rel="noreferrer">Open separately</a>
    </div>
  </div>;
}
