import { profile } from '../../data/profile';
import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';

export function WelcomeApp({ close }: { close: () => void }) {
  const { open } = useSystem();
  const launch = (kind: 'hire' | 'projects' | 'skills' | 'cv' | 'contact') => open(kind);

  return <div className="welcome-app app-fill">
    <header>
      <img src={profile.profileImage} alt={`${profile.name} profile`} />
      <div><small>WELCOME TO</small><h1>{profile.name}'s Portfolio</h1><p>Computer Science student building interactive web, game and computer-vision systems.</p></div>
    </header>
    <div className="welcome-intro">
      <h2>Where would you like to start?</h2>
    </div>
    <div className="welcome-actions">
      <button className="featured" onClick={() => launch('hire')}><IconGlyph name="contact" size={39} /><span><b>Recruiter Quick View</b><small>Experience, strengths and direct links</small></span></button>
      <button onClick={() => launch('projects')}><IconGlyph name="folder" size={36} /><span><b>Explore Project Case Studies</b><small>See all of my projects, learn their challenges, how I overcame them, and try interactive demos</small></span></button>
      <button onClick={() => launch('skills')}><IconGlyph name="skills" size={36} /><span><b>Skills &amp; Technologies</b><small>Explore my skills and see where I put them to action</small></span></button>
      <button onClick={() => launch('cv')}><IconGlyph name="cv" size={36} /><span><b>View CV</b><small>Read, download, or print my professional CV</small></span></button>
      <button onClick={() => launch('contact')}><IconGlyph name="contact" size={36} /><span><b>Contact Me</b><small>Email, GitHub and LinkedIn</small></span></button>
    </div>
    <footer><span><IconGlyph name="info" size={18} /> Tip: double-click desktop icons to open them.</span><div><button onClick={() => open('achievements')}>Achievements</button><button onClick={close}>Close</button></div></footer>
  </div>;
}
