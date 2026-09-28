# Review log for the development plan

The plan was held against a fixed checklist in rounds. Every round records the
errors found and the correction. The first rounds ended when a complete round
went through without a new finding; since then every larger rework adds another
round.

The review log is history: it records what was true and decided at the time.
Paths and names in older rounds are the ones that existed then; the current
state is in [PLAN.md](PLAN.md).

Rounds 1 to 4 are paper reviews of the plan against the checklist. Round 5 came
from implementation: two assumptions of the plan did not survive measurement
and were corrected. Round 7 came from the acceptance run and playing through in
the browser. Round 14 is the first in which not a person reviews the code but
the code itself: all four findings came from new tests.

| Round | Kind | Findings |
|---|---|---|
| 1–3 | paper review of the plan | 15 |
| 4 | paper review, no finding | 0 |
| 5 | measurement on the running generator | 2 |
| 6 | paper review after correction | 0 |
| 7 | acceptance run and playing through | 2 |
| 8 | final review | 0 |
| 9 | fixes from play | 3 |
| 10 | pointer controls and room borders | 1 |
| 11 | rework: library and room shapes | 3 |
| 12 | vector drawings, placing with consequences | 1 |
| 13 | floors | 0 |
| 14 | library rework, checked by the new test suite | 4 |
| 15 | drawings as files, room borders for every device | 3 |
| 16 | version number in the footer | 1 |
| 17 | reported clue error (disproved), cards and marks | 1 |
| 18 | "next to" never names what someone stands on | 3 |
| 19 | props per footprint, selected person on the grid | 0 |
| 20 | engine into the project, calendar, play without a mouse | 9 |

---

## Checklist

### A — Requirements of the brief

| # | Check |
|---|---|
| A1 | exactly one suspect per column and per row |
| A2 | suspects with descriptions on the left |
| A3 | difficulty rises with the number of suspects |
| A4 | puzzles are randomly generated |
| A5 | crime scenes contain different rooms |
| A6 | the description of every suspect is generated along and fits the solution |
| A7 | all assets newly made, in pixel art |
| A8 | free assets from the web researched and used where needed |
| A9 | generation by seed, puzzles reproducible |
| A10 | runs in the browser on desktop and phone |
| A11 | Murdoku's documentation and tutorial read and evaluated in full |

### B — Game concept (from Murdoku's documentation, tutorial and FAQ)

| # | Check |
|---|---|
| B1 | the victim is a card on the grid and counts as a person |
| B2 | the murderer was alone with the victim in the same area |
| B3 | "next to" = orthogonal **and** in the same room |
| B4 | "alone" includes the victim |
| B5 | clues are true without exception |
| B6 | exactly one valid solution |
| B7 | solvable without guessing, purely by deduction |
| B8 | portraits never matter for the solution |
| B9 | large objects cover several cells; a person occupies one of them |
| B10 | blocking objects cannot be occupied |
| B11 | quantities only when explicit ("exactly one shelf") |
| B12 | the three advanced techniques are covered by the solver |
| B13 | grid size equals the number of suspects, 5×5 to 10×10, five tiers |

### C — Internal consistency of the plan

| # | Check |
|---|---|
| C1 | every clue type has an unambiguous, decidable meaning |
| C2 | every clue type has a solver rule |
| C3 | every acceptance criterion is measurable and can in principle be met |
| C4 | difficulty tiers do not overlap |
| C5 | determinism holds across every source of randomness |
| C6 | no mechanism undoes a deliberate decision |
| C7 | every file named in the plan has a milestone |
| C8 | no requirement without a section, no section without a purpose |

---

## Round 1 — 9 findings

**B1-1 — C4 violated: difficulty tiers overlapped.**
"Very easy: 5×5, 6×6, maxRule ≤ R2" and "Easy: 6×6, 7×7, maxRule ≤ R2" described
the same puzzles. A 6×6 with maxRule R2 would have fitted both tiers, so
criterion G5 ("reaches the required tier") could not be decided at all.
*Correction:* §5.4 rewritten — grid size is the primary, non-overlapping key
(5–6 / 7 / 8 / 9 / 10); maxRule and step counts are additional upper and lower
bounds. Puzzles outside the bounds are discarded rather than relabelled.

**B1-2 — C3 violated: G4 could never be met.**
The puzzle object held `stats.ms`, a runtime measurement. At the same time G4
demanded byte-identical JSON for the same seed. Both together are impossible.
*Correction:* §6.8 separates `core` (deterministic, the basis of G4) and `meta`
(`ms`, `generatedAt`). `attempts` stays in `core`, since the attempt counter
follows deterministically from the seed.

**B1-3 — C1 violated: `DIR_OF_OBJECT` was ambiguous.**
"west of every cell of an instance of this type" leaves open which instance is
meant once the type occurs more than once. The rendered sentence "west of the
shelf" would have been indeterminate — a breach of B5, since a clue can only be
true if it makes a statement.
*Correction:* §4.2 and a new §4.2.1 — the type is only allowed when exactly one
instance stands on the grid. Existential types (`ON_OBJECT`, `ADJACENT_OBJECT`,
`ALIGNED_WITH_OBJECT`) are not affected, since they quantify over all instances
explicitly.

**B1-4 — C6 violated: the hint system undid the binary feedback.**
The hint was to start from the player's current board and report a "dead end"
on a contradiction. You could then place a figure, ask for a hint and learn
whether the placement was wrong — exactly the behaviour the decision "only right
or wrong, without giving anything away" ruled out.
*Correction:* §5.5 — the hint always runs on the empty starting state and shows
the first step of the canonical chain of deductions whose result is not yet on
the board. Player mistakes are never commented on. A new acceptance criterion
G14 checks this with altered boards.

**B1-5 — B2 at risk: `ALONE_WITH` could give the murderer away directly.**
A card clue "was alone with the victim" would have named the murderer and made
the whole deduction pointless.
*Correction:* §4.2.1 — no card clue names the victim in `SAME_ROOM_AS` or
`ALONE_WITH`. Purely geometric references to the victim (`DIR_OF_SUSPECT`,
`DIAGONAL_OF`) stay allowed, since they say nothing about who is in which room.

**B1-6 — B12 incomplete: the description of R2 stopped before the conclusion.**
"A row with exactly one possible cell ⇒ someone stands there" achieves nothing on
its own — the elimination comes from that cell's column being used up too.
Murdoku's technique 1 was only half covered.
*Correction:* §5.2 — R2 as four spelled-out deductions, including the column
conclusion.

**B1-7 — C3 violated: "Expert: R4, many steps" was no checkable threshold.**
G5 demands a 100 % hit rate; "many" is not measurable.
*Correction:* §5.4 — expert requires maxRule = R4 and R3 + R4 together ≥ 4
steps.

**B1-8 — C3 vague: G6 named no reference device.**
"p95 < 3 s" without saying what it is measured on cannot be checked.
*Correction:* §11 — a Node reference run on the development machine with
5×5 < 100 ms and 10×10 < 1 s, three times that as the mobile budget, measured once
for real in M8.

**B1-9 — A7/A8 unresolved contradiction in the brief itself.**
"Make all assets new" and "use free assets from the web" exclude each other
literally. The plan silently assumed a resolution.
*Correction:* §7 — stated explicitly: no asset is taken from Murdoku; everything
visible is put together anew for Indizio, partly from CC0 collections, partly
drawn ourselves.

---

## Round 2 — 3 findings (consequences of round 1)

**B2-1 — C6: the hint could point at an occupied cell.**
After correction B1-4 the hint works on the empty state. So it can name a cell on
which another figure already stands. The plan said nothing about what happens
then — pushing it off automatically would again have been an error signal.
*Correction:* §5.5 — the hint places nothing; it highlights the cell and names
the reason; clearing is up to the player.

