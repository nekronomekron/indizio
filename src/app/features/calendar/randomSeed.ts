import { SIZES_BY_DIFFICULTY, THEME_KEYS, makeSeed, parseSeed } from '@engine';
import type { DifficultyKey } from '@engine';

/**
 * A random case: the player picks the tier, everything else is drawn.
 *
 * Randomness comes from `crypto.getRandomValues`, not `Math.random`. In the
 * engine `Math.random` is forbidden because every choice must go through the
 * seed; out here there is no reason to roll worse dice.
 */

function randomWord(): number {
  const words = new Uint32Array(1);
  crypto.getRandomValues(words);
  return words[0] ?? 0;
}

/**
 * One element, uniform enough.
 *
 * The remainder of a division is very slightly uneven over three themes — with
 * 2^32 values and three buckets, one is hit about one in two billion more
 * often. Not the kind of unevenness anyone notices when a crime scene is
 * picked.
 */
function pick<T>(items: readonly T[]): T {
  return items[randomWord() % items.length]!;
}

/**
 * Seed for a fresh case of the wanted tier.
 *
 * The grid size follows from the tier, so it is derived rather than chosen —
 * "very easy" has two, and then the draw decides.
 */
export function randomSeed(difficulty: DifficultyKey): string {
  return makeSeed(pick(THEME_KEYS), pick(SIZES_BY_DIFFICULTY[difficulty]), randomWord());
}

/**
 * Roll again, same tier.
 *
 * Needed when no puzzle can be generated for a drawn seed: the player then
 * gets another case of the same difficulty instead of an error about something
 * they never chose.
 */
export function redrawSeed(seed: string): string | null {
  try {
    return randomSeed(parseSeed(seed).difficulty);
  } catch {
    return null;
  }
}

/**
 * May this failed seed be replaced — and by what?
 *
 * The rule lives here rather than in the component because breaking it would
 * be costly and could not be tested otherwise: *a typed-in seed is never
 * replaced.* Whoever opens a particular case wants exactly that one; quietly
 * slipping them another would be worse than the error. Only what the game drew
 * itself is replaced, and only a limited number of times — otherwise it would
 * keep rolling forever on a failure.
 */
export function redrawFor(
  failedSeed: string,
  drawnSeed: string | null,
  tries: number,
  maxTries: number,
): string | null {
  if (drawnSeed !== failedSeed || tries >= maxTries) return null;
  return redrawSeed(failedSeed);
}
