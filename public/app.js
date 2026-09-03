/**
 * app.js - L'INTERFACE WEB, ET ELLE NE DECIDE DE RIEN.
 * Agent N4, 2026-08-28 (cycle 12).
 *
 * Meme discipline que `App.tsx` cote mobile. Ce fichier ne sait pas quand
 * aider, quand passer, quelle note demander, quel texte dire ni quelle
 * couleur employer. Tout cela vit dans le noyau, ou 806 verifications
 * automatiques le prouvent sans navigateur et sans appareil.
 *
 * SI UN COMPORTEMENT VOUS SURPREND EN LISANT CE FICHIER, la reponse est dans
 * `noyau/seance.js` ou `noyau/ecran.js`, pas ici.
 *
 * AUCUNE BIBLIOTHEQUE. Trois ecrans se gerent avec un etat et du DOM. Chaque
 * dependance ajoutee est un poids a telecharger et une panne possible chez
 * l'utilisateur, pour un produit dont l'argument est qu'il marche.
 */

import { reglagesPour, positionCurseur } from "./noyau/notation.js";
import { ouvrir, tenter, exerciceSuivant, seanceDuJour } from "./noyau/seance.js";
import { vue, vueResume, choixEntree } from "./noyau/ecran.js";
import { PALETTES, couleurDeTon, FORME_DE_TON } from "./noyau/theme.js";
import { SYSTEME_PAR_DEFAUT, LANGUES, t } from "./noyau/langues.js";
import { TONIQUE_PAR_TESSITURE, CURRICULUM } from "./noyau/exercices.js";
import { ecouter, diagnostic, liberer, preparer } from "./micro-web.js";

// ---------------------------------------------------------------------------
// L'OFFRE, ET ELLE EST POSEE A L'EMBALLAGE, PAS ICI.
//
// Un seul code source produit deux fichiers, la demonstration gratuite et le
// fichier complet. La difference tient en UNE ligne, le catalogue d'exercices.
//
// POURQUOI LA DEMONSTRATION EST ENTIERE ET NON BRIDEE. Le niveau 1 marche a
// cent pour cent, avec le meme detecteur, la meme precision et la meme
// accessibilite que le fichier paye. Rien n'est degrade, rien n'est chronometre,
// rien ne clignote pour faire acheter. C'est le seul argument que j'ai contre
// des concurrents dont les acheteurs ecrivent depuis quatre ans que la
// detection ne marche pas, et cet argument ne se demontre qu'en laissant
// quelqu'un l'essayer pour de vrai. Brider la mesure dans la demonstration
// reviendrait a demander qu'on me croie sur parole, exactement comme eux.
//
// Le fichier paye ouvre les six niveaux, soit trente exercices au lieu de cinq.
// ---------------------------------------------------------------------------
const OFFRE = globalThis.__OFFRE === "demo" ? "demo" : "complet";

function catalogue() {
  return OFFRE === "demo" ? CURRICULUM.filter((e) => e.niveau === 1) : CURRICULUM;
}

// ---------------------------------------------------------------------------
// Etat de l'application. Tout ce qui n'est pas ici vient du noyau.
// ---------------------------------------------------------------------------
const app = {
  langue: langueNavigateur(),
  mode: window.matchMedia("(prefers-color-scheme: dark)").matches ? "sombre" : "clair",
  entree: null,        // "voix" ou "instrument"
  tessiture: "large",
  etat: null,          // etat de seance, rendu par le noyau
  dernier: null,       // dernier resultat
  ecoute: null,        // ecoute en cours
  curseurVif: 0,       // position du curseur pendant l'ecoute
  valides: [],         // exercices deja acquis, memorises localement
  journal: [],         // trace visible, pour que rien ne soit invisible
  alerte: null,        // message VISIBLE a l'utilisateur, quand le materiel manque
  attente: false,      // on attend la reponse du navigateur sur le microphone
};

/** La langue du navigateur, ramenee a une des six que je sers. */
function langueNavigateur() {
  const brut = (navigator.language || "en").slice(0, 2);
  return LANGUES.includes(brut) ? brut : "en";
}

function ctx() {
  return {
    langue: app.langue,
    systeme: SYSTEME_PAR_DEFAUT[app.langue],
    chante: app.entree === "voix",
    toniqueMidi: TONIQUE_PAR_TESSITURE[app.tessiture] ?? 48,
  };
}

