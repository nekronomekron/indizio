import type { ReactElement } from 'react';
import type { Suspect } from '@engine';
import { Sprite } from '../../shared/art/Sprite.js';
import { cx } from '../../shared/ui/cx.js';
import styles from './SuspectCard.module.css';

export interface SuspectCardProps {
  suspect: Suspect;
  clue: string;
  letter: string;
  selected: boolean;
  placed: boolean;
  onSelect: () => void;
}

export function SuspectCard({
  suspect,
  clue,
  letter,
  selected,
  placed,
  onSelect,
}: SuspectCardProps): ReactElement {
  const className = cx(
    styles.card,
    selected && styles.selected,
    placed && styles.placed,
    suspect.isVictim && styles.victim,
  );

  return (
    <button type="button" className={className} onClick={onSelect} aria-pressed={selected}>
      <span className={styles.portrait}>
        <Sprite kind="characters" name={suspect.portraitKey} size={48} />
        <span className={styles.letter}>{letter}</span>
        {suspect.isVictim && (
          <span className={styles.badge}>
            <Sprite kind="icons" name="ui-victim" size={18} />
          </span>
        )}
        {placed && !suspect.isVictim && (
          <span className={styles.badge}>
            <Sprite kind="icons" name="ui-check" size={18} />
          </span>
        )}
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{suspect.name}</span>
        <span className={styles.clue}>{clue}</span>
      </span>
    </button>
  );
}
