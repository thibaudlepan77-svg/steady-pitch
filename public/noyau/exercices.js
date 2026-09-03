/**
 * exercices.ts, LE CURRICULUM. LA SEULE PARTIE VRAIMENT DEFENDABLE.
 * Agent N4, 2026-08-25 (cycle 10, chantier 13).
 *
 * POURQUOI CE FICHIER COMPTE PLUS QUE LE DETECTEUR.
 * J'ai cru pendant deux cycles que ma barriere etait le traitement du signal.
 * Je l'ai franchi en deux heures avec une bibliotheque gratuite, donc ce n'est
 * pas une barriere. Ce qui se copie mal, c'est une PROGRESSION PEDAGOGIQUE
 * juste, ordonnee, et qui ne decourage pas au troisieme exercice.
 *
 * LA PEDAGOGIE SUIVIE, ET ELLE N'EST PAS INVENTEE PAR MOI.
 * L'ordre d'introduction des degres suit la sequence Kodaly, qui est la
 * reference mondiale de l'education musicale depuis les annees 1940 et qui est
 * dans le domaine public en tant que METHODE. On n'apprend pas la gamme dans
 * l'ordre do-re-mi, on commence par sol-mi, la tierce mineure descendante, que
 * les enfants du monde entier chantent spontanement dans les comptines.
 *   etape 1  sol mi              la tierce mineure descendante
 *   etape 2  sol mi la           ajout de la sixte
 *   etape 3  sol mi la do        le do grave, tetratonique
 *   etape 4  + re                pentatonique complete, do re mi sol la
 *   etape 5  + fa si             diatonique complete, les demi-tons arrivent
 *   etape 6  intervalles larges  sixtes, septiemes, octave
 * Les demi-tons (mi-fa, si-do) arrivent EN DERNIER parce qu'ils sont les plus
 * durs a chanter juste, ce qui est exactement contraire a l'ordre alphabetique
 * qu'utilisent les applications qui commencent betement a do.
 *
 * AUCUNE PROPRIETE INTELLECTUELLE DE TIERS. Les melodies sont construites
 * ici, degre par degre, a partir d'intervalles. Aucune chanson existante n'est
 * reprise. Le solfege est un savoir, pas une oeuvre.
 *
 * ZERO DEPENDANCE, et transposable a la tessiture de l'utilisateur, ce qui
 * repond directement a un grief mesure chez un concurrent, "the iOS version
 * lacks transposition to accommodate a person's vocal range".
 */

import { midiVersHz, nomDeMidi } from "./notation.js";

// ---------------------------------------------------------------------------
// Degres de la gamme, exprimes en demi-tons au-dessus de la tonique
// ---------------------------------------------------------------------------

export const DEGRE = {
  do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11,
  do_aigu: 12, re_aigu: 14, mi_aigu: 16,
  la_grave: -3, sol_grave: -5,
}         ;

                                          

                           
             
                 
                
                                                                             
                   
                                                                     
                   
                                           
                      
 

                               
               
             
              
                    
 

// ---------------------------------------------------------------------------
// LE CURRICULUM, six niveaux, trente exercices
// ---------------------------------------------------------------------------

function ex(id        , niveau        , titre        , objectif        ,
            solfege            )           {
  return { id, niveau, titre, objectif, solfege, degres: solfege.map(s => DEGRE[s]) };
}

