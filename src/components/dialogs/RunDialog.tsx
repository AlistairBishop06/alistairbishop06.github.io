import { type FormEvent, useState } from 'react';
import type { BrowserTarget, WindowKind } from '../../types';
import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';

const commands: Record<string, WindowKind> = { projects: 'projects', websites: 'websites', about: 'about', contact: 'contact', cv: 'cv', notepad: 'notepad', iexplore: 'browser', cmd: 'cmd', control: 'control', help: 'help', pinball: 'pinball', winver: 'winver' };
export function RunDialog({ close }: { close: () => void }) {
  const [value, setValue] = useState('');
  const { open, openBrowser, notify } = useSystem();
  const run = (event: FormEvent) => {
    event.preventDefault(); const command = value.trim().toLowerCase();
    if (commands[command]) { open(commands[command]); close(); return; }
    if (['github', 'github.com/alistairbishop06', 'https://github.com/alistairbishop06'].includes(command)) {
      window.open('https://github.com/alistairbishop06', '_blank', 'noopener,noreferrer'); close(); return;
    }
    if (/^https?:\/\/(?:www\.)?github\.com(?:\/|$)/i.test(value.trim())) {
      window.open(value.trim(), '_blank', 'noopener,noreferrer'); close(); return;
    }
    if (/^https?:\/\//.test(command)) { openBrowser({ title: command, url: command }); close(); return; }
    notify('Run', `Windows cannot find '${value}'. Make sure you typed the name correctly, and then try again.`, 'error');
  };
  return <form className="run-dialog app-fill" onSubmit={run}><div><IconGlyph name="run" size={38} /><p>Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.</p></div><label>Open: <input autoFocus value={value} onChange={event => setValue(event.target.value)} /></label><footer><button type="submit">OK</button><button type="button" onClick={close}>Cancel</button><button type="button" disabled>Browse...</button></footer></form>;
}
