# The engine

The generator and solver for Indizio's deduction puzzles.

On an N×N grid exactly one person stands in every row and every column, and
every card carries exactly one true clue. One of the people is the victim, and
the murderer is whoever shared their room. Work out where everybody stood and
you have the answer.

Every generated puzzle **has exactly one solution** and is **solvable by
deduction alone** — never by guessing. Those are not aspirations; they are
checked on every puzzle before it is returned, and again by a property test
suite that verifies hundreds of arbitrary ones on every run.

> This folder is written in English, comments included, and a test enforces it
> — while the app around it is documented in German. That is deliberate: the
> engine is one self-contained world with its own vocabulary, and mixing two
> languages inside it was the thing the rule was written to stop.

## The two doors

This was a separate package once, published as `@indizio/puzzle`, and its
manifest kept its public surface honest: `exports` let `.` and `./i18n` through,
and nothing else. Back inside the project that protection is gone — an
`import { solve } from '../engine/solving/solve.js'` would be technically
flawless and exactly the wrong thing.

So the boundary is stated twice instead:

| | |
|---|---|
| `eslint.config.js` | a `no-restricted-imports` rule, so it fails while you type |
| `tests/boundary.test.ts` | the same promise as a test, so it fails even if the linter is skipped |

```ts
import { generatePuzzle, makeSeed } from '@engine';        // yes
import { createClueTranslator } from '@engine/i18n';       // yes
import { solve } from '../engine/solving/solve.js';        // no
import { buildOccupancy } from '@engine/clues/occupancy';  // no
```

**Needing something from inside is not a reason to reach in.** It is a reason to
export it from `index.ts` on purpose, under a name chosen for a reader who does
not know the internals — `boardLayout` rather than `buildSceneIndex`, which is
why `api.ts` exists.

`@engine/i18n` stays a door of its own because i18next lives behind it and
nothing else here depends on anything at all. The worker that only generates
puzzles must not pay for a translation library.

## Use

```ts
import { generatePuzzle, makeSeed, verifyPuzzle, stringifyPuzzle } from '@engine';

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
import { createClueTranslator } from '@engine/i18n';

const translator = createClueTranslator({ locale: 'en' });
core.clues.map((entry) => translator.render(core, entry));
// [ 'He was on an oil stain.', 'The victim. She was alone with the murderer.', … ]
```

German and English are both here. The translator builds its own private i18next
instance, so it never touches an i18next setup elsewhere in the app — or pass
`instance` to reuse one.

### Playing

```ts
import { checkSolution, hintFor, boardLayout } from '@engine';

boardLayout(core);                  // which room each cell is in, where nobody may stand
hintFor(core, board);               // the next forced step, with its reason
checkSolution(core, board);         // right or wrong — deliberately nothing more
```

`hintFor` always reasons from an empty board and uses yours only to skip steps
you already have right. That is deliberate: if it reasoned from your position,
asking for a hint would tell you whether a placement is wrong, and checking your
answer is meant to be the only way to find that out.

## What the engine guarantees

| Claim | How it is kept |
|---|---|
| Exactly one solution | An independent reference solver confirms it by exhaustive search |
| Never needs guessing | Only puzzles the deductive solver finishes are returned |
| Every clue is true | Clues are drawn from a pool of true statements, then rechecked |
| Same seed, same puzzle | Field-stable serialisation, verified against stored checksums |
| Difficulty means something | Two measured figures per puzzle, checked against the tier it claims |
| Depends on nothing | No bare import outside `i18n/`, checked by test rather than by manifest |

```bash
npm test            # engine and app, under a minute
npm run test:deep   # hundreds of seeds, reference cross-checks, timing budgets
npm run reference   # rewrite the frozen reference data — deliberately, never automatically
```

A changed checksum is how an intended change to generation gets recorded. The
diff is meant to be read: if `npm run reference` produces one and you did not
mean to change what the generator makes, something is wrong.

## Bringing your own content

Themes are plain data — room names and an object catalogue — so a different
setting needs no change to the generator:

```ts
import { generatePuzzle, makeSeed } from '@engine';
import { createClueTranslator } from '@engine/i18n';

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

Every footprint a theme declares needs a matching file under `art/` — see
[`art/README.md`](../../art/README.md).

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
index.ts     the door — everything the app may use
api.ts       narrow helpers built for consumers, hiding the solver's own index
core/        types, grid arithmetic, seeds, difficulty tiers, seeded RNG
clues/       what each clue means: evaluate, enumerate, restrictions
solving/     candidates, propagation, permutation rules, hints, reference solver
generation/  floor plans, furnishing, roles, clue search
io/          the JSON interchange format, with validation on read
content/     themes and names — data, replaceable
i18n/        i18next resources and the clue translator
```

Dependencies run one way only, from `generation` down to `core`, and
[`tests/engine/architecture.test.ts`](../../tests/engine/architecture.test.ts)
enforces it — along with everything else this file claims about the engine's
independence.
