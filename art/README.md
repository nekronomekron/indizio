# Grafiken

Hier liegt **jede Grafik des Spiels als eigene SVG-Datei**. Die App zeichnet
nichts mehr selbst — sie lädt genau diese Dateien. Eine Grafik austauschen
heißt: die Datei ersetzen. Am Code ändert sich dabei nichts.

Was hier liegt, sind bis auf Weiteres **Platzhalter**. Sie sind dafür da,
ersetzt zu werden.

## Aufbau

```
art/
  common/              theme-unabhängig
    characters/        p01 … p14 — die Verdächtigen
    icons/             ui-x, ui-check, … — Bedienung
    floors/            Rückfallbelag für fremde Themes
  themes/<theme>/
    objects/           die Requisiten dieses Themes
    tiles/             Blätter der verlegten Requisiten (Teppich, Matte)
    floors/            die Bodenbeläge seiner Räume
```

Gesucht wird **erst im Theme, dann in `common`**. Eine Datei in
`themes/garage/objects/chair_1x1.svg` gilt nur in der Werkstatt; eine in
`common/objects/chair_1x1.svg` überall dort, wo das Theme nichts Eigenes
mitbringt.

Deshalb gibt es `chair_1x1.svg` heute zweimal — in `garage` und in `flat`. Das
ist Absicht: ein Werkstattstuhl darf anders aussehen als ein Küchenstuhl. Wer
beide gleich haben will, legt eine Datei nach `common/objects/` und löscht die
beiden anderen.

## Requisiten: eine Datei je Grundfläche

Der Name trägt die Grundfläche in Feldern, **Breite mal Höhe**:

```
bed_2x1.svg      zwei Felder nebeneinander
bed_1x2.svg      zwei Felder übereinander
table_3x1.svg    drei Felder nebeneinander
tree_1x1.svg     ein Feld
```

Ein Bett quer ist damit eine **andere Grafik** als ein Bett längs, nicht ein
gedrehtes Quadrat. Die Zeichenfläche wächst mit: **24 je Feld**, also
`viewBox="0 0 72 24"` für `3x1`. Das Spiel legt die Datei über genau diese
Felder; wer die Zeichenfläche anders wählt, bekommt Luft an den Rändern statt
eines gestauchten Tisches.

Welche Grundflächen es gibt, bestimmt die **Theme-Definition** der Engine
(`src/engine/content/themes/`). Fehlt eine, sagt der Test welche.

Wer für alle Flächen mit einer Datei auskommt, legt sie ohne Zusatz ab
(`bed.svg`) — das Spiel nimmt sie, wenn es die passende Fläche nicht findet.
Für die Platzhalter wird davon kein Gebrauch gemacht.

## Verlegte Requisiten: ein Blatt je Art

Teppiche und Matten haben keine feste Grundfläche. Sie liegen in **beliebiger
Form** im Raum — um Ecken, mit Abzweigen und Kreuzungen, als Bahn oder als
Fläche. Welche Requisite so verlegt wird, steht in der Theme-Definition
(`placement: { kind: 'tiled', … }`).

Dafür gibt es **eine Datei je Art**, `tiles/<name>.svg`, mit
`viewBox="0 0 48 72"` — 2 × 3 Felder, aufgebaut wie ein Autotile im Format
RPG Maker A2:

```
x: 0          24          48
   ┌───────────┬───────────┐ y 0
   │ Einzelfeld│ Innenecken│      nur Vorschau | die vier Innenecken
   ├─────┬─────┼─────┬─────┤ y 24
   │ ┌   │  ─  │  ─  │   ┐ │
   ├─────┼─────┼─────┼─────┤
   │ │   │     │     │   │ │      ein 2×2-Block:
   ├─────┼─────┼─────┼─────┤      Außenecken, Kanten, Füllung
   │ │   │     │     │   │ │
   ├─────┼─────┼─────┼─────┤
   │ └   │  ─  │  ─  │   ┘ │
   └─────┴─────┴─────┴─────┘ y 72
```

Das Spiel setzt jede Zelle aus **vier Vierteln zu 12 × 12** zusammen. Welches
Viertel es nimmt, hängt an den zwei Nachbarn, an die das Viertel grenzt, und an
der Diagonalen dazwischen: Außenecke, waagerechte Kante, senkrechte Kante,
Innenecke oder Füllung. Ein Viertel kommt immer aus **derselben Lage** im
Blatt, in der es auf dem Brett sitzt — das Nordwest-Viertel einer Zelle aus
einer linken oberen Viertelposition. Gedreht wird nichts.

Damit das aufgeht:

- Was an einer offenen Seite eines Viertels endet, muss an die gegenüberliegende
  offene Seite **jedes** anderen Viertels passen — Muster, Ränder und Fransen
  laufen über die Viertelgrenzen durch.
- Außen bleiben wie bei allen Requisiten **2 Einheiten Luft** zur Zellkante.
  Die Innenecken sind um genau diese 2 eingekerbt, sonst stößt der Rand an
  einer Innenecke nicht an die Kanten der Nachbarzellen.
- Das Einzelfeld oben links erscheint nie auf dem Brett; eine einzelne Zelle
  setzt sich aus den vier Außenecken zusammen. Es ist die Vorschau.

Die genaue Zuordnung steht in
[`src/app/render/tiles.ts`](../src/app/render/tiles.ts) und in PLAN.md §13.4.

## Was eine Datei erfüllen muss

| | |
|---|---|
| Format | SVG, für sich stehend, mit `xmlns` |
| Zeichenfläche | 24 je Feld: `0 0 24 24` für ein Feld, `0 0 72 24` für `3x1` |
| Inhalt | vollständig innerhalb der Fläche, keine negativen Koordinaten |
| Hintergrund | bei Requisiten und Figuren **keiner**, sie stehen auf dem Boden |
| Rand | ein, zwei Einheiten Luft, damit die Kachel darunter als Rahmen sichtbar bleibt — sie zeigt, ob jemand darauf stehen darf |
| Größe | wird nie fest gesetzt; das Spiel skaliert die Datei |

Bodenkacheln haben zusätzlich zwei Bedingungen:

- Sie müssen **nahtlos** sein: Fugen, Dielenstöße und Wellen treffen sich an den
  Kanten, sonst zerfällt der Boden sichtbar in Quadrate.
- Für `grass`, `soil`, `gravel` und `sand` spiegelt das Spiel die Kachel je
  Zelle, damit ein großes Gitter nicht nach Tapete aussieht. Bei diesen vier
  darf deshalb **nichts über die Kante laufen**. Welche Beläge gespiegelt
  werden, steht in [`src/app/render/floors.ts`](../src/app/render/floors.ts).

## Platzhalter erzeugen

```bash
npm run art           # fehlende Platzhalter schreiben
npm run art -- --force  # auch ersetzte Grafiken überschreiben
npm run art:sheet     # alle Grafiken auf ein Blatt, zum Draufschauen
```

Das läuft **nur während der Entwicklung**. Im fertigen Spiel wird nichts
erzeugt; dort liegen die Dateien fest.

Jede erzeugte Datei trägt den Vermerk `<!-- indizio:placeholder -->`. Eine Datei
ohne diesen Vermerk stammt von jemand anderem und wird **nicht überschrieben** —
`npm run art` meldet sie als behalten. So kostet ein versehentlicher Lauf keine
fertige Grafik.

Gezeichnet werden die Platzhalter in [`scripts/art/`](../scripts/art). Die App
importiert von dort nichts; wenn die endgültigen Grafiken da sind, kann der
ganze Ordner weg.
