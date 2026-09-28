import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { createAppI18n, type Locale } from '../../src/app/shared/i18n/i18n.js';

/** Static markup of an element, rendered inside the app's i18n setup. */
export function renderWithI18n(element: ReactElement, locale: Locale = 'de'): string {
  return renderToStaticMarkup(createElement(I18nextProvider, { i18n: createAppI18n(locale) }, element));
}
