import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { isLocale } from '../../shared/i18n/i18n.js';
import type { Settings } from './settings.js';

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
  onChange,
  onClose,
}: {
  settings: Settings;
  onChange: (next: Settings) => void;
  onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={t('settings')}>
      <div className="panel settings-panel">
        <h2>{t('settings')}</h2>

        <label className="setting">
          <span>{t('language')}</span>
          <select
            value={settings.locale}
            onChange={(event) => {
              const locale = event.target.value;
              if (isLocale(locale)) onChange({ ...settings, locale });
            }}
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </label>

        <label className="setting">
          <span>
            {t('holdTime')}
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
        <p className="hint-line">{t('holdTimeWhy')}</p>

        <label className="setting">
          <span>{t('vibrate')}</span>
          <input
            type="checkbox"
            checked={settings.vibrate}
            onChange={(event) => onChange({ ...settings, vibrate: event.target.checked })}
          />
        </label>

        <label className="setting">
          <span>{t('cellNames')}</span>
          <input
            type="checkbox"
            checked={settings.names}
            onChange={(event) => onChange({ ...settings, names: event.target.checked })}
          />
        </label>

        <div className="actions">
          <button type="button" className="primary" onClick={onClose}>
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
