import { useState, type ReactElement } from 'react';
import { HELP } from '../help.js';
import { t } from '../i18n.js';
import { Sprite } from '../render/Sprite.js';
import type { Locale } from '../types.js';

/** Sechsschrittiges Tutorial, beim ersten Fall automatisch. */
export function Tutorial({ locale, onDone }: { locale: Locale; onDone: () => void }): ReactElement {
  const help = HELP[locale];
  const [step, setStep] = useState(0);
  const current = help.tutorial[step]!;
  const last = step === help.tutorial.length - 1;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={current.title}>
      <div className="panel tutorial">
        <div className="tutorial-top">
          <span className="step-count">
            {String(step + 1).padStart(2, '0')} / {String(help.tutorial.length).padStart(2, '0')}
          </span>
          <button type="button" className="ghost" onClick={onDone}>
            {help.skip}
          </button>
        </div>
        <Sprite
          name={current.icon}
          size={64}
          {...(current.iconKind && { kind: current.iconKind })}
          {...(current.iconTheme && { theme: current.iconTheme })}
        />
        <h2>{current.title}</h2>
        <p>{current.body}</p>
        <div className="tutorial-dots" aria-hidden="true">
          {help.tutorial.map((_, i) => (
            <span key={i} className={'dot' + (i === step ? ' on' : '')} />
          ))}
        </div>
        <div className="actions">
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)}>
              {help.prev}
            </button>
          )}
          <button type="button" className="primary" onClick={() => (last ? onDone() : setStep(step + 1))}>
            {last ? help.start : help.next}
          </button>
        </div>
      </div>
    </div>
  );
}

type Tab = 'rules' | 'keywords' | 'techniques' | 'faq';

/** Dauerhaft erreichbare Regelseite mit vier Abschnitten. */
export function RulesDialog({ locale, onClose }: { locale: Locale; onClose: () => void }): ReactElement {
  const help = HELP[locale];
  const [tab, setTab] = useState<Tab>('rules');

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={help.tabs.rules}>
      <div className="panel rules-panel">
        <div className="rules-head">
          <h2>{help.tabs[tab]}</h2>
          <button type="button" className="ghost" onClick={onClose}>
            {t(locale, 'close')}
          </button>
        </div>
        <div className="tabs" role="tablist">
          {(['rules', 'keywords', 'techniques', 'faq'] as Tab[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={'tab' + (tab === key ? ' active' : '')}
              onClick={() => setTab(key)}
            >
              {help.tabs[key]}
            </button>
          ))}
        </div>

        <div className="rules-body">
          {tab === 'rules' && (
            <>
              <p className="lead">{help.goal}</p>
              <ul className="bullets">
                {help.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
              <dl className="terms">
                {help.controls.map((item) => (
                  <div key={item.term}>
                    <dt>{item.term}</dt>
                    <dd>{item.text}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          {tab === 'keywords' && (
            <dl className="terms">
              {help.keywords.items.map((item) => (
                <div key={item.term}>
                  <dt>{item.term}</dt>
                  <dd>{item.text}</dd>
                </div>
              ))}
            </dl>
          )}
          {tab === 'techniques' && (
            <dl className="terms">
              {help.techniques.items.map((item) => (
                <div key={item.term}>
                  <dt>{item.term}</dt>
                  <dd>{item.text}</dd>
                </div>
              ))}
            </dl>
          )}
          {tab === 'faq' && (
            <dl className="terms">
              {help.faq.map((item) => (
                <div key={item.term}>
                  <dt>{item.term}</dt>
                  <dd>{item.text}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
