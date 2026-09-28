import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_VERSION } from '../version.js';
import styles from './Footer.module.css';

/**
 * Height of the footer in pixels.
 *
 * The game screen sizes the grid from the viewport rather than a measurement
 * (predictable, independent of when rendering happens). So it has to know how
 * much space below it is taken — otherwise the footer would push the board out
 * of view.
 */
export const FOOTER_PX = 30; // Twin of --footer-h in shared/styles/tokens.css

/**
 * The footer with name and version.
 *
 * On every screen, because it is needed exactly when something is wrong:
 * whoever reports a bug should be able to say, without being asked, which
 * build they are looking at.
 */
export function Footer(): ReactElement {
  const { t } = useTranslation();
  return (
    <footer className={styles.footer}>
      <span>{t('appTitle')}</span>
      <span className={styles.version} title={t('version')}>
        {APP_VERSION}
      </span>
    </footer>
  );
}
