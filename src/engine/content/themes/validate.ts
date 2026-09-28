import type { Theme } from './types.js';

/**
 * What is wrong with a theme, as a list — empty if nothing.
 *
 * Themes may come from somebody else, and a laid object with `maxCells` below
 * `minCells` would not fail loudly: it would simply never be placed, and the
 * puzzles would quietly lose an anchor type. Better to say so up front.
 */
export function themeProblems(theme: Theme): string[] {
  const problems: string[] = [];
  const within = (value: number): boolean => Number.isFinite(value) && value >= 0 && value <= 1;

  for (const object of theme.objects) {
    const name = `${theme.key}/${object.key}`;
    const placement = object.placement;
    if (placement.kind === 'fixed') {
      if (placement.footprints.length === 0) problems.push(`${name} has no footprint`);
      for (const [width, height] of placement.footprints) {
        if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
          problems.push(`${name} has an invalid footprint ${String(width)}x${String(height)}`);
        }
      }
      continue;
    }
    if (!Number.isInteger(placement.minCells) || placement.minCells < 1) {
      problems.push(`${name}: minCells must be a whole number of at least 1`);
    }
    if (!Number.isInteger(placement.maxCells) || placement.maxCells < placement.minCells) {
      problems.push(`${name}: maxCells must be a whole number of at least minCells`);
    }
    if (!within(placement.compactness)) problems.push(`${name}: compactness must lie between 0 and 1`);
    if (!within(placement.straightness)) problems.push(`${name}: straightness must lie between 0 and 1`);
  }
  return problems;
}
