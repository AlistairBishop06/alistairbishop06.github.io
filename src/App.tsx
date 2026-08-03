import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BrowserTarget } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSound } from './hooks/useSound';
import { useWindowManager } from './hooks/useWindowManager';
import { SystemContext, type SystemSettings } from './context/SystemContext';
import { Desktop } from './components/desktop/Desktop';
import { Taskbar } from './components/taskbar/Taskbar';
import { WindowManager } from './components/windows/WindowManager';
import { StartupSequence } from './components/startup/StartupSequence';

const defaultSettings: SystemSettings = { wallpaper: 'hills', theme: 'luna', soundEnabled: true, volume: .7, highContrast: false, textScale: 1, pointer: 'classic', username: 'Alistair Bishop' };
export default function App() {
  const [settings, setSettings] = useLocalStorage('xp-settings', defaultSettings);
  const [skipStartup, setSkipStartup] = useLocalStorage('xp-skip-startup', false);
  const [started, setStarted] = useState(skipStartup);
  const [poweredOff, setPoweredOff] = useState(false);
  const [blueScreen, setBlueScreen] = useState(false);
  const [firstInteraction, setFirstInteraction] = useState(false);
  const loginPlayed = useRef(false);
  const manager = useWindowManager();
  const play = useSound(settings.soundEnabled, settings.volume);
  useEffect(() => {
    const interact = () => { setFirstInteraction(true); window.removeEventListener('pointerdown', interact); window.removeEventListener('keydown', interact); };
    if (!firstInteraction) { window.addEventListener('pointerdown', interact); window.addEventListener('keydown', interact); }
    return () => { window.removeEventListener('pointerdown', interact); window.removeEventListener('keydown', interact); };
  }, [firstInteraction, play]);
  useEffect(() => {
    if (!firstInteraction || !started || loginPlayed.current) return;
    loginPlayed.current = true;
    play('login');
  }, [firstInteraction, started, play]);
  useEffect(() => {
    const click = (event: PointerEvent) => {
      const control = (event.target as HTMLElement).closest('button, a, [role="button"]') as HTMLElement | null;
      if (control && !control.matches(':disabled') && !control.hasAttribute('data-xp-sound')) play('click');
    };
    window.addEventListener('pointerdown', click);
    return () => window.removeEventListener('pointerdown', click);
  }, [play]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (blueScreen) { setBlueScreen(false); return; }
      const dialogKinds = new Set(['run', 'shutdown', 'message', 'display', 'winver']);
      const activeDialog = [...manager.windows].filter(win => !win.minimized && dialogKinds.has(win.kind)).sort((a, b) => b.z - a.z)[0];
      if (activeDialog) manager.closeWindow(activeDialog.id);
    };
    window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape);
  }, [blueScreen, manager.windows, manager.closeWindow]);
  const restart = useCallback(() => {
    play('logoff'); manager.closeAll(); loginPlayed.current = true; setPoweredOff(false); setStarted(false);
    window.setTimeout(() => play('startup'), 1800);
    window.setTimeout(() => setStarted(true), 3600);
  }, [manager.closeAll, play]);
  const shutDown = useCallback(() => { play('shutdown'); manager.closeAll(); window.setTimeout(() => setPoweredOff(true), 400); }, [manager.closeAll, play]);
  const openBrowser = useCallback((target?: BrowserTarget) => manager.openWindow('browser', target ? { target } : undefined), [manager.openWindow]);
  const notify = useCallback((title: string, message: string, type: 'info' | 'error' = 'info', withSound = true) => { if (withSound) play(type); manager.openWindow('message', { title, message, type }, title); }, [manager.openWindow, play]);
  const context = useMemo(() => ({ settings, setSettings, play, open: manager.openWindow, openBrowser, notify, restart, shutDown, triggerBlueScreen: () => { play('critical'); setBlueScreen(true); } }), [settings, setSettings, play, manager.openWindow, openBrowser, notify, restart, shutDown]);

  if (poweredOff) return <main className="powered-off"><p>It is now safe to turn off your computer.</p><button onClick={() => { loginPlayed.current = true; setPoweredOff(false); setStarted(false); play('startup'); window.setTimeout(() => setStarted(true), 3500); }}>Turn Portfolio XP back on</button></main>;
  if (!started) return <StartupSequence onComplete={() => setStarted(true)} onSkip={() => { setSkipStartup(true); setStarted(true); }} />;
  return <SystemContext.Provider value={context}>
    <div className={`xp-system theme-${settings.theme} wallpaper-${settings.wallpaper} pointer-${settings.pointer} ${settings.highContrast ? 'high-contrast' : ''}`} style={{ fontSize: `${settings.textScale * 13}px` }}>
      <Desktop />
      <WindowManager windows={manager.windows} close={manager.closeWindow} focus={manager.focusWindow} minimize={manager.minimizeWindow} maximize={manager.toggleMaximize} updateRect={manager.updateRect} />
      <Taskbar windows={manager.windows} toggleWindow={manager.taskbarToggle} showDesktop={manager.showDesktop} />
      {blueScreen && <div className="blue-screen" onClick={() => setBlueScreen(false)} role="button" tabIndex={0}><div><h1>:(</h1><p>A problem has been detected and Windows has been shut down to prevent damage to your sense of nostalgia.</p><p>PORTFOLIO_EXCEPTION_NOT_HANDLED</p><p>Technical information:<br />*** STOP: 0x000000XP (0xALISTAIR, 0xBISHOP)</p><small>Click anywhere or press Escape to return safely to the desktop.</small></div></div>}
    </div>
  </SystemContext.Provider>;
}
