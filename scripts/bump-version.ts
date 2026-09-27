import { nextAppVersion, readAppVersion, writeAppVersion } from './app-version.js';

/**
 * Zaehlt die Versionsnummer eine Stelle hoch.
 *
 * ```bash
 * npm run bump          # 2026.3 -> 2026.4
 * npm run bump -- --show  # nur anzeigen, nichts aendern
 * ```
 *
 * Bewusst ein eigener Aufruf und nicht an den Bau gehaengt: gebaut wird auch
 * zum Ausprobieren, und dabei aendert sich nichts am Spiel. Die Nummer soll
 * steigen, wenn jemand etwas geaendert hat — das weiss nur der Mensch, der es
 * geaendert hat.
 */

const current = readAppVersion();

if (process.argv.includes('--show')) {
  console.log(current.text);
} else {
  const next = nextAppVersion(current);
  writeAppVersion(next);
  console.log(`Version: ${current.text} -> ${next.text}`);
}
