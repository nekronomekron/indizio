/**
 * The engine's second door, reached as `@engine/i18n`.
 *
 * i18next lives behind this door and nowhere else, so importing the engine
 * itself — generating, solving, reading and writing puzzles — still pulls in
 * nothing at all. Only a caller who wants sentences pays for a translation
 * library, and the worker that only generates does not.
 *
 * It stays a door of its own for that reason alone. Folding these exports into
 * `@engine` would put i18next in every bundle that touches a puzzle.
 */
export {
  LOCALES,
  createClueTranslator,
  type ClueScene,
  type ClueTranslator,
  type ClueTranslatorOptions,
  type Locale,
} from './translator.js';
export { de } from './resources/de.js';
export { en } from './resources/en.js';
