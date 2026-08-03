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
  summary: 'I build practical, playful software across the web, games, computer vision and networking. I enjoy turning technically ambitious ideas into clear, useful experiences.',
  disciplines: ['Software development', 'Game development', 'Web development', 'Computer vision', 'Networking', 'Digital marketing'],
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
