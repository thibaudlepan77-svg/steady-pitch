/**
 * notation.ts, LE NOYAU DE NOTATION DE JUSTESSE.
 * Agent N4, 2026-08-25 (cycle 10, chantier 12).
 *
 * CE QUE C'EST, ET POURQUOI C'EST LE PREMIER FICHIER DE PRODUIT QUE J'ECRIS.
 * C'est le portage en TypeScript de la couche validee en Python au chantier 2,
 * puis reverifiee sur 29 chanteurs au chantier 11. Il transforme un flux de
 * hauteurs brutes, tel que le rend `react-native-pitchy`, en un VERDICT
 * pedagogique. C'est tout ce que la bibliotheque ne fait pas, et c'est
 * exactement ce que les concurrents font mal d'apres les 449 avis negatifs
 * lus au chantier 3.
 *
 * POURQUOI IL EST ISOLE DE TOUTE INTERFACE, ET C'EST DELIBERE.
 * Mon modele economique repose sur la REPLICATION, plusieurs titres de niche
 * batis sur le meme coeur. Ce fichier ne connait donc ni React, ni Expo, ni le
 * micro, ni l'affichage. Il ne prend que des nombres et rend des verdicts. Il
 * se teste en une commande sans appareil, sans build et sans serveur, et il se
 * reutilisera tel quel pour un entraineur d'intervalles ou un lecteur de notes.
 *
 * AUCUNE DEPENDANCE. Rien a installer, rien a mettre a jour, rien qui casse.
 */

// ---------------------------------------------------------------------------
// Constantes musicales
// ---------------------------------------------------------------------------

export const LA_REFERENCE = 440;
export const NOMS_NOTES = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

/** Ecart en cents entre deux hauteurs. Cent = centieme de demi-ton. */
export function cents(hz        , reference        )         {
  if (hz <= 0 || reference <= 0) return NaN;
  return 1200 * Math.log2(hz / reference);
}

/**
 * LE LA DE REFERENCE EST UN PARAMETRE, ET CE N'EST PAS UN LUXE.
 * MESURE, cycle 11. Le piano de reference de l'universite de l'Iowa, enregistre
 * dans les regles, ressort a 442,2 Hz et non a 440. Ce n'est pas un defaut de
 * ce piano, c'est l'usage. Beaucoup d'orchestres et de conservatoires
 * europeens accordent a 442 ou 443, et la musique ancienne descend a 415.
 * UN ELEVE DONT L'INSTRUMENT EST ACCORDE A 442 SERAIT JUGE HUIT CENTS TROP
 * HAUT SUR CHAQUE NOTE, indefiniment, sans jamais atteindre le verdict le plus
 * haut et sans jamais comprendre pourquoi. C'est le genre de defaut qui produit
 * un avis a une etoile disant "l'application se trompe", exactement le grief
 * dont je fais mon argument de vente.
 */
export function midiVersHz(midi        , laReference         = LA_REFERENCE)         {
  return laReference * Math.pow(2, (midi - 69) / 12);
}

/** Les la de reference usuels, proposes au reglage. La liste est courte
 *  volontairement, un reglage a curseur libre inviterait a bricoler. */
export const REFERENCES_USUELLES                                  = [
  { hz: 415, usage: "musique ancienne" },
  { hz: 432, usage: "accord alternatif" },
  { hz: 440, usage: "norme internationale" },
  { hz: 442, usage: "usage courant en Europe" },
  { hz: 443, usage: "certains orchestres" },
];

export function hzVersMidi(hz        )         {
  return 69 + 12 * Math.log2(hz / LA_REFERENCE);
}

