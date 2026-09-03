/**
 * ecran.ts, CE QUE L'ECRAN DOIT MONTRER, CALCULE SANS ECRAN.
 * Agent N4, 2026-08-25 (cycle 11, chantier 9).
 *
 * LE PARI DE CE FICHIER, ET C'EST LE MEME QUE POUR `seance.ts`.
 * Un composant d'interface contient deux choses melangees, DES DECISIONS
 * (quel texte, quelle couleur, quelle etiquette d'accessibilite, quel bouton
 * actif) et DU DESSIN (des balises, des styles). Les bugs et la valeur sont
 * dans les decisions, jamais dans le dessin. Or seul le dessin exige un
 * appareil, un simulateur et un serveur que ma machine ne supporte pas.
 * Alors je sors toutes les decisions ici, ou elles se testent en une commande,
 * et le composant React Native ne fera plus que dessiner ce que ce fichier lui
 * dicte. C'est aussi ce qui rend le titre suivant bon marche.
 *
 * REGLE QUE JE M'IMPOSE, ce fichier ne contient AUCUNE couleur au format
 * hexadecimal et AUCUNE dimension en pixels. Il rend des INTENTIONS, que le
 * theme de l'application traduit. Un theme se change, une decision non.
 *
 * AUCUNE DEPENDANCE.
 */

import {
  cents, hzVersMidi, positionCurseur,                              
} from "./notation.js";
import {
                                      bilan, resumer,
} from "./seance.js";
import { t, nommerNote,                                } from "./langues.js";
import { annoncer, annoncerCible, direction } from "./accessibilite.js";

/** Les intentions visuelles. Le theme les traduit, ce fichier n'en sait rien. */
                                                                      

                         
                                                        
                  
                 
                                                            
                     
 

                            
                                                                             
                       
                                                         
                   
                                                                     
                        
                                                                             
                  
                                                 
                          
           
                                                               
                 
                                                                            
                  
                    
                                           
                     
                                                           
                
 

                           
                 
                        
                  
                      
 

function tonDe(r                 )      {
  if (!r) return "neutre";
  switch (r.verdict) {
    case "EXCELLENT":
    case "BIEN":
      return "succes";
    case "JUSTE":
      return "presque";
    case "FAUX":
      return "rate";
    case "HORS_PORTEE":
      return "inerte";
    default:
      return "neutre";
  }
}

/**
 * Construit tout ce que l'ecran doit afficher, a partir de l'etat de seance et
 * du dernier resultat. `dernier` vaut null quand rien n'a encore ete tente sur
 * la note courante, ce qui est le cas au tout debut et apres chaque passage.
 */
export function vue(etat            , dernier                 ,
                    ctx          )            {
  const fini = etat.etape === "SEANCE_FINIE";
  const noteCourante = etat.notes[etat.indexNote];

  // Les notes hors de portee ne sont jamais presentees, donc l'index courant
  // designe toujours une note jugeable, ou depasse le tableau.
  const jugeables = etat.notes.filter(n => !n.horsPortee);
  const faites = jugeables.filter(n => n.reussie || n.passee).length;
  const avancement = jugeables.length ? faites / jugeables.length : 1;

  if (fini || !noteCourante) {
    return {
      noteDemandee: "", consigne: "", positionTexte: "",
      curseur: 0, curseurVisible: false, ton: "neutre",
      retour: "", annonce: "",
      boutons: [{
        cle: "terminer", libelle: t("suivant", ctx.langue),
        actif: true, principal: true,
      }],
      avancement: 1, fini: true,
    };
  }

  // LE MENSONGE D'ECRAN QUE MON BANC A TROUVE, ET IL ETAIT SERIEUX.
  // `tenter` avance automatiquement des qu'une note est reussie ou passee. Si
  // l'ecran affichait bêtement la note courante, il montrerait la note
  // SUIVANTE accompagnee du verdict de la PRECEDENTE. L'utilisateur lirait
  // "Parfait" sous une note qu'il n'a pas encore chantee.
  // Quand une note vient de se terminer, on affiche donc celle qu'on vient de
  // faire, avec son verdict, et le bouton suivant devient l'action principale.
  const vientDeFinir = etat.etape === "NOTE_FINIE" && dernier !== null;
  let affichee = noteCourante;
  if (vientDeFinir) {
    for (let i = etat.indexNote - 1; i >= 0; i--) {
      if (etat.notes[i].reussie || etat.notes[i].passee) {
        affichee = etat.notes[i];
        break;
      }
    }
  }

  const nom = nommerNote(affichee.note.midi, ctx.systeme, ctx.toniqueMidi);
  const rangJugeable = jugeables.indexOf(affichee) + 1;

  // LE CURSEUR NE S'AFFICHE QUE QUAND IL VEUT DIRE QUELQUE CHOSE. Un curseur
  // fige a zero pendant qu'on ne chante pas laisse croire qu'on chante juste.
  const curseurVisible = dernier !== null
    && dernier.verdict !== "SILENCE"
    && dernier.verdict !== "HORS_PORTEE"
    && Number.isFinite(dernier.hzMedian);

  const boutons           = [];
  // On ne propose d'ECOUTER la note qu'apres trois echecs, et jamais avant.
  // Offrir la reponse d'emblee supprime l'effort, donc l'apprentissage.
  boutons.push({
    cle: "ecouter", libelle: t("reessayer", ctx.langue),
    actif: etat.etape === "AIDE", principal: false,
  });
  boutons.push({
    cle: "suivant", libelle: t("suivant", ctx.langue),
    actif: vientDeFinir, principal: vientDeFinir,
  });

  return {
    noteDemandee: nom,
    consigne: t(ctx.chante ? "chantez" : "jouez", ctx.langue),
    positionTexte: `${rangJugeable} ${t("sur", ctx.langue)} ${jugeables.length}`,
    curseur: curseurVisible && dernier
      ? positionCurseur(dernier.hzMedian, affichee.note.hz)
      : 0,
    curseurVisible,
    ton: tonDe(dernier),
    retour: dernier ? annoncer(dernier, ctx.langue) : "",
    annonce: dernier
      ? annoncer(dernier, ctx.langue)
      : annoncerCible(affichee.note.midi, ctx.chante, ctx.langue,
                      ctx.systeme, ctx.toniqueMidi),
    boutons,
    avancement,
    fini: false,
  };
}

