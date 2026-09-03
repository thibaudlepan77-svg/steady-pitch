/**
 * seance.ts, LA COUCHE QUI MANQUAIT ENTRE LE MOTEUR ET L'ECRAN.
 * Agent N4, 2026-08-25 (cycle 11, chantier 6).
 *
 * CE QUI EXISTAIT, ET CE QUI N'EXISTAIT PAS.
 * `notation.ts` sait juger UNE tentative contre UNE note. `exercices.ts` sait
 * quelles notes demander. Entre les deux, rien. Personne ne savait dans quel
 * ordre demander, quand accepter, quand faire recommencer, quand declarer un
 * exercice reussi, ni quoi retenir a la fin. C'est cette couche-la qui fait la
 * difference entre une fonction de notation et une APPLICATION.
 *
 * POURQUOI ELLE EST ICI ET PAS DANS L'ECRAN, ET C'EST LE POINT ECONOMIQUE.
 * Mon modele repose sur la REPLICATION, plusieurs titres batis sur le meme
 * coeur. Si la conduite d'une seance vit dans un composant React, elle se
 * reecrit a chaque titre et la replication n'existe plus. Ici, elle ne connait
 * ni React, ni le micro, ni l'affichage, elle prend des verdicts et rend un
 * etat. Un ecran ne fait plus que la dessiner.
 *
 * ELLE EST DELIBEREMENT SANS ETAT CACHE ET SANS HORLOGE. Aucune date, aucun
 * hasard non fourni, aucune mutation globale. Deux appels identiques rendent
 * deux resultats identiques, ce qui la rend testable en entier sans appareil.
 *
 * AUCUNE DEPENDANCE, comme le reste du noyau.
 */

import {
  noterTentative, cibleHorsPortee,                                            
} from "./notation.js";
import {
  CURRICULUM, preparer,                                  
} from "./exercices.js";

// ---------------------------------------------------------------------------
// Les regles de conduite, et chacune se justifie
// ---------------------------------------------------------------------------

                               
                                                   
                                                                            
                                                                              
                                      
                              
                                                                   
                                                                                   
                          
                                                                          
                                                                             
                                                                          
                             
                                                                          
                          
 

export const REGLES_DEFAUT               = {
  verdictsAcceptes: ["EXCELLENT", "BIEN", "JUSTE"],
  essaisAvantAide: 3,
  essaisAvantPassage: 6,
  partPourValider: 0.8,
};

// ---------------------------------------------------------------------------
// L'etat d'une seance
// ---------------------------------------------------------------------------

                   
                                                       
                                                                          
                                                              
                                                                       
                     // plus d'exercice a faire

                           
                
                     
                 
                   
                  
                                                                                
                        
                                                                         
                                                                            
                      
 

                             
                                                                           
                        
                      
                    
                    
               
                                                            
                          
                                                                         
                                                                       
                        
                                                                    
                      
 

                                
                     
                         
                        
                       
                          
                      
                                                                            
                      
                  
                                       
 

// ---------------------------------------------------------------------------
// Ouverture
// ---------------------------------------------------------------------------

/**
 * LE CATALOGUE EST UN PARAMETRE, ET C'EST LA MESURE DU CYCLE 11.
 * Mon plan affirme que la replication est le modele economique, plusieurs
 * titres sur un seul coeur. Cette affirmation ne valait rien tant qu'un second
 * titre n'existait pas, exactement comme l'equivalence voix et instrument ne
 * valait rien avant d'etre mesuree. Rendre le catalogue parametrable est le
 * SEUL changement qu'a demande le titre numero 2. Le reste du fichier n'a pas
 * bouge d'une ligne.
 */
function trouver(id        , catalogue            )           {
  const e = catalogue.find(x => x.id === id);
  if (!e) throw new Error(`exercice inconnu, ${id}`);
  return e;
}

function etatsNotes(ex          , toniqueMidi        , laReference        )             {
  return preparer(ex, toniqueMidi, laReference).map((note, index) => ({
    index, note, essais: 0, reussie: false, passee: false,
    meilleurEcart: NaN,
    horsPortee: cibleHorsPortee(note.hz) !== null,
  }));
}

/**
 * Ouvre une seance sur une liste d'exercices, dans une tonique donnee.
 * La liste est fournie par l'appelant et non deduite ici, pour qu'un autre
 * titre puisse batir la sienne sans toucher a ce fichier.
 */
