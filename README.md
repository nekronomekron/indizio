# Indizio — Logikrätsel am Tatort

Ein Krimi-Deduktionsspiel nach dem Vorbild von [Murdoku](https://murdoku.com):
Auf einem N×N-Gitter steht in **jeder Zeile und jeder Spalte genau eine Person**.
Jede Verdächtigenkarte trägt genau einen wahren Hinweis. Wer alle richtig
platziert, hat den Mörder überführt — das Opfer war mit ihm allein in einem Raum.

Alles läuft im Browser: keine Anmeldung, kein Backend, nach dem ersten Laden
auch offline. Jedes Rätsel entsteht aus seinem **Seed** — derselbe Link ergibt
überall dasselbe Rätsel.

Die Fußzeile zeigt die **Versionsnummer** im Format `<Jahr>.<Nummer>`, etwa
`2026.4`: die vierte Fassung aus diesem Jahr. Sie steht in der `package.json`
und nirgendwo sonst; `npm run bump` zählt sie hoch, im neuen Jahr wieder ab
eins. Bewusst kein Semver — das sagt etwas über Verträge zwischen Programmen
zu, und die gibt es hier nicht. Wer einen Fehler meldet, soll ohne Nachfrage
sagen können, welchen Stand er vor sich hatte.

```bash
npm install
npm run dev
```

Öffnet <http://localhost:5173>. Für den Produktionsstand `npm run build`, das
Ergebnis in `dist/` läuft auf jedem statischen Webspace.

## Was das Spiel garantiert

| Zusage | Wie sie eingehalten wird |
|---|---|
| Genau eine Lösung | Der Logiklöser führt jedes Rätsel ohne Fallunterscheidung zu Ende; ein unabhängiger Referenzlöser bestätigt die Eindeutigkeit stichprobenartig |
| Nie raten müssen | Nur Rätsel, die der regelbasierte Löser vollständig ableitet, werden ausgeliefert |
| Alle Hinweise wahr | Jeder Hinweis wird vor der Ausgabe erneut gegen die Lösung geprüft |
| Reproduzierbar | Gleicher Seed ⇒ byte-identischer Rätselkern, auch über Prozessgrenzen |
| Steigende Schwierigkeit | Gittergröße als primärer Schlüssel, dazu gemessene Streuung und Anteil indirekter Hinweise |

Nachgewiesen durch `npm run verify` (Typprüfung, Lint, alle Tests) und
`npm run test:deep` (der gründliche Lauf über alle Gittergrößen). Die
Kriterien stehen in [PLAN.md](PLAN.md) §11.

## Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktionsbündel nach `dist/` |
| `npm test` | Tests der App |
| `npm run test:lib` | Tests der Bibliothek, schneller Lauf |
| `npm run test:deep` | gründlicher Lauf: alle Gittergrößen, hunderte Seeds, Zeitbudgets |
| `npm run test:all` | App und Bibliothek |
| `npm run lint:lib` | Lint der Bibliothek |
| `npm run verify` | Typprüfung, Lint und alle Tests — der Lauf vor jedem Commit |
| `npm run build:lib` | Bibliothek nach `packages/puzzle/dist` bauen |
| `npm run curate` | Rätselkatalog neu erzeugen |
| `npm run art` | fehlende Platzhaltergrafiken nach `art/` schreiben |
| `npm run art:sheet` | alle Grafiken auf ein Blatt, zum Draufschauen |
| `npm run bump` | Versionsnummer eine Stelle hochzählen |

## Aufbau

Die Spiellogik ist eine **eigenständige Bibliothek**. Die App ist nur einer ihrer
Nutzer — dieselbe Bibliothek lässt sich ohne Anpassung in anderen Projekten
verwenden.

```
packages/puzzle/   @indizio/puzzle — Generator und Löser, ohne Abhängigkeiten
  src/index.ts     öffentliche Schnittstelle
  src/api.ts       solvePuzzle, verifyPuzzle, hintFor, boardLayout
  src/core/        Typen, Gitterrechnung, Seeds, Stufen, Zufallsgenerator
  src/clues/       was ein Hinweis bedeutet
  src/solving/     Kandidaten, Propagation, Regeln, Tipp, Referenzlöser
  src/generation/  Grundriss, Möblierung, Rollen, Hinweissuche
  src/io/          JSON-Austauschformat mit vollständiger Prüfung
  src/content/     Themes und Namen — Daten, austauschbar
  src/i18n/        i18next-Ressourcen und Hinweisübersetzer
  tests/           eigene Suite, inklusive erzwungener Entkopplung
art/               jede Grafik als eigene SVG-Datei (siehe art/README.md)
src/worker/        Generator im Web Worker
src/app/           Oberfläche (React), Zustand, Speicherung
scripts/           Katalog- und Hilfsskripte
scripts/art/       Zeichenvorschriften der Platzhalter — nur für die Entwicklung
```

Die Ordner sind **Schichten mit einer Richtung**: `generation` → `solving` →
`clues` → `core`, und niemand greift zurück. Die Trennung ist nicht bloß
Konvention, sondern durch Tests erzwungen: die Bibliothek darf nicht aus ihrem
Ordner herausgreifen, im Kern keine Laufzeitabhängigkeit mitbringen und weder
DOM noch React noch Node-Module benutzen. Ihre Dokumentation steht — auf
Englisch, wie der gesamte Quelltext der Bibliothek — in
[packages/puzzle/README.md](packages/puzzle/README.md).

### Die Bibliothek anderswo benutzen

```ts
import { generatePuzzle, makeSeed, stringifyPuzzle } from '@indizio/puzzle';
import { createClueTranslator } from '@indizio/puzzle/i18n';

const { core } = generatePuzzle(makeSeed('garage', 6, 12345));
const translator = createClueTranslator({ locale: 'de' });
console.log(core.clues.map((entry) => translator.render(core, entry)));
const json = stringifyPuzzle(core);   // überall wieder einlesbar
```

Die Sätze entstehen mit **i18next**, das nur am Einstiegspunkt
`@indizio/puzzle/i18n` geladen wird — wer nur erzeugt und löst, bekommt einen
Kern ohne jede Laufzeitabhängigkeit. Eigene Themes lassen sich übergeben, ohne
am Generator etwas zu ändern; ihre Wörter kommen über `additionalResources` mit.

## Wie ein Rätsel entsteht

1. **Räume** — Guillotine-Teilung, dann ein ausgeschnittener Gang und
   rechteckige Bisse zwischen Nachbarräumen. Ergebnis sind **zusammenhängende
   Zellmengen statt Rechtecke**: L-Formen, Nischen und schmale Flure wie in
   echten Gebäuden. Über 80 % der Räume sind nicht rechteckig.
2. **Lösung zuerst** — eine zufällige Permutation legt fest, wer wo steht;
   sie wird neu gewürfelt, bis ein Raum genau zwei Personen enthält.
3. **Möblierung danach** — jede Lösungszelle bekommt einen Anker: ein begehbares
   Objekt darauf oder ein sperrendes daneben. Jeder Objekttyp dient höchstens
   einmal als Anker, sonst würden zwei Karten denselben Hinweis tragen und das
   Rätsel wäre mehrdeutig.
4. **Hinweissuche** — stärkster wahrer Hinweis je Karte, Reparatur der unsicheren
   Karten, greedy abschwächen bis zum schwersten noch lösbaren Satz, dann
   direkte gegen indirekte Hinweise tauschen, bis die Stufe passt.
5. **Prüfung** — alle Hinweise wahr, Löser kommt ohne Fallunterscheidung durch,
   Schranken der Stufe eingehalten, Einschränkungen aus §4.2.1 verletzt nichts.

Die Reihenfolge in Schritt 2 und 3 ist der Kern: zufällig möblieren und danach
eine Lösung suchen liefert ab 8×8 messbar **kein einziges** lösbares Rätsel.
Die Herleitung steht in [VALIDATION.md](VALIDATION.md), Runde 5.

## Grafik

**Alles Vektor, alles selbst gemacht.** Keine Rasterbilder, kein Sprite-Atlas,
keine fremden Grafikpakete — jede Form ist SVG im 24×24-Raster und bleibt bei
jeder Größe scharf. Der Stil ist flach und klar: keine Konturen, keine
Verläufe, je Material ein Grundton und ein dunklerer Ton für Tiefe.

**Jede Grafik ist eine eigene Datei** in [art/](art/README.md). Die App zeichnet
nichts mehr selbst, sie lädt die Dateien — eine Grafik austauschen heißt also,
die Datei zu ersetzen. Was dort heute liegt, sind Platzhalter; `npm run art`
erzeugt sie, überschreibt aber nie eine Datei, die jemand ausgetauscht hat.

Jedes Theme hat sein **eigenes Grafikset** unter `art/themes/<theme>/`. Gesucht
wird erst dort, dann in `art/common/`. So darf der Stuhl in der Werkstatt anders
aussehen als der in der Küche, während Figuren und Bediensymbole nur einmal
vorliegen.

Die Verdächtigen sind **Silhouetten ohne Gesicht**. Das folgt aus der Zusage,
dass Porträts nie lösungsrelevant sind: ein Gesicht lädt dazu ein, etwas
hineinzulesen. Unterschieden werden die vierzehn Figuren über Kleidungsfarbe,
Kopfform und Hautton.

Jeder Raum hat außerdem einen **Bodenbelag, der zu seinem Namen passt** — im Bad
Fliesen, auf dem Rasen Gras, in der Werkstatt Estrich. Das ist kein Schmuck:
fast jeder Hinweis nimmt auf Räume Bezug, und ein wiedererkennbarer Boden macht
die Raumgrenzen ohne Nachlesen klar.

Aus demselben Grund ist **jeder Raum von einer dicken schwarzen Linie umgeben**,
immer und auf jedem Gerät. Auf dem Handy gibt es kein Schweben, und eine
Raumgrenze, die man nur mit der Maus findet, ist für die Hälfte der Spieler
keine.

92 Dateien: 54 Requisiten, 16 Bodenbeläge, 14 Figuren, 8 Bediensymbole.

Requisiten haben **je Grundfläche eine eigene Datei** — `bed_2x1.svg` neben
`bed_1x2.svg`, `table_3x1.svg` —, und das Spiel legt sie über genau diese
Felder. Ein Bett quer ist damit kein gedrehtes Bett längs.

## Steuerung

| Eingabe | Wirkung |
|---|---|
| Karte antippen | Person auswählen |
| Feld antippen | Bleistiftnotiz setzen oder entfernen (Buchstabe links oben, mehrere je Feld möglich) |
| Feld halten | Ausgewählte Person platzieren |
| Ziehen | Notizen über mehrere Felder malen |
| Doppelklick | Platzieren (Desktop) |
| Rechtsklick | Feld als unmöglich markieren |
| Radierer halten | Gesamtes Gitter leeren |

Beim Platzieren markiert das Spiel Zeile und Spalte automatisch mit X und räumt
die damit hinfälligen Notizen weg — genau die Buchführung, die sonst von Hand
anfiele.

Auf dem Brett steht der **Anfangsbuchstabe des Namens**: ein „N" erinnert an
Nadja und nicht daran, dass sie die vierte Karte ist. Wer eine Karte wählt,
sieht alle Marken dieser Person farbig aufleuchten — Platzierung wie Notiz. Das **Opfer steht in der
Liste zuletzt** — es ist die einzige Karte, die nichts zu ermitteln gibt.

| Maus über einem Raum | Raum wird farblich hervorgehoben (nur am Schreibtisch) |

Auf gesperrten Objekten — Tisch, Schrank, Lampe, Baum — kann niemand stehen; das
Gitter nimmt dort gar keine Eingabe an. Begehbar sind nur Dinge, auf denen man
sinnvollerweise steht oder sitzt: Bett, Teppich, Stuhl, Sofa, Bank, Matte,
Palette, Auto, Trittstein und Ähnliches.

**Bestätigen** sagt nur richtig oder falsch — nie, welche Person danebensteht.
Der **Tipp** geht dafür immer vom leeren Brett aus und nennt den nächsten
zwingenden Schritt; er kommentiert nie den Spielstand und lässt sich damit nicht
als Fehlersucher missbrauchen.

## Dokumente

- [PLAN.md](PLAN.md) — Entwicklungsplan mit Spielkonzept, Solver, Generator und Abnahmekriterien
- [VALIDATION.md](VALIDATION.md) — Prüfprotokoll: 39 gefundene und behobene Fehler in neunzehn Runden
