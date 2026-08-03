import { createContext, useContext } from 'react';
import type { BrowserTarget, WindowKind } from '../types';
import type { SoundName } from '../hooks/useSound';

export interface SystemSettings {
  wallpaper: string;
  theme: 'luna' | 'olive' | 'silver';
  soundEnabled: boolean;
  volume: number;
  highContrast: boolean;
  textScale: number;
  pointer: 'classic' | 'large' | 'black';
  username: string;
}

interface SystemContextValue {
  settings: SystemSettings;
  setSettings: (next: SystemSettings | ((current: SystemSettings) => SystemSettings)) => void;
  play: (name: SoundName) => void;
  open: (kind: WindowKind, payload?: Record<string, unknown>, title?: string) => void;
  openBrowser: (target?: BrowserTarget) => void;
  notify: (title: string, message: string, type?: 'info' | 'error', withSound?: boolean) => void;
  restart: () => void;
  shutDown: () => void;
  triggerBlueScreen: () => void;
}

export const SystemContext = createContext<SystemContextValue | null>(null);
export const useSystem = () => {
  const value = useContext(SystemContext);
  if (!value) throw new Error('useSystem must be used within SystemContext');
  return value;
};
