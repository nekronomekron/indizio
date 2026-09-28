/**
 * The game's version, `<year>.<number>`.
 *
 * Filled in at build time from `package.json` — the one place it is kept.
 * `npm run bump` counts it up.
 *
 * This file is the *only* one touching the injected value. The rest of the
 * app imports a plain constant and need know nothing of build magic.
 */
export const APP_VERSION: string = __APP_VERSION__;
