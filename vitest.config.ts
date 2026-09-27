import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
import { readAppVersion } from './scripts/app-version.js';

export default defineConfig({
  resolve: {
    alias: {
      '@indizio/puzzle': fileURLToPath(new URL('./packages/puzzle/src/index.ts', import.meta.url)),
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
    },
  },
  // Wie beim Bauen, sonst laeuft der Footer im Test ins Leere.
  define: { __APP_VERSION__: JSON.stringify(readAppVersion().text) },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 60000,
  },
});
