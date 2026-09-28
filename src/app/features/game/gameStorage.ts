import { readJson, saveKey, writeJson } from '../../shared/storage/store.js';
import type { GameState } from './gameReducer.js';

/**
 * The game in progress, per seed. Whether one exists is shared knowledge (the
 * calendar shows it); what it holds belongs to this feature.
 */
export function loadSave(seed: string): GameState | null {
  return readJson(saveKey(seed)) as GameState | null;
}

export function saveGame(seed: string, state: GameState): void {
  writeJson(saveKey(seed), state);
}
