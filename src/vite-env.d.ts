/// <reference types="vite/client" />

/**
 * Versionsnummer des Spiels, beim Bauen aus der `package.json` eingesetzt.
 * Gelesen wird sie nur an einer Stelle: `src/app/version.ts`.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- Vite's define() convention.
declare const __APP_VERSION__: string;
