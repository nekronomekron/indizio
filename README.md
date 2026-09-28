# Indizio — Logikrätsel am Tatort

Ein Krimi-Deduktionsspiel nach dem Vorbild von [Murdoku](https://murdoku.com):
Auf einem N×N-Gitter steht in **jeder Zeile und jeder Spalte genau eine Person**.
Jede Verdächtigenkarte trägt genau einen wahren Hinweis. Wer alle richtig
platziert, hat den Mörder überführt — das Opfer war mit ihm allein in einem Raum.

Alles läuft im Browser: keine Anmeldung, kein Backend, nach dem ersten Laden
auch offline. Jedes Rätsel entsteht aus seinem **Seed** — derselbe Link ergibt
überall dasselbe Rätsel.

**Jeder Tag hat seinen eigenen Fall.** Ein Kalender zeigt den Monat; der
Wochentag bestimmt die Schwere, von kurz am Montag bis lang am Sonntag.
Verpasste Tage lassen sich nachholen. Wer zwischendurch etwas anderes will,
wählt eine Stufe und bekommt einen ausgelosten Fall.

Spielen geht mit Maus, Finger **und Tastatur**: Pfeiltasten bewegen einen
Rahmen über das Brett, Eingabe platziert, N notiert, X markiert.

Die Fußzeile zeigt die **Versionsnummer** im Format `<Jahr>.<Nummer>`, etwa
`2026.5`: die fünfte Fassung aus diesem Jahr. Sie steht in der `package.json`
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
| `npm test` | Tests von Engine und App, unter einer Minute |
| `npm run test:deep` | gründlicher Lauf: alle Gittergrößen, hunderte Seeds, Zeitbudgets |
| `npm run lint` | Lint, mit strengeren Regeln für die Engine als für die Oberfläche |
| `npm run typecheck` | Typprüfung beider Projekte (`tsconfig.engine.json`, `tsconfig.json`) |
| `npm run verify` | Typprüfung, Lint und alle Tests — der Lauf vor jedem Commit |
| `npm run reference` | eingefrorene Referenzdaten der Engine neu schreiben |
| `npm run art` | fehlende Platzhaltergrafiken nach `art/` schreiben |
| `npm run art:sheet` | alle Grafiken auf ein Blatt, zum Draufschauen |
| `npm run bump` | Versionsnummer eine Stelle hochzählen |

## Aufbau

Die Spiellogik liegt im Projekt, aber **hinter genau zwei Türen**. Die
Oberfläche kennt `@engine` und `@engine/i18n` — und nichts darunter.

```
src/engine/        Generator und Löser, ohne Abhängigkeiten
  index.ts         die Tür: alles, was die App benutzen darf
  api.ts           solvePuzzle, verifyPuzzle, hintFor, boardLayout
  core/            Typen, Gitterrechnung, Seeds, Stufen, Zufallsgenerator
  clues/           was ein Hinweis bedeutet
  solving/         Kandidaten, Propagation, Regeln, Tipp, Referenzlöser
  generation/      Grundriss, Möblierung, Rollen, Hinweissuche
  io/              JSON-Austauschformat mit vollständiger Prüfung
  content/         Themes und Namen — Daten, austauschbar
  i18n/            zweite Tür: i18next-Ressourcen und Hinweisübersetzer
art/               jede Grafik als eigene SVG-Datei (siehe art/README.md)
src/worker/        Generator im Web Worker
src/app/           Oberfläche (React), Zustand, Speicherung
scripts/           Hilfsskripte (Grafiken, Referenzdaten, Version)
scripts/art/       Zeichenvorschriften der Platzhalter — nur für die Entwicklung
tests/             App-Tests und die Grenze
tests/engine/      Tests der Engine, inklusive erzwungener Entkopplung
```

Die Ordner der Engine sind **Schichten mit einer Richtung**: `generation` →
`solving` → `clues` → `core`, und niemand greift zurück.

Bis vor Kurzem war die Engine ein eigenes Paket, und die Paketgrenze hielt ihre
Schnittstelle zusammen. Im selben Projekt gibt es diesen Schutz nicht mehr,
deshalb steht die Grenze jetzt zweimal ausdrücklich da: als Lint-Regel in
`eslint.config.js`, die beim Schreiben greift, und als
[tests/boundary.test.ts](tests/boundary.test.ts), die auch dann greift, wenn
jemand den Linter überspringt. Dazu zwei `tsconfig`-Dateien — die Engine läuft
unter strengeren Schaltern als die Oberfläche, weil dichte Zahlenarbeit davon
profitiert und JSX vor allem Lärm davon hat.

Was die Engine über sich selbst verspricht, steht — auf Englisch, wie ihr
gesamter Quelltext — in [src/engine/README.md](src/engine/README.md).

### Die Engine benutzen

```ts
import { generatePuzzle, makeSeed, stringifyPuzzle } from '@engine';
import { createClueTranslator } from '@engine/i18n';

const { core } = generatePuzzle(makeSeed('garage', 6, 12345));
const translator = createClueTranslator({ locale: 'de' });
console.log(core.clues.map((entry) => translator.render(core, entry)));
const json = stringifyPuzzle(core);   // überall wieder einlesbar
```

Die Sätze entstehen mit **i18next**, das nur hinter der Tür `@engine/i18n`
geladen wird — wer nur erzeugt und löst, bekommt einen Kern ohne jede
Laufzeitabhängigkeit, und der Worker bezahlt keine Übersetzungsbibliothek für
Arbeit, die er nicht tut. Eigene Themes lassen sich übergeben, ohne am Generator
etwas zu ändern; ihre Wörter kommen über `additionalResources` mit.

Ein Zugriff **an den Türen vorbei** ist kein Abkürzungsweg, sondern ein Fehler:

```ts
import { solve } from '../engine/solving/solve.js';   // Lint und Test schlagen an
```

Wer etwas von innen braucht, exportiert es in `src/engine/index.ts` — mit einem
Namen, der auch jemandem etwas sagt, der das Innenleben nicht kennt. Genau dafür
gibt es `api.ts`.

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

88 Dateien: 48 Requisiten, 2 Blätter verlegter Requisiten, 16 Bodenbeläge,
14 Figuren, 8 Bediensymbole.

Requisiten haben **je Grundfläche eine eigene Datei** — `bed_2x1.svg` neben
`bed_1x2.svg`, `table_3x1.svg` —, und das Spiel legt sie über genau diese
Felder. Ein Bett quer ist damit kein gedrehtes Bett längs.

**Teppiche und Matten** liegen dagegen in beliebiger Form im Raum, um Ecken und
mit Kreuzungen. Für sie gibt es je Art ein Blatt (`tiles/carpet.svg`), aus dem
das Spiel jede Form in Vierteln zusammensetzt — siehe
[art/README.md](art/README.md) und PLAN.md §13.

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
- [VALIDATION.md](VALIDATION.md) — Prüfprotokoll: 48 gefundene und behobene Fehler in zwanzig Runden