**B2-2 — C1: `EMPTY_ROOM` and `ROOM_COUNT` overlapped at n = 0.**
For the same fact the generator could have output two different clue types with
different tier availability — so the tier assignment could have been bypassed.
*Correction:* §4.4 — `ROOM_COUNT` restricted to n ≥ 1, `EMPTY_ROOM` is the
special case n = 0; at most one global clue per room.

**B2-3 — C1: "stronger clue" in the clue search was undefined.**
The search strategy in §6.6 relied on a term the plan never defined — so the
procedure was neither implementable nor reproducible.
*Correction:* §6.6 — clue strength is the number of cells the clue alone, on the
empty starting state, removes from its subject's candidate set; computed once per
candidate and therefore reproducible.

---

## Round 3 — 3 findings

**B3-1 — B9/C1: objects could be larger than their room.**
The object catalogue knew footprints up to 2×3, the room split allowed rooms from
2×2. The plan did not say what happens when something does not fit.
*Correction:* §6.3 — if the footprint does not fit, the object is not offered for
that room at all. Also clarified that the percentage limits are mere pre-filters
and only the feasibility check of §6.4 is binding.

**B3-2 — C7: the catalogue had no origin.**
§8.2 promised a list of puzzles by tier, but nowhere said where the curated seeds
come from. Without that, the requirement "rising difficulty" would not have
become visible.
*Correction:* §8.2 and §8.1 — `scripts/curate.ts` writes the versioned catalogue
file from generated candidates with a clean tier assignment.

**B3-3 — C1: room names could run out at K = 5 rooms.**
The number of rooms rises with the grid size to five, but the plan demanded no
minimum number of names from a theme.
*Correction:* §6.2 — every theme provides at least five room names, checked by a
test.

---

## Round 4 — no findings (paper review complete)

All 32 checks were held against the corrected plan again. The errors found in
rounds 1 to 3 are fixed; no new contradictions appeared. That completes the
review.

### Mapping of checks to the plan

| Check | Satisfied in |
|---|---|
| A1 | §3.2 rule 2, §5.2 R2, G9 |
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
| B1 | §3.2 rule 1, §4.1, §4.3 |
| B2 | §3.2 rule 4, §4.3, §6.5, G8 |
| B3 | §4.1 |
| B4 | §4.1, §4.2 `ALONE` |
| B5 | §4.1, §6.6 final step, G3 |
| B6 | §5.3, G2 |
| B7 | §5.2, §5.3, G1 |
| B8 | §7 portraits |
| B9 | §6.3, §6.8 `objects.cells` |
| B10 | §3.2 rule 3, §5.1, G9 |
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
| C8 | §1, this table |

---

## Round 5 — 2 findings from implementation (measurement instead of paper)

Rounds 1 to 4 could only check whether the plan was consistent in itself. Two
assumptions could only be checked on the running generator — and both were
wrong. The basis is some 26,000 generated crime scenes over all five tiers and
three themes.

### B5-1 — §6.3/§6.5: the order "furnish first, then search for a solution" is useless

The plan meant to place objects at random and then search for a solution by
matching. Measured success rate of the clue search:

| Grid | 6×6 | 7×7 | 8×8 | 9×9 | 10×10 |
|---|---|---|---|---|---|
| solvable puzzles per scene | 8 % | 3 % | **0 %** | **0 %** | **0 %** |

From 8×8 up **not a single** solvable puzzle came out. Cause: people keep landing
on cells with no sharp clue — the best available clue was then "in room X" for a
room of 30 cells.

*Correction:* §6.3 reversed. The solution is fixed first, then the crime scene is
furnished around it: every solution cell gets an anchor (a walkable object on it
or a blocking one next to it), and **every object type serves as an anchor at
most once**. The latter was a surprising finding of its own: when three people
all got the clue "on a chair", the puzzle was not hard but **ambiguous** — the
three can be swapped among each other. In addition more and smaller rooms (§6.2,
K up to 7 instead of 5) and a repair phase in the clue search (§6.6), which gives
the last people still symmetric a different clue.

Result after the correction, 15 puzzles per tier:

| Tier | generated | failures | p50 | p95 | unique | false clues |
|---|---|---|---|---|---|---|
| very easy | 15 | 0 | 6 ms | 18 ms | 8/8 | 0 |
| easy | 15 | 0 | 21 ms | 180 ms | 8/8 | 0 |
| medium | 15 | 0 | 40 ms | 83 ms | 8/8 | 0 |
| hard | 15 | 0 | 72 ms | 413 ms | 8/8 | 0 |
| expert | 15 | 0 | 241 ms | 2335 ms | 8/8 | 0 |

### B5-2 — §5.4: rule depth as a lower bound is practically unreachable

The plan demanded that "medium" need R3 at least once and "hard" R4 at least
once. Measured on solvable puzzles:

| Grid | maxRule = R2 | maxRule = R3 | maxRule = R4 |
|---|---|---|---|
| 5×5 – 7×7 | 100 % | 0 % | 0 % |
| 8×8 | 96.5 % | 3.5 % | 0 % |
| 9×9 | 94 % | 6 % | 0 % |
| 10×10 | 100 % | 0 % | 0 % |

With one clue per card the permutation logic (R2) is so strong that it almost
always suffices alone. R4 occurred in **not a single** measurement. The required
lower bound would have made the tiers medium to expert impossible to generate —
and so emptied requirement A3 ("rising difficulty").

*Correction:* §5.4 switched to two **measured** figures that really do grow with
the grid size, with rule depth as an upper bound:

| Grid | spread p10/p50/p90 | indirect clues p10/p50/p90 |
|---|---|---|
| 5×5 | 3.6 / 4.6 / 5.6 | 0 / 0 / 1 |
| 6×6 | 4.2 / 5.3 / 6.5 | 0 / 0 / 1 |
| 7×7 | 4.7 / 6.7 / 9.9 | 0 / 1 / 2 |
| 8×8 | 6.0 / 8.1 / 10.9 | 1 / 2 / 4 |
| 9×9 | 6.0 / 8.9 / 13.0 | 2 / 3 / 4 |
| 10×10 | 6.6 / 11.7 / 17.3 | 2 / 3 / 5 |

The bounds in §5.4 lie near the p10 value each: strict enough to reject
degenerate puzzles, reachable enough to keep generation fast. Both figures rise
monotonically with the tier, can be checked by machine and are stored in the
puzzle core (`difficultyProof`), so G5 stays objectively decidable.

### Plan sections updated

§3.2 rule 5, §4.4 (number of global clues), §5.4, §6.2, §6.3, §6.4, §6.5, §6.6,
§6.8 (`difficultyProof`), §11 G5 and G6, §12 risk table.

### Round 6 — no findings

The checklist was held completely against plan v4. The corrections of round 5
are in; no new contradictions appeared.

---

## Round 7 — 2 findings from the acceptance run

The acceptance run (`npm run acceptance`) checks the finished code against the
criteria of PLAN.md §11. It found two things neither the paper review nor the
measurement in round 5 could show.

### B7-1 — G13: the two-cycle rule was never enforced

§4.2.1 demands that two cards do not point at each other — A may not carry "west
of B" while B carries "east of A". The rule was in the plan, but neither the
enumeration nor the clue search checked it. The acceptance run found the
violation in **1 of 200** puzzles.

*Correction:* a new file `src/core/clues/restrictions.ts` with
`clueRestrictionViolations` as the single source of truth for all three
restrictions of §4.2.1. The generator discards violating puzzles before output;
the acceptance run and unit tests use the same function. Result: 200/200 clean.

### B7-2 — The victim's card could not be selected in the UI

The plan says explicitly in §3.2 that the victim is a card like any other and is
placed too. The card component had it set to `disabled`, however — so the puzzle
**could never be finished**, because "Confirm" requires all N placements. Found
while playing through in the browser, not by a test.

