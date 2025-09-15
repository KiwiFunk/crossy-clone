import { defineConfig } from 'vite';

export default defineConfig({
  base: '/crossy-clone/',
  root: './',
  build: {
    outDir: 'dist',
  },
  server: {
    open: true
  }
});