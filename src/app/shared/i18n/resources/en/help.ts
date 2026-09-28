/** How-to-play texts: tutorial, rules, keywords, techniques, questions. */
export const help = {
  tabs: {
    rules: 'How to play',
    keywords: 'Keywords',
    techniques: 'Techniques',
    faq: 'Questions',
  },
  skip: 'Skip',
  next: 'Next',
  prev: 'Back',
  start: 'Let’s go!',
  tutorial: [
    {
      title: 'Welcome, detective',
      body: 'A murder has happened. One of these people is guilty. The clues tell you where everyone stood — and therefore who did it.',
    },
    {
      title: 'How to crack the case',
      body: 'The victim was alone with the murderer in one area. Every card carries exactly one true clue. Work out where each person stood.',
    },
    {
      title: 'One per row and column',
      body: 'Each row and each column holds exactly one person. Nobody stands on tables, trees or other blocked squares.',
    },
    {
      title: 'What “next to” means',
      body: 'Next to means directly left, right, above or below — and in the same room. Sitting on a chair also counts as being next to a chair.',
    },
    {
      title: 'Placing people',
      body: 'Tap a card to select it. Then HOLD a square to place that person there. A short tap only makes a pencil note. On a computer a double click works too.',
    },
    {
      title: 'Solve the case',
      body: 'Once everyone is placed, press Confirm. You only learn right or wrong — never which person is misplaced. Good luck!',
    },
  ],
  goal: 'Place every person at the crime scene. The murderer was alone with the victim in the same area. Place everyone correctly and you have caught them.',
  rules: [
    'Each row and each column holds exactly one person.',
    'People only stand on walkable squares, never on tables, trees or shelves.',
    'The victim is a card too and gets placed like everyone else.',
    'All clues are true. There are no tricks.',
    'Every puzzle has exactly one solution and never requires guessing.',
  ],
  controls: [
    {
      term: 'Tap a card',
      text: 'Select that person',
    },
    {
      term: 'Tap a square',
      text: 'Add or remove a pencil note',
    },
    {
      term: 'Hold a square',
      text: 'Place the selected person there',
    },
    {
      term: 'Drag',
      text: 'Paint notes across several squares',
    },
    {
      term: 'Double click',
      text: 'Place, on a computer',
    },
    {
      term: 'Right click',
      text: 'Mark a square as impossible',
    },
    {
      term: 'Hold the eraser',
      text: 'Clear the whole grid',
    },
  ],
  keywords: {
    title: 'Keywords',
    items: [
      {
        term: 'next to',
        text: 'Left, right, above or below — and in the same room. The own square counts: sitting on a chair also means being next to a chair.',
      },
      {
        term: 'alone',
        text: 'Nobody else was in that room. The victim counts as a person.',
      },
      {
        term: 'alone with',
        text: 'Only the named people were in that room, nobody else.',
      },
      {
        term: 'empty area',
        text: 'Nobody was in that room, not even the victim.',
      },
      {
        term: 'corner',
        text: 'A square where two walls of the same room meet.',
      },
      {
        term: 'diagonal',
        text: 'The same number of squares away horizontally as vertically.',
      },
      {
        term: 'west of',
        text: 'In a column further left. North is up, west is left.',
      },
      {
        term: 'exactly one',
        text: 'A number in a clue is exact. Without a number it means “at least one”.',
      },
    ],
  },
  techniques: {
    title: 'Advanced techniques',
    items: [
      {
        term: 'Only one free square',
        text: 'If a row or column has exactly one square anyone can occupy, someone stands there — even before you know who. That also uses up the crossing line of that square.',
      },
      {
        term: 'Crowded lines',
        text: 'If two people are together confined to two rows, they occupy those two rows. Nobody else can stand there. The same holds for any group size and for columns.',
      },
      {
        term: 'Intersections',
        text: 'If a person can only occupy two squares, every square lining up with both is blocked — whichever of the two they end up on.',
      },
    ],
  },
  faq: [
    {
      term: 'Does the victim count as a person?',
      text: 'Always. You are reconstructing where everyone stood while the victim was still alive.',
    },
    {
      term: 'Do I ever have to guess?',
      text: 'No. Every puzzle is solvable by deduction alone.',
    },
    {
      term: 'Do the portraits give anything away?',
      text: 'No, they are purely decorative.',
    },
    {
      term: 'Why does Confirm not say what is wrong?',
      text: 'Because you could then brute-force instead of reasoning. The hint helps instead — it always starts from an empty board.',
    },
    {
      term: 'Do large objects cover several squares?',
      text: 'Yes, but a person only ever occupies one of them.',
    },
    {
      term: 'What is the seed?',
      text: 'The identifier of the case. The same seed produces the same puzzle everywhere — share the link and everyone plays the same case.',
    },
  ],
};

export type HelpResource = typeof help;
