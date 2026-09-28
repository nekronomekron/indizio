import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
import { readAppVersion } from './scripts/app-version.js';

/**
 * Drei Testläufe.
 *
 * `engine` und `app` bleiben zusammen unter einer Minute, damit sie beim
 * Arbeiten wirklich laufen. `deep` nimmt hunderte Seeds über alle Größen,
 * vergleicht mit dem Referenzlöser und prüft Zeitbudgets — der Lauf, der den
 * Generator beweist, aber zu langsam für die Schleife beim Schreiben.
 *
 * `extends: true` in jedem Projekt ist nicht Zierde: ohne diese Zeile erbt ein
 * Projekt **nichts** von hier oben, auch nicht `define`. Der Footer-Test lief
 * dann in ein „__APP_VERSION__ is not defined", obwohl die Ersetzung an dieser
 * Datei sichtbar stand.
 */
const alias = {
  // Reihenfolge zählt: der längere Schlüssel zuerst, sonst schluckt '@engine'
  // die Anfrage nach '@engine/i18n'.
  '@engine/i18n': fileURLToPath(new URL('./src/engine/i18n/index.ts', import.meta.url)),
  '@engine': fileURLToPath(new URL('./src/engine/index.ts', import.meta.url)),
  '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
};

export default defineConfig({
  resolve: { alias },
  // Wie beim Bauen, sonst läuft der Footer im Test ins Leere.
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
