# @indizio/puzzle

A generator and solver for deduction puzzles.

On an N×N grid exactly one person stands in every row and every column, and
every card carries exactly one true clue. One of the people is the victim, and
the murderer is whoever shared their room. Work out where everybody stood and
you have the answer.

Every generated puzzle **has exactly one solution** and is **solvable by
deduction alone** — never by guessing. Those are not aspirations; they are
checked on every puzzle before it is returned, and again by a property test
suite that verifies hundreds of arbitrary ones on every run.

## Install

```bash
npm install @indizio/puzzle
```

The core has **no runtime dependencies** and knows nothing about the DOM or any
UI framework, so it runs unchanged in a browser, a web worker and Node. Only
sentence rendering needs a library, and it lives behind a separate entry point.

## Use

```ts
import { generatePuzzle, makeSeed, verifyPuzzle, stringifyPuzzle } from '@indizio/puzzle';

const { core } = generatePuzzle(makeSeed('garage', 6, 12345));

verifyPuzzle(core).ok;        // true
core.suspects.length;         // 6
stringifyPuzzle(core);        // JSON you can store and read back anywhere
```

A seed is the whole identity of a puzzle. The same seed always yields the same
puzzle, byte for byte, on any machine — which is what makes a shared link mean
something.

### Sentences

```ts
import { createClueTranslator } from '@indizio/puzzle/i18n';

const translator = createClueTranslator({ locale: 'en' });
core.clues.map((entry) => translator.render(core, entry));
// [ 'He was on an oil stain.', 'The victim. She was alone with the murderer.', … ]
```

German and English ship with the library. The translator builds its own private
i18next instance, so it never touches an i18next setup you already have — or
pass `instance` to reuse yours.

### Playing

```ts
import { checkSolution, hintFor, boardLayout } from '@indizio/puzzle';

boardLayout(core);                  // which room each cell is in, where nobody may stand
hintFor(core, board);               // the next forced step, with its reason
checkSolution(core, board);         // right or wrong — deliberately nothing more
```

`hintFor` always reasons from an empty board and uses yours only to skip steps
you already have right. That is deliberate: if it reasoned from your position,
asking for a hint would tell you whether a placement is wrong, and checking your
answer is meant to be the only way to find that out.

## What the library guarantees

| Claim | How it is kept |
|---|---|
| Exactly one solution | An independent reference solver confirms it by exhaustive search |
| Never needs guessing | Only puzzles the deductive solver finishes are returned |
| Every clue is true | Clues are drawn from a pool of true statements, then rechecked |
| Same seed, same puzzle | Field-stable serialisation, verified against stored checksums |
| Difficulty means something | Two measured figures per puzzle, checked against the tier it claims |

Run `npm test` for the quick suite and `npm run test:deep` for the thorough one.

## Bringing your own content

Themes are plain data — room names and an object catalogue — so a different
setting needs no change to the generator:

```ts
import { generatePuzzle, makeSeed } from '@indizio/puzzle';
import { createClueTranslator } from '@indizio/puzzle/i18n';

const spaceStation = {
  key: 'station',
  roomKeys: ['bridge', 'galley', 'bay', 'lab', 'airlock', 'quarters', 'hold'],
  objects: [
    { key: 'console', walkable: false, footprints: [[2, 1]], rooms: ['bridge'], maxPerScene: 3, weight: 4 },
    { key: 'bunk', walkable: true, footprints: [[2, 2]], rooms: ['quarters'], maxPerScene: 2, weight: 3 },
    // …
  ],
};

const { core } = generatePuzzle(makeSeed('station', 6, 7), { themes: [spaceStation] });

const translator = createClueTranslator({
  locale: 'en',
  additionalResources: {
    en: { object: { console: { on: 'at a console', dative: 'a console', plural: 'consoles', nominative: 'a console', bare: 'console', from: 'the console' } } },
  },
});
```

## How a puzzle is built

1. **Rooms** — the grid is split into rectangles, then reshaped: a corridor is
   carved and rectangular bites move between neighbours, giving the L-shapes and
   hallways real floor plans have.
2. **People first** — a random permutation fixes where everyone stands, and it
   is reshuffled until one room holds exactly two: the victim and the murderer.
3. **Furniture second** — objects are placed *around* the people, so each one
   can be described sharply. Doing it the other way round leaves people in bare
   corners; measured on 8×8 grids it produced no solvable puzzle at all.
4. **Clues** — start with the sharpest true clue on every card, repair whatever
   leaves the solver stuck, then weaken as far as solvability allows. What
   survives is the hardest set that solution admits, so every clue does work.
5. **Verification** — before returning: all clues true, solver finishes without
   case analysis, restrictions respected, measurements match the tier.

## Layout

```
core/        types, grid arithmetic, seeds, difficulty tiers, seeded RNG
clues/       what each clue means: evaluate, enumerate, restrictions
solving/     candidates, propagation, permutation rules, hints, reference solver
generation/  floor plans, furnishing, roles, clue search
io/          the JSON interchange format, with validation on read
content/     themes and names — data, replaceable
i18n/        i18next resources and the clue translator
```

Dependencies run one way only, from `generation` down to `core`, and a test
enforces it.

## Licence

MIT
