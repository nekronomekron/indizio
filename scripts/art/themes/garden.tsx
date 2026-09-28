import type { ReactNode } from 'react';
import { C } from '../palette.js';

/** Placeholder shapes of the backyard garden, one per object key (24×24, see ../../build-art.ts). */
export const gardenShapes: Record<string, ReactNode> = {
  tree: (
    <>
      <circle cx="12" cy="9" r="7.5" fill={C.green} />
      <circle cx="9" cy="7" r="3" fill={C.leaf} />
      <rect x="10.5" y="15" width="3" height="6.5" rx="1.2" fill={C.woodDark} />
    </>
  ),
  bush: (
    <>
      <ellipse cx="12" cy="14" rx="9" ry="6.5" fill={C.greenDark} />
      <circle cx="8.5" cy="11" r="4" fill={C.green} />
      <circle cx="15" cy="11.5" r="4.5" fill={C.green} />
      <circle cx="12" cy="9.5" r="3.4" fill={C.leaf} />
    </>
  ),
  flowerbed: (
    <>
      <rect x="2" y="10" width="20" height="10" rx="2" fill={C.soil} />
      <rect x="2" y="10" width="20" height="2.5" rx="1.2" fill="#6f5439" />
      <circle cx="7" cy="7" r="2.6" fill={C.pink} />
      <circle cx="7" cy="7" r="1" fill={C.yellow} />
      <circle cx="13" cy="6" r="2.6" fill={C.red} />
      <circle cx="13" cy="6" r="1" fill={C.yellow} />
      <circle cx="18" cy="7.5" r="2.4" fill={C.purple} />
      <circle cx="18" cy="7.5" r="0.9" fill={C.yellow} />
    </>
  ),
  gardenchair: (
    <>
      <rect x="6" y="2" width="12" height="9" rx="2.5" fill={C.green} />
      <rect x="7.5" y="3.5" width="9" height="2" rx="1" fill={C.leaf} />
      <rect x="7.5" y="7" width="9" height="2" rx="1" fill={C.leaf} />
      <rect x="5" y="11" width="14" height="4" rx="1.8" fill={C.greenDark} />
      <rect x="6.5" y="15" width="2.6" height="6" rx="1.2" fill={C.green} />
      <rect x="14.9" y="15" width="2.6" height="6" rx="1.2" fill={C.green} />
    </>
  ),
  bench: (
    <>
      <rect x="2" y="6" width="20" height="3" rx="1.4" fill={C.wood} />
      <rect x="2" y="10" width="20" height="4" rx="1.6" fill={C.woodLight} />
      <rect x="2" y="13" width="20" height="1.6" fill={C.woodDark} />
      <rect x="4" y="15" width="2.6" height="6" rx="1.2" fill={C.woodDark} />
      <rect x="17.4" y="15" width="2.6" height="6" rx="1.2" fill={C.woodDark} />
    </>
  ),
  pond: (
    <>
      <ellipse cx="12" cy="12" rx="10" ry="8" fill={C.waterDark} />
      <ellipse cx="12" cy="12" rx="8.4" ry="6.5" fill={C.water} />
      <ellipse cx="9" cy="9.5" rx="2.6" ry="1.4" fill="#8fd4f2" />
      <ellipse cx="15.5" cy="14" rx="3" ry="1.8" fill={C.green} />
    </>
  ),
  shed: (
    <>
      <path d="M12 2 L22 9 H2 Z" fill={C.red} />
      <rect x="4" y="9" width="16" height="12" rx="1.5" fill={C.wood} />
      <rect x="9" y="12" width="6" height="9" rx="1" fill={C.woodDark} />
      <circle cx="13.6" cy="16.5" r="0.9" fill={C.yellow} />
    </>
  ),
  steppingstone: (
    <>
      <ellipse cx="12" cy="13" rx="9" ry="6.5" fill={C.stoneDark} />
      <ellipse cx="12" cy="12" rx="8" ry="5.6" fill={C.stone} />
      <ellipse cx="9.5" cy="10.5" rx="2.6" ry="1.6" fill="#c2bfcf" />
    </>
  ),
  sandbox: (
    <>
      <rect x="2" y="5" width="20" height="15" rx="2" fill={C.wood} />
      <rect x="4.5" y="7.5" width="15" height="10" rx="1.5" fill={C.sand} />
      <circle cx="10" cy="12" r="1.6" fill="#d8bd80" />
      <circle cx="15" cy="14.5" r="1.2" fill="#d8bd80" />
    </>
  ),
  wheelbarrow: (
    <>
      <path d="M3 7h14l-2.5 8H5.5Z" fill={C.metal} />
      <path d="M3 7h14l-0.6 2H3.6Z" fill={C.metalDark} />
      <rect x="16" y="8" width="6" height="2" rx="1" transform="rotate(20 16 8)" fill={C.woodDark} />
      <circle cx="8" cy="18.5" r="3" fill={C.rubber} />
      <circle cx="8" cy="18.5" r="1.2" fill={C.stone} />
    </>
  ),
};
