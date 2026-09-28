/**
 * i18next resource bundle for English.
 *
 * Sentence patterns only. Room names and object word forms belong to each
 * theme (`content/themes/<key>/locales/`) and are added under `themes.<key>`.
 */
export const en = {
  common: {
    pronoun_male: 'He',
    pronoun_female: 'She',
    was: 'was',
    and: 'and',
    direction: {
      north: 'north',
      east: 'east',
      south: 'south',
      west: 'west',
    },
    axis: {
      row: 'row',
      column: 'column',
    },
  },
  clue: {
    VICTIM: 'The victim. {{pronoun}} was alone with the murderer.',
    ON_OBJECT: '{{pronoun}} {{verb}} {{place}}.',
    IN_ROOM: '{{pronoun}} was {{room}}.',
    ADJACENT_OBJECT_any: '{{pronoun}} was next to {{object}}.',
    ADJACENT_OBJECT_one: '{{pronoun}} was next to exactly one {{objectBare}}.',
    ADJACENT_OBJECT_other: '{{pronoun}} was next to exactly {{count}} {{objectPlural}}.',
    ALONE: '{{pronoun}} was alone.',
    ALONE_inRoom: '{{pronoun}} was alone {{room}}.',
    SAME_ROOM_AS: '{{pronoun}} was in the same area as {{name}}.',
    DIRECTION_OF_SUSPECT: '{{pronoun}} was {{direction}} of {{name}}.',
    DIRECTION_OF_OBJECT: '{{pronoun}} was {{direction}} of {{object}}.',
    CORNER: '{{pronoun}} stood in a corner of the room.',
    ALIGNED_WITH_OBJECT: '{{pronoun}} was in the same {{axis}} as {{object}}.',
    DIAGONAL_OF: '{{pronoun}} was on the same diagonal as {{name}}.',
    ALONE_WITH: '{{pronoun}} was alone with {{names}}.',
    EMPTY_ROOM: 'Nobody was {{room}}.',
    ROOM_COUNT_one: 'Exactly one person was {{room}}.',
    ROOM_COUNT_other: 'Exactly {{count}} people were {{room}}.',
  },
} as const;
