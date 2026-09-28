# Indizio — development plan

> Logic puzzles at the crime scene. A detective deduction game in the style of
> [Murdoku](https://murdoku.com), with procedurally generated crime scenes,
> seed-reproducible puzzles and flat vector art.

**Status:** plan v15 — rework of structure, i18n, quality and language (§14).
Before that v14: laid objects in free shapes with a fixed quarter-tile scheme
(§13). Before that v13: engine inside the project instead of a package, a
calendar instead of a curated catalogue, random case by tier, playable without
a mouse.
Review log: [VALIDATION.md](VALIDATION.md)

---

## 1. Requirements of the brief

These points are the yardstick. Every section refers to the number it
satisfies.

| # | Requirement | Satisfied in |
|---|---|---|
| V1 | Sudoku-like: only one suspect per column and row | §3.2, §5 |
| V2 | Suspects on the left; difficulty rising with more suspects | §3.1, §5.4, §8.2 |
| V3 | Randomly generated puzzles with different rooms | §6.2, §6.3 |
| V4 | A fitting description is generated for every suspect | §4, §6.6 |
| V5 | All drawings home-made, as freely scalable SVG in replaceable files | §7, §7.0 |
| V6 | Seed-based reproducibility | §6.1, §6.8 |
| V7 | Runs in the browser on desktop and phone | §6.7, §8.5, §9 |
| V8 | Murdoku's documentation and tutorial read in full | §2 |
| V9 | Generator and solver as a decoupled library, exchange via JSON | §8.1, §6.8 |
| V10 | Non-rectangular rooms: corridors and L-shapes | §6.2 |
| V11 | Objects such as carpets or corridors in free shapes inside a room — around corners, with crossings — configurable per theme as a way of laying rather than tied to single objects, with a fixed drawing scheme that covers every shape | §13 |

---

## 2. What Murdoku actually does (source for §3–§5)

From the rules, the keyword list, the advanced tips, the FAQ and the six-step
tutorial, read on 27 August 2026.

**Rules**

- One person per row and per column.
- Suspects only on walkable cells (not on tables, trees …).
- The victim is a card on the grid too and carries the clue "The victim. He was
  alone with the murderer."
- Whoever places everyone correctly has implicitly convicted the murderer.

**Keywords with an exact meaning**

- *next to* — left, right, above or below *and in the same room*.
- *alone* — nobody else was in the room, *not even the victim*.
- *alone with* — only these people were in the room.
- *empty area* — an area where nobody was, not even the victim.
- *corner* — where two walls of a room meet.
- *diagonal* — on the same diagonal as (a).
- *row* / *column* — a horizontal or vertical line of cells.
- *west of (a)* / *east of (a)* — any cell left or right of (a).
- The tutorial also names *north of* and *in the same area*.

**Promises from the FAQ**

- "someone" and "person" always include the victim.
- Clues are always true; there are no tricks.
- "next to a shelf" allows several shelves; if the number matters, it says
  "exactly one shelf".
- Exactly one valid solution, but several ways to it.
- You *never have to guess*; every puzzle is solvable by pure deduction.
- Portraits are purely decorative and never matter for the solution.
- Large objects cover several cells; a person occupies only one of them.
- Whoever sits "on a chair" is also "next to a chair".

**Advanced techniques the puzzle design must support**

1. A row or column with exactly one free cell ⇒ someone stands there.
2. If k people are confined to k rows (or columns), nobody else stands there.
3. If a person can occupy only two cells, every cell lining up with both is
   blocked.

**Catalogue structure**

Five tiers (very easy → expert), grid size equal to the number of suspects,
5×5 to 10×10.

---

## 3. Game concept

### 3.1 Screen layout

On the left (desktop) or in a horizontally scrolling strip (phone): the suspect
cards with portrait, name and *exactly one* clue. Next to them the square grid
with rooms and objects, below it the tools. → **V2**

**The letter on the board is the first letter of the name**, not A, B, C by
card order. An "N" should remind you of Nadja, not of her being the fourth
card; checking who stands where then needs no detour through the list. The
shipped name pool has different initials throughout — an engine test holds
that, because two identical marks would make a solvable puzzle look unsolvable.
A foreign pool need not, so the UI lengthens colliding marks as far as needed
to tell them apart.

**The victim is last in the list.** It is the one card with nothing to
investigate — its clue is fixed from the start. In the middle it interrupts the
list; at the end it closes it. It is still placed like any other person (§3.2);
it is just never preselected, since a highlight at the bottom would look like a
mistake.

Both are *presentation only*: the id stays untouched; it is the index into
solution, placements and notes.

**A frame shows where the keyboard is.** The board is a single tab stop; inside
it a frame moves with the arrow keys (§8.3). It appears on the first key press,
not on focus — whoever clicks the board with a mouse does not need it. Its
position survives a change of focus: going to the toolbar and back finds it
where it was left.

**The selected person lights up on the board.** Once a card is selected, the
grid highlights every one of its marks — the placement and every pencil note.
On a full 10×10 grid there would otherwise be a dozen identical letters and you
would search for your own; "this is where I suspected them" lived only in your
memory until then.

### 3.2 Core rules

1. On an N×N grid stand exactly N suspects, one of them the victim.
2. **Every row and every column holds exactly one person.** The solution is a
   permutation matrix. → **V1**
3. Suspects never stand on blocking object cells.
4. The victim's room holds exactly two people: the victim and the murderer.
5. Every card carries exactly one true clue; in addition there are a few
   card-less scene clues (up to ⌈N/2⌉, at least 3 possible).
6. Every puzzle has exactly one solution and is solvable without case
   analysis.

### 3.3 Flow

Tapping a suspect selects them. Tapping a cell sets a pencil note, holding it
places. Once all N are placed, "Confirm" becomes active. The feedback is binary
— right, or "not quite" without revealing which figure is wrong. On success the
resolution follows, naming the murderer.

---

## 4. Clue system

Clues are *structured data*, not text. Only the i18n layer renders them. That
is what lets German and English come from the same generation. → **V4**

### 4.1 Shared semantics

- **Person** includes the victim.
- **Adjacent** means orthogonal (N/E/S/W), no diagonals, and the adjacent cell
  must be *in the same room* as the subject.
- **Touch set** of a subject: its own cell plus its orthogonal neighbours in the
  same room. An object counts as "next to" the subject if it has at least one
  cell in the touch set. So whoever sits on a chair is also next to a chair —
  exactly as in Murdoku's FAQ.
- **Object counts** count object *instances*, not cells. A two-cell shelf
  touched in two places counts once.
- All clues are true. There are no negated or misleading clues.
- Compass: row 0 is north, column 0 is west.

### 4.2 Card clues (exactly one per card)

| Type | Parameters | Meaning | From tier |
|---|---|---|---|
| `ON_OBJECT` | objectKey | the subject's cell lies on a walkable instance of this type | very easy |
| `IN_ROOM` | roomId | the subject is in this room | very easy |
| `ADJACENT_OBJECT` | objectKey, count? | at least one, or exactly `count`, instances in the touch set | very easy |
| `ALONE` | roomId? | no other person in the subject's room | very easy |
| `SAME_ROOM_AS` | otherId | subject and the named person share a room | easy |
| `DIRECTION_OF_SUSPECT` | dir, otherId | west/east/north/south of that person | easy |
| `DIRECTION_OF_OBJECT` | dir, objectKey | west/east/north/south of *every* cell of that type's instance; only allowed when the whole grid holds *exactly one* instance of the type | medium |
| `CORNER` | — | the subject stands on a room corner | medium |
| `ALIGNED_WITH_OBJECT` | axis, objectKey | shares a row or column with a cell of this type | medium |
| `DIAGONAL_OF` | otherId | \|Δr\| = \|Δc\| to the named person, Δ ≠ 0 | hard |
| `ALONE_WITH` | otherIds[] | exactly the subject and the named people are in the room | hard |

**Deliberately not implemented:** same row or same column *between people*.
With one person per row and column such a clue could never be true. Murdoku's
glossary entries "row" and "column" only define the words; as clues they occur
only in relation to objects, which `ALIGNED_WITH_OBJECT` covers.

### 4.2.1 Restrictions that keep clues unambiguous and non-trivial

- **Unique reference objects.** Clues about *one particular* instance
  (`DIRECTION_OF_OBJECT`) are only allowed when exactly one instance of the
  type stands on the grid — otherwise "west of the shelf" would be ambiguous.
  Existential clues (`ON_OBJECT`, `ADJACENT_OBJECT`, `ALIGNED_WITH_OBJECT`)
  need no such restriction, because they quantify over all instances
  explicitly.
- **No card clue names the victim** in `SAME_ROOM_AS` or `ALONE_WITH`.
  Otherwise the murderer would be named outright and the actual deduction
  would vanish. `DIRECTION_OF_SUSPECT` and `DIAGONAL_OF` may refer to the
  victim, since they say nothing about who is in which room.
- **No self-references and no cycles of length 2** in relational clues: A may
  not point to B while B points to A — such pairs carry less information
  together than their number of cards suggests.
- **"Next to" never names what the subject stands on.** The touch set includes
  the own cell (§4.1), so "next to a chair" is true while sitting on it —
  Murdoku's rule, literally. But true is not the same as fair: the sentence
  reads as a denial of the plainer truth, and whoever works out that she sat on
  the chair rightly feels misled. `ADJACENT_OBJECT` is therefore not offered at
  all for an object type the subject stands on. `ALIGNED_WITH_OBJECT` has
  always skipped the instance underfoot — the restriction brings the two into
  line (VALIDATION.md, round 18).

  The *rule itself is unchanged*: "next to" still includes the own cell, and
  the solver computes it that way. What changed is only which sentences the
  clue search picks up at all.

### 4.3 The victim's clue (fixed)

`VICTIM` — "The victim. Was alone with the murderer." Semantics: the victim's
room holds exactly two people. The clue does not say who the second one is; the
deduction comes from exactly that.

### 4.4 Global scene clues (card-less)

| Type | Parameters | Meaning | From tier |
|---|---|---|---|
| `EMPTY_ROOM` | roomId | nobody was in this room, not even the victim | very easy |
| `ROOM_COUNT` | roomId, n ≥ 1 | exactly n people stood in this room | medium |

Their number is capped at ⌈N/2⌉, but at least 3 — on large grids they carry a
good part of the information. The redundancy pass of §6.6 then removes
whatever is not needed.

`EMPTY_ROOM` is the special case n = 0 and so has its own phrasing, available
early. `ROOM_COUNT` is restricted to n ≥ 1 so that two clue types never compete
for the same fact. At most one global clue is given per room.

### 4.5 Rendering as language

Every clue type has a template per language. Objects and rooms carry their
word forms with gender and the needed cases, plus the fitting preposition
("in a car", "on a chair", "at a workbench"). People carry a grammatical gender
so "He was …" and "She was …" come out right. English uses the same structure
with its own templates.

**Implemented with i18next**, not a home-made template language. That brings
plurals, context variants and interpolation ready-made — exactly the three
things a home-made solution would have to rebuild bit by bit anyway. Two
decisions keep it compatible:

- The library creates its **own i18next instance** with `createInstance()` and
  leaves any existing setup alone. The app hands in its own instance, so UI and
  clues share one language (§14, U3).
- i18next is loaded only from the `@engine/i18n` entry point. Whoever only
  generates and solves still gets a core **without any runtime dependency**
  (§8.1).

Each theme brings its own word forms in `content/themes/<key>/locales/`; the
translator reads them under `themes.<key>` (§14, U2).

---

## 5. Solver

The solver is the heart of the project: it checks uniqueness, measures
difficulty and provides the hints. It works on candidate sets and is **sound**
— it removes only candidates that are provably impossible.

### 5.1 State

For every suspect s a bit mask of possible cells `cand[s]`. Derived from it,
per cell the set of possible suspects. Blocked cells are removed from every
mask from the start.

### 5.2 Rule levels

- **R1 — clue propagation.** Every clue type narrows candidate sets.
  Relational clues work edge-consistently, room clues through upper and lower
  bounds of occupancy.
- **R2 — permutation rules.** Four deductions from N people standing on N rows
  and N columns: a placed person clears their row and column; the last
  occupiable cell of a line is occupied; a person confined to one line blocks
  it for everyone else; the only possible person of a line stands there.

**Only two levels, not four.** The original version also had group exclusion
(R3) and intersection elimination (R4). A measurement over 60 generated puzzles
showed that neither fired *even once* — the clue search deliberately limits
itself to R1+R2 to stay within the time budget, and so higher rules are
unreachable. Some 250 lines of unreachable code went (VALIDATION.md, round 14).

### 5.3 Procedure

Until a fixed point: R1, then R2 once R1 achieves nothing more; after every
success back to R1. No backtracking, no hypotheses. The result is `solved`,
`stuck` or `contradiction`. Since the solver is sound, a complete run without
case analysis also means the solution is unique.

The **chain of deductions** is recorded: every step with person, cell and
reason. It is also the source of hints (§5.5) — the player sees exactly the
reasoning the solver actually used, not one invented afterwards.

### 5.4 Measuring difficulty

Grid size is the **primary, non-overlapping** key — which is exactly how
difficulty grows with the number of suspects. Two **measured** figures serve as
lower bounds:

- **Spread** — the mean number of candidate cells per person after only the
  clues have been applied (R1 to a fixed point), before any permutation logic.
  It measures directly how much combinatorial work the puzzle demands: at
  spread 4 almost everyone is pinned down by their own clue; at spread 12 the
  clue alone hardly carries.
- **Indirect clues** — clues that say nothing directly about the own cell, only
  a relation: `ALONE`, `SAME_ROOM_AS`, `DIRECTION_OF_SUSPECT`,
  `DIRECTION_OF_OBJECT`, `CORNER`, `ALIGNED_WITH_OBJECT`, `DIAGONAL_OF`,
  `ALONE_WITH`. They are noticeably harder to work with than `ON_OBJECT` or
  `IN_ROOM`.

| Tier | Key | Grid | Spread ≥ | Indirect clues ≥ |
|---|---|---|---|---|
| very easy | `veryEasy` | 5×5, 6×6 | 3.2 | 0 |
| easy | `easy` | 7×7 | 4.5 | 1 |
| medium | `medium` | 8×8 | 6.0 | 2 |
| hard | `hard` | 9×9 | 6.5 | 2 |
| expert | `expert` | 10×10 | 7.5 | 3 |

Both bounds rise monotonically with the tier, no grid size occurs in two tiers,
and both can be checked by machine (G5). The values are not guesses but read
off some 26,000 generated crime scenes — measurement and derivation are in
[VALIDATION.md](VALIDATION.md), round 5.

**No rule depth any more.** With only R1 and R2 (§5.2) and every shipped puzzle
fully solvable by them, an upper bound "maxRule ≤ R2" would say the same for
every puzzle. It went without replacement; the never-guess promise now rests
solely on the solver getting through.

> **What does "measured" mean here?** Both figures are stored in the puzzle as
> `difficultyProof` and can be recomputed without solving it. A puzzle that
> misses its bound is discarded and regenerated — never relabelled.

> **Why rule depth failed twice.** The original plan demanded it as a *lower*
> bound: "medium" should need R3 at least once. The measurement disproved that
> — over 96 % of all solvable puzzles manage with R1 and R2, R4 never occurred.
> So it stayed as an upper bound. When the library was reworked it turned out
> that R3 and R4 fired *not once* in 60 of 60 generated puzzles and could not:
> the clue search checks solvability with R1+R2 only. So the upper bound was
> meaningless too, and some 250 lines of unreachable code went
> (VALIDATION.md, round 14).

→ **V2**

### 5.5 Hint

The hint *always runs on the empty starting state*, never on the player's
board. The solver produces the puzzle's canonical chain of deductions once; the
hint shows its first step whose result is not yet on the board, with the
reason: which clue or rule applies and what follows.

That is deliberate. If the hint ran on the player's board, it could be abused
as an error finder ("dead end" ⇒ something is wrong), and the deliberately
binary feedback of §3.3 would be undermined. This way the hint never comments
on the player's mistakes; it only ever talks about the puzzle.

A hint places nothing automatically: it highlights the cell and names the
reason. If another figure already stands there, the player clears it. Hints are
counted and shown in the resolution.

### 5.6 Reference solver

`solving/reference.ts` counts every valid assignment by exhaustive search. It
is not part of the game but a checking authority: cross-checking uniqueness and
proving the logic solver sound. It deliberately shares *no* code with the logic
solver except clue evaluation — a shared thinking error should not sit in both
at once.

It works to a budget (`solutionLimit`, `maxNodes`) and reports through
`exhaustive` whether it really exhausted the search space. A spent budget counts
as *undecided* in the tests, never as passed.

---

## 6. Generator

### 6.1 Seed

Format `v<gen>-<theme>-<size>-<diff>-<rng36>`, for example
`v4-garage-6-vl-k3f9tq`. It holds the generator version, theme, side length,
target tier and the random number. Route `/#/p/v4-garage-6-vl-k3f9tq` — hash
routing, so any static host works without rewrite rules. The same seed gives
the identical puzzle. → **V6**

The tier appears in the seed as a **short code** (`vl`, `l`, `m`, `s`, `x`),
in code as a readable key (`veryEasy` … `expert`). The short form keeps the
link short, the key keeps the code readable; the translation between the two
lives in exactly one place.

A seed with a foreign generator version is **refused**, not quietly
reinterpreted: under another version the same string would describe a
different puzzle, and a shared link showing something else is worse than one
that honestly stops working.

The app recognises this **from the string, before the generator starts**, and
says so in the player's language: "This link comes from an older version of
the game." Before, the seed went all the way into the generator and came back
as "No puzzle could be generated for this seed" — a factually wrong answer,
since nothing was meant to be generated here.

The example seed in the input field is built from the same constant. Typed in
by hand it still said `v1` long after version 2 shipped — an example the app
itself would have refused.

The random number generator is our own deterministic PRNG (SplitMix64 for
seeding, xoshiro128 for output) — never `Math.random`. When an attempt is
discarded, the attempt counter is fed into the PRNG stream, so the retry too
stays part of the reproducible chain.

#### 6.1.1 The daily case and its weekly rhythm

The date *is* the random number: everyone playing on the same day gets the
same case, with no server involved. On top, the weekday decides the tier:

| Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|
| very easy | easy | easy | medium | medium | hard | expert |

Five tiers do not divide seven days evenly, so the distribution is a choice,
not a formula: short cases on working evenings, the long one on Sunday. Before,
the grid size was nailed to 6, which made *every* daily case "very easy" — a
calendar of 365 identical days.

`dailySeed` takes **three plain numbers** rather than a `Date`. A `Date`
carries a time zone, and which day it names depends on where the reader is —
exactly the question the engine must have no opinion on. The app decides which
day is meant, and it decides on **local time**: a calendar is a local-time
thing.

The weekday is **computed** (Sakamoto), not read from a `Date` — the engine
reads no clock (§8.1.1). Because a home-made formula would confirm itself, a
test checks it against the platform: 366 days, day by day, plus named dates
such as 1 January 2000 and the leap day 29 February 2028.

Before the **start day 1 January 2026** there is nothing; after today the day
has not come yet; both are locked in the calendar (§8.2).

### 6.2 Rooms

**Rooms are connected sets of cells, not rectangles.** L-shapes, alcoves and
narrow corridors belong to them, as in real buildings. The set of cells is what
counts; `bounds` is only the enclosing rectangle and says nothing about the
shape.

Three steps:

1. **Guillotine split** of the square into K rectangles, minimum side 2,
   minimum area 4. Cuts near the middle are preferred so rooms come out of
   similar size — a huge room next to three closets makes room clues worthless.
2. **Carve a corridor** (with probability 0.55). The corridor runs along a line,
   may bend once and is one cell wide. Cells are only taken over while the room
   giving them up stays connected and large enough — so a room is never cut in
   two.
3. **Rectangular bites** moved between neighbouring rooms, about 1.2 rounds per
   side length. Deliberately not cell by cell: single wandering cells make
   frayed edges that look like noise rather than a floor plan. A bite of up to
   3 × 3 cells gives exactly the shapes buildings have — L-shapes, T-shapes and
   alcoves with straight walls.

After every step: **every room stays connected** (four-neighbourhood) and
**keeps at least four cells**; a corridor may be narrow but must be at least
three cells long. Changes violating this are undone. Measured, a good 80 % of
generated rooms are not rectangular.

| Side length | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|
| Rooms K | 3 | 3 | 4 | 5 | 6 | 7 |

Every theme must provide at least **seven** rooms; a test checks this for every
theme, or a room would stay nameless at K = 7.

The corner definition of §4.2 carries over unchanged: "a room cell with two
perpendicular neighbours outside the room". The re-entrant corner of an
L-shape is consistently *no* corner; for a corridor it is exactly its two ends.

### 6.3 Solution first, furniture second

**The order is the reverse of the obvious one.** The solution is fixed first,
then the crime scene is furnished around it. The original plan furnished at
random and then searched for a solution — measured, that gave *not one solvable
puzzle* for 8×8 and above, because people kept landing on featureless cells
with no sharp clue to describe them (VALIDATION.md, round 5).

1. **Roll the solution.** A random permutation fixes the occupied column per
   row. It is discarded and rerolled until at least one room holds exactly two
   people — the precondition for the victim's clue, which depends on the
   permutation alone, not on who stands where.
2. **Place anchors.** Every solution cell gets an object that makes it
   describable: either a walkable object right on it ("was in a car") or a
   blocking object orthogonally next to it in the same room ("was next to a
   shelf"). **Every object type serves as an anchor at most once** — if two
   cards got the same wording, a real symmetry would arise and with it several
   solutions.
3. **Filler.** More objects for atmosphere until the target density is reached
   (3 times the side length). Anchor types are left out so the anchor clues
   stay sharp.

Limits: at most 40 % blocked cells per room; an object lies entirely within one
room; if its footprint does not fit, it is not offered there. **Blocking objects
never lie on a solution cell** — so the solution stays valid by construction.
Laid objects (carpets, mats) grow into free shapes instead (§13.3). → **V3**

#### What is walkable

Walkable is only what a person could sensibly stand or sit on. The list is
final and enforced by a test:

| walkable | bed, carpet, mat, pallet, chair, garden chair, sofa, bench, bathtub, car, oil stain, stepping stone, sandbox, pond |
|---|---|
| **blocking** | table, lamp, cupboard, bookshelf, shelf, workbench, kitchen unit, counter, toolbox, barrel, tyre stack, plant, tree, bush, flower bed, shed, wheelbarrow |

The pond is deliberately walkable: Murdoku's FAQ answers "Can water be
occupied?" with an explicit yes (§2).

Every theme must offer **at least one walkable and one blocking** object type
per room, or solution cells in that room would get no anchor. Beyond that,
every theme needs enough *different* walkable types: since every type anchors
at most once, their number directly decides how fast large grids are generated
(VALIDATION.md, round 9).

### 6.4 Feasibility check

Because blocking objects spare solution cells, there is always at least one
perfect matching — the solution itself. The bipartite check (Kuhn over rows ×
columns on walkable cells) still stays as a guard and is run against every
generated puzzle in the acceptance tests (G9).

### 6.5 Roles

Suspects are drawn from the name and portrait pool by seed and assigned to the
solution cells. From a room with exactly two people, one becomes the victim,
the other the murderer; if there are several such rooms, the seed decides. So
the victim's clue is true in any case.

### 6.6 Clue search

First, every **true** clue about the solution is enumerated, limited to the
target tier's vocabulary (§4.2, §4.4), and sorted by strength. **Clue
strength** is defined exactly: the number of cells the clue alone — on the empty
starting state, without any other clue — removes from its subject's candidate
set. At most four representatives stay from each group of clues, spread evenly
over the strength range; that keeps the search short and prevents five nearly
identical direction clues.

Then four phases:

1. **Start.** The strongest true clue per card, duplicate wordings resolved. If
   the solver gets stuck, global scene clues are added (up to ⌈N/2⌉, at
   least 3).
2. **Repair.** While the solver is stuck, the most uncertain cards get a
   *different* clue — the one that shrinks the remaining sets most. Without this
   phase puzzles regularly fail on the last two people, who stay symmetric to
   each other.
3. **Weaken.** Greedily back: every card gets the weakest clue that keeps the
   puzzle solvable. The resulting set is the hardest this solution offers.
4. **Variety.** If the indirect clues do not suffice for the tier (§5.4), direct
   clues are swapped for indirect ones while it stays solvable.

Finally global clues that are no longer needed are dropped, and every remaining
clue is evaluated against the solution once more.

The solver uses the same rules as later in the game — R1 and R2, there is
nothing else (§5.2). So what the search considers solvable is solvable for the
player too. In the earlier version that was an assumption, since for time
reasons the search used fewer rules than the final check; today it is the same
computation. → **V4**

### 6.7 Running in a worker

The generator runs in a web worker with a time budget. The UI shows an
investigation animation meanwhile; after 30 seconds without an answer it
reports a failure instead of waiting forever (§14, U8). Pure TypeScript without
DOM access, so the same code runs in Node tests and in the browser. → **V7**

### 6.8 Output format

```
Puzzle {
  core: {                                  // deterministic, the basis of G4
    seed, generatorVersion, size, difficulty, themeKey,
    rooms:    [{ id, nameKey, cells, bounds }],
    objects:  [{ id, key, cells, walkable, placement, roomId }],   // placement: 'fixed' | 'tiled' (§13)
    suspects: [{ id, name, gender, portraitKey, isVictim }],
    clues:    [{ ownerId | null, clue: { type, … } }],
    solution: [cell per suspect id],
    murdererId,
    difficultyProof: { spread, indirect, attempts }
  },
  meta: { durationMs, generatedAt }        // runtime measurement, not deterministic
}
```

On the wire the whole thing is a document with `format: 'indizio-puzzle'` and
`schemaVersion`. Two counters that mean different things and so stay separate:
`generatorVersion` (currently **4**) says which algorithm generated the puzzle
— it is part of the seed, because after a change the same string would refer to
a different puzzle. `schemaVersion` (currently **3**) only says what the fields
are called; documents before 3 do not know `placement` and are read as all
fixed objects.

The serialisation of `core` is field-stable, so equal seeds give byte-identical
output. `meta` holds everything that depends on machine and time, and is
explicitly *not* part of the comparison in G4 — otherwise the criterion could
never be met. `attempts`, on the other hand, belongs to `core`, since the
attempt counter follows deterministically from the seed.

`parsePuzzle` validates completely on reading and collects **every** problem
rather than stopping at the first: rooms connected, cells in range, objects
connected within their room, fixed objects rectangular, laid objects of one
kind not touching (§13.6), exactly one victim, the solution a permutation, clue
types known. Whoever reads a broken document sees everything wrong with it in
one go. → **V6**

---

## 7. Drawings

**Everything is vector, everything is home-made.** No raster images, no sprite
atlas, no foreign art packs. Every shape is SVG on a 24×24 grid and stays sharp
at any size — from the 24-pixel icon in the toolbar to the large portrait in the
resolution. → **V5**

### 7.0 Every drawing is a file

The app **draws nothing**. It loads files from `art/`. Replacing a drawing
means replacing the file — no code changes.

That is not a formality but preparation for what is coming anyway: what is
there today are **placeholders**, and they exist to be replaced. As long as the
shapes lived as source code in the program, every replacement was an edit to
the code — with everything that can hang on that.

```
art/
  common/characters/        p01 … p14
  common/icons/             ui-x, ui-check, …
  common/floors/            fallback for foreign themes
  themes/<theme>/objects/   this theme's props
  themes/<theme>/tiles/     sheets of laid props (§13.4)
  themes/<theme>/floors/    the floors of its rooms
```

**Lookup goes theme first, then common.** So every theme gets its own set of
drawings without characters and icons lying there three times. Two themes may
use the same key — `chair` is in the car repair shop and the flat — and still
look different.

**Props have one file per footprint**, the name carrying it in cells:
`bed_2x1.svg` next to `bed_1x2.svg`, `kitchenunit_3x1.svg`. The drawing area
grows with it — 24 per cell, so `0 0 72 24` for three cells side by side — and
the renderer lays the file over exactly those cells.

The reason is not tidiness but drawing: a bed across is **not a rotated bed
lengthways**. A single 24×24 drawing would leave only two bad ways of getting
it onto two cells — stretch it, or put it small in the middle. Which footprints
exist is in the engine's theme definitions; today there are 48 across three
themes.

**Laid props** — carpet and mat — have no footprint but a sheet
`tiles/<key>.svg` of 48 × 72, from which the game assembles any shape in
quarters (§13.4).

Whoever manages with one file for every footprint stores it without a suffix
(`bed.svg`); the renderer takes it when it finds no matching footprint.

**The kind of drawing is part of the key**, not just its name. In the flat,
`carpet` means two things: the carpet someone stands on, and the bedroom's
fitted carpet. Looking up by file name alone lays a prop as floor across half
the room (VALIDATION.md, round 15).

The placeholders are made with `npm run art`, **during development only**.
Every generated file carries a marker; a file without it came from someone else
and is not overwritten. So an accidental run never costs a finished drawing. The
placeholder drawing instructions live in `scripts/art/` (one file per theme in
`scripts/art/themes/`) — outside the app, which imports nothing from there; once
the final drawings are in, the folder can go.

The files are embedded at build time, not loaded at runtime: that keeps the
game playable offline (§11, G11) and saves a request per shape.

### 7.1 Style

Clear and simple, modelled on flat vector icon sets:

- **flat areas**, no outlines, no gradients, no shadows;
- per material a base colour and a darker one for depth;
- generously rounded corners;
- one shared, tight palette for all placeholders (`scripts/art/palette.ts`);
- every shape reduced to its silhouette so it still carries at 24 px.

### 7.2 Characters without faces

The suspects are **silhouettes without a face**. Not a saving, but a
consequence of the promise that portraits never matter for the solution (§2,
FAQ): a face invites reading something into it; a silhouette does not.

The fourteen characters differ in three features that together give distinct
combinations: **clothing colour**, **head shape** (seven hairstyles and
headwear) and **skin tone**. So every character can be told from every other,
even small on the grid.

### 7.3 Floors

Every room has a floor, and it follows the **room**, not its id: tiles in the
bathroom, grass on the lawn, concrete in the workshop. Not decoration — almost
every clue refers to rooms, and a floor you recognise makes room borders clear
without reading. Since §14 the floor is part of the theme's room definition
(`rooms: [{ key, floor }]`).

| Floor | Rooms |
|---|---|
| planks | living room, hallway, study |
| tiles | bathroom, kitchen, wash bay, waiting area |
| paving | reception, patio, balcony |
| concrete | workshop, storage |
| fitted carpet | bedroom, office |
| grass | lawn |
| soil | vegetable patch, greenhouse |
| gravel | yard, shed area |
| sand | play area |
| water | pond side |

The colours are deliberately muted: characters and props are strongly coloured
and have to stand out against them. The tiles continue into one another —
grout and plank joints meet at the edges.

Against visible repetition **the game mirrors the tile per cell**, but only for
floors where nothing runs over the edge: grass, soil, gravel, sand. Planks,
tiles, paving, concrete, carpet and water stay unmirrored, or the neighbour
would cut their grout and waves. The mirroring depends only on the cell index,
so the same cell always looks the same.

It used to scatter anew per cell instead. That only worked while the tiles were
drawn in the program; as files there is exactly one picture per floor, and the
mirroring does the same with one file instead of many.

If two neighbouring rooms share a floor, a tiny brightness step per room tells
them apart. A foreign theme with unknown rooms falls back to concrete.

### 7.4 Extent

| Group | Files | Where |
|---|---|---|
| Props | 48 | `art/themes/<theme>/objects/` (18 + 15 + 15), one per footprint |
| Laid props | 2 | `art/themes/<theme>/tiles/` (carpet, mat), one sheet per kind |
| Floors | 16 | `art/themes/<theme>/floors/` (5 + 4 + 6), plus the fallback |
| Characters | 14 | `art/common/characters/` |
| Icons | 8 | `art/common/icons/` |
| App icon | 1 | `public/icon.svg`, also the manifest icon |

88 files: `chair` and `plant` occur in two themes and each get their own
version, and every prop counts once per allowed footprint. Which files are
needed is decided solely by the **engine's theme definitions**; if an object or
a footprint is added there, a file is missing here — and the test says which.

Checked: every footprint of every fixed object has a file with a fitting drawing
area, every laid one a 48 × 72 sheet, every room its theme's floor, every
portrait key a character, every icon is there, every tutorial picture resolves,
no file lies around unused, every file is a standalone SVG on the 24-unit grid,
and nothing is drawn at a negative position. A missing drawing would otherwise
only show when the generator happens to use that object.

### 7.5 Why no atlas any more

The first version used a rasterised sprite atlas of CC0 pixel art. Vector shapes
are better here in every respect: they scale losslessly (important, since the
cell size changes with the window), need no build pipeline, no raw files in the
project and no licence bookkeeping — and they are source text, readable in a
diff and changeable on purpose.

## 8. Application

### 8.1 Structure

The game logic lives **in the project, but behind exactly two doors**. Up to
plan v12 it was a package of its own (`@indizio/puzzle`); that was reversed,
because the app was its only user and the package boundary spread every change
over two directories, two manifests and two test runs. What remains is the
boundary itself — enforced rather than inherited (§8.1.1).

```
indizio/
  package.json            one manifest, one test run, one verify
  eslint.config.js        one strictness for all code; engine door and platform rules
  tsconfig.base.json      compiler strictness shared by engine and app
  tsconfig.json           the app (DOM)
  tsconfig.engine.json    the engine (no DOM)
  CODING_GUIDELINES.md    what no tool checks
  public/                 icons, manifest, service worker
  scripts/                helper scripts: drawings, reference data, CSS types, version
  src/
    engine/               generator and solver, no DOM, no React
      index.ts            the door: everything the app may use
      README.md           the contract
      api.ts              high level: solvePuzzle, verifyPuzzle, hintFor, boardLayout
      core/               types, grid arithmetic, seeds, tiers, random numbers, locales
      clues/              what a clue means: evaluate, enumerate, restrict
      solving/            candidates, propagation, permutation rules, hint, reference
      generation/         floor plan, furnishing, roles, clue search
      io/                 JSON interchange format with complete validation
      content/themes/     one folder per theme — data, replaceable
      i18n/               second door: i18next resources and clue translator
    worker/               the generator in a web worker
    app/                  the React UI
      features/           game (with board/), calendar, settings
      shared/             art, errors, help, i18n, layout, puzzle, storage, styles, ui
  tests/                  app tests and the boundaries (boundary.test.ts)
    engine/               engine tests, including the enforced decoupling
      deep/               the thorough run: properties and times
      reference/          frozen checksums and sample puzzles
```

Engine and app share one set of **strict compiler flags** (`tsconfig.base.json`:
`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`verbatimModuleSyntax` …). They differ only in what they may see: the engine
gets no DOM, so a stray `window` fails to compile.

The engine's folders are **layers with one direction**: `generation` may use
`solving`, `solving` may use `clues`, `clues` may use `core`, and nothing reaches
back. The benefit is not tidiness — whoever changes what a clue means knows for
sure they have not changed generation along with it.

The app is grouped **by feature**: a feature uses `shared/` but never another
feature (§14, U5).

### 8.1.1 The decoupling is enforced, not just claimed

While the engine was a package, `exports` in its manifest held the interface
together: nobody got at `solving/solve.js`. Within one project that protection
is gone — a relative import there would be technically fine and exactly what the
move was not meant to cost.

So the boundary is stated **twice**:

| Guard | When it applies |
|---|---|
| `no-restricted-imports` in `eslint.config.js` | while writing |
| `tests/boundary.test.ts` | even when someone skips the linter |

Both let through only `@engine` and `@engine/i18n` — in exactly that spelling,
so a search for `@engine` finds every user. The test proved itself on its first
run: it found three violations, one freshly brought in by the move.
`tests/boundary.test.ts` also enforces the feature boundaries of the app.

In addition, a test file reads the engine's source and proves:

| Check | Why |
|---|---|
| imports keep the layer direction | otherwise the structure falls apart quietly |
| no bare import except i18next | checked in code rather than claimed in a manifest |
| i18next only in `i18n/` | the core stays dependency-free |
| no DOM, no React, no Node modules | the same code in browser, worker and test |
| no `Math.random` | reproducibility (V6) |
| no clock except in `generate.ts` | `core` must stay deterministic |
| identifiers and comments in English | one language for the code |

This check proved itself: it found a real layer violation
(`clues/constrain.ts` reached for `solving`) that nobody had noticed reading.
The file then moved to `solving/propagate.ts` — it does not describe what a clue
*means*, but how to reason *with* it.

Another test generates a puzzle with a **foreign theme** the library does not
know.

Exchange between projects goes through a JSON document (§6.8) that
`parsePuzzle` validates completely before returning anything.

### 8.2 Screens

- **Start page** — the **calendar is the main thing**. Above it a single primary
  button for today's case, below it the random case and seed entry as extras.
  Before, a daily-case card, a curated case list and the seed field competed for
  the same attention. → **V2**
  - One month per page, seven columns, **week starting Monday**, paging back and
    forth down to the start day; after today is locked.
  - Four states per day: open, **started**, solved, locked. "Started" only reads
    *whether* a saved game exists — a calendar cell should not read and discard
    a whole save to draw a symbol.
  - The state shows twice: as the cell's fill (orange started, green solved) and
    as a large symbol; the border belongs to "today".
  - A thin bar shows the tier, in **colour and width**, so it stays readable
    without colour vision. Future days show it already: that Sunday will be the
    big case may be seen in advance.
  - Month and weekday names come from `Intl`, not from the resources.
- **Random case** — five buttons, one per tier, with the grid size as an extra.
  The size follows from the tier, so it is derived rather than chosen; for "very
  easy" the draw picks 5 or 6. The randomness comes from
  `crypto.getRandomValues`. If nothing can be generated for a drawn seed, it is
  redrawn up to three times — a **typed-in** seed, by contrast, is never
  replaced: whoever opens a particular case wants exactly that one. The address
  always shows the case currently being tried.
- **Game** — grid, cards, tools, hint, confirm, timer.
- **Resolution** — murderer, time, hints used, a link to share.
- **Rules and tutorial** — six steps, plus a rules page always within reach,
  with keywords and techniques.
- **Settings** — language, hold time, vibration, cell names.

### 8.3 Input

**Pencil notes.** A short tap on a cell sets the selected person's first letter
as a note — **top left** in the cell, as in Murdoku. Several notes in one cell
sit side by side and wrap if needed; they stay visible next to an X. Tapping
again with the same person removes the note.

**Playing by keyboard.** Up to plan v12, placing needed a pointer: hold,
double-click or right-click. Whoever cannot use a mouse could not play at all —
not with difficulty, not at all.

| Key | Effect |
|---|---|
| arrows | move the frame; at the edge it stops rather than wrapping |
| Home / End | to the start or end of the row |
| Enter / Space | place the selected person |
| `N` | add or remove a note |
| `X` | add or remove a mark |
| Delete / Backspace | clear the cell |
| comma / full stop | one person back or on |

**Modeless:** every key does one thing; you never need to know which tool is
active. The board is **one** tab stop — tabbing through a hundred cells on a
10×10 would be worse than no keyboard use at all. Verdict and hint sit in a
status region and are therefore announced, not only shown.

**Pointer by coordinates.** Which cell is meant is decided solely from the
pointer coordinates (`elementFromPoint`), never from the event target. Reason:
once the pointer is captured for dragging (`setPointerCapture`), every following
event targets the grid container rather than the cell beneath — a target-based
lookup then finds no cell on release, and exactly that is how the short tap
failed (VALIDATION.md, round 10).

**Room borders are always visible.** Every room is surrounded by a **thick black
line**; a thin one separates the cells inside. That is game information, not
decoration: almost every clue refers to rooms ("alone in the room", "in the same
room as"), and whoever cannot see the border cannot apply the clue.

The highlight under the mouse used to carry this job alone. That was a design
error: **phones have no hover**, and information only a mouse can reach is
missing for half the players (VALIDATION.md, round 15). The coloured highlight
on hover comes on top at a desk — it brightens the room under the pointer and
colours its name — but it replaces nothing.

Both stroke widths grow with the cell size and have a minimum, so that even in
the hardest case — 10×10 on a 360 px wide device, a cell ≈ 32 px — they stay
readable as **two different** widths. That is what matters: the room border must
differ from the cell grid, not merely exist.

Everything is drawn in **one** SVG above the floor, not as a shadow per cell. A
shared edge is drawn once instead of twice by halves, and the stroke width is
exactly the given one everywhere — with tile shadows it would be twice as thick
at room borders as at the board's edge. The lines lie above the props (a border
disappearing behind a cupboard makes a room look open where it is closed) and
below everything the player sets. They take no input.

Labels keep a fixed distance from the cell edge (half the wall plus 2 px): the
room name as a small sign cut to the room's width in its row, the person's
letter and the notes.

**Placing carries out the consequences.** Every row and every column holds
exactly one person. Once someone is placed, the rest of their row and column is
ruled out — the UI records that itself rather than leaving it to the player as
busywork (Murdoku does the same, §2, tutorial step 3):

- every other cell of the row and column gets an X,
- their notes go, since nobody can stand there any more,
- all notes of the placed person go, since they are fixed now,
- another person occupying the same row or column is taken off — otherwise the
  board would break the basic rule.

Undo reverts all of this in one step.

**Blocked cells take no input.** Nobody can stand on a blocking object (§3.2,
rule 3), so the grid ignores placing, notes and marks there entirely and answers
the attempt with a short red flash. The state cannot even become invalid — the
rule lives not only in the checking code but in the controls.

Touch: tap sets a note, hold (350 ms) places, drag paints notes. On desktop
also: double-click places, right-click sets an X, arrow keys with Enter and X.
Tools: X mark, eraser (holding clears everything), undo via a state stack. Hold
time and vibration are adjustable in the settings.

### 8.4 State and storage

A reducer holds placements, notes, X marks, the undo stack, timer and hint
counter. Each seed's game is saved in `localStorage` under
`indizio:v4:save:<seed>`, plus a progress index for the calendar. Everything
read back is checked against a schema; what does not match is dropped (§14, U7).

**The saved game is the session's initial state**, not something an effect
hands in later. Two effects — one loading, one writing back — made a race: the
writing one sees the state of the render that just finished, which on the first
pass is the empty board. In the browser it overwrote the loaded game before it
showed; the tests stayed green meanwhile.

The **seed stays the source of truth** — a save refers to it and never holds a
copy of the puzzle. So that resuming a 10×10 does not cost seconds every time
(§11, G6), the generated `core` is also cached under `indizio:v4:puzzle:<seed>`
and read back through `parsePuzzle`.

The prefix carries the version, because both can go stale at once: under
another generator version the same seed describes a different puzzle, and the
interchange format has other fields. Old entries are therefore not misread but
simply no longer found — yesterday's save disappears, a wrong puzzle never
appears.

On the step to generator 3 this was **forgotten**: the keys stayed at `v2` and
promised a version that was not true. Fixed, and a one-off run at start-up
clears the entries of earlier versions — they are never read again and take
hundreds of kilobytes after a few 10×10 puzzles.

### 8.4.1 Version number

Format `<year>.<number>`, for example `2026.5` — the fifth version this year.
It is in the footer of every screen.

**Deliberately not semver.** Semantic versions promise something about contracts
between programs; the engine has such users (§8.1, where semver would apply),
the game has people in front of a screen. For them "the fourth version this
year" is the more useful information.

The number is kept in **one** place, `package.json`; it is filled in at build
time. A second place would mean the two can drift apart — and a version number
you cannot believe is worse than none. So a test compares what the UI shows with
what is in the file.

It is counted up with `npm run bump`, restarting at one in a new year. The reset
is needed for the number to say something: "2027.58" would leave open whether 58
changes happened in one year or in five.

**Not tied to the build.** Builds also happen just to try things, and the game
does not change by that. The number should go up when someone changed something
— which only the person who changed it knows.

The footer knows its own height and passes it on as `FOOTER_PX`: the game screen
sizes the grid from the viewport and must know what takes space below the
board, or the footer would push the grid out of view.

### 8.5 Every device

One layout, two arrangements: from 900 px the cards stand left of the grid;
below that as a horizontally scrolling strip above it. The grid scales to
`min(available width, available height)` in steps of 8 px. Target devices
360 px to 1440 px, touch targets at least 44 px. → **V7**

Measured at 375×812:

| | |
|---|---|
| game screen 10×10 and 6×6 | page height **exactly 812**, no scrolling |
| game header | 44 px, one line |
| calendar cells | 44×44, no horizontal scrolling |

**Open point.** The height the game screen subtracts for everything but the
board is a constant. It already had to be adjusted by hand twice — first for the
footer, then for a third button in the header. A measured value would be more
honest than a number every UI change quietly makes wrong. The second time the
cause was a different one anyway: on a phone the **width** binds (347 against
414 free pixels), and a larger height deduction changed nothing. It was fixed by
not letting the header wrap and letting the title cut off if needed.

---

## 9. Delivery

`npm run build` produces purely static files that run on any web host, GitHub
Pages or Netlify. Service worker and manifest make the game playable offline
after the first load and addable to a phone's home screen. No backend, no
account, no data transfer. → **V7**

---

## 10. Milestones

| M | Content | Result |
|---|---|---|
| M0 ✓ | Vite + TS + React, Vitest, ESLint, folder skeleton | `npm run dev` runs |
| M1 ✓ | data model, themes, clue types, evaluator, i18n rendering, reference solver | clues can be checked and read in DE/EN |
| M2 ✓ | solver, difficulty measure, hint API, soundness tests | puzzles can be solved and rated by machine |
| M3 ✓ | generator, seed, worker, timing | reproducible puzzles of all five tiers |
| M4 ✓ (replaced) | first an atlas of CC0 pixel art, later replaced entirely by our own vector art (§7.5) | crime scenes are visible |
| M5 ✓ | game UI, input, tools, undo, confirm, persistence | **playable from here** |
| M6 ✓ (replaced) | catalogue with progress, hint UI, resolution screen | complete game loop |
| M7 ✓ | tutorial, timer, sharing, printing | feature-complete |
| M8 ✓ | complete i18n, responsive polish, PWA, acceptance run G1–G14 | acceptance criteria met |
| M9 ✓ | library reworked: English, layered, i18next, two rule levels, two-tier test suite (§8.1.1, §11) | maintainable and verifiable |
| M10 ✓ | drawings as replaceable files per theme (§7.0), room borders visible without a mouse (§8.3) | ready for final drawings |
| M11 ✓ | version `<year>.<number>` in the footer (§8.4.1) | every build has a name |
| M12 ✓ | "next to" never names the own standing object (§4.2.1), generator version 3 | clues say what is closest |
| M13 ✓ | props per footprint (§7.0), the selected person lights up on the grid (§3.1) | objects visibly take their place |
| M14 ✓ | engine back into the project behind two doors (§8.1), calendar instead of catalogue (§8.2), random case by tier, playable without a mouse (§8.3) | one project, one test run, a case every day |
| M15 ✓ | laid objects (§13): way of laying per theme, shape growth, quarter-tile sheet, carpet and mat switched, generator version 4, schema version 3 | carpets turn corners |
| M16 ✓ | rework (§14): strict tooling, features, react-i18next, one folder per theme, parsed storage, error codes, CSS modules, everything in English | simple, consistent, easy to extend |

Themes: car repair shop (car, shelf, workbench, oil stain, tyre stack …), flat
(sofa, kitchen unit, bed, carpet, bookshelf …), backyard garden (tree, flower
bed, garden chair, pond, shed …).

---

## 11. Acceptance criteria

Automated (Node, no browser) unless noted. Since the rework the criteria live in
the **test suite itself** rather than a separate acceptance script — there they
are checked with every change, not only when someone remembers to run the
acceptance run.

| Run | Command | Scope |
|---|---|---|
| quick | `npm test` | seconds; engine and app together, keeps the promises honest between two thorough runs |
| thorough | `npm run test:deep` | every grid size, hundreds of seeds, time budgets |
| before committing | `npm run verify` | type check of both projects, lint, formatting, all tests |

Two additions that did not exist before:

- **Property-based tests** (fast-check) generate their own cases instead of
  checking a handful of chosen seeds. Whatever fails comes back with the shrunk
  counterexample.
- **Frozen checksums** (`tests/engine/reference/`) pin G4 down over time: ten
  seeds with their checksum and two complete sample puzzles. If the generator
  changes unintentionally, the test fails; if it changes on purpose, the
  reference is rewritten with its own script and a raised `generatorVersion`.

| # | Criterion |
|---|---|
| G1 | 500 puzzles per tier: 100 % solved completely by the logic solver without case analysis |
| G2 | sample of 200 per tier: the reference solver confirms exactly one solution |
| G3 | 100 % of all clues given are true of the solution |
| G4 | same seed ⇒ byte-identical `core` JSON (without `meta`), 1000 repetitions across processes |
| G5 | 100 % of shipped puzzles meet both bounds of their tier from §5.4 (spread, indirect clues); puzzles outside the bounds are discarded, not relabelled |
| G6 | p95 generation time in the Node reference run: 5×5 < 100 ms, 7×7 < 400 ms, 8×8 < 300 ms, 9×9 < 1 s, 10×10 < 4 s. On mobile three times that, measured once for real on a mid-range phone in M8. Generation runs in the worker; the UI stays usable |
| G7 | solver soundness: 10,000 random states, every eliminated candidate confirmed impossible by the reference solver |
| G8 | 100 % of puzzles: the victim's room holds exactly two people |
| G9 | 100 % of puzzles: every row and every column holds exactly one person, none on a blocked cell |
| G10 | layout without horizontal scrolling at 360/390/768/1280 px, touch targets ≥ 44 px (browser check) |
| G11 | playable in flight mode after the first load; the puzzle is generated offline (browser check) |
| G12 | every UI text and every clue type exists in DE and EN; resource keys are typed and compared, missing or stray entries fail |
| G13 | no card clue breaks the restrictions of §4.2.1 (unique reference object, no victim named, no two-cycles, no "next to" the own standing object) |
| G14 | the hint never reads the player's board: runs with randomly altered boards give the same hint as the empty board |
| G15 | the engine's layer boundaries of §8.1.1 hold, checked in the source |
| G16 | every drawing the game asks for exists as a file — per theme, per kind, per footprint, none orphaned (§7.4) |
| G17 | the shown version has the format `<year>.<number>` and matches `package.json` (§8.4.1) |
| G18 | nobody outside `src/engine/` reaches past the two doors — checked in the source, in addition to the lint rule (§8.1.1) |
| G19 | every calendar day gives a seed of the tier its weekday prescribes and carries the current generator version (§6.1.1) |
| G20 | the keyboard frame stays on the board for every grid size and every key and does not wrap into the next row (§8.3) |
| G21 | 100 % of puzzles: every object is connected in the four-neighbourhood and lies entirely in its room; `fixed` objects are rectangles of an allowed footprint; `tiled` objects have `minCells` to `maxCells` cells and touch no instance of the same kind orthogonally; a laid anchor covers no other solution cell (§13.2, §13.3) |
| G22 | for all 256 neighbourhoods of a cell the quarter choice gives a quarter from the sheet, and two connected neighbours always meet edge to edge, never border to fill (§13.4) |
| G23 | data from outside (storage, worker, documents) is parsed, not cast; invalid entries are dropped, never half-applied (§14, U7) |
| G24 | everything but player-facing text is English — checked across the repository (§14, U4) |

---

## 12. Risks

| Risk | Counter-measure |
|---|---|
| clue search finds no guess-free assignment for 8×8 and up | **Happened and fixed** (VALIDATION.md, round 5). What worked: solution first, furniture second (§6.3); every object type anchors at most once; repair phase in the clue search (§6.6); more and smaller rooms (§6.2). Benchmark result: all five tiers generate, 0 failures, uniqueness confirmed by the reference solver |
| generation too slow on weak phones | worker with a time budget, measured in G6; a 30 s timeout reports a failure rather than hanging (§14, U8) |
| solver unsound, ambiguous puzzles slip through | reference solver as an independent checking authority, G2 and G7 |
| foreign art packs do not cover a theme | **Gone:** all drawings are our own vector art (§7), no package in the game any more |
| test suite checks only chosen seeds and misses rare cases | property-based tests generate their own cases (§11); the thorough run covers every grid size |
| i18next pulls a dependency into the core | only behind the `@engine/i18n` door; a test proves in the source that there is not a single bare import outside `i18n/` (§8.1.1) |
| without a package boundary the app eventually reaches across into the engine | two guards instead of an inherited boundary: lint rule while writing, test while checking (§8.1.1, G18) |
| the engine can no longer be published as a package | **Given up on purpose.** The app was the only user. The folder structure keeps a way back cheap: `src/engine/` is self-contained and reaches for nothing outside |
| large laid anchors make `ON_OBJECT` blunt, the clue search finds solutions less often | a laid anchor covers no other solution cell (§13.3); `maxCells` in the theme limits the area; G6 remeasured after M15 and passed |
| seams between quarters at odd pixel sizes | `cellPx` is a multiple of 8, so a quarter is whole pixels; a test holds that (§13.5) |
| the step to generator 4 empties progress, calendar history and settings | **accepted on purpose**, as on the step to 3 (§13.6) |
| German inflection in clues becomes clumsy | case forms per object in each theme's resources instead of gluing at runtime; every clue type rendered in tests |

---

## 13. Laid objects

Carpets, mats and later corridors on a spaceship used to exist only in fixed
footprints (`2x1`, `1x2`, `2x2` …). Now they take **any shape** inside a room:
turn corners, branch, cross, as an area or as a narrow runner. That is not tied
to particular objects but is a **way of laying** that every theme can choose per
object kind. → **V11**

The decisions below were made in an interview on 28 September 2026; each comes
with its reason, so it need not be negotiated again later.

### 13.1 What already fits and what does not

The data model carries free shapes already: `SceneObject.cells` is any set of
cells, and every clue computes per cell (§4). **The meaning of clues does not
change** — `ON_OBJECT`, `ADJACENT_OBJECT` (through the touch set in the same
room), `DIRECTION_OF_OBJECT` (every cell of the only instance) and
`ALIGNED_WITH_OBJECT` stay valid word for word. A long corridor makes
`ALIGNED_WITH_OBJECT` weaker; that is right, and the difficulty measure (§5.4)
captures it anyway.

Only three places depend on the rectangle: the generator (`positionsFor` in
`furnish.ts`), the renderer (one picture over the bounding box) and the drawing
scheme (one file per footprint, §7.0).

### 13.2 Shape: any polyomino, one area per instance

- A laid instance is a **connected set of cells** in the four-neighbourhood,
  entirely within **one** room — like rooms themselves (§6.2). Cells touching
  diagonally are not connected. Areas are explicitly allowed, not only
  one-cell-wide runners: otherwise the way of laying could not express the old
  `2x2` carpet, and one object kind would need two systems.
- **Connected is what belongs to the same instance.** No edges are stored; a
  cell's connection to its neighbour follows solely from whether the neighbour
  belongs to the instance.
- **Two instances of the same kind never touch orthogonally.** Otherwise two
  carpets would look like one, and "next to exactly two carpets" would hinge on a
  seam nobody sees at 24 px. Diagonal is allowed. Different kinds may meet; they
  look different.

### 13.3 Theme: the way of laying

`ThemeObject.footprints` became a union; every object kind has **exactly one**
way of laying, so it is clear which set of drawings it needs:

```ts
placement:
  | { kind: 'fixed'; footprints: readonly (readonly [number, number])[] }
  | { kind: 'tiled';
      minCells: number;     // ≥ 1
      maxCells: number;     // ≥ minCells
      compactness: number;  // 0 … 1: 0 = only runners and branches, 1 = areas
      straightness: number; // 0 … 1: tendency to keep growing in the same direction
    }
```

Switched over are **`carpet`** (flat) and **`mat`** (car repair shop). `pond`
and `sandbox` stay `fixed`: each stands in exactly one room with
`maxPerScene: 1` and would take needlessly large areas as anchors. A spaceship
theme with corridors is a plan of its own; it needs nothing but the way of
laying.

Guide values:

| Kind | `minCells` | `maxCells` | `compactness` | `straightness` |
|---|---|---|---|---|
| carpet | 2 | 6 | 0.7 | 0.3 |
| mat | 1 | 4 | 0.4 | 0.5 |
| corridor (later) | 3 | 10 | 0 | 0.8 |

**Shape growth** (in `furnish.ts`, next to `positionsFor`): start in one cell,
then add one cell from the rim at a time until a rolled target size from
`minCells … maxCells` is reached or no rim cell fits. A shape below `minCells` is
discarded.

- A rim cell with exactly one neighbour in the shape weighs 1; one with *k* ≥ 2
  neighbours weighs `compactness · k`. At `compactness` 0 the shape therefore
  grows as a tree — corners, T-pieces and crossings, but no rings and no areas.
  That is intended.
- If a rim cell continues the direction its neighbour grew in, its weight is
  multiplied by `1 + 3 · straightness`.
- Candidates are collected in ascending cell order before the seeded `Rng`
  draws — otherwise the result would depend on a `Set`'s insertion order and G4
  would fail.
- A rim cell is only allowed if it lies in the room, is free and touches no
  instance of the same kind orthogonally.

**Rules in the generator** (§6.3 still applies, plus):

- *Anchor underfoot.* `anchorUnderfoot` grows a laid kind from the solution cell.
  The shape may then cover **no other solution cell** — otherwise "on the carpet"
  would be true of several people and the clue would be blunt. For filler the
  usual rule applies: walkable objects may lie on solution cells.
- *Anchor beside.* `anchorBeside` still takes only `fixed` objects of `1x1`. A
  blocking laid shape bordering a person counts through `ADJACENT_OBJECT` anyway.
- *Blocking.* The way of laying is independent of `walkable`. A blocking laid
  shape never grows onto a solution cell, and its cells count against the 40 %
  limit per room.
- *Density.* `addFiller` still counts objects, not cells; `maxCells` limits the
  area. `maxPerScene` counts instances.

### 13.4 Drawing scheme: one quarter-tile sheet per kind

Every laid kind has **one** file, `art/themes/<theme>/tiles/<key>.svg`, falling
back to `art/common/tiles/<key>.svg`. The folder of its own is also a kind of
drawing of its own (`ArtKind 'tiles'`): `objects/carpet.svg` already means "one
file for every footprint", and a forgotten change would otherwise quietly draw
the sheet as a distorted rectangle.

The sheet is `viewBox="0 0 48 72"`, so 2 × 3 cells, and follows the well-known
autotile layout (RPG Maker A2), in quarters of 12 × 12:

```
        x: 0     12    24    36    48
y:  0   ┌───────────┬───────────┐
        │  single   │   inner   │   row 0: preview on the left (single cell),
        │   cell    │  corners  │   the four inner corners on the right
   24   ├─────┬─────┼─────┬─────┤
        │ ┌NW │ ─N  │ N─  │ NE┐ │
   36   ├─────┼─────┼─────┼─────┤
        │ │W  │ ··  │ ··  │  E│ │   rows 1–2: a 2×2 block —
   48   ├─────┼─────┼─────┼─────┤   outer corners, edges, fill
        │ │W  │ ··  │ ··  │  E│ │
   60   ├─────┼─────┼─────┼─────┤
        │ └SW │ ─S  │ S─  │ SE┘ │
   72   └─────┴─────┴─────┴─────┘
```

Every cell on the board consists of four quarters. Which quarter it gets depends
only on the two neighbours that quarter borders (one vertical, one horizontal)
and on the diagonal between them:

| vertical | horizontal | diagonal | quarter |
|---|---|---|---|
| missing | missing | – | outer corner |
| missing | present | – | horizontal edge |
| present | missing | – | vertical edge |
| present | present | missing | inner corner |
| present | present | present | fill |

**A quarter always comes from the same position in the sheet** as it takes on
the board: a cell's north-west quarter comes from a top-left quarter position of
the sheet. For the north-west position that means:

| Case | Source (x, y) |
|---|---|
| outer corner | 0, 24 |
| horizontal edge | 24, 24 |
| vertical edge | 0, 48 |
| fill | 24, 48 |
| inner corner | 24, 0 |

The other three positions follow: for east the source comes from the right half
of its cell (outer corner and vertical edge at x = 36, horizontal edge and fill
at x = 12, inner corner at x = 36), for south from the lower half (outer corner
and horizontal edge at y = 60, vertical edge and fill at y = 36, inner corner at
y = 12). The single cell top left is never used on the board — a lone cell is
made of the four outer corners — and serves as the preview in the rules and in
overviews.

So **every** shape can be drawn: all 47 distinguishable neighbourhoods, runners
one cell wide, crossings, areas with inner corners. Nothing is rotated; the
drawing's light and perspective stay right. An artist draws one sheet instead of
47 tiles.

Requirements for the sheet, in addition to §7.0:

- Edges and fill run **seamlessly** across quarter boundaries: whatever ends at
  an open side of a quarter must fit the opposite open side of every other
  quarter.
- Outside, as for fixed props, keep one or two units of **air to the cell
  edge** so the floor stays visible as a frame; on connected sides the drawing
  runs up to the edge.

**Placeholder** (`scripts/build-art.ts`): a plate in the symbol's colour over the
2×2 block, inset by 2 units with rounded outer corners; top right a full area
with four small notches at the corners as inner corners; top left the symbol on
a single plate.

### 13.5 Rendering

- A pure function `quarterTiles(cells, size)` in
  `src/app/features/game/board/tiles.ts`: returns per cell the four source
  positions in the sheet and the open outer edges. No DOM dependency, fully
  testable (G22).
- A component `TiledObject`: four quarters per cell as elements with the sheet as
  background (`background-size: 2·cellPx × 3·cellPx`, `background-position` from
  `quarterTiles`).
- The walkable/blocking tint goes **cell by cell**, the inner edge only along the
  outer edges of the same mask — over the whole bounding box it would colour the
  gap of an L-shape too.
- `Grid.tsx` branches on `object.placement`; fixed objects stay as they were.
- `cellPx` is a multiple of 8 (`boardCellPx` in `tiles.ts`), so a quarter is
  whole pixels without a sub-pixel seam. A test holds that.
- The quarter logic belongs to the app, not the engine: the engine knows no
  drawings (§8.1.1).

### 13.6 Format and versions

- `SceneObject` got `placement: 'fixed' | 'tiled'`. That keeps the document
  self-describing (§6.8, V9): a foreign theme can bring laid objects via JSON
  without the app knowing its catalogue. `schemaVersion` went to **3**;
  `parsePuzzle` reads documents without the field as `fixed`.
- `parsePuzzle` additionally checks, collecting every problem as before: cells of
  every instance connected and within room `roomId`, `fixed` objects
  rectangular, `tiled` instances of one kind not touching orthogonally.
- `generatorVersion` went to **4**; the reference in `tests/engine/reference/`
  was rewritten with `scripts/write-reference.ts`.
- Storage followed (`VERSION = 'v4'` in `store.ts`). **Progress, calendar
  history, saved games and settings start afresh with it** — as on the step to 3.
  That was decided on purpose; carrying progress over was considered and
  rejected.

### 13.7 Implementation

Five steps, **each green on its own** under `npm run verify`:

1. **Engine.** The `placement` union in `themes/types.ts`, all three themes
   rewritten to `{ kind: 'fixed', … }` (no laid kind yet). Shape growth and the
   rules of §13.3 in `furnish.ts`. Set `SceneObject.placement`. Theme validation
   (parameters within their bounds) and the invariants of G21 in
   `tests/engine/support/invariants.ts`. Property test: shape growth with random
   parameters yields only allowed shapes.
2. **Format.** `SCHEMA_VERSION` 3, default when reading, shape checks in
   `document.ts`, cases in `tests/engine/io.test.ts` (old document without the
   field, torn shape, touching instances, non-rectangular `fixed`).
3. **Drawings.** `ArtKind 'tiles'` in `art.ts`, placeholder sheet in
   `build-art.ts`, `art.test.ts`: one sheet with `viewBox="0 0 48 72"` per
   `tiled` kind, still one file per footprint per `fixed` kind.
4. **App.** `quarterTiles` with tests (G22), `TiledObject`, per-cell tint, a test
   for whole-pixel quarters.
5. **Switch-over.** `carpet` and `mat` to `tiled` with the guide values of §13.3,
   `GENERATOR_VERSION` 4, reference rewritten, storage `v4`, `npm run art`.
   `npm run test:deep` and G6 remeasured.

Step 1 turned out not to change the random draws: the frozen checksums stayed
the same until step 2 added the new field.

### 13.8 Deliberately not part of this plan

- **Tile variants** against a wallpaper look on large areas. Possible later
  without breaking anything: a wider sheet (`0 0 96 72`) whose second column
  carries another fill, chosen by a hash of the cell number as for floors
  (§7.3). A 48 × 72 sheet stays valid.
- A **spaceship theme** with corridors.
- **Rings** at `compactness` 0; a runner around an obstacle only comes from
  higher compactness.
- Laid shapes **across room borders**.

---

## 14. Rework: structure, i18n, quality, English

The game is not released yet; nothing has to stay backwards compatible. The aim
of the rework: a simple, consistent structure that is easy to maintain and in
which a new theme is one folder. The decisions were made in an interview on
28 September 2026.

### 14.1 Decisions

| # | Decision | Reason |
|---|---|---|
| U1 | The engine ↔ app boundary stays (§8.1.1) | It keeps the engine testable and fit for the worker; the problem was not the boundary but a theme spread over five places |
| U2 | A theme = a folder `src/engine/content/themes/<key>/` with `theme.ts` (rooms with their floor) and its own resource files; `FLOOR_BY_ROOM` in the app goes | A new theme is a folder and one line of registration; a test checks every theme for completeness |
| U3 | react-i18next, **one** i18next instance, also used by the engine; namespaces `ui`, `help`, `puzzle`; resources as TypeScript with checked keys; first language from the browser | A misspelt key becomes a compile error; no more `locale` prop through every component |
| U4 | Everything in English: code, tests, scripts, CSS, lint messages **and all documents** including PLAN.md and VALIDATION.md | One language for everything that is not game text |
| U5 | The app grouped by feature (`features/…`, `shared/…`), functional rather than class-based; a feature uses `shared/`, never another feature | Everything about a feature lies together; classes only where they sensibly encapsulate state |
| U6 | Strict linting for everything (`strictTypeChecked`, `stylisticTypeChecked`, `react`, `react-hooks`, `jsx-a11y`), Prettier, `CODING_GUIDELINES.md` | What a tool can check is not only written in a document |
| U7 | Data from outside is checked by **valibot** (app only); cached puzzles by `parsePuzzle`; invalid data is dropped and replaced by the default | Schema = type, the two cannot drift apart; the engine stays dependency-free |
| U8 | Engine errors carry a fixed **code**, the app translates it; worker with a time limit and `messageerror`; error boundaries around the app and the game screen; technical detail folded away; no error tracking | A readable message instead of raw text or a white page |
| U9 | CSS modules next to the components, shared values as tokens in `shared/styles/tokens.css`; no Tailwind | Collisions like the doubly used `.tile` class are ruled out mechanically; one styling system rather than two |
| U10 | Puzzles stay **byte for byte the same**; the frozen checksums are the safety net; `GENERATOR_VERSION` stays 4 | No backwards compatibility does not mean behaviour may change unnoticed |
| U11 | One branch from `main`, one commit per phase, each phase green on its own, one PR at the end | Phases move files the next one touches again |

### 14.2 Phases

1. **Tooling:** Prettier, strict lint rules for the app, `CODING_GUIDELINES.md`.
2. **Structure:** the app ordered by feature — moving only, no logic.
3. **i18n:** react-i18next, one instance, checked keys, browser language.
4. **Themes:** one folder per theme with floors and resources, completeness test.
5. **Robustness:** valibot, `parsePuzzle` for the cache, error codes, error
   boundaries, worker time limit.
6. **CSS:** CSS modules and tokens.
7. **English:** remaining code, tests, scripts and every document.

### 14.3 How it turned out

All seven phases are done; the frozen checksums never changed. Where the result
differs from the decisions above:

- **Help is shared, not a feature.** Rules and tutorial open from the start page
  and the game screen, so they live in `shared/help/`.
- **Feature boundaries are enforced by a test only.** Imports inside the app are
  relative, and the lint rule cannot tell a feature folder from them;
  `tests/boundary.test.ts` checks the direction instead.
- **The compiler got stricter too.** The app now compiles under the engine's
  flags (`tsconfig.base.json`); only the engine is denied the DOM.
- **CSS class names are typed.** With `noPropertyAccessFromIndexSignature`, Vite's
  loose module types would have made every `styles.x` an error, so
  `scripts/css-types.ts` writes a declaration per module; a misspelt class is a
  compile error, and a test keeps the declarations current.
- **Theme texts are namespaced per theme.** Room and object keys only need to be
  unique within their theme; `roomName`, `objectName` and the clue scene take the
  theme key. `additionalResources` went: a custom theme brings its own texts.
- **i18next 26 and react-i18next 17.** No backwards compatibility needed, so the
  current versions.
- **The hint is stored as structure**, so a language switch re-renders it.
- **English is checked across the repository** (`tests/language.test.ts`);
  German is allowed only in the German resources, the frozen reference data, the
  page title and manifest, and in tests that check German output.
