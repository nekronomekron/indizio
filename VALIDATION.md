# Prüfprotokoll zum Entwicklungsplan

Der Plan wurde in Runden gegen eine feste Prüfliste gehalten. Jede Runde
protokolliert die gefundenen Fehler und die Korrektur. Die ersten Runden endeten,
als eine vollständige Runde ohne neuen Befund durchlief; seither kommt mit jedem
größeren Umbau eine weitere dazu.

Ergebnis: **Plan v13 umgesetzt.** 48 Fehler gefunden und behoben; ein Punkt
bleibt bewusst offen (§8.5, der Höhenabzug als Konstante).

Die Runden 1 bis 4 sind Papierprüfungen des Plans gegen die Prüfliste. Runde 5
kam aus der Umsetzung: zwei Planannahmen haben der Messung nicht standgehalten
und wurden korrigiert. Runde 7 kam aus dem Abnahmelauf und dem Durchspielen im
Browser. Runde 14 ist die erste, in der nicht ein Mensch den Code prüft, sondern
der Code sich selbst: alle vier Befunde stammen aus neuen Tests.

| Runde | Art | Befunde |
|---|---|---|
| 1–3 | Papierprüfung des Plans | 15 |
| 4 | Papierprüfung, ohne Befund | 0 |
| 5 | Messung am laufenden Generator | 2 |
| 6 | Papierprüfung nach Korrektur | 0 |
| 7 | Abnahmelauf und Durchspielen | 2 |
| 8 | Abschlussprüfung | 0 |
| 9 | Nachbesserungen aus dem Spielbetrieb | 3 |
| 10 | Zeigerbedienung und Raumgrenzen | 1 |
| 11 | Umbau: Bibliothek und Raumformen | 3 |
| 12 | Grafik als Vektor, Platzieren mit Konsequenzen | 1 |
| 13 | Bodenbeläge | 0 |
| 14 | Umbau der Bibliothek, geprüft durch die neue Testsuite | 4 |
| 15 | Grafiken als Dateien, Raumgrenzen für alle Geräte | 3 |
| 16 | Versionsnummer in der Fußzeile | 1 |
| 17 | Gemeldeter Hinweisfehler (widerlegt), Karten und Marken | 1 |
| 18 | „Neben" nennt nie mehr, worauf jemand steht | 3 |
| 19 | Requisiten je Grundfläche, gewählte Person im Gitter | 0 |

---

## Prüfliste

### A — Vorbedingungen des Auftrags

| # | Prüfpunkt |
|---|---|
| A1 | Pro Spalte und pro Reihe steht genau ein Verdächtiger |
| A2 | Verdächtige mit Beschreibung auf der linken Seite |
| A3 | Schwierigkeitsgrad steigt mit der Zahl der Verdächtigen |
| A4 | Puzzle sind zufallsgeneriert |
| A5 | Tatorte enthalten verschiedene Räume |
| A6 | Die Beschreibung je Verdächtigem wird mitgeneriert und passt zur Lösung |
| A7 | Alle Assets neu erstellt, in Pixel-Art |
| A8 | Freie Assets aus dem Netz recherchiert und bei Bedarf genutzt |
| A9 | Generierung per Seed, Puzzle reproduzierbar |
| A10 | Läuft im Browser auf Desktop und Handy |
| A11 | Murdoku-Doku und Tutorial vollständig gelesen und ausgewertet |

### B — Spielkonzept (aus Murdokus Doku, Tutorial und FAQ)

