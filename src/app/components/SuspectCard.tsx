import type { Suspect } from '@engine';
import { Sprite } from '../render/Sprite.js';

export interface SuspectCardProps {
  suspect: Suspect;
  clue: string;
  letter: string;
  selected: boolean;
  placed: boolean;
  onSelect: () => void;
}

export function SuspectCard({ suspect, clue, letter, selected, placed, onSelect }: SuspectCardProps) {
  const classes = ['card'];
  if (selected) classes.push('selected');
  if (placed) classes.push('placed');
  if (suspect.isVictim) classes.push('victim');

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="card-portrait">
        <Sprite kind="characters" name={suspect.portraitKey} size={48} />
        <span className="card-letter">{letter}</span>
        {suspect.isVictim && <span className="card-badge"><Sprite kind="icons" name="ui-victim" size={18} /></span>}
        {placed && !suspect.isVictim && <span className="card-badge"><Sprite kind="icons" name="ui-check" size={18} /></span>}
      </span>
      <span className="card-body">
        <span className="card-name">{suspect.name}</span>
        <span className="card-clue">{clue}</span>
      </span>
    </button>
  );
}
