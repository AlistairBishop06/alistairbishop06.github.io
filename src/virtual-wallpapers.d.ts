declare module 'virtual:wallpapers' {
  export interface WallpaperOption {
    id: string;
    fileName: string;
    label: string;
    url: string;
  }

  const wallpapers: WallpaperOption[];
  export default wallpapers;
}
