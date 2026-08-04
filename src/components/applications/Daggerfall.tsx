import { useEffect, useRef, useState } from 'react';

const gameUrl = 'https://playclassic.games/games/role-playing-dos-games-online/play-the-elder-scrolls-daggerfall-online/play/';

export function Daggerfall() {
  const [loading, setLoading] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const resize = () => {
      const { width, height } = viewport.getBoundingClientRect();
      viewport.style.setProperty('--daggerfall-scale-x', String(width / 900));
      viewport.style.setProperty('--daggerfall-scale-y', String(height / 538));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    resize();
    return () => observer.disconnect();
  }, []);

  return <div className="daggerfall-app app-fill">
    {loading && <div className="daggerfall-loading">
      <div><strong>The Elder Scrolls II: Daggerfall</strong><span>Connecting to the hosted game...</span></div>
    </div>}
    <div ref={viewportRef} className="daggerfall-viewport">
      <iframe
        src={gameUrl}
        title="The Elder Scrolls II: Daggerfall"
        allow="autoplay; fullscreen; gamepad"
        allowFullScreen
        scrolling="no"
        tabIndex={0}
        onLoad={() => setLoading(false)}
      />
    </div>
  </div>;
}
