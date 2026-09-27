import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Die Versionsnummer des Spiels: `<Jahr>.<Nummer>`, zum Beispiel `2026.4`.
 *
 * Sie steht in der `package.json` und nirgendwo sonst. Eine zweite Stelle
 * hiesse, dass beide auseinanderlaufen koennen — und eine Versionsnummer, der
 * man nicht glauben kann, ist schlimmer als keine.
 *
 * Das Format ist bewusst **nicht** semantisch. Semantische Versionen sagen
 * etwas ueber Vertraege zwischen Programmen zu; das Spiel hat keine Nutzer im
 * Code, sondern Menschen vor dem Bildschirm. Fuer die ist „die vierte Fassung
 * aus diesem Jahr" die nuetzlichere Auskunft.
 */

const PATTERN = /^(\d{4})\.(\d+)$/;

export interface AppVersion {
  year: number;
  number: number;
  text: string;
}

function packageFile(root: string): string {
  return join(root, 'package.json');
}

export function parseAppVersion(text: string): AppVersion {
  const match = PATTERN.exec(text);
  if (!match) throw new Error(`Versionsnummer "${text}" passt nicht auf <Jahr>.<Nummer>`);
  return { year: Number(match[1]), number: Number(match[2]), text };
}

/** Aktuelle Version, gelesen aus der `package.json` des Projektstamms. */
export function readAppVersion(root: string = process.cwd()): AppVersion {
  const raw = JSON.parse(readFileSync(packageFile(root), 'utf8')) as { version?: unknown };
  if (typeof raw.version !== 'string') throw new Error('package.json hat kein Feld "version"');
  return parseAppVersion(raw.version);
}

/**
 * Naechste Version: im selben Jahr eins weiter, im neuen Jahr wieder bei eins.
 *
 * Der Jahreswechsel setzt zurueck, weil die Nummer sonst nichts mehr aussagt —
 * „2027.58" liesse offen, ob 58 Aenderungen in einem Jahr oder in fuenf
 * passiert sind.
 */
export function nextAppVersion(current: AppVersion, today: Date = new Date()): AppVersion {
  const year = today.getFullYear();
  const number = current.year === year ? current.number + 1 : 1;
  return { year, number, text: `${String(year)}.${String(number)}` };
}

/** Schreibt die Version zurueck, ohne den Rest der Datei anzufassen. */
export function writeAppVersion(version: AppVersion, root: string = process.cwd()): void {
  const file = packageFile(root);
  const text = readFileSync(file, 'utf8');
  const replaced = text.replace(/("version":\s*")[^"]*(")/, `$1${version.text}$2`);
  if (replaced === text) throw new Error('Feld "version" in package.json nicht gefunden');
  writeFileSync(file, replaced);
}
