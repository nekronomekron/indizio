import { useRef, type ReactElement } from 'react';
import { Sprite } from '../render/Sprite.js';
import type { Tool } from '../state/game.js';

export interface ToolbarProps {
  tool: Tool;
  canUndo: boolean;
  canCheck: boolean;
  onTool: (tool: Tool) => void;
  onUndo: () => void;
  onClearAll: () => void;
  onHint: () => void;
  onCheck: () => void;
  labels: Record<string, string>;
}

export function Toolbar(props: ToolbarProps): ReactElement {
  const { tool, canUndo, canCheck, onTool, onUndo, onClearAll, onHint, onCheck, labels } = props;
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
    <div className="toolbar">
      <div className="tools">
        <button
          type="button"
          className={'tool' + (tool === 'mark' ? ' active' : '')}
          onClick={() => onTool(tool === 'mark' ? 'place' : 'mark')}
          title={labels['mark']}
        >
          <Sprite kind="icons" name="ui-x" size={24} />
        </button>
        <button
          type="button"
          className={'tool' + (tool === 'erase' ? ' active' : '')}
          onPointerDown={startEraserHold}
          onPointerUp={endEraserHold}
          onPointerLeave={() => {
            if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
            holdTimer.current = null;
          }}
          title={labels['erase']}
        >
          <Sprite kind="icons" name="ui-eraser" size={24} />
        </button>
        <button type="button" className="tool" onClick={onUndo} disabled={!canUndo} title={labels['undo']}>
          <Sprite kind="icons" name="ui-undo" size={24} />
        </button>
        <button type="button" className="tool" onClick={onHint} title={labels['hint']}>
          <Sprite kind="icons" name="ui-hint" size={24} />
        </button>
      </div>
      <button type="button" className="confirm" onClick={onCheck} disabled={!canCheck}>
        <Sprite kind="icons" name="ui-check" size={20} />
        <span>{labels['confirm']}</span>
        {!canCheck && <small>{labels['confirmHint']}</small>}
      </button>
    </div>
  );
}
