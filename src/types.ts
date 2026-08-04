export type WindowKind =
  | 'projects' | 'websites' | 'about' | 'cv' | 'computer' | 'browser'
  | 'contact' | 'recycle' | 'control' | 'display' | 'notepad' | 'cmd'
  | 'run' | 'shutdown' | 'message' | 'help' | 'search' | 'documents'
  | 'recent' | 'email' | 'mines' | 'pinball' | 'daggerfall' | 'winver' | 'welcome' | 'project' | 'achievements';

export interface Rect { x: number; y: number; width: number; height: number }

export interface XPWindow {
  id: string;
  kind: WindowKind;
  title: string;
  icon?: IconName;
  rect: Rect;
  restoreRect?: Rect;
  minimized: boolean;
  maximized: boolean;
  z: number;
  payload?: Record<string, unknown>;
}

export type IconName =
  | 'folder' | 'websites' | 'about' | 'cv' | 'computer' | 'browser'
  | 'contact' | 'recycle' | 'recycle-empty' | 'control' | 'notepad' | 'cmd' | 'document'
  | 'network' | 'sound' | 'search' | 'help' | 'drive' | 'skills' | 'mail'
  | 'paint' | 'info' | 'error' | 'user' | 'windows' | 'globe' | 'app'
  | 'mute' | 'display' | 'mouse' | 'accessibility' | 'date' | 'programs'
  | 'run' | 'mines' | 'save' | 'printer' | 'back' | 'forward' | 'up'
  | 'refresh' | 'stop' | 'home' | 'favorites' | 'go' | 'restore'
  | 'delete' | 'standby' | 'power' | 'restart' | 'documents' | 'recent'
  | 'properties' | 'new-folder' | 'logoff' | 'copy' | 'pinball';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  visibility: string;
  updated_at: string;
  homepage: string | null;
  has_pages: boolean;
  default_branch: string;
}

export interface DeployedWebsite {
  name: string;
  url: string;
  description?: string;
  icon?: string;
  repository?: string;
  featured?: boolean;
}

export interface BrowserTarget {
  title: string;
  url: string;
  description?: string;
  repo?: GitHubRepo;
  readme?: string;
  repository?: string;
}
