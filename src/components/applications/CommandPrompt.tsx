import { type FormEvent, useEffect, useRef, useState } from 'react';
import { profile } from '../../data/profile';
import { skillGroups } from '../../data/skills';
import { education } from '../../data/education';
import { experience } from '../../data/experience';
import { getCaseStudyForRepository } from '../../data/caseStudies';
import { useGitHubRepositories } from '../../hooks/useGitHubRepositories';
import { useSystem } from '../../context/SystemContext';

const dirs: Record<string, string[]> = {
  'C:\\': ['Projects', 'Websites', 'Skills', 'Experience'], 'C:\\Projects': [], 'C:\\Websites': [], 'C:\\Skills': [], 'C:\\Experience': [],
};

const matrixCharacters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓ';

function MatrixRain() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const context = element.getContext('2d');
    if (!context) return;

    const fontSize = 15;
    let drops: number[] = [];
    let animation = 0;
    let lastFrame = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const bounds = element.getBoundingClientRect();
      element.width = Math.max(1, Math.floor(bounds.width * ratio));
      element.height = Math.max(1, Math.floor(bounds.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      drops = Array.from({ length: Math.ceil(bounds.width / fontSize) }, () => -Math.random() * 35);
      context.fillStyle = '#020403';
      context.fillRect(0, 0, bounds.width, bounds.height);
    };

    const draw = (time: number) => {
      if (time - lastFrame >= 48) {
        lastFrame = time;
        const { width, height } = element.getBoundingClientRect();
        context.fillStyle = 'rgba(0,8,2,.16)';
        context.fillRect(0, 0, width, height);
        context.font = `${fontSize}px "Lucida Console",Consolas,monospace`;

        drops.forEach((drop, column) => {
          const character = matrixCharacters[Math.floor(Math.random() * matrixCharacters.length)];
          const x = column * fontSize;
          const y = drop * fontSize;
          context.shadowBlur = 8;
          context.shadowColor = '#00ff66';
          context.fillStyle = Math.random() > .88 ? '#d9ffe5' : Math.random() > .45 ? '#45ff73' : '#0a9f3e';
          context.fillText(character, x, y);
          drops[column] = y > height && Math.random() > .965 ? -Math.random() * 18 : drop + .72 + Math.random() * .48;
        });
        context.shadowBlur = 0;
      }
      animation = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    animation = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animation);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvas} className="matrix-rain" aria-hidden="true" />;
}

export function CommandPrompt({ close }: { close: () => void }) {
  const [lines, setLines] = useState<string[]>(['Microsoft Windows XP [Version 5.1.2600]', '(C) Copyright 1985-2001 Microsoft Corp.', '', 'Portfolio shell ready. Type HELP for available commands.']);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('C:\\Documents and Settings\\Alistair');
  const [matrix, setMatrix] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const { repos } = useGitHubRepositories();
  const { open, triggerBlueScreen, unlockAchievement } = useSystem();
  useEffect(() => end.current?.scrollIntoView(), [lines]);
  const output = (value: string | string[]) => setLines(current => [...current, ...(Array.isArray(value) ? value : value.split('\n'))]);
  const run = (event: FormEvent) => {
    event.preventDefault(); const raw = input.trim(); const [command = '', ...args] = raw.split(/\s+/); const cmd = command.toLowerCase(); setInput(''); output(`${cwd}>${raw}`);
    const projects = repos.map(repo => repo.name);
    switch (cmd) {
      case '': break;
      case 'help': output('ABOUT  SKILLS  PROJECTS  WEBSITES  EXPERIENCE  EDUCATION\nCONTACT  GITHUB  CLEAR  DIR  CD  TREE  WHOAMI  HOSTNAME\nDATE  TIME  VER  EXIT  MATRIX  BSOD  DOOM'); break;
      case 'about': output(`${profile.name}\n${profile.headline} at ${profile.university}\n${profile.summary}`); break;
      case 'skills': output(skillGroups.map(group => `${group.name}: ${group.items.map(item => item.name).join(', ')}`)); break;
      case 'projects': output(projects.length ? projects : 'Repository data is still loading.'); break;
      case 'websites': open('websites'); output('Opening Deployed Websites...'); break;
      case 'experience': output(experience.map(item => `${item.period}  ${item.role} - ${item.organisation}`)); break;
      case 'education': output(education.map(item => `${item.qualification} - ${item.institution}`)); break;
      case 'contact': output(`${profile.email}\ngithub.com/${profile.githubUsername}`); break;
      case 'github': window.open(`https://github.com/${profile.githubUsername}`, '_blank', 'noopener,noreferrer'); output('Opening GitHub in a new browser tab...'); break;
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
      case 'matrix': unlockAchievement('matrix'); setMatrix(true); output('Wake up, Alistair...'); setTimeout(() => setMatrix(false), 6000); break;
      case 'bsod': triggerBlueScreen(); break; case 'doom': unlockAchievement('doom'); output('Bad command or file name. (Doom is currently in a meeting.)'); break;
      case 'daggerfall': open('daggerfall'); output('Opening The Elder Scrolls II: Daggerfall...'); break;
      default: {
        const repo = repos.find(item => item.name.toLowerCase() === raw.toLowerCase());
        const study = repo ? getCaseStudyForRepository(repo) : undefined;
        if (repo && study) { open('project', { repo }, `${study.title} - Project Properties`); output(`Opening ${study.title} case study...`); }
        else output(`'${command}' is not recognized as an internal or external command,\noperable program or batch file.`);
      }
    }
  };
  return <div className={`cmd-app app-fill ${matrix ? 'matrix' : ''}`} onClick={event => (event.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
    {matrix && <MatrixRain />}
    <div className="cmd-lines">{lines.map((line, index) => <div key={index}>{line || '\u00a0'}</div>)}</div>
    <form onSubmit={run}><label>{cwd}&gt;</label><input autoFocus value={input} onChange={event => setInput(event.target.value)} aria-label="Command" autoComplete="off" /></form><div ref={end} />
  </div>;
}
