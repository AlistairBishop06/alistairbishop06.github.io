import { profile } from '../../data/profile';
import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';

export function WelcomeApp({ close }: { close: () => void }) {
  const { open } = useSystem();
  const launch = (kind: 'projects' | 'cv' | 'contact') => open(kind);

  return <div className="welcome-app app-fill">
    <header>
      <img src={profile.profileImage} alt={`${profile.name} profile`} />
      <div><small>WELCOME TO</small><h1>{profile.name}'s Portfolio</h1><p>Computer Science student building interactive web, game and computer-vision systems.</p></div>
    </header>
    <div className="welcome-intro">
      <h2>Where would you like to start?</h2>
      <p>This desktop is an interactive portfolio. Open a project to see the problem, engineering decisions and finished result.</p>
    </div>
    <div className="welcome-actions">
      <button className="featured" onClick={() => launch('projects')}><IconGlyph name="folder" size={39} /><span><b>Explore Featured Work</b><small>Four selected project case studies</small></span></button>
      <button onClick={() => launch('cv')}><IconGlyph name="cv" size={36} /><span><b>View or Download CV</b><small>Education, experience and skills</small></span></button>
      <button onClick={() => launch('contact')}><IconGlyph name="contact" size={36} /><span><b>Contact Me</b><small>Email, GitHub and LinkedIn</small></span></button>
    </div>
    <footer><span><IconGlyph name="info" size={18} /> Tip: double-click desktop icons to open them.</span><div><button onClick={() => open('achievements')}>Achievements</button><button onClick={close}>Close</button></div></footer>
  </div>;
}