*Correction:* the victim's card can be selected like any other; only its look
stays set apart. Replayed: place all six people, confirm, resolution with the
correct murderer.

### Result of the acceptance run

| Criterion | Result |
|---|---|
| G1 solvable without case analysis | 200/200 |
| G2 reference solver confirms exactly one solution | 40/40 |
| G3 all clues true | 200/200 |
| G4a same seed, same process | 60/60 |
| G4b same seed, second process | identical |
| G5 tier bounds kept | 200/200 |
| G6 p95 generation time | vl 16 ms, l 273 ms, m 128 ms, s 517 ms, x 2968 ms — all within budget |
| G7 solver soundness | 264/264 |
| G8 victim's room with exactly two people | 200/200 |
| G9 permutation and free cells | 200/200 |
| G12 resource files complete | DE and EN |
| G13 restrictions of §4.2.1 | 200/200 |
| G14 hint ignores the player's board | 200/200 |
| generation failures | 0 |

**G10 (layout from 360 px)** was checked in the browser: at 360, 390, 768 and
1280 px no horizontal scrolling, all controls at least 44 px. Two layout errors
came up and were fixed: the horizontal card strip pushed the page wider than the
screen (missing `min-width: 0` on the grid children), and the game header did not
wrap on narrow devices.

**G11 (offline)** is prepared — service worker and manifest are served correctly
(`text/javascript`, HTTP 200) — but could not be completed in the embedded test
browser, which refuses to register service workers. The proof in a normal
browser is still outstanding.

### Round 8 — no findings

The checklist was held completely against the corrected state again. 40 unit
and integration tests green, acceptance run without a violation.

---

## Round 9 — 2 fixes and 1 follow-up finding

Two improvements from play, plus a finding only the acceptance run brought up
afterwards.

### B9-1 — Notes sat in the middle rather than top left

Murdoku puts the first letter **top left** in the cell, so several notes fit side
by side and the view of object and X stays clear. Indizio centred them and hid
them as soon as an X was set — with several candidates per cell the cell became
unreadable.

*Correction:* notes sit top left, wrap to the right with several entries, scale
with the cell size and stay visible next to an X. Replayed in the browser: three
notes A, B, C in one cell, offset 3 px from the left and 1 px from the top.

### B9-2 — The UI allowed placing on blocked cells

PLAN.md §3.2 rule 3 has said since the first version that suspects never stand on
blocking object cells. The generator keeps to that (G9: 200/200), but **the UI
did not check it at all**: by holding or double-clicking, a person could be put
on a table or a cupboard. The puzzle was then unsolvable without the game saying
so — and "Confirm" must not reveal which person is wrong.

*Correction:* the grid now knows the blocked cells and ignores placing, notes,
painting and marks there entirely; a short red flash answers the attempt. The
walkability list was also checked and fixed in §6.3: only things you could
sensibly stand or sit on. One object turned out misclassified — the **toolbox**
was walkable and is now blocking. A new test enforces the list in both
directions.

### B9-3 — A single walkability flag broke the time budget

After the toolbox became blocking, the tier "hard" broke its time budget: p95
rose from 517 ms to **1214 ms** against a budget of 1000 ms.

The cause is a coupling the plan did not show: since **every object type serves
as an anchor at most once** (§6.3), the number of *different* walkable types of a
theme decides how many solution cells can get a strong "stands on" clue. The
garage theme fell from four to three such types and had to fall back to weaker
neighbour anchors more often.

*Correction:* two sensible standing surfaces added to the car repair shop —
**mat** and **pallet**, both newly drawn. So every one of the three themes has
five walkable types. Result: "hard" back at p95 530 ms, all 16 criteria green.
The dependency is now documented in §6.3 so it does not surprise again with the
next theme.

### Result

42 tests green (two new ones on walkability), acceptance run 16 of 16: vl 18 ms,
l 248 ms, m 113 ms, s 530 ms, x 3149 ms — all within budget.

---

## Round 10 — 1 finding and 1 addition

### B10-1 — A short tap set no note (pointer capture)

The gesture "a short tap sets a pencil note" did not work with a real mouse. The
cause was an interaction the earlier test could not hit:

On press the grid captures the pointer (`setPointerCapture`), so that dragging
keeps delivering events even outside the board. But exactly that redirects every
following event to the **container** — on release the event target is no longer
the cell but the grid surface. The target-based lookup
(`event.target.closest('[data-cell]')`) therefore found no cell, and the tap
branch was never reached. Holding kept working because it still knows the cell
from the press — the error affected only the short tap.

**Why no test found it:** the check in round 9 fired events directly on the
cell. With a synthetic pointer the capture does not apply, so the target stayed
the cell and everything seemed right. The test checked the mechanism, but not
the condition under which it breaks.

*Correction:* the cell is now decided solely from the pointer coordinates
(`elementFromPoint`), independent of the event target. The real condition was
replayed: press on the cell, release on the container. Result: the note is set,
a second tap removes it again, three suspects give `A B C` in one cell.

A second inaccuracy came up along the way: when dragging, the **start cell** was
not painted, only the cells touched afterwards. Also fixed — a stroke over three
cells now carries the note on all three.

### B10-2 — New: room borders under the mouse

