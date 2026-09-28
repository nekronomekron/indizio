import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderWithI18n } from './support/render.js';
import { describe, expect, it } from 'vitest';
import { nextAppVersion, parseAppVersion, readAppVersion } from '../scripts/app-version.js';
import { Footer } from '../src/app/shared/layout/Footer.js';
import { APP_VERSION } from '../src/app/shared/version.js';

/**
 * Eine Versionsnummer taugt nur, solange man ihr glauben kann. Geprueft wird
 * deshalb beides: dass das Format stimmt und dass die Nummer in der Oberflaeche
 * dieselbe ist wie die in der `package.json`.
 */

const FORMAT = /^\d{4}\.\d+$/;

describe('Versionsnummer', () => {
  it('hat das Format <Jahr>.<Nummer>', () => {
    expect(APP_VERSION).toMatch(FORMAT);
  });

  it('ist dieselbe wie in der package.json', () => {
    // Die Nummer wird beim Bauen eingesetzt. Laeuft das schief, zeigt die
    // Oberflaeche einen alten Stand an, ohne dass irgendetwas kaputtgeht -
    // genau die Sorte Fehler, die man nur mit einem Test bemerkt.
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as { version: string };
    expect(APP_VERSION).toBe(pkg.version);
    expect(readAppVersion().text).toBe(pkg.version);
  });

  it('zaehlt im selben Jahr weiter', () => {
    const next = nextAppVersion(parseAppVersion('2026.3'), new Date('2026-09-20'));
    expect(next.text).toBe('2026.4');
  });

  it('faengt im neuen Jahr wieder bei eins an', () => {
    // Sonst sagte '2027.58' nicht mehr, ob 58 Aenderungen in einem Jahr oder
    // in fuenf passiert sind.
    const next = nextAppVersion(parseAppVersion('2026.57'), new Date('2027-01-02'));
    expect(next.text).toBe('2027.1');
  });

  it('zaehlt auch ueber zehn hinaus als Zahl, nicht als Text', () => {
    expect(nextAppVersion(parseAppVersion('2026.9'), new Date('2026-05-01')).text).toBe('2026.10');
    expect(nextAppVersion(parseAppVersion('2026.99'), new Date('2026-05-01')).text).toBe('2026.100');
  });

  it('weist eine Nummer zurueck, die nicht auf das Format passt', () => {
    for (const kaputt of ['0.1.0', '2026', 'v2026.1', '2026.', '26.1', '']) {
      expect(() => parseAppVersion(kaputt), kaputt).toThrow();
    }
  });
});

describe('Fusszeile', () => {
  it('zeigt Name und Version', () => {
    const markup = renderWithI18n(createElement(Footer), 'de');
    expect(markup).toContain('Indizio');
    expect(markup).toContain(APP_VERSION);
  });

  it('beschriftet die Nummer in der gewaehlten Sprache', () => {
    expect(renderWithI18n(createElement(Footer), 'de')).toContain('title="Version"');
    expect(renderWithI18n(createElement(Footer), 'en')).toContain('title="Version"');
  });
});
