import { SIZES_BY_DIFFICULTY, THEME_KEYS, makeSeed, parseSeed } from '@engine';
import type { DifficultyKey } from '@engine';

/**
 * Ein Zufallsfall: die Stufe wählt der Spieler, alles andere wird ausgelost.
 *
 * Der Zufall kommt aus `crypto.getRandomValues` und nicht aus `Math.random`.
 * In der Engine ist `Math.random` per Test verboten, weil jede Wahl durch den
 * Seed laufen muss; hier draußen gäbe es keinen Grund, schlechter zu würfeln.
 */

function randomWord(): number {
  const words = new Uint32Array(1);
  crypto.getRandomValues(words);
  return words[0] ?? 0;
}

/**
 * Ein Element, gleichverteilt genug.
 *
 * Der Rest einer Division ist bei drei Themes minimal ungleich verteilt — bei
 * 2^32 Werten und drei Fächern trifft das eines um etwa ein Zweimilliardstel
 * häufiger. Das ist nicht die Art Ungleichheit, die man bei der Wahl eines
 * Tatorts bemerkt.
 */
function pick<T>(items: readonly T[]): T {
  return items[randomWord() % items.length]!;
}

/**
 * Seed für einen frischen Fall der gewünschten Stufe.
 *
 * Die Gittergröße folgt aus der Stufe, deshalb wird sie nicht gewählt sondern
 * hergeleitet — bei „sehr leicht" gibt es zwei, dann entscheidet das Los.
 */
export function randomSeed(difficulty: DifficultyKey): string {
  return makeSeed(pick(THEME_KEYS), pick(SIZES_BY_DIFFICULTY[difficulty]), randomWord());
}

/**
 * Noch einmal würfeln, gleiche Stufe.
 *
 * Gebraucht, wenn sich zu einem ausgelosten Seed kein Rätsel erzeugen lässt:
 * dann bekommt der Spieler einen anderen Fall derselben Schwere, statt einer
 * Fehlermeldung für etwas, das er gar nicht ausgesucht hat.
 */
export function redrawSeed(seed: string): string | null {
  try {
    return randomSeed(parseSeed(seed).difficulty);
  } catch {
    return null;
  }
}

/**
 * Darf dieser fehlgeschlagene Seed ersetzt werden — und wodurch?
 *
 * Die Regel steht hier und nicht in der Komponente, weil ihr Bruch teuer wäre
 * und sich sonst nicht prüfen ließe: **ein eingetippter Seed wird niemals
 * ersetzt.** Wer einen bestimmten Fall aufruft, will genau den; ihm
 * stillschweigend einen anderen unterzuschieben wäre schlimmer als die
 * Fehlermeldung. Ersetzt wird nur, was das Spiel selbst ausgelost hat, und auch
 * das nur begrenzt oft — sonst würfelt es im Fehlerfall ewig weiter.
 */
export function redrawFor(
  failedSeed: string,
  drawnSeed: string | null,
  tries: number,
  maxTries: number,
): string | null {
  if (drawnSeed !== failedSeed || tries >= maxTries) return null;
  return redrawSeed(failedSeed);
}
