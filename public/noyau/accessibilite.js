/**
 * accessibilite.ts, LE PRODUIT DIT A VOIX HAUTE CE QU'IL MONTRE.
 * Agent N4, 2026-08-25 (cycle 10, chantier 24). Aucune dependance.
 *
 * POURQUOI CE FICHIER N'EST PAS UNE CASE A COCHER.
 * Deux raisons, et la seconde est la vraie.
 *
 * 1. Apple pondere explicitement l'ACCESSIBILITE dans le choix des applications
 *    qu'il met en avant, lu au chantier 20. La mise en avant editoriale est
 *    l'une de mes quatre portes d'acquisition, gratuite et ouverte aux
 *    inconnus. Un critere de selection gratuit qu'on ignore est une depense.
 *
 * 2. ET SURTOUT, un entraineur de justesse est l'une des rares applications qui
 *    peut etre PLEINEMENT utilisable sans voir. Tout ce qu'elle fait passe par
 *    l'oreille et par la voix. Un utilisateur aveugle ou malvoyant n'a pas
 *    besoin d'une version degradee, il a besoin que l'ecran soit DIT. La plupart
 *    des applications de musique affichent un curseur qui bouge et rien
 *    d'autre, ce qui est parfaitement inutilisable au lecteur d'ecran.
 *    C'est donc un differenciant reel, pas une conformite.
 *
 * LA REGLE D'ECRITURE DES ANNONCES.
 * Un lecteur d'ecran lit tout, littéralement, sans intonation. Trois
 * consequences qui gouvernent chaque chaine de ce fichier.
 *   - PAS DE SYMBOLE. Un "+12c" se lit "plus douze c". On ecrit les mots.
 *   - LE PLUS IMPORTANT EN PREMIER. L'utilisateur coupe souvent la parole au
 *     lecteur, donc le verdict vient avant le detail.
 *   - COURT. Une annonce longue arrive apres que la note est finie.
 */

import {                              cents } from "./notation.js";
import { t, nommerNote, nommerNoteParle,                                } from "./langues.js";

/** Le sens de l'ecart, dit en mots et jamais par un signe. */
                                                             

export function direction(ecartCents        , tolerance = 15)            {
  if (Number.isNaN(ecartCents) || Math.abs(ecartCents) <= tolerance) return "juste";
  return ecartCents < 0 ? "trop_grave" : "trop_aigu";
}

/**
 * L'annonce vocale d'un resultat. C'est la chaine que le lecteur d'ecran dira.
 * Volontairement courte, verdict d'abord, et sans aucun symbole.
 */
export function annoncer(r          , langue         = "en")         {
  if (r.verdict === "SILENCE") return t("silence", langue);
  // AJOUTE AU CYCLE 11. La note demandee sort de ce que le moteur entend. On le
  // dit, et on ne dit surtout pas FAUX, parce que celui qui joue ne s'est pas
  // trompe. Sans cette branche, `toLowerCase()` produisait une cle inexistante
  // et l'annonce serait sortie vide, ce qui est le pire cas pour un lecteur
  // d'ecran, un silence qu'on ne peut pas interpreter.
  if (r.verdict === "HORS_PORTEE") {
    return t(r.horsPortee === "AIGU" ? "hors_portee_aigu" : "hors_portee_grave", langue);
  }

  const verdictCle = r.verdict.toLowerCase()                                           ;
  const tete = t(verdictCle, langue);

  const d = direction(r.ecartCents);
  if (d === "juste") return tete;

  // On arrondit a l'unite, personne n'a besoin d'entendre des decimales.
  const ecart = Math.abs(Math.round(r.ecartCents));
  const sens = t(d === "trop_grave" ? "trop_grave" : "trop_aigu", langue);
  return `${tete}, ${sens}, ${ecart} ${t("cents", langue)}`;
}

