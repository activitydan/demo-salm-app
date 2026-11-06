import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: la build funziona da qualsiasi cartella o sottocartella del server
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5180, host: true },
  preview: { port: 5181, host: true },
  build: { chunkSizeWarningLimit: 1600 },
});
