import wallpaperFiles from 'virtual:wallpapers';

const legacyWallpaperIds: Record<string, string> = {
  hills: 'Bliss.jpg',
};

export const wallpapers = wallpaperFiles;
export const defaultWallpaperId = wallpapers.find(wallpaper => wallpaper.fileName.toLowerCase() === 'bliss.jpg')?.id
  || wallpapers[0]?.id
  || '';

export function resolveWallpaper(id: string) {
  const resolvedId = legacyWallpaperIds[id] || id;
  return wallpapers.find(wallpaper => wallpaper.id === resolvedId)
    || wallpapers.find(wallpaper => wallpaper.id === defaultWallpaperId);
}
