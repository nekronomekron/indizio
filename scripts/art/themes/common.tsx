import type { ReactNode } from 'react';
import { C } from '../palette.js';

/** Placeholder shapes more than one theme uses. Each theme may still draw its own. */
export const chair: ReactNode = (
    <>
      <rect x="6" y="2" width="12" height="9" rx="2.5" fill={C.wood} />
      <rect x="7.5" y="3.5" width="9" height="6" rx="1.5" fill={C.woodLight} />
      <rect x="5" y="11" width="14" height="4" rx="1.8" fill={C.woodDark} />
      <rect x="6.5" y="15" width="2.6" height="6" rx="1.2" fill={C.wood} />
      <rect x="14.9" y="15" width="2.6" height="6" rx="1.2" fill={C.wood} />
    </>
  );

export const plant: ReactNode = (
    <>
      <ellipse cx="12" cy="8.5" rx="7.5" ry="6" fill={C.green} />
      <ellipse cx="8.5" cy="7" rx="3" ry="2.6" fill={C.leaf} />
      <rect x="11.2" y="12" width="1.6" height="4" fill={C.greenDark} />
      <path d="M8 16h8l-1.2 5.5H9.2Z" fill={C.orange} />
    </>
  );
