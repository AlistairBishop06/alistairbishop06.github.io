# Alistair Portfolio XP

An interactive portfolio that behaves like a compact Windows XP-inspired operating system in the browser. It includes a startup sequence, desktop, window manager, Start menu, taskbar, live GitHub Explorer, README Notepad, internal tabbed browser, portfolio applications, embedded Space Cadet Pinball and Minesweeper games, accessibility settings, sound, and a handful of harmless easter eggs.

The hill wallpaper was generated specifically for this project, while the supplied XP icon and sound collections are stored locally. No image or audio is hotlinked at runtime.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the URL printed by Vite. To check the production build:

```bash
npm run typecheck
npm run build
npm run preview
```

## Personalise the portfolio

All core personal data lives in `src/data/`:

- `profile.ts` — name, headline, summary, email and GitHub username
- `education.ts` and `experience.ts` — CV/About entries
- `skills.ts` — installed technologies and skills
- `socialLinks.ts` — GitHub, LinkedIn and portfolio links
- `featuredProjects.ts` — featured order derived from the case-study collection
- `caseStudies.ts` — featured-project titles, summaries, decisions, challenges, results, links and screenshots
- `achievements.ts` — guided-tour and secret achievement definitions, hints, icons and launch actions
- `deployedWebsites.ts` — manually curated deployments

Each manual website entry supports:

```ts
{
  name: string;
  url: string;
  description?: string;
  icon?: string;
  repository?: string;
  featured?: boolean;
}
```

Add, remove or reorder entries in that file. Featured entries sort ahead of automatically discovered sites.

### Profile image

Put the image in `public/assets/images/`, then set `profileImage` in `src/data/profile.ts`. The same image is used by the About Me window and Start menu.

### CV

Place one PDF in:

```text
public/documents/
```

The filename can be anything. The CV resolver discovers it automatically and uses the real PDF for the embedded viewer, download, and print actions. If several PDFs are present, the most recently modified one is selected. Development reloads when that PDF changes; production selects it during each build.

### Icons, wallpaper and sounds

- Display Properties automatically lists every supported image in `public/assets/wallpapers/` (`.avif`, `.bmp`, `.gif`, `.jpeg`, `.jpg`, `.png`, `.svg`, and `.webp`). Filenames become readable option labels, and changes reload the development site automatically.
- The shared icon map lives in `src/components/common/IconGlyph.tsx`. Web-sized icons are in `public/assets/icons/ui/`; the full-resolution source collection is preserved in `assets/icon-library/` and is excluded from the deployed bundle.
- Sound cues are local `.wav` files in `public/assets/sounds/`, mapped by event and volume in `src/hooks/useSound.ts`. Replace a file or adjust the manifest there to customise a cue. Browser autoplay rules mean lifecycle audio begins only after the visitor's first interaction.

Do not hotlink runtime assets: keep them beneath `public/assets/` so the site remains reliable and deployable.

## GitHub integration and caching

`src/services/github.ts` loads every page of public repositories for `alistairbishop06` with `per_page=100`, excludes forks by default, applies local featured-project ordering, and sorts remaining repositories by update time, stars and name. The Explorer View menu can reveal forks.

Successful repository responses are cached in `localStorage` for 30 minutes. READMEs are cached for two hours. If GitHub is rate-limited or offline, the most recent cache is used and marked as stale. Without a cache, the Explorer shows the API error and a Retry button. No client-side token is used or exposed.

To raise API limits in production, proxy GitHub requests through a serverless function and keep `GITHUB_TOKEN` only in that server-side environment. Never place it in a `VITE_` variable because Vite exposes those variables to the browser.

README lookup supports `README.md`, `README.MD`, `readme.md`, `README`, and `readme.txt`. Notepad defaults to plain text and offers safe GFM rendering with raw HTML disabled.

