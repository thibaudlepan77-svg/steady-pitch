/**
 * tessiture.ts, DU FLUX DE HAUTEURS A UNE ETENDUE VOCALE.
 * Agent N4, 2026-09-03 (cycle 17).
 *
 * POURQUOI CE FICHIER EXISTE, ET IL NE VIENT PAS D'UNE ENVIE.
 * Mesure d'autocompletion du 2026-09-03, la famille `vocal range test` porte
 * dix variantes distinctes, `tester`, `online`, `free`, `female`, `male`,
 * `app`, `calculator`, `finder`, `chart`, la ou `vocal pitch monitor` n'en
 * porte que des declinaisons du meme objet. Et la famille de questions
 * `am i singing in tune`, `in key`, `flat`, `the right note` est une demande
 * de VERDICT, pas d'affichage. Un moniteur affiche, un test tranche. Je n'ai
 * jamais rien vendu avec un affichage.
 *
 * CE QU'IL FAIT, ET CE QU'IL REFUSE DE FAIRE.
 * Il prend la suite de trames que le detecteur produit pendant qu'on glisse
 * vers le grave, puis vers l'aigu, et il en tire UNE note extreme defendable.
 * Il ne prend jamais le minimum brut. Le minimum brut d'un balayage vocal est
 * presque toujours une erreur d'octave, un claquement de bouche ou la premiere
 * trame d'un raclement de gorge, et une etendue batie dessus est un mensonge
 * flatteur, ce qui est la pire espece.
 *
 * LES QUATRE REGLES QUI SEPARENT UNE NOTE D'UN ARTEFACT, chacune repond a une
 * facon precise dont la mesure brute se trompe.
 *   1. LA TENUE. Une note compte quand elle est TENUE. Une trame isolee au
 *      fond du balayage n'est pas une note chantee, c'est un accident du
 *      detecteur. Le moniteur rend environ 23 trames par seconde, mesure du
 *      cycle 16, 234 points pour dix secondes. Quatre trames font donc a peu
 *      pres 170 ms, ce qui est court pour un chanteur et long pour un clic.
 *   2. LA CONTINUITE. Une voix qui glisse ne saute pas. Entre deux trames
 *      voisines, un ecart de plus d'une quinte n'est pas physique.
 *   3. LE REPLI D'OCTAVE. Parmi ces sauts, ceux qui valent 1200 cents a
 *      quelques dizaines pres sont l'erreur classique du detecteur, et non un
 *      bond du chanteur. On les replie au lieu de les jeter, sinon on jette la
 *      moitie du grave, qui est exactement la zone qu'on cherche a mesurer.
 *   4. LE BUTOIR DU MOTEUR. Sous 65,41 Hz mon detecteur ne mesure plus, il l'a
 *      toujours dit. Une basse reelle descend plus bas. Quand l'extreme touche
 *      cette borne, le resultat le DECLARE au lieu de faire passer une limite
 *      d'instrument pour une limite de chanteur. C'est le seul point ou ce
 *      fichier peut rendre un resultat moins flatteur que la concurrence, et
 *      c'est celui que je ne negocierai pas.
 *
 * AUCUNE DEPENDANCE, comme tout le noyau. Il prend des nombres, il rend un
 * verdict, il se teste sans micro et sans navigateur.
 */

import { cents, hzVersMidi } from "./notation.js";

// ---------------------------------------------------------------------------
// Entree et reglages
// ---------------------------------------------------------------------------

/** Une trame de detection, telle que `yinDetect` la rend. */
                                 
             
                    
 

                                            

                                    
                                                                      
                       
                                                                               
                       
                                                                             
                               
                                                                            
                      
                                                        
                              
                                                                          
                      
                      
 