function palette() { return PALETTES[app.mode]; }

function noter(ligne) {
  app.journal.unshift(ligne);
  if (app.journal.length > 8) app.journal.pop();
}

// ---------------------------------------------------------------------------
// Rendu
// ---------------------------------------------------------------------------
const racine = document.getElementById("racine");

function appliquerPalette() {
  const p = palette();
  const s = document.documentElement.style;
  s.setProperty("--fond", p.fond);
  s.setProperty("--carte", p.fondCarte);
  s.setProperty("--texte", p.texte);
  s.setProperty("--faible", p.texteFaible);
  s.setProperty("--accent", p.accent);
  s.setProperty("--sur-accent", p.surAccent);
}

function el(balise, attrs = {}, enfants = []) {
  const n = document.createElement(balise);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "onclick") n.addEventListener("click", v);
    else if (k === "texte") n.textContent = v;
    else if (v !== null && v !== undefined) n.setAttribute(k, v);
  }
  for (const e of [].concat(enfants)) {
    if (e) n.appendChild(typeof e === "string" ? document.createTextNode(e) : e);
  }
  return n;
}

function rendre() {
  appliquerPalette();
  racine.textContent = "";
  if (!app.entree) racine.appendChild(ecranAccueil());
  else if (app.etat && app.etat.etape === "SEANCE_FINIE") racine.appendChild(ecranResume());
  else racine.appendChild(ecranSeance());
  racine.appendChild(bandeauJournal());
}

