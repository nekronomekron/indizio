import i18next, { type i18n as I18nInstance, type ResourceLanguage } from 'i18next';
import type { Clue, ClueEntry, Room, Suspect } from '../core/types.js';
import { de } from './resources/de.js';
import { en } from './resources/en.js';

/**
 * Turning clue structure into sentences.
 *
 * The generator only ever produces structure; language happens here and
 * nowhere else. That separation is what makes a second language a resource
 * file rather than a rewrite — and it is why clue objects carry no text.
 *
 * i18next does the work that hand-rolled string building always gets wrong:
 * plural categories per language, gendered variants, interpolation and
 * fallbacks. The instance is created privately, so nothing here touches a
 * consumer's own i18next setup.
 */

export const LOCALES = ['de', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

const RESOURCES: Record<Locale, ResourceLanguage> = { de, en };
const NAMESPACE = 'puzzle';

/** Context a clue needs to name rooms and people. */
export interface ClueScene {
  rooms: readonly Room[];
  suspects: readonly Suspect[];
}

export interface ClueTranslatorOptions {
  locale?: Locale;
  /**
   * Reuse an existing i18next instance instead of creating one. The library's
   * resources are added under their own namespace, so nothing collides.
   */
  instance?: I18nInstance;
  /** Extra resources, e.g. word forms for a custom theme's objects. */
  additionalResources?: Partial<Record<Locale, Record<string, unknown>>>;
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function createInstance(options: ClueTranslatorOptions): I18nInstance {
  const instance = options.instance ?? i18next.createInstance();

  if (!instance.isInitialized) {
    // No backend and inline resources, so this settles synchronously — which
    // matters because callers render clues during a UI update.
    void instance.init({
      lng: options.locale ?? 'de',
      fallbackLng: 'en',
      defaultNS: NAMESPACE,
      ns: [NAMESPACE],
      resources: Object.fromEntries(LOCALES.map((locale) => [locale, { [NAMESPACE]: RESOURCES[locale] }])),
      initImmediate: false,
      interpolation: { escapeValue: false },
    });
  } else {
    for (const locale of LOCALES) {
      instance.addResourceBundle(locale, NAMESPACE, RESOURCES[locale], true, false);
    }
  }

  instance.services.formatter?.add('capitalize', (value) => capitalizeFirst(String(value)));

  for (const [locale, bundle] of Object.entries(options.additionalResources ?? {})) {
    instance.addResourceBundle(locale, NAMESPACE, bundle, true, true);
  }
  return instance;
}

/** Looks up one key. Returns a plain string, which is all this module needs. */
type Translate = (key: string, values?: Record<string, unknown>) => string;

/** Reads a word form, falling back to the key so a gap is visible, not silent. */
function wordForm(translate: Translate, path: string): string {
  const value = translate(path, { defaultValue: '' });
  return value.length > 0 ? value : path;
}

function joinNames(names: readonly string[], conjunction: string): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} ${conjunction} ${names[names.length - 1]!}`;
}

export interface ClueTranslator {
  readonly locale: Locale;
  readonly instance: I18nInstance;
  /** Render one clue as a full sentence. */
  render(scene: ClueScene, entry: ClueEntry): string;
  /** Human-readable room name, e.g. for a label on the board. */
  roomName(nameKey: string): string;
  /**
   * Bare object noun, e.g. for a tooltip on the board: `Regal`, not `an einem
   * Regal`. The sentence forms stay inside `render`; this is the name alone.
   */
  objectName(key: string): string;
  setLocale(locale: Locale): void;
}

export function createClueTranslator(options: ClueTranslatorOptions = {}): ClueTranslator {
  const instance = createInstance(options);
  let locale: Locale = options.locale ?? 'de';

  const translate: Translate = (key, values) => instance.getFixedT(locale, NAMESPACE)(key, values ?? {});

  const object = (key: string, form: string): string => wordForm(translate, `object.${key}.${form}`);
  const roomIn = (scene: ClueScene, roomId: number): string => {
    const room = scene.rooms.find((candidate) => candidate.id === roomId);
    return room ? wordForm(translate, `room.${room.nameKey}.in`) : String(roomId);
  };
  const suspectName = (scene: ClueScene, id: number): string => scene.suspects[id]?.name ?? String(id);

  function renderClue(scene: ClueScene, ownerId: number | null, clue: Clue): string {
    if (clue.type === 'EMPTY_ROOM') {
      return translate('clue.EMPTY_ROOM', { room: roomIn(scene, clue.roomId) });
    }
    if (clue.type === 'ROOM_COUNT') {
      return translate('clue.ROOM_COUNT', { room: roomIn(scene, clue.roomId), count: clue.count });
    }
    if (ownerId === null) return '';

    const owner = scene.suspects[ownerId];
    if (!owner) return '';
    const pronoun = translate(`common.pronoun_${owner.gender}`);

    switch (clue.type) {
      case 'VICTIM':
        return translate('clue.VICTIM', { pronoun });

      case 'ON_OBJECT':
        return translate('clue.ON_OBJECT', {
          pronoun,
          verb:
            object(clue.objectKey, 'verb') === `object.${clue.objectKey}.verb`
              ? translate('common.was')
              : object(clue.objectKey, 'verb'),
          place: object(clue.objectKey, 'on'),
        });

      case 'IN_ROOM':
        return translate('clue.IN_ROOM', { pronoun, room: roomIn(scene, clue.roomId) });

      case 'ADJACENT_OBJECT':
        if (clue.count === undefined) {
          return translate('clue.ADJACENT_OBJECT_any', {
            pronoun,
            object: object(clue.objectKey, 'dative'),
          });
        }
        return translate('clue.ADJACENT_OBJECT', {
          pronoun,
          count: clue.count,
          object: object(clue.objectKey, 'dative'),
          objectBare: object(clue.objectKey, 'bare'),
          objectPlural: object(clue.objectKey, 'plural'),
        });

      case 'ALONE':
        return clue.roomId === undefined
          ? translate('clue.ALONE', { pronoun })
          : translate('clue.ALONE_inRoom', { pronoun, room: roomIn(scene, clue.roomId) });

      case 'SAME_ROOM_AS':
        return translate('clue.SAME_ROOM_AS', { pronoun, name: suspectName(scene, clue.otherId) });

      case 'DIRECTION_OF_SUSPECT':
        return translate('clue.DIRECTION_OF_SUSPECT', {
          pronoun,
          direction: translate(`common.direction.${clue.direction}`),
          name: suspectName(scene, clue.otherId),
        });

      case 'DIRECTION_OF_OBJECT':
        return translate('clue.DIRECTION_OF_OBJECT', {
          pronoun,
          direction: translate(`common.direction.${clue.direction}`),
          object: object(clue.objectKey, 'from'),
        });

      case 'CORNER':
        return translate('clue.CORNER', { pronoun });

      case 'ALIGNED_WITH_OBJECT':
        return translate('clue.ALIGNED_WITH_OBJECT', {
          pronoun,
          axis: translate(`common.axis.${clue.axis}`),
          object: object(clue.objectKey, 'nominative'),
        });

      case 'DIAGONAL_OF':
        return translate('clue.DIAGONAL_OF', { pronoun, name: suspectName(scene, clue.otherId) });

      case 'ALONE_WITH':
        return translate('clue.ALONE_WITH', {
          pronoun,
          names: joinNames(
            clue.otherIds.map((id) => suspectName(scene, id)),
            translate('common.and'),
          ),
        });
    }
  }

  return {
    get locale() {
      return locale;
    },
    instance,
    render: (scene, entry) => renderClue(scene, entry.ownerId, entry.clue),
    roomName: (nameKey) => wordForm(translate, `room.${nameKey}.name`),
    objectName: (key) => object(key, 'bare'),
    setLocale: (next) => {
      locale = next;
    },
  };
}
