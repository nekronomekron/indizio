import type { ArtKind } from '../art/art.js';

export interface TutorialIcon {
  name: string;
  /** Kind of drawing; a prop when left out. */
  kind?: ArtKind;
  /** Theme the drawing comes from. Only props need one. */
  theme?: string;
}

/**
 * One picture per tutorial step, in step order. The texts live in the `help`
 * namespace; pictures are not language, so they live here. A test keeps both
 * lists the same length.
 */
export const TUTORIAL_ICONS: readonly TutorialIcon[] = [
  { name: 'ui-victim', kind: 'icons' },
  { name: 'ui-note', kind: 'icons' },
  { name: 'ui-x', kind: 'icons' },
  { name: 'bush_1x1', theme: 'garden' },
  { name: 'p01', kind: 'characters' },
  { name: 'ui-check', kind: 'icons' },
];