// --- ecran 1, le choix -----------------------------------------------------
function ecranAccueil() {
  const d = diagnostic();
  const carte = el("div", { class: "carte" });
  carte.appendChild(el("h1", { texte: "Steady Pitch" }));
  carte.appendChild(el("p", { class: "sous", texte: t("choisir_entree", app.langue) }));

  for (const c of choixEntree(app.langue)) {
    carte.appendChild(el("button", {
      class: "gros",
      texte: c.libelle,
      onclick: () => { app.entree = c.cle; demarrer(); },
    }));
  }

  if (app.entree === null) {
    const ligne = el("div", { class: "reglage" });
    ligne.appendChild(el("label", { for: "tess", texte: t("tessiture", app.langue) }));
    const sel = el("select", { id: "tess" });
    for (const nom of Object.keys(TONIQUE_PAR_TESSITURE)) {
      const o = el("option", { value: nom, texte: t("tess_" + nom, app.langue) });
      if (nom === app.tessiture) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener("change", () => { app.tessiture = sel.value; });
    ligne.appendChild(sel);
    carte.appendChild(ligne);
  }

  if (!d.utilisable) {
    carte.appendChild(el("p", { class: "alerte", texte: d.raison }));
  }
  return carte;
}

// --- ecran 2, la seance ----------------------------------------------------
function ecranSeance() {
  const v = vue(app.etat, app.dernier, ctx());
  const p = palette();
  const carte = el("div", { class: "carte" });

  carte.appendChild(el("div", { class: "position", texte: v.positionTexte }));

  if (app.alerte) {
    const a = el("p", { class: "alerte", texte: app.alerte });
    a.setAttribute("role", "alert");
    carte.appendChild(a);
  }

  const note = el("div", { class: "note", texte: v.noteDemandee });
  note.style.color = p.texte;
  carte.appendChild(note);
  carte.appendChild(el("div", { class: "consigne", texte: v.consigne }));

  // LE CURSEUR. Il ne s'affiche que quand il veut dire quelque chose, et c'est
  // le noyau qui en decide, jamais ce fichier.
  const piste = el("div", { class: "piste" });
  const cible = el("div", { class: "cible" });
  piste.appendChild(cible);
  const position = app.ecoute ? app.curseurVif : v.curseur;
  const visible = app.ecoute ? true : v.curseurVisible;
  if (visible) {
    const curseur = el("div", { class: "curseur" });
    curseur.style.left = `${50 + Math.max(-1, Math.min(1, position)) * 50}%`;
    curseur.style.background = couleurDeTon(v.ton, app.mode);
    piste.appendChild(curseur);
  }
  carte.appendChild(piste);

  // LE VERDICT, EN COULEUR ET EN FORME. La couleur seule ne suffit pas, huit
  // pour cent des hommes ne la percoivent pas, donc le noyau donne aussi une
  // forme et c'est elle qui porte l'information.
  if (v.retour) {
    const r = el("div", { class: "retour" });
    r.style.color = couleurDeTon(v.ton, app.mode);
    r.appendChild(el("span", { class: "forme", texte: symbole(v.ton) }));
    r.appendChild(el("span", { texte: " " + v.retour }));
    carte.appendChild(r);
  }

  const barre = el("div", { class: "barre" });
  const jauge = el("div", { class: "jauge" });
  jauge.style.width = `${Math.round(v.avancement * 100)}%`;
  jauge.style.background = p.accent;
  barre.appendChild(jauge);
  carte.appendChild(barre);

  // LE BOUTON PRINCIPAL, ET SON ABSENCE A RENDU LE PRODUIT INUTILISABLE.
  //
  // LE DEFAUT, TROUVE LE 2026-08-28 EN JOUANT LA PAGE DANS UN VRAI NAVIGATEUR.
  // La version mobile porte, depuis toujours, un GROS bouton a part qui ouvre
  // et ferme le microphone. La version web ne l'avait pas. Elle branchait a la
  // place la touche `ecouter` que rend le noyau, en croyant que c'etait la
  // meme chose.
  //
  // CE N'EST PAS LA MEME CHOSE, ET LE MOT SEUL LE CACHAIT. Dans le noyau,
  // `ecouter` veut dire FAIRE ENTENDRE LA NOTE A L'ELEVE, une aide qui ne
  // s'active qu'apres trois echecs, `actif: etat.etape === "AIDE"`. Ici,
  // `ecouter` voulait dire OUVRIR LE MICROPHONE.
  //
  // CONSEQUENCE MESUREE. A l'ouverture d'une seance, l'ecran demandait de
  // chanter une note, rien n'ecoutait, et les deux boutons etaient inactifs.
  // Il n'existait AUCUN moyen de commencer. Le produit etait mort au premier
  // ecran, et les 806 verifications automatiques restaient vertes, parce que
  // le noyau avait raison et que c'est le cablage qui avait tort.
  //
  // Le libelle vient du noyau, `v.consigne`, donc il suit la langue et il dit
  // "Chantez cette note" ou "Jouez cette note" selon le mode choisi.
  const principal = el("button", {
    texte: app.ecoute ? t("suivant", app.langue) : v.consigne,
    class: "gros principal",
    onclick: () => (app.ecoute ? arreterEcoute() : demarrerEcoute()),
  });
  principal.setAttribute("aria-label", app.ecoute ? t("suivant", app.langue) : v.consigne);
  // Pendant qu'on attend l'autorisation, le bouton se desactive. Le laisser
  // actif inviterait a le recliquer, ce qui empilerait les demandes.
  principal.disabled = !!app.attente;
  carte.appendChild(principal);

  const boutons = el("div", { class: "boutons" });
  for (const b of v.boutons) {
    const n = el("button", {
      texte: b.libelle,
      class: b.principal ? "principal" : "",
      onclick: () => actionBouton(b.cle),
    });
    n.disabled = !b.actif;
    boutons.appendChild(n);
  }
  carte.appendChild(boutons);

  // L'annonce du lecteur d'ecran, calculee par le noyau. Elle peut differer
  // du visuel, et c'est voulu.
  const vocal = el("div", {
    class: "invisible", role: "status", "aria-live": "polite", texte: v.annonce,
  });
  carte.appendChild(vocal);
  return carte;
}

function symbole(ton) {
  // La forme vient du noyau, on la traduit en un caractere que tout ecran sait
  // dessiner. Aucun de ces caracteres n'est lu a haute voix, l'annonce vocale
  // est un texte separe.
  //
  // Le dernier est ecrit en point de code, comme la liste de symboles interdits
  // de `accessibilite.js`, et pour la meme raison. C'est un DESSIN et non de la
  // ponctuation. Le 2026-08-31 un nettoyage de tirets l'a transforme en virgule,
  // et le produit aurait affiche une virgule la ou il annonce une barre.
  return { cercle: "●", triangle: "▲", croix: "✖", carre: "■", tiret: "\u2014" }[FORME_DE_TON[ton]] || "●";
}

// --- ecran 3, le resume ----------------------------------------------------
function ecranResume() {
  const v = vueResume(app.etat, ctx());
  const carte = el("div", { class: "carte" });
  carte.appendChild(el("h1", { texte: v.titre }));
  const table = el("div", { class: "table" });
  for (const l of v.lignes) {
    const r = el("div", { class: "rangee" });
    r.appendChild(el("span", { class: "libelle", texte: l.libelle }));
    r.appendChild(el("span", { class: "valeur", texte: l.valeur }));
    table.appendChild(r);
  }
  carte.appendChild(table);
  const ph = el("p", { class: "phrase", texte: v.phrase });
  ph.style.color = couleurDeTon(v.ton, app.mode);
  carte.appendChild(ph);

  // L'INVITATION DE LA DEMONSTRATION, ET ELLE ARRIVE APRES LE TRAVAIL, JAMAIS
  // AVANT. Elle ne s'affiche qu'au resume, une seule fois, sans compte a
  // rebours et sans rien masquer de ce qui precede. Quelqu'un qui vient de
  // constater que la mesure marche est le seul a qui la suite se propose
  // honnetement.
  if (OFFRE === "demo") {
    carte.appendChild(el("p", { class: "alerte", texte: t("demo_suite", app.langue) }));
  }

  carte.appendChild(el("button", {
    class: "principal gros",
    texte: t("recommencer", app.langue),
    onclick: async () => {
      // LE VOYANT DU MICROPHONE S'ETEINT ICI. Le contexte audio reste vivant
      // pendant toute la seance, par choix mesure, donc il faut un endroit
      // ou on le rend, et cet endroit est le retour a l'accueil.
      await liberer();
      app.entree = null; app.etat = null; app.dernier = null; rendre();
    },
  }));
  carte.appendChild(el("div", {
    class: "invisible", role: "status", "aria-live": "polite", texte: v.annonce,
  }));
  return carte;
}

// --- le journal visible ----------------------------------------------------
function bandeauJournal() {
  const d = el("details", { class: "journal" });
  d.appendChild(el("summary", { texte: t("details_techniques", app.langue) || "details" }));
  const ul = el("ul");
  for (const l of app.journal) ul.appendChild(el("li", { texte: l }));
  d.appendChild(ul);
  return d;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
function demarrer(avecMicro = true) {
  const ids = seanceDuJour(app.valides, 5, catalogue());
  app.etat = ouvrir(ids, ctx().toniqueMidi, catalogue());
  app.dernier = null;
  noter(`session started, ${ids.length} exercises, tonic ${ctx().toniqueMidi}`);
  rendre();
  // ON PREPARE L'AUDIO MAINTENANT, PAS AU PREMIER BOUTON ECOUTER.
  // Mesure du 2026-08-28 en navigateur, la creation du contexte audio coute
  // assez de temps pour que la PREMIERE tentative rende zero trame, et le
  // produit repondait alors "rien entendu" a quelqu'un qui chantait juste.
  // On paie ce cout pendant que l'utilisateur lit sa premiere note. C'est
  // aussi le bon moment pour demander le microphone, une fois, en entrant.
  preparer(avecMicro).then(
    (info) => noter(`audio ready, ${info.frequence} Hz, mode ${info.mode}, `
      + `warm-up ${info.msDeChauffe} ms`),
    (e) => {
      noter(`audio unavailable, ${e && e.name ? e.name : e}`);
      app.alerte = t("micro_refuse", app.langue);
      rendre();
    },
  );
}

async function actionBouton(cle) {
  // La touche `ecouter` du noyau est l'AIDE, faire entendre la note apres
  // trois echecs. Elle n'ouvre pas le microphone, c'est le bouton principal
  // qui s'en charge. Elle n'a pas encore de son a jouer, exactement comme sur
  // mobile, donc elle ne fait rien plutot que de faire la mauvaise chose.
  if (cle === "ecouter") return;
  if (cle === "reessayer") { app.dernier = null; rendre(); return; }
  if (cle === "suivant" || cle === "terminer") {
    // LE CINQUIEME DEFAUT, ET LE PLUS COUTEUX POUR L'APPRENANT.
    //
    // `exerciceSuivant` ne passe pas a la note suivante, il ABANDONNE
    // l'exercice en cours et saute au suivant. Or le noyau rend un bouton
    // "Suivant" des qu'une NOTE est finie, pas seulement quand l'exercice
    // l'est. La version web appelait `exerciceSuivant` sans regarder l'etape,
    // donc chaque note validee jetait le reste de son exercice.
    //
    // MESURE DU 2026-08-28. Cinq tentatives, cinq verdicts EXCELLENT, ecart
    // moyen de trois cents, et le resume annoncait "5 sur 16", un score de 53
    // et le mot "A revoir" sur un ton d'echec. Le produit disait a quelqu'un
    // qui avait tout chante juste qu'il avait rate. Pour un entraineur de
    // justesse, c'est le pire mensonge possible.
    //
    // La version mobile ne se trompait pas, elle teste l'etape. Le noyau ne se
    // trompait pas non plus. C'est la troisieme fois de la journee que le
    // defaut est dans le cablage web et nulle part ailleurs.
    if (app.etat.etape === "EXERCICE_FINI" || app.etat.etape === "SEANCE_FINIE") {
      app.etat = exerciceSuivant(app.etat);
    }
    app.dernier = null;
    rendre();
    return;
  }
}

async function demarrerEcoute() {
  try {
    // Une alerte se leve a chaque nouvelle tentative, sinon elle survivrait a
    // sa cause et accuserait le navigateur apres qu'il a donne son accord.
    app.alerte = null;
    app.curseurVif = 0;

    // LE DEFAUT LE PLUS SOURNOIS DES QUATRE, MESURE LE 2026-08-28.
    // `getUserMedia` ne rend la main NI en accord NI en refus tant que
    // l'utilisateur n'a pas repondu a la barre d'autorisation du navigateur.
    // Beaucoup ne repondent jamais, ils la ferment ou ils l'ignorent. Le
    // produit restait alors bloque POUR TOUJOURS sur un ecran qui demande de
    // chanter, sans rien ecouter, sans un message, et sans meme une erreur
    // dans la console. Ni un banc ni une relecture ne pouvaient le voir, il
    // fallait cliquer le bouton et attendre.
    app.attente = true;
    rendre();
    const patience = setTimeout(() => {
      if (!app.attente) return;
      // ON REND AUSSI LE BOUTON, ET PAS SEULEMENT LE MESSAGE. Le premier jet
      // affichait "retouchez le bouton" au-dessus d'un bouton qui restait
      // inactif pour toujours, puisque la promesse ne se resout jamais. Un
      // message qui demande un geste que l'ecran interdit est pire que pas de
      // message, il fait passer l'utilisateur pour l'idiot de l'histoire.
      app.attente = false;
      app.alerte = t("micro_refuse", app.langue);
      rendre();
    }, 6000);
    // LE CHAMP EST note.note.hz, PAS note.cibleHz. Le nom que j'avais ecrit
    // n'existe pas, et le seul effet visible aurait ete un curseur qui ne
    // bouge jamais pendant l'ecoute. Trouve en faisant tourner la page dans
    // un vrai navigateur le 2026-08-28, invisible a la relecture.
    const cibleHz = app.etat.notes[app.etat.indexNote]?.note?.hz ?? 0;
    app.ecoute = await ecouter((trame) => {
      if (trame.hz > 0 && cibleHz > 0) {
        app.curseurVif = positionCurseur(trame.hz, cibleHz);
        majCurseurVif();
      }
    });
    clearTimeout(patience);
    app.attente = false;
    app.alerte = null;
    noter(`microphone open, ${app.ecoute.frequence} Hz, `
      + `${app.ecoute.msParTrame.toFixed(1)} ms par trame, mode ${app.ecoute.mode}`);
    rendre();
  } catch (e) {
    app.attente = false;
    noter(`microphone refused, ${e && e.name ? e.name : e}`);
    // ET ON LE DIT A L'UTILISATEUR, PAS SEULEMENT AU JOURNAL TECHNIQUE.
    // Le journal vit dans un bloc replie que personne n'ouvre. Un microphone
    // refuse laissait donc un ecran qui demande de chanter, sans rien
    // ecouter et sans un mot d'explication. C'est exactement le grief que
    // mes concurrents recoltent depuis quatre ans, et il aurait ete de ma
    // faute et non de celle du navigateur.
    app.alerte = t("micro_refuse", app.langue);
    rendre();
  }
}

function majCurseurVif() {
  // Deplacement direct du curseur, sans reconstruire l'ecran. Reconstruire
  // vingt fois par seconde ferait clignoter le texte et couterait de la
  // batterie pour rien.
  const c = racine.querySelector(".curseur");
  if (c) c.style.left = `${50 + Math.max(-1, Math.min(1, app.curseurVif)) * 50}%`;
}

async function arreterEcoute() {
  if (!app.ecoute) return;
  const ecoute = app.ecoute;
  app.ecoute = null;
  const trames = await ecoute.arreter();
  const note = app.etat.notes[app.etat.indexNote];
  const reglages = reglagesPour(app.entree, app.tessiture, {
    msParTrame: ecoute.msParTrame,
  });
  const retour = tenter(app.etat, trames, reglages);
  app.etat = retour.etat;
  app.dernier = retour.resultat;
  const voisees = trames.filter((t) => t.hz > 0).length;
  noter(`${trames.length} frames, ${voisees} voiced, `
    + `verdict ${retour.resultat.verdict}, `
    + `${retour.resultat.ecartCents === null ? "no deviation" : retour.resultat.ecartCents.toFixed(1) + " cents"}`);
  if (retour.resultat.verdict === "EXCELLENT" || retour.resultat.verdict === "BIEN") {
    const id = app.etat.exercices[app.etat.indexExercice];
    if (id && !app.valides.includes(id)) app.valides.push(id);
  }
  rendre();
}

// ---------------------------------------------------------------------------
// Demarrage
// ---------------------------------------------------------------------------
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  app.mode = e.matches ? "sombre" : "clair";
  rendre();
});

