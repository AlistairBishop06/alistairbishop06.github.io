import { useState } from 'react';
import { profile } from '../../data/profile';
import { education } from '../../data/education';
import { experience } from '../../data/experience';
import { skillGroups } from '../../data/skills';
import { MenuBar } from '../common/MenuBar';

export function WordPadCV() {
  const [zoom, setZoom] = useState(90);
  const saveHtml = () => {
    const documentHtml = `<!doctype html><meta charset="utf-8"><title>${profile.name} CV</title><body>${document.querySelector('.cv-paper')?.innerHTML || ''}</body>`;
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(new Blob([documentHtml], { type: 'text/html' }));
    anchor.download = 'alistair-bishop-cv.html'; anchor.click(); URL.revokeObjectURL(anchor.href);
  };
  const download = async () => {
    try {
      const response = await fetch('./documents/alistair-bishop-cv.pdf', { method: 'HEAD' });
      if (!response.ok) throw new Error();
      const anchor = document.createElement('a'); anchor.href = './documents/alistair-bishop-cv.pdf'; anchor.download = 'alistair-bishop-cv.pdf'; anchor.click();
    } catch { saveHtml(); }
  };
  return <div className="wordpad app-fill">
    <MenuBar menus={[{ label: 'File', items: [{ label: 'Save As...', action: saveHtml }, { label: 'Print...', action: () => window.print() }] }, { label: 'Edit' }, { label: 'View' }, { label: 'Insert' }, { label: 'Format' }, { label: 'Help' }]} />
    <div className="wordpad-toolbar"><button onClick={saveHtml} title="Save">💾</button><button onClick={() => window.print()} title="Print">🖨️</button><i /><select aria-label="Font"><option>Arial</option><option>Times New Roman</option></select><select aria-label="Font size"><option>10</option><option>12</option><option>14</option></select><button><b>B</b></button><button><i>I</i></button><button><u>U</u></button><button onClick={download} className="download-cv">⬇ Download CV</button></div>
    <div className="ruler"><span /><span /><span /><span /><span /><span /><span /></div>
    <div className="document-workspace"><article className="cv-paper" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
      <header><h1>{profile.name}</h1><p>{profile.headline} · {profile.university}</p><p>{profile.email} · github.com/{profile.githubUsername}</p></header>
      <h2>Profile</h2><p>{profile.summary}</p>
      <h2>Experience</h2>{experience.map(item => <section key={item.role}><div><h3>{item.role}</h3><strong>{item.period}</strong></div><em>{item.organisation}</em><p>{item.details}</p></section>)}
      <h2>Education</h2>{education.map(item => <section key={item.qualification}><div><h3>{item.qualification}</h3><strong>{item.period}</strong></div><em>{item.institution}</em><p>{item.details}</p></section>)}
      <h2>Technical Skills</h2>{skillGroups.map(group => <p key={group.name}><b>{group.name}:</b> {group.items.join(' · ')}</p>)}
    </article></div>
    <div className="wordpad-status"><span>Page 1</span><span>English (United Kingdom)</span><label>Zoom <input type="range" min="60" max="130" value={zoom} onChange={event => setZoom(Number(event.target.value))} /> {zoom}%</label></div>
  </div>;
}
