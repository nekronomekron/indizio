/**
 * Seeded pseudo-random numbers.
 *
 * Every random choice in this library flows through here, and `Math.random`
 * is banned by lint rule. That is what makes a seed a promise: the same seed
 * must produce the same puzzle on any machine, in any process, forever.
 *
 * Algorithm: FNV-1a to fold a string seed into a word, SplitMix32 to expand
 * that word into the state, xoshiro128** for the output stream.
 */

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const GOLDEN_RATIO_32 = 0x9e3779b9;
/** Discarded outputs after seeding, so nearby seeds diverge immediately. */
const WARMUP_ROUNDS = 16;

function hashString(text: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash >>> 0;
}

/** SplitMix32, used only to fill the state from a single word. */
function createSplitMix32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + GOLDEN_RATIO_32) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1) >>> 0;
    mixed = (mixed ^ (mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61))) >>> 0;
    return (mixed ^ (mixed >>> 14)) >>> 0;
  };
}

const rotateLeft = (value: number, bits: number): number =>
  ((value << bits) | (value >>> (32 - bits))) >>> 0;

export class Rng {
  private stateA: number;
  private stateB: number;
  private stateC: number;
  private stateD: number;

  constructor(seed: string | number) {
    const word = typeof seed === 'number' ? seed >>> 0 : hashString(seed);
    const expand = createSplitMix32(word);
    this.stateA = expand();
    this.stateB = expand();
    this.stateC = expand();
    this.stateD = expand();
    if ((this.stateA | this.stateB | this.stateC | this.stateD) === 0) this.stateA = 1;
    for (let i = 0; i < WARMUP_ROUNDS; i++) this.nextUint32();
  }

  /** Raw 32-bit output. */
  nextUint32(): number {
    const result = Math.imul(rotateLeft(Math.imul(this.stateB, 5) >>> 0, 7), 9) >>> 0;
    const shifted = (this.stateB << 9) >>> 0;
    this.stateC = (this.stateC ^ this.stateA) >>> 0;
    this.stateD = (this.stateD ^ this.stateB) >>> 0;
    this.stateB = (this.stateB ^ this.stateC) >>> 0;
    this.stateA = (this.stateA ^ this.stateD) >>> 0;
    this.stateC = (this.stateC ^ shifted) >>> 0;
    this.stateD = rotateLeft(this.stateD, 11);
    return result;
  }

  /** Float in [0, 1). */
  nextFloat(): number {
    return this.nextUint32() / 4294967296;
  }

  /** Integer in [0, bound). */
  nextInt(bound: number): number {
    if (bound <= 0) throw new RangeError('Rng.nextInt needs a positive bound');
    return Math.floor(this.nextFloat() * bound);
  }

  /** Integer in [min, max], both inclusive. */
  nextIntBetween(min: number, max: number): number {
    return min + this.nextInt(max - min + 1);
  }

  nextBoolean(probability = 0.5): boolean {
    return this.nextFloat() < probability;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError('Rng.pick needs a non-empty list');
    return items[this.nextInt(items.length)] as T;
  }

  /**
   * Weighted pick. Weights must be positive; the list must be non-empty.
   * Used wherever a uniform choice would make layouts look mechanical.
   */
  pickWeighted<T>(items: readonly T[], weightOf: (item: T) => number): T {
    if (items.length === 0) throw new RangeError('Rng.pickWeighted needs a non-empty list');
    let total = 0;
    for (const item of items) total += weightOf(item);
    let roll = this.nextFloat() * total;
    for (const item of items) {
      roll -= weightOf(item);
      if (roll < 0) return item;
    }
    return items[items.length - 1] as T;
  }

  /** Fisher-Yates, in place. */
  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      const swap = items[i] as T;
      items[i] = items[j] as T;
      items[j] = swap;
    }
    return items;
  }

  /** Shuffle a copy, leaving the original untouched. */
  shuffled<T>(items: readonly T[]): T[] {
    return this.shuffle([...items]);
  }

  /** `0, 1, … count - 1` in random order. */
  shuffledIndices(count: number): number[] {
    return this.shuffle(Array.from({ length: count }, (_, i) => i));
  }
}