/**
 * ETALEMENT DE TENUE A 90 CENTS, ET CE CHIFFRE VIENT DE MA PROPRE MESURE.
 * Le cycle 10 a releve une derive naturelle mediane d'environ 10 cents sur 29
 * chanteurs, en note tenue confortable. Aux DEUX BOUTS de la tessiture cette
 * derive explose, la voix tremble, se casse et repart. Exiger 25 cents la-bas
 * reviendrait a declarer qu'aucun chanteur n'a de note grave. Trois quarts de
 * demi-ton laisse passer un tremblement sans jamais laisser passer un
 * demi-ton, qui changerait la note affichee.
 */
export const REGLAGES_TESSITURE                    = {
  confianceMin: 0.55,
  sautMaxCents: 700,
  toleranceOctaveCents: 60,
  tramesTenue: 4,
  etalementTenueCents: 90,
  moteurHzMin: 65.41,
  moteurHzMax: 2093.0,
};

// ---------------------------------------------------------------------------
// Le balayage
// ---------------------------------------------------------------------------

                                 
                                              
                  
                                                                              
                     
                                                                     
                                                                  
                  
                                                                        
                        
 

                        
                                                            
               
                 
 

                                   
                                                                              
                             
                                                        
                  
                         
                         
     
                                                                            
                                                                         
             
     
                        
 

function medianeDe(xs          )         {
  const t = [...xs].sort((a, b) => a - b);
  const m = t.length >> 1;
  return t.length % 2 ? t[m] : (t[m - 1] + t[m]) / 2;
}

/**
 * LE REPLI D'OCTAVE EST UN PIEGE, ET IL M'A PRIS AU PREMIER ESSAI EN
 * NAVIGATEUR. Voici la faute exacte, parce qu'elle est instructive.
 *
 * Ma premiere version repliait chaque trame sur la PRECEDENTE. Une seule trame
 * fausse au debut d'un balayage devenait alors une ancre, et les cinquante-huit
 * trames suivantes, parfaitement justes, etaient repliees sur elle une par une.
 * Le banc en navigateur a lu un la 4 tenu deux secondes et a rendu un la 2.
 * Le repli n'etait pas une correction, c'etait un cliquet.
 *
 * ET CE N'ETAIT PAS UN ARTEFACT DE BANC. Une chanteuse qui bascule en voix de
 * tete au sommet de son balayage monte d'une octave POUR DE VRAI. Ma premiere
 * version lui aurait efface tout son aigu, silencieusement, et c'est justement
 * la note qu'elle venait chercher.
 *
 * CE QUI SEPARE VRAIMENT UN GLISSEMENT DU DETECTEUR D'UNE OCTAVE CHANTEE, ce
 * n'est ni la duree ni le sens, c'est LE RETOUR. Quand le detecteur glisse, la
 * lecture revient ensuite d'ou elle venait, la faute est prise en sandwich.
 * Quand la voix saute, elle reste. On ne replie donc que ce qui est encadre,
 * et on scanne pour le savoir, ce qui est possible parce que l'analyse voit
 * tout le balayage a la fois.
 */

/** Un palier de lecture, des trames voisines qui tiennent la meme hauteur. */
                  
                    
                                                                          
                                                                               
                                                                   
                        
                  
 

/** Nombre d'octaves qui explique l'ecart, ou zero quand rien ne l'explique. */
function octavesDEcart(ecartCents        , tolerance        )         {
  for (const octaves of [1, -1, 2, -2]) {
    if (Math.abs(ecartCents - octaves * 1200) <= tolerance) return octaves;
  }
  return 0;
}