// ---------------------------------------------------------------------------
// L'ECRAN DE FIN
// ---------------------------------------------------------------------------

                            
                
                                                
                                                          
                 
                  
           
 

export function vueResume(etat            , ctx          )            {
  const r               = resumer(etat);
  const part = r.notesDemandees ? r.notesReussies / r.notesDemandees : 0;
  const ton      = part >= 0.9 ? "succes" : part >= 0.6 ? "presque" : "rate";

  const lignes = [
    { libelle: t("score", ctx.langue), valeur: String(r.scoreMoyen) },
    {
      libelle: t("progression", ctx.langue),
      valeur: `${r.notesReussies} ${t("sur", ctx.langue)} ${r.notesDemandees}`,
    },
  ];
  if (Number.isFinite(r.ecartMedian)) {
    // CORRIGE AU CYCLE 11. Le libelle etait "cents", ce qui donnait la ligne
    // "cents 6" sur l'ecran de fin. Une unite n'est pas un libelle. Les
    // maquettes generees par le produit l'ont rendu visible en une image, ce
    // que trois relectures du code n'avaient pas fait.
    lignes.push({
      libelle: t("ecart_moyen", ctx.langue),
      valeur: `${Math.round(r.ecartMedian)} ${t("cents", ctx.langue)}`,
    });
  }

  // UNE SEULE PHRASE, ET ELLE PARLE DE LA SUITE, PAS DU PASSE. Un resume qui
  // recapitule fait fermer l'application, un resume qui designe la prochaine
  // marche la fait rouvrir. C'est le seul endroit du produit ou je choisis
  // deliberement de ne pas tout dire.
  // CORRIGE AU CYCLE 11. Cette phrase valait "Next, Level" en anglais, ce qui
  // n'est pas une phrase, c'est deux libelles colles. C'est le dernier mot que
  // l'utilisateur lit avant de fermer l'application, donc c'est le mot qui
  // decide s'il la rouvre demain. Il merite ses propres traductions.
  const phrase = r.aRevoir
    ? `${t("a_revoir", ctx.langue)}, ${r.aRevoir}`
    : t("nouveau_niveau", ctx.langue);

  return {
    titre: t("titre", ctx.langue),
    lignes,
    phrase,
    annonce: [
      `${t("score", ctx.langue)} ${r.scoreMoyen}`,
      `${r.notesReussies} ${t("sur", ctx.langue)} ${r.notesDemandees}`,
      phrase,
    ].join(", "),
    ton,
  };
}

// ---------------------------------------------------------------------------
// L'ECRAN DE CHOIX D'ENTREE
// ---------------------------------------------------------------------------

                        
              
                  
 

/** Les deux boutons du premier ecran, chanter ou jouer. */
export function choixEntree(langue        )          {
  return [
    { cle: "voix", libelle: t("choisir_voix", langue) },
    { cle: "instrument", libelle: t("choisir_instrument", langue) },
  ];
}

/** Verifie qu'aucun texte rendu par ce module ne contient de symbole que le
 *  lecteur d'ecran ne saurait pas dire. Sert au banc et a rien d'autre. */
export function sansSymbole(s        )          {
  return !/[#♯♭+\-<>=|~^*]/.test(s);
}
