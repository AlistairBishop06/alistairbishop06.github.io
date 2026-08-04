import type { IconName, WindowKind } from '../types';

export type AchievementCategory = 'Portfolio Tour' | 'Hidden Secrets';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  hint: string;
  category: AchievementCategory;
  icon: IconName;
  action?: { kind: WindowKind; label: string };
}

export const achievements = [
  { id: 'booted', title: 'Welcome to Portfolio XP', description: 'Booted the operating system and met Alistair.', hint: 'Start Portfolio XP.', category: 'Portfolio Tour', icon: 'windows', action: { kind: 'welcome', label: 'Start here' } },
  { id: 'achievement_hunter', title: 'Achievement Hunter', description: 'Opened the Achievements guide.', hint: 'Open Achievements from the desktop or Start menu.', category: 'Portfolio Tour', icon: 'favorites', action: { kind: 'achievements', label: 'Open guide' } },
  { id: 'projects_opened', title: 'First Look', description: 'Opened Alistair’s curated project collection.', hint: 'Open My Projects.', category: 'Portfolio Tour', icon: 'folder', action: { kind: 'projects', label: 'View projects' } },
  { id: 'case_study_opened', title: 'Under the Hood', description: 'Opened a featured Project Properties case study.', hint: 'Double-click a featured project.', category: 'Portfolio Tour', icon: 'app', action: { kind: 'projects', label: 'Choose a project' } },
  { id: 'all_projects', title: 'The Full Archive', description: 'Looked beyond the featured work at every public repository.', hint: 'Use the All Projects toggle in My Projects.', category: 'Portfolio Tour', icon: 'folder', action: { kind: 'projects', label: 'Browse projects' } },
  { id: 'readme_opened', title: 'Read the Manual', description: 'Opened a project README in Notepad.', hint: 'Use Read README inside a case study, or open a non-featured repository.', category: 'Portfolio Tour', icon: 'notepad', action: { kind: 'projects', label: 'Find a README' } },
  { id: 'live_demo', title: 'Ship It', description: 'Launched one of Alistair’s deployed projects.', hint: 'Choose Launch Live Demo inside a case study.', category: 'Portfolio Tour', icon: 'websites', action: { kind: 'projects', label: 'Find a live demo' } },
  { id: 'websites_opened', title: 'Now Online', description: 'Explored the collection of deployed websites.', hint: 'Open Deployed Websites.', category: 'Portfolio Tour', icon: 'websites', action: { kind: 'websites', label: 'View live work' } },
  { id: 'about_opened', title: 'User Profile', description: 'Visited Alistair’s About Me properties.', hint: 'Open About Me.', category: 'Portfolio Tour', icon: 'about', action: { kind: 'about', label: 'About Alistair' } },
  { id: 'cv_opened', title: 'Qualified', description: 'Opened Alistair’s current CV.', hint: 'Open My CV.', category: 'Portfolio Tour', icon: 'cv', action: { kind: 'cv', label: 'View CV' } },
  { id: 'documents_opened', title: 'Paper Trail', description: 'Explored the portfolio documents folder.', hint: 'Open My Documents.', category: 'Portfolio Tour', icon: 'documents', action: { kind: 'documents', label: 'Open documents' } },
  { id: 'contact_opened', title: 'Let’s Talk', description: 'Found Alistair’s contact details and social links.', hint: 'Open Contact Me.', category: 'Portfolio Tour', icon: 'contact', action: { kind: 'contact', label: 'Make contact' } },
  { id: 'contact_action', title: 'Connection Established', description: 'Copied the email address or followed a professional profile link.', hint: 'Use an action in Contact Me.', category: 'Portfolio Tour', icon: 'network', action: { kind: 'contact', label: 'Contact actions' } },
  { id: 'customized', title: 'Make It Yours', description: 'Applied a different Portfolio XP appearance setting.', hint: 'Change the wallpaper or colour scheme in Display Properties.', category: 'Portfolio Tour', icon: 'display', action: { kind: 'display', label: 'Personalise' } },

  { id: 'terminal_opened', title: 'Power User', description: 'Found and opened Command Prompt.', hint: 'Start → Run, then type cmd.', category: 'Hidden Secrets', icon: 'cmd', action: { kind: 'run', label: 'Open Run' } },
  { id: 'matrix', title: 'Follow the White Rabbit', description: 'Activated Matrix mode in Command Prompt.', hint: 'A certain 1999 film has the command you need.', category: 'Hidden Secrets', icon: 'cmd', action: { kind: 'cmd', label: 'Open terminal' } },
  { id: 'bsod', title: 'Task Failed Successfully', description: 'Triggered the harmless Portfolio XP blue screen.', hint: 'Command Prompt understands a classic four-letter Windows failure.', category: 'Hidden Secrets', icon: 'error', action: { kind: 'cmd', label: 'Open terminal' } },
  { id: 'doom', title: 'Can It Run Doom?', description: 'Asked Portfolio XP the most important compatibility question.', hint: 'Try the obvious game title in Command Prompt.', category: 'Hidden Secrets', icon: 'app', action: { kind: 'cmd', label: 'Open terminal' } },
  { id: 'minesweeper', title: 'Clockwork Mines', description: 'Discovered the secret Minesweeper game.', hint: 'The taskbar clock rewards persistent clicking.', category: 'Hidden Secrets', icon: 'mines' },
  { id: 'pinball', title: 'Space Cadet', description: 'Launched the classic 3D Pinball experience.', hint: 'Open 3D Pinball from the desktop.', category: 'Hidden Secrets', icon: 'pinball', action: { kind: 'pinball', label: 'Play Pinball' } },
  { id: 'konami', title: 'Meadow Party Mode', description: 'Entered the Konami code on the desktop.', hint: 'Up, Up, Down, Down, Left, Right, Left, Right, B, A.', category: 'Hidden Secrets', icon: 'paint' },
  { id: 'computer_clicks', title: 'One Computer Is Enough', description: 'Tried very hard to open My Computer repeatedly.', hint: 'Open the My Computer desktop icon four times.', category: 'Hidden Secrets', icon: 'computer', action: { kind: 'computer', label: 'My Computer' } },
  { id: 'recycle_empty', title: 'Digital Spring Cleaning', description: 'Emptied the portfolio Recycle Bin.', hint: 'The deleted files are waiting in Recycle Bin.', category: 'Hidden Secrets', icon: 'recycle', action: { kind: 'recycle', label: 'Recycle Bin' } },
  { id: 'winver', title: 'Version Historian', description: 'Found the Portfolio XP version information.', hint: 'Run the traditional Windows version command.', category: 'Hidden Secrets', icon: 'windows', action: { kind: 'run', label: 'Open Run' } },
  { id: 'restart', title: 'Have You Tried Rebooting?', description: 'Restarted Portfolio XP.', hint: 'Use Turn Off Computer and choose Restart.', category: 'Hidden Secrets', icon: 'restart' },
  { id: 'shutdown', title: 'It Is Now Safe', description: 'Shut Portfolio XP down completely.', hint: 'Use Turn Off Computer and choose Turn Off.', category: 'Hidden Secrets', icon: 'power' },
] as const satisfies readonly AchievementDefinition[];

export type AchievementId = typeof achievements[number]['id'];
export type AchievementProgress = Partial<Record<AchievementId, string>>;

export const achievementById = new Map<AchievementId, AchievementDefinition>(achievements.map(item => [item.id, item]));

export const windowAchievements: Partial<Record<WindowKind, AchievementId>> = {
  achievements: 'achievement_hunter',
  projects: 'projects_opened',
  project: 'case_study_opened',
  websites: 'websites_opened',
  about: 'about_opened',
  cv: 'cv_opened',
  documents: 'documents_opened',
  contact: 'contact_opened',
  cmd: 'terminal_opened',
  mines: 'minesweeper',
  pinball: 'pinball',
  winver: 'winver',
};
