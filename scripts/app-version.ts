import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The game's version: `<year>.<number>`, for example `2026.4`.
 *
 * It lives in `package.json` and nowhere else. A second place would mean the
 * two can drift apart — and a version you cannot believe is worse than none.
 *
 * The format is deliberately *not* semantic. Semantic versions promise
 * something about contracts between programs; the game has no users in code,
 * only people in front of a screen. For them "the fourth version this year" is
 * the more useful information.
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
  if (!match) throw new Error(`Version "${text}" does not match <year>.<number>`);
  return { year: Number(match[1]), number: Number(match[2]), text };
}

/** The current version, read from the project root's `package.json`. */
export function readAppVersion(root: string = process.cwd()): AppVersion {
  const raw = JSON.parse(readFileSync(packageFile(root), 'utf8')) as { version?: unknown };
  if (typeof raw.version !== 'string') throw new Error('package.json has no "version" field');
  return parseAppVersion(raw.version);
}

/**
 * The next version: one up within the year, back to one in a new year.
 *
 * The new year resets, or the number would say nothing any more — "2027.58"
 * would leave open whether 58 changes happened in one year or in five.
 */
export function nextAppVersion(current: AppVersion, today: Date = new Date()): AppVersion {
  const year = today.getFullYear();
  const number = current.year === year ? current.number + 1 : 1;
  return { year, number, text: `${String(year)}.${String(number)}` };
}

/** Writes the version back without touching the rest of the file. */
export function writeAppVersion(version: AppVersion, root: string = process.cwd()): void {
  const file = packageFile(root);
  const text = readFileSync(file, 'utf8');
  const replaced = text.replace(/("version":\s*")[^"]*(")/, `$1${version.text}$2`);
  if (replaced === text) throw new Error('No "version" field found in package.json');
  writeFileSync(file, replaced);
}
