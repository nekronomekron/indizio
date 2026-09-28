import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { isLocale } from '../../shared/i18n/i18n.js';
import { HOLD_MS_MAX, HOLD_MS_MIN, type Settings } from './settings.js';
import { cx } from '../../shared/ui/cx.js';
import button from '../../shared/ui/button.module.css';
import dialog from '../../shared/ui/dialog.module.css';
import text from '../../shared/ui/text.module.css';
import styles from './SettingsDialog.module.css';

/**
 * Settings.
 *
 * `holdMs` and `vibrate` sat in storage for a long time with *no UI* — the
 * only way to change them was editing browser storage by hand. A heavy hand or
 * a slow device needs a longer hold; someone playing on the train may not want
 * the buzz.
 *
 * The same dialog layout as the rules, so it stays one pattern, not two.
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
    <div className={dialog.overlay} role="dialog" aria-modal="true" aria-label={t('settings')}>
      <div className={cx(dialog.panel, styles.panel)}>
        <h2>{t('settings')}</h2>

        <label className={styles.setting}>
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

        <label className={styles.setting}>
          <span>
            {t('holdTime')}
            <small>{settings.holdMs} ms</small>
          </span>
          <input
            type="range"
            min={HOLD_MS_MIN}
            max={HOLD_MS_MAX}
            step={50}
            value={settings.holdMs}
            onChange={(event) => onChange({ ...settings, holdMs: Number(event.target.value) })}
          />
        </label>
        <p className={cx(text.hintLine, styles.why)}>{t('holdTimeWhy')}</p>

        <label className={styles.setting}>
          <span>{t('vibrate')}</span>
          <input
            type="checkbox"
            checked={settings.vibrate}
            onChange={(event) => onChange({ ...settings, vibrate: event.target.checked })}
          />
        </label>

        <label className={styles.setting}>
          <span>{t('cellNames')}</span>
          <input
            type="checkbox"
            checked={settings.names}
            onChange={(event) => onChange({ ...settings, names: event.target.checked })}
          />
        </label>

        <div className={dialog.actions}>
          <button type="button" className={button.primary} onClick={onClose}>
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