export function ouvrir(exerciceIds          , toniqueMidi        ,
                       catalogue             = CURRICULUM,
                       laReference = 440)             {
  if (exerciceIds.length === 0) {
    return {
      exercices: [], indexExercice: 0, toniqueMidi, notes: [], indexNote: 0,
      etape: "SEANCE_FINIE", bilans: [], catalogue, laReference,
    };
  }
  const notes = etatsNotes(trouver(exerciceIds[0], catalogue), toniqueMidi, laReference);
  const depart = premiereJugeable(notes, 0);
  return {
    exercices: [...exerciceIds], indexExercice: 0, toniqueMidi,
    notes, indexNote: depart < 0 ? notes.length : depart,
    etape: depart < 0 ? "EXERCICE_FINI" : "ATTENTE",
    bilans: [], catalogue, laReference,
  };
}

/** La premiere note jugeable a partir d'un index. Les notes hors de portee du
 *  moteur sont sautees sans jamais etre presentees, parce qu'on ne demande pas
 *  a quelqu'un de produire un son qu'on ne saura pas ecouter. */
function premiereJugeable(notes            , depuis        )         {
  for (let i = depuis; i < notes.length; i++) {
    if (!notes[i].horsPortee) return i;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Le pas de la seance
// ---------------------------------------------------------------------------

                         
                   
                     
                   
                                                              
                           
 

/**
 * Traite UNE tentative sur la note courante et rend le nouvel etat.
 * L'etat d'entree n'est jamais modifie, on en rend un neuf. Un etat immuable
 * est ce qui permet a un ecran de le comparer d'un rendu a l'autre, et a un
 * banc d'essai de rejouer une seance entiere sans effet de bord.
 */
export function tenter(etat            , trames                                      ,
                       reglages          ,
                       regles               = REGLES_DEFAUT)         {
  if (etat.etape === "SEANCE_FINIE" || etat.indexNote >= etat.notes.length) {
    return {
      etat, accepte: false, exerciceTermine: false,
      resultat: noterTentative([], 0, reglages),
    };
  }

  const notes = etat.notes.map(n => ({ ...n }));
  const courante = notes[etat.indexNote];
  const r = noterTentative(trames, courante.note.hz, reglages);
  courante.essais++;

  const accepte = regles.verdictsAcceptes.includes(r.verdict);
  if (Number.isFinite(r.ecartCents)) {
    const a = Math.abs(r.ecartCents);
    if (!Number.isFinite(courante.meilleurEcart) || a < courante.meilleurEcart) {
      courante.meilleurEcart = a;
    }
  }
  if (accepte) courante.reussie = true;
  else if (courante.essais >= regles.essaisAvantPassage) courante.passee = true;

  let suivant = { ...etat, notes };

  if (courante.reussie || courante.passee) {
    const i = premiereJugeable(notes, etat.indexNote + 1);
    if (i < 0) {
      suivant = { ...suivant, indexNote: notes.length, etape: "EXERCICE_FINI" };
    } else {
      suivant = { ...suivant, indexNote: i, etape: "NOTE_FINIE" };
    }
  } else if (courante.essais >= regles.essaisAvantAide) {
    suivant = { ...suivant, etape: "AIDE" };
  } else {
    suivant = { ...suivant, etape: "ATTENTE" };
  }

  return {
    etat: suivant, resultat: r, accepte,
    exerciceTermine: suivant.etape === "EXERCICE_FINI",
  };
}

// ---------------------------------------------------------------------------
// Cloture d'un exercice et passage au suivant
// ---------------------------------------------------------------------------

function mediane(xs          )         {
  const t = xs.filter(Number.isFinite).sort((a, b) => a - b);
  if (t.length === 0) return NaN;
  const m = t.length >> 1;
  return t.length % 2 ? t[m] : (t[m - 1] + t[m]) / 2;
}

export function bilan(etat            )                {
  const notes = etat.notes;
  const jugeables = notes.filter(n => !n.horsPortee);
  const reussies = jugeables.filter(n => n.reussie).length;
  const essais = notes.reduce((s, n) => s + n.essais, 0);
  const part = jugeables.length ? reussies / jugeables.length : 0;
  const ec = mediane(notes.map(n => n.meilleurEcart));
  // Le score recompense la justesse ET l'economie d'essais. Un exercice
  // reussi du premier coup vaut plus que le meme reussi au sixieme, sinon la
  // progression ne veut rien dire et l'utilisateur le sent tout de suite.
  const parfait = jugeables.length;
  const rendement = essais > 0 ? Math.min(1, parfait / essais) : 0;
  return {
    exerciceId: etat.exercices[etat.indexExercice] ?? "",
    notesDemandees: jugeables.length,
    notesReussies: reussies,
    notesPassees: jugeables.filter(n => n.passee).length,
    notesHorsPortee: notes.length - jugeables.length,
    essaisTotal: essais,
    ecartMedian: ec,
    valide: part >= REGLES_DEFAUT.partPourValider,
    score: Math.round(100 * (0.7 * part + 0.3 * rendement)),
  };
}

/** Ferme l'exercice courant, enregistre son bilan et ouvre le suivant. */
export function exerciceSuivant(etat            )             {
  const b = bilan(etat);
  const bilans = [...etat.bilans, b];
  const i = etat.indexExercice + 1;
  if (i >= etat.exercices.length) {
    return { ...etat, bilans, indexExercice: i, etape: "SEANCE_FINIE" };
  }
  const notes = etatsNotes(trouver(etat.exercices[i], etat.catalogue),
                           etat.toniqueMidi, etat.laReference);
  const depart = premiereJugeable(notes, 0);
  return {
    ...etat, bilans, indexExercice: i, notes,
    indexNote: depart < 0 ? notes.length : depart,
    etape: depart < 0 ? "EXERCICE_FINI" : "ATTENTE",
  };
}

// ---------------------------------------------------------------------------
// Le resume de fin de seance, ce que l'utilisateur emporte
// ---------------------------------------------------------------------------

                               
                         
                           
                        
                         
                      
                      
                     
                                                                              
                                        
                  
 

export function resumer(etat            )               {
  const b = etat.bilans;
  const dem = b.reduce((s, x) => s + x.notesDemandees, 0);
  const reu = b.reduce((s, x) => s + x.notesReussies, 0);
  const pire = b.length
    ? b.reduce((p, x) => (x.score < p.score ? x : p), b[0])
    : null;
  return {
    exercicesFaits: b.length,
    exercicesValides: b.filter(x => x.valide).length,
    notesReussies: reu,
    notesDemandees: dem,
    essaisTotal: b.reduce((s, x) => s + x.essaisTotal, 0),
    ecartMedian: mediane(b.map(x => x.ecartMedian)),
    scoreMoyen: b.length ? Math.round(b.reduce((s, x) => s + x.score, 0) / b.length) : 0,
    aRevoir: pire && !pire.valide ? pire.exerciceId : "",
  };
}

// ---------------------------------------------------------------------------
// LE CHOIX DE LA SEANCE DU JOUR
// ---------------------------------------------------------------------------

/**
 * Construit la liste d'exercices d'une seance a partir de ce qui a deja ete
 * valide. Deux principes, et ils viennent des avis negatifs lus au cycle 10.
 *   - ON NE REPART JAMAIS DE ZERO. Le grief le plus frequent apres la
 *     detection est de devoir refaire ce qui est acquis.
 *   - ON REVOIT UN ACQUIS AVANT D'EN AJOUTER UN NEUF. Un exercice deja valide
 *     ouvre la seance, pour donner une reussite en premier.
 */
export function seanceDuJour(validesIds          , longueur = 5,
                             catalogue             = CURRICULUM)           {
  const valides = new Set(validesIds);
  const neufs = catalogue.filter(e => !valides.has(e.id)).map(e => e.id);
  const revus = catalogue.filter(e => valides.has(e.id)).map(e => e.id);
  const liste           = [];
  // un rappel d'abord, le dernier valide, celui qui est le plus frais
  if (revus.length) liste.push(revus[revus.length - 1]);
  for (const id of neufs) {
    if (liste.length >= longueur) break;
    liste.push(id);
  }
  // si tout est valide, on revoit les plus anciens
  for (const id of revus) {
    if (liste.length >= longueur) break;
    if (!liste.includes(id)) liste.push(id);
  }
  return liste;
}
