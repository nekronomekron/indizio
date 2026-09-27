import type { ArtKind } from './render/art.js';
import type { Locale } from './types.js';

export interface TutorialStep {
  icon: string;
  /** Art der Grafik. Ohne Angabe eine Requisite. */
  iconKind?: ArtKind;
  /** Theme, aus dem die Grafik stammt. Nur noetig fuer Requisiten. */
  iconTheme?: string;
  title: string;
  body: string;
}

export interface HelpSection {
  title: string;
  items: Array<{ term: string; text: string }>;
}

export interface HelpContent {
  tutorial: TutorialStep[];
  goal: string;
  rules: string[];
  controls: Array<{ term: string; text: string }>;
  keywords: HelpSection;
  techniques: HelpSection;
  faq: Array<{ term: string; text: string }>;
  tabs: { rules: string; keywords: string; techniques: string; faq: string };
  skip: string;
  next: string;
  prev: string;
  start: string;
}

const de: HelpContent = {
  tabs: { rules: 'Spielanleitung', keywords: 'Schlüsselwörter', techniques: 'Techniken', faq: 'Fragen' },
  skip: 'Überspringen',
  next: 'Weiter',
  prev: 'Zurück',
  start: 'Auf geht’s!',
  tutorial: [
    {
      icon: 'ui-victim',
      iconKind: 'icons',
      title: 'Willkommen, Detektiv',
      body: 'Es ist ein Mord geschehen. Eine dieser Personen ist schuldig. Die Hinweise verraten dir, wo alle zur Tatzeit standen — und damit, wer es war.',
    },
    {
      icon: 'ui-note',
      iconKind: 'icons',
      title: 'So löst du den Fall',
      body: 'Das Opfer war mit dem Mörder allein in einem Bereich. Jede Karte trägt genau einen wahren Hinweis. Finde heraus, wo jede Person stand.',
    },
    {
      icon: 'ui-x',
      iconKind: 'icons',
      title: 'Einer pro Zeile und Spalte',
      body: 'In jeder Zeile und in jeder Spalte steht genau eine Person. Auf Tischen, Bäumen und anderen versperrten Feldern steht niemand.',
    },
    {
      icon: 'bush_1x1',
      iconTheme: 'garden',
      title: 'Was „neben“ bedeutet',
      body: 'Neben heißt direkt links, rechts, darüber oder darunter — und im selben Raum. Wer auf einem Stuhl sitzt, ist auch neben einem Stuhl.',
    },
    {
      icon: 'p01',
      iconKind: 'characters',
      title: 'Personen platzieren',
      body: 'Tippe eine Karte an, um sie auszuwählen. HALTE dann ein Feld gedrückt, um sie dort zu platzieren. Kurzes Tippen macht nur eine Bleistiftnotiz. Am Rechner geht auch ein Doppelklick.',
    },
    {
      icon: 'ui-check',
      iconKind: 'icons',
      title: 'Löse den Fall',
      body: 'Sind alle platziert, drücke auf Bestätigen. Du erfährst nur richtig oder falsch — nie, welche Person danebensteht. Viel Erfolg!',
    },
  ],
  goal: 'Platziere jede Person am Tatort. Der Mörder war mit dem Opfer allein im selben Bereich. Wer alle richtig platziert, hat ihn überführt.',
  rules: [
    'In jeder Zeile und in jeder Spalte steht genau eine Person.',
    'Personen stehen nur auf begehbaren Feldern, nicht auf Tischen, Bäumen oder Regalen.',
    'Das Opfer ist selbst eine Karte und wird mitplatziert.',
    'Alle Hinweise sind wahr. Es gibt keine Tricks.',
    'Jedes Rätsel hat genau eine Lösung und ist ohne Raten lösbar.',
  ],
  controls: [
    { term: 'Karte antippen', text: 'Person auswählen' },
    { term: 'Feld antippen', text: 'Bleistiftnotiz setzen oder entfernen' },
    { term: 'Feld halten', text: 'Ausgewählte Person dort platzieren' },
    { term: 'Ziehen', text: 'Notizen über mehrere Felder malen' },
    { term: 'Doppelklick', text: 'Platzieren am Rechner' },
    { term: 'Rechtsklick', text: 'Feld als unmöglich markieren' },
    { term: 'Radierer halten', text: 'Das ganze Gitter leeren' },
  ],
  keywords: {
    title: 'Schlüsselwörter',
    items: [
      { term: 'neben', text: 'Links, rechts, oben oder unten — und im selben Raum. Die eigene Zelle zählt mit: wer auf einem Stuhl sitzt, ist auch neben einem Stuhl.' },
      { term: 'allein', text: 'Niemand sonst war in diesem Raum. Das Opfer zählt als Person mit.' },
      { term: 'allein mit', text: 'Nur die genannten Personen waren in diesem Raum, sonst niemand.' },
      { term: 'leerer Bereich', text: 'In diesem Raum war niemand, nicht einmal das Opfer.' },
      { term: 'Ecke', text: 'Ein Feld, an dem zwei Wände desselben Raumes zusammentreffen.' },
      { term: 'Diagonale', text: 'Gleich viele Felder waagerecht wie senkrecht entfernt.' },
      { term: 'westlich von', text: 'In einer Spalte weiter links. Norden ist oben, Westen ist links.' },
      { term: 'genau ein', text: 'Steht eine Zahl im Hinweis, ist sie exakt gemeint. Ohne Zahl heißt es „mindestens eines“.' },
    ],
  },
  techniques: {
    title: 'Fortgeschrittene Techniken',
    items: [
      { term: 'Nur ein freies Feld', text: 'Bleibt in einer Zeile oder Spalte genau ein Feld übrig, das überhaupt jemand belegen kann, steht dort jemand — auch wenn du noch nicht weißt, wer. Damit ist auch die Querlinie dieses Feldes verbraucht.' },
      { term: 'Überladene Linien', text: 'Sind zwei Personen zusammen auf zwei Zeilen beschränkt, belegen sie diese beiden Zeilen. Niemand sonst kann dort stehen. Das gilt für beliebige Gruppengrößen und für Spalten genauso.' },
      { term: 'Schnittfelder', text: 'Kann eine Person nur zwei Felder belegen, ist jedes Feld gesperrt, das mit beiden fluchtet — egal auf welchem der beiden sie am Ende steht.' },
    ],
  },
  faq: [
    { term: 'Zählt das Opfer als Person?', text: 'Ja, immer. Du rekonstruierst, wo alle zur Tatzeit standen, als das Opfer noch lebte.' },
    { term: 'Muss ich jemals raten?', text: 'Nein. Jedes Rätsel lässt sich allein durch Deduktion lösen.' },
    { term: 'Verraten die Porträts etwas?', text: 'Nein, sie sind reine Dekoration.' },
    { term: 'Wieso sagt „Bestätigen“ nicht, was falsch ist?', text: 'Weil man sich sonst durchprobieren könnte, statt zu schließen. Der Tipp hilft stattdessen weiter — er geht immer vom leeren Brett aus.' },
    { term: 'Belegen große Objekte mehrere Felder?', text: 'Ja, aber eine Person besetzt immer nur eines davon.' },
    { term: 'Was ist der Seed?', text: 'Die Kennung des Falls. Derselbe Seed erzeugt überall dasselbe Rätsel — teile den Link und alle spielen denselben Fall.' },
  ],
};

