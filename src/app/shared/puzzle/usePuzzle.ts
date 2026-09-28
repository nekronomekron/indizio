import { useEffect, useMemo, useRef, useState } from 'react';
import { GENERATOR_VERSION, type GenerationErrorCode, type PuzzleCore } from '@engine';
import { cachePuzzle, loadPuzzle } from '../storage/store.js';
import type { GenerateResponse } from '../../../worker/generate.worker.js';

/**
 * Why a puzzle could not be loaded. The engine's codes, plus what can go wrong
 * around the worker: it crashed, or it took too long.
 */
export type PuzzleErrorCode = GenerationErrorCode | 'crashed' | 'timeout';

export type PuzzleStatus =
  | { state: 'loading' }
  | { state: 'ready'; core: PuzzleCore }
  | { state: 'error'; code: PuzzleErrorCode; detail: string };

/**
 * After this long, generation is reported as failed instead of leaving the
 * loading screen up forever. The slowest tier measures well under 5 s at the
 * 95th percentile on a desktop (PLAN.md §11, G6); a slow phone takes a few
 * times that.
 */
export const GENERATION_TIMEOUT_MS = 30_000;

const SEED_VERSION = /^v(\d+)-/;

/**
 * Does the seed carry another generator version?
 *
 * A seed from an older build describes a different puzzle than the same
 * string would produce today. It is refused, not quietly reinterpreted
 * (PLAN.md §6.1) — and refused here, from the string, because it is not a
 * failure of generation and should not be reported as one.
 */
function isOutdated(seed: string): boolean {
  const version = SEED_VERSION.exec(seed)?.[1];
  return version !== undefined && Number(version) !== GENERATOR_VERSION;
}

export interface PuzzleOptions {
  /**
   * Asked when nothing could be generated for this seed.
   *
   * If it returns a replacement, the hook reports **no** error: the caller has
   * taken over and will be back with another seed. That keeps the decision
   * whether a puzzle may be replaced where it can be made — a drawn case yes,
   * a typed-in one never.
   */
  replaceOnFailure?: (seed: string) => string | null;
}

/**
 * The puzzle for a seed: from the cache, otherwise from the worker (PLAN.md
 * §6.7). The UI stays usable meanwhile.
 *
 * State here is only the worker's answer. Everything else follows from the
 * seed and is computed while rendering: "outdated" is a property of the
 * string, and the cache is a lookup.
 */
export function usePuzzle(seed: string | null, options: PuzzleOptions = {}): PuzzleStatus {
  const [answer, setAnswer] = useState<{ seed: string; status: PuzzleStatus } | null>(null);

  // Always the latest callback, without making it a dependency of the effect —
  // otherwise every render would restart the worker.
  const replace = useRef(options.replaceOnFailure);
  useEffect(() => {
    replace.current = options.replaceOnFailure;
  });

  const cached = useMemo(
    () => (seed !== null && !isOutdated(seed) ? loadPuzzle(seed, GENERATOR_VERSION) : null),
    [seed],
  );

  useEffect(() => {
    if (seed === null || isOutdated(seed) || cached !== null) return;

    let settled = false;
    const worker = new Worker(new URL('../../../worker/generate.worker.ts', import.meta.url), {
      type: 'module',
    });
    const finish = (status: PuzzleStatus): void => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      worker.terminate();
      if (status.state === 'error') console.error(`Puzzle ${seed}: ${status.code}`, status.detail);
      setAnswer({ seed, status });
    };
    const timer = window.setTimeout(
      () =>
        finish({
          state: 'error',
          code: 'timeout',
          detail: `No answer after ${String(GENERATION_TIMEOUT_MS)} ms`,
        }),
      GENERATION_TIMEOUT_MS,
    );

    worker.onmessage = (event: MessageEvent<GenerateResponse>) => {
      const response = event.data;
      if (response.ok) {
        cachePuzzle(response.core);
        finish({ state: 'ready', core: response.core });
      } else if (replace.current?.(seed) != null) {
        // Somebody took over and will come back with another seed.
        settled = true;
        window.clearTimeout(timer);
        worker.terminate();
      } else {
        finish({ state: 'error', code: response.code, detail: response.detail });
      }
    };
    worker.onerror = (event) => {
      finish({
        state: 'error',
        code: 'crashed',
        detail: event.message || 'The worker failed to start or crashed.',
      });
    };
    worker.onmessageerror = () => {
      finish({
        state: 'error',
        code: 'crashed',
        detail: 'The worker sent a message that could not be read.',
      });
    };
    worker.postMessage({ seed });

    return () => {
      settled = true;
      window.clearTimeout(timer);
      worker.terminate();
    };
  }, [seed, cached]);

  if (seed === null) return { state: 'loading' };
  if (isOutdated(seed)) return { state: 'error', code: 'outdatedSeed', detail: seed };
  if (cached !== null) return { state: 'ready', core: cached };
  // An answer for another seed is no answer for this one.
  return answer?.seed === seed ? answer.status : { state: 'loading' };
}