// Expose l'etat pour le banc d'essai en navigateur. Aucune donnee n'en sort,
// c'est une lucarne de lecture, et elle sert a prouver que le produit tourne.
window.__steady = {
  app,
  vue: () => (app.etat ? vue(app.etat, app.dernier, ctx()) : null),
  resume: () => (app.etat ? vueResume(app.etat, ctx()) : null),
  demarrer,
  actionBouton,
  diagnostic,
  /** LE BANC AUDIO EN NAVIGATEUR. Fait passer un son de frequence connue par
   *  la chaine reelle, worklet compris, et rend ce que le noyau en a fait.
   *  C'est le seul moyen d'eprouver `micro-web.js` sans microphone. */
  /** LA BOUCLE PRODUIT COMPLETE, avec du vrai son, dans un vrai navigateur.
   *  Ouvre le micro de test sur `hz`, laisse tourner, puis passe les trames
   *  au NOYAU par le meme chemin qu'un utilisateur qui chante. Rien n'est
   *  court-circuite entre le son et le verdict. */
  async tenterAvecSon(hz, dureeMs = 900) {
    const ecoute = await ecouter((trame) => {
      const cible = app.etat.notes[app.etat.indexNote]?.note?.hz ?? 0;
      if (trame.hz > 0 && cible > 0) {
        app.curseurVif = positionCurseur(trame.hz, cible);
      }
    }, hz);
    await new Promise((r) => setTimeout(r, dureeMs));
    const trames = await ecoute.arreter();
    const reglages = reglagesPour(app.entree ?? "voix", app.tessiture, {
      msParTrame: ecoute.msParTrame,
    });
    const retour = tenter(app.etat, trames, reglages);
    app.etat = retour.etat;
    app.dernier = retour.resultat;
    noter(`test tone, ${trames.length} frames, verdict ${retour.resultat.verdict}`);
    rendre();
    return {
      verdict: retour.resultat.verdict,
      ecartCents: retour.resultat.ecartCents,
      accepte: retour.accepte,
      trames: trames.length,
      msParTrame: ecoute.msParTrame,
    };
  },
  async bancAudio(hz, dureeMs = 900) {
    const ecoute = await ecouter(null, hz);
    await new Promise((r) => setTimeout(r, dureeMs));
    const trames = await ecoute.arreter();
    const voisees = trames.filter((t) => t.hz > 0);
    const mediane = voisees.length
      ? voisees.map((t) => t.hz).sort((a, b) => a - b)[voisees.length >> 1]
      : -1;
    return {
      frequence: ecoute.frequence,
      msParTrame: ecoute.msParTrame,
      mode: ecoute.mode,
      nbTrames: trames.length,
      nbVoisees: voisees.length,
      medianeHz: mediane,
      ecartCents: mediane > 0 ? 1200 * Math.log2(mediane / hz) : null,
      confianceMoyenne: voisees.length
        ? voisees.reduce((a, t) => a + t.confiance, 0) / voisees.length : 0,
    };
  },
};

rendre();
