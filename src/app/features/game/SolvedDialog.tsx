import { useState, type ReactElement } from 'react';
import type { Locale } from '@engine/i18n';
import type { PuzzleCore } from '@engine';
import { t } from '../../shared/i18n/uiTexts.js';
import { Sprite } from '../../shared/art/Sprite.js';

export function SolvedDialog({
  core,
  locale,
  elapsedMs,
  hintsUsed,
  onBack,
}: {
  core: PuzzleCore;
  locale: Locale;
  elapsedMs: number;
  hintsUsed: number;
  onBack: () => void;
}): ReactElement {
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
      /* Zwischenablage nicht verfuegbar */
    }
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="panel solved-panel">
        <h2>{t(locale, 'solvedTitle')}</h2>
        <div className="reveal">
          <div className="reveal-person">
            <Sprite kind="characters" name={murderer.portraitKey} size={64} />
            <span className="reveal-role">{t(locale, 'murdererIs')}</span>
            <strong>{murderer.name}</strong>
          </div>
          <div className="reveal-person dim">
            <Sprite kind="characters" name={victim.portraitKey} size={64} />
            <span className="reveal-role">{t(locale, 'victimWas')}</span>
            <strong>{victim.name}</strong>
          </div>
        </div>
        <dl className="stats">
          <div>
            <dt>{t(locale, 'time')}</dt>
            <dd>
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
            </dd>
          </div>
          <div>
            <dt>{t(locale, 'hintsUsed')}</dt>
            <dd>{hintsUsed}</dd>
          </div>
        </dl>
        <div className="actions">
          <button type="button" className="primary" onClick={onBack}>
            {t(locale, 'again')}
          </button>
          {/* Absichtlich abgeschickt und nicht abgewartet: `share` fängt selbst
              ab, wenn die Zwischenablage fehlt. Ohne das `void` übergäbe man
              dem Klick ein Versprechen, das niemand einlöst. */}
          <button
            type="button"
            onClick={() => {
              void share();
            }}
          >
            {copied ? t(locale, 'copied') : t(locale, 'share')}
          </button>
          <button type="button" onClick={() => window.print()}>
            {t(locale, 'print')}
          </button>
        </div>
        <p className="seed-line">{core.seed}</p>
      </div>
    </div>
  );
}
