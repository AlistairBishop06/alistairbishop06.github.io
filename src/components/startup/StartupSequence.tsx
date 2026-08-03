import { useEffect, useState } from 'react';

export function StartupSequence({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) {
  const [phase, setPhase] = useState<'bios' | 'loading' | 'welcome'>('bios');
  useEffect(() => {
    const first = window.setTimeout(() => setPhase('loading'), 850);
    const second = window.setTimeout(() => setPhase('welcome'), 2300);
    const third = window.setTimeout(onComplete, 3450);
    return () => [first, second, third].forEach(clearTimeout);
  }, [onComplete]);
  return <main className={`startup-screen ${phase}`} aria-live="polite">
    {phase === 'bios' && <div className="bios-copy">
      <p>PortfolioBIOS (C) 2026 Alistair Systems</p>
      <p>Memory Test: 1048576K OK</p>
      <p>Detecting creative projects... Done</p>
      <span>_</span>
    </div>}
    {phase === 'loading' && <div className="xp-loader">
      <div className="xp-wordmark"><span>Alistair</span><strong>Portfolio</strong><sup>XP</sup></div>
      <p>Microsoft-inspired interactive experience</p>
      <div className="loading-track"><i /><i /><i /></div>
    </div>}
    {phase === 'welcome' && <div className="welcome-word">welcome</div>}
    <button className="skip-startup" onClick={onSkip}>Skip startup</button>
  </main>;
}
