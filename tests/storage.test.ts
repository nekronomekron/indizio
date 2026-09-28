import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import * as v from 'valibot';
import { generatePuzzle, makeSeed, GENERATOR_VERSION } from '@engine';
import { loadSettings, saveSettings } from '../src/app/features/settings/settings.js';
import { loadSave, saveGame } from '../src/app/features/game/gameStorage.js';
import { initialGame } from '../src/app/features/game/gameReducer.js';
import {
  SETTINGS_KEY,
  cachePuzzle,
  loadProgress,
  loadPuzzle,
  readStored,
  recordProgress,
  saveKey,
  tutorialSeen,
  markTutorialSeen,
} from '../src/app/shared/storage/store.js';
import { ErrorBoundary } from '../src/app/shared/errors/ErrorBoundary.js';
import { ErrorPanel } from '../src/app/shared/errors/ErrorPanel.js';
import { renderWithI18n } from './support/render.js';

/**
 * Data from outside is parsed, not cast (PLAN.md §14, U7): whatever sits in
 * localStorage, the app falls back to its defaults instead of crashing or
 * half-applying it.
 */

class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();
  get length(): number {
    return this.items.size;
  }
  clear(): void {
    this.items.clear();
  }
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.items.delete(key);
  }
  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
}

let store: MemoryStorage;

beforeEach(() => {
  store = new MemoryStorage();
  vi.stubGlobal('localStorage', store);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('reading stored data', () => {
  it('returns what matches the schema', () => {
    store.setItem('k', JSON.stringify({ a: 1 }));
    expect(readStored('k', v.object({ a: v.number() }))).toEqual({ a: 1 });
  });

  it('drops and deletes what does not', () => {
    store.setItem('k', JSON.stringify({ a: 'one' }));
    expect(readStored('k', v.object({ a: v.number() }))).toBeNull();
    expect(store.getItem('k')).toBeNull();
  });

  it('drops what is not even JSON', () => {
    store.setItem('k', '{ broken');
    expect(readStored('k', v.unknown())).toBeNull();
    expect(store.getItem('k')).toBeNull();
  });

  it('works without any storage at all', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(readStored('k', v.unknown())).toBeNull();
    expect(loadProgress()).toEqual({});
    expect(tutorialSeen()).toBe(true);
  });
});

describe('settings', () => {
  it('round-trip', () => {
    saveSettings({ locale: 'en', holdMs: 450, vibrate: false, names: true });
    expect(loadSettings(['de'])).toEqual({ locale: 'en', holdMs: 450, vibrate: false, names: true });
  });

  it('keep the good fields when one is broken', () => {
    store.setItem(SETTINGS_KEY, JSON.stringify({ locale: 'en', holdMs: 5000, vibrate: 'yes', names: false }));
    expect(loadSettings(['de'])).toEqual({ locale: 'en', holdMs: 350, vibrate: true, names: false });
  });

  it('fall back to the browser language for an unknown one', () => {
    store.setItem(SETTINGS_KEY, JSON.stringify({ locale: 'fr' }));
    expect(loadSettings(['de-DE']).locale).toBe('de');
  });
});

describe('progress', () => {
  it('keeps the best time and the latest hint count', () => {
    recordProgress('s', { solved: true, bestMs: 9000, hintsUsed: 2 });
    recordProgress('s', { solved: true, bestMs: 12000, hintsUsed: 0 });
    expect(loadProgress()['s']).toMatchObject({ solved: true, bestMs: 9000, hintsUsed: 0 });
  });

  it('starts empty when the stored list is broken', () => {
    store.setItem('indizio:v4:progress', JSON.stringify({ s: { solved: 'yes' } }));
    expect(loadProgress()).toEqual({});
  });

  it('remembers the tutorial', () => {
    expect(tutorialSeen()).toBe(false);
    markTutorialSeen();
    expect(tutorialSeen()).toBe(true);
  });
});

describe('cached puzzles', () => {
  const { core } = generatePuzzle(makeSeed('garden', 5, 77));

  it('come back as they went in', () => {
    cachePuzzle(core);
    expect(loadPuzzle(core.seed, GENERATOR_VERSION)).toEqual(core);
  });

  it('are refused when tampered with', () => {
    cachePuzzle({ ...core, solution: core.solution.slice(1) });
    expect(loadPuzzle(core.seed, GENERATOR_VERSION)).toBeNull();
  });

  it('are refused under another seed or version', () => {
    cachePuzzle(core);
    store.setItem(`indizio:v4:puzzle:other`, store.getItem(`indizio:v4:puzzle:${core.seed}`)!);
    expect(loadPuzzle('other', GENERATOR_VERSION)).toBeNull();
    expect(loadPuzzle(core.seed, GENERATOR_VERSION + 1)).toBeNull();
  });
});

describe('saved games', () => {
  const { core } = generatePuzzle(makeSeed('garage', 5, 78));

  it('come back as they went in', () => {
    const state = { ...initialGame(core), marks: [0, 3], notes: { 4: [1, 2] } };
    saveGame(core.seed, state);
    expect(loadSave(core)).toEqual(state);
  });

  it('are refused when they name a square the board does not have', () => {
    saveGame(core.seed, { ...initialGame(core), marks: [core.size * core.size] });
    expect(loadSave(core)).toBeNull();
  });

  it('are refused when they belong to a puzzle of another size', () => {
    saveGame(core.seed, { ...initialGame(core), placements: [null] });
    expect(loadSave(core)).toBeNull();
  });

  it('are refused when a field has the wrong type', () => {
    store.setItem(saveKey(core.seed), JSON.stringify({ ...initialGame(core), tool: 'hammer' }));
    expect(loadSave(core)).toBeNull();
  });
});

describe('showing a failure', () => {
  it('shows the message first and folds the detail', () => {
    const html = renderWithI18n(
      createElement(ErrorPanel, { kind: 'timeout', detail: 'No answer after 30000 ms', action: null }),
      'en',
    );
    expect(html).toContain('Generating is taking unusually long.');
    expect(html).toContain('<details');
    expect(html).toContain('No answer after 30000 ms');
  });

  it('has a message for every loading failure, in both languages', () => {
    for (const locale of ['de', 'en'] as const) {
      for (const kind of [
        'invalidSeed',
        'outdatedSeed',
        'invalidTheme',
        'attemptsExhausted',
        'crashed',
        'timeout',
      ] as const) {
        const html = renderWithI18n(createElement(ErrorPanel, { kind, action: null }), locale);
        expect(html, `${locale}/${kind}`).not.toContain('errors.');
      }
    }
  });

  it('swaps a crashed subtree for its fallback', () => {
    const boundary = new ErrorBoundary({
      fallback: (error) => `fallback: ${error.message}`,
      children: 'content',
    });
    expect(boundary.render()).toBe('content');
    boundary.state = ErrorBoundary.getDerivedStateFromError(new Error('boom'));
    expect(boundary.render()).toBe('fallback: boom');
  });
});
