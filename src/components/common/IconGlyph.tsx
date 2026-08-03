import type { IconName } from '../../types';

const emoji: Record<IconName, string> = {
  folder: '📁', websites: '🌐', about: '👤', cv: '📄', computer: '🖥️', browser: '🌎',
  contact: '✉️', recycle: '🗑️', control: '⚙️', notepad: '📝', cmd: '▣', document: '📃',
  network: '📡', sound: '🔊', search: '🔍', help: '❔', drive: '💽', skills: '🧰', mail: '📧',
  paint: '🎨', info: 'ℹ️', error: '⛔', user: '👨‍💻', windows: '⊞', globe: '🌍', app: '🧩',
};

export function IconGlyph({ name, size = 32, className = '' }: { name: IconName; size?: number; className?: string }) {
  return <span className={`icon-glyph icon-${name} ${className}`} style={{ fontSize: size }} aria-hidden="true">{emoji[name]}</span>;
}
