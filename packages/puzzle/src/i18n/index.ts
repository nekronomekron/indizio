/**
 * The i18n entry point, exposed as the `@indizio/puzzle/i18n` subpath.
 *
 * i18next lives behind this subpath and nowhere else, so importing the core —
 * generating, solving, reading and writing puzzles — still pulls in nothing at
 * all. Only callers who want sentences pay for a translation library.
 */
export {
  LOCALES, createClueTranslator,
  type ClueScene, type ClueTranslator, type ClueTranslatorOptions, type Locale,
} from './translator.js';
export { de } from './resources/de.js';
export { en } from './resources/en.js';
