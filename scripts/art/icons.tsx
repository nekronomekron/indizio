import type { ReactNode } from 'react';
import { C } from './palette.js';

/**
 * Bediensymbole im selben flachen Vektorstil wie die Requisiten:
 * kräftige Grundform, ein Akzent, keine Konturen.
 */
export const ICON_SHAPES: Record<string, ReactNode> = {
  'ui-x': (
    <path
      d="M6.2 4.4 12 10.2l5.8-5.8 1.8 1.8L13.8 12l5.8 5.8-1.8 1.8L12 13.8l-5.8 5.8-1.8-1.8L10.2 12 4.4 6.2Z"
      fill={C.red}
    />
  ),
  'ui-eraser': (
    <>
      <rect
        x="2.5" y="12" width="15" height="8" rx="2"
        transform="rotate(-45 10 16)" fill={C.purple}
      />
      <rect
        x="2.5" y="12" width="6" height="8" rx="2"
        transform="rotate(-45 10 16)" fill={C.white}
      />
      <rect x="3" y="20" width="18" height="2.4" rx="1.2" fill={C.stoneDark} />
    </>
  ),
  'ui-undo': (
    <path
      d="M12 5a8 8 0 1 1-7.4 11h3a5.2 5.2 0 1 0 4.4-8.2H9.4l2.6 2.6-2 2L3.6 6.6 10 3.4l2 2-2.4 1.2A8 8 0 0 1 12 5Z"
      fill={C.teal}
    />
  ),
  'ui-hint': (
    <>
      <path d="M12 2.5a6.6 6.6 0 0 1 3.9 11.9V17H8.1v-2.6A6.6 6.6 0 0 1 12 2.5Z" fill={C.yellow} />
      <rect x="8.6" y="17.4" width="6.8" height="2" rx="1" fill={C.stone} />
      <rect x="9.6" y="20" width="4.8" height="1.8" rx="0.9" fill={C.stoneDark} />
    </>
  ),
  'ui-check': (
    <path d="M9.6 18.4 3.2 12l2.2-2.2 4.2 4.2 9-9L20.8 7Z" fill={C.green} />
  ),
  'ui-timer': (
    <>
      <circle cx="12" cy="13" r="9" fill={C.white} />
      <circle cx="12" cy="13" r="7.2" fill="#dcd9e6" />
      <rect x="11.1" y="7.5" width="1.8" height="6.4" rx="0.9" fill={C.ink} />
      <rect x="11.6" y="12.4" width="4.8" height="1.7" rx="0.85" fill={C.ink} />
      <rect x="9.4" y="1.4" width="5.2" height="2.4" rx="1.2" fill={C.stoneDark} />
    </>
  ),
  'ui-victim': (
    <>
      <circle cx="12" cy="12" r="9.4" fill={C.red} />
      <circle cx="12" cy="12" r="6.6" fill={C.white} />
      <circle cx="12" cy="12" r="3.6" fill={C.red} />
    </>
  ),
  'ui-note': (
    <>
      <rect
        x="3" y="16.6" width="17" height="4.6" rx="1"
        transform="rotate(-45 11 18)" fill={C.yellow}
      />
      <path d="M2.6 21.6l0.9-3.4 2.5 2.5Z" fill={C.woodDark} />
      <rect
        x="17.4" y="16.6" width="3.2" height="4.6" rx="1"
        transform="rotate(-45 11 18)" fill={C.orange}
      />
    </>
  ),
};
