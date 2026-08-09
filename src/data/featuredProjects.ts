// This list controls only which repositories appear in the Featured view.
// Their titles, descriptions, case studies and skills are generated from GitHub.
export const featuredProjects = [
  'Simpsons-Episode-Archive',
  'YoutubeShort-Ranked-Video-Maker',
  'Chaos-Chess',
  'World-Generator-and-Explorer',
];

export const featuredProjectNames = new Set(featuredProjects.map(name => name.toLowerCase()));
