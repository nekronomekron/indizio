# Coding guidelines

What a tool can check is checked by a tool: `npm run verify` runs the type
checker, ESLint, Prettier and the tests. This page holds the rest — the
conventions no linter sees — and the reasons behind the ones it does.

## Language

Everything that is not player-facing text is **English**: identifiers,
comments, test names, commit messages, documentation. Player-facing text lives
in the i18n resources and nowhere else.

## Structure

```
src/
  engine/     generator and solver — no DOM, no React, runs in a worker
  app/        the React UI, grouped by feature
    features/ game, calendar, settings, help — one folder per feature
    shared/   what several features use: i18n, art, storage, puzzle loading
  worker/     the web worker that runs the engine
```

- The engine is reached only through `@engine` and `@engine/i18n`.
- A feature may import from `shared/`, **never from another feature**. If two
  features need the same thing, it moves to `shared/`.
- Both rules are enforced by ESLint and by `tests/boundary.test.ts`.

## TypeScript

- No `any`. No `as` without a comment saying why it is safe.
- **Data from outside is parsed, not cast.** `localStorage`, the URL, worker
  messages and imported documents go through a schema (valibot in the app,
  `parsePuzzle` for puzzles). Invalid data is dropped and replaced by the
  default — never half-applied.
- Exported functions declare their return type.
- Prefer `readonly` arrays and properties for values that are not mutated.
- Prefer a discriminated union over optional flags that only make sense
  together.

## React

- Function components and hooks only. No class components — except an error
  boundary, which React still requires to be a class.
- Named exports only; no `export default`.
- One component per file; the file is named after it (`SuspectCard.tsx`).
  Other modules are camelCase (`gameReducer.ts`).
- Props are an `interface XProps`; no `React.FC`.
- State: local with `useState` / `useReducer`; shared through a context. No
  global store library.
- Effects are for synchronising with the outside world (timers, events, the
  worker). Anything that can be computed while rendering is computed while
  rendering.
- Every interactive element is reachable and usable by keyboard and has an
  accessible name. `jsx-a11y` checks the basics.

## Styling

- CSS Modules next to the component (`Board.module.css`).
- Colours, radii and sizes are tokens in `shared/styles/tokens.css`; a
  component never invents a raw colour.
- Values computed from the board size (cell positions, tile offsets) are
  inline styles; everything else is a class.

## Errors

- Engine errors carry a `code`; the app translates the code, not the message.
- A failure shows a readable, translated message with the technical detail
  folded away below it. Nothing is sent anywhere.

## Comments

Comments explain **why** — a constraint, a trade-off, a bug that was fixed
here — not what the next line does. When a comment only restates the code,
delete it.

## Tests

- The engine's frozen checksums (`tests/engine/reference/`) must not change
  unless generation is changed on purpose — and then the generator version
  goes up.
- New behaviour gets a test in the same commit.
