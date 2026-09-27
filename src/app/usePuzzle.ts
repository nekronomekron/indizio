import { useEffect, useRef, useState } from 'react';
import { GENERATOR_VERSION } from '@indizio/puzzle';
import type { PuzzleCore } from '@indizio/puzzle';
import { cachePuzzle, loadPuzzle } from './storage/store.js';
import type { GenerateResponse } from '../worker/generate.worker.js';

export type PuzzleStatus =
  | { state: 'loading' }
  | { state: 'ready'; core: PuzzleCore }
  | { state: 'error'; kind: 'outdatedSeed' | 'failed'; message: string };

/**
 * Raetsel aus dem Seed beschaffen: erst der Zwischenspeicher, sonst der Worker
 * (PLAN.md 6.7). Die Oberflaeche bleibt waehrenddessen bedienbar.
 */
export function usePuzzle(seed: string | null): PuzzleStatus {
  const [status, setStatus] = useState<PuzzleStatus>({ state: 'loading' });
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!seed) return;
    setStatus({ state: 'loading' });

    // Ein Seed aus einer aelteren Generatorversion beschreibt ein anderes
    // Raetsel als heute dasselbe Zeichen erzeugen wuerde. Er wird abgewiesen,
    // nicht stillschweigend neu gedeutet (PLAN.md 6.1) - und zwar hier, weil
    // es kein Fehlschlag der Erzeugung ist und auch nicht so heissen soll.
    const version = /^v(\d+)-/.exec(seed)?.[1];
    if (version !== undefined && Number(version) !== GENERATOR_VERSION) {
      setStatus({ state: 'error', kind: 'outdatedSeed', message: seed });
      return;
    }

    const cached = loadPuzzle(seed, GENERATOR_VERSION);
    if (cached) { setStatus({ state: 'ready', core: cached }); return; }

    const worker = new Worker(new URL('../worker/generate.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<GenerateResponse>) => {
      if (event.data.ok) {
        cachePuzzle(event.data.core);
        setStatus({ state: 'ready', core: event.data.core });
      } else {
        setStatus({ state: 'error', kind: 'failed', message: event.data.error });
      }
      worker.terminate();
      workerRef.current = null;
    };
    worker.onerror = (event) => {
      setStatus({ state: 'error', kind: 'failed', message: event.message || 'Der Generator ist abgestürzt.' });
    };
    worker.postMessage({ seed });

    return () => { worker.terminate(); workerRef.current = null; };
  }, [seed]);

  return status;
}
