import { flat } from './flat.js';
import { garage } from './garage.js';
import { garden } from './garden.js';
import type { Theme } from './types.js';

export type { FixedPlacement, Placement, Theme, ThemeObject, TiledPlacement } from './types.js';
export { themeProblems } from './validate.js';

/** The themes shipped with the library. Consumers may pass their own instead. */
export const THEMES: readonly Theme[] = [garage, flat, garden];

export const THEME_KEYS: readonly string[] = THEMES.map((theme) => theme.key);

export function findTheme(key: string, themes: readonly Theme[] = THEMES): Theme | undefined {
  return themes.find((theme) => theme.key === key);
}
