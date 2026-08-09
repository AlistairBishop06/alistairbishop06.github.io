import { useEffect, useRef, useState } from 'react';
import { useSystem } from '../../context/SystemContext';

const assistantWidth = 290;
const assistantHeight = 128;

function startingPosition() {
  return {
    x: Math.max(8, window.innerWidth - assistantWidth - 24),
    y: Math.max(8, window.innerHeight - assistantHeight - 54),
  };
}

export function ClippyAssistant() {
  const { clippyStatus, returnClippy } = useSystem();
  const [position, setPosition] = useState(startingPosition);
  const drag = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => () => document.documentElement.classList.remove('clippy-dragging'), []);

  if (clippyStatus === 'bin' || clippyStatus === 'deleted') return null;

  const beginDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (clippyStatus !== 'desktop') return;
    drag.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - position.x,
      offsetY: event.clientY - position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    document.documentElement.classList.add('clippy-dragging');
  };

  const move = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    setPosition({
      x: Math.min(Math.max(8, event.clientX - drag.current.offsetX), Math.max(8, window.innerWidth - assistantWidth - 8)),
      y: Math.min(Math.max(8, event.clientY - drag.current.offsetY), Math.max(8, window.innerHeight - assistantHeight - 38)),
    });
  };

  const finishDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    drag.current = null;
    document.documentElement.classList.remove('clippy-dragging');
    const recycleTargets = [...document.querySelectorAll<HTMLElement>('[data-recycle-bin-drop]')];
    const droppedInBin = recycleTargets.some(target => {
      const bounds = target.getBoundingClientRect();
      return event.clientX >= bounds.left && event.clientX <= bounds.right
        && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    });
    if (droppedInBin) {
      returnClippy();
    }
  };

  return <aside
    className={`clippy-assistant ${clippyStatus === 'returning' ? 'returning' : ''}`}
    style={{ left: position.x, top: position.y }}
    aria-live="polite"
  >
    <div className="clippy-balloon"><span aria-hidden="true">📎</span> {clippyStatus === 'returning' ? 'Understandable.' : 'Freedom at last.'}</div>
    <button
      type="button"
      className="clippy-character"
      aria-label="Clippy. Drag back to the Recycle Bin."
      onPointerDown={beginDrag}
      onPointerMove={move}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      <img src="./assets/icons/ui/Clippy.png" alt="Clippy" draggable={false} />
    </button>
  </aside>;
}
