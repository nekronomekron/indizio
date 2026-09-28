import type { ReactNode } from 'react';
import { C } from '../palette.js';
import { chair, plant } from './common.js';

/** Placeholder shapes of the flat, one per object key (24×24, see ../../build-art.ts). */
export const flatShapes: Record<string, ReactNode> = {
  sofa: (
    <>
      <rect x="2" y="7" width="20" height="11" rx="3" fill={C.teal} />
      <rect x="2" y="7" width="4" height="11" rx="2" fill="#3b939a" />
      <rect x="18" y="7" width="4" height="11" rx="2" fill="#3b939a" />
      <rect x="6" y="9" width="5" height="6" rx="1.5" fill="#63c9d1" />
      <rect x="13" y="9" width="5" height="6" rx="1.5" fill="#63c9d1" />
      <rect x="4" y="18" width="2.5" height="3" rx="1" fill={C.woodDark} />
      <rect x="17.5" y="18" width="2.5" height="3" rx="1" fill={C.woodDark} />
    </>
  ),
  bed: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2.5" fill={C.wood} />
      <rect x="3.5" y="5.5" width="17" height="7" rx="1.5" fill={C.white} />
      <rect x="3.5" y="11" width="17" height="7.5" rx="1.5" fill={C.blue} />
      <rect x="5" y="6.5" width="6" height="4" rx="1.5" fill={C.cream} />
    </>
  ),
  carpet: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" fill={C.red} />
      <rect x="4.5" y="7" width="15" height="10" rx="1.5" fill={C.orange} />
      <rect x="7" y="9" width="10" height="6" rx="1" fill={C.red} />
      <rect x="9.5" y="10.8" width="5" height="2.4" rx="0.8" fill={C.cream} />
    </>
  ),
  bookshelf: (
    <>
      <rect x="3" y="2" width="18" height="20" rx="2" fill={C.woodDark} />
      <rect x="5" y="4" width="14" height="7" rx="1" fill="#6d492a" />
      <rect x="5" y="13" width="14" height="7" rx="1" fill="#6d492a" />
      <rect x="6" y="5" width="2.2" height="5" rx="0.6" fill={C.red} />
      <rect x="8.8" y="5" width="2.2" height="5" rx="0.6" fill={C.teal} />
      <rect x="11.6" y="5" width="2.2" height="5" rx="0.6" fill={C.yellow} />
      <rect x="14.4" y="5" width="2.2" height="5" rx="0.6" fill={C.purple} />
      <rect x="6" y="14" width="2.2" height="5" rx="0.6" fill={C.green} />
      <rect x="8.8" y="14" width="2.2" height="5" rx="0.6" fill={C.orange} />
      <rect x="11.6" y="14" width="2.2" height="5" rx="0.6" fill={C.blue} />
    </>
  ),
  table: (
    <>
      <rect x="2" y="7" width="20" height="4" rx="1.8" fill={C.woodLight} />
      <rect x="2" y="10" width="20" height="1.8" rx="0.9" fill={C.woodDark} />
      <rect x="5" y="12" width="2.8" height="9" rx="1.2" fill={C.wood} />
      <rect x="16.2" y="12" width="2.8" height="9" rx="1.2" fill={C.wood} />
    </>
  ),
  kitchenunit: (
    <>
      <rect x="2" y="6" width="20" height="4" rx="1.5" fill={C.stone} />
      <rect x="3" y="10" width="18" height="11" rx="2" fill={C.white} />
      <rect x="3" y="15" width="18" height="1.5" fill="#d6d3e0" />
      <rect x="8" y="12" width="8" height="2" rx="1" fill={C.metalDark} />
      <circle cx="8" cy="18.5" r="1.1" fill={C.metalDark} />
      <circle cx="16" cy="18.5" r="1.1" fill={C.metalDark} />
    </>
  ),
  bathtub: (
    <>
      <rect x="2" y="7" width="20" height="12" rx="4" fill={C.white} />
      <rect x="4" y="9" width="16" height="7" rx="3" fill={C.water} />
      <rect x="3.5" y="19" width="2.5" height="2.5" rx="1" fill="#d6d3e0" />
      <rect x="18" y="19" width="2.5" height="2.5" rx="1" fill="#d6d3e0" />
      <rect x="10" y="3.5" width="4" height="2" rx="1" fill={C.metal} />
    </>
  ),
  lamp: (
    <>
      <path d="M7 10 L12 3 L17 10 Z" fill={C.yellow} />
      <rect x="11" y="10" width="2" height="8" fill={C.metalDark} />
      <ellipse cx="12" cy="19.5" rx="5" ry="2" fill={C.metal} />
    </>
  ),

  chair,
  plant,
};
