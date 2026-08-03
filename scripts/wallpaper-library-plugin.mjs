import { existsSync, readdirSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const virtualModuleId = 'virtual:wallpapers';
const resolvedVirtualModuleId = `\0${virtualModuleId}`;
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const wallpapersDirectory = join(projectRoot, 'public', 'assets', 'wallpapers');
const supportedExtensions = new Set(['.avif', '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);

function createLabel(fileName) {
  return fileName
    .slice(0, -extname(fileName).length)
    .replace(/[-_]+/g, ' ')
    .replace(/([a-zA-Z])(\d+)/g, '$1 $2')
    .replace(/\b\w/g, character => character.toUpperCase());
}

function findWallpapers() {
  if (!existsSync(wallpapersDirectory)) return [];
  return readdirSync(wallpapersDirectory, { withFileTypes: true })
    .filter(entry => entry.isFile() && supportedExtensions.has(extname(entry.name).toLowerCase()))
    .map(entry => ({
      id: entry.name,
      fileName: entry.name,
      label: createLabel(entry.name),
      url: `./assets/wallpapers/${encodeURIComponent(entry.name)}`,
    }))
    .sort((left, right) => left.fileName.localeCompare(right.fileName, undefined, { numeric: true }));
}

export default function wallpaperLibraryPlugin() {
  return {
    name: 'wallpaper-library',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
    },
    load(id) {
      if (id !== resolvedVirtualModuleId) return;
      const wallpapers = findWallpapers();
      this.info(`Wallpapers: ${wallpapers.length}`);
      return `export default ${JSON.stringify(wallpapers)};`;
    },
    configureServer(server) {
      server.watcher.add(wallpapersDirectory);
      const reloadWallpapers = file => {
        const sameDirectory = dirname(resolve(file)).toLowerCase() === wallpapersDirectory.toLowerCase();
        if (!sameDirectory || !supportedExtensions.has(extname(file).toLowerCase())) return;
        const module = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', reloadWallpapers);
      server.watcher.on('change', reloadWallpapers);
      server.watcher.on('unlink', reloadWallpapers);
    },
  };
}
