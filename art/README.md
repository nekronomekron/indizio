# Drawings

**Every drawing of the game is its own SVG file** here. The app draws nothing
itself — it loads exactly these files. Replacing a drawing means replacing the
file. No code changes.

What is here are, for now, **placeholders**. They exist to be replaced.

## Layout

```
art/
  common/              shared by every theme
    characters/        p01 … p14 — the suspects
    icons/             ui-x, ui-check, … — controls
    floors/            fallback floor for foreign themes
  themes/<theme>/
    objects/           this theme's props
    tiles/             sheets of laid props (carpet, mat)
    floors/            the floors of its rooms
```

Lookup goes **theme first, then `common`**. A file in
`themes/garage/objects/chair_1x1.svg` counts only in the car repair shop; one
in `common/objects/chair_1x1.svg` everywhere the theme brings nothing of its
own.

That is why `chair_1x1.svg` exists twice today — in `garage` and in `flat`. On
purpose: a workshop chair may look different from a kitchen chair. Whoever
wants both the same puts one file into `common/objects/` and deletes the other
two.

## Props: one file per footprint

The name carries the footprint in cells, **width by height**:

```
bed_2x1.svg      two cells side by side
bed_1x2.svg      two cells one above the other
table_3x1.svg    three cells side by side
tree_1x1.svg     one cell
```

A bed across is therefore a **different drawing** from a bed lengthways, not a
rotated square. The drawing area grows with it: **24 per cell**, so
`viewBox="0 0 72 24"` for `3x1`. The game lays the file over exactly those
cells; choose another drawing area and you get air at the edges instead of a
squashed table.

Which footprints exist is up to the engine's **theme definition**
(`src/engine/content/themes/<theme>/theme.ts`). If one is missing, the test
says which.

Whoever manages with one file for every footprint stores it without a suffix
(`bed.svg`) — the game takes it when it finds no matching footprint. The
placeholders do not use this.

## Laid props: one sheet per kind

Carpets and mats have no fixed footprint. They lie in **any shape** in the
room — around corners, with branches and crossings, as a runner or an area.
Which props are laid this way is in the theme definition
(`placement: { kind: 'tiled', … }`).

For them there is **one file per kind**, `tiles/<name>.svg`, with
`viewBox="0 0 48 72"` — 2 × 3 cells, laid out like an RPG Maker A2 autotile:

```
x: 0          24          48
   ┌───────────┬───────────┐ y 0
   │  single   │   inner   │      preview only | the four inner corners
   │   cell    │  corners  │
   ├─────┬─────┼─────┬─────┤ y 24
   │ ┌   │  ─  │  ─  │   ┐ │
   ├─────┼─────┼─────┼─────┤
   │ │   │     │     │   │ │      a 2×2 block:
   ├─────┼─────┼─────┼─────┤      outer corners, edges, fill
   │ │   │     │     │   │ │
   ├─────┼─────┼─────┼─────┤
   │ └   │  ─  │  ─  │   ┘ │
   └─────┴─────┴─────┴─────┘ y 72
```

The game assembles every cell from **four quarters of 12 × 12**. Which quarter
it takes depends on the two neighbours that quarter borders and the diagonal
between them: outer corner, horizontal edge, vertical edge, inner corner or
fill. A quarter always comes from the **same position** in the sheet as it
takes on the board — a cell's north-west quarter from a top-left quarter
position. Nothing is rotated.

For this to work:

- Whatever ends at an open side of a quarter must fit the opposite open side of
  **every** other quarter — patterns, borders and fringes run across quarter
  boundaries.
- Outside, as for every prop, keep **2 units of air** to the cell edge. The
  inner corners are notched by exactly those 2, or the border would not meet
  the neighbouring cells' edges at an inner corner.
- The single cell top left never appears on the board; a lone cell is made of
  the four outer corners. It is the preview.

The exact mapping is in
[`src/app/features/game/board/tiles.ts`](../src/app/features/game/board/tiles.ts)
and in PLAN.md §13.4.

## What a file must meet

| | |
|---|---|
| Format | SVG, standalone, with `xmlns` |
| Drawing area | 24 per cell: `0 0 24 24` for one cell, `0 0 72 24` for `3x1` |
| Content | entirely inside the area, no negative coordinates |
| Background | **none** for props and characters — they stand on the floor |
| Margin | one or two units of air, so the tile beneath stays visible as a frame — it shows whether anyone may stand there |
| Size | never fixed; the game scales the file |

Floor tiles have two more conditions:

- They must be **seamless**: grout, plank joints and waves meet at the edges,
  or the floor visibly falls apart into squares.
- For `grass`, `soil`, `gravel` and `sand` the game mirrors the tile per cell so
  a large grid does not look like wallpaper. So for these four **nothing may run
  over the edge**. Which floors are mirrored is in
  [`src/app/shared/art/floors.ts`](../src/app/shared/art/floors.ts).

## Making placeholders

```bash
npm run art             # write missing placeholders
npm run art -- --force  # overwrite replaced drawings too
npm run art:sheet       # every drawing on one sheet, to look at
```

This runs **during development only**. The finished game generates nothing;
the files are fixed there.

Every generated file carries the marker `<!-- indizio:placeholder -->`. A file
without it came from someone else and is **not overwritten** — `npm run art`
reports it as kept. So an accidental run never costs a finished drawing.

The placeholders are drawn in [`scripts/art/`](../scripts/art), with one file
of shapes per theme in `scripts/art/themes/`. The app imports nothing from
there; once the final drawings are in, the whole folder can go.
