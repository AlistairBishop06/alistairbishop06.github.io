import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cvDocumentPlugin from './scripts/cv-document-plugin.mjs';

export default defineConfig({
  plugins: [react(), cvDocumentPlugin()],
  base: './',
});
