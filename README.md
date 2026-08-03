# Alistair Portfolio XP

An interactive portfolio that behaves like a compact Windows XP-inspired operating system in the browser. It includes a startup sequence, desktop, window manager, Start menu, taskbar, live GitHub Explorer, README Notepad, internal tabbed browser, portfolio applications, an embedded Space Cadet Pinball app, accessibility settings, sound, and a handful of harmless easter eggs.

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
- `featuredProjects.ts` — GitHub repository names to pin, in preferred order
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

- The current wallpaper is `public/assets/wallpapers/rolling-hills.jpg`.
- The shared icon map lives in `src/components/common/IconGlyph.tsx`. Web-sized icons are in `public/assets/icons/ui/`; the full-resolution source collection is preserved in `assets/icon-library/` and is excluded from the deployed bundle.
- Sound cues are local `.wav` files in `public/assets/sounds/`, mapped by event and volume in `src/hooks/useSound.ts`. Replace a file or adjust the manifest there to customise a cue. Browser autoplay rules mean lifecycle audio begins only after the visitor's first interaction.

Do not hotlink runtime assets: keep them beneath `public/assets/` so the site remains reliable and deployable.

## GitHub integration and caching

`src/services/github.ts` loads every page of public repositories for `alistairbishop06` with `per_page=100`, excludes forks by default, applies local featured-project ordering, and sorts remaining repositories by update time, stars and name. The Explorer View menu can reveal forks.

Successful repository responses are cached in `localStorage` for 30 minutes. READMEs are cached for two hours. If GitHub is rate-limited or offline, the most recent cache is used and marked as stale. Without a cache, the Explorer shows the API error and a Retry button. No client-side token is used or exposed.

To raise API limits in production, proxy GitHub requests through a serverless function and keep `GITHUB_TOKEN` only in that server-side environment. Never place it in a `VITE_` variable because Vite exposes those variables to the browser.

README lookup supports `README.md`, `README.MD`, `readme.md`, `README`, and `readme.txt`. Notepad defaults to plain text and offers safe GFM rendering with raw HTML disabled.

## Deployment discovery and iframe restrictions

The Deployed Websites folder shows one entry for each non-fork repository with a valid external URL in GitHub's Website (`homepage`) field. It does not invent GitHub Pages addresses or scrape links from READMEs. Duplicate website URLs are removed. Entries in `src/data/deployedWebsites.ts` can rename, describe, iconise or feature a matching repository, but cannot create an extra website by themselves.

Modern sites commonly send `X-Frame-Options` or Content Security Policy headers that prohibit iframes. Internet Explorer therefore always creates an internal tab and shows its real address. GitHub links open as a local repository information page; deployment links attempt the live iframe and include a visible fallback control. The information page has an explicit “Open in real browser” button.

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

`vite.config.ts` uses a relative base, so the production files work in a repository subpath. Build with `npm run build` and publish `dist/` using GitHub Actions or a Pages action. Ensure Pages serves `index.html` for the entry route.

## Useful interactions

- Double-click (or double-tap) desktop icons; single-click selects.
- Right-click the desktop for Refresh and Display Properties.
- Taskbar buttons focus, minimise and restore their windows.
- The Run dialog supports `projects`, `websites`, `about`, `contact`, `cv`, `github`, `notepad`, `iexplore`, `cmd`, `control`, `help`, `pinball`, and `winver`.
- Command Prompt supports the commands listed by `help` plus `matrix`, `bsod`, and a deliberately disappointing `doom`.
- Enter the Konami code for a secret desktop effect; click the clock five times for Minesweeper.

Sound starts only after the first pointer or keyboard interaction, respecting browser autoplay policy. Reduced motion, keyboard focus, high contrast, scalable text and larger pointer options are supported.
