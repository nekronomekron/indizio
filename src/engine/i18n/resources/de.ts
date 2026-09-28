/**
 * i18next resource bundle for German.
 *
 * Sentence patterns only. Room names and object word forms belong to each
 * theme (`content/themes/<key>/locales/`) and are added under `themes.<key>`.
 */
export const de = {
  common: {
    pronoun_male: 'Er',
    pronoun_female: 'Sie',
    was: 'war',
    and: 'und',
    direction: {
      north: 'nördlich',
      east: 'östlich',
      south: 'südlich',
      west: 'westlich',
    },
    axis: {
      row: 'Reihe',
      column: 'Spalte',
    },
  },
  clue: {
    VICTIM: 'Das Opfer. {{pronoun}} war allein mit dem Mörder.',
    ON_OBJECT: '{{pronoun}} {{verb}} {{place}}.',
    IN_ROOM: '{{pronoun}} war {{room}}.',
    ADJACENT_OBJECT_any: '{{pronoun}} war neben {{object}}.',
    ADJACENT_OBJECT_one: '{{pronoun}} war neben genau {{object}}.',
    ADJACENT_OBJECT_other: '{{pronoun}} war neben genau {{count}} {{objectPlural}}.',
    ALONE: '{{pronoun}} war allein.',
    ALONE_inRoom: '{{pronoun}} war allein {{room}}.',
    SAME_ROOM_AS: '{{pronoun}} war im selben Bereich wie {{name}}.',
    DIRECTION_OF_SUSPECT: '{{pronoun}} war {{direction}} von {{name}}.',
    DIRECTION_OF_OBJECT: '{{pronoun}} war {{direction}} {{object}}.',
    CORNER: '{{pronoun}} stand in einer Ecke des Raumes.',
    ALIGNED_WITH_OBJECT: '{{pronoun}} war in derselben {{axis}} wie {{object}}.',
    DIAGONAL_OF: '{{pronoun}} war auf derselben Diagonale wie {{name}}.',
    ALONE_WITH: '{{pronoun}} war allein mit {{names}}.',
    EMPTY_ROOM: '{{room, capitalize}} war niemand.',
    ROOM_COUNT_one: '{{room, capitalize}} war genau eine Person.',
    ROOM_COUNT_other: '{{room, capitalize}} waren genau {{count}} Personen.',
  },
} as const;
