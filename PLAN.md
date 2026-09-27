# Indizio — Entwicklungsplan

> Logikrätsel am Tatort. Ein Krimi-Deduktionsspiel nach dem Vorbild von
> [Murdoku](https://murdoku.com), mit prozedural generierten Tatorten,
> seed-reproduzierbaren Rätseln und Pixel-Art im 16×16-Raster.

**Stand:** Plan v12 — Requisiten je Grundfläche, gewählte Person leuchtet im Gitter.
Prüfprotokoll: [VALIDATION.md](VALIDATION.md)
**Projektordner:** `C:\Projects\murdoku` (Paketname `indizio`)

---

## 1. Vorbedingungen des Auftrags

Diese acht Punkte sind die Messlatte. Jeder Abschnitt verweist auf die Nummer,
die er erfüllt.

| # | Vorbedingung | Erfüllt in |
|---|---|---|
| V1 | Sudoku-ähnlich: pro Spalte und Reihe nur ein Verdächtiger | §3.2, §5 |
| V2 | Verdächtige links, steigender Schwierigkeitsgrad mit mehr Verdächtigen | §3.1, §5.4, §8.2 |
| V3 | Zufallsgenerierte Puzzle mit verschiedenen Räumen | §6.2, §6.3 |
| V4 | Passende Beschreibung je Verdächtigem wird mitgeneriert | §4, §6.6 |
| V5 | Alle Grafiken selbst erstellt, als frei skalierbares SVG in austauschbaren Dateien | §7, §7.0 |
| V6 | Seed-basierte Reproduzierbarkeit | §6.1, §6.8 |
| V7 | Läuft im Browser auf Desktop und Handy | §6.7, §8.5, §9 |
| V8 | Murdoku-Doku und Tutorial vollständig gelesen | §2 |
| V9 | Generator und Löser als entkoppelte Bibliothek, Austausch per JSON | §8.1, §6.8 |
| V10 | Nicht-rechteckige Räume: Gänge und L-Formen | §6.2 |

---

## 2. Was Murdoku tatsächlich macht (Quelle für §3–§5)

Aus Spielanleitung, Schlüsselwortliste, Fortgeschrittenen-Tipps, FAQ und dem
sechsstufigen Tutorial, gelesen am 27.08.2026.

**Regeln**

- Eine Person pro Zeile und pro Spalte.
- Verdächtige nur auf begehbaren Feldern (nicht auf Tischen, Bäumen …).
- Das Opfer ist selbst eine Karte auf dem Gitter und trägt den Hinweis
  „Das Opfer. Er war allein mit dem Mörder."
- Wer alle korrekt platziert, hat den Mörder implizit überführt.

**Schlüsselwörter mit exakter Bedeutung**

- `neben` — links, rechts, oben oder unten **und im selben Raum**.
- `allein` — niemand sonst war im Raum, **nicht einmal das Opfer**.
- `allein mit` — nur diese Personen waren im Raum.
- `leerer Bereich` — ein Bereich in dem niemand war, nicht einmal das Opfer.
- `Ecke` — wo zwei Wände eines Raumes zusammentreffen.
- `Diagonale` — auf derselben Diagonale wie (a).
- `Reihe` / `Spalte` — waagerechte bzw. senkrechte Linie von Feldern.
- `westlich von (a)` / `östlich von (a)` — jedes Feld links bzw. rechts von (a).
- Das Tutorial nennt zusätzlich `nördlich von` und `im selben Bereich`.

**Zusicherungen aus der FAQ**

- „jemand" und „Person" schließen das Opfer immer mit ein.
- Hinweise sind immer wahr, es gibt keine Tricks.
- „neben einem Regal" erlaubt mehrere Regale; ist die Zahl wichtig, steht
  ausdrücklich „genau ein Regal".
- Genau eine gültige Lösung, aber mehrere Lösungswege.
- Man muss **nie raten**, jedes Rätsel ist rein deduktiv lösbar.
- Porträts sind rein dekorativ und nie lösungsrelevant.
- Große Objekte bedecken mehrere Felder, eine Person besetzt nur eines davon.
- Wer „auf einem Stuhl" sitzt, ist auch „neben einem Stuhl".

**Fortgeschrittene Techniken, die das Rätseldesign tragen muss**

1. Zeile oder Spalte mit genau einem freien Feld ⇒ dort steht jemand.
2. Sind k Personen auf k Zeilen (oder Spalten) beschränkt, steht dort sonst niemand.
3. Kann eine Person nur zwei Felder belegen, ist jedes Feld blockiert, das mit
   beiden fluchtet.

**Katalogstruktur**

Fünf Stufen (Sehr leicht → Experte), Gittergröße gleich Verdächtigenzahl,
5×5 bis 10×10.

---

## 3. Spielkonzept Indizio

### 3.1 Aufbau des Bildschirms

Links (Desktop) beziehungsweise in einem waagerecht scrollbaren Band (Handy) die
Verdächtigenkarten mit Porträt, Name und **genau einem** Hinweis. Daneben das
quadratische Gitter mit Räumen und Objekten, darunter die Werkzeuge. → **V2**

**Der Buchstabe auf dem Brett ist der Anfangsbuchstabe des Namens**, nicht A, B,
C nach Kartenreihenfolge. Ein „N" soll an Nadja erinnern und nicht daran, dass
sie die vierte Karte ist; beim Nachsehen, wer wo steht, spart das den Umweg über
die Liste. Der mitgelieferte Namensvorrat hat durchweg verschiedene
Anfangsbuchstaben — ein Test der Bibliothek hält das fest, weil zwei gleiche
Marken ein lösbares Rätsel unlösbar aussehen ließen. Ein fremder Vorrat muss das
nicht, deshalb verlängert die Oberfläche kollidierende Marken so weit, wie zur
Unterscheidung nötig ist.

**Das Opfer steht in der Liste zuletzt.** Es ist die einzige Karte, die nichts
zu ermitteln gibt — ihr Hinweis steht von Anfang an fest. Mitten in der Reihe
unterbricht sie die Liste, am Ende schließt sie sie ab. Platziert wird es
trotzdem wie jede andere Person (§3.2); nur vorausgewählt ist es nie, denn eine
Markierung am unteren Ende sähe nach Versehen aus.

Beides ist **reine Darstellung**: die Id bleibt unangetastet, sie ist der Index
in Lösung, Platzierungen und Notizen.

**Die gewählte Person leuchtet auf dem Brett auf.** Sobald eine Karte gewählt
ist, hebt das Gitter jede ihrer Marken farbig hervor — die Platzierung wie jede
Bleistiftnotiz. Auf einem vollen 10×10-Gitter stehen sonst ein Dutzend gleich
aussehender Buchstaben, und man sucht seinen eigenen; die Auskunft „hier habe
ich sie schon vermutet" steckte bis dahin nur in der Erinnerung.

### 3.2 Kernregeln

1. Auf einem N×N-Gitter stehen genau N Verdächtige, einer davon ist das Opfer.
2. **In jeder Zeile und in jeder Spalte steht genau eine Person.** Die Lösung ist
   damit eine Permutationsmatrix. → **V1**
3. Verdächtige stehen nie auf blockierenden Objektfeldern.
4. Der Raum des Opfers enthält genau zwei Personen: das Opfer und den Mörder.
5. Jede Karte trägt genau einen wahren Hinweis; zusätzlich gibt es einige
   kartenlose Tatorthinweise (bis zu ⌈N/2⌉, mindestens 3 möglich).
6. Jedes Rätsel hat genau eine Lösung und ist ohne Fallunterscheidung lösbar.

### 3.3 Ablauf

Verdächtigen antippen wählt ihn aus. Feld antippen setzt eine Bleistiftnotiz,
Feld halten platziert. Sind alle N platziert, wird „Bestätigen" aktiv. Die
Rückmeldung ist binär — richtig, oder „nicht ganz" ohne zu verraten welche Figur
falsch steht. Bei Erfolg folgt die Auflösung mit Nennung des Mörders.

---

## 4. Hinweis-System

Hinweise sind **Strukturdaten**, kein Text. Erst die i18n-Schicht rendert sie.
Das ist die Voraussetzung dafür, dass Deutsch und Englisch aus derselben
Generierung entstehen. → **V4**

### 4.1 Gemeinsame Semantikregeln

- **Person** schließt das Opfer ein.
- **Angrenzend** heißt orthogonal (N/O/S/W), keine Diagonalen, und die
  angrenzende Zelle muss **im selben Raum** liegen wie das Subjekt.
- **Berührungsmenge** eines Subjekts: die eigene Zelle plus ihre orthogonalen
  Nachbarn im selben Raum. Ein Objekt gilt als „neben" dem Subjekt, wenn es
  mindestens eine Zelle in der Berührungsmenge hat. Dadurch gilt: wer auf einem
  Stuhl sitzt, ist auch neben einem Stuhl — exakt wie in Murdokus FAQ.
- **Objektanzahl** zählt Objekt-**Instanzen**, nicht Zellen. Ein zweifeldriges
  Regal, das an zwei Stellen berührt wird, zählt als eines.
- Alle Hinweise sind wahr. Es gibt keine negierten oder irreführenden Hinweise.
- Himmelsrichtungen: Zeile 0 ist Norden, Spalte 0 ist Westen.

### 4.2 Kartenhinweise (genau einer je Karte)

| Typ | Parameter | Bedeutung | Ab Stufe |
|---|---|---|---|
| `ON_OBJECT` | objectKey | Subjektzelle liegt auf einer begehbaren Instanz dieses Typs | Sehr leicht |
| `IN_ROOM` | roomId | Subjekt ist in diesem Raum | Sehr leicht |
| `ADJACENT_OBJECT` | objectKey, count? | mindestens eine bzw. genau `count` Instanzen in der Berührungsmenge | Sehr leicht |
| `ALONE` | roomId? | keine weitere Person im Raum des Subjekts | Sehr leicht |
| `SAME_ROOM_AS` | otherId | Subjekt und die genannte Person teilen einen Raum | Leicht |
| `DIR_OF_SUSPECT` | dir, otherId | west/ost/nord/süd von dieser Person | Leicht |
| `DIR_OF_OBJECT` | dir, objectKey | west/ost/nord/süd von **jeder** Zelle der Instanz dieses Typs; nur zulässig, wenn im gesamten Gitter **genau eine** Instanz dieses Typs steht | Mittel |
| `CORNER` | — | Subjekt steht auf einer Raumecke | Mittel |
| `ALIGNED_WITH_OBJECT` | axis, objectKey | teilt Zeile bzw. Spalte mit einer Zelle dieses Typs | Mittel |
| `DIAGONAL_OF` | otherId | \|Δr\| = \|Δc\| zur genannten Person, Δ ≠ 0 | Schwer |
| `ALONE_WITH` | otherIds[] | im Raum stehen genau das Subjekt und die genannten Personen | Schwer |

**Bewusst nicht umgesetzt:** `SAME_ROW_AS` und `SAME_COL_AS` **zwischen
Personen**. Bei einer Person pro Zeile und Spalte wäre ein solcher Hinweis
niemals wahr. Murdokus Glossareinträge „Reihe" und „Spalte" definieren lediglich
die Wörter; als Hinweis treten sie nur in Bezug auf Objekte auf, und das deckt
`ALIGNED_WITH_OBJECT` ab.

### 4.2.1 Einschränkungen, damit Hinweise eindeutig und nicht trivial sind

- **Eindeutige Bezugsobjekte.** Hinweise, die sich auf *eine bestimmte* Instanz
  beziehen (`DIR_OF_OBJECT`), sind nur zulässig, wenn genau eine Instanz dieses
  Typs im Gitter steht — sonst wäre der Satz „westlich vom Regal" mehrdeutig.
  Existenzielle Hinweise (`ON_OBJECT`, `ADJACENT_OBJECT`, `ALIGNED_WITH_OBJECT`)
  brauchen diese Einschränkung nicht, weil sie ausdrücklich über alle Instanzen
  quantifizieren.
- **Kein Kartenhinweis nennt das Opfer namentlich** in `SAME_ROOM_AS` oder
  `ALONE_WITH`. Andernfalls wäre der Mörder direkt benannt und die eigentliche
  Deduktion entfiele. `DIR_OF_SUSPECT` und `DIAGONAL_OF` dürfen sich auf das
  Opfer beziehen, weil sie nichts über Raumbelegung aussagen.
- **Keine Selbstbezüge und keine Zyklen der Länge 2** bei relationalen
  Hinweisen: A darf nicht auf B verweisen, wenn B auf A verweist — solche Paare
  tragen zusammen weniger Information, als ihre Kartenzahl vermuten lässt.
- **„Neben" nennt nie, worauf das Subjekt steht.** Die Berührungsmenge schließt
  die eigene Zelle ein (§4.1), also ist „neben einem Stuhl" wahr, während man
  darauf sitzt — Murdokus Regel, wörtlich. Wahr ist aber nicht dasselbe wie
  redlich: der Satz liest sich als Verneinung der schlichteren Wahrheit, und wer
  herausbekommt, dass sie auf dem Stuhl saß, fühlt sich zu Recht getäuscht.
  `ADJACENT_OBJECT` wird deshalb für einen Objekttyp gar nicht erst angeboten,
  auf dem das Subjekt steht. `ALIGNED_WITH_OBJECT` überspringt die Instanz unter
  den Füßen seit jeher — die Einschränkung zieht nur nach, was dort schon galt
  (VALIDATION.md, Runde 18).

  Die **Regel selbst bleibt unverändert**: „neben" schließt die eigene Zelle
  weiterhin ein, und der Löser rechnet genauso. Geändert hat sich allein, welche
  Sätze die Hinweissuche überhaupt in die Hand nimmt.

### 4.3 Opferhinweis (fest)

`VICTIM` — „Das Opfer. War allein mit dem Mörder." Semantik: im Raum des Opfers
stehen genau zwei Personen. Wer die zweite ist, sagt der Hinweis nicht; genau
daraus entsteht die Deduktion.

### 4.4 Globale Tatorthinweise (kartenlos)

| Typ | Parameter | Bedeutung | Ab Stufe |
|---|---|---|---|
| `EMPTY_ROOM` | roomId | in diesem Raum war niemand, auch nicht das Opfer | Sehr leicht |
| `ROOM_COUNT` | roomId, n ≥ 1 | in diesem Raum standen genau n Personen | Mittel |

Ihre Zahl ist auf ⌈N/2⌉ begrenzt, mindestens jedoch 3 — bei großen Gittern
tragen sie einen erheblichen Teil der Information. Der Redundanzabbau in §6.6
entfernt anschließend alles, was nicht gebraucht wird.

`EMPTY_ROOM` ist der Sonderfall n = 0 und hat deshalb eine eigene, schon früh
verfügbare Formulierung. `ROOM_COUNT` ist auf n ≥ 1 beschränkt, damit für
denselben Sachverhalt nie zwei Hinweistypen in Frage kommen. Je Raum wird
höchstens ein globaler Hinweis ausgegeben.

### 4.5 Sprachliche Wiedergabe

Jeder Hinweistyp hat je Sprache eine Vorlage. Objekte und Räume liegen in den
Sprachdateien mit Genus und den benötigten Kasusformen sowie der passenden
Präposition (`in einem Auto`, `auf einem Stuhl`, `an einer Werkbank`). Personen
tragen ein grammatisches Geschlecht, damit „Er war …" und „Sie war …" korrekt
gebildet werden. Englisch nutzt dieselbe Struktur mit eigenen Vorlagen.

**Umgesetzt mit i18next**, nicht mit einer eigenen Vorlagensprache. Das bringt
Plural, Kontextvarianten und Interpolation fertig mit — genau die drei Dinge,
die eine Eigenbau-Lösung nach und nach ohnehin nachbauen müsste. Zwei
Entscheidungen halten das verträglich:

- Die Bibliothek erzeugt über `createInstance()` eine **eigene i18next-Instanz**
  und rührt eine im Projekt bereits vorhandene Einrichtung nicht an. Wer seine
  eigene benutzen will, reicht sie als `instance` herein.
- i18next ist **optionale Peer-Abhängigkeit** und wird ausschließlich vom
  Einstiegspunkt `@indizio/puzzle/i18n` geladen. Wer nur erzeugt und löst,
  bekommt weiterhin einen Kern **ohne jede Laufzeitabhängigkeit** (§8.1).

Eigene Themes bringen ihre Wörter über `additionalResources` mit.

---

## 5. Solver

Der Solver ist das Herz des Projekts: er prüft Eindeutigkeit, misst
Schwierigkeit und liefert die Tipps. Er arbeitet auf Kandidatenmengen und ist
**sound** — er entfernt nur Kandidaten, die beweisbar unmöglich sind.

### 5.1 Zustand

Für jeden Verdächtigen s eine Bitmaske möglicher Zellen `cand[s]`. Abgeleitet je
Zelle die Menge möglicher Verdächtiger. Blockierte Zellen sind von Beginn an aus
allen Masken entfernt.

### 5.2 Regelstufen

- **R1 — Hinweispropagation.** Jeder Hinweistyp verkleinert Kandidatenmengen.
  Relationale Hinweise arbeiten kantenkonsistent, raumbezogene über Ober- und
  Untergrenzen der Belegung.
- **R2 — Permutationsregeln.** Vier Ableitungen daraus, dass N Personen auf N
  Zeilen und N Spalten stehen: gesetzte Person räumt Zeile und Spalte; letzte
  belegbare Zelle einer Linie ist besetzt; auf eine Linie beschränkte Person
  sperrt diese für alle anderen; einzige mögliche Person einer Linie steht dort.

**Nur zwei Stufen, nicht vier.** Die ursprüngliche Fassung hatte zusätzlich
Gruppenausschluss (R3) und Schnittfeldelimination (R4). Eine Messung über 60
erzeugte Rätsel zeigte: beide feuerten **kein einziges Mal** — die Hinweissuche
begrenzt sich bewusst auf R1+R2, damit die Erzeugung im Zeitbudget bleibt, und
damit sind höhere Regeln unerreichbar. Rund 250 Zeilen unerreichbarer Code sind
entfallen (VALIDATION.md, Runde 14).

### 5.3 Ablauf

Bis zum Fixpunkt: R1, dann R2, sobald R1 nichts mehr bewirkt; nach jedem Erfolg
zurück auf R1. Kein Backtracking, keine Hypothesen. Ergebnis ist `solved`,
`stuck` oder `contradiction`. Da der Solver sound ist, bedeutet ein
vollständiger Durchlauf ohne Fallunterscheidung zugleich, dass die Lösung
eindeutig ist.

Mitgeschrieben wird die **Ableitungskette**: jeder Schritt mit Person, Zelle und
Begründung. Sie ist zugleich die Quelle der Tipps (§5.5) — der Spieler bekommt
damit genau die Begründung zu sehen, die der Löser tatsächlich benutzt hat, und
nicht eine nachträglich erfundene.

### 5.4 Schwierigkeitsmaß

Die Gittergröße ist der **primäre, überschneidungsfreie** Schlüssel — genau so
wächst die Schwierigkeit mit der Zahl der Verdächtigen. Dazu kommen zwei
**gemessene** Kennzahlen als Untergrenze und die Regeltiefe als Obergrenze:

- **Streuung** — die mittlere Zahl der Kandidatenzellen je Person, nachdem nur
  die Hinweise angewendet wurden (R1 bis zum Fixpunkt), bevor irgendeine
  Permutationslogik greift. Sie misst unmittelbar, wieviel Kombinationsarbeit
  das Rätsel verlangt: bei Streuung 4 ist fast jede Person schon durch ihren
  eigenen Hinweis eingegrenzt, bei Streuung 12 trägt der Hinweis allein kaum.
- **Indirekte Hinweise** — Hinweise, die nichts unmittelbar über die eigene
  Zelle sagen, sondern nur ein Verhältnis: `ALONE`, `SAME_ROOM_AS`,
  `DIR_OF_SUSPECT`, `DIR_OF_OBJECT`, `CORNER`, `ALIGNED_WITH_OBJECT`,
  `DIAGONAL_OF`, `ALONE_WITH`. Sie sind spürbar schwerer zu verarbeiten als
  `ON_OBJECT` oder `IN_ROOM`.
| Stufe | Schlüssel | Gitter | Streuung ≥ | indirekte Hinweise ≥ |
|---|---|---|---|---|
| Sehr leicht | `veryEasy` | 5×5, 6×6 | 3,2 | 0 |
| Leicht | `easy` | 7×7 | 4,5 | 1 |
| Mittel | `medium` | 8×8 | 6,0 | 2 |
| Schwer | `hard` | 9×9 | 6,5 | 2 |
| Experte | `expert` | 10×10 | 7,5 | 3 |

Beide Schranken steigen monoton mit der Stufe, keine Gittergröße kommt in zwei
Stufen vor, und beide sind maschinell nachprüfbar (G5). Die Werte sind nicht
geschätzt, sondern aus rund 26 000 erzeugten Tatorten abgelesen — Messung und
Herleitung stehen in [VALIDATION.md](VALIDATION.md), Runde 5.

**Keine Regeltiefe mehr.** Da es nur noch R1 und R2 gibt (§5.2) und jedes
ausgelieferte Rätsel damit vollständig lösbar ist, wäre eine Obergrenze „maxRule
≤ R2" für jedes Rätsel dieselbe Aussage. Sie ist ersatzlos entfallen; die
Ohne-Raten-Zusage hängt seither allein daran, dass der Löser durchkommt.

> **Was heißt hier „gemessen"?** Beide Kennzahlen liegen als
> `difficultyProof` im Rätsel selbst und lassen sich nachrechnen, ohne es zu
> lösen. Ein Rätsel, das seine Schranke reißt, wird verworfen und neu erzeugt —
> nie umetikettiert.

> **Warum die Regeltiefe zweimal gescheitert ist.** Der ursprüngliche Plan
> verlangte sie als *Untergrenze*: „Mittel" sollte mindestens einmal R3
> brauchen. Die Messung widerlegte das — über 96 % aller lösbaren Rätsel kommen
> mit R1 und R2 aus, R4 kam nie vor. Also blieb sie als Obergrenze stehen. Beim
> Umbau der Bibliothek fiel dann auf, dass R3 und R4 in 60 von 60 erzeugten
> Rätseln **kein einziges Mal feuerten** und auch gar nicht konnten: die
> Hinweissuche prüft nur mit R1+R2 auf Lösbarkeit. Damit war auch die Obergrenze
> gegenstandslos, und rund 250 Zeilen unerreichbarer Code sind entfallen
> (VALIDATION.md, Runde 14).

→ **V2**

### 5.5 Tipp

Der Tipp läuft **immer auf dem leeren Ausgangszustand**, nie auf dem Spielstand.
Der Solver erzeugt einmalig die kanonische Ableitungskette des Rätsels; der Tipp
zeigt daraus den ersten Schritt, dessen Ergebnis auf dem Brett noch nicht steht,
mit Begründung: welcher Hinweis oder welche Regel greift und was daraus folgt.

Das ist bewusst so gewählt. Liefe der Tipp auf dem Spielstand, könnte man ihn zum
Fehlersucher zweckentfremden („Sackgasse" ⇒ irgendetwas ist falsch) und die
bewusst binäre Rückmeldung aus §3.3 wäre ausgehebelt. So kommentiert der Tipp
Spielerfehler nie, sondern spricht ausschließlich über das Rätsel selbst.

Ein Tipp platziert nichts automatisch: er hebt die Zelle hervor und nennt die
Begründung. Steht dort bereits eine andere Figur, räumt der Spieler sie selbst.
Tipps werden gezählt und in der Auflösung ausgewiesen.

### 5.6 Referenzlöser

`solving/reference.ts` zählt per erschöpfender Suche alle gültigen Belegungen.
Er ist nicht Teil des Spiels, sondern Prüfinstanz: Eindeutigkeit gegenprüfen und
Soundness des Logiklösers nachweisen. Er teilt sich mit dem Logiklöser
absichtlich **keinen** Code außer der Hinweisauswertung — ein gemeinsamer
Denkfehler soll nicht in beiden zugleich stecken.

Er arbeitet mit Budget (`solutionLimit`, `maxNodes`) und meldet über
`exhaustive`, ob er den Suchraum wirklich ausgeschöpft hat. Ein aufgebrauchtes
Budget zählt in den Tests als *unentschieden*, nie als bestanden.

---

## 6. Generator

### 6.1 Seed

Format `v<gen>-<theme>-<size>-<diff>-<rng36>`, zum Beispiel
`v3-garage-6-vl-k3f9tq`. Enthält Generatorversion, Theme, Kantenlänge, Zielstufe
und die Zufallszahl. Route `/#/p/v3-garage-6-vl-k3f9tq` — Hash-Routing, damit
jeder statische Host ohne Rewrite-Regeln funktioniert. Gleicher Seed ergibt das
identische Rätsel. → **V6**

Die Stufe steht im Seed als **Kurzzeichen** (`vl`, `l`, `m`, `s`, `x`), im Code
dagegen als lesbarer Schlüssel (`veryEasy` … `expert`). Die Kurzform hält den
Link kurz, der Schlüssel hält den Code lesbar; die Übersetzung zwischen beiden
steht an genau einer Stelle.

Ein Seed mit fremder Generatorversion wird **abgelehnt**, nicht stillschweigend
neu gedeutet: dieselbe Zeichenkette beschriebe unter einer anderen Version ein
anderes Rätsel, und ein geteilter Link, der etwas anderes zeigt, ist schlimmer
als einer, der ehrlich nicht mehr funktioniert.

Die App erkennt das **an der Zeichenkette, bevor der Generator anläuft**, und
sagt es in der Sprache des Spielers: „Dieser Link stammt aus einer älteren
Fassung des Spiels." Vorher lief der Seed bis in den Generator und kam als „Für
diesen Seed ließ sich kein Rätsel erzeugen" zurück — eine Auskunft, die sachlich
falsch ist, denn erzeugt werden sollte hier gar nichts.

Der Beispiel-Seed im Eingabefeld wird aus derselben Konstante gebaut. Fest
eingetippt stand dort noch `v1`, lange nachdem Version 2 lief — ein Beispiel,
das die App selbst abgewiesen hätte.

Der Zufallsgenerator ist ein eigener, deterministischer PRNG (SplitMix64 zur
Initialisierung, xoshiro128 zur Ausgabe) — nie `Math.random`. Verwirft ein
Versuch, wird der Versuchszähler in den PRNG-Strom eingespeist; dadurch bleibt
auch die Wiederholung Teil der reproduzierbaren Kette.

### 6.2 Räume

**Räume sind zusammenhängende Zellmengen, keine Rechtecke.** L-Formen, Nischen
und schmale Gänge gehören dazu, so wie in echten Gebäuden. Maßgeblich ist die
Zellmenge; `bounds` ist nur das umschließende Rechteck und sagt nichts über die
Form.

Drei Schritte:

1. **Guillotine-Teilung** des Quadrats in K Rechtecke, Mindestkante 2,
   Mindestfläche 4. Schnitte nahe der Mitte werden bevorzugt, damit ähnlich
   große Räume entstehen — ein Riesenraum neben drei Kammern macht Raumhinweise
   wertlos.
2. **Gang ausschneiden** (mit Wahrscheinlichkeit 0,55). Der Gang läuft entlang
   einer Linie, darf einmal abknicken und ist eine Zelle breit. Zellen werden
   nur übernommen, solange der abgebende Raum zusammenhängend und groß genug
   bleibt — dadurch entsteht nie ein zerschnittener Raum.
3. **Rechteckige Bisse** zwischen benachbarten Räumen verschieben, etwa
   1,2 Runden je Kantenlänge. Bewusst nicht zellweise: einzeln wandernde Zellen
   erzeugen ausgefranste Ränder, die nach Rauschen aussehen statt nach
   Grundriss. Ein Biss von bis zu 3 × 3 Zellen liefert dagegen genau die Formen,
   die Gebäude haben — L-Formen, T-Formen und Nischen mit geraden Wänden.

Nach jedem Schritt gilt: **jeder Raum bleibt zusammenhängend** (Vierer-
Nachbarschaft) und **behält mindestens vier Zellen**; ein Gang darf schmal sein,
muss aber mindestens drei Zellen lang sein. Änderungen, die das verletzen,
werden zurückgenommen. Gemessen sind gut 80 % der erzeugten Räume nicht
rechteckig.

| Kantenlänge | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|
| Räume K | 3 | 3 | 4 | 5 | 6 | 7 |

Jedes Theme muss mindestens **sieben** Raumnamen bereitstellen; ein Test prüft
das für alle Themes, sonst bliebe bei K = 7 ein Raum namenlos.

Die Eckendefinition aus §4.2 trägt unverändert: „Raumzelle mit zwei zueinander
senkrechten Nachbarn außerhalb des Raums". Bei einer L-Form ist die einspringende
Ecke folgerichtig **keine** Ecke, bei einem Gang sind es genau die beiden Enden.

### 6.3 Lösung zuerst, Möblierung danach

**Die Reihenfolge ist umgekehrt zur naheliegenden.** Zuerst steht die Lösung
fest, dann wird der Tatort um sie herum eingerichtet. Der ursprüngliche Plan
möblierte zufällig und suchte anschließend eine Lösung — das lieferte in der
Messung für 8×8 und größer **kein einziges lösbares Rätsel**, weil Personen
regelmäßig auf nichtssagenden Feldern landeten, für die es keinen scharfen
Hinweis gibt (VALIDATION.md, Runde 5).

1. **Lösung würfeln.** Eine zufällige Permutation legt je Zeile die belegte
   Spalte fest. Sie wird verworfen und neu gewürfelt, bis mindestens ein Raum
   genau zwei Personen enthält — das ist die Voraussetzung für den Opferhinweis
   und hängt allein von der Permutation ab, nicht davon, wer wo steht.
2. **Anker setzen.** Jede Lösungszelle bekommt ein Objekt, das sie beschreibbar
   macht: entweder ein begehbares Objekt genau darauf („war in einem Auto") oder
   ein sperrendes Objekt orthogonal daneben im selben Raum („war neben einem
   Regal"). **Jeder Objekttyp dient höchstens einmal als Anker** — bekämen zwei
   Karten denselben Wortlaut, entstünde eine echte Symmetrie und damit mehrere
   Lösungen.
3. **Füllwerk.** Weitere Objekte für Atmosphäre, bis die Zieldichte erreicht ist
   (Faktor 3 der Kantenlänge). Ankertypen bleiben dabei ausgespart, damit die
   Ankerhinweise scharf bleiben.

Grenzen: höchstens 40 % blockierte Zellen je Raum; ein Objekt liegt vollständig
in genau einem Raum; passt seine Grundfläche nicht, wird es dort nicht
angeboten. **Sperrende Objekte liegen nie auf einer Lösungszelle** — dadurch
bleibt die Lösung konstruktionsbedingt gültig. → **V3**

#### Was begehbar ist

Begehbar ist ausschließlich, worauf eine Person sinnvollerweise stehen oder
sitzen kann. Die Liste ist abschließend und wird von einem Test erzwungen:

| begehbar | Bett, Teppich, Matte, Palette, Stuhl, Gartenstuhl, Sofa, Bank, Badewanne, Auto, Ölfleck, Trittstein, Sandkasten, Teich |
|---|---|
| **gesperrt** | Tisch, Lampe, Schrank, Bücherregal, Regal, Werkbank, Küchenzeile, Tresen, Werkzeugkasten, Fass, Reifenstapel, Pflanze, Baum, Busch, Beet, Schuppen, Schubkarre |

Der Teich steht bewusst auf der begehbaren Seite: Murdokus FAQ beantwortet
„Kann Wasser besetzt werden?" ausdrücklich mit ja (§2).

Jedes Theme muss je Raum **mindestens einen begehbaren und einen sperrenden**
Objekttyp anbieten, sonst bekämen Lösungszellen in diesem Raum keinen Anker.
Darüber hinaus braucht jedes Theme genug *verschiedene* begehbare Typen: da
jeder Typ höchstens einmal als Anker dient, bestimmt ihre Zahl unmittelbar, wie
schnell große Gitter erzeugt werden (VALIDATION.md, Runde 9).

### 6.4 Machbarkeitsprüfung

Weil sperrende Objekte Lösungszellen aussparen, existiert immer mindestens ein
perfektes Matching — die Lösung selbst. Die bipartite Prüfung (Kuhn über
Zeilen × Spalten auf begehbaren Zellen) bleibt trotzdem als Wächter erhalten und
wird in den Abnahmetests gegen jedes erzeugte Rätsel geführt (G9).

### 6.5 Rollen

Verdächtige werden per Seed aus Namens- und Porträtpool gezogen und den
Lösungszellen zugewiesen. Aus einem Raum mit genau zwei Personen wird eine zum
Opfer, die andere zum Mörder; gibt es mehrere solche Räume, entscheidet der
Seed. Der Opferhinweis ist damit in jedem Fall wahr.

### 6.6 Hinweissuche

Zunächst werden alle **wahren** Hinweise zur Lösung aufgezählt, beschränkt auf
das Vokabular der Zielstufe (§4.2, §4.4), und nach Stärke sortiert.
**Hinweisstärke** ist genau definiert: die Anzahl Zellen, die der Hinweis
allein — auf dem leeren Ausgangszustand, ohne alle anderen Hinweise — aus der
Kandidatenmenge seines Subjekts entfernt. Aus jeder Hinweisgruppe bleiben
höchstens vier Vertreter, gleichmäßig über das Stärkespektrum verteilt; das hält
die Suche kurz und verhindert fünf fast identische Richtungshinweise.

Danach vier Phasen:

1. **Start.** Je Karte der stärkste wahre Hinweis, Wortlaut-Doppelungen
   aufgelöst. Bleibt der Löser hängen, kommen globale Tatorthinweise dazu
   (bis zu ⌈N/2⌉, mindestens 3).
2. **Reparatur.** Solange der Löser hängt, bekommen die unsichersten Karten
   einen *anderen* Hinweis — denjenigen, der die Restmengen am stärksten
   schrumpfen lässt. Ohne diese Phase scheitern Rätsel regelmäßig an den letzten
   zwei Personen, die einander symmetrisch bleiben.
3. **Abschwächen.** Greedy zurück: jede Karte bekommt den schwächstmöglichen
   Hinweis, der die Lösbarkeit erhält. Der so entstehende Satz ist der
   schwerste, den diese Lösung hergibt.
4. **Vielfalt.** Reichen die indirekten Hinweise für die Stufe nicht (§5.4),
   werden direkte gegen indirekte getauscht, solange lösbar bleibt.

Zum Schluss fallen globale Hinweise weg, die nicht mehr gebraucht werden, und
jeder verbleibende Hinweis wird noch einmal gegen die Lösung evaluiert.

Der Löser arbeitet dabei mit demselben Regelwerk wie später im Spiel — R1 und
R2, mehr gibt es nicht (§5.2). Damit gilt: was die Suche für lösbar hält, ist
auch für den Spieler lösbar. In der früheren Fassung war das eine Annahme, weil
die Suche aus Zeitgründen weniger Regeln benutzte als die Endprüfung; heute ist
es dieselbe Rechnung. → **V4**

### 6.7 Ausführung im Worker

Der Generator läuft in einem Web Worker mit Zeitbudget und meldet Fortschritt.
Die UI zeigt währenddessen eine Ermittlungs-Animation. Reines TypeScript ohne
DOM-Zugriff, damit derselbe Code in Node-Tests und im Browser läuft. → **V7**

### 6.8 Ausgabeformat

```
Puzzle {
  core: {                                  // deterministisch, Grundlage von G4
    seed, generatorVersion, size, difficulty, themeKey,
    rooms:    [{ id, nameKey, cells, bounds }],
    objects:  [{ id, key, cells, walkable, roomId }],
    suspects: [{ id, nameKey, gender, portraitKey, isVictim }],
    clues:    [{ ownerId | null, clue: { type, … } }],
    solution: [{ suspectId, cell }],
    murdererId,
    difficultyProof: { spread, indirect, attempts }
  },
  meta: { durationMs, generatedAt }        // Laufzeitmessung, nicht deterministisch
}
```

Auf der Leitung liegt das Ganze als Dokument mit `format: 'indizio-puzzle'` und
`schemaVersion`. Zwei Zählungen, die nicht dasselbe meinen und deshalb getrennt
sind: `generatorVersion` (derzeit **3**) sagt, welcher Algorithmus die Rätsel
erzeugt hat — sie steckt im Seed, weil sich bei einer Änderung dieselbe Zeichen-
kette auf ein anderes Rätsel bezöge. `schemaVersion` (derzeit **2**) sagt nur,
wie die Felder heißen.

Die Serialisierung von `core` ist feldstabil sortiert, damit gleiche Seeds
byte-identische Ausgaben liefern. `meta` enthält alles, was von Rechner und
Zeitpunkt abhängt, und ist ausdrücklich **nicht** Teil des Vergleichs in G4 —
sonst wäre das Kriterium prinzipiell unerfüllbar. `attempts` gehört dagegen zu
`core`, weil der Versuchszähler deterministisch aus dem Seed folgt.

`parsePuzzle` prüft beim Lesen vollständig und sammelt **alle** Beanstandungen,
statt bei der ersten abzubrechen: Räume zusammenhängend, Zellen in Reichweite,
Objekte kollisionsfrei, genau ein Opfer, Lösung eine Permutation, Hinweistypen
bekannt. Wer ein kaputtes Dokument einliest, sieht damit in einem Durchgang, was
alles daran fehlt. → **V6**

---

## 7. Grafik

**Alles ist Vektor, alles ist selbst gemacht.** Keine Rasterbilder, kein
Sprite-Atlas, keine fremden Grafikpakete. Jede Form ist SVG im 24×24-Raster und
bleibt bei jeder Größe scharf — vom 24-Pixel-Symbol in der Werkzeugleiste bis
zum großen Porträt in der Auflösung. → **V5**

### 7.0 Jede Grafik ist eine Datei

Die App **zeichnet nichts**. Sie lädt Dateien aus `art/`. Eine Grafik
austauschen heißt: die Datei ersetzen — am Code ändert sich nichts.

Das ist keine Formalie, sondern die Vorbereitung auf den Zustand, der ohnehin
kommt: was heute dort liegt, sind **Platzhalter**, und sie sind dafür da,
ersetzt zu werden. Solange die Formen als Quelltext im Programm stünden, wäre
jeder Austausch ein Eingriff in den Code — mit allem, was daran hängen kann.

```
art/
  common/characters/   p01 … p14
  common/icons/        ui-x, ui-check, …
  common/floors/       Rückfall für fremde Themes
  themes/<theme>/objects/   Requisiten dieses Themes
  themes/<theme>/floors/    Beläge seiner Räume
```

**Gesucht wird erst im Theme, dann gemeinsam.** Jedes Theme bekommt damit sein
eigenes Grafikset, ohne dass Figuren und Symbole dreimal danebenliegen müssen.
Zwei Themes dürfen denselben Schlüssel benutzen — `chair` steht in Werkstatt und
Wohnung — und trotzdem verschieden aussehen.

**Requisiten haben je Grundfläche eine Datei**, der Name trägt sie in Feldern:
`bed_2x1.svg` neben `bed_1x2.svg`, `kitchenunit_3x1.svg`. Die Zeichenfläche
wächst mit — 24 je Feld, also `0 0 72 24` für drei Felder nebeneinander —, und
der Renderer legt die Datei über genau diese Felder.

Der Grund ist nicht Ordnung, sondern Zeichnung: ein Bett quer ist **kein
gedrehtes Bett längs**. Eine einzige 24×24-Grafik ließe nur zwei schlechte
Möglichkeiten, sie auf zwei Felder zu bringen — verzerren oder klein in die
Mitte setzen. Welche Grundflächen es gibt, steht in der Theme-Definition der
Bibliothek; heute sind es 54 über drei Themes.

Wer mit einer Datei für alle Flächen auskommt, legt sie ohne Zusatz ab
(`bed.svg`); der Renderer nimmt sie, wenn er die passende Fläche nicht findet.

**Zum Schlüssel gehört die Art der Grafik**, nicht nur ihr Name. In der Wohnung
heißt `carpet` zweierlei: der Teppich, auf dem jemand steht, und der
Teppichboden des Schlafzimmers. Wer nur nach dem Dateinamen sucht, legt dem
halben Zimmer eine Requisite als Boden aus (VALIDATION.md, Runde 15).

Erzeugt werden die Platzhalter mit `npm run art`, **nur während der
Entwicklung**. Jede erzeugte Datei trägt einen Vermerk; eine Datei ohne diesen
Vermerk stammt von jemand anderem und wird nicht überschrieben. Ein
versehentlicher Lauf kostet damit keine fertige Grafik. Die Zeichenvorschriften
der Platzhalter liegen in `scripts/art/` — außerhalb der App, die von dort
nichts importiert; sind die endgültigen Grafiken da, kann der Ordner weg.

Die Dateien werden beim Bauen eingebettet und nicht zur Laufzeit geladen: das
hält das Spiel offline lauffähig (§11, G11) und erspart je Form eine Anfrage.

### 7.1 Stil

Klar und einfach, an flachen Vektor-Symbolsätzen orientiert:

- **flache Flächen**, keine Konturen, keine Verläufe, keine Schatten;
- je Material ein Grundton und ein dunklerer Ton für Tiefe;
- großzügig abgerundete Ecken;
- eine gemeinsame, enge Palette für alle Platzhalter (`scripts/art/palette.ts`);
- jede Form auf ihre Silhouette reduziert, damit sie auch bei 24 px trägt.

### 7.2 Figuren ohne Gesichter

Die Verdächtigen sind **Silhouetten ohne Gesicht**. Das ist keine Sparmaßnahme,
sondern folgt aus der Zusicherung, dass Porträts nie lösungsrelevant sind (§2,
FAQ): ein Gesicht lädt dazu ein, etwas hineinzulesen, eine Silhouette nicht.

Unterschieden werden die vierzehn Figuren über drei Merkmale, die zusammen
eindeutige Kombinationen ergeben: **Kleidungsfarbe**, **Kopfform** (sieben
Frisuren und Kopfbedeckungen) und **Hautton**. Jede Figur ist damit von jeder
anderen zu trennen, auch klein im Gitter.

### 7.3 Bodenbeläge

Jeder Raum hat einen Belag, und der folgt dem **Raumnamen**, nicht der Raum-Id:
im Bad liegen Fliesen, auf dem Rasen wächst Gras, in der Werkstatt ist Estrich.
Das ist kein Schmuck — fast jeder Hinweis nimmt auf Räume Bezug, und ein Boden,
den man wiedererkennt, macht die Raumgrenzen ohne Nachlesen klar.

| Belag | Räume |
|---|---|
| Dielen | Wohnzimmer, Flur, Arbeitszimmer |
| Fliesen | Bad, Küche, Waschhalle, Wartebereich |
| Platten | Empfang, Terrasse, Balkon |
| Estrich | Werkstatt, Lager |
| Teppich | Schlafzimmer, Büro |
| Rasen | Rasen |
| Erde | Gemüsebeet, Gewächshaus |
| Kies | Hof, Schuppenplatz |
| Sand | Spielplatz |
| Wasser | Teichufer |

Die Töne sind bewusst gedämpft: Figuren und Requisiten sind kräftig gefärbt und
müssen sich davor abheben. Die Kacheln laufen aneinander fort — Fugen und
Dielenstöße treffen sich an den Kanten.

Gegen sichtbare Wiederholung **spiegelt das Spiel die Kachel je Zelle**, und
zwar nur bei Belägen, bei denen nichts über die Kante läuft: Rasen, Erde, Kies,
Sand. Dielen, Fliesen, Platten, Estrich, Teppich und Wasser bleiben ungespiegelt,
sonst zerschnitte der Nachbar ihre Fugen und Wellen. Die Spiegelung hängt allein
vom Zellindex ab, dieselbe Zelle sieht also immer gleich aus.

Früher wurde stattdessen je Zelle neu gestreut. Das ging nur, solange die
Kacheln im Programm gezeichnet wurden; als Datei gibt es je Belag genau ein
Bild, und die Spiegelung leistet dasselbe mit einer Datei statt mit vielen.

Liegen zwei benachbarte Räume auf demselben Belag, unterscheidet sie eine
winzige Helligkeitsstufe je Raum. Ein fremdes Theme mit unbekannten Raumnamen
fällt auf Estrich zurück.

### 7.4 Umfang

| Gruppe | Dateien | Wo |
|---|---|---|
| Requisiten | 54 | `art/themes/<theme>/objects/` (21 + 18 + 15), je Grundfläche eine |
| Bodenbeläge | 16 | `art/themes/<theme>/floors/` (5 + 4 + 6), dazu der Rückfall |
| Figuren | 14 | `art/common/characters/` |
| Bediensymbole | 8 | `art/common/icons/` |
| App-Symbol | 1 | `public/icon.svg`, zugleich Manifest-Icon |

92 Dateien: `chair` und `plant` kommen in zwei Themes vor und bekommen jeweils
eine eigene Fassung, und jede Requisite zählt je zulässiger Grundfläche einmal.
Welche Dateien gebraucht werden, bestimmt allein die **Theme-Definition der
Bibliothek**; kommt dort ein Objekt oder eine Grundfläche dazu, fehlt hier eine
Datei — und der Test sagt welche.

Geprüft wird: jede Grundfläche jedes Objekts hat eine Datei mit passender
Zeichenfläche, jeder Raum den Belag seines Themes, jeder Porträtschlüssel eine Figur, jedes Bediensymbol ist da,
jedes Bild des Tutorials lässt sich auflösen, keine Datei liegt ohne Verwendung
herum, jede Datei ist ein für sich stehendes SVG im 24er-Raster, und nichts
zeichnet an eine negative Stelle. Eine fehlende Grafik fiele sonst erst auf,
wenn der Generator dieses Objekt zufällig einmal einbaut.

### 7.5 Warum kein Atlas mehr

Die erste Fassung nutzte einen gerasterten Sprite-Atlas aus CC0-Pixelgrafik.
Vektorformen sind hier in jeder Hinsicht besser: sie skalieren verlustfrei
(wichtig, weil die Zellgröße sich mit dem Fenster ändert), brauchen keine
Bau-Pipeline, keine Rohdateien im Projekt und keine Lizenzverwaltung — und sie
liegen als Quelltext vor, sind also im Diff lesbar und gezielt änderbar.

## 8. Anwendung

### 8.1 Struktur

Die Spiellogik liegt als **eigenständige Bibliothek** in einem eigenen Paket. Sie
lässt sich unverändert in andere Projekte einbinden; die App ist nur einer ihrer
Nutzer.

```
indizio/
  package.json          Workspace-Wurzel, zugleich die Spiel-App
  packages/puzzle/      @indizio/puzzle - Generator und Löser
    package.json        eigene Version, eigener Build, kein Laufzeit-Zwang
    README.md           API, Austauschformat, eigene Themes (englisch)
    eslint.config.js    strict-type-checked, eigene Verbote (§8.1.1)
    src/
      index.ts          öffentliche Schnittstelle
      api.ts            hohe Ebene: solvePuzzle, verifyPuzzle, hintFor, boardLayout
      core/             Typen, Gitterrechnung, Seeds, Stufen, Zufallsgenerator
      clues/            was ein Hinweis bedeutet: auswerten, aufzählen, einschränken
      solving/          Kandidaten, Propagation, Permutationsregeln, Tipp, Referenz
      generation/       Grundriss, Möblierung, Rollen, Hinweissuche
      io/               JSON-Austauschformat mit vollständiger Prüfung
      content/          Themes und Namen — Daten, austauschbar
      i18n/             i18next-Ressourcen und der Hinweisübersetzer
    tests/              eigene Testsuite, inklusive erzwungener Entkopplung
      deep/             der gründliche Lauf: Eigenschaften und Zeiten
      reference/        eingefrorene Prüfsummen und Beispielrätsel
  public/               Icons, Manifest, Service Worker
  scripts/              Katalog- und Hilfsskripte
  src/
    worker/             Generator im Web Worker
    app/                Oberfläche (React), Zustand, Speicherung, Sprites
    styles/
  tests/                App-Tests (Katalog)
```

Die Ordner sind **Schichten mit einer Richtung**: `generation` darf `solving`
benutzen, `solving` darf `clues` benutzen, `clues` darf `core` benutzen, und
niemand darf zurückgreifen. Der Nutzen ist nicht Ordnungsliebe — wer eine
Änderung an der Hinweisbedeutung vornimmt, weiß dadurch sicher, dass er die
Erzeugung nicht mitverändert hat.

### 8.1.1 Die Entkopplung wird erzwungen, nicht bloß behauptet

Eine Testdatei liest den Quelltext der Bibliothek und weist nach:

| Prüfung | Warum |
|---|---|
| Importe halten die Schichtrichtung ein | sonst zerfällt die Gliederung still |
| Kein Import greift aus dem Paketordner heraus | die Bibliothek muss allein lauffähig sein |
| Keine Laufzeitabhängigkeiten im Kern | `npm install` soll nichts nachziehen |
| i18next nur in `src/i18n` | der Kern bleibt abhängigkeitsfrei |
| Kein DOM, kein React, keine Node-Module | derselbe Code in Browser, Worker und Test |
| Kein `Math.random` | Reproduzierbarkeit (V6) |
| Keine Uhr außer in `generate.ts` | `core` muss deterministisch bleiben |
| Bezeichner und Kommentare englisch | eine Bibliothek für andere Projekte |

Diese Prüfung hat sich selbst bewiesen: sie fand einen echten Schichtverstoß
(`clues/constrain.ts` griff nach `solving`), der beim Lesen niemandem aufgefallen
war. Die Datei ist daraufhin nach `solving/propagate.ts` gewandert — sie
beschreibt nicht, was ein Hinweis *bedeutet*, sondern wie man *mit* ihm schließt.

Ein weiterer Test erzeugt ein Rätsel mit einem **fremden Theme**, das die
Bibliothek nicht kennt.

Der Austausch zwischen Projekten läuft über ein JSON-Dokument (`§6.8`), das
`parsePuzzle` vollständig prüft, bevor es etwas zurückgibt.

### 8.2 Bildschirme

- **Katalog** — Rätsel nach Stufe, Fortschrittsmarkierung, „weiterspielen",
  Seed-Eingabe, Tagesrätsel (Datum als Zufallszahl). Die Liste ist eine
  versionierte Datei mit **kuratierten Seeds**, erzeugt von `scripts/curate.ts`:
  es generiert je Stufe Kandidaten, übernimmt nur solche mit sauberer
  Einstufung und guter Themenverteilung und schreibt Seed, Titel und Kennwerte
  fest. Damit ist der Katalog reproduzierbar und trotzdem seed-basiert. → **V2**
- **Spiel** — Gitter, Karten, Werkzeuge, Tipp, Bestätigen, Timer.
- **Auflösung** — Mörder, Zeit, benötigte Tipps, Link zum Teilen.
- **Regeln und Tutorial** — sechs Schritte, dazu eine dauerhaft erreichbare
  Regelseite mit Schlüsselwörtern und Techniken.

### 8.3 Eingabe

**Bleistiftnotizen.** Ein kurzes Tippen auf ein Feld setzt den Anfangsbuchstaben
der ausgewählten Person als Notiz — **links oben** in der Zelle, wie bei Murdoku.
Mehrere Notizen in derselben Zelle stehen nebeneinander und laufen bei Bedarf um;
sie bleiben auch neben einer X-Markierung sichtbar. Erneutes Tippen mit derselben
Person entfernt ihre Notiz wieder.

**Zeigerauswertung über Koordinaten.** Welche Zelle gemeint ist, wird
ausschließlich aus den Zeigerkoordinaten bestimmt (`elementFromPoint`), nie aus
dem Ereignisziel. Grund: sobald der Zeiger für das Ziehen eingefangen ist
(`setPointerCapture`), liefern alle Folgeereignisse den Gitter-Container als
Ziel statt der Zelle darunter — ein zielbasierter Zugriff findet dann beim
Loslassen keine Zelle mehr, und genau daran ist das kurze Tippen gescheitert
(VALIDATION.md, Runde 10).

**Raumgrenzen sind immer sichtbar.** Jeder Raum ist von einer **dicken
schwarzen Linie** umgeben, die Felder darin trennt ein dünner Strich. Das ist
Spielinformation und keine Verzierung: fast jeder Hinweis nimmt auf Räume Bezug
(„allein im Raum", „im selben Raum wie"), und wer die Grenze nicht sieht, kann
den Hinweis nicht anwenden.

Früher trug die Hervorhebung unter der Maus diese Aufgabe allein. Das war ein
Entwurfsfehler: **auf dem Handy gibt es kein Schweben**, und eine Information,
die nur der Maus zugänglich ist, fehlt der Hälfte der Spieler (VALIDATION.md,
Runde 15). Die farbige Hervorhebung beim Schweben kommt am Schreibtisch
obendrauf — sie hebt den Raum unter dem Zeiger an und färbt seinen Namen ein,
aber sie ersetzt nichts.

Beide Strichstärken wachsen mit der Feldgröße und haben eine Untergrenze, damit
sie auch im härtesten Fall — 10×10 auf einem 360 px breiten Gerät, Feld ≈ 32 px —
noch als **zwei verschiedene** Stärken lesbar sind. Darauf kommt es an: die
Raumgrenze muss sich vom Feldraster unterscheiden, nicht nur vorhanden sein.

Gezeichnet wird alles in **einem** SVG über dem Boden, nicht als Schatten je
Zelle. Eine geteilte Kante wird damit einmal gezeichnet statt zweimal halb, und
die Strichstärke ist überall genau die angegebene — bei Kachelschatten wäre sie
an Raumgrenzen doppelt so dick wie am Brettrand. Die Linien liegen über den
Requisiten (eine Grenze, die hinter dem Schrank verschwindet, lässt den Raum
offen aussehen, wo er geschlossen ist) und unter allem, was der Spieler selbst
setzt. Sie nehmen keine Eingabe an.

**Platzieren zieht die Konsequenzen nach.** In jeder Zeile und jeder Spalte
steht genau eine Person. Sobald jemand gesetzt wird, ist damit der Rest seiner
Zeile und Spalte ausgeschlossen — das trägt die Oberfläche selbst nach, statt es
dem Spieler als Fleißarbeit zu überlassen (so macht es auch Murdoku, §2,
Tutorial Schritt 3):

- alle übrigen Felder der Zeile und Spalte bekommen ein X,
- deren Notizen fallen weg, denn dort kann niemand mehr stehen,
- sämtliche Notizen der gesetzten Person verschwinden, sie ist ja fix,
- eine andere Person, die dieselbe Zeile oder Spalte belegte, wird
  heruntergenommen — sonst entstünde ein Brett, das die Grundregel bricht.

Rückgängig macht all das in einem Schritt wieder rückgängig.

**Gesperrte Felder nehmen keine Eingabe an.** Auf einem sperrenden Objekt kann
niemand stehen (§3.2 Regel 3), deshalb ignoriert das Gitter dort Platzieren,
Notieren und X-Markieren vollständig und quittiert den Versuch mit einem kurzen
roten Aufblitzen. Der Zustand kann so gar nicht erst ungültig werden — die Regel
steht nicht nur im Prüfcode, sondern in der Bedienung.

Touch: Tippen setzt eine Notiz, Halten (350 ms) platziert, Ziehen malt Notizen.
Desktop zusätzlich: Doppelklick platziert, Rechtsklick setzt X, Pfeiltasten mit
Eingabe- und X-Taste. Werkzeuge: X-Markierung, Radierer (halten leert alles),
Rückgängig über einen Zustandsstapel. Haltedauer und Vibration sind in den
Optionen einstellbar.

### 8.4 Zustand und Speicherung

Ein Reducer hält Platzierungen, Notizen, X-Marken, Undo-Stapel, Timer und
Tippzähler. Gespeichert wird pro Seed in `localStorage` unter
`indizio:v2:save:<seed>`, dazu ein Fortschrittsindex für den Katalog.

Der **Seed bleibt die Quelle der Wahrheit** — der Spielstand referenziert ihn und
enthält nie eine eigene Rätselkopie. Damit das Wiederaufnehmen eines 10×10 nicht
jedes Mal Sekunden kostet (§11, G6), wird das erzeugte `core`-Objekt zusätzlich
unter `indizio:v2:puzzle:<seed>` zwischengespeichert.

Das Präfix trägt die Version, weil beides zugleich veralten kann: mit
Generatorversion 2 beschreibt derselbe Seed ein anderes Rätsel, und das
Austauschformat hat andere Felder. Alte Einträge werden dadurch nicht
fehlinterpretiert, sondern schlicht nicht mehr gefunden — ein Spielstand von
gestern verschwindet, ein falsches Rätsel erscheint nie.

### 8.4.1 Versionsnummer

Format `<Jahr>.<Nummer>`, zum Beispiel `2026.4` — die vierte Fassung aus diesem
Jahr. Sie steht in der Fußzeile jedes Bildschirms.

**Bewusst kein Semver.** Semantische Versionen sagen etwas über Verträge
zwischen Programmen zu; die Bibliothek hat solche Nutzer (§8.1, dort gilt
Semver), das Spiel hat Menschen vor dem Bildschirm. Für die ist „die vierte
Fassung aus diesem Jahr" die nützlichere Auskunft.

Gepflegt wird die Nummer an **einer** Stelle, der `package.json`; beim Bauen
wird sie eingesetzt. Eine zweite Stelle hieße, dass beide auseinanderlaufen
können — und eine Versionsnummer, der man nicht glauben kann, ist schlimmer als
keine. Ein Test vergleicht deshalb, was die Oberfläche anzeigt, mit dem, was in
der Datei steht.

Hochgezählt wird mit `npm run bump`, beim Jahreswechsel wieder ab eins. Der
Reset ist nötig, damit die Nummer etwas aussagt: „2027.58" ließe offen, ob 58
Änderungen in einem Jahr oder in fünf passiert sind.

**Nicht an den Bau gehängt.** Gebaut wird auch zum Ausprobieren, und dabei
ändert sich nichts am Spiel. Die Nummer soll steigen, wenn jemand etwas geändert
hat — das weiß nur der Mensch, der es geändert hat.

Die Fußzeile kennt ihre eigene Höhe und gibt sie als `FOOTER_PX` weiter: der
Spielbildschirm rechnet die Gittergröße aus dem Viewport und muss wissen, was
unter dem Brett Platz belegt, sonst schöbe die Fußzeile das Gitter aus dem Bild.

### 8.5 Darstellung auf allen Geräten

Ein Layout, zwei Anordnungen: ab 900 px stehen die Karten links neben dem
Gitter, darunter als waagerecht scrollbares Band darüber. Das Gitter skaliert auf
`min(verfügbare Breite, verfügbare Höhe)` mit ganzzahligem Sprite-Faktor.
Zielgeräte 360 px bis 1440 px, Treffflächen mindestens 44 px. → **V7**

---

## 9. Auslieferung

`npm run build` erzeugt rein statische Dateien, lauffähig auf jedem Webspace,
GitHub Pages oder Netlify. Service Worker und Manifest machen das Spiel nach dem
ersten Laden offline spielbar und auf dem Handy zum Startbildschirm
hinzufügbar. Kein Backend, kein Konto, keine Datenübertragung. → **V7**

---

## 10. Meilensteine

Alle dreizehn Etappen sind umgesetzt. Die Abnahme (§11) ist grün; offen ist
allein der Offline-Nachweis G11 in einem normalen Browser.

| M | Inhalt | Ergebnis |
|---|---|---|
| M0 ✓ | Vite + TS + React, Vitest, ESLint, Ordnergerüst | `npm run dev` läuft |
| M1 ✓ | Datenmodell, Themes, Hinweistypen, Evaluator, i18n-Rendering, Referenzlöser | Hinweise sind prüfbar und in DE/EN lesbar |
| M2 ✓ | Solver, Schwierigkeitsmaß, Tipp-API, Soundness-Tests | Rätsel sind maschinell lösbar und bewertbar |
| M3 ✓ | Generator, Seed, Worker, Zeitmessung | Reproduzierbare Rätsel aller fünf Stufen |
| M4 ✓ (ersetzt) | Zunächst Atlas aus CC0-Pixelgrafik, später vollständig durch eigene Vektorgrafik abgelöst (§7.5) | Tatorte sind sichtbar |
| M5 ✓ | Spiel-UI, Eingabe, Werkzeuge, Undo, Bestätigen, Persistenz | **ab hier spielbar** |
| M6 ✓ | Katalog mit Fortschritt, Tipp-UI, Auflösungsbildschirm | Vollständige Spielschleife |
| M7 ✓ | Tutorial, Timer, Teilen, Drucken | Ausstattung komplett |
| M8 ✓ | i18n vollständig, Responsive-Feinschliff, PWA, Abnahmelauf G1–G14 | Abnahmekriterien erfüllt |
| M9 ✓ | Bibliothek refaktoriert: englisch, geschichtet, i18next, zwei Regelstufen, Testsuite in zwei Stufen (§8.1.1, §11) | Wartbar und nachprüfbar |
| M10 ✓ | Grafiken als austauschbare Dateien je Theme (§7.0), Raumgrenzen ohne Maus erkennbar (§8.3) | Bereit für endgültige Grafiken |
| M11 ✓ | Versionsnummer `<Jahr>.<Nummer>` in der Fußzeile (§8.4.1) | Jeder Stand ist benennbar |
| M12 ✓ | „Neben" nennt nie das eigene Standobjekt (§4.2.1), Generatorversion 3 | Hinweise sagen, was am nächsten liegt |
| M13 ✓ | Requisiten je Grundfläche (§7.0), gewählte Person leuchtet im Gitter (§3.1) | Objekte belegen sichtbar ihren Platz |

Themes: Werkstatt (Auto, Regal, Werkbank, Ölfleck, Reifenstapel), Wohnung (Sofa,
Küchenzeile, Bett, Teppich, Bücherregal), Hinterhofgarten (Baum, Beet,
Gartenstuhl, Teich, Schuppen).

---

## 11. Abnahmekriterien

Automatisiert (Node, ohne Browser), sofern nicht anders vermerkt. Die Kriterien
stecken seit dem Umbau in der **Testsuite der Bibliothek** statt in einem
eigenen Abnahmeskript — dort werden sie bei jeder Änderung mitgeprüft, statt nur
dann, wenn jemand daran denkt, den Abnahmelauf zu starten.

| Lauf | Befehl | Umfang |
|---|---|---|
| Schnell | `npm run test:lib` | Sekunden; hält die Zusagen zwischen zwei gründlichen Läufen ehrlich |
| Gründlich | `npm run test:deep` | alle Gittergrößen, hunderte Seeds, Zeitbudgets |
| Vor dem Commit | `npm run verify` | Typprüfung, Lint, Tests von Bibliothek und App |

Zwei Ergänzungen, die es vorher nicht gab:

- **Eigenschaftsbasierte Tests** (fast-check) erzeugen die Fälle selbst, statt
  eine Handvoll ausgesuchter Seeds zu prüfen. Was hier fällt, kommt mit dem
  verkleinerten Gegenbeispiel zurück.
- **Eingefrorene Prüfsummen** (`tests/reference/`) halten G4 über die Zeit fest:
  zehn Seeds mit ihrem Prüfwert und zwei vollständige Beispielrätsel. Ändert
  sich der Generator ungewollt, fällt der Test; ändert er sich absichtlich, wird
  die Referenz mit einem eigenen Skript und der erhöhten `generatorVersion` neu
  geschrieben.

| # | Kriterium |
|---|---|
| G1 | 500 Rätsel je Stufe: 100 % vom Logiklöser ohne Fallunterscheidung vollständig gelöst |
| G2 | Stichprobe 200 je Stufe: Referenzlöser bestätigt genau eine Lösung |
| G3 | 100 % aller ausgegebenen Hinweise sind gegen die Lösung wahr |
| G4 | Gleicher Seed ⇒ byte-identisches `core`-JSON (ohne `meta`), 1000 Wiederholungen über Prozessgrenzen hinweg |
| G5 | 100 % der ausgelieferten Rätsel erfüllen beide Schranken ihrer Stufe aus §5.4 (Streuung, indirekte Hinweise); Rätsel außerhalb der Schranken werden verworfen, nicht umetikettiert |
| G6 | p95-Generierungszeit im Node-Referenzlauf: 5×5 < 100 ms, 7×7 < 400 ms, 8×8 < 300 ms, 9×9 < 1 s, 10×10 < 4 s. Für Mobilgeräte gilt der dreifache Wert, einmal real auf einem Mittelklasse-Handy in M8 nachgemessen. Die Generierung läuft im Worker, die Oberfläche bleibt bedienbar |
| G7 | Solver-Soundness: 10 000 Zufallszustände, jeder eliminierte Kandidat vom Referenzlöser als unmöglich bestätigt |
| G8 | 100 % der Rätsel: Raum des Opfers enthält genau zwei Personen |
| G9 | 100 % der Rätsel: jede Zeile und jede Spalte enthält genau eine Person, keine auf blockiertem Feld |
| G10 | Layout ohne waagerechtes Scrollen bei 360/390/768/1280 px, Treffflächen ≥ 44 px (Browser-Prüfung) |
| G11 | Nach erstem Laden im Flugmodus spielbar, Rätsel wird offline generiert (Browser-Prüfung) |
| G12 | Alle Oberflächentexte und alle Hinweistypen in DE und EN vorhanden; ein Schlüsselabgleich meldet fehlende oder verwaiste Einträge |
| G13 | Kein Kartenhinweis verletzt die Einschränkungen aus §4.2.1 (eindeutiges Bezugsobjekt, kein namentlicher Opferbezug, keine Zweierzyklen, kein „neben" auf das eigene Standobjekt) |
| G14 | Der Tipp greift nie auf den Spielstand zu: Läufe mit zufällig verfälschten Brettern liefern denselben Tipp wie das leere Brett |
| G15 | Die Schichtgrenzen der Bibliothek aus §8.1.1 sind eingehalten, geprüft am Quelltext |
| G16 | Jede Grafik, die das Spiel anfordert, liegt als Datei vor — je Theme, je Art, je Grundfläche, ohne Verwaiste (§7.4) |
| G17 | Die angezeigte Versionsnummer hat das Format `<Jahr>.<Nummer>` und stimmt mit der `package.json` überein (§8.4.1) |

---

## 12. Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Hinweissuche findet für 8×8 und größer keine ohne Raten lösbare Belegung | **Eingetreten und behoben** (VALIDATION.md, Runde 5). Wirksam waren: Lösung zuerst, Möblierung danach (§6.3); je Objekttyp höchstens ein Anker; Reparaturphase in der Hinweissuche (§6.6); mehr und kleinere Räume (§6.2). Ergebnis im Benchmark: alle fünf Stufen erzeugbar, 0 Fehlschläge, Eindeutigkeit vom Referenzlöser bestätigt |
| Generierung zu langsam auf schwachen Handys | Worker mit Zeitbudget, Messung in G6; notfalls Hybrid mit vorberechnetem Katalog (bewusst nach V1 verschoben) |
| Solver unsound, mehrdeutige Rätsel gehen durch | Referenzlöser als unabhängige Prüfinstanz, G2 und G7 |
| Fremde Grafikpakete decken ein Theme nicht ab | **Entfallen:** alle Grafik ist eigener Vektor (§7), kein Paket mehr im Spiel |
| Testsuite prüft nur ausgesuchte Seeds und übersieht seltene Fälle | Eigenschaftsbasierte Tests erzeugen die Fälle selbst (§11); der gründliche Lauf deckt jede Gittergröße ab |
| i18next zieht eine Abhängigkeit in den Kern | Optionale Peer-Abhängigkeit, nur am Einstiegspunkt `/i18n`; ein Test hält den Kern abhängigkeitsfrei (§8.1.1) |
| Deutsche Beugung in Hinweisen wird holprig | Kasusformen je Objekt in den Sprachdateien statt Zusammenkleben zur Laufzeit; Textprüfung aller Typen in M1 |
