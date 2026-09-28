import { nextAppVersion, readAppVersion, writeAppVersion } from './app-version.js';

/**
 * Counts the version up by one.
 *
 * ```bash
 * npm run bump          # 2026.3 -> 2026.4
 * npm run bump -- --show  # only show, change nothing
 * ```
 *
 * Deliberately a command of its own rather than part of the build: builds also
 * happen just to try things, and the game does not change by that. The number
 * should go up when someone changed something — which only the person who
 * changed it knows.
 */

const current = readAppVersion();

if (process.argv.includes('--show')) {
  console.log(current.text);
} else {
  const next = nextAppVersion(current);
  writeAppVersion(next);
  console.log(`Version: ${current.text} -> ${next.text}`);
}
