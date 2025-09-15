import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/crossy-clone/',
  root: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    // Ensure assets are properly copied
    copyPublicDir: true
  },
  server: {
    open: true
  },
  // Explicitly tell Vite to include .glb files
  assetsInclude: ['**/*.glb']
});