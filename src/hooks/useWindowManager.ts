import { useCallback, useRef, useState } from 'react';
import type { IconName, Rect, WindowKind, XPWindow } from '../types';

const defaults: Record<WindowKind, { title: string; icon: IconName; rect: Rect }> = {
  projects: { title: 'My Projects', icon: 'folder', rect: { x: 110, y: 62, width: 790, height: 540 } },
  websites: { title: 'Deployed Websites', icon: 'websites', rect: { x: 145, y: 76, width: 760, height: 520 } },
  about: { title: 'About Alistair Bishop', icon: 'about', rect: { x: 190, y: 80, width: 610, height: 460 } },
  cv: { title: 'Alistair Bishop CV - WordPad', icon: 'cv', rect: { x: 150, y: 55, width: 750, height: 555 } },
  computer: { title: 'My Computer', icon: 'computer', rect: { x: 165, y: 80, width: 720, height: 500 } },
  browser: { title: 'Internet Explorer', icon: 'browser', rect: { x: 95, y: 45, width: 850, height: 585 } },
  contact: { title: 'Contact Me', icon: 'contact', rect: { x: 230, y: 100, width: 570, height: 485 } },
  recycle: { title: 'Recycle Bin', icon: 'recycle', rect: { x: 210, y: 100, width: 620, height: 430 } },
  control: { title: 'Control Panel', icon: 'control', rect: { x: 180, y: 70, width: 680, height: 500 } },
  display: { title: 'Display Properties', icon: 'display', rect: { x: 250, y: 100, width: 520, height: 455 } },
  notepad: { title: 'Untitled - Notepad', icon: 'notepad', rect: { x: 135, y: 50, width: 780, height: 570 } },
  cmd: { title: 'Command Prompt', icon: 'cmd', rect: { x: 185, y: 85, width: 690, height: 440 } },
  run: { title: 'Run', icon: 'run', rect: { x: 300, y: 180, width: 420, height: 205 } },
  shutdown: { title: 'Turn off computer', icon: 'power', rect: { x: 275, y: 155, width: 480, height: 300 } },
  message: { title: 'Windows', icon: 'info', rect: { x: 300, y: 190, width: 420, height: 210 } },
  help: { title: 'Help and Support Center', icon: 'help', rect: { x: 170, y: 70, width: 700, height: 490 } },
  search: { title: 'Search Results', icon: 'search', rect: { x: 170, y: 70, width: 700, height: 490 } },
  documents: { title: 'My Documents', icon: 'documents', rect: { x: 190, y: 90, width: 650, height: 450 } },
  recent: { title: 'My Recent Documents', icon: 'recent', rect: { x: 210, y: 100, width: 610, height: 420 } },
  email: { title: 'New Message', icon: 'mail', rect: { x: 210, y: 80, width: 610, height: 500 } },
  mines: { title: 'Minesweeper', icon: 'mines', rect: { x: 185, y: 65, width: 670, height: 540 } },
  pinball: { title: '3D Pinball for Windows - Space Cadet', icon: 'pinball', rect: { x: 205, y: 70, width: 608, height: 477 } },
  daggerfall: { title: 'The Elder Scrolls II: Daggerfall', icon: 'app', rect: { x: 70, y: 35, width: 900, height: 560 } },
  winver: { title: 'About Windows', icon: 'windows', rect: { x: 280, y: 150, width: 460, height: 310 } },
  welcome: { title: 'Welcome to Alistair\'s Portfolio', icon: 'windows', rect: { x: 210, y: 85, width: 640, height: 500 } },
  project: { title: 'Project Properties', icon: 'app', rect: { x: 135, y: 55, width: 790, height: 570 } },
  achievements: { title: 'Portfolio Achievements', icon: 'favorites', rect: { x: 155, y: 60, width: 740, height: 550 } },
};

export function useWindowManager() {
  const [windows, setWindows] = useState<XPWindow[]>([]);
  const z = useRef(20);

  const openWindow = useCallback((kind: WindowKind, payload?: Record<string, unknown>, title?: string) => {
    setWindows(current => {
      const existing = current.find(win => win.kind === kind && !['notepad', 'message', 'project'].includes(kind));
      if (existing) return current.map(win => win.id === existing.id
        ? { ...win, minimized: false, z: ++z.current, payload: payload ? { ...payload, requestId: Date.now() } : win.payload }
        : win);
      const config = defaults[kind];
      const cascade = current.length % 6 * 18;
      const rect = { ...config.rect, x: config.rect.x + cascade, y: config.rect.y + cascade };
      return [...current, {
        id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind, title: title || config.title, icon: config.icon, rect,
        minimized: false, maximized: false, z: ++z.current, payload,
      }];
    });
  }, []);

  const closeWindow = useCallback((id: string) => setWindows(current => current.filter(win => win.id !== id)), []);
  const focusWindow = useCallback((id: string) => setWindows(current => current.map(win => win.id === id ? { ...win, z: ++z.current } : win)), []);
  const minimizeWindow = useCallback((id: string) => setWindows(current => current.map(win => win.id === id ? { ...win, minimized: true } : win)), []);
  const toggleMaximize = useCallback((id: string) => setWindows(current => current.map(win => {
    if (win.id !== id) return win;
    return win.maximized
      ? { ...win, maximized: false, rect: win.restoreRect || win.rect }
      : { ...win, maximized: true, restoreRect: win.rect };
  })), []);
  const updateRect = useCallback((id: string, rect: Rect) => setWindows(current => current.map(win => win.id === id ? { ...win, rect } : win)), []);
  const taskbarToggle = useCallback((id: string) => setWindows(current => {
    const target = current.find(win => win.id === id);
    const highest = Math.max(0, ...current.map(win => win.z));
    if (!target) return current;
    const minimize = !target.minimized && target.z === highest;
    return current.map(win => win.id === id ? { ...win, minimized: minimize, z: minimize ? win.z : ++z.current } : win);
  }), []);
  const showDesktop = useCallback(() => setWindows(current => current.map(win => ({ ...win, minimized: true }))), []);
  const closeAll = useCallback(() => setWindows([]), []);

  return { windows, openWindow, closeWindow, focusWindow, minimizeWindow, toggleMaximize, updateRect, taskbarToggle, showDesktop, closeAll };
}
