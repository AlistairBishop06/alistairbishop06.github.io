import { type FormEvent, useEffect, useRef, useState } from 'react';
import { profile } from '../../data/profile';
import { skillGroups } from '../../data/skills';
import { education } from '../../data/education';
import { experience } from '../../data/experience';
import { useGitHubRepositories } from '../../hooks/useGitHubRepositories';
import { useSystem } from '../../context/SystemContext';

const dirs: Record<string, string[]> = {
  'C:\\': ['Projects', 'Websites', 'Skills', 'Experience'], 'C:\\Projects': [], 'C:\\Websites': [], 'C:\\Skills': [], 'C:\\Experience': [],
};
export function CommandPrompt({ close }: { close: () => void }) {
  const [lines, setLines] = useState<string[]>(['Microsoft Windows XP [Version 5.1.2600]', '(C) Copyright 1985-2001 Microsoft Corp.', '', 'Portfolio shell ready. Type HELP for available commands.']);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('C:\\Documents and Settings\\Alistair');
  const [matrix, setMatrix] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const { repos } = useGitHubRepositories();
  const { open, openBrowser, triggerBlueScreen } = useSystem();
  useEffect(() => end.current?.scrollIntoView(), [lines]);
  const output = (value: string | string[]) => setLines(current => [...current, ...(Array.isArray(value) ? value : value.split('\n'))]);
  const run = (event: FormEvent) => {
    event.preventDefault(); const raw = input.trim(); const [command = '', ...args] = raw.split(/\s+/); const cmd = command.toLowerCase(); setInput(''); output(`${cwd}>${raw}`);
    const projects = repos.map(repo => repo.name);
    switch (cmd) {
      case '': break;
      case 'help': output('ABOUT  SKILLS  PROJECTS  WEBSITES  EXPERIENCE  EDUCATION\nCONTACT  GITHUB  CLEAR  DIR  CD  TREE  WHOAMI  HOSTNAME\nDATE  TIME  VER  EXIT  MATRIX  BSOD  DOOM'); break;
      case 'about': output(`${profile.name}\n${profile.headline} at ${profile.university}\n${profile.summary}`); break;
      case 'skills': output(skillGroups.map(group => `${group.name}: ${group.items.join(', ')}`)); break;
      case 'projects': output(projects.length ? projects : 'Repository data is still loading.'); break;
      case 'websites': open('websites'); output('Opening Deployed Websites...'); break;
      case 'experience': output(experience.map(item => `${item.period}  ${item.role} — ${item.organisation}`)); break;
      case 'education': output(education.map(item => `${item.qualification} — ${item.institution}`)); break;
      case 'contact': output(`${profile.email}\ngithub.com/${profile.githubUsername}`); break;
      case 'github': openBrowser({ title: 'Alistair on GitHub', url: `https://github.com/${profile.githubUsername}` }); output('Opening GitHub in Internet Explorer...'); break;
      case 'clear': setLines([]); break;
      case 'dir': output((dirs[cwd] || (cwd === 'C:\\Projects' ? projects : [])).map(name => `07/31/2026  12:00 PM    <DIR>          ${name}`).concat(`${projects.length} File(s)`)); break;
      case 'tree': output(['C:\\', '├── Projects', '├── Websites', '├── Skills', '└── Experience']); break;
      case 'cd': {
        const target = args.join(' '); if (target === '..') setCwd('C:\\'); else {
          const next = target.includes(':') ? target : `C:\\${target.replace(/^\\/, '')}`;
          if (dirs[next]) setCwd(next); else output('The system cannot find the path specified.');
        } break;
      }
      case 'whoami': output('portfolio-xp\\alistair'); break; case 'hostname': output('ALISTAIR-XP'); break;
      case 'date': output(new Date().toLocaleDateString(undefined, { dateStyle: 'full' })); break; case 'time': output(new Date().toLocaleTimeString()); break;
      case 'ver': output('Alistair Portfolio XP [Version 1.0.2600]'); break; case 'exit': close(); break;
      case 'matrix': setMatrix(true); output('Wake up, Alistair...'); setTimeout(() => setMatrix(false), 6000); break;
      case 'bsod': triggerBlueScreen(); break; case 'doom': output('Bad command or file name. (Doom is currently in a meeting.)'); break;
      default: {
        const repo = repos.find(item => item.name.toLowerCase() === raw.toLowerCase());
        if (repo) { open('notepad', { repo }, `${repo.name} - Notepad`); output(`Opening ${repo.name} README...`); }
        else output(`'${command}' is not recognized as an internal or external command,\noperable program or batch file.`);
      }
    }
  };
  return <div className={`cmd-app app-fill ${matrix ? 'matrix' : ''}`} onClick={event => (event.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
    {matrix && <div className="matrix-rain" aria-hidden="true">1011001010110010101100101011001010110010101100101011001010110010<br />0100110101001101010011010100110101001101010011010100110101001101<br />1100101011001010110010101100101011001010110010101100101011001010</div>}
    <div className="cmd-lines">{lines.map((line, index) => <div key={index}>{line || '\u00a0'}</div>)}</div>
    <form onSubmit={run}><label>{cwd}&gt;</label><input autoFocus value={input} onChange={event => setInput(event.target.value)} aria-label="Command" autoComplete="off" /></form><div ref={end} />
  </div>;
}
