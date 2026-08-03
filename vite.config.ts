import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cvDocumentPlugin from './scripts/cv-document-plugin.mjs';
import wallpaperLibraryPlugin from './scripts/wallpaper-library-plugin.mjs';

export default defineConfig({
  plugins: [react(), cvDocumentPlugin(), wallpaperLibraryPlugin()],
  base: './',
});
