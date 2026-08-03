import { useState } from 'react';
import { skillGroups } from '../../data/skills';
import { experience } from '../../data/experience';
import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';
import { ExplorerShell, type ExplorerView } from './ExplorerShell';

const drives = [
  { id: 'c', name: 'Local Disk (C:)', detail: 'Portfolio system files', used: 72, icon: 'drive' as const },
  { id: 'p', name: 'Projects (P:)', detail: 'GitHub repositories', used: 61, icon: 'drive' as const },
  { id: 's', name: 'Skills (S:)', detail: 'Languages and tools', used: 84, icon: 'skills' as const },
  { id: 'e', name: 'Experience (E:)', detail: 'Work experience', used: 49, icon: 'drive' as const },
  { id: 'n', name: 'My Network Places', detail: 'Contact and social links', used: 35, icon: 'network' as const },
];
export function MyComputer() {
  const [view, setView] = useState<ExplorerView>('large');
  const [selected, setSelected] = useState('');
  const { open } = useSystem();
  const launch = (id: string) => {
    const actions: Record<string, () => void> = {
      c: () => open('documents'), p: () => open('projects'),
      s: () => open('control', { panel: 'programs' }), e: () => open('about'), n: () => open('contact'),
    };
    actions[id]?.();
  };
  return <ExplorerShell title="My Computer" address="My Computer" count={drives.length} view={view} setView={setView}>
    <h3 className="file-group-title">Files Stored on This Computer</h3>
    <button className="file-item" onDoubleClick={() => open('documents')}><IconGlyph name="folder" size={40} /><span className="file-name">Alistair's Documents</span><span className="file-description">C:\\Documents and Settings\\Alistair</span></button>
    <h3 className="file-group-title">Hard Disk Drives</h3>
    {drives.map(drive => <button key={drive.id} className={`file-item drive-item ${selected === drive.id ? 'selected' : ''}`} onClick={() => setSelected(drive.id)} onDoubleClick={() => launch(drive.id)}>
      <IconGlyph name={drive.icon} size={42} /><span className="file-name">{drive.name}</span><span className="file-type">{drive.detail}</span><span className="drive-usage"><i style={{ width: `${drive.used}%` }} /></span><span className="file-description">{100 - drive.used} GB free of 100 GB</span>
    </button>)}
    <div hidden>{skillGroups.length + experience.length}</div>
  </ExplorerShell>;
}
