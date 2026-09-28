import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { nextAppVersion, parseAppVersion, readAppVersion } from '../scripts/app-version.js';
import { Footer } from '../src/app/shared/layout/Footer.js';
import { APP_VERSION } from '../src/app/shared/version.js';
import { renderWithI18n } from './support/render.js';

/**
 * A version number is only worth something while it can be believed. So both
 * are checked: that the format is right, and that the number in the UI is the
 * one in `package.json`.
 */

const FORMAT = /^\d{4}\.\d+$/;

describe('version', () => {
  it('has the format <year>.<number>', () => {
    expect(APP_VERSION).toMatch(FORMAT);
  });

  it('is the one in package.json', () => {
    // The number is filled in at build time. If that goes wrong, the UI shows
    // an old number without anything breaking — exactly the kind of bug only a
    // test notices.
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as { version: string };
    expect(APP_VERSION).toBe(pkg.version);
    expect(readAppVersion().text).toBe(pkg.version);
  });

  it('counts on within the same year', () => {
    const next = nextAppVersion(parseAppVersion('2026.3'), new Date('2026-09-20'));
    expect(next.text).toBe('2026.4');
  });

  it('starts at one again in a new year', () => {
    // Otherwise '2027.58' would no longer say whether 58 changes happened in
    // one year or in five.
    const next = nextAppVersion(parseAppVersion('2026.57'), new Date('2027-01-02'));
    expect(next.text).toBe('2027.1');
  });

  it('counts past ten as a number, not as text', () => {
    expect(nextAppVersion(parseAppVersion('2026.9'), new Date('2026-05-01')).text).toBe('2026.10');
    expect(nextAppVersion(parseAppVersion('2026.99'), new Date('2026-05-01')).text).toBe('2026.100');
  });

  it('refuses a number that does not fit the format', () => {
    for (const broken of ['0.1.0', '2026', 'v2026.1', '2026.', '26.1', '']) {
      expect(() => parseAppVersion(broken), broken).toThrow();
    }
  });
});

describe('footer', () => {
  it('shows name and version', () => {
    const markup = renderWithI18n(createElement(Footer), 'en');
    expect(markup).toContain('Indizio');
    expect(markup).toContain(APP_VERSION);
  });

  it('labels the number in the chosen language', () => {
    expect(renderWithI18n(createElement(Footer), 'de')).toContain('title="Version"');
    expect(renderWithI18n(createElement(Footer), 'en')).toContain('title="Version"');
  });
});
