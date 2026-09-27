import { generatePuzzle, GenerationError } from '@indizio/puzzle';
import type { PuzzleCore } from '@indizio/puzzle';

export interface GenerateRequest { seed: string }
export type GenerateResponse =
  | { ok: true; core: PuzzleCore; ms: number }
  | { ok: false; error: string };

self.onmessage = (event: MessageEvent<GenerateRequest>) => {
  const { seed } = event.data;
  try {
    const puzzle = generatePuzzle(seed);
    const response: GenerateResponse = { ok: true, core: puzzle.core, ms: puzzle.meta.durationMs };
    (self as unknown as Worker).postMessage(response);
  } catch (error) {
    const message = error instanceof GenerationError ? error.message : String(error);
    (self as unknown as Worker).postMessage({ ok: false, error: message } satisfies GenerateResponse);
  }
};