Featured repositories open as modular Project Properties case studies. Their order and presentation come from `src/data/caseStudies.ts`; every other repository still opens its README in Notepad. Visitors see Featured projects by default and can switch to All Projects from the Explorer toolbar.

To add real project images, place them in `public/assets/projects/` and add entries to the relevant case study:

```ts
screenshots: [
  {
    src: './assets/projects/my-project.png',
    alt: 'Accessible description of the project screen',
    caption: 'What this screen demonstrates.',
  },
]
```

The Screenshots tab appears automatically when at least one image is configured.

## Achievements and guided tour

The Achievements desktop application tracks portfolio exploration and easter eggs in the visitor's browser. Definitions live in `src/data/achievements.ts`; unlock timestamps are saved under the `xp-achievements` local-storage key. Core window launches are mapped centrally through `windowAchievements`, while interaction-specific achievements call `unlockAchievement(...)` where the action succeeds.

Add an achievement to the data collection first, then use its inferred `AchievementId` wherever it should unlock. Newly unlocked achievements display an XP-style notification and appear immediately in the guide.

## Hosted Daggerfall secret

Typing `daggerfall` in Command Prompt opens a hosted browser version of the game. The portfolio does not redistribute the game archive or include a local DOS emulator. DOS Zone currently restricts both its game bundle and catalogue page to its own approved origins, so it cannot be framed by GitHub Pages; the embedded player uses PlayClassic's frame-compatible game canvas and clips away the surrounding catalogue page.

## Deployment discovery and iframe restrictions

The Deployed Websites folder shows one entry for each non-fork repository with a valid external URL in GitHub's Website (`homepage`) field. It does not invent GitHub Pages addresses or scrape links from READMEs. Duplicate website URLs are removed. Entries in `src/data/deployedWebsites.ts` can rename, describe, iconise or feature a matching repository, but cannot create an extra website by themselves.

Modern sites commonly send `X-Frame-Options` or Content Security Policy headers that prohibit iframes. GitHub projects first open their README in Notepad; the green “CLICK ME” button then opens the repository in a real browser tab. Internet Explorer starts at Google's iframe-compatible homepage, while deployment links attempt the live internal iframe and include a visible fallback control.

## Contact form

Set `VITE_CONTACT_ENDPOINT` to a Formspree, Web3Forms-compatible, or similar JSON endpoint:

```text
VITE_CONTACT_ENDPOINT=https://formspree.io/f/your-id
```

Without this setting, validation still works and submission displays a setup message rather than pretending to send.

## Deploy

### Vercel

Import the repository in Vercel. The included `vercel.json` provides the SPA fallback. Build command: `npm run build`; output directory: `dist`.

### GitHub Pages

The included `.github/workflows/deploy-pages.yml` builds the Vite application and publishes only `dist/` whenever `main` is pushed. In the GitHub repository, open **Settings → Pages** and set **Source** to **GitHub Actions**. Do not select `main` as a branch source: that serves the uncompiled `index.html`, which points at `src/main.tsx` and results in a blank page.

For the contact form on GitHub Pages, create a repository variable named `VITE_CONTACT_ENDPOINT` under **Settings → Secrets and variables → Actions → Variables**. The workflow exposes it only during the Vite build.

## Useful interactions

- Double-click (or double-tap) desktop icons; single-click selects.
- Right-click the desktop for Refresh and Display Properties.
- Taskbar buttons focus, minimise and restore their windows.
- The Run dialog supports `projects`, `websites`, `about`, `contact`, `cv`, `github`, `notepad`, `iexplore`, `cmd`, `control`, `help`, `pinball`, and `winver`.
- Command Prompt supports the commands listed by `help` plus `matrix`, `bsod`, `daggerfall`, and a deliberately disappointing `doom`.
- Enter the Konami code for a secret desktop effect; click the clock five times for Minesweeper.

Sound starts only after the first pointer or keyboard interaction, respecting browser autoplay policy. Reduced motion, keyboard focus, high contrast, scalable text and larger pointer options are supported.
