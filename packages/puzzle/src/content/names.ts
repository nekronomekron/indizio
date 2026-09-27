import type { Gender } from '../core/types.js';

/**
 * Language-neutral proper names. The grammatical gender drives which pronoun
 * a rendered clue uses, so it is data rather than presentation.
 */
export interface NameEntry {
  name: string;
  gender: Gender;
}

export const NAME_POOL: readonly NameEntry[] = [
  { name: 'Anton', gender: 'male' },
  { name: 'Brigitte', gender: 'female' },
  { name: 'Carlo', gender: 'male' },
  { name: 'Dana', gender: 'female' },
  { name: 'Emilio', gender: 'male' },
  { name: 'Frida', gender: 'female' },
  { name: 'Gustav', gender: 'male' },
  { name: 'Helena', gender: 'female' },
  { name: 'Ivan', gender: 'male' },
  { name: 'Jasmin', gender: 'female' },
  { name: 'Konrad', gender: 'male' },
  { name: 'Lucia', gender: 'female' },
  { name: 'Marek', gender: 'male' },
  { name: 'Nadja', gender: 'female' },
  { name: 'Oskar', gender: 'male' },
  { name: 'Paula', gender: 'female' },
  { name: 'Quentin', gender: 'male' },
  { name: 'Rosa', gender: 'female' },
  { name: 'Samuel', gender: 'male' },
  { name: 'Tamara', gender: 'female' },
  { name: 'Urs', gender: 'male' },
  { name: 'Vera', gender: 'female' },
  { name: 'Werner', gender: 'male' },
  { name: 'Yara', gender: 'female' },
];

/** Portrait keys the renderer resolves to artwork. */
export const PORTRAIT_KEYS: readonly string[] = Array.from(
  { length: 14 },
  (_, i) => 'p' + String(i + 1).padStart(2, '0'),
);
