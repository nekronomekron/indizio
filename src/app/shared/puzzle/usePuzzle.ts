import { useEffect, useMemo, useRef, useState } from 'react';
import { GENERATOR_VERSION } from '@engine';
import type { PuzzleCore } from '@engine';
import { cachePuzzle, loadPuzzle } from '../storage/store.js';
import type { GenerateResponse } from '../../../worker/generate.worker.js';

export type PuzzleStatus =
  | { state: 'loading' }
  | { state: 'ready'; core: PuzzleCore }
  | { state: 'error'; kind: 'outdatedSeed' | 'failed'; message: string };

const SEED_VERSION = /^v(\d+)-/;

/**
 * Trägt der Seed eine fremde Generatorversion?
 *
 * Ein Seed aus einer älteren Fassung beschreibt ein anderes Rätsel als dieselbe
 * Zeichenkette heute erzeugen würde. Er wird abgewiesen, nicht stillschweigend
 * neu gedeutet (PLAN.md §6.1) — und zwar an der Zeichenkette, weil es kein
 * Fehlschlag der Erzeugung ist und auch nicht so heißen soll.
 */
function isOutdated(seed: string): boolean {
  const version = SEED_VERSION.exec(seed)?.[1];
  return version !== undefined && Number(version) !== GENERATOR_VERSION;
}

/**
 * Rätsel aus dem Seed beschaffen: erst der Zwischenspeicher, sonst der Worker
 * (PLAN.md §6.7). Die Oberfläche bleibt währenddessen bedienbar.
 *
 * Zustand ist hier nur die **Antwort des Workers**. Alles andere ergibt sich aus
 * dem Seed und wird beim Zeichnen berechnet, nicht in einem Effekt gesetzt:
 * „veraltet" ist eine Eigenschaft der Zeichenkette, und der Zwischenspeicher ist
 * ein Nachschlagen. Vorher setzte der Effekt drei dieser Zustände von Hand, was
 * je einen zusätzlichen Durchlauf kostete — und bei einem Seedwechsel für einen
 * Wimpernschlag die Antwort zum vorigen Rätsel stehen ließ.
 */
export interface PuzzleOptions {
  /**
   * Wird gefragt, wenn sich zu diesem Seed nichts erzeugen ließ.
   *
   * Gibt sie einen Ersatz zurück, meldet der Haken **keinen** Fehler — der
   * Aufrufer hat übernommen und wird gleich mit einem anderen Seed wiederkommen.
   * So bleibt die Entscheidung, ob ein Rätsel ersetzt werden darf, dort, wo man
   * sie treffen kann: ein ausgeloster Fall ja, ein eingetippter niemals.
   */
  replaceOnFailure?: (seed: string) => string | null;
}

export function usePuzzle(seed: string | null, options: PuzzleOptions = {}): PuzzleStatus {
  const [answer, setAnswer] = useState<{ seed: string; status: PuzzleStatus } | null>(null);

  // Immer die zuletzt übergebene Fassung, ohne sie in die Abhängigkeiten des
  // Effekts zu nehmen — sonst startete jeder Durchlauf den Worker neu.
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

    const worker = new Worker(new URL('../../../worker/generate.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (event: MessageEvent<GenerateResponse>) => {
      if (event.data.ok) {
        cachePuzzle(event.data.core);
        setAnswer({ seed, status: { state: 'ready', core: event.data.core } });
      } else if (replace.current?.(seed) == null) {
        // Niemand hat übernommen, also ist es ein Fehler wie jeder andere.
        setAnswer({ seed, status: { state: 'error', kind: 'failed', message: event.data.error } });
      }
      worker.terminate();
    };
    worker.onerror = (event) => {
      setAnswer({
        seed,
        status: { state: 'error', kind: 'failed', message: event.message || 'Der Generator ist abgestürzt.' },
      });
    };
    worker.postMessage({ seed });

    return () => {
      worker.terminate();
    };
  }, [seed, cached]);

  if (seed === null) return { state: 'loading' };
  if (isOutdated(seed)) return { state: 'error', kind: 'outdatedSeed', message: seed };
  if (cached !== null) return { state: 'ready', core: cached };
  // Eine Antwort zu einem anderen Seed ist keine Antwort auf diesen.
  return answer?.seed === seed ? answer.status : { state: 'loading' };
}
