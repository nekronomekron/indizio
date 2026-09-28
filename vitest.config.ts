import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
import { readAppVersion } from './scripts/app-version.js';

/**
 * Three test runs.
 *
 * `engine` and `app` together stay under a minute, so they actually get run
 * while working. `deep` takes hundreds of seeds over every size, compares with
 * the reference solver and checks time budgets — the run that proves the
 * generator, but too slow for the loop while writing.
 *
 * `extends: true` in every project is not decoration: without it a project
 * inherits *nothing* from up here, not even `define`. The footer test then ran
 * into "__APP_VERSION__ is not defined" although the replacement was right
 * there in this file.
 */
const alias = {
  // Order matters: the longer key first, or '@engine' swallows the request for
  // '@engine/i18n'.
  '@engine/i18n': fileURLToPath(new URL('./src/engine/i18n/index.ts', import.meta.url)),
  '@engine': fileURLToPath(new URL('./src/engine/index.ts', import.meta.url)),
  '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
};

export default defineConfig({
  resolve: { alias },
  // As in the build, or the footer finds nothing in tests.
  define: { __APP_VERSION__: JSON.stringify(readAppVersion().text) },
  css: { modules: { localsConvention: 'camelCaseOnly' } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'engine',
          environment: 'node',
          include: ['tests/engine/**/*.test.ts'],
          exclude: ['tests/engine/deep/**'],
          testTimeout: 60_000,
        },
      },
      {
        extends: true,
        test: {
          name: 'app',
          environment: 'node',
          // Real class names in rendered markup, so tests read like the CSS.
          css: { include: [/\.module\.css$/], modules: { classNameStrategy: 'non-scoped' } },
          include: ['tests/*.test.ts'],
          testTimeout: 60_000,
        },
      },
      {
        extends: true,
        test: {
          name: 'deep',
          environment: 'node',
          include: ['tests/engine/deep/**/*.test.ts'],
          testTimeout: 600_000,
        },
      },
    ],
  },
});
