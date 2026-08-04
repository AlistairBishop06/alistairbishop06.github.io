import { useMemo, useState } from 'react';
import { profile } from '../../data/profile';
import { experience } from '../../data/experience';
import { education } from '../../data/education';
import { IconGlyph } from '../common/IconGlyph';
import { useSystem } from '../../context/SystemContext';

export function DocumentsApp({ recent = false }: { recent?: boolean }) {
  const { open } = useSystem();
  const notesFile = { name: 'project-notes.md', url: './documents/project-notes.md' };
  const items = [
    { name: recent ? 'alistair-bishop-cv.pdf' : 'My CV', icon: 'cv' as const, launch: () => open('cv') },
    { name: 'Education', icon: 'document' as const, launch: () => open('about', { tab: 'Education' }) },
    { name: 'Experience', icon: 'document' as const, launch: () => open('about', { tab: 'Experience' }) },
    { name: recent ? notesFile.name : 'Project Notes', icon: 'notepad' as const, launch: () => open('notepad', { file: notesFile }, `${notesFile.name} - Notepad`) },
  ];
  return <div className="simple-folder app-fill"><aside><h3>{recent ? 'Recent Documents' : 'File and Folder Tasks'}</h3><button disabled>Create a new folder</button><button disabled>Share this folder</button></aside><div>{items.map(item => <button key={item.name} title="Double-click to open" onDoubleClick={item.launch} onKeyDown={event => event.key === 'Enter' && item.launch()}><IconGlyph name={item.icon} size={38} /><span>{item.name}</span></button>)}</div></div>;
}
export function HelpApp() {
  const [query, setQuery] = useState('');
  return <div className="help-app app-fill"><header><IconGlyph name="help" size={52} /><div><h1>Help and Support Center</h1><p>How can we help you?</p></div></header><div className="help-search"><input placeholder="Type a question" value={query} onChange={event => setQuery(event.target.value)} /><button>→</button></div><div className="help-columns"><section><h2>Pick a Help topic</h2><a>Explore this portfolio</a><a>Keyboard and accessibility</a><a>GitHub data and caching</a><a>Using Internet Explorer</a></section><section><h2>Did you know?</h2><p>Double-click desktop icons to open them. Right-click the wallpaper for Display Properties.</p><p>Try <b>winver</b>, <b>matrix</b> or <b>bsod</b> in Command Prompt.</p>{query && <p><b>Search:</b> No online results are required—try the topics on the left.</p>}</section></div></div>;
}
export function SearchApp() {
  const [query, setQuery] = useState(''); const { open } = useSystem();
  const results = useMemo(() => ['Achievements', 'Projects', 'Deployed Websites', 'About Me', 'My CV', 'Contact Me'].filter(item => item.toLowerCase().includes(query.toLowerCase())), [query]);
  const kind = (name: string) => ({ Achievements: 'achievements', Projects: 'projects', 'Deployed Websites': 'websites', 'About Me': 'about', 'My CV': 'cv', 'Contact Me': 'contact' } as const)[name as 'Projects'];
  return <div className="search-app app-fill"><aside><div className="search-dog"><IconGlyph name="search" size={65} /></div><h3>What do you want to search for?</h3><label>All or part of the file name:<input value={query} onChange={event => setQuery(event.target.value)} autoFocus /></label><button>Search</button></aside><div>{results.map(result => <button key={result} onDoubleClick={() => open(kind(result))}><IconGlyph name="document" size={30} /><span>{result}</span></button>)}</div></div>;
}
export function EmailApp() {
  const { notify } = useSystem(); const [to, setTo] = useState(''); const [subject, setSubject] = useState(''); const [body, setBody] = useState('');
  return <div className="email-app app-fill"><div className="email-toolbar"><button onClick={() => notify('Outlook Express', 'This local demo does not send email. Use the Contact Me form instead.')}><IconGlyph name="mail" size={22} /> Send</button><button><IconGlyph name="save" size={22} /> Save</button><button><IconGlyph name="document" size={22} /> Attach</button></div><label>To: <input value={to} onChange={e => setTo(e.target.value)} /></label><label>Subject: <input value={subject} onChange={e => setSubject(e.target.value)} /></label><textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message..." /></div>;
}
export function Minesweeper() {
  const [seed, setSeed] = useState(0); const [opened, setOpened] = useState<number[]>([]); const mines = [3, 8, 17, 23, 31];
  return <div className="mines-app app-fill"><div className="mine-header"><span>005</span><button onClick={() => { setOpened([]); setSeed(seed + 1); }}><IconGlyph name="restart" size={27} /></button><span>999</span></div><div className="mine-grid">{Array.from({ length: 36 }, (_, index) => <button key={`${seed}-${index}`} className={opened.includes(index) ? 'open' : ''} onClick={() => setOpened(value => [...value, index])}>{opened.includes(index) ? mines.includes(index) ? '●' : [0,1,1,2,0,1][index % 6] || '' : ''}</button>)}</div><p>Secret clock-click edition</p></div>;
}
export function Winver() {
  return <div className="winver app-fill"><div className="winver-brand"><IconGlyph name="windows" size={48} /><span>Alistair Portfolio</span><b>xp</b></div><p>Version 1.0 (Build 2600.xpportfolio)</p><hr /><p>This interactive portfolio is owned by:</p><strong>{profile.name}<br />{profile.university}</strong><p>Physical memory available to Windows: unlimited curiosity</p><button>OK</button></div>;
}
export function InfoFolder({ mode }: { mode: 'experience' | 'education' }) {
  const data = mode === 'experience' ? experience.map(item => `${item.role} — ${item.organisation}`) : education.map(item => `${item.qualification} — ${item.institution}`);
  return <div>{data.join('\n')}</div>;
}
