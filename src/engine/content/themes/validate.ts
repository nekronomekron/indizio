import type { Theme, ThemeObject } from './types.js';

/** Keys that occur more than once. */
function duplicates(keys: readonly string[]): string[] {
  const seen = new Set<string>();
  return [...new Set(keys.filter((key) => (seen.has(key) ? true : (seen.add(key), false))))];
}

function placementProblems(name: string, object: ThemeObject): string[] {
  const problems: string[] = [];
  const within = (value: number): boolean => Number.isFinite(value) && value >= 0 && value <= 1;
  const placement = object.placement;

  if (placement.kind === 'fixed') {
    if (placement.footprints.length === 0) problems.push(`${name} has no footprint`);
    for (const [width, height] of placement.footprints) {
      if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
        problems.push(`${name} has an invalid footprint ${String(width)}x${String(height)}`);
      }
    }
    return problems;
  }
  if (!Number.isInteger(placement.minCells) || placement.minCells < 1) {
    problems.push(`${name}: minCells must be a whole number of at least 1`);
  }
  if (!Number.isInteger(placement.maxCells) || placement.maxCells < placement.minCells) {
    problems.push(`${name}: maxCells must be a whole number of at least minCells`);
  }
  if (!within(placement.compactness)) problems.push(`${name}: compactness must lie between 0 and 1`);
  if (!within(placement.straightness)) problems.push(`${name}: straightness must lie between 0 and 1`);
  return problems;
}

/**
 * What is wrong with a theme, as a list — empty if nothing.
 *
 * Themes may come from somebody else, and most mistakes would not fail
 * loudly: a laid object with `maxCells` below `minCells` is simply never
 * placed, an object pointing at a misspelt room simply never appears, and the
 * puzzles quietly lose an anchor type. Better to say so up front.
 *
 * Texts are not checked here — a theme without them still generates, it only
 * renders keys. The shipped themes' texts are checked by their tests.
 */
export function themeProblems(theme: Theme): string[] {
  const problems: string[] = [];
  const roomKeys = theme.rooms.map((room) => room.key);
  const rooms = new Set(roomKeys);

  for (const key of duplicates(roomKeys)) problems.push(`${theme.key}: room ${key} is listed twice`);
  for (const key of duplicates(theme.objects.map((object) => object.key))) {
    problems.push(`${theme.key}: object ${key} is listed twice`);
  }

  for (const object of theme.objects) {
    const name = `${theme.key}/${object.key}`;
    problems.push(...placementProblems(name, object));
    for (const room of object.rooms) {
      if (!rooms.has(room)) problems.push(`${name} names an unknown room ${room}`);
    }
  }
  return problems;
}
