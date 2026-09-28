import type { Theme, ThemeObject } from '../../../src/engine/index.js';

/**
 * A minimal theme for tests that generate or solve but never render text:
 * every room on a wooden floor, no texts.
 */
export function testTheme(key: string, roomKeys: readonly string[], objects: readonly ThemeObject[]): Theme {
  const texts = { name: key, rooms: {}, objects: {} };
  return {
    key,
    rooms: roomKeys.map((room) => ({ key: room, floor: 'wood' })),
    objects,
    texts: { de: texts, en: texts },
  };
}