| # | Prüfpunkt |
|---|---|
| B1 | Das Opfer ist eine Karte auf dem Gitter und zählt als Person |
| B2 | Der Mörder war mit dem Opfer allein im selben Bereich |
| B3 | „neben" = orthogonal **und** im selben Raum |
| B4 | „allein" schließt das Opfer ein |
| B5 | Hinweise sind ausnahmslos wahr |
| B6 | Genau eine gültige Lösung |
| B7 | Ohne Raten lösbar, rein deduktiv |
| B8 | Porträts sind nie lösungsrelevant |
| B9 | Große Objekte bedecken mehrere Felder, eine Person besetzt eines davon |
| B10 | Blockierende Objekte sind nicht besetzbar |
| B11 | Mengenangaben nur, wenn ausdrücklich („genau ein Regal") |
| B12 | Die drei fortgeschrittenen Techniken sind vom Solver abgedeckt |
| B13 | Gittergröße gleich Verdächtigenzahl, 5×5 bis 10×10, fünf Stufen |

### C — Innere Widerspruchsfreiheit des Plans

| # | Prüfpunkt |
|---|---|
| C1 | Jeder Hinweistyp hat eine eindeutige, entscheidbare Semantik |
| C2 | Jeder Hinweistyp hat eine Solver-Regel |
| C3 | Jedes Abnahmekriterium ist messbar und prinzipiell erfüllbar |
| C4 | Schwierigkeitsstufen sind überschneidungsfrei |
| C5 | Determinismus ist über alle Zufallsquellen hinweg lückenlos |
| C6 | Kein Mechanismus hebelt eine bewusst getroffene Entscheidung wieder aus |
| C7 | Jede im Plan genannte Datei hat einen Meilenstein |
| C8 | Keine Vorbedingung ohne Abschnitt, kein Abschnitt ohne Zweck |

---

## Runde 1 — 9 Befunde

**B1-1 — C4 verletzt: Schwierigkeitsstufen überschnitten sich.**
„Sehr leicht: 5×5, 6×6, maxRule ≤ R2" und „Leicht: 6×6, 7×7, maxRule ≤ R2"
beschrieben dieselben Rätsel. Ein 6×6 mit maxRule R2 hätte in beide Stufen
gepasst, damit war Kriterium G5 („erreicht die geforderte Stufe") gar nicht
entscheidbar.
*Korrektur:* §5.4 neu — die Gittergröße ist der primäre, überschneidungsfreie
Schlüssel (5–6 / 7 / 8 / 9 / 10), maxRule und Schrittzahlen sind zusätzliche
Ober- und Untergrenzen. Rätsel außerhalb der Schranken werden verworfen statt
umetikettiert.

**B1-2 — C3 verletzt: G4 war prinzipiell unerfüllbar.**
Das Puzzle-Objekt enthielt `stats.ms`, eine Laufzeitmessung. Gleichzeitig
verlangte G4 byte-identisches JSON bei gleichem Seed. Beides zusammen ist nicht
möglich.
*Korrektur:* §6.8 trennt `core` (deterministisch, Grundlage von G4) und `meta`
(`ms`, `generatedAt`). `attempts` bleibt in `core`, weil der Versuchszähler
deterministisch aus dem Seed folgt.

**B1-3 — C1 verletzt: `DIR_OF_OBJECT` war mehrdeutig.**
„westlich von jeder Zelle einer Instanz dieses Typs" lässt offen, welche Instanz
gemeint ist, sobald der Typ mehrfach vorkommt. Der gerenderte Satz „westlich vom
Regal" wäre unbestimmt gewesen — ein Verstoß gegen B5, weil ein Hinweis nur wahr
sein kann, wenn er eine Aussage macht.
*Korrektur:* §4.2 und neues §4.2.1 — der Typ ist nur zulässig, wenn genau eine
Instanz im Gitter steht. Existenzielle Typen (`ON_OBJECT`, `ADJACENT_OBJECT`,
`ALIGNED_WITH_OBJECT`) sind davon nicht betroffen, weil sie ausdrücklich über
alle Instanzen quantifizieren.

**B1-4 — C6 verletzt: das Tipp-System hebelte die binäre Rückmeldung aus.**
Der Tipp sollte vom aktuellen Spielstand ausgehen und bei Widerspruch eine
„Sackgasse" melden. Damit hätte man eine Figur setzen, einen Tipp anfordern und
erfahren können, ob die Platzierung falsch ist — genau das Verhalten, das mit
der Entscheidung „nur richtig/falsch, ohne Verrat" ausgeschlossen wurde.
*Korrektur:* §5.5 — der Tipp läuft immer auf dem leeren Ausgangszustand und
zeigt den ersten Schritt der kanonischen Ableitungskette, dessen Ergebnis noch
nicht auf dem Brett steht. Spielerfehler werden nie kommentiert. Neues
Abnahmekriterium G14 prüft das mit verfälschten Brettern.

**B1-5 — B2 gefährdet: `ALONE_WITH` konnte den Mörder direkt verraten.**
Ein Kartenhinweis „war allein mit dem Opfer" hätte den Mörder benannt und die
gesamte Deduktion überflüssig gemacht.
*Korrektur:* §4.2.1 — kein Kartenhinweis nennt das Opfer in `SAME_ROOM_AS` oder
`ALONE_WITH`. Rein geometrische Bezüge aufs Opfer (`DIR_OF_SUSPECT`,
`DIAGONAL_OF`) bleiben erlaubt, weil sie nichts über Raumbelegung aussagen.

**B1-6 — B12 unvollständig: die R2-Beschreibung brach vor der Folgerung ab.**
„Zeile mit genau einer möglichen Zelle ⇒ dort steht jemand" ist für sich genommen
wirkungslos — die Elimination entsteht erst daraus, dass damit auch die Spalte
dieser Zelle verbraucht ist. Murdokus Technik 1 war also nur halb abgebildet.
*Korrektur:* §5.2 — R2 als vier ausformulierte Ableitungen, einschließlich der
Spaltenfolgerung.

**B1-7 — C3 verletzt: „Experte: R4, viele Schritte" war keine prüfbare Schwelle.**
G5 verlangt 100 % Trefferquote, „viele" ist nicht messbar.
*Korrektur:* §5.4 — Experte verlangt maxRule = R4 und R3 + R4 zusammen ≥ 4
Schritte.

**B1-8 — C3 unscharf: G6 nannte kein Referenzgerät.**
„p95 < 3 s" ohne Angabe worauf gemessen wird, ist nicht nachprüfbar.
*Korrektur:* §11 — Node-Referenzlauf auf dem Entwicklungsrechner mit 5×5 < 100 ms
und 10×10 < 1 s, dreifacher Wert als Mobilbudget, einmal real nachgemessen in M8.

**B1-9 — A7/A8 ungeklärter Widerspruch im Auftrag selbst.**
„Erstelle alle Assets neu" und „nutze freie Assets aus dem Netz" schließen sich
dem Wortlaut nach aus. Der Plan setzte die Auflösung stillschweigend voraus.
*Korrektur:* §7 — ausdrücklich formuliert: kein Asset wird von Murdoku
übernommen, alles Sichtbare wird für Indizio neu zusammengestellt, teils aus
CC0-Beständen, teils selbst gezeichnet.

---

## Runde 2 — 3 Befunde (Folgefehler aus Runde 1)

**B2-1 — C6: der Tipp konnte auf ein besetztes Feld zeigen.**
Nach der Korrektur B1-4 arbeitet der Tipp auf dem leeren Zustand. Damit kann er
eine Zelle nennen, auf der bereits eine andere Figur steht. Der Plan sagte
nichts darüber, was dann passiert — automatisches Verdrängen hätte wieder einen
Fehlerhinweis bedeutet.
*Korrektur:* §5.5 — der Tipp platziert nichts, er hebt die Zelle hervor und
nennt die Begründung; das Räumen bleibt Sache des Spielers.

**B2-2 — C1: `EMPTY_ROOM` und `ROOM_COUNT` überlappten bei n = 0.**
Für denselben Sachverhalt hätte der Generator zwei verschiedene Hinweistypen
ausgeben können, mit unterschiedlicher Stufenfreigabe — die Stufenzuordnung wäre
damit umgehbar gewesen.
*Korrektur:* §4.4 — `ROOM_COUNT` auf n ≥ 1 beschränkt, `EMPTY_ROOM` ist der
Sonderfall n = 0; je Raum höchstens ein globaler Hinweis.

**B2-3 — C1: „stärkerer Hinweis" in der Hinweissuche war undefiniert.**
Die Suchstrategie in §6.6 stützte sich auf einen Begriff, den der Plan nirgends
festlegte — damit wäre das Verfahren weder umsetzbar noch reproduzierbar.
*Korrektur:* §6.6 — Hinweisstärke ist die Zahl der Zellen, die der Hinweis
allein auf dem leeren Ausgangszustand aus der Kandidatenmenge seines Subjekts
entfernt; einmal je Kandidat berechnet und damit reproduzierbar.

---

## Runde 3 — 3 Befunde

**B3-1 — B9/C1: Objekte konnten größer sein als ihr Raum.**
Der Objektkatalog kannte Grundflächen bis 2×3, die Raumteilung ließ Räume ab 2×2
zu. Der Plan sagte nicht, was bei Nichtpassung geschieht.
*Korrektur:* §6.3 — passt die Grundfläche nicht, wird das Objekt für diesen Raum
gar nicht angeboten. Zusätzlich klargestellt, dass die Prozentgrenzen bloße
Vorfilter sind und allein die Machbarkeitsprüfung in §6.4 verbindlich ist.

**B3-2 — C7: der Katalog hatte keine Herkunft.**
§8.2 versprach eine Rätselliste nach Stufen, aber nirgends stand, woher die
kuratierten Seeds kommen. Ohne das wäre die Vorbedingung „steigender
Schwierigkeitsgrad" nicht sichtbar geworden.
*Korrektur:* §8.2 und §8.1 — `scripts/curate.ts` erzeugt die versionierte
Katalogdatei aus generierten Kandidaten mit sauberer Einstufung.

**B3-3 — C1: bei K = 5 Räumen konnten Raumnamen ausgehen.**
Die Raumzahl steigt mit der Gittergröße auf fünf, der Plan verlangte von einem
Theme aber keine Mindestzahl an Namen.
*Korrektur:* §6.2 — jedes Theme stellt mindestens fünf Raumnamen bereit,
geprüft durch einen Test.

---

## Runde 4 — keine Befunde (Papierprüfung abgeschlossen)

Alle 32 Prüfpunkte wurden erneut gegen den korrigierten Plan gehalten. Die in den
Runden 1 bis 3 gefundenen Fehler sind behoben, neue Widersprüche traten nicht
auf. Damit ist die Prüfung abgeschlossen.

### Zuordnung der Prüfpunkte zum Plan

| Prüfpunkt | Erfüllt in |
|---|---|
| A1 | §3.2 Regel 2, §5.2 R2, G9 |
| A2 | §3.1, §4.2, §8.5 |
| A3 | §5.4, §8.2 |
| A4 | §6.1–§6.6 |
| A5 | §6.2 |
| A6 | §4, §6.6, G3 |
| A7 | §7 |
| A8 | §7 |
| A9 | §6.1, §6.8, G4 |
| A10 | §6.7, §8.5, §9, G10, G11 |
| A11 | §2 |
| B1 | §3.2 Regel 1, §4.1, §4.3 |
| B2 | §3.2 Regel 4, §4.3, §6.5, G8 |
| B3 | §4.1 |
| B4 | §4.1, §4.2 `ALONE` |
| B5 | §4.1, §6.6 Abschluss, G3 |
| B6 | §5.3, G2 |
| B7 | §5.2, §5.3, G1 |
| B8 | §7 Porträts |
| B9 | §6.3, §6.8 `objects.cells` |
| B10 | §3.2 Regel 3, §5.1, G9 |
| B11 | §4.1, §4.2 `count` |
| B12 | §5.2 R2, R3, R4 |
| B13 | §3.2, §5.4 |
| C1 | §4.1, §4.2.1, §4.4, §6.6 |
| C2 | §5.2 R1 |
| C3 | §11 |
| C4 | §5.4 |
| C5 | §6.1, §6.8 |
| C6 | §5.5, §3.3 |
| C7 | §8.1, §10 |
| C8 | §1, diese Tabelle |

---

## Runde 5 — 2 Befunde aus der Umsetzung (Messung statt Papier)

Die Runden 1 bis 4 konnten nur prüfen, ob der Plan in sich stimmig ist. Zwei
Annahmen ließen sich erst am laufenden Generator prüfen — und beide waren
falsch. Grundlage sind rund 26 000 erzeugte Tatorte über alle fünf Stufen und
drei Themes.

### B5-1 — §6.3/§6.5: die Reihenfolge „erst möblieren, dann Lösung suchen" ist unbrauchbar

Der Plan sah vor, Objekte zufällig zu platzieren und anschließend per Matching
eine Lösung zu suchen. Gemessene Erfolgsquote der Hinweissuche:

| Gitter | 6×6 | 7×7 | 8×8 | 9×9 | 10×10 |
|---|---|---|---|---|---|
| lösbare Rätsel je Szene | 8 % | 3 % | **0 %** | **0 %** | **0 %** |

Ab 8×8 entstand **kein einziges** lösbares Rätsel. Ursache: Personen landen
regelmäßig auf Feldern, für die es keinen scharfen Hinweis gibt — der beste
verfügbare Hinweis war dann „im Raum X" bei einem Raum mit 30 Feldern.

*Korrektur:* §6.3 umgedreht. Erst steht die Lösung fest, dann wird der Tatort um
sie herum eingerichtet: jede Lösungszelle bekommt einen Anker (begehbares Objekt
darauf oder sperrendes daneben), und **jeder Objekttyp dient höchstens einmal
als Anker**. Letzteres war ein eigener, überraschender Teilbefund: bekamen drei
Personen alle den Hinweis „auf einem Stuhl", war das Rätsel nicht etwa schwer,
sondern **mehrdeutig** — die drei sind untereinander vertauschbar. Ergänzend
mehr und kleinere Räume (§6.2, K bis 7 statt 5) und eine Reparaturphase in der
Hinweissuche (§6.6), die den letzten symmetrisch gebliebenen Personen einen
anderen Hinweis gibt.

Ergebnis nach der Korrektur, 15 Rätsel je Stufe:

| Stufe | erzeugt | Fehlschläge | p50 | p95 | eindeutig | falsche Hinweise |
|---|---|---|---|---|---|---|
| Sehr leicht | 15 | 0 | 6 ms | 18 ms | 8/8 | 0 |
| Leicht | 15 | 0 | 21 ms | 180 ms | 8/8 | 0 |
| Mittel | 15 | 0 | 40 ms | 83 ms | 8/8 | 0 |
| Schwer | 15 | 0 | 72 ms | 413 ms | 8/8 | 0 |
| Experte | 15 | 0 | 241 ms | 2335 ms | 8/8 | 0 |

### B5-2 — §5.4: die Regeltiefe als Untergrenze ist praktisch unerreichbar

Der Plan verlangte, dass „Mittel" mindestens einmal R3 und „Schwer" mindestens
einmal R4 benötigt. Gemessen an lösbaren Rätseln:

| Gitter | maxRule = R2 | maxRule = R3 | maxRule = R4 |
|---|---|---|---|
| 5×5 – 7×7 | 100 % | 0 % | 0 % |
| 8×8 | 96,5 % | 3,5 % | 0 % |
| 9×9 | 94 % | 6 % | 0 % |
| 10×10 | 100 % | 0 % | 0 % |

Bei einem Hinweis je Karte ist die Permutationslogik (R2) so stark, dass sie
fast immer allein reicht. R4 trat in **keiner einzigen** Messung auf. Die
geforderte Untergrenze hätte die Stufen Mittel bis Experte unerzeugbar gemacht —
und damit die Vorbedingung A3 („steigender Schwierigkeitsgrad") ins Leere laufen
lassen.

*Korrektur:* §5.4 auf zwei **gemessene** Kennzahlen umgestellt, die tatsächlich
mit der Gittergröße mitwachsen, mit der Regeltiefe als Obergrenze:

| Gitter | Streuung p10/p50/p90 | indirekte Hinweise p10/p50/p90 |
|---|---|---|
| 5×5 | 3,6 / 4,6 / 5,6 | 0 / 0 / 1 |
| 6×6 | 4,2 / 5,3 / 6,5 | 0 / 0 / 1 |
| 7×7 | 4,7 / 6,7 / 9,9 | 0 / 1 / 2 |
| 8×8 | 6,0 / 8,1 / 10,9 | 1 / 2 / 4 |
| 9×9 | 6,0 / 8,9 / 13,0 | 2 / 3 / 4 |
| 10×10 | 6,6 / 11,7 / 17,3 | 2 / 3 / 5 |

Die Schranken in §5.4 liegen jeweils nahe dem p10-Wert: streng genug, um
degenerierte Rätsel abzuweisen, erreichbar genug, damit die Generierung schnell
bleibt. Beide Kennzahlen steigen monoton mit der Stufe, sind maschinell
nachprüfbar und stehen im Puzzle-Kern (`difficultyProof`), sodass G5 weiterhin
objektiv entscheidbar ist.

### Nachgezogene Planstellen

§3.2 Regel 5, §4.4 (Zahl der globalen Hinweise), §5.4, §6.2, §6.3, §6.4, §6.5,
§6.6, §6.8 (`difficultyProof`), §11 G5 und G6, §12 Risikotabelle.

### Runde 6 — keine Befunde

Die Prüfliste wurde vollständig gegen Plan v4 gehalten. Die Korrekturen aus
Runde 5 sind eingearbeitet, neue Widersprüche traten nicht auf.

---

## Runde 7 — 2 Befunde aus dem Abnahmelauf

Der Abnahmelauf (`npm run acceptance`) prüft den fertigen Code gegen die
Kriterien aus PLAN.md §11. Er hat zwei Dinge gefunden, die weder die
Papierprüfung noch die Messung in Runde 5 zeigen konnten.

### B7-1 — G13: die Zwei-Zyklen-Regel war nie durchgesetzt

§4.2.1 verlangt, dass zwei Karten nicht aufeinander verweisen — A darf nicht
„westlich von B" tragen, während B „östlich von A" trägt. Die Regel stand im
Plan, aber weder Aufzählung noch Hinweissuche haben sie geprüft. Der Abnahmelauf
fand den Verstoß in **1 von 200** Rätseln.

*Korrektur:* neue Datei `src/core/clues/restrictions.ts` mit
`clueRestrictionViolations` als einziger Wahrheitsquelle für alle drei
Einschränkungen aus §4.2.1. Der Generator verwirft verletzende Rätsel vor der
Ausgabe, Abnahmelauf und Unit-Tests benutzen dieselbe Funktion. Ergebnis:
200/200 sauber.

### B7-2 — Die Opferkarte war in der Oberfläche nicht auswählbar

Der Plan sagt in §3.2 ausdrücklich, dass das Opfer eine Karte wie jede andere
ist und mitplatziert wird. Die Kartenkomponente hatte sie jedoch auf `disabled`
gesetzt — dadurch ließ sich das Rätsel **grundsätzlich nicht abschließen**, weil
„Bestätigen" alle N Platzierungen verlangt. Gefunden beim Durchspielen im
Browser, nicht von einem Test.

*Korrektur:* Die Opferkarte ist auswählbar wie jede andere; nur ihre Optik bleibt
abgesetzt. Nachgestellt: alle sechs Personen platzieren, Bestätigen, Auflösung
mit korrektem Mörder.

### Ergebnis des Abnahmelaufs

| Kriterium | Ergebnis |
|---|---|
| G1 ohne Fallunterscheidung lösbar | 200/200 |
| G2 Referenzlöser bestätigt genau eine Lösung | 40/40 |
| G3 alle Hinweise wahr | 200/200 |
| G4a gleicher Seed, gleicher Prozess | 60/60 |
| G4b gleicher Seed, zweiter Prozess | identisch |
| G5 Schranken der Stufe eingehalten | 200/200 |
| G6 p95-Generierungszeit | vl 16 ms, l 273 ms, m 128 ms, s 517 ms, x 2968 ms — alle im Budget |
| G7 Solver-Soundness | 264/264 |
| G8 Opferraum mit genau zwei Personen | 200/200 |
| G9 Permutation und freie Felder | 200/200 |
| G12 Sprachdateien vollständig | DE und EN |
| G13 Einschränkungen aus §4.2.1 | 200/200 |
| G14 Tipp ignoriert den Spielstand | 200/200 |
| Fehlschläge der Erzeugung | 0 |

**G10 (Layout ab 360 px)** wurde im Browser geprüft: bei 360, 390, 768 und
1280 px kein waagerechtes Scrollen, alle Bedienelemente mindestens 44 px. Dabei
fielen zwei Layoutfehler auf, die behoben wurden: das waagerechte Kartenband
sprengte die Seitenbreite (fehlendes `min-width: 0` an den Grid-Kindern), und
die Kopfzeile des Spiels brach auf schmalen Geräten nicht um.

**G11 (Offline-Betrieb)** ist vorbereitet — Service Worker und Manifest werden
korrekt ausgeliefert (`text/javascript`, HTTP 200) —, ließ sich aber im
eingebetteten Prüfbrowser nicht abschließen: dieser verweigert die Registrierung
von Service Workern. Der Nachweis steht in einem normalen Browser noch aus.

### Runde 8 — keine Befunde

Prüfliste erneut vollständig gegen den korrigierten Stand gehalten. 40 Unit- und
Integrationstests grün, Abnahmelauf ohne Verletzung.

---

## Runde 9 — 2 Nachbesserungen und 1 Folgebefund

Zwei Verbesserungen aus dem Spielbetrieb, dazu ein Befund, den erst der
Abnahmelauf danach zutage gefördert hat.

### B9-1 — Notizen standen mittig statt links oben

Murdoku setzt den Anfangsbuchstaben **links oben** in die Zelle, damit mehrere
Notizen nebeneinander passen und der Blick auf Objekt und X-Markierung frei
bleibt. Indizio setzte sie zentriert und blendete sie aus, sobald ein X gesetzt
war — bei mehreren Kandidaten je Feld wurde die Zelle dadurch unlesbar.

*Korrektur:* Notizen sitzen links oben, laufen bei mehreren Einträgen nach
rechts um, skalieren mit der Zellgröße und bleiben neben einem X sichtbar.
Nachgestellt im Browser: drei Notizen A, B, C in einer Zelle, Versatz 3 px von
links und 1 px von oben.

### B9-2 — Die Oberfläche ließ Platzieren auf gesperrten Feldern zu

PLAN.md §3.2 Regel 3 sagt seit der ersten Fassung, dass Verdächtige nie auf
blockierenden Objektfeldern stehen. Der Generator hält sich daran (G9: 200/200),
**die Oberfläche prüfte es aber gar nicht**: per Halten oder Doppelklick ließ
sich eine Person auf einen Tisch oder einen Schrank setzen. Das Rätsel war dann
nicht mehr lösbar, ohne dass das Spiel es sagte — und „Bestätigen" darf ja nicht
verraten, welche Person falsch steht.

*Korrektur:* Das Gitter kennt jetzt die gesperrten Felder und ignoriert dort
Platzieren, Notieren, Malen und X-Markieren vollständig; ein kurzes rotes
Aufblitzen quittiert den Versuch. Zusätzlich wurde die Begehbarkeitsliste
geprüft und in §6.3 festgeschrieben: nur Dinge, auf denen man sinnvollerweise
steht oder sitzt. Dabei fiel ein falsch eingestuftes Objekt auf — der
**Werkzeugkasten** war begehbar und ist jetzt gesperrt. Ein neuer Test erzwingt
die Liste in beide Richtungen.

### B9-3 — Ein einzelnes Begehbarkeits-Flag brach das Zeitbudget

Nachdem der Werkzeugkasten gesperrt wurde, riss die Stufe „Schwer" ihr
Zeitbudget: p95 stieg von 517 ms auf **1214 ms** bei einem Budget von 1000 ms.

Die Ursache ist eine Kopplung, die im Plan so nicht sichtbar war: Da **jeder
Objekttyp höchstens einmal als Anker dient** (§6.3), bestimmt die Zahl der
*verschiedenen* begehbaren Typen eines Themes, wie viele Lösungszellen einen
starken „steht auf"-Hinweis bekommen können. Das Garagen-Theme fiel von vier auf
drei solche Typen und musste häufiger auf schwächere Nachbarschafts-Anker
ausweichen.

*Korrektur:* Zwei sinnvolle Standflächen für die Werkstatt ergänzt —
**Matte** und **Palette**, beide neu gezeichnet. Damit hat jedes der drei Themes
fünf begehbare Typen. Ergebnis: „Schwer" wieder bei p95 530 ms, alle 16
Kriterien grün. Die Abhängigkeit ist jetzt in §6.3 dokumentiert, damit sie beim
nächsten Theme nicht erneut überrascht.

### Ergebnis

42 Tests grün (zwei neue zur Begehbarkeit), Abnahmelauf 16 von 16:
vl 18 ms, l 248 ms, m 113 ms, s 530 ms, x 3149 ms — alle im Budget.

---

## Runde 10 — 1 Befund und 1 Erweiterung

### B10-1 — Kurzes Tippen setzte keine Notiz (Zeiger-Einfangen)

Der Griff „kurz tippen setzt eine Bleistiftnotiz" funktionierte mit echter Maus
nicht. Ursache war eine Wechselwirkung, die der frühere Test nicht treffen
konnte:

Beim Drücken fängt das Gitter den Zeiger ein (`setPointerCapture`), damit ein
Ziehen auch außerhalb des Bretts weiter Ereignisse liefert. Genau das lenkt aber
alle Folgeereignisse auf den **Container** um — beim Loslassen ist das
Ereignisziel nicht mehr die Zelle, sondern die Gitterfläche. Der zielbasierte
Zugriff (`event.target.closest('[data-cell]')`) fand deshalb keine Zelle, und der
Tipp-Zweig wurde nie erreicht. Das Halten funktionierte weiter, weil es die
Zelle noch aus dem Drücken kennt — der Fehler betraf ausschließlich das kurze
Tippen.

**Warum kein Test das gefunden hat:** Die Verifikation in Runde 9 hat Ereignisse
direkt auf der Zelle ausgelöst. Bei einem synthetischen Zeiger greift das
Einfangen nicht, also blieb das Ziel die Zelle und alles schien zu stimmen. Der
Test hat die Mechanik geprüft, aber nicht die Bedingung, unter der sie bricht.

*Korrektur:* Die Zelle wird jetzt ausschließlich aus den Zeigerkoordinaten
bestimmt (`elementFromPoint`), unabhängig vom Ereignisziel. Nachgestellt wurde
die echte Bedingung: Drücken auf der Zelle, Loslassen auf dem Container.
Ergebnis: Notiz wird gesetzt, ein zweites Tippen entfernt sie wieder, drei
Verdächtige ergeben `A B C` in einer Zelle.

Dabei fiel eine zweite Ungenauigkeit auf: Beim Ziehen wurde das **Startfeld**
nicht mitbemalt, nur die danach berührten Felder. Auch behoben — ein Strich über
drei Felder trägt jetzt auf allen dreien die Notiz.

### B10-2 — Neu: Raumgrenzen unter der Maus

Fast jeder Hinweis nimmt auf Räume Bezug („war im Wohnzimmer", „war allein",
„im selben Bereich"), die Raumgrenzen waren aber nur an einem dezenten
Farbwechsel zu erkennen. Jetzt hebt ein Umriss den Bereich unter dem Zeiger
hervor und färbt seinen Namen ein.

Der Umriss liegt als eigene Ebene über den Objekten, damit er nicht von
Möbelstücken verdeckt wird, und nimmt selbst keine Eingabe an. Auf Touch-Geräten
entfällt er über `@media (hover: none)`.

Nachgestellt: Umriss deckt sich exakt mit den Raumrechtecken (Schlafzimmer
216×216 px, Küche 216×432 px bei 72-px-Zellen), wechselt beim Überfahren
korrekt und verschwindet beim Verlassen des Gitters.

### Ergebnis

42 Tests grün, Build sauber. Beide Änderungen betreffen nur die Oberfläche;
Generator, Löser und Abnahmekriterien bleiben unberührt.

---

## Runde 11 — Umbau: Bibliothek und Raumformen

Zwei strukturelle Änderungen, dazu die Befunde aus ihrer Absicherung.

### Neue Vorbedingungen

| # | Prüfpunkt |
|---|---|
| A12 | Generator und Löser sind eine entkoppelte Bibliothek, in anderen Projekten ohne Anpassung nutzbar |
| A13 | Austausch als strukturiertes JSON-Objekt |
| A14 | Räume dürfen nicht rechteckig sein: Gänge und L-Formen wie in echten Gebäuden |

### B11-1 — Entkopplung war behauptet, nicht geprüft

`src/core` war zwar frei von React und DOM, aber nichts hinderte jemanden daran,
das zu brechen — und niemand hätte es gemerkt.

*Umsetzung:* Eigenes Paket `@indizio/puzzle` mit eigener `package.json`, eigenem
Build und eigener Testsuite. Dazu **erzwungene** Prüfungen statt Zusicherungen:
kein Import verlässt den Paketordner, keine Laufzeitabhängigkeiten, kein DOM,
kein React, kein Node-Modul, kein `Math.random` außerhalb des
Zufallsgenerators, `Date.now` nur in Messung und Zeitbudget, und alles Nötige am
Haupteinstieg. Der schärfste Test erzeugt ein vollständiges Rätsel mit einem
**fremden Theme** („Raumschiff"), das die Bibliothek nicht kennt — genau der
Fall, den ein anderes Projekt braucht.

Dafür mussten zwei versteckte Kopplungen aufgelöst werden: `parseSeed` prüfte
den Theme-Schlüssel gegen die mitgelieferte Registry, und `generatePuzzle` holte
das Theme fest von dort. Beide nehmen jetzt die erlaubten Themes entgegen.

### B11-2 — Der Prüfschritt selbst hatte drei Fehlalarme

Die Entkopplungsprüfung schlug an, wo nichts falsch war — dreimal
hintereinander, jedes Mal aus einem anderen Grund:

1. Das Muster `\bdocument\.` traf den Modulpfad `'./document.js'`.
2. Ein Zeilenfilter für Import-Anweisungen ließ **mehrzeilige** Exportblöcke
   durch, deren letzte Zeile `} from './document.js';` lautet.
3. Nach dem Entfernen aller Zeichenketten traf die Prüfung auf fremde Module das
   Codebeispiel im Kommentar der Datei — `from '@indizio/puzzle'` im JSDoc.

*Korrektur:* Zeichenketten werden für die Suche nach API-Verwendung geleert,
Kommentare vor der Suche nach Importpfaden entfernt, und fremde Module werden an
den Importpfaden geprüft statt am Dateirumpf. Der Vorgang ist ein gutes Beispiel
dafür, dass eine Prüfung selbst Prüfung braucht: alle drei Fehlalarme hätten den
Bau blockiert, ohne dass ein echtes Problem vorlag.

### B11-3 — Zellweise Umformung erzeugte Rauschen statt Grundrisse

Für nicht-rechteckige Räume war der erste Ansatz, einzelne Randzellen zwischen
benachbarten Räumen wandern zu lassen. Das erzeugte zwar formal unregelmäßige
Räume (93 %), sah aber falsch aus: ausgefranste Ränder, einzelne Zellen als
Finger, Räume die ineinandergreifen. Kein Gebäude sieht so aus.

*Korrektur:* Statt einzelner Zellen werden **rechteckige Bisse** von bis zu
3 × 3 Zellen verschoben. Das liefert gerade Wände und damit genau die Formen,
die Gebäude haben — L-Formen, T-Formen, Nischen. Zugleich wurden die Runden von
1,6 je Zelle auf 1,2 je Kantenlänge reduziert: wenige, dafür wirksame Eingriffe.
Ergebnis: gut 80 % nicht rechteckig, dazu schmale Gänge, und die Grundrisse
lesen sich als Gebäude.

### Unerwartetes Nebenergebnis: die Erzeugung wurde schneller

| Stufe | p95 vorher | p95 nachher |
|---|---|---|
| Sehr leicht | 18 ms | 15 ms |
| Leicht | 248 ms | 85 ms |
| Mittel | 113 ms | 113 ms |
| Schwer | 530 ms | 313 ms |
| **Experte** | **3149 ms** | **1286 ms** |

Unregelmäßige Räume sind für den Generator kein Preis, sondern ein Gewinn:
Gänge und L-Formen erzeugen mehr unterschiedlich große Räume, und das macht
`IN_ROOM`, `ALONE` und `ROOM_COUNT` schärfer. Bei 10×10 hat sich die Zeit mehr
als halbiert.

### Was mitgezogen werden musste

`Room` trägt jetzt `cells` plus `bounds` statt vier flacher Rechteckfelder — die
Zellmenge ist die Wahrheit, das Rechteck nur noch die Hülle. Betroffen waren:
Objektplatzierung (jede Zelle einer Grundfläche muss wirklich zum Raum gehören),
Rollenvergabe, Serialisierung, Dokumentprüfung (neu: Räume müssen
zusammenhängen) und die gesamte Darstellung. Das Gitter zeichnet Böden und
Wände jetzt zellweise: eine Wand entsteht dort, wo der Nachbar zu einem anderen
Raum gehört. Die Raumhervorhebung folgt demselben Prinzip und zeichnet den
Umriss aus einzelnen Kantenstücken — dadurch trägt sie jede Form.

Die alte, zufallsgetriebene Möblierung (`placeObjects`) wurde ersatzlos entfernt:
sie war seit der Umkehrung der Reihenfolge (Runde 5) tot und setzte rechteckige
Räume voraus.

### Ergebnis

| | |
|---|---|
| Bibliothekstests | 70 grün, davon 7 zur erzwungenen Entkopplung und 6 zu Raumformen |
| App-Tests | 1 grün (Katalog) |
| Abnahmelauf | 16 von 16 |
| Räume nicht rechteckig | über 80 % |
| Bibliothek baut eigenständig | `npm run build:lib` erzeugt `dist/` mit Typdeklarationen |

---

## Runde 12 — Grafik neu, Platzieren mit Konsequenzen

### Neue Vorbedingungen

| # | Prüfpunkt |
|---|---|
| A15 | Platzieren setzt Zeile und Spalte automatisch auf X und räumt die Markierungen der gesetzten Person weg |
| A16 | Alle Grafiken gelöscht und als frei skalierbares SVG neu erstellt |
| A17 | Stil klar und einfach, Figuren stilisiert und ohne Gesichter, aber klar unterscheidbar |

### B12-1 — Platzieren ließ ein regelwidriges Brett zu

Die Grundregel lautet: eine Person je Zeile und Spalte. Die Oberfläche ließ aber
zu, dass zwei Personen dieselbe Zeile belegen — ein Brett, das die Regel bricht,
ohne dass das Spiel es sagen darf, weil „Bestätigen" ja nichts verraten soll.

*Korrektur:* Beim Setzen zieht die Oberfläche jetzt alle Konsequenzen: Zeile und
Spalte bekommen ein X, die dadurch hinfälligen Notizen fallen weg, sämtliche
Notizen der gesetzten Person verschwinden, und eine Person, die dieselbe Linie
belegte, wird heruntergenommen. Rückgängig nimmt alles in einem Schritt zurück.
Sieben neue Tests decken das ab, einschließlich der Probe, dass sich die
richtige Lösung widerspruchsfrei komplett setzen lässt.

### B12-2 — Ein stehengebliebener Modulcache sah aus wie ein Codefehler

Nach dem Löschen der Rastergrafik meldete der Entwicklungsserver hartnäckig
„does not provide an export named 'Sprite'" — obwohl Typprüfung und
Produktionsbau sauber durchliefen und die Datei den Export nachweislich enthält.
Ursache war der Modulgraph des laufenden Vite-Servers, der noch die gelöschten
Dateien kannte; ein Neuladen im Browser half nicht, weil der Fehler auf der
Serverseite saß.

*Lehre für die Prüfung:* Ein Fehler, den nur der Entwicklungsserver zeigt und
weder Typprüfung noch Produktionsbau, ist zuerst ein Verdacht gegen den Server,
nicht gegen den Code. Server neu gestartet und `node_modules/.vite` geleert —
danach 49 Vektorgrafiken fehlerfrei, keine leere Form, kein Rasterbild mehr im
Dokument.

### Was ersatzlos entfallen ist

Sprite-Atlas und Rasterbilder samt Pipeline: `public/atlas.png`,
`src/app/render/atlas.ts`, `ownSprites.ts`, `palette.ts`,
`scripts/build-atlas.ts`, `preview-atlas.ts`, `zoom.ts`, `build-icons.ts`, die
PNG-Symbole und die CC0-Rohpakete unter `assets-src/`. Damit fällt auch die
Abhängigkeit `pngjs` weg und die Lizenzverwaltung erübrigt sich — es gibt keine
fremden Grafiken mehr.

### Nachweis

| | |
|---|---|
| Vektorgrafiken | 30 Requisiten, 14 Figuren, 8 Symbole, 1 App-Symbol |
| Rasterbilder im Dokument | 0 |
| Leere Formen | 0 |
| Tests | 70 Bibliothek + 12 App (7 zum Platzieren, 4 zur Grafikvollständigkeit) |
| Automatische X-Markierung im Browser | 10 bei 6×6, alle auf Zeile oder Spalte |

**Nicht geprüft:** Wie die neue Grafik *aussieht*. In dieser Umgebung sind keine
Bildschirmfotos möglich, und ein SVG lässt sich hier nicht rastern. Struktur,
Vollständigkeit und Fehlerfreiheit sind belegt, das gestalterische Urteil steht
aus. Das Übersichtsblatt aller Formen liegt bei.

---

## Runde 13 — Bodenbeläge

### A18 — Bodenkacheln mit passenden Grafiken

Die Böden waren bis hierher flache Farbflächen, der Raum-Id nach durchgezählt.
Das war beliebig: Farbe 3 sagte nichts über den Raum aus.

*Umsetzung:* Zehn Beläge als Vektorkacheln — Dielen, Fliesen, Platten, Estrich,
Teppich, Rasen, Erde, Kies, Sand, Wasser. Zugeordnet werden sie über den
**Raumnamen**, nicht die Id: im Bad Fliesen, auf dem Rasen Gras, in der
Werkstatt Estrich. Das trägt zum Spiel bei, statt es nur zu schmücken — fast
jeder Hinweis nimmt auf Räume Bezug, und ein wiedererkennbarer Boden macht die
Raumgrenzen ohne Nachlesen klar.

Drei Entwurfsentscheidungen, die aus dem Zusammenspiel folgen:

1. **Gedämpfte Töne.** Figuren und Requisiten sind kräftig gefärbt; ein
   naturalistisch heller Rasen hätte ihnen den Kontrast genommen.
2. **Fortlaufende Kacheln.** Fugen und Dielenstöße liegen so, dass sie sich an
   den Kanten treffen — sonst zerfiele der Boden sichtbar in Quadrate.
3. **Streuung aus dem Zellindex.** Halme, Kiesel und Fugen sitzen je Zelle
   anders, damit sich das Muster nicht wiederholt. Weil die Streuung nur vom
   Index abhängt, sieht dieselbe Zelle immer gleich aus — ein Test hält das fest.

Liegen zwei benachbarte Räume auf demselben Belag, trennt sie eine winzige
Helligkeitsstufe je Raum.

### Nachweis

| Theme | Räume und ihre Beläge |
|---|---|
| Werkstatt | Waschhalle Fliesen, Empfang Platten, Werkstatt + Lager Estrich, Büro Teppich |
| Wohnung | Küche Fliesen, Wohnzimmer + Flur + Arbeitszimmer Dielen, Schlafzimmer Teppich |
| Garten | Teichufer Wasser, Terrasse Platten, Schuppenplatz Kies, Gemüsebeet + Gewächshaus Erde |

Vier neue Tests: jeder Raum jedes Themes hat einen eigenen Belag (der Rückfall
auf Estrich ist nur für fremde Themes gedacht), jeder Belag lässt sich zeichnen,
dieselbe Zelle ergibt immer dasselbe Muster, und die Helligkeitsstufen sind
tatsächlich verschieden. Im Browser über alle drei Themes bestätigt: 64 von 64
Kacheln mit Grafik.

**Wieder nicht geprüft:** wie es aussieht. Das Übersichtsblatt der Beläge liegt
bei.

---

## Runde 14 — Umbau der Bibliothek

Die Bibliothek wurde vollständig überarbeitet: Englisch als einzige Sprache im
Quelltext, Gliederung in Schichten, i18next statt Eigenbau, dazu eine Testsuite,
die die Zusagen des Projekts nicht mehr nur behauptet, sondern prüft.

Diese Runde ist anders als die vorherigen. Frühere Runden prüften den Plan gegen
eine Liste. Hier prüfte der **Code sich selbst**: die neuen Tests fanden vier
Dinge, die beim Lesen niemandem aufgefallen waren.

### Neue Vorbedingungen

| # | Prüfpunkt |
|---|---|
| A19 | Kommentare, Variablen, Methoden und Klassen der Bibliothek sind englisch |
| A20 | Die Gliederung ist schlanker und wartbarer, nicht nur anders |
| A21 | i18n läuft über eine marktübliche Bibliothek |
| A22 | Testsuite belegt Korrektheit **und Plausibilität** der erzeugten Rätsel |

### B14-1 — Zwei Regelstufen waren unerreichbarer Code

Der Löser hatte vier Regelstufen: Hinweispropagation (R1), Permutationsregeln
(R2), Gruppenausschluss (R3) und Schnittfeldelimination (R4). R3 und R4 waren
sauber geschrieben, getestet und in der Dokumentation als Obergrenze der
Schwierigkeit geführt.

Eine Messung über 60 erzeugte Rätsel aller Stufen ergab: **beide feuerten kein
einziges Mal.** Das ist auch kein Zufall, sondern folgt zwingend aus dem Aufbau —
die Hinweissuche prüft aus Zeitgründen nur mit R1 und R2 auf Lösbarkeit, also
kann kein Rätsel ausgeliefert werden, das mehr braucht.

*Korrektur:* Beide Stufen entfernt, rund 250 Zeilen. `RuleLevel` schrumpft von
`1|2|3|4` auf `1|2`, `difficultyProof` von fünf Feldern auf drei (`maxRule` und
`stepsByRule` waren nur noch Konstanten). Das Austauschformat steigt damit auf
`schemaVersion: 2`, die Generatorversion auf `2`.

Der Nebeneffekt ist wichtiger als die gesparten Zeilen: die Hinweissuche rechnet
jetzt nachweislich mit demselben Regelwerk, das später den Spieler trägt. Vorher
war das eine Annahme.

### B14-2 — Ein echter Schichtverstoß, gefunden vom Test der Schichten

Die neue Gliederung ordnet den Code in Schichten mit einer Richtung:
`generation → solving → clues → core`. Ein Test liest die Importe und erzwingt
sie.

Beim ersten Lauf fiel `clues/constrain.ts` durch: die Datei griff nach `solving`.
Kein Tippfehler, sondern eine falsche Einordnung — sie beschreibt nicht, was ein
Hinweis *bedeutet*, sondern wie man *mit* ihm auf Kandidatenmengen schließt.

*Korrektur:* Datei nach `solving/propagate.ts` verschoben. Der Wert der Prüfung
liegt genau hier: gelesen hatte die Datei jahrelang niemand als deplatziert.

### B14-3 — Handgeführte Cache-Invalidierung als stille Fehlerquelle

Die Raumsicht des Lösers (welche Personen können in welchem Raum stehen) ist
teuer und wurde zwischengespeichert. Ungültig wurde der Speicher über eine
Hilfsfunktion, die an **20 Stellen** von Hand um jede verändernde Operation
gelegt war.

Das ist die gefährliche Sorte Fehler: wer eine neue Operation hinzufügt und den
Wrapper vergisst, bekommt keinen Absturz und keinen Testfehler, sondern **eine
falsche Antwort** — der Löser eliminiert dann einen Kandidaten, der noch möglich
war, und das Rätsel wird unlösbar oder mehrdeutig.

*Korrektur:* Der Kandidatenzustand führt einen Änderungszähler. Der Cache prüft
ihn und rechnet neu, wenn er sich bewegt hat. Vergessen kann man nichts mehr,
weil es nichts mehr zu tun gibt.

### B14-4 — Eine Zusage im Test war schlicht nicht wahr

Ein neuer Test behauptete, die gemessene Streuung wachse von Stufe zu Stufe
monoton. Er fiel: „Schwer" maß 8,86, „Mittel" 10,03.

Die Nachmessung mit 24 Rätseln je Stufe zeigt, dass die **Mittelwerte** sehr
wohl steigen (4,78 → 7,49 → 8,85 → 10,99 → 12,10), die Streuung innerhalb einer
Stufe aber bei 0,9 bis 2,95 liegt. Benachbarte Stufen überlappen sich deshalb in
kleinen Stichproben zwangsläufig. Der Test war zu stark formuliert, nicht der
Generator kaputt.

*Korrektur:* Der Test prüft jetzt, was tatsächlich gilt und was das Spiel
braucht — die Schranken steigen von Stufe zu Stufe, über die volle Spanne steigt
auch die Messung, und **jedes einzelne** Rätsel erfüllt die Schranke der Stufe,
die es behauptet. Ein Test, der gelegentlich grundlos rot ist, wird ignoriert;
das wäre der teurere Fehler gewesen.

### Weitere Befunde ohne eigene Nummer

- **Toter Code:** `potential.ts` und `splitClues` wurden nirgends aufgerufen.
- **Veränderlicher Ausgabeparameter:** die Hinweissuche meldete ihren Fehlgrund
  über ein beschreibbares Objekt. Ersetzt durch ein Ergebnis mit Fallunter-
  scheidung, das der Compiler prüfen kann.
- **Quadratische Schleife im Grundriss:** die Zuordnung Zelle → Raum wurde für
  jede Zelle eines Gangs neu aufgebaut. Jetzt inkrementell.
- **Fünf ungeprüfte Feldzugriffe**, die erst der verschärfte Compilerschalter
  `noUncheckedIndexedAccess` sichtbar machte.
- **Fehlalarme der Prüfungen selbst:** die Englisch- und Plattformprüfung schlug
  auf Kommentare und Modulpfade an; die i18n-Prüfung hielt den korrekten
  englischen Satz „…of the room." für einen übriggebliebenen Schlüssel. Wie in
  Runde 11: eine Prüfung braucht selbst Prüfung.

### Nachweis

| | Vorher | Nachher |
|---|---|---|
| Tests der Bibliothek | 70 | 159 schnell + 17 gründlich |
| Tests der App | 16 | 16 |
| Eigenschaftsbasierte Tests | 0 | 8 schnell + 5 gründlich (fast-check) |
| Eingefrorene Prüfsummen | 0 | 10 Seeds + 2 vollständige Beispielrätsel |
| Erzwungene Schichtgrenzen | nein | ja |
| Regelstufen | 4 (2 unerreichbar) | 2 |
| Felder in `difficultyProof` | 5 | 3 |
| Typfehler / Lint-Fehler | 0 / 0 | 0 / 0 |

**Generierungszeit** (Node, je 25 Seeds; Experte zusätzlich mit 60 gemessen):

| Stufe | vorher Mittel / p95 | nachher Mittel / p95 |
|---|---|---|
| Sehr leicht | 8 ms / 21 ms | 5 ms / 15 ms |
| Leicht | 26 ms / 52 ms | 16 ms / 32 ms |
| Mittel | 37 ms / 118 ms | 39 ms / 94 ms |
| Schwer | 80 ms / 192 ms | 96 ms / 221 ms |
| Experte | 223 ms / 720 ms | 193 ms / 863 ms |

Der Umbau war nicht auf Geschwindigkeit angelegt; die Werte belegen, dass er
keine gekostet hat. Die p95-Werte bei Experte schwanken stark, weil einzelne
unglückliche Seeds viele Versuche brauchen — der Median liegt dort bei 91 ms.

Im Browser über alle drei Themes durchgespielt: Rätsel wird erzeugt, Hinweise
erscheinen auf Deutsch über i18next, Platzieren setzt die X-Markierungen,
Bestätigen und Auflösung funktionieren, keine Meldung in der Konsole.

**Nicht geprüft:** ob die Bibliothek in einem *fremden* Projekt so bequem zu
benutzen ist, wie ihre Schnittstelle nahelegt. Der Test mit einem fremden Theme
und die fehlenden Laufzeitabhängigkeiten zeigen, dass es technisch geht; das
Urteil über die Handhabung kann nur jemand fällen, der sie einbindet.

---

## Runde 15 — Grafiken als Dateien, Raumgrenzen für alle

Zwei Änderungen aus dem Spielbetrieb, dazu ein Befund, den erst die Umstellung
sichtbar gemacht hat.

### Neue Vorbedingungen

| # | Prüfpunkt |
|---|---|
| A23 | Jede Grafik liegt als eigene SVG-Datei vor und ist ohne Codeänderung austauschbar |
| A24 | Erzeugt wird nur während der Entwicklung, nie im laufenden Spiel |
| A25 | Jedes Theme hat ein eigenes Grafikset nach seiner Theme-Definition |
| A26 | Raumgrenzen sind ohne Maus erkennbar |

### B15-1 — Raumgrenzen gab es nur für die Maus

Die Grenzen waren als dünner Schatten je Kachel angedeutet; deutlich sichtbar
wurden sie erst, wenn der Zeiger über dem Raum stand.

Auf dem Handy gibt es keinen Zeiger. Damit fehlte dort genau die Information,
auf die sich fast jeder Hinweis bezieht — „allein im Raum", „im selben Raum
wie". Das Spiel war am Schreibtisch vollständig und auf dem Gerät, für das es
ausdrücklich gebaut wurde, unvollständig.

*Umsetzung:* Jeder Raum bekommt **immer** eine dicke schwarze Linie, die Felder
darin trennt ein dünner Strich. Beide Stärken wachsen mit der Feldgröße und
haben eine Untergrenze, damit sie auch bei 10×10 auf 360 px als zwei
verschiedene Stärken lesbar bleiben — darauf kommt es an, nicht auf die absolute
Dicke. Die Hervorhebung unter der Maus bleibt als Zugabe am Schreibtisch.

Gezeichnet wird alles in **einem** SVG statt als Schatten je Kachel. Der alte
Weg zeichnete jede geteilte Kante zweimal halb, weshalb eine Raumgrenze doppelt
so dick geriet wie der Brettrand — bei einer dünnen Linie fällt das nicht auf,
bei einer dicken sofort.

### B15-2 — Die Grafiken steckten im Programm

Alle Formen standen als JSX im Quelltext der App. Für Platzhalter war das
bequem, für den geplanten Austausch gegen endgültige Grafiken aber der falsche
Ort: jede neue Zeichnung wäre eine Codeänderung gewesen, mit Übersetzungslauf
und Prüfung, statt ein Dateitausch.

*Umsetzung:* `npm run art` schreibt jede Form als eigenständige SVG-Datei nach
`art/`, geordnet nach Theme. Die App lädt nur noch Dateien. Die
Zeichenvorschriften liegen in `scripts/art/`, außerhalb der App — ist die
endgültige Grafik da, kann der Ordner ersatzlos weg.

Zwei Entscheidungen, die daran hängen:

1. **Einbetten beim Bauen, nicht Laden zur Laufzeit.** Die Dateien liegen im
   Bündel statt hinter je einer Anfrage. Das hält die Offline-Zusage (G11) ohne
   Zutun des Service Workers und spart 70 Anfragen.
2. **Ein Vermerk in jeder erzeugten Datei.** Fehlt er, stammt die Datei von
   jemand anderem und wird nicht überschrieben. Ohne diese Sperre hätte ein
   gedankenloses `npm run art` die Arbeit einer Grafikerin gelöscht — genau der
   Fall, auf den die ganze Umstellung hinarbeitet.

### B15-3 — `carpet` war zweierlei, und das Spiel wusste es nicht

Die Grafiken wurden zunächst allein über den Dateinamen gefunden; der Ordner
(`objects`, `floors`, …) galt als Ordnung fürs Auge.

In der Wohnung heißt aber **beides** `carpet`: der Teppich, auf dem jemand
steht, und der Teppichboden des Schlafzimmers. Die zuletzt eingelesene Datei
gewann — und das halbe Zimmer bekam eine Requisite als Bodenbelag ausgelegt.
Im Browser war es sofort zu sehen: zwanzig orange Rechtecke, wo ein ruhiger
Teppichboden liegen sollte.

*Korrektur:* Die **Art** der Grafik gehört zum Schlüssel, nicht nur ihr Name.
`artUrl('floors', 'carpet', 'flat')` und `artUrl('objects', 'carpet', 'flat')`
sind zwei verschiedene Dinge, und die Aufrufer sagen, welches sie meinen.

Bemerkenswert ist, woran es *nicht* lag: die Datei war da, der Test „jedes
Objekt hat eine Datei" grün, der Test „keine Datei ohne Verwendung" ebenfalls.
Beide prüften die Dateien, nicht das Nachschlagen. Ein Test prüft das jetzt.

### Weitere Befunde ohne eigene Nummer

- **Streuwert lief ins Minus.** Die Bodenkacheln streuten Halme und Kiesel über
  `h >> n` — ein vorzeichenbehafteter Schiebebefehl. Für jeden zweiten Wert
  wurde das Ergebnis negativ und die Halme landeten links neben der Kachel. Der
  Fehler steckte schon in der alten Fassung und fiel nie auf, weil je Zelle neu
  gestreut wurde und genug Halme zufällig im Bild lagen. Behoben mit `>>>`, und
  ein Test sucht jetzt nach negativen **absoluten** Koordinaten.
- **Streuung durch Spiegelung ersetzt.** Als Datei gibt es je Belag genau ein
  Bild. Gegen sichtbare Wiederholung spiegelt die App die Kachel je Zelle — aber
  nur bei Rasen, Erde, Kies und Sand, wo nichts über die Kante läuft. Fugen,
  Dielenstöße und Wellen blieben sonst an der Nahtstelle zerschnitten.
- **Bediensymbole heißen jetzt `ui-x` statt `ui.x`.** Ein Punkt im Namen ergibt
  eine Datei `ui.x.svg`, die wie ein Versehen aussieht.

### Nachweis

| | Vorher | Nachher |
|---|---|---|
| Grafiken im Quelltext der App | 62 Formen als JSX | 0 |
| Grafiken als Datei | 0 | 70 |
| Themes mit eigenem Set | 0 | 3 |
| Tests der App | 16 | 27 |
| Bündel (roh / gzip) | 280,2 kB / 86,9 kB | 298,9 kB / 88,0 kB |

Der Zuwachs ist der Preis dafür, dass die Dateien mit im Bündel liegen: 70
Grafiken kosten 18,7 kB roh und 1,1 kB nach Kompression — weniger, als 70
einzelne Anfragen kosten würden, und offline verfügbar ohne Zutun.

Im Browser über alle drei Themes geprüft: Requisiten, Figuren, Symbole und
Böden erscheinen aus den Dateien, die Raumgrenzen sind bei 5×5 wie bei 10×10
klar zu sehen, auf 375 px Breite ebenso wie auf dem Schreibtisch, die
Hervorhebung beim Schweben folgt auch L- und U-förmigen Räumen genau, Platzieren
und die automatische X-Markierung funktionieren unverändert, keine Meldung in
der Konsole.

**Nicht geprüft:** wie das Spiel mit *endgültigen* Grafiken aussieht. Dass ein
Austausch technisch trägt, zeigen der Aufbau und die Tests; das gestalterische
Urteil steht weiterhin aus.

---

## Runde 16 — Versionsnummer

Eine Ergänzung, ein Befund aus ihrer Umsetzung.

### Neue Vorbedingung

| # | Prüfpunkt |
|---|---|
| A27 | Das Spiel zeigt eine Versionsnummer `<Jahr>.<Nummer>`, die bei Änderungen hochzählt |

### B16-1 — Die Fußzeile schrumpfte den Katalog auf halbe Breite

Damit die Fußzeile unten steht, auch wenn der Inhalt kurz ist, wurde `#root`
eine Flexspalte und der Bildschirm darin ein Gitter — der übliche Griff.

Im Browser war der Katalog danach 517 statt 1009 Pixel breit und saß mittig in
der Seite. Grund: `.catalog` und `.game` zentrieren sich über `margin: 0 auto`,
und **automatische Ränder schalten in Gitter wie in Flexbox das Dehnen ab**. Das
Element bekommt dann seine Inhaltsbreite statt der vollen Spalte.

*Korrektur:* Der Bildschirm bleibt ein gewöhnlicher Block; nur `#root` ist eine
Flexspalte. Damit der Ladebildschirm trotzdem die Fläche über der Fußzeile
füllt, rechnet er sie aus: `min-height: calc(100dvh - var(--footer-h))` statt
`height: 100%` — ein Prozentwert bräuchte eine feste Bezugshöhe, die es hier
nicht gibt.

Der Befund ist typisch für die Sorte Fehler, die kein Test findet: nichts
stürzte ab, nichts war falsch berechnet, es sah nur verkehrt aus. Gefunden im
Browser, nachgemessen an `getBoundingClientRect`.

### Nebenbei behoben

- **Das Brett hätte sich aus dem Bild geschoben.** Der Spielbildschirm rechnet
  die Gittergröße aus dem Viewport, nicht aus einer Messung. Alles, was unter
  dem Brett Platz belegt, muss deshalb abgezogen werden — die Fußzeile gibt ihre
  Höhe dafür als `FOOTER_PX` weiter. Nachgemessen: 10×10 auf 375×812 passt jetzt
  ohne Scrollen in die Seite (827 → 812 px), weil der alte Abstand nach unten
  zugleich von 40 auf 16 px konnte: diese Aufgabe erfüllt jetzt die Fußzeile.

### Entscheidungen

**Kein Semver.** `2026.4` heißt: die vierte Fassung aus diesem Jahr. Semantische
Versionen sagen etwas über Verträge zwischen Programmen zu — die Bibliothek hat
solche Nutzer und behält deshalb Semver, das Spiel hat Menschen vor dem
Bildschirm.

**Eine Quelle.** Die Nummer steht in der `package.json` und wird beim Bauen
eingesetzt. Eine zweite Stelle hieße, dass beide auseinanderlaufen können, und
eine Versionsnummer, der man nicht glauben kann, ist schlimmer als keine. Ein
Test vergleicht, was die Oberfläche anzeigt, mit dem, was in der Datei steht.

Geprüft wurde vorab, ob npm ein nicht-semantisches Feld `version` überhaupt
akzeptiert: `npm install --dry-run` und `npm run` laufen damit durch. Andernfalls
hätte es eine zweite Datei gebraucht.

**Nicht an den Bau gehängt.** Gebaut wird auch zum Ausprobieren, und dabei
ändert sich nichts am Spiel. `npm run bump` ist ein eigener Aufruf, weil nur der
Mensch weiß, ob er etwas geändert hat.

### Nachweis

| | |
|---|---|
| Anzeige | Fußzeile auf jedem Bildschirm: Katalog, Laden, Fehler, Spiel |
| Format | `<Jahr>.<Nummer>`, geprüft gegen `/^\d{4}\.\d+$/` |
| Gleichstand | angezeigte Nummer = `package.json`, im Test verglichen |
| Jahreswechsel | `2026.57` → `2027.1`, im Test festgehalten |
| Zählung | `2026.9` → `2026.10`, `2026.99` → `2026.100` — als Zahl, nicht als Text |
| Abgelehnte Eingaben | `0.1.0`, `2026`, `v2026.1`, `2026.`, `26.1`, leer |
| `npm run bump` | am Kopie-Stand geprüft: `2026.1 → 2026.2 → 2026.3`, `--show` ändert nichts, nur die Versionszeile der Datei wird angefasst |
| Tests der App | 27 → 35 |

Startwert ist **2026.1** — die erste Fassung mit Versionsnummer.

---

## Runde 17 — Gemeldeter Fehler und zwei Verbesserungen an den Karten

### M17-1 — „Neben einem Stuhl", obwohl sie darauf saß: **kein Fehler**

Gemeldet am Tagesfall `v2-garage-6-vl-u8iyn8`: Nadja trägt den Hinweis „Sie war
neben einem Stuhl", steht laut Lösung aber **auf** dem Stuhl.

Nachgestellt und einzeln nachgerechnet:

| | |
|---|---|
| Nadjas Feld | 21 |
| Stuhl im Gitter | Feld 21 — dasselbe |
| Berührungsmenge des Feldes | 20, 21, 27 (eigenes Feld plus Nachbarn im selben Raum) |
| berührte Stuhl-Instanzen | 1 |
| Hinweis trifft zu | ja |
| Gesamtprüfung | `deducible`, `cluesTrue`, `unique: yes`, keine Beanstandung |

Die **Berührungsmenge schließt das eigene Feld ein** (§4.1). Das ist keine
Nachlässigkeit, sondern Murdokus ausdrückliche Regel aus der FAQ: „Wer auf einem
Stuhl sitzt, ist auch neben einem Stuhl." Sie steht wörtlich in der
Spielanleitung des Spiels selbst, unter *Schlüsselwörter → neben*.

Wichtiger als die Regeltreue ist, dass der Löser **dieselbe** Definition benutzt.
Täte er es nicht, wäre das Rätsel mehrdeutig oder unlösbar — beides würde die
Eindeutigkeitsprüfung melden. Sie meldet nichts.

Der Hinweis ist also wahr und das Rätsel korrekt. Was zu Recht auffällt: er ist
**schwächer als nötig**. Die Hinweissuche schwächt absichtlich ab, solange das
Rätsel lösbar bleibt (§6.6) — aus „saß auf einem Stuhl" wird „neben einem
Stuhl", und genau das macht die Stufe aus. Ob die Suche diesen einen Schritt
unterlassen soll, ist eine Spielentscheidung und kein Fehler; sie wäre mit einer
Einschränkung in der Hinweissuche umsetzbar und machte die Rätsel leichter.

### V17-1 — Marken tragen den Anfangsbuchstaben des Namens

Bisher bekamen die Verdächtigen A, B, C … nach ihrer Reihenfolge. Wer auf dem
Brett ein „D" sah, musste in der Liste abzählen, wer das ist.

*Umsetzung:* Der Anfangsbuchstabe des Namens. Nadja ist „N".

Das trägt nur, solange die Anfangsbuchstaben verschieden sind. Der Namensvorrat
erfüllt das (24 Namen, 24 verschiedene Buchstaben), aber nirgends stand, dass er
es muss — **ein neuer Name hätte das stillschweigend brechen können**, und zwei
gleiche Marken lassen ein lösbares Rätsel unlösbar aussehen. Deshalb zweifach
abgesichert: ein Test der Bibliothek hält den Vorrat fest, und die Oberfläche
verlängert kollidierende Marken so weit, wie zur Unterscheidung nötig ist
(„Marek" und „Marta" trennen sich erst beim vierten Buchstaben).

### V17-2 — Das Opfer steht in der Liste zuletzt

Es ist die einzige Karte, die nichts zu ermitteln gibt; mitten in der Reihe
unterbricht sie die Liste der Verdächtigen.

*Nebenbefund:* Vorausgewählt war bisher die Karte mit der Id 0. Gemessen über
120 Rätsel ist das Opfer in **21 von 120 Fällen** (18 %) die Id 0 — dort hätte
die Vorauswahl nach der Umstellung ganz unten gesessen, während der Blick oben
anfängt. Die Anfangsauswahl überspringt das Opfer jetzt ausdrücklich.

Beide Änderungen sind **reine Darstellung**. Die Id bleibt der Index in Lösung,
Platzierungen und Notizen — ein Test prüft, dass die umsortierte Liste niemanden
verliert oder doppelt führt.

### Nebenbefund: der Entwicklungsserver zeigte die alte Nummer

Die Versionsnummer wird beim Laden der Vite-Konfiguration eingesetzt. Gelesen
wurde die `package.json` mit `fs` — damit ist sie für Vite keine Abhängigkeit
der Konfiguration, und nach `npm run bump` blieb im Browser die alte Nummer
stehen, bis jemand den Server von Hand neu startete. Genau die Sorte
Ungenauigkeit, die eine Versionsnummer wertlos macht.

*Korrektur:* Die Konfiguration **importiert** die `package.json`, statt sie zu
lesen. Vite nimmt sie damit in den Abhängigkeitsgraph der Konfiguration auf und
startet von selbst neu. Nachgestellt: `npm run bump` auf 2026.3, ohne weiteres
Zutun zeigte die Fußzeile 2026.3. Danach zurück auf 2026.2 gesetzt — der Sprung
war der Beweis des Mechanismus und keine Änderung am Spiel.

### Nachweis

| | |
|---|---|
| Tests der App | 35 → 44 |
| Tests der Bibliothek | 159 → 162 (Namensvorrat) |
| Im Browser | `v2-garage-6-vl-u8iyn8`: Marken U/O/J/N/P/T, Tamara zuletzt; Nadja auf Feld 21 zeigt „N", Notiz von Urs zeigt „U" |
| Opfer mit Id 0 | `v2-flat-6-vl-3ux`: Lucia steht als letzte Karte, vorausgewählt ist Emilio |
| Handy 375 px | Kartenband in derselben Reihenfolge |

**Nicht geändert:** die Regel aus M17-1. Ob „neben" das eigene Feld einschließen
soll, ist eine Entscheidung über das Spiel, nicht über den Code.

---

## Runde 18 — „Neben" nennt nie mehr, worauf jemand steht

Runde 17 hat den gemeldeten Fall untersucht und als regelkonform belegt. Der
Auftraggeber hat daraufhin entschieden, die Hinweissuche trotzdem zu ändern.
Beim Umsetzen kamen drei weitere Befunde heraus.

### Die Entscheidung

Die Berührungsmenge schließt die eigene Zelle ein, also ist „neben einem Stuhl"
wahr, während man darauf sitzt. Wahr ist aber nicht dasselbe wie redlich.

Ausschlaggebend war ein Blick in den eigenen Code: **`ALIGNED_WITH_OBJECT`
überspringt die Instanz unter den Füßen seit jeher** — mit dem Kommentar „würde
den Hinweis trivial wahr machen". Dieselbe Überlegung war bei
`ADJACENT_OBJECT` nie angewandt worden. Es ging also nicht um Geschmack,
sondern um eine Inkonsistenz.

*Umsetzung:* `ADJACENT_OBJECT` wird für einen Objekttyp gar nicht erst
angeboten, auf dem das Subjekt steht. Die **Regel bleibt unverändert** — „neben"
schließt die eigene Zelle weiterhin ein, der Löser rechnet genauso, die
Spielanleitung stimmt weiter. Geändert hat sich nur, welche Sätze die
Hinweissuche in die Hand nimmt.

Doppelt abgesichert: die Hinweisauswahl bietet solche Sätze nicht an, und
`verifyPuzzle` verwirft ein Rätsel, das trotzdem eines enthielte. Dafür braucht
die Einschränkungsprüfung jetzt die Lösung — ohne sie lässt sich „steht darauf"
nicht feststellen.

### Folgen, die dazugehören

**Generatorversion 2 → 3.** Dieselbe Zeichenkette erzeugt jetzt ein anderes
Rätsel, also muss der Seed es sagen. Alle Links der Form `v2-…` funktionieren
nicht mehr — genau so vorgesehen (§6.1), denn ein Link, der etwas anderes zeigt
als versprochen, ist schlimmer als einer, der ehrlich nicht mehr funktioniert.
Der Katalog wurde neu erzeugt (30 von 30), die eingefrorenen Referenzdaten
ebenfalls. Die Bibliothek steht auf 2.0.0, weil sich auch eine öffentliche
Signatur geändert hat.

Dass der Fall häufig war, zeigt die Umstellung selbst: **das gespeicherte
Expertenbeispiel aus Version 2 fiel durch die neue Prüfung.** Es war keine
Einzelbeobachtung des Auftraggebers.

### B18-1 — Das Referenzskript schrieb in den falschen Ordner

`write-reference.ts` legte seine Dateien relativ zum **Arbeitsverzeichnis** an.
Vom Projektstamm aufgerufen entstand ein zweiter Ordner `tests/reference/` in
der Wurzel, während die Tests weiter die alten Daten aus dem Paket lasen.

Das Tückische: Das Skript meldete Erfolg („checksums: 10 | samples: 2"), und die
Tests schlugen weiter fehl — mit derselben Meldung wie vorher. Ohne den Blick
auf die Änderungszeit der Dateien wäre die Suche in die falsche Richtung
gelaufen.

*Korrektur:* Das Skript verankert seine Pfade an der eigenen Datei. Dazu ein
npm-Skript `reference` im Paket, damit der Aufruf nicht vom Verzeichnis abhängt,
und eine Ausgabe, die den Zielordner nennt.

### B18-2 — Die Absage an alte Links war sachlich falsch

Wer einen `v2`-Link öffnete, las: „Für diesen Seed ließ sich kein Rätsel
erzeugen", darunter englisch „Seed was made by generator version 2, this is
version 3". Beides unbefriedigend — die Erzeugung ist nicht fehlgeschlagen, sie
hat richtigerweise gar nicht erst stattgefunden, und die Begründung stand in der
falschen Sprache.

Vor dieser Runde sah das nie jemand: Die Generatorversion hatte noch nie
gewechselt. Die Änderung hat den Pfad erst begehbar gemacht.

*Korrektur:* Die App erkennt die fremde Version an der Zeichenkette, bevor der
Worker anläuft, und sagt in der Sprache des Spielers, was los ist.

### B18-3 — Der Beispiel-Seed im Eingabefeld war seit Version 2 falsch

Im Feld „Eigener Seed" stand `z. B. v1-garage-6-vl-k3f9tq` — ein Beispiel, das
die App selbst abgewiesen hätte. Übersehen beim letzten Versionswechsel.

*Korrektur:* Das Beispiel wird aus `GENERATOR_VERSION` gebaut und kann nicht
mehr veralten. Ein Test prüft zusätzlich, dass der Katalog ausschließlich Seeds
der aktuellen Version enthält.

### Eine verschluckte Escape-Sequenz, zweimal

Beim Schreiben der Versionsprüfung wurde aus `/^v(\d+)-/` beim Erzeugen der
Datei `/^v(d+)-/` — ein Muster, das nie greift. Der Bildschirm sah aus wie
vorher, nichts schlug fehl. Derselbe Fehler passierte kurz darauf im Test, der
ihn hätte fangen sollen. Beide Male im Browser bemerkt, beide Male behoben; der
Test hält den Ausdruck jetzt fest.

### Nachweis

| | Vorher | Nachher |
|---|---|---|
| Tests der Bibliothek | 162 | 165 |
| Tests der App | 44 | 52 |
| Gründlicher Lauf | 179 | 183 |
| Generatorversion | 2 | 3 |
| Bibliotheksversion | 1.0.0 | 2.0.0 |

**Generierung** (je 25 Seeds, kleinerer Hinweisvorrat):

| Stufe | Mittel | p95 | Versuche je Rätsel | Fehlschläge |
|---|---|---|---|---|
| Sehr leicht | 4 ms | 11 ms | 0,7 | 0 |
| Leicht | 11 ms | 22 ms | 0,8 | 0 |
| Mittel | 30 ms | 79 ms | 1,0 | 0 |
| Schwer | 59 ms | 171 ms | 1,4 | 0 |
| Experte | 141 ms | 393 ms | 2,2 | 0 |

Der kleinere Hinweisvorrat kostet nichts: keine Fehlschläge, Zeiten in derselben
Größenordnung wie zuvor. Die Stufenschranken gelten unverändert, kein Rätsel
rutscht unter seine Bar.

Im Browser geprüft: Der Tagesfall `v3-garage-6-vl-u8iyn8` sagt jetzt „Dana saß
auf einem Stuhl" statt „neben einem Stuhl", Brigitte „war auf einem Ölfleck",
und Oskar steht auf einem Auto und ist „neben einem Ölfleck" — also weiterhin
„neben", wo es zutrifft. Der alte Link `v2-garage-6-vl-u8iyn8` wird mit
deutscher Begründung abgewiesen.

---

## Runde 19 — Requisiten je Grundfläche, gewählte Person im Gitter

### V19-1 — Eine Grafik je Grundfläche statt eine je Objekt

Bisher gab es je Requisite **eine** 24×24-Grafik. Ein Bett belegt aber mal zwei
Felder nebeneinander, mal zwei übereinander, ein Küchenblock drei. Für eine
quadratische Grafik gab es nur zwei schlechte Möglichkeiten, das abzubilden:
verzerren oder klein in die Mitte setzen. Der Renderer tat Letzteres — ein
dreifeldriger Küchenblock war ein kleines Sinnbild in einem großen leeren
Kasten.

*Umsetzung:* Der Dateiname trägt die Grundfläche in Feldern, Breite mal Höhe:
`bed_2x1.svg`, `bed_1x2.svg`, `kitchenunit_3x1.svg`. Die Zeichenfläche wächst
mit — 24 je Feld —, und der Renderer legt die Datei über genau diese Felder.
Damit ist ein Bett quer **kein gedrehtes Bett längs** mehr, sondern eine eigene
Zeichnung.

54 Varianten über drei Themes, 32 alte Dateien ersetzt. Welche es gibt,
bestimmt allein die Theme-Definition der Bibliothek; ein Test vergleicht beides
und prüft zusätzlich, dass die Zeichenfläche zur Grundfläche passt.

**Die Platzhalter werden nicht einzeln gezeichnet.** 54 Varianten von Hand wären
Arbeit für Bilder, die ohnehin ersetzt werden. Stattdessen setzt der Erzeuger
das vorhandene Sinnbild auf eine Platte in der Größe der Grundfläche. Der
Platzhalter zeigt damit beides — **wie viel Platz** das Objekt belegt und
**welches** es ist — und sieht erklärtermaßen nach Platzhalter aus. Die Platte
nimmt den Ton der ersten Fläche des Sinnbilds: grob, aber es macht eine
Werkbank braun und einen Teich blau, ohne eine zweite Liste, die veralten kann.

Zwei Kleinigkeiten, die daran hingen:

- **Einrückung um zwei Einheiten.** Die Kachel darunter zeigt mit ihrer Färbung,
  ob jemand auf dem Objekt stehen darf. Eine randlos füllende Platte hätte diese
  Auskunft verdeckt.
- **`object-fit: contain` auf jeder Grafik.** Passt eine ausgetauschte Datei
  nicht genau auf ihre Grundfläche, gibt es Luft an den Rändern statt eines
  gestauchten Tisches.

Requisiten außerhalb des Gitters brauchten einen Namen mit Grundfläche: die
Themenbilder im Katalog (`car_2x2`, `bed_2x2`, `tree_1x1`) und das Tutorialbild
(`bush_1x1`). Ohne das wären sie leer geblieben — der Test über alle
Tutorialbilder hätte es gemeldet.

### V19-2 — Die gewählte Person leuchtet im Gitter

Wer eine Karte wählt, sieht jetzt sofort, wo diese Person schon steht und wo sie
vermutet wurde: Platzierung **und** Bleistiftnotizen dieser Person werden farbig
hervorgehoben.

Auf einem vollen 10×10-Gitter stehen sonst ein Dutzend gleich aussehender
Buchstaben nebeneinander, und man sucht seinen eigenen. Die Notizen sind dabei
genauso wichtig wie die Platzierung: sie sind die Auskunft „hier habe ich sie
schon einmal vermutet", und die steckte bis dahin nur in der Erinnerung.

### Nachweis

| | Vorher | Nachher |
|---|---|---|
| Grafikdateien | 70 | 92 |
| davon Requisiten | 32 | 54 |
| Tests der App | 54 | 58 |
| Bündel (roh / gzip) | 300,4 kB / 88,5 kB | 319,9 kB / 89,5 kB |

Im Browser an `v3-flat-8-m-1h8s` geprüft: 14 Objekte, alle aufgelöst, keines
ohne Grafik. Die Bildmaße folgen der Grundfläche — 48×24 für `2x1`, 24×48 für
`1x2` —, die Zeichenflächen ebenso. Beim Wählen von Brigitte leuchten ihre
beiden Notizen auf, Yaras Platzierung bleibt unverändert; beim Wechsel zu Yara
kehrt es sich um.

**Ein eigener Fehlgriff:** Die erste Messung der Hervorhebung las noch das alte
Stylesheet und meldete die Notizen in Türkis statt in der neuen Farbe. Erst ein
vollständiges Neuladen zeigte den wahren Stand. Die Klassen stimmten von Anfang
an — beinahe hätte ich eine Farbe „repariert", die nie falsch war.

---

## Runde 20 — Engine ins Projekt, Kalender statt Katalog, Spiel ohne Maus

Der größte Umbau seit Runde 14, und in gewissem Sinn ihre Rücknahme: die
Bibliothek, die dort aus der App herausgelöst wurde, kehrt zurück — aber mit
einer Grenze, die diesmal ausgesprochen ist statt geerbt. Dazu ersetzt ein
Kalender die kuratierte Fallliste, und das Spiel lässt sich ohne Maus bedienen.

**Neun Befunde, davon vier selbst eingebaut und im Browser wieder gefunden.**

### V20-1 — Die Paketgrenze fiel weg, und mit ihr der Schutz

`packages/puzzle/` ist nach `src/engine/` gewandert, 30 Aufrufstellen zeigen
jetzt auf `@engine` beziehungsweise `@engine/i18n`. Damit verschwand die
`exports`-Klausel, die bis dahin verhinderte, dass jemand an `solving/solve.js`
greift.

Ersatz sind zwei Wächter (§8.1.1): eine Lint-Regel, die beim Schreiben greift,
und `tests/boundary.test.ts`, der auch dann greift, wenn jemand den Linter
überspringt. **Der Test meldete beim ersten Lauf drei Verstöße — einen davon
hatte ich zehn Minuten zuvor selbst eingebaut**, indem ich `write-reference.ts`
beim Umzug auf einen relativen Pfad statt auf die Tür setzte.

Ein zweiter Befund fiel dabei auf: die Bibliothek fuhr unter **strengeren
Compilerschaltern** als die App. Eine gemeinsame `tsconfig.json` hätte die
Engine entschärft. Es gibt jetzt zwei.

### V20-2 — Der erste Lint der App: 21 Befunde, 17 davon irreführend

Die App war nie gelintet worden. Von den 21 Befunden waren 17 derselbe:
`no-unnecessary-type-assertion` auf Feldzugriffen wie `parts[parts.length - 1]!`.
Diese Zusicherungen sind nur „unnötig", weil die App `noUncheckedIndexedAccess`
aus hatte — in der Engine wären dieselben Zeilen Pflicht.

Statt die Regel abzuschalten, wurde gemessen, was der Schalter kostet: **ein
einziger Fehler.** Also angeschaltet. Die 17 Zusicherungen sind damit wieder
Pflicht, und die Regel behält ihre Zähne.

Die restlichen vier waren echt: ein Versprechen an `onClick`, zwei
Zustandssetzungen in Effekten, ein wirkungsloses `void`.

### V20-3 — Eine Ref beim Zeichnen, und der Spielstand war weg

Beim Beheben einer dieser Zustandssetzungen wurde `restored` von `useState` auf
`useRef` umgestellt — **und das Speichern ging kaputt.** Der schreibende Effekt
sieht den Zustand des Renders, der gerade fertig wurde, und das ist beim ersten
Durchlauf das leere Brett. Er überschrieb den geladenen Spielstand, bevor er
sichtbar wurde.

Die Tests blieben dabei grün. Aufgefallen ist es erst, als im Browser eine Figur
gesetzt und neu geladen wurde.

Zurückgebaut wurde nicht: der gespeicherte Stand ist jetzt der **Anfangszustand**
der Sitzung (§8.4). Kein Merker, kein Wettlauf, ein Render weniger — und die
`restore`-Aktion im Reducer ist ersatzlos entfallen.

Dabei fiel eine zweite Sache auf: seit ein zwischengespeichertes Rätsel ohne
Ladebildschirm erscheint, bleibt `GameScreen` beim Rätselwechsel montiert und
hätte den alten Spielstand weitergetragen. Deshalb `key={core.seed}`.

### V20-4 — Zwei Dinge, die der Umzug gebrochen hätte

- **Beide Dockerfiles** kopierten `packages` — ein Ordner, den es nicht mehr
  gibt. `COPY` auf einen fehlenden Pfad bricht den Bau ab. Zeilen entfernt;
  nebenbei verschwindet das überflüssige `/app/puzzle/`, das in Runde 19 als
  harmlos vermerkt war.
- **`npm run reference` schrieb in den falschen Ordner** — derselbe Fehler wie
  in Runde 18, durch den Umzug wiederbelebt, weil der Pfad an der Skriptdatei
  hängt und die umgezogen ist. Die Verankerung allein hat ihn also nicht
  verhindert, nur verschoben. Diesmal mit Riegel: fehlt das Zielverzeichnis,
  bricht das Skript ab, statt still ein neues anzulegen. Der Riegel wurde mit
  einem absichtlich falschen Pfad ausgelöst und schlug zu.

### V20-5 — Jeder Tagesfall war „sehr leicht", für immer

`dailySeed` bekam die Gittergröße 6 fest eingetragen, und die Stufe folgt aus
der Größe. Ein Kalender hätte damit 365 gleiche Tage gezeigt. Jetzt bestimmt der
Wochentag die Stufe (§6.1.1), rückwirkend für alle Tage.

`dailySeed` nimmt dafür drei blanke Zahlen statt eines `Date`: die Zeitzone ist
keine Frage, zu der die Engine eine Meinung haben darf. Der Wochentag wird
gerechnet, nicht gelesen — die Engine liest keine Uhr. Weil eine selbstgebaute
Formel sich selbst bestätigen würde, prüft ein Test sie **gegen die Plattform,
366 Tage lang**.

Der kuratierte Katalog ist ersatzlos entfallen: `catalog.ts` (254 Zeilen),
`CatalogScreen.tsx`, `scripts/curate.ts`, `tests/catalog.test.ts` und der
zugehörige npm-Befehl. Der Test, der den Katalog auf die Generatorversion
prüfte, prüft jetzt **400 Kalendertage und alle fünf Stufen** auf dieselbe
Zusage.

Vorher gemessen, damit der Kalender keine Ausweichmechanik braucht: **0
Fehlschläge** bei 90 Tagen 6×6 und 40 Tagen über alle Stufen, langsamster Fall
615 ms.

### V20-6 — Der Speicher versprach eine Version, die nicht stimmte

Alle Schlüssel standen unter `indizio:v2:`, während der Generator bei 3 steht —
beim Schritt auf 3 war das Mitziehen unterblieben. Schaden machte es nicht, weil
`loadPuzzle` zusätzlich die Version im Rätsel selbst prüft, aber der
Schlüsselname log. Nachgeholt, und ein einmaliger Lauf beim Start räumt die
alten Einträge weg.

### V20-7 — Eine Klassennamenkollision, dieselbe Sorte wie in Runde 15

`.tier-veryEasy` bedeutete am Kalendertag „schmaler Balken, 20 % breit" und am
Zufallsknopf „grüner Rand links". Die Knöpfe wurden dadurch zu grünen Blöcken
mit abgeschnittener Schrift. In Runde 15 war es `carpet` als Objekt **und**
Boden; der Mechanismus ist derselbe — ein Name, zwei Bedeutungen, und die
speziellere Regel gewinnt nicht automatisch.

Dabei fiel auf, dass gesperrte Tage ihre Stufe im Vorlesetext nannten, aber
nicht zeigten. Statt den Text zu kürzen zeigen künftige Tage den Balken jetzt
auch: dass Sonntag der große Fall wird, darf man vorher sehen. Aus „gesperrt"
wurden dafür zwei Zustände — vor dem Starttag und nach heute bedeuten
Verschiedenes.

### V20-8 — Drei Fehler in der Tastaturbedienung, alle erst im Browser sichtbar

- Die Schlusszeile setzte den Rahmen **nach** jeder Bewegung auf das Startfeld
  zurück. Fünf Pfeiltasten, und er stand wieder auf Feld 0.
- Der Rahmen wurde beim Fokusverlust verworfen; schon ein Flackern kostete die
  Position. Jetzt überlebt sie, nur die Anzeige hängt am Fokus.
- `focusin` feuert im Vorschaufenster **null mal**, obwohl `activeElement`
  stimmt. Der Rahmen erscheint deshalb beim ersten Tastendruck statt beim
  Fokusereignis — was ohnehin richtiger ist: wer mit der Maus klickt, braucht
  ihn nicht.

**Ein vierter Verdacht war keiner.** Eingabe und `X` taten nichts, und es sah
nach einem Fehler in der Tastenbehandlung aus. Die Felder 8 und 14 waren
schlicht **gesperrt**. Der Code hatte recht, die Testfelder waren schlecht
gewählt — auf einem freien Feld platziert er sauber.

Die Randarithmetik steht als `moveCursor` für sich und ist geprüft: alle sechs
Tasten auf **jedem** Feld aller sechs Gittergrößen bleiben im Brett, und am
rechten Rand bricht nichts in die nächste Zeile um.

Nebenbei behoben: `vibrate` lag seit Runde 11 im Speicher und **wirkte nicht** —
das Brett rüttelte unabhängig von der Einstellung. Jetzt gibt es dafür auch eine
Oberfläche; vorher ließ sich die Einstellung nur ändern, indem man den
Browserspeicher von Hand bearbeitete.

### V20-9 — Der Höhenabzug musste zum zweiten Mal von Hand nachgezogen werden

Der dritte Knopf in der Kopfzeile ließ sie auf 375 px umbrechen; die Seite
scrollte um 28 px.

Der erste Versuch — den Höhenabzug im Spielbildschirm erhöhen — war
**wirkungslos**, und zwar aus einem Grund, der vorher nicht gemessen war: auf
dem Handy bindet die **Breite** (347 gegen 414 freie Pixel). Ein größerer
Höhenabzug ändert dort gar nichts. Danach fehlten gerechnet acht Pixel; statt
Breiten auf den Pixel nachzujustieren, was beim nächsten längeren Wort wieder
bräche, darf die Kopfzeile nicht mehr umbrechen und der Titel notfalls
abschneiden.

**Offen und bewusst nicht stillschweigend festgenagelt:** dieser Abzug ist eine
Konstante, die jede UI-Änderung falsch machen kann, und sie war jetzt zweimal
falsch (Fußzeile in Runde 16, Knopf in dieser Runde). Ein gemessener Wert wäre
ehrlicher. Das steht als offener Punkt in §8.5.

### Nachweis

| | Vorher (Runde 19) | Nachher |
|---|---|---|
| Tests gesamt | 223 | **253** |
| davon App | 58 | 77 |
| davon Engine | 165 | 176 |
| Testdateien | 17 | 16 |
| npm-Befehle | 17 | 13 |
| `tsconfig`-Dateien | 3 | 2 |
| Bündel (roh / gzip) | 319,9 kB / 89,5 kB | 326,5 kB / 92,4 kB |

**Die Erzeugung ist nachweislich unverändert:** `npm run reference` schreibt die
eingefrorenen Daten byte-identisch zurück, und der Referenztest meldet „still
generates byte for byte the same". `GENERATOR_VERSION` bleibt 3, alle Links
gelten weiter. Auch die 92 Grafiken kommen bei `npm run art` unverändert heraus.

Im Browser geprüft, jeweils in einem frischen Tab ohne Altlasten des
Hot-Reload:

| | |
|---|---|
| Heutiger Fall (Sonntag) | Experte 10×10 — der Rhythmus greift |
| September 2026 | 30 Tage, 27 spielbar, 3 gesperrt |
| Samstag 26. | → `v3-garage-9-s-1tych8v` → Autowerkstatt 9×9 |
| Zufallsfall „Mittel" | → `v3-garage-8-m-879hg0` → 8×8 |
| Blättern | bis Januar 2026, dann gesperrt; „Zu heute" zurück |
| Englisch | Monate und Wochentage über `Intl` |
| Ziehen über das Brett | Auswahl leer |
| Ziehen über den Hinweistext | Auswahl vollständig |
| Spielbildschirm 10×10 und 6×6 | Seitenhöhe exakt 812, kein Scrollen |
| Einstellungen | Schieber auf 550 ms, Vibration aus — beides gespeichert |
| Spielstand | übersteht das Neuladen |

**Nicht geprüft, und das ist so vermerkt:** der Nachwurf bei fehlgeschlagener
Erzeugung ließ sich im Browser nicht auslösen, weil die Erzeugung nicht
fehlschlägt. Die Regel dahinter — *ein eingetippter Seed wird niemals ersetzt* —
ist deshalb als eigene Funktion `redrawFor` herausgezogen und mit vier Tests
belegt. Eine Zusicherung, die nur im Kommentar steht, ist keine.
