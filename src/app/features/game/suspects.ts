import type { Suspect } from '@engine';

/**
 * How suspects are shown: which letter stands for them on the board and in
 * which order their cards appear.
 *
 * Both are presentation only. The *id stays untouched* — it is the index into
 * solution, placements and notes. Sorting here sorts cards, not people.
 */

/**
 * Letter per suspect, stored by *id*.
 *
 * The first letter of the name rather than A, B, C by order: an "N" on the
 * board should remind you of Nadja, not of her being the fourth card. Checking
 * who stands where then needs no detour through the list.
 *
 * If two initials collide, *both* get as many letters as it takes to tell them
 * apart. The shipped name pool has different initials throughout (an engine
 * test holds that), but a foreign pool need not — and two identical marks on
 * the board would be worse than a two-letter one.
 */
export function suspectLetters(suspects: readonly Suspect[]): string[] {
  const names = suspects.map((suspect) => suspect.name);

  return suspects.map((suspect, index) => {
    const others = names.filter((_, other) => other !== index);
    for (let length = 1; length <= suspect.name.length; length++) {
      const prefix = suspect.name.slice(0, length).toUpperCase();
      if (!others.some((name) => name.slice(0, length).toUpperCase() === prefix)) return prefix;
    }
    return suspect.name.toUpperCase();
  });
}

/**
 * Order of the cards: the victim last, everyone else as they were.
 *
 * The victim is the one card with nothing to investigate — its clue is fixed
 * from the start. In the middle it interrupts the list of suspects; at the end
 * it closes it.
 */
export function cardOrder(suspects: readonly Suspect[]): Suspect[] {
  return [
    ...suspects.filter((suspect) => !suspect.isVictim),
    ...suspects.filter((suspect) => suspect.isVictim),
  ];
}
