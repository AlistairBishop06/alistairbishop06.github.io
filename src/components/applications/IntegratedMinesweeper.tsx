import { useState } from 'react';
import { IconGlyph } from '../common/IconGlyph';

const gameUrl = 'https://ziebelje.github.io/minesweeper/';

export function IntegratedMinesweeper() {
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => {
    setLoading(true);
    setReloadKey(value => value + 1);
  };

  return <div className="minesweeper-app app-fill">
    {loading && <div className="minesweeper-loading">
      <IconGlyph name="mines" size={48} />
      <div><strong>Minesweeper</strong><span>Loading game...</span></div>
    </div>}
    <iframe
      key={reloadKey}
      src={gameUrl}
      title="Minesweeper"
      allow="fullscreen"
      sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts"
      onLoad={() => setLoading(false)}
    />
    <div className="minesweeper-fallback">
      <button onClick={reload}>Reload</button>
      <a href={gameUrl} target="_blank" rel="noreferrer">Open separately</a>
    </div>
  </div>;
}
