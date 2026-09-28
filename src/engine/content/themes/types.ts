import type { Locale } from '../../core/locale.js';

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
  /** Unique within the theme. Doubles as the translation and sprite key. */
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

/**
 * Floor coverings a room can have. Only a key: which picture belongs to it is
 * the app's business (`art/themes/<theme>/floors/<floor>.svg`).
 */
export const FLOOR_MATERIALS = [
  'wood',
  'tile',
  'stone',
  'concrete',
  'carpet',
  'grass',
  'soil',
  'gravel',
  'sand',
  'water',
] as const;
export type FloorMaterial = (typeof FLOOR_MATERIALS)[number];

export interface ThemeRoom {
  /** Unique within the theme; the translation key of the room. */
  key: string;
  /**
   * What the floor is made of. It follows the room, not the room's position:
   * tiles in the bathroom, grass on the lawn — a floor you recognise tells you
   * where a room ends without reading its name.
   */
  floor: FloorMaterial;
}

/**
 * Word forms of one object. Clues are built from these, so each form is the
 * piece that goes into a sentence: `in einem Auto`, `einem Auto`, `Autos` …
 */
export interface ObjectWords {
  /** Where someone was: "on a sofa", "in a car". */
  on: string;
  /** After "next to": "a sofa". */
  dative: string;
  /** After "exactly two": "sofas". */
  plural: string;
  /** Subject form: "a sofa". */
  nominative: string;
  /** The name alone, for labels: "sofa". */
  bare: string;
  /** After a direction: "of the sofa". */
  from: string;
  /** Verb for being on it, when "was" reads wrong: "lay" on a bed. */
  verb?: string;
}

export interface RoomWords {
  /** With article: "the kitchen". */
  name: string;
  /** Where someone was: "in the kitchen". */
  in: string;
}

/** Everything a theme needs to say, in one language. */
export interface ThemeTexts {
  /** Display name of the theme: "Car repair shop". */
  name: string;
  rooms: Readonly<Record<string, RoomWords>>;
  objects: Readonly<Record<string, ObjectWords>>;
}

/**
 * A crime scene setting. Everything about it lives in one folder
 * (`content/themes/<key>/`): rooms with their floors, objects, and texts in
 * every language. Adding a theme means adding a folder and registering it.
 */
export interface Theme {
  key: string;
  /**
   * The rooms, in the order the generator names them. Needs at least as many
   * as the largest room count any grid size asks for.
   */
  rooms: readonly ThemeRoom[];
  objects: readonly ThemeObject[];
  texts: Readonly<Record<Locale, ThemeTexts>>;
}
