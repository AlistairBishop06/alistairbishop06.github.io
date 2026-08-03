import { type PointerEvent, type ReactNode, useEffect, useRef } from 'react';
import type { Rect, XPWindow } from '../../types';
import { IconGlyph } from '../common/IconGlyph';

interface Props {
  win: XPWindow;
  active: boolean;
  children: ReactNode;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onRect: (rect: Rect) => void;
}

export function WindowFrame({ win, active, children, onClose, onFocus, onMinimize, onMaximize, onRect }: Props) {
  const action = useRef<{ mode: 'move' | 'resize'; edge?: string; startX: number; startY: number; rect: Rect } | null>(null);
  useEffect(() => {
    const closeActive = () => { if (active) onClose(); };
    window.addEventListener('xp-close-active', closeActive);
    return () => window.removeEventListener('xp-close-active', closeActive);
  }, [active, onClose]);

  const beginMove = (event: PointerEvent<HTMLDivElement>) => {
    if (win.maximized || (event.target as HTMLElement).closest('button')) return;
    action.current = { mode: 'move', startX: event.clientX, startY: event.clientY, rect: win.rect };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const current = action.current;
    if (!current) return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (current.mode === 'move') {
      onRect({ ...current.rect, x: Math.min(innerWidth - 120, Math.max(0, current.rect.x + dx)), y: Math.min(innerHeight - 74, Math.max(0, current.rect.y + dy)) });
    }
  };
  const end = () => { action.current = null; };
  const resize = (event: PointerEvent<HTMLDivElement>, edge: string) => {
    event.stopPropagation();
    const start = { x: event.clientX, y: event.clientY, rect: win.rect };
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    const onPointerMove = (next: globalThis.PointerEvent) => {
      const dx = next.clientX - start.x;
      const dy = next.clientY - start.y;
      let { x, y, width, height } = start.rect;
      if (edge.includes('e')) width = Math.max(300, Math.min(innerWidth - x, width + dx));
      if (edge.includes('s')) height = Math.max(180, Math.min(innerHeight - 32 - y, height + dy));
      if (edge.includes('w')) { const amount = Math.min(width - 300, dx); x += amount; width -= amount; }
      if (edge.includes('n')) { const amount = Math.min(height - 180, dy); y = Math.max(0, y + amount); height -= amount; }
      onRect({ x, y, width, height });
    };
    const onPointerUp = () => {
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerUp);
    };
    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUp);
  };

  const style = win.maximized
    ? { inset: '0 0 30px 0', zIndex: win.z }
    : { left: win.rect.x, top: win.rect.y, width: win.rect.width, height: win.rect.height, zIndex: win.z };

  return <section
    className={`xp-window ${active ? 'active' : 'inactive'} ${win.maximized ? 'maximized' : ''}`}
    style={style}
    hidden={win.minimized}
    onPointerDown={onFocus}
    aria-label={win.title}
  >
    <header className="title-bar" onPointerDown={beginMove} onPointerMove={move} onPointerUp={end} onDoubleClick={onMaximize}>
      <span className="title-text"><IconGlyph name={win.icon || 'app'} size={17} /> {win.title}</span>
      <span className="window-controls">
        <button data-xp-sound aria-label={`Minimize ${win.title}`} onClick={onMinimize}><span>_</span></button>
        <button data-xp-sound aria-label={`${win.maximized ? 'Restore' : 'Maximize'} ${win.title}`} onClick={onMaximize}><span>{win.maximized ? '❐' : '□'}</span></button>
        <button className="close" aria-label={`Close ${win.title}`} onClick={onClose}><span>×</span></button>
      </span>
    </header>
    <div className="window-content">{children}</div>
    {!win.maximized && ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'].map(edge =>
      <div key={edge} className={`resize-handle ${edge}`} onPointerDown={event => resize(event, edge)} />)}
  </section>;
}
