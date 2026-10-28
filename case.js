// The case file. The ghost only ever receives `memories` for the keepsakes on the altar.
// The culprit's name appears nowhere in this file: the accusation is checked against a hash.

export const CASE = {
  title: "The Ofrenda Witness",
  ghost: "Tomás Ibarra",
  intro: [
    "Tomás Ibarra, a retired clockmaker, died last Thursday at the bottom of his workshop stairs. The police called it a fall.",
    "Tonight is the first of November. His granddaughter Paloma has built an ofrenda: marigolds, a candle, his photograph, and a few of his things.",
    "When you place one of his keepsakes on the altar, Tomás remembers what that object saw. He can tell you only what he saw, heard, smelled, or felt before he fell. He never saw who pushed him.",
  ],
  // Public facts the player reads. The ghost is not told these.
  people: [
    { name: "Rafael Soto", role: "son-in-law", note: "Owed Tomás money. Says he was at the cemetery vigil with the family from 21:00 to 22:30; a dozen people saw him there." },
    { name: "Dario Vela", role: "apprentice", note: "Has a key to the workshop. Says he was at home varnishing a clock case all evening, alone." },
    { name: "Marta Quiroga", role: "neighbour", note: "Argued with Tomás about the shared wall. Says she was at the bakery queue for pan de muerto until 21:50; the baker remembers her." },
  ],
  keepsakes: [
    { id: "watch", label: "Pocket watch", glyph: "⌚" },
    { id: "radio", label: "Workshop radio", glyph: "📻" },
    { id: "glasses", label: "Reading glasses", glyph: "👓" },
    { id: "key", label: "Workshop key", glyph: "🗝" },
  ],
  memories: {
    watch: [
      "My pocket watch stopped at 21:47, when I hit the floor.",
      "I had wound it at 21:30, so it was keeping good time.",
    ],
    radio: [
      "The radio was playing the late request show. At 21:40 the host said it was the last song of the night.",
      "Under the music I heard the back door open. The back door locks itself; it needs a key.",
    ],
    glasses: [
      "I was at the top of the stairs, looking down at the bench, when someone stood close behind me.",
      "I smelled fresh linseed varnish, strong, like a clock case still wet.",
    ],
    key: [
      "Only three keys open the back door: mine, my daughter's, and Dario's.",
      "My daughter's key hangs in her kitchen. She was at the cemetery all evening with Rafael and the family.",
    ],
  },
  // Words the ghost may say. Anything that looks like a name, time, or clue object outside these lists is rejected.
  allowedNames: ["Tomás", "Tomas", "Paloma", "Rafael", "Soto", "Dario", "Vela", "Marta", "Quiroga", "Ibarra", "God", "November", "Thursday"],
  allowedTimes: ["21:30", "21:40", "21:47"],
  suspects: ["Rafael Soto", "Dario Vela", "Marta Quiroga"],
  // sha256("ofrenda:" + full name of the culprit)
  solutionHash: "1914c5cf0895f31e6d79f7b406b8b42ef5eab746b9185897e59986168edf7ed1",
  epilogue: {
    right: "The candle steadies. Tomás thanks you, and asks Paloma to keep the workshop open. The marigolds keep their colour until morning.",
    wrong: "The candle gutters. Whoever you named was somewhere else at 21:47. Look again at what Tomás smelled, and at who holds a key.",
  },
};

// Nouns that would act as a clue if the ghost invented them.
export const CLUE_OBJECTS = [
  "knife", "gun", "pistol", "rope", "glove", "gloves", "poison", "blood", "letter", "note", "phone", "car",
  "cigarette", "perfume", "cologne", "hammer", "shoe", "shoes", "boot", "boots", "ring", "wallet", "money",
  "bottle", "window", "ladder", "lamp", "footprint", "footprints", "scarf", "hat",
  "coat", "jacket", "umbrella", "dog", "bicycle", "torch", "flashlight", "camera",
];
