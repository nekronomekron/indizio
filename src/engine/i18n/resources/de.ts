/**
 * i18next resource bundle for German.
 *
 * Word forms live here rather than in the theme so translators touch one file
 * and theme authors touch another. A theme that brings its own objects adds a
 * bundle of the same shape via addResources.
 */
export const de = {
  "common": {
    "pronoun_male": "Er",
    "pronoun_female": "Sie",
    "was": "war",
    "and": "und",
    "direction": {
      "north": "nördlich",
      "east": "östlich",
      "south": "südlich",
      "west": "westlich"
    },
    "axis": {
      "row": "Reihe",
      "column": "Spalte"
    }
  },
  "clue": {
    "VICTIM": "Das Opfer. {{pronoun}} war allein mit dem Mörder.",
    "ON_OBJECT": "{{pronoun}} {{verb}} {{place}}.",
    "IN_ROOM": "{{pronoun}} war {{room}}.",
    "ADJACENT_OBJECT_any": "{{pronoun}} war neben {{object}}.",
    "ADJACENT_OBJECT_one": "{{pronoun}} war neben genau {{object}}.",
    "ADJACENT_OBJECT_other": "{{pronoun}} war neben genau {{count}} {{objectPlural}}.",
    "ALONE": "{{pronoun}} war allein.",
    "ALONE_inRoom": "{{pronoun}} war allein {{room}}.",
    "SAME_ROOM_AS": "{{pronoun}} war im selben Bereich wie {{name}}.",
    "DIRECTION_OF_SUSPECT": "{{pronoun}} war {{direction}} von {{name}}.",
    "DIRECTION_OF_OBJECT": "{{pronoun}} war {{direction}} {{object}}.",
    "CORNER": "{{pronoun}} stand in einer Ecke des Raumes.",
    "ALIGNED_WITH_OBJECT": "{{pronoun}} war in derselben {{axis}} wie {{object}}.",
    "DIAGONAL_OF": "{{pronoun}} war auf derselben Diagonale wie {{name}}.",
    "ALONE_WITH": "{{pronoun}} war allein mit {{names}}.",
    "EMPTY_ROOM": "{{room, capitalize}} war niemand.",
    "ROOM_COUNT_one": "{{room, capitalize}} war genau eine Person.",
    "ROOM_COUNT_other": "{{room, capitalize}} waren genau {{count}} Personen."
  },
  "object": {
    "car": {
      "on": "in einem Auto",
      "dative": "einem Auto",
      "plural": "Autos",
      "nominative": "ein Auto",
      "bare": "Auto",
      "from": "vom Auto"
    },
    "shelf": {
      "on": "an einem Regal",
      "dative": "einem Regal",
      "plural": "Regalen",
      "nominative": "ein Regal",
      "bare": "Regal",
      "from": "vom Regal"
    },
    "workbench": {
      "on": "an einer Werkbank",
      "dative": "einer Werkbank",
      "plural": "Werkbänken",
      "nominative": "eine Werkbank",
      "bare": "Werkbank",
      "from": "von der Werkbank"
    },
    "oilstain": {
      "on": "auf einem Ölfleck",
      "dative": "einem Ölfleck",
      "plural": "Ölflecken",
      "nominative": "ein Ölfleck",
      "bare": "Ölfleck",
      "from": "vom Ölfleck"
    },
    "tirestack": {
      "on": "an einem Reifenstapel",
      "dative": "einem Reifenstapel",
      "plural": "Reifenstapeln",
      "nominative": "ein Reifenstapel",
      "bare": "Reifenstapel",
      "from": "vom Reifenstapel"
    },
    "chair": {
      "on": "auf einem Stuhl",
      "dative": "einem Stuhl",
      "plural": "Stühlen",
      "nominative": "ein Stuhl",
      "bare": "Stuhl",
      "from": "vom Stuhl",
      "verb": "saß"
    },
    "counter": {
      "on": "an einem Tresen",
      "dative": "einem Tresen",
      "plural": "Tresen",
      "nominative": "ein Tresen",
      "bare": "Tresen",
      "from": "vom Tresen"
    },
    "plant": {
      "on": "an einer Pflanze",
      "dative": "einer Pflanze",
      "plural": "Pflanzen",
      "nominative": "eine Pflanze",
      "bare": "Pflanze",
      "from": "von der Pflanze"
    },
    "toolbox": {
      "on": "auf einem Werkzeugkasten",
      "dative": "einem Werkzeugkasten",
      "plural": "Werkzeugkästen",
      "nominative": "ein Werkzeugkasten",
      "bare": "Werkzeugkasten",
      "from": "vom Werkzeugkasten"
    },
    "barrel": {
      "on": "an einem Fass",
      "dative": "einem Fass",
      "plural": "Fässern",
      "nominative": "ein Fass",
      "bare": "Fass",
      "from": "vom Fass"
    },
    "sofa": {
      "on": "auf einem Sofa",
      "dative": "einem Sofa",
      "plural": "Sofas",
      "nominative": "ein Sofa",
      "bare": "Sofa",
      "from": "vom Sofa",
      "verb": "saß"
    },
    "kitchenunit": {
      "on": "an einer Küchenzeile",
      "dative": "einer Küchenzeile",
      "plural": "Küchenzeilen",
      "nominative": "eine Küchenzeile",
      "bare": "Küchenzeile",
      "from": "von der Küchenzeile"
    },
    "bed": {
      "on": "auf einem Bett",
      "dative": "einem Bett",
      "plural": "Betten",
      "nominative": "ein Bett",
      "bare": "Bett",
      "from": "vom Bett"
    },
    "carpet": {
      "on": "auf einem Teppich",
      "dative": "einem Teppich",
      "plural": "Teppichen",
      "nominative": "ein Teppich",
      "bare": "Teppich",
      "from": "vom Teppich"
    },
    "bookshelf": {
      "on": "an einem Bücherregal",
      "dative": "einem Bücherregal",
      "plural": "Bücherregalen",
      "nominative": "ein Bücherregal",
      "bare": "Bücherregal",
      "from": "vom Bücherregal"
    },
    "table": {
      "on": "an einem Tisch",
      "dative": "einem Tisch",
      "plural": "Tischen",
      "nominative": "ein Tisch",
      "bare": "Tisch",
      "from": "vom Tisch"
    },
    "bathtub": {
      "on": "in einer Badewanne",
      "dative": "einer Badewanne",
      "plural": "Badewannen",
      "nominative": "eine Badewanne",
      "bare": "Badewanne",
      "from": "von der Badewanne"
    },
    "lamp": {
      "on": "an einer Lampe",
      "dative": "einer Lampe",
      "plural": "Lampen",
      "nominative": "eine Lampe",
      "bare": "Lampe",
      "from": "von der Lampe"
    },
    "tree": {
      "on": "an einem Baum",
      "dative": "einem Baum",
      "plural": "Bäumen",
      "nominative": "ein Baum",
      "bare": "Baum",
      "from": "vom Baum"
    },
    "flowerbed": {
      "on": "an einem Beet",
      "dative": "einem Beet",
      "plural": "Beeten",
      "nominative": "ein Beet",
      "bare": "Beet",
      "from": "vom Beet"
    },
    "gardenchair": {
      "on": "auf einem Gartenstuhl",
      "dative": "einem Gartenstuhl",
      "plural": "Gartenstühlen",
      "nominative": "ein Gartenstuhl",
      "bare": "Gartenstuhl",
      "from": "vom Gartenstuhl",
      "verb": "saß"
    },
    "pond": {
      "on": "in einem Teich",
      "dative": "einem Teich",
      "plural": "Teichen",
      "nominative": "ein Teich",
      "bare": "Teich",
      "from": "vom Teich"
    },
    "shed": {
      "on": "an einem Schuppen",
      "dative": "einem Schuppen",
      "plural": "Schuppen",
      "nominative": "ein Schuppen",
      "bare": "Schuppen",
      "from": "vom Schuppen"
    },
    "bench": {
      "on": "auf einer Bank",
      "dative": "einer Bank",
      "plural": "Bänken",
      "nominative": "eine Bank",
      "bare": "Bank",
      "from": "von der Bank",
      "verb": "saß"
    },
    "bush": {
      "on": "an einem Busch",
      "dative": "einem Busch",
      "plural": "Büschen",
      "nominative": "ein Busch",
      "bare": "Busch",
      "from": "vom Busch"
    },
    "wheelbarrow": {
      "on": "an einer Schubkarre",
      "dative": "einer Schubkarre",
      "plural": "Schubkarren",
      "nominative": "eine Schubkarre",
      "bare": "Schubkarre",
      "from": "von der Schubkarre"
    },
    "steppingstone": {
      "on": "auf einem Trittstein",
      "dative": "einem Trittstein",
      "plural": "Trittsteinen",
      "nominative": "ein Trittstein",
      "bare": "Trittstein",
      "from": "vom Trittstein"
    },
    "mat": {
      "on": "auf einer Matte",
      "dative": "einer Matte",
      "plural": "Matten",
      "nominative": "eine Matte",
      "bare": "Matte",
      "from": "von der Matte"
    },
    "pallet": {
      "on": "auf einer Palette",
      "dative": "einer Palette",
      "plural": "Paletten",
      "nominative": "eine Palette",
      "bare": "Palette",
      "from": "von der Palette"
    },
    "sandbox": {
      "on": "in einem Sandkasten",
      "dative": "einem Sandkasten",
      "plural": "Sandkästen",
      "nominative": "ein Sandkasten",
      "bare": "Sandkasten",
      "from": "vom Sandkasten"
    }
  },
  "room": {
    "workshop": {
      "in": "in der Werkstatt",
      "name": "die Werkstatt"
    },
    "waiting": {
      "in": "im Wartebereich",
      "name": "der Wartebereich"
    },
    "reception": {
      "in": "im Empfang",
      "name": "der Empfang"
    },
    "storage": {
      "in": "im Lager",
      "name": "das Lager"
    },
    "yard": {
      "in": "auf dem Hof",
      "name": "der Hof"
    },
    "washbay": {
      "in": "in der Waschhalle",
      "name": "die Waschhalle"
    },
    "office": {
      "in": "im Büro",
      "name": "das Büro"
    },
    "livingroom": {
      "in": "im Wohnzimmer",
      "name": "das Wohnzimmer"
    },
    "kitchen": {
      "in": "in der Küche",
      "name": "die Küche"
    },
    "bedroom": {
      "in": "im Schlafzimmer",
      "name": "das Schlafzimmer"
    },
    "hallway": {
      "in": "im Flur",
      "name": "der Flur"
    },
    "bathroom": {
      "in": "im Bad",
      "name": "das Bad"
    },
    "study": {
      "in": "im Arbeitszimmer",
      "name": "das Arbeitszimmer"
    },
    "balcony": {
      "in": "auf dem Balkon",
      "name": "der Balkon"
    },
    "lawn": {
      "in": "auf dem Rasen",
      "name": "der Rasen"
    },
    "patio": {
      "in": "auf der Terrasse",
      "name": "die Terrasse"
    },
    "vegetablepatch": {
      "in": "im Gemüsebeet",
      "name": "das Gemüsebeet"
    },
    "shedarea": {
      "in": "am Schuppen",
      "name": "der Schuppenplatz"
    },
    "pondside": {
      "in": "am Teich",
      "name": "das Teichufer"
    },
    "greenhouse": {
      "in": "im Gewächshaus",
      "name": "das Gewächshaus"
    },
    "playarea": {
      "in": "auf dem Spielplatz",
      "name": "der Spielplatz"
    }
  }
} as const;
