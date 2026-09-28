import 'i18next';
import type { HelpResource } from './resources/en/help.js';
import type { UiResource } from './resources/en/ui.js';

/**
 * Typed keys: `t('confrim')` is a compile error, not a blank label in the game.
 * English is the reference; the German resources are typed against it, so a
 * missing German text is a compile error too.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'ui';
    resources: {
      ui: UiResource;
      help: HelpResource;
    };
  }
}
