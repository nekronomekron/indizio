import type { HelpResource } from '../en/help.js';

/** How-to-play texts: tutorial, rules, keywords, techniques, questions. */
export const help: HelpResource = {
  tabs: {
    rules: 'Spielanleitung',
    keywords: 'Schlüsselwörter',
    techniques: 'Techniken',
    faq: 'Fragen',
  },
  skip: 'Überspringen',
  next: 'Weiter',
  prev: 'Zurück',
  start: 'Auf geht’s!',
  tutorial: [
    {
      title: 'Willkommen, Detektiv',
      body: 'Es ist ein Mord geschehen. Eine dieser Personen ist schuldig. Die Hinweise verraten dir, wo alle zur Tatzeit standen — und damit, wer es war.',
    },
    {
      title: 'So löst du den Fall',
      body: 'Das Opfer war mit dem Mörder allein in einem Bereich. Jede Karte trägt genau einen wahren Hinweis. Finde heraus, wo jede Person stand.',
    },
    {
      title: 'Einer pro Zeile und Spalte',
      body: 'In jeder Zeile und in jeder Spalte steht genau eine Person. Auf Tischen, Bäumen und anderen versperrten Feldern steht niemand.',
    },
    {
      title: 'Was „neben“ bedeutet',
      body: 'Neben heißt direkt links, rechts, darüber oder darunter — und im selben Raum. Wer auf einem Stuhl sitzt, ist auch neben einem Stuhl.',
    },
    {
      title: 'Personen platzieren',
      body: 'Tippe eine Karte an, um sie auszuwählen. HALTE dann ein Feld gedrückt, um sie dort zu platzieren. Kurzes Tippen macht nur eine Bleistiftnotiz. Am Rechner geht auch ein Doppelklick.',
    },
    {
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
    {
      term: 'Karte antippen',
      text: 'Person auswählen',
    },
    {
      term: 'Feld antippen',
      text: 'Bleistiftnotiz setzen oder entfernen',
    },
    {
      term: 'Feld halten',
      text: 'Ausgewählte Person dort platzieren',
    },
    {
      term: 'Ziehen',
      text: 'Notizen über mehrere Felder malen',
    },
    {
      term: 'Doppelklick',
      text: 'Platzieren am Rechner',
    },
    {
      term: 'Rechtsklick',
      text: 'Feld als unmöglich markieren',
    },
    {
      term: 'Radierer halten',
      text: 'Das ganze Gitter leeren',
    },
  ],
  keywords: {
    title: 'Schlüsselwörter',
    items: [
      {
        term: 'neben',
        text: 'Links, rechts, oben oder unten — und im selben Raum. Die eigene Zelle zählt mit: wer auf einem Stuhl sitzt, ist auch neben einem Stuhl.',
      },
      {
        term: 'allein',
        text: 'Niemand sonst war in diesem Raum. Das Opfer zählt als Person mit.',
      },
      {
        term: 'allein mit',
        text: 'Nur die genannten Personen waren in diesem Raum, sonst niemand.',
      },
      {
        term: 'leerer Bereich',
        text: 'In diesem Raum war niemand, nicht einmal das Opfer.',
      },
      {
        term: 'Ecke',
        text: 'Ein Feld, an dem zwei Wände desselben Raumes zusammentreffen.',
      },
      {
        term: 'Diagonale',
        text: 'Gleich viele Felder waagerecht wie senkrecht entfernt.',
      },
      {
        term: 'westlich von',
        text: 'In einer Spalte weiter links. Norden ist oben, Westen ist links.',
      },
      {
        term: 'genau ein',
        text: 'Steht eine Zahl im Hinweis, ist sie exakt gemeint. Ohne Zahl heißt es „mindestens eines“.',
      },
    ],
  },
  techniques: {
    title: 'Fortgeschrittene Techniken',
    items: [
      {
        term: 'Nur ein freies Feld',
        text: 'Bleibt in einer Zeile oder Spalte genau ein Feld übrig, das überhaupt jemand belegen kann, steht dort jemand — auch wenn du noch nicht weißt, wer. Damit ist auch die Querlinie dieses Feldes verbraucht.',
      },
      {
        term: 'Überladene Linien',
        text: 'Sind zwei Personen zusammen auf zwei Zeilen beschränkt, belegen sie diese beiden Zeilen. Niemand sonst kann dort stehen. Das gilt für beliebige Gruppengrößen und für Spalten genauso.',
      },
      {
        term: 'Schnittfelder',
        text: 'Kann eine Person nur zwei Felder belegen, ist jedes Feld gesperrt, das mit beiden fluchtet — egal auf welchem der beiden sie am Ende steht.',
      },
    ],
  },
  faq: [
    {
      term: 'Zählt das Opfer als Person?',
      text: 'Ja, immer. Du rekonstruierst, wo alle zur Tatzeit standen, als das Opfer noch lebte.',
    },
    {
      term: 'Muss ich jemals raten?',
      text: 'Nein. Jedes Rätsel lässt sich allein durch Deduktion lösen.',
    },
    {
      term: 'Verraten die Porträts etwas?',
      text: 'Nein, sie sind reine Dekoration.',
    },
    {
      term: 'Wieso sagt „Bestätigen“ nicht, was falsch ist?',
      text: 'Weil man sich sonst durchprobieren könnte, statt zu schließen. Der Tipp hilft stattdessen weiter — er geht immer vom leeren Brett aus.',
    },
    {
      term: 'Belegen große Objekte mehrere Felder?',
      text: 'Ja, aber eine Person besetzt immer nur eines davon.',
    },
    {
      term: 'Was ist der Seed?',
      text: 'Die Kennung des Falls. Derselbe Seed erzeugt überall dasselbe Rätsel — teile den Link und alle spielen denselben Fall.',
    },
  ],
};
