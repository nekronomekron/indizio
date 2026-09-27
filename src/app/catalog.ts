// Written by scripts/curate.ts — do not edit by hand.
import type { DifficultyKey } from '@indizio/puzzle';

export interface CatalogEntry {
  seed: string;
  themeKey: string;
  size: number;
  difficulty: DifficultyKey;
  spread: number;
  indirect: number;
}

export const CATALOG: readonly CatalogEntry[] = [
  {
    "seed": "v3-garage-5-vl-76xs",
    "themeKey": "garage",
    "size": 5,
    "difficulty": "veryEasy",
    "spread": 5,
    "indirect": 0
  },
  {
    "seed": "v3-flat-6-vl-9fqx",
    "themeKey": "flat",
    "size": 6,
    "difficulty": "veryEasy",
    "spread": 5.3,
    "indirect": 0
  },
  {
    "seed": "v3-garden-5-vl-bok2",
    "themeKey": "garden",
    "size": 5,
    "difficulty": "veryEasy",
    "spread": 3.2,
    "indirect": 1
  },
  {
    "seed": "v3-garage-6-vl-dxd7",
    "themeKey": "garage",
    "size": 6,
    "difficulty": "veryEasy",
    "spread": 5,
    "indirect": 0
  },
  {
    "seed": "v3-flat-5-vl-g66c",
    "themeKey": "flat",
    "size": 5,
    "difficulty": "veryEasy",
    "spread": 3.8,
    "indirect": 1
  },
  {
    "seed": "v3-garden-6-vl-iezh",
    "themeKey": "garden",
    "size": 6,
    "difficulty": "veryEasy",
    "spread": 3.8,
    "indirect": 1
  },
  {
    "seed": "v3-garage-7-l-76xs",
    "themeKey": "garage",
    "size": 7,
    "difficulty": "easy",
    "spread": 8.3,
    "indirect": 3
  },
  {
    "seed": "v3-flat-7-l-9fqx",
    "themeKey": "flat",
    "size": 7,
    "difficulty": "easy",
    "spread": 8.4,
    "indirect": 1
  },
  {
    "seed": "v3-garden-7-l-bok2",
    "themeKey": "garden",
    "size": 7,
    "difficulty": "easy",
    "spread": 9.7,
    "indirect": 1
  },
  {
    "seed": "v3-garage-7-l-dxd7",
    "themeKey": "garage",
    "size": 7,
    "difficulty": "easy",
    "spread": 10.7,
    "indirect": 2
  },
  {
    "seed": "v3-flat-7-l-g66c",
    "themeKey": "flat",
    "size": 7,
    "difficulty": "easy",
    "spread": 8.6,
    "indirect": 2
  },
  {
    "seed": "v3-garden-7-l-iezh",
    "themeKey": "garden",
    "size": 7,
    "difficulty": "easy",
    "spread": 8.6,
    "indirect": 1
  },
  {
    "seed": "v3-garage-8-m-76xs",
    "themeKey": "garage",
    "size": 8,
    "difficulty": "medium",
    "spread": 6.9,
    "indirect": 2
  },
  {
    "seed": "v3-flat-8-m-9fqx",
    "themeKey": "flat",
    "size": 8,
    "difficulty": "medium",
    "spread": 7,
    "indirect": 2
  },
  {
    "seed": "v3-garden-8-m-bok2",
    "themeKey": "garden",
    "size": 8,
    "difficulty": "medium",
    "spread": 10.4,
    "indirect": 4
  },
  {
    "seed": "v3-garage-8-m-dxd7",
    "themeKey": "garage",
    "size": 8,
    "difficulty": "medium",
    "spread": 6.3,
    "indirect": 4
  },
  {
    "seed": "v3-flat-8-m-g66c",
    "themeKey": "flat",
    "size": 8,
    "difficulty": "medium",
    "spread": 8.1,
    "indirect": 2
  },
  {
    "seed": "v3-garden-8-m-iezh",
    "themeKey": "garden",
    "size": 8,
    "difficulty": "medium",
    "spread": 9.6,
    "indirect": 4
  },
  {
    "seed": "v3-garage-9-s-76xs",
    "themeKey": "garage",
    "size": 9,
    "difficulty": "hard",
    "spread": 10.3,
    "indirect": 3
  },
  {
    "seed": "v3-flat-9-s-9fqx",
    "themeKey": "flat",
    "size": 9,
    "difficulty": "hard",
    "spread": 9.4,
    "indirect": 3
  },
  {
    "seed": "v3-garden-9-s-bok2",
    "themeKey": "garden",
    "size": 9,
    "difficulty": "hard",
    "spread": 13.2,
    "indirect": 4
  },
  {
    "seed": "v3-garage-9-s-dxd7",
    "themeKey": "garage",
    "size": 9,
    "difficulty": "hard",
    "spread": 10.3,
    "indirect": 4
  },
  {
    "seed": "v3-flat-9-s-g66c",
    "themeKey": "flat",
    "size": 9,
    "difficulty": "hard",
    "spread": 8.6,
    "indirect": 5
  },
  {
    "seed": "v3-garden-9-s-iezh",
    "themeKey": "garden",
    "size": 9,
    "difficulty": "hard",
    "spread": 12.7,
    "indirect": 5
  },
  {
    "seed": "v3-garage-10-x-76xs",
    "themeKey": "garage",
    "size": 10,
    "difficulty": "expert",
    "spread": 20.9,
    "indirect": 5
  },
  {
    "seed": "v3-flat-10-x-9fqx",
    "themeKey": "flat",
    "size": 10,
    "difficulty": "expert",
    "spread": 13.9,
    "indirect": 6
  },
  {
    "seed": "v3-garden-10-x-bok2",
    "themeKey": "garden",
    "size": 10,
    "difficulty": "expert",
    "spread": 14,
    "indirect": 4
  },
  {
    "seed": "v3-garage-10-x-dxd7",
    "themeKey": "garage",
    "size": 10,
    "difficulty": "expert",
    "spread": 9.7,
    "indirect": 3
  },
  {
    "seed": "v3-flat-10-x-g66c",
    "themeKey": "flat",
    "size": 10,
    "difficulty": "expert",
    "spread": 13.3,
    "indirect": 4
  },
  {
    "seed": "v3-garden-10-x-iezh",
    "themeKey": "garden",
    "size": 10,
    "difficulty": "expert",
    "spread": 18.9,
    "indirect": 3
  }
];
