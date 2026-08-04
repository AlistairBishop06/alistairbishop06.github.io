import { lazy, Suspense } from 'react';
import type { BrowserTarget, GitHubRepo, XPWindow } from '../../types';
import { AboutMe, type AboutTab } from './AboutMe';
const ProjectsExplorer = lazy(() => import('./ProjectsExplorer').then(module => ({ default: module.ProjectsExplorer })));
const WebsitesExplorer = lazy(() => import('./WebsitesExplorer').then(module => ({ default: module.WebsitesExplorer })));
const Notepad = lazy(() => import('./Notepad').then(module => ({ default: module.Notepad })));
const InternetExplorer = lazy(() => import('./InternetExplorer').then(module => ({ default: module.InternetExplorer })));
const WordPadCV = lazy(() => import('./WordPadCV').then(module => ({ default: module.WordPadCV })));
const SpaceCadetPinball = lazy(() => import('./SpaceCadetPinball').then(module => ({ default: module.SpaceCadetPinball })));
import { ContactApp } from './ContactApp';
import { MyComputer } from './MyComputer';
import { ControlPanel } from './ControlPanel';
import { DisplayProperties } from './DisplayProperties';
import { RecycleBin } from './RecycleBin';
import { CommandPrompt } from './CommandPrompt';
import { RunDialog } from '../dialogs/RunDialog';
import { ShutdownDialog } from '../dialogs/ShutdownDialog';
import { MessageBox } from '../dialogs/MessageBox';
import { DocumentsApp, EmailApp, HelpApp, Minesweeper, SearchApp, Winver } from './MiscApps';
import { ProjectCaseStudy } from './ProjectCaseStudy';
import { WelcomeApp } from './WelcomeApp';
import { AchievementsApp } from './AchievementsApp';

export function ApplicationRouter({ win, close }: { win: XPWindow; close: () => void }) {
  const payload = win.payload || {};
  let application;
  switch (win.kind) {
    case 'projects': application = <ProjectsExplorer />; break;
    case 'websites': application = <WebsitesExplorer />; break;
    case 'notepad': application = <Notepad repo={payload.repo as GitHubRepo | undefined} file={payload.file as { name: string; url: string } | undefined} />; break;
    case 'browser': application = <InternetExplorer initialTarget={payload.target as BrowserTarget | undefined} requestId={payload.requestId as number | undefined} />; break;
    case 'about': application = <AboutMe initialTab={payload.tab as AboutTab | undefined} />; break; case 'cv': application = <WordPadCV />; break; case 'contact': application = <ContactApp />; break; case 'computer': application = <MyComputer />; break;
    case 'control': application = <ControlPanel initialPanel={payload.panel as string | undefined} />; break; case 'display': application = <DisplayProperties close={close} />; break;
    case 'recycle': application = <RecycleBin />; break; case 'cmd': application = <CommandPrompt close={close} />; break; case 'run': application = <RunDialog close={close} />; break; case 'shutdown': application = <ShutdownDialog close={close} />; break;
    case 'message': application = <MessageBox title={payload.title as string | undefined} message={payload.message as string | undefined} type={payload.type as 'info' | 'error' | undefined} close={close} />; break;
    case 'help': application = <HelpApp />; break; case 'search': application = <SearchApp />; break; case 'documents': application = <DocumentsApp />; break; case 'recent': application = <DocumentsApp recent />; break; case 'email': application = <EmailApp />; break; case 'mines': application = <Minesweeper />; break; case 'pinball': application = <SpaceCadetPinball />; break; case 'winver': application = <Winver />; break;
    case 'project': application = <ProjectCaseStudy projectId={payload.projectId as string | undefined} repo={payload.repo as GitHubRepo | undefined} />; break;
    case 'welcome': application = <WelcomeApp close={close} />; break;
    case 'achievements': application = <AchievementsApp />; break;
    default: application = <div className="missing-app">This application is not installed.</div>;
  }
  return <Suspense fallback={<div className="loading-state"><div className="xp-spinner" />Opening application...</div>}>{application}</Suspense>;
}
