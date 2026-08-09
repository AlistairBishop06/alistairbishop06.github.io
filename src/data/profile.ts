import type { IconName } from '../types';

export const profile = {
  name: 'Alistair Bishop',
  username: 'Alistair',
  profileImage: './assets/images/AlistairProfile.jpg',
  headline: 'Computer Science student',
  university: 'University of Exeter',
  location: 'Leckhampstead, Berkshire, United Kingdom',
  email: 'alistairbishop@gmx.co.uk',
  portfolioUrl: 'alistairbishop06.github.io',
  githubUsername: 'alistairbishop06',
  summary: 'Computer Science student building end-to-end software across full-stack web, games, computer vision and networked systems. I turn ambitious ideas into working products - from real-time vision pipelines and multiplayer games to database-backed web applications.', 
  disciplines: [ 'Software Engineering', 'Full-Stack Development', 'Game Development', 'Computer Vision', 'Networking & Systems', 'Digital Marketing & SEO' ], 
  recruiter: { 
    availability: 'Open to 2026–27 software engineering internships and placement opportunities', 
    targetRoles: [ 'Software Engineer', 'Full-Stack Developer', 'Frontend Engineer', 'Game Developer', 'Computer Vision Engineer' ], 
    strengths: [ 'Ships end-to-end projects - from architecture and implementation through testing, deployment and iteration.', 'Works across Python, C#, Java, SQL and modern web technologies, with experience spanning frontend, backend, databases and real-time systems.', 'Combines engineering with product thinking - building software around the user rather than the technology alone.', 'Professional experience across network engineering and digital marketing, bringing both technical depth and strong communication skills.' ], 
    quickFacts: [ { label: 'Education', value: 'BSc Computer Science · University of Exeter' }, 
      { label: 'Engineering', value: 'Full-stack · Games · Computer Vision · Networks' }, 
      { label: 'Professional', value: 'Network Engineering · Digital Marketing' }, 
      { label: 'Leadership', value: 'Python Workshop Leader' } 
    ],
  },
  // Icon names are registered in src/components/common/IconGlyph.tsx.
  interests: [
    {
      title: 'Human-computer interaction',
      description: 'I enjoy exploring new ways for people to interact naturally with computer systems, particularly through technologies such as hand, gesture and eye tracking.',
      icon: 'display',
    },
    {
      title: 'Retro computing',
      description: 'I build emulators for classic Nintendo consoles, experiment with deep-learning agents that teach themselves to play games, and collect and restore original 80s and 90s hardware in my spare time.',
      icon: 'paint',
    },
    {
      title: 'Computer hardware',
      description: 'I have a passion for computer hardware, from experimenting with VR headsets and peripherals to designing and building custom PCs for friends and family.',
      icon: 'computer',
    },
    {
      title: 'Hiking',
      description: 'Some of the best experiences happen away from a screen. I enjoy long hiking weekends that give me the chance to explore new places, spend time outdoors and properly disconnect.',
      icon: 'globe',
    },
  ] satisfies Array<{ title: string; description: string; icon: IconName }>,
};