export const CURRICULUM             = [
  // NIVEAU 1, sol-mi. La tierce mineure descendante, l'intervalle le plus
  // naturel de la voix humaine. On ne demande rien d'autre pendant cinq
  // exercices, la repetition est le but.
  ex("1-1", 1, "Les deux premieres notes", "Chanter sol puis mi, la tierce mineure descendante", ["sol", "mi"]),
  ex("1-2", 1, "Aller et retour", "Redescendre puis remonter sans deriver", ["sol", "mi", "sol"]),
  ex("1-3", 1, "Le balancement", "Tenir la justesse sur quatre notes", ["sol", "mi", "sol", "mi"]),
  ex("1-4", 1, "Depart d'en bas", "Commencer par la note grave change tout", ["mi", "sol", "mi"]),
  ex("1-5", 1, "La note tenue", "Revenir exactement au meme sol qu'au depart", ["sol", "mi", "mi", "sol"]),

  // NIVEAU 2, ajout de la. La sixte majeure au-dessus de do, mais surtout la
  // seconde majeure ascendante sol-la, premiere petite marche.
  ex("2-1", 2, "Une note plus haut", "Monter de sol a la, un ton", ["sol", "la"]),
  ex("2-2", 2, "La descente complete", "Enchainer la, sol, mi sans ecraser le sol", ["la", "sol", "mi"]),
  ex("2-3", 2, "Le sommet", "Atteindre le la puis retomber", ["mi", "sol", "la", "sol"]),
  ex("2-4", 2, "Saut de sixte", "Sauter directement de mi a la", ["mi", "la", "mi"]),
  ex("2-5", 2, "Phrase de quatre", "Une vraie petite phrase", ["sol", "la", "sol", "mi"]),

  // NIVEAU 3, ajout du do grave. La quarte descendante sol-do, pilier de la
  // tonalite, et la premiere sensation de repos sur la tonique.
  ex("3-1", 3, "La note de repos", "Descendre de sol au do grave, la quarte", ["sol", "do"]),
  ex("3-2", 3, "Retour a la maison", "Toute phrase se repose sur do", ["mi", "sol", "do"]),
  ex("3-3", 3, "L'arche", "Monter puis redescendre jusqu'au repos", ["do", "mi", "sol", "mi", "do"]),
  ex("3-4", 3, "Le grand saut", "Do au la, la sixte majeure", ["do", "la", "do"]),
  ex("3-5", 3, "Tetratonique", "Les quatre notes apprises, dans l'ordre", ["do", "mi", "sol", "la"]),

  // NIVEAU 4, ajout de re. Pentatonique complete. Aucun demi-ton encore, donc
  // aucune des difficultes de justesse qui decouragent.
  ex("4-1", 4, "La note qui manquait", "Le re, entre do et mi", ["do", "re", "mi"]),
  ex("4-2", 4, "Gamme pentatonique", "Les cinq notes en montant", ["do", "re", "mi", "sol", "la"]),
  ex("4-3", 4, "Pentatonique descendante", "Plus dur en descendant qu'en montant", ["la", "sol", "mi", "re", "do"]),
  ex("4-4", 4, "Par tierces", "Sauter une note a chaque fois", ["do", "mi", "re", "sol", "mi", "la"]),
  ex("4-5", 4, "Melodie pentatonique", "Huit notes, aucun demi-ton", ["sol", "la", "sol", "mi", "re", "mi", "do", "do"]),

  // NIVEAU 5, fa et si. Les demi-tons arrivent, mi-fa et si-do. C'est ici que
  // la justesse devient reellement difficile, et c'est pour cela qu'on a
  // attendu vingt exercices.
  ex("5-1", 5, "Le premier demi-ton", "Mi vers fa, le plus petit pas", ["mi", "fa", "mi"]),
  ex("5-2", 5, "La sensible", "Si appelle do, ne pas chanter trop bas", ["si", "do_aigu"]),
  ex("5-3", 5, "Gamme complete montante", "Les sept degres, demi-tons compris", ["do", "re", "mi", "fa", "sol", "la", "si", "do_aigu"]),
  ex("5-4", 5, "Gamme complete descendante", "La descente demande plus de soutien", ["do_aigu", "si", "la", "sol", "fa", "mi", "re", "do"]),
  ex("5-5", 5, "Les deux demi-tons", "Enchainer mi-fa et si-do dans une phrase", ["do", "mi", "fa", "sol", "si", "do_aigu"]),

  // NIVEAU 6, intervalles larges et octave. Le plus exigeant en soutien.
  ex("6-1", 6, "L'octave", "Le meme nom, deux hauteurs", ["do", "do_aigu", "do"]),
  ex("6-2", 6, "La septieme", "L'intervalle le plus instable a chanter", ["do", "si", "do"]),
  ex("6-3", 6, "Arpege majeur", "Do mi sol do, la charpente de l'accord", ["do", "mi", "sol", "do_aigu"]),
  ex("6-4", 6, "Arpege descendant", "Redescendre l'accord sans s'affaisser", ["do_aigu", "sol", "mi", "do"]),
  ex("6-5", 6, "Melodie complete", "Tout ce qui a ete appris, en une phrase", ["do", "mi", "sol", "do_aigu", "si", "la", "sol", "mi", "re", "do"]),
];

// ---------------------------------------------------------------------------
// Transposition a la tessiture, le grief mesure chez un concurrent
// ---------------------------------------------------------------------------

/** Toniques conseillees par tessiture, en midi. Choisies pour que le
 *  curriculum entier tienne confortablement dans la voix. */
export const TONIQUE_PAR_TESSITURE                         = {
  basse: 41,     // Fa2
  baryton: 45,   // La2
  tenor: 48,     // Do3
  alto: 53,      // Fa3
  mezzo: 55,     // Sol3
  soprano: 60,   // Do4
  enfant: 60,    // Do4
  large: 48,     // Do3
};

export function preparer(exercice          , toniqueMidi        ,
                         laReference = 440)                 {
  return exercice.degres.map((d, i) => {
    const midi = toniqueMidi + d;
    return {
      // La hauteur cible depend du la de reference de l'utilisateur, mesure du
      // cycle 11. Le NOM de la note, lui, n'en depend pas.
      midi, hz: midiVersHz(midi, laReference), nom: nomDeMidi(midi),
      solfege: exercice.solfege[i],
    };
  });
}

/** Etendue d'un exercice, en demi-tons. Sert a verifier qu'il tient dans la voix. */
export function etendue(exercice          )         {
  return Math.max(...exercice.degres) - Math.min(...exercice.degres);
}

/** Le plus grand saut de l'exercice, en demi-tons. Mesure sa difficulte reelle. */
export function plusGrandSaut(exercice          )         {
  let m = 0;
  for (let i = 1; i < exercice.degres.length; i++) {
    m = Math.max(m, Math.abs(exercice.degres[i] - exercice.degres[i - 1]));
  }
  return m;
}

/** Les degres utilises par un exercice, tries. */
export function degresUtilises(exercice          )           {
  return [...new Set(exercice.degres)].sort((a, b) => a - b);
}
