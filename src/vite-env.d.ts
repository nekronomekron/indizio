/// <reference types="vite/client" />

/**
 * The game's version, filled in from `package.json` at build time. Read in
 * one place only: `src/app/shared/version.ts`.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- Vite's define() convention.
declare const __APP_VERSION__: string;
