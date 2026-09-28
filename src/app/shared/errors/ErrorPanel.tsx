import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { UiResource } from '../i18n/resources/en/ui.js';
import status from '../layout/StatusScreen.module.css';

/** Every failure the player can be told about, each with a title and an explanation. */
export type ErrorKind = keyof UiResource['errors'];

export interface ErrorPanelProps {
  kind: ErrorKind;
  /** Technical detail — folded away, but at hand when reporting a bug. */
  detail?: string;
  /** What the player can do about it: back, reload … */
  action: ReactNode;
}

/**
 * A failure, shown to the player (PLAN.md §14, U8): a readable, translated
 * message first, the technical detail folded below. Nothing is sent anywhere.
 */
export function ErrorPanel({ kind, detail, action }: ErrorPanelProps): ReactElement {
  const { t } = useTranslation();
  return (
    <div className={status.status} role="alert">
      <div className={status.inner}>
        <p>{t(`errors.${kind}.title`)}</p>
        <small>{t(`errors.${kind}.text`)}</small>
        {detail !== undefined && detail !== '' && (
          <details className={status.details}>
            <summary>{t('errorDetails')}</summary>
            <code>{detail}</code>
          </details>
        )}
        {action}
      </div>
    </div>
  );
}
