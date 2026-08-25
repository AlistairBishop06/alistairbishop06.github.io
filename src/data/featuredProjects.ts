/**
 * FEATURED PROJECTS - this is the only list you need to edit.
 *
 * Add a GitHub repository name, remove one, or drag the lines into a new order.
 * Names are case-insensitive. Everything on the project page still comes from
 * that repository's README and metadata, so there is no second config to sync.
 */
export const featuredProjects = [
  'Simpsons-Episode-Archive',
  'YoutubeShort-Ranked-Video-Maker',
  'Chaos-Chess',
  'World-Generator-and-Explorer',
] as const;

export const featuredProjectNames = new Set(featuredProjects.map(name => name.toLowerCase()));

export function featuredProjectRank(repositoryName: string) {
  const index = featuredProjects.findIndex(name => name.toLowerCase() === repositoryName.toLowerCase());
  return index < 0 ? undefined : index;
}
