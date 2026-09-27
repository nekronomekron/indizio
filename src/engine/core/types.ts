/**
 * The data model. Everything here is plain structure: no classes, no
 * functions, no runtime references — so a puzzle can be serialised, sent over
 * a network and read back somewhere else without losing anything.
 */

/** A cell as a flat index: `row * size + column`. */
export type Cell = number;

/** Index into the suspect list. Also the index used by {@link Assignment}. */
export type SuspectId = number;

export type RoomId = number;

export type Direction = 'north' | 'east' | 'south' | 'west';

export type Axis = 'row' | 'column';

/** Grammatical gender, used to pick the right pronoun when rendering clues. */
export type Gender = 'male' | 'female';

/** Difficulty tiers, from very easy to expert. */
export type DifficultyKey = 'veryEasy' | 'easy' | 'medium' | 'hard' | 'expert';

/** Bounding rectangle of a set of cells. All bounds inclusive. */
export interface Bounds {
  minRow: number;
  minColumn: number;
  maxRow: number;
  maxColumn: number;
}

/**
 * A room is a connected set of cells — not necessarily a rectangle. L-shapes,
 * corridors and alcoves are explicitly allowed, the way real buildings are
 * shaped. `cells` is the truth; `bounds` is only the enclosing rectangle and
 * says nothing about the shape.
 */
export interface Room {
  id: RoomId;
  /** Translation key, resolved by the i18n layer. */
  nameKey: string;
  /** Connected under four-neighbourhood, sorted ascending. */
  cells: Cell[];
  bounds: Bounds;
}

/** One concrete object instance placed on the grid. */
export interface SceneObject {
  id: number;
  /** Key from the theme's object catalogue, e.g. `car`. */
  key: string;
  /** Walkable means a suspect may stand on these cells. */
  walkable: boolean;
  roomId: RoomId;
  cells: Cell[];
}

export interface Suspect {
  id: SuspectId;
  /** Proper name, language neutral. */
  name: string;
  gender: Gender;
  portraitKey: string;
  isVictim: boolean;
}

/** The static crime scene, without any people in it. */
export interface Scene {
  size: number;
  themeKey: string;
  rooms: Room[];
  objects: SceneObject[];
}

/** Placement of everyone: index is the suspect id, value is the cell. */
export type Assignment = Cell[];

/**
 * A clue as structure rather than text.
 *
 * Rendering happens in the i18n layer, which is why a clue never carries a
 * sentence — only what it asserts.
 */
export type Clue =
  | { type: 'ON_OBJECT'; objectKey: string }
  | { type: 'IN_ROOM'; roomId: RoomId }
  | { type: 'ADJACENT_OBJECT'; objectKey: string; count?: number }
  | { type: 'ALONE'; roomId?: RoomId }
  | { type: 'SAME_ROOM_AS'; otherId: SuspectId }
  | { type: 'DIRECTION_OF_SUSPECT'; direction: Direction; otherId: SuspectId }
  | { type: 'DIRECTION_OF_OBJECT'; direction: Direction; objectKey: string }
  | { type: 'CORNER' }
  | { type: 'ALIGNED_WITH_OBJECT'; axis: Axis; objectKey: string }
  | { type: 'DIAGONAL_OF'; otherId: SuspectId }
  | { type: 'ALONE_WITH'; otherIds: SuspectId[] }
  | { type: 'VICTIM' }
  | { type: 'EMPTY_ROOM'; roomId: RoomId }
  | { type: 'ROOM_COUNT'; roomId: RoomId; count: number };

export type ClueType = Clue['type'];

/** Every clue type, in one place — the single source of truth. */
export const CLUE_TYPES = [
  'ON_OBJECT', 'IN_ROOM', 'ADJACENT_OBJECT', 'ALONE', 'SAME_ROOM_AS',
  'DIRECTION_OF_SUSPECT', 'DIRECTION_OF_OBJECT', 'CORNER', 'ALIGNED_WITH_OBJECT',
  'DIAGONAL_OF', 'ALONE_WITH', 'VICTIM', 'EMPTY_ROOM', 'ROOM_COUNT',
] as const satisfies readonly ClueType[];

/** A clue with its bearer. `ownerId === null` means a scene-wide clue. */
export interface ClueEntry {
  ownerId: SuspectId | null;
  clue: Clue;
}

/**
 * Deduction depth.
 *
 * 1 — clue propagation: apply what each clue says about candidate sets.
 * 2 — permutation rules: exactly one person per row and per column.
 *
 * These two suffice for every puzzle the generator produces; the search is
 * bounded to them on purpose, so a solver never needs case analysis.
 */
export type RuleLevel = 1 | 2;

/**
 * Measured properties of a solved puzzle. These are what the difficulty tier
 * is checked against — no field here is decorative.
 */
export interface DifficultyProof {
  /** Mean candidate count per suspect after clue propagation alone. */
  spread: number;
  /** Number of indirect card clues. */
  indirect: number;
  /** Which generation attempt produced this puzzle. Follows from the seed. */
  attempts: number;
}

/** The deterministic heart of a puzzle: same seed, same bytes. */
export interface PuzzleCore {
  seed: string;
  generatorVersion: number;
  size: number;
  difficulty: DifficultyKey;
  themeKey: string;
  rooms: Room[];
  objects: SceneObject[];
  suspects: Suspect[];
  clues: ClueEntry[];
  solution: Assignment;
  murdererId: SuspectId;
  difficultyProof: DifficultyProof;
}

/** Runtime facts about one generation run. Never part of the deterministic core. */
export interface PuzzleMeta {
  durationMs: number;
  generatedAt: number;
}

export interface Puzzle {
  core: PuzzleCore;
  meta: PuzzleMeta;
}
