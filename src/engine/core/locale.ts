/**
 * The languages the game speaks. Lives in the core because themes (content)
 * and the clue translator (i18n) both need it, and neither may import the
 * other's layer.
 */
export const LOCALES = ['de', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
