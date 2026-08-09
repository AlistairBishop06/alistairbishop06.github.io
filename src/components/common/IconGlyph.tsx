import type { IconName } from '../../types';

const iconFiles: Record<IconName, string> = {
  folder: 'folder.png', websites: 'websites.png', about: 'about.png', cv: 'cv.png',
  computer: 'computer.png', browser: 'browser.png', contact: 'contact.png', recycle: 'recycle.png', 'recycle-empty': 'recycle-empty.png',
  control: 'control.png', notepad: 'notepad.png', cmd: 'cmd.png', document: 'document.png',
  network: 'network.png', sound: 'sound.png', mute: 'mute.png', search: 'search.png', help: 'help.png',
  drive: 'drive.png', skills: 'skills.png', mail: 'mail.png', paint: 'paint.png', info: 'info.png',
  error: 'error.png', user: 'user.png', windows: 'windows.png', globe: 'globe.png', app: 'app.png',
  display: 'display.png', mouse: 'mouse.png', accessibility: 'accessibility.png', date: 'date.png',
  programs: 'programs.png', run: 'run.png', mines: 'mines.png', save: 'save.png', printer: 'printer.png',
  back: 'back.png', forward: 'forward.png', up: 'up.png', refresh: 'refresh.png', stop: 'stop.png',
  home: 'home.png', favorites: 'favorites.png', go: 'go.png', restore: 'restore.png', delete: 'delete.png',
  standby: 'standby.png', power: 'power.png', restart: 'restart.png', documents: 'documents.png',
  recent: 'recent.png', properties: 'properties.png', 'new-folder': 'new-folder.png', logoff: 'logoff.png', copy: 'copy.png',
  pinball: 'pinball.png', clippy: 'Clippy.png',
};

export function IconGlyph({ name, size = 32, className = '' }: { name: IconName; size?: number; className?: string }) {
  return <img
    className={`icon-glyph icon-${name} ${className}`}
    src={`./assets/icons/ui/${iconFiles[name]}`}
    width={size}
    height={size}
    style={{ width: size, height: size }}
    alt=""
    aria-hidden="true"
    draggable={false}
  />;
}