Almost every clue refers to rooms ("was in the living room", "was alone", "in
the same area"), but the room borders were only visible as a subtle change of
colour. Now an outline highlights the area under the pointer and colours its
name.

The outline lies as its own layer above the objects, so furniture does not hide
it, and takes no input itself. On touch devices it is dropped via
`@media (hover: none)`.

Replayed: the outline matches the room rectangles exactly (bedroom 216×216 px,
kitchen 216×432 px at 72 px cells), changes correctly while moving across and
disappears on leaving the grid.

### Result

42 tests green, build clean. Both changes affect only the UI; generator, solver
and acceptance criteria stay untouched.

---

## Round 11 — rework: library and room shapes

Two structural changes, plus the findings from securing them.

### New checks

| # | Check |
|---|---|
| A12 | generator and solver are a decoupled library, usable in other projects without changes |
| A13 | exchange as a structured JSON object |
| A14 | rooms need not be rectangular: corridors and L shapes as in real buildings |

### B11-1 — Decoupling was claimed, not checked

`src/core` was free of React and DOM, but nothing stopped anyone from breaking
that — and nobody would have noticed.

*Implementation:* a package of its own, `@indizio/puzzle`, with its own
`package.json`, build and test suite. On top, **enforced** checks rather than
assurances: no import leaves the package folder, no runtime dependencies, no
DOM, no React, no Node module, no `Math.random` outside the random generator,
`Date.now` only in measurement and time budget, and everything needed at the
main entry. The sharpest test generates a complete puzzle with a **foreign
theme** ("spaceship") the library does not know — exactly the case another
project needs.

For that two hidden couplings had to go: `parseSeed` checked the theme key
against the bundled registry, and `generatePuzzle` fetched the theme from there
directly. Both now take the allowed themes as an argument.

### B11-2 — The check itself had three false alarms

The decoupling check fired where nothing was wrong — three times in a row, each
time for a different reason:

1. The pattern `\bdocument\.` matched the module path `'./document.js'`.
2. A line filter for import statements let **multi-line** export blocks through
   whose last line reads `} from './document.js';`.
3. After all strings were removed, the check for foreign modules hit the code
   example in the file's comment — `from '@indizio/puzzle'` in the JSDoc.

*Correction:* strings are emptied for the search for API use, comments are
removed before the search for import paths, and foreign modules are checked on
the import paths rather than the file body. A good example that a check needs
checking itself: all three false alarms would have blocked the build without a
real problem.

### B11-3 — Cell-by-cell reshaping made noise instead of floor plans

For non-rectangular rooms the first approach let single border cells wander
between neighbouring rooms. That did give formally irregular rooms (93 %), but
looked wrong: frayed edges, single cells as fingers, rooms reaching into each
other. No building looks like that.

*Correction:* instead of single cells, **rectangular bites** of up to 3 × 3
cells are moved. That gives straight walls and so exactly the shapes buildings
have — L shapes, T shapes, alcoves. At the same time the rounds were cut from
1.6 per cell to 1.2 per edge length: few but effective moves. Result: a good
80 % not rectangular, plus narrow corridors, and the floor plans read as
buildings.

### Unexpected side result: generation became faster

| Tier | p95 before | p95 after |
|---|---|---|
| very easy | 18 ms | 15 ms |
| easy | 248 ms | 85 ms |
| medium | 113 ms | 113 ms |
| hard | 530 ms | 313 ms |
| **expert** | **3149 ms** | **1286 ms** |

Irregular rooms are no cost for the generator but a gain: corridors and L shapes
produce more rooms of different sizes, and that makes `IN_ROOM`, `ALONE` and
`ROOM_COUNT` sharper. At 10×10 the time more than halved.

### What had to follow

`Room` now carries `cells` plus `bounds` instead of four flat rectangle fields —
the cell set is the truth, the rectangle only the hull. Affected were: object
placement (every cell of a footprint must really belong to the room), role
assignment, serialisation, document checks (new: rooms must be connected) and
the whole rendering. The grid now draws floors and walls cell by cell: a wall
appears where the neighbour belongs to another room. The room highlight follows
the same principle and draws the outline from single edge pieces — so it carries
any shape.

The old, random furnishing (`placeObjects`) was removed without replacement: it
had been dead since the order was reversed (round 5) and assumed rectangular
rooms.

### Result

| | |
|---|---|
| library tests | 70 green, 7 of them on enforced decoupling and 6 on room shapes |
| app tests | 1 green (catalogue) |
| acceptance run | 16 of 16 |
| rooms not rectangular | over 80 % |
| library builds on its own | `npm run build:lib` produces `dist/` with type declarations |

---

## Round 12 — new drawings, placing with consequences

### New checks

| # | Check |
|---|---|
| A15 | placing sets row and column to X automatically and clears the placed person's marks |
| A16 | all drawings deleted and made anew as freely scalable SVG |
| A17 | style clear and simple, figures stylised and without faces, but clearly distinguishable |

### B12-1 — Placing allowed a board against the rules

The basic rule is: one person per row and column. But the UI allowed two people
in the same row — a board that breaks the rule without the game being allowed to
say so, since "Confirm" must not give anything away.

*Correction:* on placing, the UI now carries out all consequences: row and
column get an X, the notes made void by that go, all notes of the placed person
disappear, and a person occupying the same line is taken off. Undo reverts all of
it in one step. Seven new tests cover this, including the check that the correct
solution can be placed completely without contradiction.

### B12-2 — A stale module cache looked like a code error

After the raster drawings were deleted, the development server kept reporting
"does not provide an export named 'Sprite'" — although type check and production
build ran clean and the file demonstrably contains the export. The cause was the
module graph of the running Vite server, which still knew the deleted files; a
reload in the browser did not help, because the error sat on the server side.

*Lesson for checking:* an error only the development server shows, and neither
the type check nor the production build, is first a suspicion against the
server, not the code. Server restarted and `node_modules/.vite` cleared —
afterwards 49 vector drawings without errors, no empty shape, no raster image
left in the document.

### What was dropped without replacement

Sprite atlas and raster images with their pipeline: `public/atlas.png`,
`src/app/render/atlas.ts`, `ownSprites.ts`, `palette.ts`,
`scripts/build-atlas.ts`, `preview-atlas.ts`, `zoom.ts`, `build-icons.ts`, the
PNG icons and the CC0 source packs under `assets-src/`. With that the dependency
`pngjs` goes too, and licence bookkeeping is no longer needed — there are no
foreign drawings any more.

### Proof

| | |
|---|---|
| vector drawings | 30 props, 14 figures, 8 icons, 1 app icon |
| raster images in the document | 0 |
| empty shapes | 0 |
| tests | 70 library + 12 app (7 on placing, 4 on drawing completeness) |
| automatic X marks in the browser | 10 at 6×6, all on the row or column |

**Not checked:** what the new drawings *look* like. No screenshots are possible
in this environment, and an SVG cannot be rasterised here. Structure,
completeness and freedom from errors are shown; the design judgement is still
outstanding. The overview sheet of all shapes is attached.

---

## Round 13 — floors

### A18 — Floor tiles with fitting drawings

Up to here the floors were flat colour areas, counted through by room id. That
was arbitrary: colour 3 said nothing about the room.

*Implementation:* ten floorings as vector tiles — boards, tiles, slabs, screed,
carpet, lawn, soil, gravel, sand, water. They are assigned by the **room name**,
not the id: tiles in the bathroom, grass on the lawn, screed in the workshop.
That contributes to the game rather than only decorating it — almost every clue
refers to rooms, and a recognisable floor makes the room borders clear without
reading up.

Three design decisions that follow from the interplay:

1. **Muted tones.** Figures and props are strongly coloured; a naturalistically
   bright lawn would have taken their contrast away.
2. **Continuous tiles.** Joints and board ends lie so that they meet at the
   edges — otherwise the floor would visibly fall apart into squares.
3. **Scatter from the cell index.** Blades, pebbles and joints sit differently
   per cell, so the pattern does not repeat. Since the scatter depends only on
   the index, the same cell always looks the same — a test holds that.

If two neighbouring rooms lie on the same flooring, a tiny step of brightness per
room separates them.

### Proof

| Theme | Rooms and their floors |
|---|---|
| repair shop | wash bay tiles, reception slabs, workshop + store screed, office carpet |
| flat | kitchen tiles, living room + hall + study boards, bedroom carpet |
| garden | pond bank water, terrace slabs, shed yard gravel, vegetable patch + greenhouse soil |

Four new tests: every room of every theme has a flooring of its own (the fallback
to screed is only meant for foreign themes), every flooring can be drawn, the
same cell always gives the same pattern, and the brightness steps really are
different. Confirmed in the browser across all three themes: 64 of 64 tiles with
a drawing.

**Again not checked:** what it looks like. The overview sheet of the floorings
is attached.

---

## Round 14 — library rework

The library was reworked completely: English as the only language in the
source, a layered structure, i18next instead of a home-grown solution, plus a
test suite that no longer merely claims the project's promises but checks them.

This round differs from the earlier ones. Earlier rounds checked the plan against
a list. Here the **code checked itself**: the new tests found four things nobody
had noticed while reading.

### New checks

| # | Check |
|---|---|
| A19 | comments, variables, methods and classes of the library are English |
| A20 | the structure is leaner and easier to maintain, not merely different |
| A21 | i18n runs through an established library |
| A22 | the test suite proves correctness **and plausibility** of the generated puzzles |

### B14-1 — Two rule levels were unreachable code

The solver had four rule levels: clue propagation (R1), permutation rules (R2),
group exclusion (R3) and intersection elimination (R4). R3 and R4 were cleanly
written, tested and listed in the documentation as the upper bound of
difficulty.

A measurement over 60 generated puzzles of all tiers showed: **neither fired a
single time.** Nor is that chance; it follows necessarily from the design — for
time reasons the clue search checks solvability only with R1 and R2, so no
puzzle that needs more can ever be shipped.

*Correction:* both levels removed, some 250 lines. `RuleLevel` shrinks from
`1|2|3|4` to `1|2`, `difficultyProof` from five fields to three (`maxRule` and
`stepsByRule` had become constants). The interchange format therefore goes to
`schemaVersion: 2`, the generator version to `2`.

The side effect matters more than the lines saved: the clue search now
demonstrably computes with the same rule set that later carries the player.
Before, that was an assumption.

### B14-2 — A real layer violation, found by the layer test

The new structure orders the code in layers with one direction:
`generation → solving → clues → core`. A test reads the imports and enforces it.

On the first run `clues/constrain.ts` failed: the file reached for `solving`. Not
a typo, but a wrong placement — it does not describe what a clue *means*, but
how to reason *with* it over candidate sets.

*Correction:* file moved to `solving/propagate.ts`. That is exactly where the
check pays off: nobody reading the file had ever seen it as misplaced.

### B14-3 — Hand-kept cache invalidation as a silent source of errors

The solver's room view (which people can stand in which room) is expensive and
was cached. The cache was invalidated through a helper wrapped by hand around
every mutating operation in **20 places**.

That is the dangerous kind of error: whoever adds a new operation and forgets the
wrapper gets no crash and no test failure but **a wrong answer** — the solver
then eliminates a candidate that was still possible, and the puzzle becomes
unsolvable or ambiguous.

*Correction:* the candidate state keeps a change counter. The cache checks it and
recomputes when it has moved. Nothing can be forgotten any more, because there
is nothing left to do.

### B14-4 — A promise in a test was simply untrue

A new test claimed the measured spread grows monotonically from tier to tier. It
failed: "hard" measured 8.86, "medium" 10.03.

Remeasuring with 24 puzzles per tier shows that the **means** do rise (4.78 →
7.49 → 8.85 → 10.99 → 12.10), but the spread within a tier lies at 0.9 to 2.95.
Neighbouring tiers therefore necessarily overlap in small samples. The test was
worded too strongly; the generator was not broken.

*Correction:* the test now checks what actually holds and what the game needs —
the bounds rise from tier to tier, over the full range the measurement rises
too, and **every single** puzzle meets the bound of the tier it claims. A test
that is occasionally red for no reason gets ignored; that would have been the
more expensive error.

### Further findings without a number

- **Dead code:** `potential.ts` and `splitClues` were called nowhere.
- **Mutable output parameter:** the clue search reported its reason for failure
  through a writable object. Replaced by a discriminated result the compiler can
  check.
- **Quadratic loop in the floor plan:** the cell → room mapping was rebuilt for
  every cell of a corridor. Now incremental.
- **Five unchecked array accesses**, made visible only by the stricter compiler
  switch `noUncheckedIndexedAccess`.
- **False alarms of the checks themselves:** the English and platform check fired
  on comments and module paths; the i18n check took the correct English sentence
  "…of the room." for a leftover key. As in round 11: a check needs checking
  itself.

### Proof

| | Before | After |
|---|---|---|
| library tests | 70 | 159 quick + 17 thorough |
| app tests | 16 | 16 |
| property-based tests | 0 | 8 quick + 5 thorough (fast-check) |
| frozen checksums | 0 | 10 seeds + 2 complete sample puzzles |
| enforced layer boundaries | no | yes |
| rule levels | 4 (2 unreachable) | 2 |
| fields in `difficultyProof` | 5 | 3 |
| type errors / lint errors | 0 / 0 | 0 / 0 |

**Generation time** (Node, 25 seeds each; expert also measured with 60):

| Tier | before mean / p95 | after mean / p95 |
|---|---|---|
| very easy | 8 ms / 21 ms | 5 ms / 15 ms |
| easy | 26 ms / 52 ms | 16 ms / 32 ms |
| medium | 37 ms / 118 ms | 39 ms / 94 ms |
| hard | 80 ms / 192 ms | 96 ms / 221 ms |
| expert | 223 ms / 720 ms | 193 ms / 863 ms |

The rework was not aimed at speed; the figures show it cost none. The p95 values
for expert vary a lot, because single unlucky seeds need many attempts — the
median there is 91 ms.

Played through in the browser across all three themes: the puzzle is generated,
clues appear in German via i18next, placing sets the X marks, confirm and
resolution work, no message in the console.

**Not checked:** whether the library is as convenient to use in a *foreign*
project as its interface suggests. The test with a foreign theme and the missing
runtime dependencies show that it works technically; judging the handling is up
to whoever integrates it.

---

## Round 15 — drawings as files, room borders for everyone

Two changes from play, plus a finding only the switch-over made visible.

### New checks

| # | Check |
|---|---|
| A23 | every drawing exists as its own SVG file and can be replaced without a code change |
| A24 | generation happens only during development, never in the running game |
| A25 | every theme has its own drawing set following its theme definition |
| A26 | room borders are recognisable without a mouse |

### B15-1 — Room borders existed only for the mouse

The borders were hinted at as a thin shadow per tile; they only became clearly
visible when the pointer was over the room.

A phone has no pointer. So exactly the information almost every clue refers to —
"alone in the room", "in the same room as" — was missing there. The game was
complete at a desk and incomplete on the device it was explicitly built for.

*Implementation:* every room **always** gets a thick black line, a thin stroke
separates the cells inside. Both widths grow with the cell size and have a
minimum, so that even at 10×10 on 360 px they stay readable as two different
widths — that is what matters, not the absolute thickness. The highlight under
the mouse stays as an extra at a desk.

Everything is drawn in **one** SVG instead of as a shadow per tile. The old way
drew every shared edge twice by halves, which made a room border twice as thick
as the board's edge — with a thin line nobody notices, with a thick one at once.

### B15-2 — The drawings were stuck inside the program

All shapes stood as JSX in the app's source. For placeholders that was
convenient, but for the planned swap for final drawings it was the wrong place:
every new drawing would have been a code change, with compile and review, rather
than a file swap.

*Implementation:* `npm run art` writes every shape as a stand-alone SVG file to
`art/`, ordered by theme. The app only loads files now. The drawing instructions
live in `scripts/art/`, outside the app — once the final drawings exist, the
folder can go without replacement.

Two decisions hang on this:

1. **Embed at build time, do not load at runtime.** The files sit in the bundle
   instead of behind one request each. That keeps the offline promise (G11)
   without the service worker's help and saves 70 requests.
2. **A marker in every generated file.** If it is missing, the file comes from
   someone else and is not overwritten. Without this lock a thoughtless
   `npm run art` would have deleted an illustrator's work — exactly the case the
   whole switch-over works towards.

### B15-3 — `carpet` was two things, and the game did not know it

At first the drawings were found by file name alone; the folder (`objects`,
`floors`, …) counted as order for the eye.

But in the flat **both** are called `carpet`: the rug someone stands on and the
bedroom's fitted carpet. The file read last won — and half the room got a prop
laid out as its floor. In the browser it was visible at once: twenty orange
rectangles where a calm fitted carpet should lie.

*Correction:* the **kind** of drawing belongs to the key, not only its name.
`artUrl('floors', 'carpet', 'flat')` and `artUrl('objects', 'carpet', 'flat')`
are two different things, and callers say which they mean.

Notable is what it was *not* down to: the file was there, the test "every object
has a file" green, the test "no file without a use" too. Both checked the files,
not the lookup. A test checks that now.

### Further findings without a number

- **Scatter value went negative.** The floor tiles scattered blades and pebbles
  via `h >> n` — a signed shift. For every second value the result was negative
  and the blades landed left of the tile. The error was already in the old
  version and never showed, because each cell scattered anew and enough blades
  happened to lie in view. Fixed with `>>>`, and a test now looks for negative
  **absolute** coordinates.
- **Scatter replaced by mirroring.** As a file there is exactly one image per
  flooring. Against visible repetition the app mirrors the tile per cell — but
  only for lawn, soil, gravel and sand, where nothing runs over the edge. Joints,
  board ends and waves would otherwise be cut at the seam.
- **UI icons are now called `ui-x` instead of `ui.x`.** A dot in the name gives
  a file `ui.x.svg` that looks like a mistake.

### Proof

| | Before | After |
|---|---|---|
| drawings in the app's source | 62 shapes as JSX | 0 |
| drawings as files | 0 | 70 |
| themes with their own set | 0 | 3 |
| app tests | 16 | 27 |
| bundle (raw / gzip) | 280.2 kB / 86.9 kB | 298.9 kB / 88.0 kB |

The growth is the price for the files lying in the bundle: 70 drawings cost
18.7 kB raw and 1.1 kB after compression — less than 70 single requests would
cost, and available offline without further ado.

Checked in the browser across all three themes: props, figures, icons and floors
appear from the files, the room borders are clearly visible at 5×5 as at 10×10,
at 375 px width as at a desk, the hover highlight follows L- and U-shaped rooms
exactly, placing and the automatic X marks work unchanged, no message in the
console.

**Not checked:** what the game looks like with *final* drawings. That a swap
works technically is shown by the structure and the tests; the design judgement
is still outstanding.

---

## Round 16 — version number

One addition, one finding from implementing it.

### New check

| # | Check |
|---|---|
| A27 | the game shows a version number `<year>.<number>` that counts up with changes |

### B16-1 — The footer shrank the catalogue to half width

So that the footer stays at the bottom even with short content, `#root` became a
flex column and the screen inside it a grid — the usual move.

Afterwards the catalogue in the browser was 517 instead of 1009 pixels wide and
sat in the middle of the page. Reason: `.catalog` and `.game` centre themselves
via `margin: 0 auto`, and **automatic margins switch off stretching in grid as in
flexbox**. The element then gets its content width instead of the full column.

*Correction:* the screen stays an ordinary block; only `#root` is a flex column.
So that the loading screen still fills the area above the footer, it computes
it: `min-height: calc(100dvh - var(--footer-h))` instead of `height: 100%` — a
percentage would need a fixed reference height that does not exist here.

The finding is typical of the kind of error no test finds: nothing crashed,
nothing was computed wrongly, it only looked wrong. Found in the browser,
measured via `getBoundingClientRect`.

### Fixed along the way

- **The board would have pushed itself out of view.** The game screen computes
  the grid size from the viewport, not from a measurement. Everything taking
  space below the board must therefore be subtracted — the footer passes its
  height on as `FOOTER_PX` for that. Measured: 10×10 on 375×812 now fits the page
  without scrolling (827 → 812 px), because the old bottom spacing could at the
  same time go from 40 to 16 px: the footer now does that job.

### Decisions

**No semver.** `2026.4` means: the fourth version from this year. Semantic
versions promise something about contracts between programs — the library has
such users and therefore keeps semver, the game has people in front of a screen.

**One source.** The number is in `package.json` and is filled in at build time.
A second place would mean the two can drift apart, and a version number you
cannot believe is worse than none. A test compares what the UI shows with what
is in the file.

Checked beforehand whether npm accepts a non-semantic `version` field at all:
`npm install --dry-run` and `npm run` go through with it. Otherwise a second file
would have been needed.

**Not tied to the build.** Builds also happen just to try things, and the game
does not change by that. `npm run bump` is a call of its own, because only the
person knows whether they changed something.

### Proof

| | |
|---|---|
| display | footer on every screen: catalogue, loading, error, game |
| format | `<year>.<number>`, checked against `/^\d{4}\.\d+$/` |
| agreement | shown number = `package.json`, compared in a test |
| new year | `2026.57` → `2027.1`, pinned in a test |
| counting | `2026.9` → `2026.10`, `2026.99` → `2026.100` — as a number, not as text |
| rejected inputs | `0.1.0`, `2026`, `v2026.1`, `2026.`, `26.1`, empty |
| `npm run bump` | checked on a copy: `2026.1 → 2026.2 → 2026.3`, `--show` changes nothing, only the file's version line is touched |
| app tests | 27 → 35 |

The starting value is **2026.1** — the first version with a version number.

---

## Round 17 — reported error and two improvements to the cards

### M17-1 — "Next to a chair" although she sat on it: **not an error**

Reported for the daily case `v2-garage-6-vl-u8iyn8`: Nadja carries the clue "She
was next to a chair", but according to the solution stands **on** the chair.

Replayed and recomputed step by step:

| | |
|---|---|
| Nadja's cell | 21 |
| chair on the grid | cell 21 — the same |
| touch set of the cell | 20, 21, 27 (own cell plus neighbours in the same room) |
| chair instances touched | 1 |
| clue holds | yes |
| full check | `deducible`, `cluesTrue`, `unique: yes`, no objection |

The **touch set includes the own cell** (§4.1). That is not carelessness but
Murdoku's explicit rule from the FAQ: "Whoever sits on a chair is also next to a
chair." It is stated word for word in the game's own guide, under *keywords →
next to*.

More important than faithfulness to the rules is that the solver uses the
**same** definition. If it did not, the puzzle would be ambiguous or unsolvable —
the uniqueness check would report either. It reports nothing.

So the clue is true and the puzzle correct. What rightly stands out: it is
**weaker than necessary**. The clue search weakens on purpose as long as the
puzzle stays solvable (§6.6) — "sat on a chair" becomes "next to a chair", and
exactly that makes the tier. Whether the search should skip this one step is a
game decision and not an error; it could be done with a restriction in the clue
search and would make puzzles easier.

### V17-1 — Marks carry the first letter of the name

Until now the suspects got A, B, C … by their order. Whoever saw a "D" on the
board had to count down the list to find out who that is.

*Implementation:* the first letter of the name. Nadja is "N".

That only holds as long as the first letters differ. The name pool satisfies it
(24 names, 24 different letters), but nowhere did it say it must — **a new name
could have broken it silently**, and two equal marks make a solvable puzzle look
unsolvable. Hence secured twice: a library test pins the pool, and the UI
lengthens colliding marks as far as needed to tell them apart ("Marek" and
"Marta" separate only at the fourth letter).

### V17-2 — The victim comes last in the list

It is the only card with nothing to investigate; in the middle of the row it
interrupts the list of suspects.

*Side finding:* the card with id 0 used to be preselected. Measured over 120
puzzles, the victim is id 0 in **21 of 120 cases** (18 %) — there the
preselection would have sat right at the bottom after the change, while the eye
starts at the top. The initial selection now skips the victim explicitly.

Both changes are **pure presentation**. The id stays the index into solution,
placements and notes — a test checks that the reordered list loses or duplicates
nobody.

### Side finding: the development server showed the old number

The version number is filled in when the Vite configuration is loaded.
`package.json` was read with `fs` — so for Vite it was no dependency of the
configuration, and after `npm run bump` the browser kept the old number until
someone restarted the server by hand. Exactly the kind of inaccuracy that makes a
version number worthless.

*Correction:* the configuration **imports** `package.json` instead of reading
it. Vite then takes it into the configuration's dependency graph and restarts by
itself. Replayed: `npm run bump` to 2026.3, without further action the footer
showed 2026.3. Then set back to 2026.2 — the jump was the proof of the mechanism
and not a change to the game.

### Proof

| | |
|---|---|
| app tests | 35 → 44 |
| library tests | 159 → 162 (name pool) |
| in the browser | `v2-garage-6-vl-u8iyn8`: marks U/O/J/N/P/T, Tamara last; Nadja on cell 21 shows "N", Urs's note shows "U" |
| victim with id 0 | `v2-flat-6-vl-3ux`: Lucia is the last card, Emilio is preselected |
| phone 375 px | card strip in the same order |

**Not changed:** the rule from M17-1. Whether "next to" should include the own
cell is a decision about the game, not about the code.

---

## Round 18 — "next to" never names what someone stands on

Round 17 examined the reported case and showed it to follow the rules. The
client then decided to change the clue search anyway. Implementing it brought up
three more findings.

### The decision

The touch set includes the own cell, so "next to a chair" is true while sitting
on it. But true is not the same as fair.

Decisive was a look into our own code: **`ALIGNED_WITH_OBJECT` has always
skipped the instance underfoot** — with the comment "would make the clue
trivially true". The same reasoning had never been applied to
`ADJACENT_OBJECT`. So it was not a matter of taste but an inconsistency.

*Implementation:* `ADJACENT_OBJECT` is not even offered for an object type the
subject stands on. The **rule stays unchanged** — "next to" still includes the
own cell, the solver computes the same, the game guide stays right. What changed
is only which sentences the clue search picks up.

Secured twice: the clue selection does not offer such sentences, and
`verifyPuzzle` rejects a puzzle that contains one anyway. For that the
restriction check now needs the solution — without it "stands on it" cannot be
determined.

### Consequences that belong to it

**Generator version 2 → 3.** The same string now produces a different puzzle, so
the seed has to say so. All links of the form `v2-…` no longer work — exactly as
intended (§6.1), because a link that shows something other than promised is
worse than one that honestly stops working. The catalogue was regenerated (30 of
30), the frozen reference data as well. The library is at 2.0.0, since a public
signature changed too.

That the case was frequent is shown by the switch-over itself: **the stored
expert sample from version 2 failed the new check.** It was not an isolated
observation by the client.

### B18-1 — The reference script wrote to the wrong folder

`write-reference.ts` created its files relative to the **working directory**.
Called from the project root, a second folder `tests/reference/` appeared in the
root, while the tests kept reading the old data from the package.

The treacherous part: the script reported success ("checksums: 10 | samples: 2"),
and the tests kept failing — with the same message as before. Without a look at
the files' modification time the search would have gone in the wrong direction.

*Correction:* the script anchors its paths at its own file. Plus an npm script
`reference` in the package, so the call does not depend on the directory, and an
output naming the target folder.

### B18-2 — The refusal of old links was factually wrong

Whoever opened a `v2` link read: "No puzzle could be generated for this seed",
below it in English "Seed was made by generator version 2, this is version 3".
Both unsatisfying — generation did not fail, it rightly never took place, and
the reason was in the wrong language.

Before this round nobody ever saw it: the generator version had never changed.
The change made the path reachable in the first place.

*Correction:* the app recognises the foreign version from the string before the
worker starts, and says in the player's language what is going on.

### B18-3 — The sample seed in the input field had been wrong since version 2

The field "Own seed" showed `e.g. v1-garage-6-vl-k3f9tq` — a sample the app
itself would have rejected. Overlooked at the last version change.

*Correction:* the sample is built from `GENERATOR_VERSION` and can no longer go
stale. A test additionally checks that the catalogue contains only seeds of the
current version.

### A swallowed escape sequence, twice

While writing the version check, `/^v(\d+)-/` became `/^v(d+)-/` when the file
was generated — a pattern that never matches. The screen looked as before,
nothing failed. The same error happened shortly afterwards in the test meant to
catch it. Both times noticed in the browser, both times fixed; the test now pins
the expression.

### Proof

| | Before | After |
|---|---|---|
| library tests | 162 | 165 |
| app tests | 44 | 52 |
| thorough run | 179 | 183 |
| generator version | 2 | 3 |
| library version | 1.0.0 | 2.0.0 |

**Generation** (25 seeds each, smaller clue pool):

| Tier | mean | p95 | attempts per puzzle | failures |
|---|---|---|---|---|
| very easy | 4 ms | 11 ms | 0.7 | 0 |
| easy | 11 ms | 22 ms | 0.8 | 0 |
| medium | 30 ms | 79 ms | 1.0 | 0 |
| hard | 59 ms | 171 ms | 1.4 | 0 |
| expert | 141 ms | 393 ms | 2.2 | 0 |

The smaller clue pool costs nothing: no failures, times of the same order as
before. The tier bounds hold unchanged, no puzzle slips below its bar.

Checked in the browser: the daily case `v3-garage-6-vl-u8iyn8` now says "Dana sat
on a chair" instead of "next to a chair", Brigitte "was on an oil stain", and
Oskar stands on a car and is "next to an oil stain" — so still "next to" where it
applies. The old link `v2-garage-6-vl-u8iyn8` is refused with a reason in the
player's language.

---

## Round 19 — props per footprint, selected person on the grid

### V19-1 — One drawing per footprint instead of one per object

Until now there was **one** 24×24 drawing per prop. But a bed covers two cells
side by side one time and two stacked the next, a kitchen unit three. For a
square drawing there were only two bad ways to show that: stretch it or put it
small in the middle. The renderer did the latter — a three-cell kitchen unit was
a small symbol in a large empty box.

*Implementation:* the file name carries the footprint in cells, width by height:
`bed_2x1.svg`, `bed_1x2.svg`, `kitchenunit_3x1.svg`. The canvas grows along — 24
per cell — and the renderer lays the file over exactly those cells. So a bed
across is **no longer a rotated bed lengthwise** but a drawing of its own.

54 variants across three themes, 32 old files replaced. Which exist is decided
by the library's theme definition alone; a test compares both and also checks
that the canvas fits the footprint.

**The placeholders are not drawn one by one.** 54 variants by hand would be work
for images that get replaced anyway. Instead the generator puts the existing
symbol on a plate the size of the footprint. So the placeholder shows both —
**how much space** the object takes and **which** it is — and openly looks like
a placeholder. The plate takes the tone of the symbol's first shape: crude, but
it makes a workbench brown and a pond blue without a second list that can go
stale.

Two details that hung on this:

- **Inset by two units.** The tile below shows by its colour whether someone may
  stand on the object. A plate filling edge to edge would have hidden that.
- **`object-fit: contain` on every drawing.** If a replaced file does not fit its
  footprint exactly, there is air at the edges instead of a squashed table.

Props outside the grid needed a name with a footprint: the theme pictures in the
catalogue (`car_2x2`, `bed_2x2`, `tree_1x1`) and the tutorial picture
(`bush_1x1`). Without that they would have stayed empty — the test over all
tutorial pictures would have reported it.

### V19-2 — The selected person lights up on the grid

Whoever selects a card now sees at once where this person already stands and
where they were suspected: the placement **and** pencil notes of this person are
highlighted in colour.

On a full 10×10 grid there are otherwise a dozen identical-looking letters side
by side, and you search for your own. The notes matter as much as the
placement: they are the information "I suspected them here once", which until
then lived only in memory.

### Proof

| | Before | After |
|---|---|---|
| drawing files | 70 | 92 |
| of which props | 32 | 54 |
| app tests | 54 | 58 |
| bundle (raw / gzip) | 300.4 kB / 88.5 kB | 319.9 kB / 89.5 kB |

Checked in the browser on `v3-flat-8-m-1h8s`: 14 objects, all resolved, none
without a drawing. The image sizes follow the footprint — 48×24 for `2x1`, 24×48
for `1x2` — and so do the canvases. Selecting Brigitte lights up her two notes,
Yara's placement stays unchanged; switching to Yara reverses it.

**A slip of my own:** the first measurement of the highlight still read the old
stylesheet and reported the notes in turquoise instead of the new colour. Only a
full reload showed the true state. The classes were right from the start — I
nearly "fixed" a colour that was never wrong.

---

## Round 20 — engine into the project, calendar instead of catalogue, play without a mouse

The largest rework since round 14, and in a sense its reversal: the library that
was split out of the app there comes back — but with a boundary that is stated
this time rather than inherited. On top, a calendar replaces the curated case
list, and the game can be played without a mouse.

**Nine findings, four of them built in by myself and found again in the
browser.**

### V20-1 — The package boundary went, and with it the protection

`packages/puzzle/` moved to `src/engine/`, 30 call sites now point at `@engine`
or `@engine/i18n`. With that the `exports` clause disappeared, which until then
stopped anyone from reaching for `solving/solve.js`.

The replacement is two guards (§8.1.1): a lint rule that applies while writing,
and `tests/boundary.test.ts`, which applies even when someone skips the linter.
**On its first run the test reported three violations — one of them I had built
in myself ten minutes earlier**, by pointing `write-reference.ts` at a relative
path instead of the door during the move.

A second finding came up along the way: the library ran under **stricter compiler
switches** than the app. A shared `tsconfig.json` would have defused the engine.
There are two now.

### V20-2 — The app's first lint: 21 findings, 17 of them misleading

The app had never been linted. Of the 21 findings, 17 were the same:
`no-unnecessary-type-assertion` on array accesses like
`parts[parts.length - 1]!`. These assertions are only "unnecessary" because the
app had `noUncheckedIndexedAccess` off — in the engine the same lines would be
required.

Instead of switching the rule off, the cost of the switch was measured: **a
single error.** So it was switched on. The 17 assertions are required again, and
the rule keeps its teeth.

The remaining four were real: a promise passed to `onClick`, two state updates
in effects, a pointless `void`.

### V20-3 — A ref during render, and the saved game was gone

While fixing one of these state updates, `restored` was switched from
`useState` to `useRef` — **and saving broke.** The writing effect sees the state
of the render that just finished, and on the first pass that is the empty board.
It overwrote the loaded game before it became visible.

The tests stayed green meanwhile. It only showed when a figure was placed in the
browser and the page reloaded.

It was not rolled back: the saved game is now the session's **initial state**
(§8.4). No flag, no race, one render fewer — and the `restore` action in the
reducer is gone without replacement.

A second thing came up along the way: since a cached puzzle appears without a
loading screen, `GameScreen` stays mounted when the puzzle changes and would have
carried the old game along. Hence `key={core.seed}`.

### V20-4 — Two things the move would have broken

- **Both Dockerfiles** copied `packages` — a folder that no longer exists. `COPY`
  of a missing path aborts the build. Lines removed; along the way the
  superfluous `/app/puzzle/` disappears, noted as harmless in round 19.
- **`npm run reference` wrote to the wrong folder** — the same error as in round
  18, revived by the move, because the path hangs on the script file and that
  moved. So anchoring alone did not prevent it, only shifted it. This time with a
  bolt: if the target directory is missing, the script aborts instead of quietly
  creating a new one. The bolt was triggered with a deliberately wrong path and
  held.

### V20-5 — Every daily case was "very easy", forever

`dailySeed` had grid size 6 hard-wired, and the tier follows from the size. A
calendar would have shown 365 identical days. Now the weekday decides the tier
(§6.1.1), retroactively for all days.

For that `dailySeed` takes three plain numbers instead of a `Date`: the time zone
is not a question the engine may have an opinion on. The weekday is computed,
not read — the engine reads no clock. Since a home-made formula would confirm
itself, a test checks it **against the platform, for 366 days**.

The curated catalogue was dropped without replacement: `catalog.ts` (254 lines),
`CatalogScreen.tsx`, `scripts/curate.ts`, `tests/catalog.test.ts` and the
matching npm command. The test that checked the catalogue against the generator
version now checks **400 calendar days and all five tiers** for the same
promise.

Measured beforehand, so that the calendar needs no fallback mechanism: **0
failures** over 90 days of 6×6 and 40 days across all tiers, slowest case
615 ms.

### V20-6 — Storage promised a version that was not true

All keys were under `indizio:v2:`, while the generator is at 3 — on the step to 3
the update had been missed. It did no harm, because `loadPuzzle` also checks the
version in the puzzle itself, but the key name lied. Caught up, and a one-off run
at start-up clears the old entries.

### V20-7 — A class name collision, the same kind as in round 15

`.tier-veryEasy` meant "narrow bar, 20 % wide" on the calendar day and "green
border on the left" on the random button. The buttons thereby became green blocks
with cut-off text. In round 15 it was `carpet` as object **and** floor; the
mechanism is the same — one name, two meanings, and the more specific rule does
not win automatically.

Along the way it showed that locked days named their tier in the spoken text but
did not show it. Instead of shortening the text, future days now show the bar
too: that Sunday will be the big case may be seen in advance. For that "locked"
became two states — before the start day and after today mean different things.

### V20-8 — Three errors in keyboard play, all visible only in the browser

- The final line reset the frame to the start cell **after** every move. Five
  arrow keys, and it was back on cell 0.
- The frame was dropped on losing focus; even a flicker cost the position. Now it
  survives, only the display depends on focus.
- `focusin` fires **zero times** in the preview window, although `activeElement`
  is right. The frame therefore appears on the first key press rather than on the
  focus event — which is more correct anyway: whoever clicks with the mouse does
  not need it.

**A fourth suspicion was none.** Enter and `X` did nothing, and it looked like an
error in the key handling. Cells 8 and 14 were simply **blocked**. The code was
right, the test cells were badly chosen — on a free cell it places cleanly.

The edge arithmetic stands on its own as `moveCursor` and is tested: all six keys
on **every** cell of all six grid sizes stay on the board, and at the right edge
nothing wraps into the next row.

Fixed along the way: `vibrate` had been in storage since round 11 and **had no
effect** — the board shook regardless of the setting. Now there is a control for
it too; before, the setting could only be changed by editing browser storage by
hand.

### V20-9 — The height deduction had to be adjusted by hand a second time

The third button in the header made it wrap at 375 px; the page scrolled by
28 px.

The first attempt — raising the height deduction in the game screen — had **no
effect**, for a reason not measured before: on a phone the **width** binds (347
against 414 free pixels). A larger height deduction changes nothing there.
Afterwards eight pixels were missing by calculation; instead of adjusting widths
to the pixel, which would break again with the next longer word, the header may
no longer wrap and the title cuts off if needed.

**Open and deliberately not quietly nailed down:** this deduction is a constant
every UI change can make wrong, and it has now been wrong twice (footer in round
16, button in this round). A measured value would be more honest. It is listed as
an open point in §8.5.

### Proof

| | Before (round 19) | After |
|---|---|---|
| tests in total | 223 | **253** |
| of which app | 58 | 77 |
| of which engine | 165 | 176 |
| test files | 17 | 16 |
| npm commands | 17 | 13 |
| `tsconfig` files | 3 | 2 |
| bundle (raw / gzip) | 319.9 kB / 89.5 kB | 326.5 kB / 92.4 kB |

**Generation is demonstrably unchanged:** `npm run reference` writes the frozen
data back byte for byte, and the reference test reports "still generates byte for
byte the same". `GENERATOR_VERSION` stays 3, all links remain valid. The 92
drawings also come out of `npm run art` unchanged.

Checked in the browser, each time in a fresh tab without hot-reload leftovers:

| | |
|---|---|
| today's case (Sunday) | expert 10×10 — the rhythm applies |
| September 2026 | 30 days, 27 playable, 3 locked |
| Saturday 26th | → `v3-garage-9-s-1tych8v` → car repair shop 9×9 |
| random case "medium" | → `v3-garage-8-m-879hg0` → 8×8 |
| paging | back to January 2026, then locked; "To today" returns |
| English | months and weekdays via `Intl` |
| dragging across the board | selection empty |
| dragging across the clue text | selection complete |
| game screen 10×10 and 6×6 | page height exactly 812, no scrolling |
| settings | slider to 550 ms, vibration off — both saved |
| saved game | survives a reload |

**Not checked, and noted as such:** the redraw after failed generation could not
be triggered in the browser, because generation does not fail. The rule behind
it — *a typed-in seed is never replaced* — was therefore pulled out as a
function of its own, `redrawFor`, and backed by four tests. A promise that lives
only in a comment is none.
