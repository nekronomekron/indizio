# Indizio — logic puzzles at the crime scene

A detective deduction game in the style of [Murdoku](https://murdoku.com): on
an N×N grid, **every row and every column holds exactly one person**. Every
suspect card carries exactly one true clue. Place everyone correctly and you
have caught the murderer — the victim was alone with them in one room.

Everything runs in the browser: no sign-up, no backend, and offline after the
first load. Every puzzle comes from its **seed** — the same link gives the same
puzzle everywhere.

**Every day has its own case.** A calendar shows the month; the weekday sets
the difficulty, from short on Monday to long on Sunday. Missed days can be
caught up on. Whoever wants something else in between picks a tier and gets a
drawn case.

It plays with mouse, finger **and keyboard**: arrow keys move a frame over the
board, Enter places, N notes, X marks.

The game speaks German and English; on a first visit it follows the browser's
language.

The footer shows the **version** as `<year>.<number>`, e.g. `2026.5`: the fifth
version this year. It lives in `package.json` and nowhere else; `npm run bump`
counts it up, restarting at one in a new year. Deliberately not semver — that
promises something about contracts between programs, and there are none here.
Whoever reports a bug should be able to say, unasked, which build they had.

```bash
npm install
npm run dev
```

Opens <http://localhost:5173>. For a production build run `npm run build`; the
result in `dist/` runs on any static web host.

## What the game guarantees

| Promise | How it is kept |
|---|---|
| Exactly one solution | The logic solver finishes every puzzle without case analysis; an independent reference solver confirms uniqueness on samples |
| Never guess | Only puzzles the rule-based solver deduces completely are shipped |
| All clues true | Every clue is checked against the solution again before output |
| Reproducible | Same seed ⇒ byte-identical puzzle core, across processes too |
| Rising difficulty | Grid size as the primary key, plus measured spread and share of indirect clues |

Proven by `npm run verify` (type check, lint, formatting, all tests) and
`npm run test:deep` (the thorough run over every grid size). The criteria are
in [PLAN.md](PLAN.md) §11.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | development server |
| `npm run build` | production bundle into `dist/` |
| `npm test` | engine and app tests, under a minute |
| `npm run test:deep` | thorough run: every grid size, hundreds of seeds, time budgets |
| `npm run lint` | ESLint, one strictness for all code |
| `npm run format` | format with Prettier |
| `npm run typecheck` | type check of both projects (`tsconfig.engine.json`, `tsconfig.json`) |
| `npm run css:types` | write the typed class names of the CSS modules |
| `npm run verify` | type check, lint, formatting and all tests — the run before every commit |
| `npm run reference` | rewrite the engine's frozen reference data |
| `npm run art` | write missing placeholder drawings into `art/` |
| `npm run art:sheet` | every drawing on one sheet, to look at |
| `npm run bump` | count the version up by one |

How code is written here is in [CODING_GUIDELINES.md](CODING_GUIDELINES.md).

## Structure

The game logic lives in the project, but **behind exactly two doors**. The UI
knows `@engine` and `@engine/i18n` — and nothing beneath.

```
src/engine/          generator and solver, no DOM, no React
  index.ts           the door: everything the app may use
  api.ts             solvePuzzle, verifyPuzzle, hintFor, boardLayout
  core/              types, grid arithmetic, seeds, tiers, random numbers, locales
  clues/             what a clue means
  solving/           candidates, propagation, rules, hint, reference solver
  generation/        floor plan, furnishing, roles, clue search
  io/                JSON interchange format with complete validation
  content/themes/    one folder per theme: rooms and floors, objects, texts
  i18n/              second door: i18next resources and clue translator
src/app/             the React UI
  features/          game, calendar, settings — one folder each
  shared/            what several features use: i18n, art, storage, errors, UI parts
src/worker/          the generator in a web worker
art/                 every drawing as its own SVG file (see art/README.md)
scripts/             helper scripts (drawings, reference data, CSS types, version)
scripts/art/         placeholder drawing instructions — development only
tests/               app tests and the boundaries
tests/engine/        engine tests, including the enforced decoupling
```

The engine's folders are **layers with one direction**: `generation` →
`solving` → `clues` → `core`, and nothing reaches back. The app's features use
`shared/` but never each other.

Both boundaries are enforced, not just described: the engine door by an ESLint
rule and by [tests/boundary.test.ts](tests/boundary.test.ts), the feature
boundaries by the same test. The engine compiles without DOM types, so a stray
`window` fails to compile rather than failing in the worker.

What the engine promises about itself is in
[src/engine/README.md](src/engine/README.md).

### Using the engine

```ts
import { generatePuzzle, makeSeed, stringifyPuzzle } from '@engine';
import { createClueTranslator } from '@engine/i18n';

const { core } = generatePuzzle(makeSeed('garage', 6, 12345));
const translator = createClueTranslator({ locale: 'en' });
console.log(core.clues.map((entry) => translator.render(core, entry)));
const json = stringifyPuzzle(core); // readable back anywhere
```

Sentences come from **i18next**, loaded only behind the `@engine/i18n` door —
whoever only generates and solves gets a core without any runtime dependency,
and the worker pays for no translation library it does not use. The app hands
the translator its own i18next instance, so UI and clues switch language
together.

Custom themes can be passed in without touching the generator. A theme brings
its own texts, so a custom theme is complete in itself.

Reaching **past the doors** is not a shortcut but an error:

```ts
import { solve } from '../engine/solving/solve.js'; // lint and test both object
```

Whoever needs something from inside exports it from `src/engine/index.ts` —
under a name that means something to someone who does not know the internals.
That is what `api.ts` is for.

### Adding a theme

1. A folder `src/engine/content/themes/<key>/` with `theme.ts` (rooms with their
   floor, objects) and `locales/de.ts`, `locales/en.ts` (name, room words,
   object word forms).
2. One line in `src/engine/content/themes/index.ts`.
3. Placeholder shapes in `scripts/art/themes/<key>.tsx`, registered in
   `scripts/art/themes/index.ts`; then `npm run art`.

The tests say what is still missing: texts in every language, a floor drawing
per room, a drawing per object.

## How a puzzle is made

1. **Rooms** — guillotine split, then a carved-out corridor and rectangular
   bites between neighbouring rooms. The result is **connected sets of cells
   rather than rectangles**: L-shapes, alcoves and narrow halls as in real
   buildings. Over 80 % of rooms are not rectangular.
2. **Solution first** — a random permutation decides who stands where; it is
   rerolled until one room holds exactly two people.
3. **Furniture second** — every solution cell gets an anchor: a walkable object
   on it or a blocking one next to it. Every object type serves as an anchor at
   most once; otherwise two cards would carry the same clue and the puzzle would
   be ambiguous. Carpets and mats are laid in free shapes that may turn corners
   and cross.
4. **Clue search** — the strongest true clue per card, repair of the uncertain
   cards, greedy weakening down to the hardest still solvable set, then swapping
   direct for indirect clues until the tier fits.
5. **Checks** — all clues true, the solver gets through without case analysis,
   the tier's bounds are kept, the restrictions of PLAN.md §4.2.1 hold.

The order of steps 2 and 3 is the core of it: furnishing at random and then
searching for a solution yields measurably **not one** solvable puzzle from
8×8 up. The derivation is in [VALIDATION.md](VALIDATION.md), round 5.

## Drawings

**All vector, all home-made.** No raster images, no sprite atlas, no foreign
art packs — every shape is SVG on a 24×24 grid and stays sharp at any size. The
style is flat and clear: no outlines, no gradients, per material a base colour
and a darker one for depth.

**Every drawing is a file of its own** in [art/](art/README.md). The app draws
nothing itself, it loads the files — replacing a drawing means replacing the
file. What is there today are placeholders; `npm run art` makes them, but never
overwrites a file someone replaced.

Every theme has its **own set of drawings** under `art/themes/<theme>/`. Lookup
goes there first, then to `art/common/`. So the workshop chair may look
different from the kitchen chair, while characters and icons exist only once.

The suspects are **silhouettes without faces**. That follows from the promise
that portraits never matter for the solution: a face invites reading something
into it. The fourteen characters differ in clothing colour, head shape and
skin tone.

Every room also has a **floor that fits its name** — tiles in the bathroom,
grass on the lawn, concrete in the workshop. Not decoration: almost every clue
refers to rooms, and a floor you recognise makes room borders clear without
reading.

For the same reason **every room is surrounded by a thick black line**,
always and on every device. Phones have no hover, and a room border only a
mouse can find is no border for half the players.

88 files: 48 props, 2 sheets of laid props, 16 floors, 14 characters, 8 icons.

Props have **a file of their own per footprint** — `bed_2x1.svg` next to
`bed_1x2.svg`, `table_3x1.svg` — and the game lays them over exactly those
cells. A bed across is not a rotated bed lengthways.

**Carpets and mats**, by contrast, lie in any shape in the room, around corners
and with crossings. For them there is one sheet per kind (`tiles/carpet.svg`),
from which the game assembles any shape in quarters — see
[art/README.md](art/README.md) and PLAN.md §13.

## Controls

| Input | Effect |
|---|---|
| Tap a card | select that person |
| Tap a cell | add or remove a pencil note (letter top left, several per cell) |
| Hold a cell | place the selected person |
| Drag | paint notes across several cells |
| Double-click | place (desktop) |
| Right-click | mark a cell as impossible |
| Hold the eraser | clear the whole grid |
| Mouse over a room | the room is highlighted (desktop only) |
| Arrow keys, Home, End | move the keyboard frame |
| Enter / Space | place |
| N, X, Delete | note, mark, clear |
| Comma, full stop | previous / next person |

When placing, the game marks row and column with X automatically and clears
the notes that no longer apply — exactly the bookkeeping that would otherwise
be done by hand.

The board shows the **first letter of the name**: an "N" reminds you of Nadja,
not of her being the fourth card. Selecting a card lights up all of that
person's marks — placement and notes alike. The **victim is last in the list**
— it is the one card with nothing to investigate.

Nobody can stand on blocking objects — table, cupboard, lamp, tree; the grid
takes no input there. Walkable are only things you could sensibly stand or sit
on: bed, carpet, chair, sofa, bench, mat, pallet, car, stepping stone and the
like.

**Confirm** only says right or wrong — never which person is misplaced. The
**hint**, in turn, always starts from an empty board and names the next forced
step; it never comments on the board and so cannot be abused as an error
finder.

## Documents

- [PLAN.md](PLAN.md) — development plan with game concept, solver, generator and acceptance criteria
- [VALIDATION.md](VALIDATION.md) — review log: errors found and fixed, round by round
- [CODING_GUIDELINES.md](CODING_GUIDELINES.md) — how code is written here
- [art/README.md](art/README.md) — rules for the drawings
