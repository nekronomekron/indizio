import { flat } from './flat/theme.js';
import { garage } from './garage/theme.js';
import { garden } from './garden/theme.js';
import type { Theme } from './types.js';

export {
  FLOOR_MATERIALS,
  type FixedPlacement,
  type FloorMaterial,
  type ObjectWords,
  type Placement,
  type RoomWords,
  type Theme,
  type ThemeObject,
  type ThemeRoom,
  type ThemeTexts,
  type TiledPlacement,
} from './types.js';
export { themeProblems } from './validate.js';

/** The themes shipped with the library. Consumers may pass their own instead. */
export const THEMES: readonly Theme[] = [garage, flat, garden];

export const THEME_KEYS: readonly string[] = THEMES.map((theme) => theme.key);

export function findTheme(key: string, themes: readonly Theme[] = THEMES): Theme | undefined {
  return themes.find((theme) => theme.key === key);
}
