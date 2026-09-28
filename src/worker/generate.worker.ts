import { GenerationError, generatePuzzle, type GenerationErrorCode, type PuzzleCore } from '@engine';

export interface GenerateRequest {
  seed: string;
}

export type GenerateResponse =
  | { ok: true; core: PuzzleCore; ms: number }
  | { ok: false; code: GenerationErrorCode | 'crashed'; detail: string };

/**
 * Generates off the main thread, so the UI stays usable while a 10×10 takes
 * its seconds. Every failure is answered — a worker that throws silently would
 * leave the player looking at "loading" forever.
 */
self.onmessage = (event: MessageEvent<GenerateRequest>) => {
  let response: GenerateResponse;
  try {
    const puzzle = generatePuzzle(event.data.seed);
    response = { ok: true, core: puzzle.core, ms: puzzle.meta.durationMs };
  } catch (error) {
    response =
      error instanceof GenerationError
        ? { ok: false, code: error.code, detail: error.message }
        : { ok: false, code: 'crashed', detail: error instanceof Error ? error.message : String(error) };
  }
  // In a worker, `self` is the worker scope; the DOM typings see a Window.
  (self as unknown as Worker).postMessage(response);
};
