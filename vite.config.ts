import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { parseAppVersion } from './scripts/app-version.js';
// Als Import und nicht ueber fs gelesen: nur so zaehlt die package.json fuer
// Vite als Abhaengigkeit der Konfiguration, und der Entwicklungsserver startet
// nach `npm run bump` von selbst neu. Mit fs zeigte der Footer bis zum
// naechsten Handgriff die alte Nummer.
import packageJson from './package.json';

// Die Versionsnummer wird beim Bauen eingesetzt, nicht zur Laufzeit gelesen:
// ein falsches Format faellt damit hier auf und nicht erst im Footer.
const version = parseAppVersion(packageJson.version);

export default defineConfig({
  plugins: [react()],
  base: './',
  define: { __APP_VERSION__: JSON.stringify(version.text) },
  resolve: {
    alias: {
      '@indizio/puzzle/i18n': fileURLToPath(new URL('./packages/puzzle/src/i18n/index.ts', import.meta.url)),
      '@indizio/puzzle': fileURLToPath(new URL('./packages/puzzle/src/index.ts', import.meta.url)),
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
    },
  },
  worker: { format: 'es' },
  build: { target: 'es2022' },
});
