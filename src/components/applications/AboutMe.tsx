import { useState } from 'react';
import { profile } from '../../data/profile';
import { experience } from '../../data/experience';
import { education } from '../../data/education';
import { skillGroups } from '../../data/skills';
import { IconGlyph } from '../common/IconGlyph';

const tabs = ['General', 'Education', 'Experience', 'Skills', 'Interests'] as const;
export function AboutMe() {
  const [tab, setTab] = useState<typeof tabs[number]>('General');
  return <div className="properties-app app-fill">
    <div className="property-tabs" role="tablist">{tabs.map(item => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
    <div className="property-page about-page">
      {tab === 'General' && <><div className="about-hero"><div className="profile-placeholder"><IconGlyph name="user" size={62} /></div><div><h1>{profile.name}</h1><p>{profile.headline}</p><p>{profile.university}</p></div></div><div className="bevel-separator" /><p className="about-summary">{profile.summary}</p><dl><dt>Location:</dt><dd>{profile.location}</dd><dt>Focus:</dt><dd>{profile.disciplines.join(', ')}</dd></dl></>}
      {tab === 'Education' && <SectionList items={education.map(item => ({ title: item.qualification, subtitle: `${item.institution} · ${item.period}`, body: item.details }))} />}
      {tab === 'Experience' && <SectionList items={experience.map(item => ({ title: item.role, subtitle: `${item.organisation} · ${item.period}`, body: item.details }))} />}
      {tab === 'Skills' && <div className="skill-groups">{skillGroups.map(group => <section key={group.name}><h3>{group.name}</h3><div>{group.items.map(item => <span key={item}>{item}</span>)}</div></section>)}</div>}
      {tab === 'Interests' && <div className="interest-list">{profile.interests.map((item, index) => <div key={item}><IconGlyph name={(['globe','paint','computer','app'] as const)[index % 4]} size={34} /><span><b>{item}</b><small>Always learning, experimenting and building.</small></span></div>)}</div>}
    </div>
    <div className="dialog-buttons"><button>OK</button><button>Cancel</button><button disabled>Apply</button></div>
  </div>;
}
function SectionList({ items }: { items: Array<{ title: string; subtitle: string; body: string }> }) {
  return <div className="section-list">{items.map(item => <section key={item.title}><IconGlyph name="document" size={32} /><div><h3>{item.title}</h3><strong>{item.subtitle}</strong><p>{item.body}</p></div></section>)}</div>;
}