const en: HelpContent = {
  tabs: { rules: 'How to play', keywords: 'Keywords', techniques: 'Techniques', faq: 'Questions' },
  skip: 'Skip',
  next: 'Next',
  prev: 'Back',
  start: 'Let’s go!',
  tutorial: [
    {
      icon: 'ui-victim',
      iconKind: 'icons',
      title: 'Welcome, detective',
      body: 'A murder has happened. One of these people is guilty. The clues tell you where everyone stood — and therefore who did it.',
    },
    {
      icon: 'ui-note',
      iconKind: 'icons',
      title: 'How to crack the case',
      body: 'The victim was alone with the murderer in one area. Every card carries exactly one true clue. Work out where each person stood.',
    },
    {
      icon: 'ui-x',
      iconKind: 'icons',
      title: 'One per row and column',
      body: 'Each row and each column holds exactly one person. Nobody stands on tables, trees or other blocked squares.',
    },
    {
      icon: 'bush_1x1',
      iconTheme: 'garden',
      title: 'What “next to” means',
      body: 'Next to means directly left, right, above or below — and in the same room. Sitting on a chair also counts as being next to a chair.',
    },
    {
      icon: 'p01',
      iconKind: 'characters',
      title: 'Placing people',
      body: 'Tap a card to select it. Then HOLD a square to place that person there. A short tap only makes a pencil note. On a computer a double click works too.',
    },
    {
      icon: 'ui-check',
      iconKind: 'icons',
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
    { term: 'Tap a card', text: 'Select that person' },
    { term: 'Tap a square', text: 'Add or remove a pencil note' },
    { term: 'Hold a square', text: 'Place the selected person there' },
    { term: 'Drag', text: 'Paint notes across several squares' },
    { term: 'Double click', text: 'Place, on a computer' },
    { term: 'Right click', text: 'Mark a square as impossible' },
    { term: 'Hold the eraser', text: 'Clear the whole grid' },
  ],
  keywords: {
    title: 'Keywords',
    items: [
      { term: 'next to', text: 'Left, right, above or below — and in the same room. The own square counts: sitting on a chair also means being next to a chair.' },
      { term: 'alone', text: 'Nobody else was in that room. The victim counts as a person.' },
      { term: 'alone with', text: 'Only the named people were in that room, nobody else.' },
      { term: 'empty area', text: 'Nobody was in that room, not even the victim.' },
      { term: 'corner', text: 'A square where two walls of the same room meet.' },
      { term: 'diagonal', text: 'The same number of squares away horizontally as vertically.' },
      { term: 'west of', text: 'In a column further left. North is up, west is left.' },
      { term: 'exactly one', text: 'A number in a clue is exact. Without a number it means “at least one”.' },
    ],
  },
  techniques: {
    title: 'Advanced techniques',
    items: [
      { term: 'Only one free square', text: 'If a row or column has exactly one square anyone can occupy, someone stands there — even before you know who. That also uses up the crossing line of that square.' },
      { term: 'Crowded lines', text: 'If two people are together confined to two rows, they occupy those two rows. Nobody else can stand there. The same holds for any group size and for columns.' },
      { term: 'Intersections', text: 'If a person can only occupy two squares, every square lining up with both is blocked — whichever of the two they end up on.' },
    ],
  },
  faq: [
    { term: 'Does the victim count as a person?', text: 'Always. You are reconstructing where everyone stood while the victim was still alive.' },
    { term: 'Do I ever have to guess?', text: 'No. Every puzzle is solvable by deduction alone.' },
    { term: 'Do the portraits give anything away?', text: 'No, they are purely decorative.' },
    { term: 'Why does Confirm not say what is wrong?', text: 'Because you could then brute-force instead of reasoning. The hint helps instead — it always starts from an empty board.' },
    { term: 'Do large objects cover several squares?', text: 'Yes, but a person only ever occupies one of them.' },
    { term: 'What is the seed?', text: 'The identifier of the case. The same seed produces the same puzzle everywhere — share the link and everyone plays the same case.' },
  ],
};

export const HELP: Record<Locale, HelpContent> = { de, en };