export function nomDeMidi(midi        )         {
  const m = Math.round(midi);
  return `${NOMS_NOTES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
}

// ---------------------------------------------------------------------------
// Reglages
// ---------------------------------------------------------------------------

                                                                         
                                                                       
                                                                           
                             
                  

                           
                                                                               
               
               
                                                                         
                       
                                                                             
                   
                                                                            
                   
                  
                       
                                                                  
                                                                              
                                                                                
                                                                                
                                                                        
                  
                             
                                                               
                                                                            
                                                                           
                                                                           
                                                                             
                                                                       
                                                                       
                                                                         
                       
                                                                            
                                                                                 
                     
                                                                           
                                                      
                                                                          
                                                                           
                                                                         
                                                                            
                                                           
                                                                            
                                                                             
                                                                            
                             
                                                      
                      
                                                                       
                    
 

/**
 * LE PLANCHER DU MOTEUR, ET CE N'EST PAS UN CHOIX DE PRODUIT.
 * `react-native-pitchy` porte une frequence minimale codee en dur a 65,41 Hz.
 * MESURE, cycle 11, sur 103 notes de tuba et de contrebasse situees sous cette
 * barre, la justesse brute est de ZERO pour cent. Pas degradee, nulle. Sous ce
 * plancher le detecteur ne rend pas une valeur imprecise, il rend autre chose.
 * Une application qui repond FAUX a un debutant qui joue JUSTE se fait
 * desinstaller. Elle doit repondre qu'elle n'entend pas.
 * LA VALEUR EST POSEE JUSTE SOUS LE DO 2 ET NON A 65,41 EXACTEMENT. La limite
 * de la bibliotheque EST le do 2, et le do 2 lui-meme se mesure a 99,5 pour
 * cent de justesse sur 392 notes. Une borne posee sur la note elle-meme la
 * refuserait a un cheveu pres, pour une raison d'arrondi et pour aucune raison
 * physique.
 */
export const MOTEUR_F_MIN = 65.0;

/**
 * LE PLAFOND FIABLE, et lui est un seuil doux, pas un mur.
 * MESURE, cycle 11. Justesse brute par octave, 98,0 pour cent a l'octave 5,
 * 91,0 a l'octave 6, 82,7 a l'octave 7. Au-dessus du do 7 je prefere prevenir
 * plutot que de noter une flute piccolo avec une confiance que je n'ai pas.
 */
export const MOTEUR_F_MAX_FIABLE = 2093.0;

/** La note demandee est-elle jugeable par le moteur. Retourne null si oui. */
export function cibleHorsPortee(cibleHz        )                          {
  if (!(cibleHz > 0)) return null;
  if (cibleHz < MOTEUR_F_MIN) return "GRAVE";
  if (cibleHz > MOTEUR_F_MAX_FIABLE) return "AIGU";
  return null;
}

export const REGLAGES_DEFAUT           = {
  fMin: 70,
  fMax: 1100,
  confianceMin: 0.5,
  alphaEma: 0.25,
  // Un debutant ne tient pas dix cents. Le declarer faux le fait desinstaller.
  tolJuste: 45,
  tolBien: 25,
  tolExcellent: 15,
  partAttaqueIgnoree: 1 / 3,
  attaqueMinMs: 0,
  msParTrame: 46.4,
  porteRelativeRatio: 0,
  laReference: LA_REFERENCE,
  tramesMin: 4,
};

/** Tessitures usuelles, proposees a la calibration. Bornes larges volontaires. */
export const TESSITURES                                                 = {
  basse: { fMin: 70, fMax: 400 },
  baryton: { fMin: 85, fMax: 450 },
  tenor: { fMin: 110, fMax: 550 },
  alto: { fMin: 150, fMax: 700 },
  mezzo: { fMin: 180, fMax: 900 },
  soprano: { fMin: 220, fMax: 1100 },
  enfant: { fMin: 200, fMax: 1100 },
  large: { fMin: 70, fMax: 1100 },
};

// ---------------------------------------------------------------------------
// LE MODE D'ENTREE, ajoute le 2026-08-25 (cycle 10, chantier 18)
// ---------------------------------------------------------------------------
/**
 * POURQUOI CE MODE EXISTE, ET IL VAUT UN PARAGRAPHE.
 * La mesure du chantier 17 a montre que la poche de la voix seule ne compte que
 * deux titres vivants, quand la poche voisine, la lecture de notes jouee, en
 * compte cinq et vingt fois plus de demande. Or lire une portee et la CHANTER
 * est deja de la lecture de notes, la seule difference est l'instrument qui
 * produit le son. Et ce noyau ne fait aucune difference entre les deux, une
 * hauteur est une hauteur.
 * Servir les deux ne demande donc PAS un second moteur, cela demande ce seul
 * reglage. C'est tout le cout de l'elargissement.
 *
 * CE QUE LE MODE CHANGE, ET RIEN D'AUTRE.
 *   - LA PLAGE. Un piano descend a 27 Hz et monte a 4 186, tres au-dela de
 *     toute voix. Garder les bornes vocales sur un instrument rejetterait des
 *     notes parfaitement valides.
 *   - LA TOLERANCE. Un instrument accorde ne derive pas, un chanteur si. Exiger
 *     d'une voix la precision d'un piano decourage, et accorder a un piano la
 *     tolerance d'une voix laisse passer des fausses notes. Les seuils vocaux
 *     viennent de la mesure, la derive naturelle mediane observee sur 29
 *     chanteurs est d'environ 10 cents, d'ou une tolerance genereuse a 45.
 *   - L'ATTAQUE. Une note jouee s'etablit presque instantanement, une note
 *     chantee arrive par un glissement. On jette un tiers du debut pour la voix,
 *     mesure a l'appui, et beaucoup moins pour un instrument.
 */
                                               

export const REGLAGES_PAR_MODE                                        = {
  voix: {
    fMin: 70, fMax: 1100,
    tolJuste: 45, tolBien: 25, tolExcellent: 15,
    partAttaqueIgnoree: 1 / 3,
    attaqueMinMs: 0,
    // La porte fixe reste, et ce n'est pas un oubli. Sur les deux corpus
    // vocaux elle n'a jamais rejete une seule trame juste, elle ne coute donc
    // rien ici, et la tessiture choisie a la calibration est une fonction du
    // produit et pas seulement un filtre. On ne remplace pas ce qui est mesure
    // bon par ce qui est mesure bon ailleurs.
    porteRelativeRatio: 0,
  },
  instrument: {
    // CORRIGE le 2026-08-25 (cycle 11) APRES MESURE. La version precedente
    // annoncait 27 a 4200 Hz, deduite de l'etendue d'un piano et jamais
    // confrontee au moteur. Le moteur ne descend pas sous 65,41 Hz, il y rend
    // zero pour cent de bonnes reponses sur 103 notes.
    fMin: MOTEUR_F_MIN, fMax: MOTEUR_F_MAX_FIABLE,
    // un instrument accorde tient sa note, on peut donc etre plus exigeant
    tolJuste: 25, tolBien: 12, tolExcellent: 6,
    // l'attaque d'une corde ou d'un marteau est breve mais elle est REELLE,
    // et elle se compte en millisecondes. Voir `attaqueMinMs`.
    partAttaqueIgnoree: 0.15,
    attaqueMinMs: 120,
    // dix points de justesse, gagnes en retirant un filtre. Voir le champ.
    porteRelativeRatio: 2.2,
  },
};

/** Construit les reglages d'une seance. Le mode d'abord, la tessiture ensuite
 *  si l'on chante, et les surcharges explicites en dernier. */
export function reglagesPour(
  mode            ,
  tessiture         ,
  surcharges                    = {}
)           {
  const base = { ...REGLAGES_DEFAUT, ...REGLAGES_PAR_MODE[mode] };
  // La tessiture ne s'applique qu'a la voix. Un piano n'a pas de tessiture au
  // sens vocal, et l'appliquer amputerait son clavier.
  if (mode === "voix" && tessiture && TESSITURES[tessiture]) {
    base.fMin = TESSITURES[tessiture].fMin;
    base.fMax = TESSITURES[tessiture].fMax;
  }
  return { ...base, ...surcharges };
}

// ---------------------------------------------------------------------------
// L'entree, telle que la rend react-native-pitchy
// ---------------------------------------------------------------------------

                        
                                                                
                             
 

                           
                   
                                                          
                     
                                        
                   
                                                           
                
                                                                          
                         
                         
                     
                           
                                                                  
                      
                                                                
                                
 

// ---------------------------------------------------------------------------
// Les parades, une par une
// ---------------------------------------------------------------------------

/**
 * Ramene une hauteur dans l'octave de la cible.
 *
 * MESURE, ET ELLE NUANCE CETTE FONCTION. Sur des donnees correctement annotees
 * ce repli ne gagne que 0,6 point, parce qu'un detecteur bien regle ne se
 * trompe presque jamais d'octave. Ce n'est donc PAS le levier de qualite que je
 * croyais, c'est une SECURITE bon marche. On la garde parce qu'elle ne coute
 * rien et qu'elle transforme l'erreur la plus humiliante pour l'utilisateur,
 * etre declare faux d'une octave alors qu'on chante juste, en non-evenement.
 */
export function replierOctave(hz        , cibleHz        )         {
  if (hz <= 0 || cibleHz <= 0) return hz;
  const k = Math.round(Math.log2(hz / cibleHz));
  return hz / Math.pow(2, k);
}

/** Mediane, sans dependance. */
export function mediane(xs          )         {
  if (xs.length === 0) return NaN;
  const t = [...xs].sort((a, b) => a - b);
  const m = t.length >> 1;
  return t.length % 2 ? t[m] : (t[m - 1] + t[m]) / 2;
}

/**
 * Note une tentative complete contre une hauteur cible.
 * C'est la seule fonction que l'interface a besoin d'appeler.
 */
export function noterTentative(
  trames         ,
  cibleHz        ,
  reglages           = REGLAGES_DEFAUT
)           {
  const retenues           = [];
  const affichage           = [];
  let ema                = null;
  let rejetConfiance = 0;
  let rejetPlage = 0;
  let octavesCorrigees = 0;

  // LA NOTE DEMANDEE EST-ELLE JUGEABLE. On repond avant de juger quoi que ce
  // soit, parce qu'un verdict FAUX rendu sur une note que le moteur n'entend
  // pas est un mensonge, et le pire de tous, celui qui accuse l'utilisateur.
  const horsPortee = cibleHorsPortee(cibleHz);
  if (horsPortee !== null) {
    return {
      verdict: "HORS_PORTEE", ecartCents: NaN, hzMedian: NaN, score: 0,
      tramesRetenues: 0, rejetConfiance: 0, rejetPlage: 0,
      octavesCorrigees: 0, affichage: [], horsPortee,
    };
  }

  // LA PORTE DE PLAGE. Relative a la note demandee quand le mode le prevoit,
  // fixe sinon. Mesure du cycle 11, la porte fixe jetait 288 bonnes reponses
  // sur 2913 des qu'on sortait de la tessiture d'une voix.
  const relatif = reglages.porteRelativeRatio > 0;
  const borneBasse = relatif
    ? Math.max(MOTEUR_F_MIN, cibleHz / reglages.porteRelativeRatio)
    : reglages.fMin;
  const borneHaute = relatif
    ? cibleHz * reglages.porteRelativeRatio
    : reglages.fMax;

  for (const t of trames) {
    if (!(t.hz > 0) || t.confiance < reglages.confianceMin) {
      rejetConfiance++;
      continue;
    }
    if (t.hz < borneBasse || t.hz > borneHaute) {
      rejetPlage++;
      continue;
    }
    const corrige = replierOctave(t.hz, cibleHz);
    if (Math.abs(cents(corrige, t.hz)) > 1) octavesCorrigees++;
    retenues.push(corrige);
    ema = ema === null ? corrige : reglages.alphaEma * corrige + (1 - reglages.alphaEma) * ema;
    affichage.push(ema);
  }

  if (retenues.length < reglages.tramesMin) {
    return {
      verdict: "SILENCE", ecartCents: NaN, hzMedian: NaN, score: 0,
      tramesRetenues: retenues.length, rejetConfiance, rejetPlage,
      octavesCorrigees, affichage,
    };
  }

  // On jette l'attaque. Deux mesures du meme phenomene, une en proportion pour
  // le glissando du chanteur, une en millisecondes pour le choc de la corde.
  // On prend la plus exigeante des deux, puis on garde toujours de quoi juger.
  const parFraction = Math.floor(retenues.length * reglages.partAttaqueIgnoree);
  const parDuree = reglages.msParTrame > 0
    ? Math.ceil(reglages.attaqueMinMs / reglages.msParTrame)
    : 0;
  const plafond = Math.max(0, retenues.length - reglages.tramesMin);
  const debut = Math.min(Math.max(parFraction, parDuree), plafond);
  const fenetre = retenues.slice(debut);
  const hzMedian = mediane(fenetre.length ? fenetre : retenues);
  const ecart = cents(hzMedian, cibleHz);
  const abs = Math.abs(ecart);

  let verdict         ;
  if (abs <= reglages.tolExcellent) verdict = "EXCELLENT";
  else if (abs <= reglages.tolBien) verdict = "BIEN";
  else if (abs <= reglages.tolJuste) verdict = "JUSTE";
  else verdict = "FAUX";

  // Score lineaire, 100 a zero cent, 0 a la tolerance de justesse doublee.
  const score = Math.max(0, Math.round(100 * (1 - abs / (reglages.tolJuste * 2))));

  return {
    verdict, ecartCents: ecart, hzMedian, score,
    tramesRetenues: retenues.length, rejetConfiance, rejetPlage,
    octavesCorrigees, affichage,
  };
}

/** Position du curseur, de -1 (trop grave) a +1 (trop aigu), bornee. */
export function positionCurseur(hz        , cibleHz        , etendueCents = 100)         {
  const c = cents(hz, cibleHz);
  if (Number.isNaN(c)) return 0;
  return Math.max(-1, Math.min(1, c / etendueCents));
}
