import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { i18n as I18n } from 'i18next';
import { createClueTranslator, type ClueTranslator } from '@engine/i18n';
import { isLocale } from './i18n.js';

/** One translator per instance: creating one registers the engine's resources. */
const translators = new WeakMap<I18n, ClueTranslator>();

function translatorFor(instance: I18n): ClueTranslator {
  let translator = translators.get(instance);
  if (!translator) {
    translator = createClueTranslator({ instance });
    translators.set(instance, translator);
  }
  return translator;
}

/**
 * The engine's clue translator, speaking the app's current language.
 *
 * A new object per language: anything memoised on it — rendered clues, room
 * names — recomputes after a switch without having to know about languages.
 */
export function useClueTranslator(): ClueTranslator {
  const { i18n } = useTranslation();
  const language = i18n.language;
  return useMemo(
    () => ({ ...translatorFor(i18n), locale: isLocale(language) ? language : 'en' }),
    [i18n, language],
  );
}
