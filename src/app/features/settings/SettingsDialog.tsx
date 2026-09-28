import type { ReactElement } from 'react';
import { t } from '../../shared/i18n/uiTexts.js';
import type { Settings } from './settings.js';
import type { Locale } from '../../shared/types.js';

/**
 * Einstellungen.
 *
 * `holdMs` und `vibrate` lagen seit Langem im Speicher und hatten **keine
 * Oberfläche** — man konnte sie nur ändern, indem man den Browserspeicher von
 * Hand bearbeitete. Wer eine schwere Hand hat oder ein träges Gerät, braucht
 * eine längere Haltedauer; wer in der Bahn spielt, will vielleicht kein Rütteln.
 *
 * Derselbe Dialogaufbau wie die Spielanleitung, damit es ein Muster bleibt und
 * kein zweites.
 */
export function SettingsDialog({
  settings,
  locale,
  onChange,
  onClose,
}: {
  settings: Settings;
  locale: Locale;
  onChange: (next: Settings) => void;
  onClose: () => void;
}): ReactElement {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={t(locale, 'settings')}>
      <div className="panel settings-panel">
        <h2>{t(locale, 'settings')}</h2>

        <label className="setting">
          <span>{t(locale, 'language')}</span>
          <select
            value={settings.locale}
            onChange={(event) => onChange({ ...settings, locale: event.target.value as Locale })}
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </label>

        <label className="setting">
          <span>
            {t(locale, 'holdTime')}
            <small>{settings.holdMs} ms</small>
          </span>
          <input
            type="range"
            min={200}
            max={600}
            step={50}
            value={settings.holdMs}
            onChange={(event) => onChange({ ...settings, holdMs: Number(event.target.value) })}
          />
        </label>
        <p className="hint-line">{t(locale, 'holdTimeWhy')}</p>

        <label className="setting">
          <span>{t(locale, 'vibrate')}</span>
          <input
            type="checkbox"
            checked={settings.vibrate}
            onChange={(event) => onChange({ ...settings, vibrate: event.target.checked })}
          />
        </label>

        <label className="setting">
          <span>{t(locale, 'cellNames')}</span>
          <input
            type="checkbox"
            checked={settings.names}
            onChange={(event) => onChange({ ...settings, names: event.target.checked })}
          />
        </label>

        <div className="actions">
          <button type="button" className="primary" onClick={onClose}>
            {t(locale, 'close')}
          </button>
        </div>
      </div>
    </div>
  );
}
