import type { ReactNode } from 'react';
import { flatShapes } from './flat.js';
import { garageShapes } from './garage.js';
import { gardenShapes } from './garden.js';

/**
 * Placeholder shapes per theme and object key. A new theme adds its file here
 * next to its engine folder; `npm run art` refuses to run while a shape is
 * missing.
 */
export const PLACEHOLDER_SHAPES: Readonly<Record<string, Readonly<Record<string, ReactNode>>>> = {
  garage: garageShapes,
  flat: flatShapes,
  garden: gardenShapes,
};
