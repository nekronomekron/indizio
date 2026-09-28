import type { ClueType, DifficultyKey, DifficultyProof } from './types.js';

/**
 * Difficulty tiers.
 *
 * Grid size is the primary, non-overlapping key: more suspects is more work,
 * and that is what a player perceives first. Two measured figures refine it —
 * how wide the candidate sets stay after clue propagation (`spread`) and how
 * many clues are indirect. Both are lower bounds, both grow monotonically with
 * the tier, and both are checked against the finished puzzle rather than
 * assumed.
 */

export const DIFFICULTY_ORDER = [
  'veryEasy',
  'easy',
  'medium',
  'hard',
  'expert',
] as const satisfies readonly DifficultyKey[];

export const SIZES_BY_DIFFICULTY: Record<DifficultyKey, readonly number[]> = {
  veryEasy: [5, 6],
  easy: [7],
  medium: [8],
  hard: [9],
  expert: [10],
};

export function difficultyOfSize(size: number): DifficultyKey {
  for (const key of DIFFICULTY_ORDER) {
    if (SIZES_BY_DIFFICULTY[key].includes(size)) return key;
  }
  throw new RangeError(`No difficulty tier covers grid size ${size}`);
}

/**
 * Indirect clues say nothing about the subject's own cell — only about a
 * relation: to another person, to room occupancy, or to geometry. They need
 * combination work rather than lookup, which is what makes a puzzle feel hard.
 */
export const INDIRECT_CLUE_TYPES: ReadonlySet<ClueType> = new Set<ClueType>([
  'SAME_ROOM_AS',
  'DIRECTION_OF_SUSPECT',
  'DIRECTION_OF_OBJECT',
  'CORNER',
  'ALIGNED_WITH_OBJECT',
  'DIAGONAL_OF',
  'ALONE_WITH',
  'ALONE',
]);

/** Clue vocabulary unlocked per tier, cumulative. */
const VOCABULARY_STEPS: readonly (readonly ClueType[])[] = [
  ['ON_OBJECT', 'IN_ROOM', 'ADJACENT_OBJECT', 'ALONE', 'EMPTY_ROOM'],
  ['SAME_ROOM_AS', 'DIRECTION_OF_SUSPECT'],
  ['CORNER', 'ALIGNED_WITH_OBJECT', 'ROOM_COUNT', 'DIRECTION_OF_OBJECT'],
  ['DIAGONAL_OF', 'ALONE_WITH'],
  [],
];

export function vocabularyFor(difficulty: DifficultyKey): ReadonlySet<ClueType> {
  const upTo = DIFFICULTY_ORDER.indexOf(difficulty);
  const vocabulary = new Set<ClueType>();
  for (let step = 0; step <= upTo; step++) {
    for (const type of VOCABULARY_STEPS[step] ?? []) vocabulary.add(type);
  }
  return vocabulary;
}

export interface DifficultyBand {
  sizes: readonly number[];
  /** Lower bound on the mean candidate count after clue propagation. */
  minSpread: number;
  /** Lower bound on the number of indirect card clues. */
  minIndirect: number;
}

/** Thresholds per tier. Values come from measuring real generated puzzles. */
export const DIFFICULTY_BANDS: Record<DifficultyKey, DifficultyBand> = {
  veryEasy: { sizes: [5, 6], minSpread: 3.2, minIndirect: 0 },
  easy: { sizes: [7], minSpread: 4.5, minIndirect: 1 },
  medium: { sizes: [8], minSpread: 6.0, minIndirect: 2 },
  hard: { sizes: [9], minSpread: 6.5, minIndirect: 2 },
  expert: { sizes: [10], minSpread: 7.5, minIndirect: 3 },
};

/** Does a solved puzzle meet the thresholds of the tier it claims? */
export function meetsBand(difficulty: DifficultyKey, size: number, proof: DifficultyProof): boolean {
  const band = DIFFICULTY_BANDS[difficulty];
  return band.sizes.includes(size) && proof.spread >= band.minSpread && proof.indirect >= band.minIndirect;
}
