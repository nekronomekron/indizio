import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Sprite } from '../art/Sprite.js';
import { TUTORIAL_ICONS } from './tutorialIcons.js';

export interface TutorialProps {
  onDone: () => void;
}

/** The six-step tutorial, shown automatically before the first case. */
export function Tutorial({ onDone }: TutorialProps): ReactElement {
  const { t } = useTranslation('help');
  const steps = t('tutorial', { returnObjects: true });
  const [step, setStep] = useState(0);
  const current = steps[step]!;
  const icon = TUTORIAL_ICONS[step];
  const last = step === steps.length - 1;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={current.title}>
      <div className="panel tutorial">
        <div className="tutorial-top">
          <span className="step-count">
            {String(step + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
          </span>
          <button type="button" className="ghost" onClick={onDone}>
            {t('skip')}
          </button>
        </div>
        {icon && (
          <Sprite
            name={icon.name}
            size={64}
            {...(icon.kind && { kind: icon.kind })}
            {...(icon.theme && { theme: icon.theme })}
          />
        )}
        <h2>{current.title}</h2>
        <p>{current.body}</p>
        <div className="tutorial-dots" aria-hidden="true">
          {steps.map((_, i) => (
            <span key={i} className={'dot' + (i === step ? ' on' : '')} />
          ))}
        </div>
        <div className="actions">
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)}>
              {t('prev')}
            </button>
          )}
          <button type="button" className="primary" onClick={() => (last ? onDone() : setStep(step + 1))}>
            {last ? t('start') : t('next')}
          </button>
        </div>
      </div>
    </div>
  );
}

const TABS = ['rules', 'keywords', 'techniques', 'faq'] as const;
type Tab = (typeof TABS)[number];

interface Term {
  term: string;
  text: string;
}

function TermList({ items }: { items: readonly Term[] }): ReactElement {
  return (
    <dl className="terms">
      {items.map((item) => (
        <div key={item.term}>
          <dt>{item.term}</dt>
          <dd>{item.text}</dd>
        </div>
      ))}
    </dl>
  );
}

export interface RulesDialogProps {
  onClose: () => void;
}

/** The rules, always within reach, in four sections. */
export function RulesDialog({ onClose }: RulesDialogProps): ReactElement {
  const { t } = useTranslation('help');
  const { t: tUi } = useTranslation('ui');
  const [tab, setTab] = useState<Tab>('rules');

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={t('tabs.rules')}>
      <div className="panel rules-panel">
        <div className="rules-head">
          <h2>{t(`tabs.${tab}`)}</h2>
          <button type="button" className="ghost" onClick={onClose}>
            {tUi('close')}
          </button>
        </div>
        <div className="tabs" role="tablist">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={'tab' + (tab === key ? ' active' : '')}
              onClick={() => setTab(key)}
            >
              {t(`tabs.${key}`)}
            </button>
          ))}
        </div>

        <div className="rules-body">
          {tab === 'rules' && (
            <>
              <p className="lead">{t('goal')}</p>
              <ul className="bullets">
                {t('rules', { returnObjects: true }).map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
              <TermList items={t('controls', { returnObjects: true })} />
            </>
          )}
          {tab === 'keywords' && <TermList items={t('keywords.items', { returnObjects: true })} />}
          {tab === 'techniques' && <TermList items={t('techniques.items', { returnObjects: true })} />}
          {tab === 'faq' && <TermList items={t('faq', { returnObjects: true })} />}
        </div>
      </div>
    </div>
  );
}
