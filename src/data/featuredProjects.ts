import { caseStudies } from './caseStudies';

// Case-study order is also the featured-project order throughout Portfolio XP.
export const featuredProjects = caseStudies.map(project => project.repository);
