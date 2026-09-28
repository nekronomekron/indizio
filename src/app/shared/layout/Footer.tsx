import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_VERSION } from '../version.js';
import styles from './Footer.module.css';

/**
 * Hoehe des Footers in Pixeln.
 *
 * Der Spielbildschirm rechnet die Gittergroesse aus dem Viewport statt aus einer
 * Messung (vorhersagbar, unabhaengig vom Renderzeitpunkt). Damit muss er wissen,
 * wieviel Platz unter ihm belegt ist — sonst schoebe der Footer das Brett aus
 * dem Bild.
 */
export const FOOTER_PX = 30; // Zwilling von --footer-h in styles/base.css

/**
 * Die Fusszeile mit Name und Versionsnummer.
 *
 * Steht auf jedem Bildschirm, weil ihr Zweck genau dann eintritt, wenn etwas
 * nicht stimmt: Wer einen Fehler meldet, soll ohne Nachfrage sagen koennen,
 * welchen Stand er vor sich hat.
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
