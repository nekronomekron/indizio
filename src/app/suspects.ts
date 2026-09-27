import type { Suspect } from '@indizio/puzzle';

/**
 * Wie die Verdaechtigen dargestellt werden: welcher Buchstabe sie auf dem
 * Brett vertritt und in welcher Reihenfolge ihre Karten stehen.
 *
 * Beides ist reine Darstellung. Die **Id bleibt unangetastet** — sie ist der
 * Index in Loesung, Platzierungen und Notizen. Wer hier sortiert, sortiert
 * Karten, nicht Personen.
 */

/**
 * Buchstabe je Verdaechtigem, nach **Id** abgelegt.
 *
 * Der Anfangsbuchstabe des Namens statt A, B, C nach Reihenfolge: ein „N" auf
 * dem Brett soll an Nadja erinnern und nicht daran, dass sie die vierte Karte
 * ist. Beim Nachsehen, wer wo steht, spart das den Umweg ueber die Liste.
 *
 * Kollidieren zwei Anfangsbuchstaben, bekommen **beide** so viele Buchstaben,
 * wie zur Unterscheidung noetig sind. Der mitgelieferte Namensvorrat hat
 * durchweg verschiedene Anfangsbuchstaben (ein Test der Bibliothek haelt das
 * fest), aber ein fremder Vorrat muss das nicht — und zwei gleiche Marken auf
 * dem Brett waeren schlimmer als eine zweibuchstabige.
 */
export function suspectLetters(suspects: readonly Suspect[]): string[] {
  const names = suspects.map((suspect) => suspect.name);

  return suspects.map((suspect, index) => {
    const others = names.filter((_, other) => other !== index);
    for (let length = 1; length <= suspect.name.length; length++) {
      const prefix = suspect.name.slice(0, length).toUpperCase();
      if (!others.some((name) => name.slice(0, length).toUpperCase() === prefix)) return prefix;
    }
    return suspect.name.toUpperCase();
  });
}

/**
 * Reihenfolge der Karten: das Opfer zuletzt, alle anderen wie gehabt.
 *
 * Das Opfer ist die einzige Karte, die nichts zu ermitteln gibt — ihr Hinweis
 * steht von Anfang an fest. Mitten in der Reihe unterbricht sie die Liste der
 * Verdaechtigen, am Ende schliesst sie sie ab.
 */
export function cardOrder(suspects: readonly Suspect[]): Suspect[] {
  return [
    ...suspects.filter((suspect) => !suspect.isVictim),
    ...suspects.filter((suspect) => suspect.isVictim),
  ];
}
