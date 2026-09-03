/**
 * curriculum-tenues.ts, LE TITRE NUMERO 3, LA JUSTESSE D'INSTRUMENT.
 * Agent N4, 2026-08-25 (cycle 11, chantier 24). Aucune dependance.
 *
 * POURQUOI UN TROISIEME TITRE, ET LE RAISONNEMENT EST CHIFFRE.
 * Le modele d'horizon du chantier 12 dit qu'un second titre lance en meme temps
 * que le premier fait passer le cumul attendu a deux mois de 96 a 290 dollars,
 * SANS CHANGER LE PIRE CAS D'UN SEUL DOLLAR. Le chantier 11 a mesure que le
 * cout marginal d'un titre est de 85 lignes de contenu, 91,6 pour cent du code
 * etant partage. Un troisieme titre suit donc la meme arithmetique.
 *
 * LA CIBLE, mesuree au cycle 10 parmi six et retenue parmi les quatre que le
 * coeur ecrit couvre deja.
 *     justesse d'instrument    15 titres    prix median 3,99 $    grief 14 %
 *
 * CE QUE FAIT CE TITRE, ET EN QUOI IL DIFFERE DES DEUX AUTRES.
 * Le titre 1 fait LIRE une note et la produire. Le titre 2 fait entendre une
 * DISTANCE et la produire. Celui-ci ne demande ni lecture ni intervalle, il
 * demande de TENIR. Une note longue, stable, juste, du debut a la fin. C'est
 * l'exercice quotidien de tout instrumentiste a vent et a cordes, et c'est le
 * seul des trois ou la difficulte n'est pas de trouver la note mais de ne pas
 * la perdre.
 *
 * CE QUE CA CHANGE DANS LES REGLAGES, ET RIEN D'AUTRE.
 * Des notes plus longues, donc plus de trames, donc une mediane plus solide.
 * Et des tolerances plus serrees, parce qu'un instrument accorde n'a aucune
 * excuse de deriver, contrairement a une voix.
 *
 * CE QUE JE M'INTERDIS ICI, ET C'EST UNE LECON DEJA PAYEE. Ce titre NE DOIT PAS
 * devenir un accordeur. La forteresse des accordeurs generalistes a ete
 * correctement ecartee au cycle 9, un titre y compte 57 641 avis. On entraine
 * une PRATIQUE avec une progression, on n'affiche pas une aiguille.
 */

                                                         

function ex(id        , niveau        , titre        , objectif        ,
            degres          , solfege            )           {
  return { id, niveau, titre, objectif, degres, solfege };
}

/**
 * LE CURRICULUM. Les degres sont exprimes en demi-tons depuis la note de
 * depart, comme dans les deux autres titres, donc la conduite de seance,
 * l'ecran et les bancs le traitent sans une ligne de code specifique.
 */