/** Decoupe le balayage en paliers, en comptant au passage ce qui est jete. */
function decouperEnPaliers(
  trames                  ,
  reglages                   ,
  rejets                ,
)                                               {
  const paliers           = [];
  let butoirMoteur = false;
  let courant                = null;
  let coupureEnAttente = true;

  const fermer = () => {
    if (courant) {
      courant.mediane = medianeDe(courant.valeurs);
      paliers.push(courant);
      courant = null;
    }
  };

  for (const trame of trames) {
    if (!(trame.hz > 0) || trame.confiance < reglages.confianceMin) {
      rejets.silence++;
      fermer();
      coupureEnAttente = true;
      continue;
    }
    if (trame.hz < reglages.moteurHzMin || trame.hz > reglages.moteurHzMax) {
      rejets.horsMoteur++;
      butoirMoteur = true;
      fermer();
      coupureEnAttente = true;
      continue;
    }

    if (courant) {
      const min = Math.min(courant.valeurs[0], trame.hz);
      const max = Math.max(courant.valeurs[0], trame.hz);
      // Le palier se mesure a sa PREMIERE valeur et non a ses extremes, sinon
      // un glissando lent glisserait de proche en proche sans jamais fermer un
      // palier, et le decoupage ne decouperait rien.
      const etale = cents(max, min) > reglages.etalementTenueCents;
      const saute = Math.abs(cents(trame.hz, courant.valeurs[courant.valeurs.length - 1]))
        > reglages.sautMaxCents;
      if (etale || saute) fermer();
    }

    if (!courant) {
      courant = { valeurs: [], apresCoupure: coupureEnAttente, mediane: 0 };
      coupureEnAttente = false;
    }
    courant.valeurs.push(trame.hz);
  }
  fermer();

  return { paliers, butoirMoteur };
}

/**
 * Analyse un balayage et rend l'extreme TENU dans le sens demande.
 *
 * Un saut ne coupe pas la mesure, il ouvre un palier. Une respiration au
 * milieu d'un glissando est normale, et s'arreter la jetterait tout ce qui
 * suit, c'est-a-dire souvent la note qu'on cherchait.
 */
export function analyserBalayage(
  trames                  ,
  sens              ,
  reglages                    = REGLAGES_TESSITURE,
)                   {
  const rejets                 = { silence: 0, horsMoteur: 0, rupture: 0, octaveRepliee: 0 };
  const { paliers, butoirMoteur } = decouperEnPaliers(trames, reglages, rejets);

  // LE REPLI, PALIER PAR PALIER, ET SEULEMENT QUAND IL EST ENCADRE.
  for (let k = 1; k < paliers.length; k++) {
    const palier = paliers[k];
    if (palier.apresCoupure) continue;

    const ancre = paliers[k - 1].mediane;
    const ecart = cents(palier.mediane, ancre);
    if (Math.abs(ecart) <= reglages.sautMaxCents) continue;

    const octaves = octavesDEcart(ecart, reglages.toleranceOctaveCents);
    const suivant = paliers[k + 1];
    const revient = octaves !== 0 && suivant !== undefined && !suivant.apresCoupure
      && Math.abs(cents(suivant.mediane, ancre)) <= reglages.etalementTenueCents;

    if (revient) {
      const facteur = Math.pow(2, octaves);
      palier.valeurs = palier.valeurs.map((hz) => hz / facteur);
      palier.mediane = palier.mediane / facteur;
      rejets.octaveRepliee += palier.valeurs.length;
    } else {
      rejets.rupture++;
    }
  }

  const tenues          = [];
  let tramesRetenues = 0;
  for (const palier of paliers) {
    tramesRetenues += palier.valeurs.length;
    if (palier.valeurs.length >= reglages.tramesTenue) {
      tenues.push({ midi: hzVersMidi(palier.mediane), trames: palier.valeurs.length });
    }
  }

  let extremeMidi                = null;
  for (const tenue of tenues) {
    if (extremeMidi === null) extremeMidi = tenue.midi;
    else if (sens === "grave") extremeMidi = Math.min(extremeMidi, tenue.midi);
    else extremeMidi = Math.max(extremeMidi, tenue.midi);
  }

  return { extremeMidi, tenues, tramesRetenues, rejets, butoirMoteur };
}

// ---------------------------------------------------------------------------
// La classification
// ---------------------------------------------------------------------------

                                                                                    

                                
                 
                                                                             
                                                                              
                                                          
                    
                  
                   
 

