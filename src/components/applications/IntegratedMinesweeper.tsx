import { useEffect, useRef, useState } from 'react';
import { IconGlyph } from '../common/IconGlyph';

const gameUrl = `${import.meta.env.BASE_URL}integrations/minesweeper.html`;

export function IntegratedMinesweeper() {
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleResize = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow || event.data?.type !== 'xp-minesweeper-resize') return;
      const { innerWidth, innerHeight } = event.data;
      if (!Number.isFinite(innerWidth) || !Number.isFinite(innerHeight)) return;
      window.dispatchEvent(new CustomEvent('xp-minesweeper-resize', { detail: { innerWidth, innerHeight } }));
    };
    window.addEventListener('message', handleResize);
    return () => window.removeEventListener('message', handleResize);
  }, []);

  return <div className="minesweeper-app app-fill">
    {loading && <div className="minesweeper-loading">
      <IconGlyph name="mines" size={48} />
      <div><strong>Minesweeper</strong><span>Loading game...</span></div>
    </div>}
    <iframe
      ref={iframeRef}
      src={gameUrl}
      title="Minesweeper"
      allow="fullscreen"
      sandbox="allow-downloads allow-forms allow-modals allow-pointer-lock allow-popups allow-scripts"
      onLoad={() => setLoading(false)}
    />
  </div>;
}
