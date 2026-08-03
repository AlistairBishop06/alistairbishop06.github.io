import type { XPWindow } from '../../types';
import { WindowFrame } from './WindowFrame';
import { ApplicationRouter } from '../applications/ApplicationRouter';

interface Props {
  windows: XPWindow[];
  close: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  maximize: (id: string) => void;
  updateRect: (id: string, rect: XPWindow['rect']) => void;
}

export function WindowManager({ windows, close, focus, minimize, maximize, updateRect }: Props) {
  const activeZ = Math.max(0, ...windows.filter(win => !win.minimized).map(win => win.z));
  return <>
    {windows.map(win => <WindowFrame
      key={win.id}
      win={win}
      active={!win.minimized && win.z === activeZ}
      onClose={() => close(win.id)}
      onFocus={() => focus(win.id)}
      onMinimize={() => minimize(win.id)}
      onMaximize={() => maximize(win.id)}
      onRect={rect => updateRect(win.id, rect)}
    >
      <ApplicationRouter win={win} close={() => close(win.id)} />
    </WindowFrame>)}
  </>;
}
