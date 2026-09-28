import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { classNames, cssModules, declarationFor, declarationPath } from '../scripts/css-types.js';

/**
 * Every CSS module has an up-to-date declaration of its class names, so a
 * misspelt class is a compile error. `npm run css:types` writes them.
 */
describe('CSS module types', () => {
  it('finds the stylesheets', () => {
    expect(cssModules().length).toBeGreaterThan(10);
  });

  it('are up to date', () => {
    const stale = cssModules().filter((path) => {
      try {
        return readFileSync(declarationPath(path), 'utf8') !== declarationFor(readFileSync(path, 'utf8'));
      } catch {
        return true;
      }
    });
    expect(stale, 'run `npm run css:types`').toEqual([]);
  });

  it('read class names the way Vite does', () => {
    const css = `
      /* .commented-out { } */
      .room-label.hovered { opacity: 0.5; margin: 1.05rem; }
      button.primary:hover { background: url(x.png); }
      .tier-veryEasy > span { transition: filter 0.12s ease; }
    `;
    expect(classNames(css)).toEqual(['hovered', 'primary', 'roomLabel', 'tierVeryEasy']);
  });
});
