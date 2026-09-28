import type { ReactNode } from 'react';
import { C } from '../palette.js';
import { chair, plant } from './common.js';

/** Placeholder shapes of the car repair shop, one per object key (24×24, see ../../build-art.ts). */
export const garageShapes: Record<string, ReactNode> = {
  car: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="4" fill={C.red} />
      <rect x="6.5" y="5" width="11" height="5" rx="2" fill={C.water} />
      <rect x="6.5" y="14" width="11" height="5" rx="2" fill={C.water} />
      <rect x="5" y="10.5" width="14" height="3" rx="1.2" fill={C.redDark} />
      <rect x="3" y="6" width="2.5" height="4" rx="1.2" fill={C.rubber} />
      <rect x="18.5" y="6" width="2.5" height="4" rx="1.2" fill={C.rubber} />
      <rect x="3" y="14" width="2.5" height="4" rx="1.2" fill={C.rubber} />
      <rect x="18.5" y="14" width="2.5" height="4" rx="1.2" fill={C.rubber} />
    </>
  ),
  oilstain: (
    <>
      <ellipse cx="12" cy="12.5" rx="8.5" ry="6.5" fill={C.oil} />
      <ellipse cx="18" cy="8" rx="2.2" ry="1.8" fill={C.oil} />
      <ellipse cx="10" cy="10.5" rx="2.6" ry="1.6" fill="#4a4658" />
    </>
  ),
  tirestack: (
    <>
      <ellipse cx="12" cy="17" rx="8" ry="4" fill={C.rubber} />
      <ellipse cx="12" cy="17" rx="3" ry="1.5" fill={C.stoneDark} />
      <ellipse cx="12" cy="12.5" rx="8" ry="4" fill="#565368" />
      <ellipse cx="12" cy="12.5" rx="3" ry="1.5" fill={C.stoneDark} />
      <ellipse cx="12" cy="8" rx="8" ry="4" fill={C.rubber} />
      <ellipse cx="12" cy="8" rx="3" ry="1.5" fill={C.stone} />
    </>
  ),
  toolbox: (
    <>
      <rect x="9" y="3" width="6" height="2" rx="1" fill={C.metalDark} />
      <path d="M9 5h6v2h-6z" fill={C.metalDark} />
      <rect x="3" y="7" width="18" height="12" rx="2.5" fill={C.red} />
      <rect x="3" y="11" width="18" height="2" fill={C.redDark} />
      <rect x="9.5" y="9.5" width="5" height="3" rx="1" fill={C.metal} />
    </>
  ),
  workbench: (
    <>
      <rect x="2" y="8" width="20" height="4" rx="1.5" fill={C.woodLight} />
      <rect x="2" y="11" width="20" height="2" rx="1" fill={C.woodDark} />
      <rect x="4" y="13" width="3" height="8" rx="1.2" fill={C.wood} />
      <rect x="17" y="13" width="3" height="8" rx="1.2" fill={C.wood} />
      <rect x="8" y="4" width="3" height="4" rx="1.4" fill={C.metal} />
      <rect x="13" y="3" width="2" height="5" rx="1" fill={C.metalDark} />
    </>
  ),
  shelf: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" fill={C.wood} />
      <rect x="5" y="5" width="14" height="4.5" rx="1" fill={C.woodDark} />
      <rect x="5" y="11" width="14" height="4.5" rx="1" fill={C.woodDark} />
      <rect x="5" y="17" width="14" height="2.5" rx="1" fill={C.woodDark} />
      <rect x="6" y="5.8" width="3" height="3" rx="0.8" fill={C.orange} />
      <rect x="10" y="5.8" width="3" height="3" rx="0.8" fill={C.teal} />
      <rect x="6" y="11.8" width="4" height="3" rx="0.8" fill={C.yellow} />
    </>
  ),
  counter: (
    <>
      <rect x="2" y="7" width="20" height="4" rx="1.5" fill={C.stone} />
      <rect x="3" y="11" width="18" height="10" rx="2" fill={C.wood} />
      <rect x="3" y="14" width="18" height="1.5" fill={C.woodDark} />
      <circle cx="8" cy="17.5" r="1.1" fill={C.metalDark} />
      <circle cx="16" cy="17.5" r="1.1" fill={C.metalDark} />
    </>
  ),
  barrel: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="4" fill={C.orange} />
      <rect x="6" y="7" width="12" height="2" fill={C.woodDark} />
      <rect x="6" y="15" width="12" height="2" fill={C.woodDark} />
      <ellipse cx="12" cy="4.5" rx="6" ry="1.8" fill={C.woodLight} />
    </>
  ),
  mat: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" fill={C.rubber} />
      <rect x="4" y="8" width="16" height="1.6" rx="0.8" fill="#5d5a6e" />
      <rect x="4" y="11.2" width="16" height="1.6" rx="0.8" fill="#5d5a6e" />
      <rect x="4" y="14.4" width="16" height="1.6" rx="0.8" fill="#5d5a6e" />
    </>
  ),
  pallet: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="1.5" fill={C.wood} />
      <rect x="2" y="8.5" width="20" height="1.8" fill={C.woodDark} />
      <rect x="2" y="13.5" width="20" height="1.8" fill={C.woodDark} />
      <rect x="6" y="5" width="1.8" height="14" fill={C.woodDark} />
      <rect x="16.2" y="5" width="1.8" height="14" fill={C.woodDark} />
    </>
  ),

  chair,
  plant,
};
