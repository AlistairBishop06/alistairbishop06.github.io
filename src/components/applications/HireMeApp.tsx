import { profile } from '../../data/profile';
import { socialLinks } from '../../data/socialLinks';
import { skillGroups } from '../../data/skills';
import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';

export function HireMeApp() {
  const { open, unlockAchievement } = useSystem();
  const github = socialLinks.find(link => link.label === 'GitHub');
  const linkedIn = socialLinks.find(link => link.label === 'LinkedIn');
  const coreSkills = skillGroups.flatMap(group => group.items).filter(skill => skill.level === 'Core skill').map(skill => skill.name);
  const openExternal = (url?: string) => {
    if (!url) return;
    unlockAchievement('contact_action');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return <div className="hire-app app-fill">
    <header className="hire-header">
      <img src={profile.profileImage} alt={`${profile.name} profile`} />
      <div><small>RECRUITER QUICK VIEW</small><h1>{profile.name}</h1><p>{profile.headline} at {profile.university}</p></div>
    </header>

    <div className="hire-body">
      <main>
        <section className="hire-introduction">
          <h2>Candidate summary</h2>
          <p>{profile.summary}</p>
          <div className="hire-availability"><IconGlyph name="info" size={26} /><span><b>Current availability</b>{profile.recruiter.availability}</span></div>
        </section>

        <section>
          <h2>What I bring</h2>
          <ul className="hire-strengths">{profile.recruiter.strengths.map(item => <li key={item}>{item}</li>)}</ul>
        </section>

        <section>
          <h2>Core technologies</h2>
          <div className="hire-skill-chips">{coreSkills.map(skill => <button key={skill} onClick={() => open('skills', { skill })}>{skill}</button>)}</div>
        </section>

        <section>
          <h2>Roles of interest</h2>
          <p>{profile.recruiter.targetRoles.join(' · ')}</p>
        </section>
      </main>

      <aside>
        <h2>At a glance</h2>
        <dl>{profile.recruiter.quickFacts.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
        <div className="hire-contact-card"><IconGlyph name="contact" size={30} /><div><b>Contact</b><a href={`mailto:${profile.email}`} onClick={() => unlockAchievement('contact_action')}>{profile.email}</a></div></div>
      </aside>
    </div>

    <footer className="hire-actions">
      <button className="primary" onClick={() => open('projects')}><IconGlyph name="folder" size={20} /> Featured work</button>
      <button onClick={() => open('cv')}><IconGlyph name="cv" size={20} /> View CV</button>
      <button onClick={() => open('contact')}><IconGlyph name="contact" size={20} /> Contact me</button>
      <span />
      <button onClick={() => openExternal(github?.url)}>GitHub ↗</button>
      <button onClick={() => openExternal(linkedIn?.url)}>LinkedIn ↗</button>
    </footer>
  </div>;
}
