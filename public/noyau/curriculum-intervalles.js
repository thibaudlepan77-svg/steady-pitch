/**
 * curriculum-intervalles.ts, LE TITRE NUMERO 2, ET IL SERT A MESURER.
 * Agent N4, 2026-08-25 (cycle 11, chantier 11). Aucune dependance.
 *
 * POURQUOI CE FICHIER EXISTE, ET CE N'EST PAS POUR VENDRE AUJOURD'HUI.
 * Mon business plan affirme depuis deux cycles que la REPLICATION est le
 * modele economique, plusieurs titres de niche batis sur un seul coeur, parce
 * qu'un titre seul rapporte un appoint incertain. Cette affirmation ne valait
 * rien tant qu'un second titre n'existait pas. C'est exactement la faute que
 * j'ai corrigee ce matin sur l'equivalence entre la voix et l'instrument,
 * affirmee au cycle 10 et mesuree seulement au cycle 11.
 * Alors je construis le second titre, et je compte ce qu'il coute.
 *
 * CE QUE FAIT LE TITRE 2. On donne une note de depart, l'utilisateur doit
 * produire l'intervalle demande au-dessus ou au-dessous. C'est l'exercice le
 * plus reclame apres la lecture de notes, et la cible etait deja identifiee au
 * cycle 10 comme couverte par le coeur ecrit.
 *
 * CE QU'IL PARTAGE AVEC LE TITRE 1, C'EST-A-DIRE TOUT LE RESTE.
 * Le moteur de notation, la conduite de seance, les six langues, les quatre
 * systemes de nommage, l'accessibilite, le theme, l'ecran. Il n'en duplique pas
 * une ligne. Le SEUL changement qu'il a impose au coeur est de rendre le
 * catalogue d'exercices parametrable dans `seance.ts`, six lignes.
 *
 * LA DIFFERENCE PEDAGOGIQUE AVEC LE TITRE 1, ET ELLE EST REELLE.
 * Le titre 1 suit une tonalite, ses degres se rapportent tous a une tonique et
 * l'oreille s'appuie sur cette tonalite. Ici, on entraine l'intervalle NU,
 * c'est-a-dire la distance entre deux sons sans contexte. Ce sont deux
 * competences distinctes, et un chanteur qui excelle a la premiere peut echouer
 * a la seconde. C'est ce qui justifie deux titres et non une option.
 */

                                                         

/**
 * Les intervalles, en demi-tons, avec leur nom d'usage. L'ordre est celui de
 * la DIFFICULTE PERCUE, pas celui de la taille. La quinte juste et l'octave
 * sont les plus faciles a produire parce qu'elles sont les plus consonantes,
 * la seconde majeure et la septieme sont les plus dures malgre leur taille.
 */
export const INTERVALLES                                                    = [
  { demiTons: 12, nom: "octave", rang: 1 },
  { demiTons: 7, nom: "quinte juste", rang: 1 },
  { demiTons: 5, nom: "quarte juste", rang: 2 },
  { demiTons: 4, nom: "tierce majeure", rang: 2 },
  { demiTons: 3, nom: "tierce mineure", rang: 2 },
  { demiTons: 9, nom: "sixte majeure", rang: 3 },
  { demiTons: 8, nom: "sixte mineure", rang: 3 },
  { demiTons: 2, nom: "seconde majeure", rang: 3 },
  { demiTons: 1, nom: "seconde mineure", rang: 4 },
  { demiTons: 11, nom: "septieme majeure", rang: 4 },
  { demiTons: 10, nom: "septieme mineure", rang: 4 },
  { demiTons: 6, nom: "triton", rang: 5 },
];

/**
 * Le curriculum du titre 2. Meme structure exactement que celui du titre 1,
 * donc la conduite de seance, l'ecran et les bancs le traitent sans une ligne
 * de code specifique.
 * Les degres sont exprimes en demi-tons depuis la note de depart, comme dans le
 * titre 1 ils l'etaient depuis la tonique. Le champ `solfege` sert a
 * l'affichage, on y met le degre le plus proche, ce qui reste juste pour toutes
 * les valeurs employees ici.
 */
function ex(id        , niveau        , titre        , objectif        ,
            degres          , solfege            )           {
  return { id, niveau, titre, objectif, degres, solfege };
}

