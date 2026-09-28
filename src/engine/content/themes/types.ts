/**
 * Themes are pure data: a set of room names and an object catalogue. No logic
 * lives here, which is what lets a consumer supply their own crime scenes
 * without touching the generator.
 */

/**
 * A fixed shape: the object is always one of a few rectangles. A bed across
 * is a different drawing from a bed lengthways, so each footprint is listed.
 */
export interface FixedPlacement {
  kind: 'fixed';
  /** Allowed footprints as [width, height] in cells. */
  footprints: readonly (readonly [number, number])[];
}

/**
 * A laid shape: any connected set of cells inside one room — a carpet that
 * turns a corner, a corridor with a crossing. The generator grows it cell by
 * cell; these numbers steer what it grows into.
 */
export interface TiledPlacement {
  kind: 'tiled';
  /** Smallest shape worth placing. At least 1. */
  minCells: number;
  /** Largest shape. At least `minCells`. */
  maxCells: number;
  /**
   * 0 to 1. At 0 only cells touching the shape once are added, so it grows
   * as lanes with corners, branches and crossings. Towards 1 it fills out
   * into areas.
   */
  compactness: number;
  /** 0 to 1. How strongly growth keeps going in the direction it came from. */
  straightness: number;
}

export type Placement = FixedPlacement | TiledPlacement;

export interface ThemeObject {
  /** Globally unique key. Doubles as the translation and sprite key. */
  key: string;
  /** Walkable means a suspect may stand on it — a bed, not a bookshelf. */
  walkable: boolean;
  /**
   * How the object takes up space. Exactly one kind per object, because each
   * kind needs its own set of drawings.
   */
  placement: Placement;
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
