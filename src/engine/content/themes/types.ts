/**
 * Themes are pure data: a set of room names and an object catalogue. No logic
 * lives here, which is what lets a consumer supply their own crime scenes
 * without touching the generator.
 */

export interface ThemeObject {
  /** Globally unique key. Doubles as the translation and sprite key. */
  key: string;
  /** Walkable means a suspect may stand on it — a bed, not a bookshelf. */
  walkable: boolean;
  /** Allowed footprints as [width, height] in cells. */
  footprints: readonly (readonly [number, number])[];
  /** Room keys of this theme where the object may appear. */
  rooms: readonly string[];
  /** Upper bound on instances in one scene. */
  maxPerScene: number;
  /** Relative weight when picking filler objects. */
  weight: number;
}

export interface Theme {
  key: string;
  /**
   * Room names. Needs at least as many as the largest room count any grid
   * size asks for, otherwise a room would end up nameless.
   */
  roomKeys: readonly string[];
  objects: readonly ThemeObject[];
}
