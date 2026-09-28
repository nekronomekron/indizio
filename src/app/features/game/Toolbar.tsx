import { useRef, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Sprite } from '../../shared/art/Sprite.js';
import type { Tool } from './gameReducer.js';
import { cx } from '../../shared/ui/cx.js';
import styles from './Toolbar.module.css';

export interface ToolbarProps {
  tool: Tool;
  canUndo: boolean;
  canCheck: boolean;
  onTool: (tool: Tool) => void;
  onUndo: () => void;
  onClearAll: () => void;
  onHint: () => void;
  onCheck: () => void;
}

export function Toolbar(props: ToolbarProps): ReactElement {
  const { t } = useTranslation();
  const { tool, canUndo, canCheck, onTool, onUndo, onClearAll, onHint, onCheck } = props;
  const holdTimer = useRef<number | null>(null);
  const cleared = useRef(false);

  const startEraserHold = () => {
    cleared.current = false;
    holdTimer.current = window.setTimeout(() => {
      cleared.current = true;
      onClearAll();
    }, 600);
  };
  const endEraserHold = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    if (!cleared.current) onTool(tool === 'erase' ? 'place' : 'erase');
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.tools}>
        <button
          type="button"
          className={cx(styles.tool, tool === 'mark' && styles.active)}
          onClick={() => onTool(tool === 'mark' ? 'place' : 'mark')}
          title={t('mark')}
        >
          <Sprite kind="icons" name="ui-x" size={24} />
        </button>
        <button
          type="button"
          className={cx(styles.tool, tool === 'erase' && styles.active)}
          onPointerDown={startEraserHold}
          onPointerUp={endEraserHold}
          onPointerLeave={() => {
            if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
            holdTimer.current = null;
          }}
          title={t('erase')}
        >
          <Sprite kind="icons" name="ui-eraser" size={24} />
        </button>
        <button type="button" className={styles.tool} onClick={onUndo} disabled={!canUndo} title={t('undo')}>
          <Sprite kind="icons" name="ui-undo" size={24} />
        </button>
        <button type="button" className={styles.tool} onClick={onHint} title={t('hint')}>
          <Sprite kind="icons" name="ui-hint" size={24} />
        </button>
      </div>
      <button type="button" className={styles.confirm} onClick={onCheck} disabled={!canCheck}>
        <Sprite kind="icons" name="ui-check" size={20} />
        <span>{t('confirm')}</span>
        {!canCheck && <small>{t('confirmHint')}</small>}
      </button>
    </div>
  );
}