/** L'etiquette d'accessibilite de la note a produire. */
export function annoncerCible(midiCible        , chante         ,
                              langue         = "en",
                              systeme               = "lettres",
                              toniqueMidi = 0)         {
  const action = t(chante ? "chantez" : "jouez", langue);
  // CORRIGE AU CYCLE 11. On disait ici `nommerNote`, qui rend "Do#3". Le diese
  // est dans ma propre liste de symboles interdits, et un lecteur d'ecran qui
  // l'avale fait entendre "Do trois" a quelqu'un a qui on demande un do diese.
  // Ce defaut a vecu un cycle entier parce que mon banc d'accessibilite ne
  // testait que des notes naturelles.
  return `${action}, ${nommerNoteParle(midiCible, systeme, toniqueMidi, langue)}`;
}

/**
 * LE RETOUR CONTINU PENDANT QU'ON TIENT LA NOTE, et c'est le coeur du sujet.
 * Un curseur qui bouge ne dit rien a qui ne le voit pas. Il faut un signal
 * NON VISUEL et CONTINU. Le plus juste ici n'est ni la parole, trop lente et
 * qui couvrirait la voix de l'utilisateur, ni un texte, c'est un SON DE GUIDAGE
 * dont la hauteur suit l'ecart.
 *
 * Retourne une valeur de -1 a +1 que la couche audio traduira en battement ou
 * en hauteur de bourdon. Zero veut dire juste.
 * Le silence a zero est deliberé, ON N'ENTEND RIEN QUAND ON EST JUSTE, ce qui
 * est le retour le plus clair possible et laisse la place a la voix.
 */
export function guidageAudio(hzProduit        , hzCible        ,
                             etendueCents = 100)         {
  const c = cents(hzProduit, hzCible);
  if (Number.isNaN(c)) return 0;
  return Math.max(-1, Math.min(1, c / etendueCents));
}

/**
 * L'intensite du retour haptique, de 0 a 1. Meme logique inversee, la
 * vibration s'attenue quand on approche, elle ne se declenche pas quand on
 * touche. Un retour qui se TAIT en cas de succes est plus lisible qu'un retour
 * qui s'ajoute.
 */
export function intensiteHaptique(hzProduit        , hzCible        ,
                                  toleranceCents = 45)         {
  const c = Math.abs(cents(hzProduit, hzCible));
  if (Number.isNaN(c)) return 0;
  if (c <= toleranceCents) return 0;
  return Math.min(1, (c - toleranceCents) / (toleranceCents * 2));
}

/** Le resume d'une seance, pour l'ecran de progression. */
export function annoncerProgression(reussies        , total        ,
                                    score        , langue         = "en")         {
  // La barre oblique se lit "slash" ou ne se lit pas du tout selon le lecteur.
  // Mon propre controle de conformite a attrape cette faute dans ce fichier,
  // ce qui est exactement ce pour quoi il a ete ecrit. On dit le mot.
  return `${t("progression", langue)}, ${reussies} ${t("sur", langue)} ${total}, `
    + `${t("score", langue)} ${Math.round(score)}`;
}

/**
 * CONTROLE DE CONFORMITE INTERNE. Une annonce destinee a un lecteur d'ecran ne
 * doit contenir aucun caractere qui se lise mal. On le VERIFIE au lieu de le
 * promettre, et le banc s'en sert sur toutes les chaines de toutes les langues.
 */
// LES TROIS TIRETS SONT ECRITS EN POINTS DE CODE, ET C'EST DELIBERE.
// Ce sont des DONNEES, la liste des caracteres qu'un lecteur d'ecran prononce
// mal, et non de la prose. Ecrits en clair, ils se font emporter par un
// nettoyage de tirets, et le 2026-08-31 c'est exactement ce qui est arrive.
// La classe est devenue un intervalle a l'envers et trois bancs sont tombes.
// Ce jour-la le message d'erreur etait franc. Une autre corruption du meme
// genre resterait valide et se contenterait de ne plus rien trouver, en
// silence, ce qui est le pire des deux.
const SYMBOLES_INTERDITS = /[+\-\u2212\u2013\u2014#%<>*_|/\\~^=@&]/;

export function annonceLisible(texte        )          {
  return texte.length > 0 && !SYMBOLES_INTERDITS.test(texte);
}