/**
 * Les six etendues de reference, en MIDI. Ce sont des CONVENTIONS de
 * repertoire, pas des mesures, et la page le dit. Les bornes retenues sont
 * celles que l'on trouve identiques d'un ouvrage a l'autre, mi1 a mi3 pour la
 * basse jusqu'a do3 a do5 pour la soprano, chacune sur deux octaves pleines.
 * Elles se chevauchent largement, et ce chevauchement est la raison pour
 * laquelle on rend un SECOND type au lieu d'un verdict unique.
 */
export const VOIX_REFERENCE                  = [
  { type: "basse", etiquette: "Bass", basMidi: 40, hautMidi: 64 },
  { type: "baryton", etiquette: "Baritone", basMidi: 45, hautMidi: 69 },
  { type: "tenor", etiquette: "Tenor", basMidi: 48, hautMidi: 72 },
  { type: "alto", etiquette: "Alto", basMidi: 53, hautMidi: 77 },
  { type: "mezzo", etiquette: "Mezzo-soprano", basMidi: 57, hautMidi: 81 },
  { type: "soprano", etiquette: "Soprano", basMidi: 60, hautMidi: 84 },
];

                                 
                           
                                                                                
                
 

                             
                           
                         
     
                                                                               
                                                                              
                                                                          
     
                  
 

function recouvrementJaccard(bas        , haut        , ref               )         {
  const debut = Math.max(bas, ref.basMidi);
  const fin = Math.min(haut, ref.hautMidi);
  const commun = Math.max(0, fin - debut);
  const union = Math.max(haut, ref.hautMidi) - Math.min(bas, ref.basMidi);
  return union > 0 ? commun / union : 0;
}

/** Classe une etendue mesuree parmi les six types conventionnels. */
export function classerVoix(basMidi        , hautMidi        )             {
  const correspondances = VOIX_REFERENCE
    .map((reference) => ({ reference, score: recouvrementJaccard(basMidi, hautMidi, reference) }))
    .sort((a, b) => b.score - a.score);

  return {
    meilleur: correspondances[0],
    second: correspondances[1],
    ambigu: correspondances[0].score - correspondances[1].score < 0.05,
  };
}

// ---------------------------------------------------------------------------
// Le resultat rendu au visiteur
// ---------------------------------------------------------------------------

                          
                  
                   
                   
                  
                                                                         
                           
                         
                                                                         
                                    
                    
 

export function composerEtendue(
  grave                  ,
  aigu                  ,
)                 {
  if (grave.extremeMidi === null || aigu.extremeMidi === null) return null;

  // Un balayage rate peut rendre un grave plus haut que l'aigu. On remet dans
  // l'ordre plutot que de rendre une etendue negative, qui n'apprendrait rien
  // a personne et casserait tous les affichages en aval.
  const bas = Math.min(grave.extremeMidi, aigu.extremeMidi);
  const haut = Math.max(grave.extremeMidi, aigu.extremeMidi);

  const demiTons = Math.round(haut - bas);
  return {
    basMidi: bas,
    hautMidi: haut,
    demiTons,
    octaves: Math.floor(demiTons / 12),
    demiTonsRestants: demiTons % 12,
    classement: classerVoix(bas, haut),
    tronquee: grave.butoirMoteur || aigu.butoirMoteur,
  };
}

/** L'etendue en une phrase anglaise, `2 octaves and 3 semitones`. */
export function etendueLisible(etendue         )         {
  const morceaux           = [];
  if (etendue.octaves) {
    morceaux.push(`${etendue.octaves} octave${etendue.octaves > 1 ? "s" : ""}`);
  }
  if (etendue.demiTonsRestants || !morceaux.length) {
    const n = etendue.demiTonsRestants;
    morceaux.push(`${n} semitone${n === 1 ? "" : "s"}`);
  }
  return morceaux.join(" and ");
}
