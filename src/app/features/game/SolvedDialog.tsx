import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { PuzzleCore } from '@engine';
import { Sprite } from '../../shared/art/Sprite.js';
import { cx } from '../../shared/ui/cx.js';
import button from '../../shared/ui/button.module.css';
import dialog from '../../shared/ui/dialog.module.css';
import styles from './SolvedDialog.module.css';

export function SolvedDialog({
  core,
  elapsedMs,
  hintsUsed,
  onBack,
}: {
  core: PuzzleCore;
  elapsedMs: number;
  hintsUsed: number;
  onBack: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const murderer = core.suspects[core.murdererId]!;
  const victim = core.suspects.find((s) => s.isVictim)!;
  const seconds = Math.floor(elapsedMs / 1000);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard available: nothing to share with.
    }
  };

  return (
    <div className={dialog.overlay} role="dialog" aria-modal="true">
      <div className={cx(dialog.panel, styles.panel)}>
        <h2>{t('solvedTitle')}</h2>
        <div className={styles.reveal}>
          <div className={styles.person}>
            <Sprite kind="characters" name={murderer.portraitKey} size={64} />
            <span className={styles.role}>{t('murdererIs')}</span>
            <strong>{murderer.name}</strong>
          </div>
          <div className={cx(styles.person, styles.faded)}>
            <Sprite kind="characters" name={victim.portraitKey} size={64} />
            <span className={styles.role}>{t('victimWas')}</span>
            <strong>{victim.name}</strong>
          </div>
        </div>
        <dl className={styles.stats}>
          <div>
            <dt>{t('time')}</dt>
            <dd>
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
            </dd>
          </div>
          <div>
            <dt>{t('hintsUsed')}</dt>
            <dd>{hintsUsed}</dd>
          </div>
        </dl>
        <div className={dialog.actions}>
          <button type="button" className={button.primary} onClick={onBack}>
            {t('again')}
          </button>
          {/* Fired and deliberately not awaited: `share` handles a missing
              clipboard itself. Without the `void` the click would be handed a
              promise nobody keeps. */}
          <button
            type="button"
            onClick={() => {
              void share();
            }}
          >
            {copied ? t('copied') : t('share')}
          </button>
          <button type="button" onClick={() => window.print()}>
            {t('print')}
          </button>
        </div>
        <p className={styles.seed}>{core.seed}</p>
      </div>
    </div>
  );
}