export const CURRICULUM_TENUES             = [
  // NIVEAU 1, une seule note, repetee. Tout est dans la stabilite.
  ex("t1-1", 1, "La note de reference", "Une note, tenue, sans bouger",
     [0], ["do"]),
  ex("t1-2", 1, "La meme, deux fois", "La reproduire a l'identique",
     [0, 0], ["do", "do"]),
  ex("t1-3", 1, "Quitter et revenir", "Retrouver exactement la meme hauteur",
     [0, 7, 0], ["do", "sol", "do"]),
  ex("t1-4", 1, "Trois tenues", "Tenir sans que la justesse se degrade",
     [0, 0, 0], ["do", "do", "do"]),
  ex("t1-5", 1, "La quinte tenue", "L'autre note de reference de l'instrument",
     [7, 7], ["sol", "sol"]),

  // NIVEAU 2, le tetracorde, la moitie d'une gamme.
  ex("t2-1", 2, "Les deux premiers degres", "Monter d'un ton sans depasser",
     [0, 2], ["do", "re"]),
  ex("t2-2", 2, "Trois degres montants", "La derive commence a la troisieme",
     [0, 2, 4], ["do", "re", "mi"]),
  ex("t2-3", 2, "Le tetracorde", "Quatre degres, la moitie d'une gamme",
     [0, 2, 4, 5], ["do", "re", "mi", "fa"]),
  ex("t2-4", 2, "Le tetracorde descendant", "Redescendre sans s'affaisser",
     [5, 4, 2, 0], ["fa", "mi", "re", "do"]),
  ex("t2-5", 2, "Aller et retour", "Huit tenues d'affilee",
     [0, 2, 4, 5, 4, 2, 0], ["do", "re", "mi", "fa", "mi", "re", "do"]),

  // NIVEAU 3, la gamme entiere.
  ex("t3-1", 3, "La gamme montante", "Sept degres, sans accelerer",
     [0, 2, 4, 5, 7, 9, 11, 12], ["do", "re", "mi", "fa", "sol", "la", "si", "do_aigu"]),
  ex("t3-2", 3, "La gamme descendante", "Le sens ou l'oreille se relache",
     [12, 11, 9, 7, 5, 4, 2, 0], ["do_aigu", "si", "la", "sol", "fa", "mi", "re", "do"]),
  ex("t3-3", 3, "Le haut de la gamme", "Les quatre degres les plus exposes",
     [7, 9, 11, 12], ["sol", "la", "si", "do_aigu"]),
  ex("t3-4", 3, "Par tierces", "Chaque note tenue, deux par deux",
     [0, 4, 2, 5, 4, 7], ["do", "mi", "re", "fa", "mi", "sol"]),
  ex("t3-5", 3, "La gamme complete", "Aller et retour, seize tenues",
     [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0],
     ["do", "re", "mi", "fa", "sol", "la", "si", "do_aigu", "si", "la", "sol", "fa", "mi", "re", "do"]),

  // NIVEAU 4, l'accord parfait, ou chaque note doit sonner AVEC les autres.
  ex("t4-1", 4, "L'accord parfait", "Trois notes qui doivent s'accorder entre elles",
     [0, 4, 7], ["do", "mi", "sol"]),
  ex("t4-2", 4, "L'accord, descendant", "Le meme, en redescendant",
     [7, 4, 0], ["sol", "mi", "do"]),
  ex("t4-3", 4, "L'accord sur deux octaves", "Le saut le plus exigeant du titre",
     [0, 4, 7, 12], ["do", "mi", "sol", "do_aigu"]),
  ex("t4-4", 4, "La tierce isolee", "Celle qui sonne faux la premiere",
     [0, 4, 0, 4], ["do", "mi", "do", "mi"]),
  ex("t4-5", 4, "L'accord complet", "Monter, redescendre, tenir la derniere",
     [0, 4, 7, 12, 7, 4, 0], ["do", "mi", "sol", "do_aigu", "sol", "mi", "do"]),

  // NIVEAU 5, les demi-tons, la ou l'intonation se joue vraiment.
  ex("t5-1", 5, "Le demi-ton montant", "Le plus petit pas, tenu",
     [0, 1], ["do", "do"]),
  ex("t5-2", 5, "Le demi-ton descendant", "Ne pas descendre trop bas",
     [1, 0], ["do", "do"]),
  ex("t5-3", 5, "Chromatique, quatre pas", "Quatre demi-tons de suite",
     [0, 1, 2, 3], ["do", "do", "re", "re"]),
  ex("t5-4", 5, "La sensible", "Le degre qui appelle, tenu sans ceder",
     [11, 12], ["si", "do_aigu"]),
  ex("t5-5", 5, "Chromatique complete", "Six demi-tons, aller et retour",
     [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0],
     ["do", "do", "re", "re", "mi", "fa", "mi", "re", "re", "do", "do"]),

  // NIVEAU 6, la longue tenue et les extremes de la tessiture.
  ex("t6-1", 6, "La tenue longue", "La meme note, cinq fois, sans deriver",
     [0, 0, 0, 0, 0], ["do", "do", "do", "do", "do"]),
  ex("t6-2", 6, "Le grave tenu", "Ou la justesse se perd le plus vite",
     [0, -3, -5, -3, 0], ["do", "la_grave", "sol_grave", "la_grave", "do"]),
  ex("t6-3", 6, "L'aigu tenu", "Ou le souffle et l'archet se fatiguent",
     [12, 14, 16, 14, 12], ["do_aigu", "re_aigu", "mi_aigu", "re_aigu", "do_aigu"]),
  ex("t6-4", 6, "Toute la tessiture", "Du plus grave au plus aigu, tenu",
     [-5, 0, 7, 12, 16], ["sol_grave", "do", "sol", "do_aigu", "mi_aigu"]),
  ex("t6-5", 6, "La seance complete", "Tout ce qui precede, en une suite",
     [0, 4, 7, 12, 11, 9, 7, 5, 4, 2, 0],
     ["do", "mi", "sol", "do_aigu", "si", "la", "sol", "fa", "mi", "re", "do"]),
];

/** Les notes de depart conseillees. Plus basses que pour la voix, parce qu'un
 *  instrument descend plus bas, mais toujours au-dessus du plancher du moteur.
 *  Verifie par banc, aucun exercice ne demande une note que le moteur n'entend
 *  pas, y compris avec les degres negatifs du niveau 6. */
export const DEPART_PAR_INSTRUMENT                         = {
  grave: 45,        // La2, contrebasse, basson, tuba dans sa zone utile
  medium_grave: 48, // Do3, violoncelle, trombone, saxophone tenor
  medium: 53,       // Fa3, alto, clarinette, cor
  medium_aigu: 57,  // La3, violon, trompette, saxophone alto
  aigu: 60,         // Do4, flute, hautbois, violon en position
  large: 50,        // Re3, le defaut, tient pour presque tout
};
