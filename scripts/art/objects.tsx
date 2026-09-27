import type { ReactNode } from 'react';
import { C } from './palette.js';

/**
 * Requisiten als flache Vektorformen im 24×24-Raster.
 *
 * Ein Grundton je Material, ein dunklerer Ton für Tiefe, abgerundete Ecken,
 * keine Konturen. Jede Form ist auf ihre Silhouette reduziert — bei 24 px im
 * Gitter genauso lesbar wie groß in der Anleitung.
 *
 * **Eine Form je Objekt, nicht je Grundfläche.** Ein Bett belegt mal zwei
 * Felder waagerecht, mal zwei senkrecht; die Platzhalter setzen dafür das
 * Sinnbild auf eine Platte in der Größe der Grundfläche (siehe
 * `build-art.ts`). Die endgültigen Grafiken zeichnen jede Grundfläche
 * eigens — dafür gibt es je Variante eine Datei.
 */
export const OBJECT_SHAPES: Record<string, ReactNode> = {
  // --- Werkstatt ---------------------------------------------------------
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

  // --- Wohnung -----------------------------------------------------------
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
  chair: (
    <>
      <rect x="6" y="2" width="12" height="9" rx="2.5" fill={C.wood} />
      <rect x="7.5" y="3.5" width="9" height="6" rx="1.5" fill={C.woodLight} />
      <rect x="5" y="11" width="14" height="4" rx="1.8" fill={C.woodDark} />
      <rect x="6.5" y="15" width="2.6" height="6" rx="1.2" fill={C.wood} />
      <rect x="14.9" y="15" width="2.6" height="6" rx="1.2" fill={C.wood} />
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
  plant: (
    <>
      <ellipse cx="12" cy="8.5" rx="7.5" ry="6" fill={C.green} />
      <ellipse cx="8.5" cy="7" rx="3" ry="2.6" fill={C.leaf} />
      <rect x="11.2" y="12" width="1.6" height="4" fill={C.greenDark} />
      <path d="M8 16h8l-1.2 5.5H9.2Z" fill={C.orange} />
    </>
  ),

  // --- Garten ------------------------------------------------------------
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