export const CURRICULUM_INTERVALLES             = [
  // NIVEAU 1, les deux intervalles les plus consonants, montants seulement.
  ex("i1-1", 1, "L'octave", "Le meme son, plus haut. Le plus facile de tous",
     [0, 12], ["do", "do_aigu"]),
  ex("i1-2", 1, "La quinte juste", "L'intervalle des fanfares et des sirenes",
     [0, 7], ["do", "sol"]),
  ex("i1-3", 1, "Quinte puis octave", "Enchainer deux repères sûrs",
     [0, 7, 12], ["do", "sol", "do_aigu"]),
  ex("i1-4", 1, "Retour a la quinte", "Redescendre sans perdre la note de depart",
     [0, 12, 7, 0], ["do", "do_aigu", "sol", "do"]),
  ex("i1-5", 1, "Les deux, melangees", "Reconnaitre laquelle on demande",
     [0, 7, 0, 12, 0], ["do", "sol", "do", "do_aigu", "do"]),

  // NIVEAU 2, les tierces et la quarte, coeur de toute la musique tonale.
  ex("i2-1", 2, "La tierce majeure", "Le premier intervalle vraiment colore",
     [0, 4], ["do", "mi"]),
  ex("i2-2", 2, "La tierce mineure", "Un demi-ton plus bas, et tout change",
     [0, 3], ["do", "mi"]),
  ex("i2-3", 2, "Majeure contre mineure", "L'ecart le plus utile a entendre",
     [0, 4, 0, 3], ["do", "mi", "do", "mi"]),
  ex("i2-4", 2, "La quarte juste", "L'intervalle qui appelle la resolution",
     [0, 5], ["do", "fa"]),
  ex("i2-5", 2, "Quarte contre quinte", "Deux intervalles voisins, souvent confondus",
     [0, 5, 0, 7], ["do", "fa", "do", "sol"]),

  // NIVEAU 3, les sixtes et la seconde majeure.
  ex("i3-1", 3, "La sixte majeure", "Large, et pourtant naturelle a la voix",
     [0, 9], ["do", "la"]),
  ex("i3-2", 3, "La sixte mineure", "Sa voisine sombre",
     [0, 8], ["do", "la"]),
  ex("i3-3", 3, "La seconde majeure", "Petite a l'oeil, difficile a la voix",
     [0, 2], ["do", "re"]),
  ex("i3-4", 3, "Seconde puis tierce", "Deux pas, sans glisser entre les deux",
     [0, 2, 4], ["do", "re", "mi"]),
  ex("i3-5", 3, "Sixte contre quinte", "Un demi-ton d'ecart, tout le sujet",
     [0, 7, 0, 8], ["do", "sol", "do", "la"]),

  // NIVEAU 4, les dissonances, secondes mineures et septiemes.
  ex("i4-1", 4, "La seconde mineure", "Le plus petit pas, et le plus dur a tenir",
     [0, 1], ["do", "do"]),
  ex("i4-2", 4, "La septieme mineure", "Elle tire vers la resolution",
     [0, 10], ["do", "si"]),
  ex("i4-3", 4, "La septieme majeure", "Un demi-ton sous l'octave, a ne pas rabattre",
     [0, 11], ["do", "si"]),
  ex("i4-4", 4, "Septieme contre octave", "L'erreur la plus frequente de tous",
     [0, 11, 0, 12], ["do", "si", "do", "do_aigu"]),
  ex("i4-5", 4, "Le triton", "Ni consonant ni dissonant, sans repere",
     [0, 6], ["do", "fa"]),

  // NIVEAU 5, les intervalles DESCENDANTS, une competence a part entiere.
  ex("i5-1", 5, "Quinte descendante", "Descendre est plus dur que monter",
     [7, 0], ["sol", "do"]),
  ex("i5-2", 5, "Tierce majeure descendante", "Sans s'affaisser sous la note",
     [4, 0], ["mi", "do"]),
  ex("i5-3", 5, "Quarte descendante", "L'appel inverse",
     [5, 0], ["fa", "do"]),
  ex("i5-4", 5, "Octave descendante", "Le meme son, plus bas",
     [12, 0], ["do_aigu", "do"]),
  ex("i5-5", 5, "Sixte descendante", "Le plus grand saut vers le bas du niveau",
     [9, 0], ["la", "do"]),

  // NIVEAU 6, les chaines, ou l'oreille ne peut plus s'appuyer sur le depart.
  ex("i6-1", 6, "Deux tierces empilees", "L'accord parfait, note a note",
     [0, 4, 7], ["do", "mi", "sol"]),
  ex("i6-2", 6, "Quinte puis quarte", "Deux sauts qui font une octave",
     [0, 7, 12], ["do", "sol", "do_aigu"]),
  ex("i6-3", 6, "Chaine de secondes", "Quatre pas, sans deriver",
     [0, 2, 4, 5, 7], ["do", "re", "mi", "fa", "sol"]),
  ex("i6-4", 6, "Sauts alternes", "Monter, redescendre, remonter plus haut",
     [0, 7, 2, 9, 4], ["do", "sol", "re", "la", "mi"]),
  ex("i6-5", 6, "Toutes les couleurs", "Tierce, quarte, quinte, sixte, octave",
     [0, 4, 5, 7, 9, 12], ["do", "mi", "fa", "sol", "la", "do_aigu"]),
];

/** Les toniques conseillees. Ici la note de DEPART, pas une tonique au sens
 *  tonal, puisque cet entrainement se fait sans tonalite. Les valeurs sont
 *  celles du titre 1 diminuees de rien, parce que l'etendue maximale employee
 *  est de douze demi-tons contre seize dans le titre 1. */
export const DEPART_PAR_TESSITURE                         = {
  basse: 41, baryton: 45, tenor: 48, alto: 53,
  mezzo: 55, soprano: 60, enfant: 60, large: 48,
};
