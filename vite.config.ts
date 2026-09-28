import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { parseAppVersion } from './scripts/app-version.js';
// Imported rather than read with fs: only then does Vite count package.json as
// a dependency of the config, and the dev server restarts by itself after
// `npm run bump`. With fs the footer kept the old number until the next edit.
import packageJson from './package.json';

// The version is filled in at build time, not read at runtime: a wrong format
// fails here rather than in the footer.
const version = parseAppVersion(packageJson.version);

export default defineConfig({
  plugins: [react()],
  base: './',
  define: { __APP_VERSION__: JSON.stringify(version.text) },
  resolve: {
    alias: {
      // Order matters: the longer key first, or '@engine' swallows the
      // request for '@engine/i18n'.
      '@engine/i18n': fileURLToPath(new URL('./src/engine/i18n/index.ts', import.meta.url)),
      '@engine': fileURLToPath(new URL('./src/engine/index.ts', import.meta.url)),
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
    },
  },
  // Stylesheets use kebab-case, components read camelCase (styles.roomLabel).
  css: { modules: { localsConvention: 'camelCaseOnly' } },
  worker: { format: 'es' },
  build: { target: 'es2022' },
});
