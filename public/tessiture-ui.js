/**
 * tessiture-ui.js, L'ECRAN DU TEST D'ETENDUE VOCALE.
 * Agent N4, 2026-09-03 (cycle 17).
 *
 * Ce fichier ne calcule rien. Il branche le microphone sur `analyserBalayage`
 * et il dessine. Toute decision sur ce qui est une note et ce qui est un
 * artefact vit dans `noyau/tessiture.js`, qui se teste sans navigateur.
 *
 * CE QU'IL EXPOSE POUR LE BANC, `window.__tessiture`. Le cycle 16 m'a coute
 * vingt minutes a deduire l'etat d'une donnee depuis un dessin, alors que la
 * lire prenait une ligne. On ne recommence pas.
 */

/**
 * L'ADRESSE ECRITE SUR LA CARTE DE PARTAGE, ET POURQUOI ELLE EST EN DUR.
 * La copie hors ligne s'ouvre en `file://`, ou `location.host` est vide et
 * `pathname` est un chemin de disque. Une carte partagee porterait alors le
 * nom d'un dossier de l'acheteur, ce qui ne renvoie personne nulle part et
 * revele au passage ou il range ses fichiers.
 */
const ADRESSE_PUBLIQUE = "thibaudlepan77-svg.github.io/steady-pitch/vocal-range-test.html";

function adresseAAfficher() {
  return location.protocol === "http:" || location.protocol === "https:"
    ? `${location.host}${location.pathname}`
    : ADRESSE_PUBLIQUE;
}

const MIDI_AXE_BAS = 36;
const MIDI_AXE_HAUT = 84;

const etat = {
  etape: "accueil",
  sens: null,
  trames: [],
  balayages: { grave: null, aigu: null },
  tramesDe: { grave: null, aigu: null },
  etendue: null,
  ecoute: null,
};

window.__tessiture = etat;

function elt(id) {
  const noeud = document.getElementById(id);
  if (!noeud) throw new Error(`element absent, ${id}`);
  return noeud;
}

function montrer(id, visible) {
  elt(id).hidden = !visible;
}

function nommer(midi) {
  return nommerNote(midi, "lettres");
}

// ---------------------------------------------------------------------------
// L'affichage pendant un balayage
// ---------------------------------------------------------------------------

function rafraichirDirect() {
  const derniere = etat.trames[etat.trames.length - 1];
  const noteVive = elt("tess-note-vive");

  if (derniere && derniere.hz > 0 && derniere.confiance >= REGLAGES_TESSITURE.confianceMin) {
    noteVive.textContent = nommer(hzVersMidi(derniere.hz));
  } else {
    noteVive.textContent = "-";
  }

  const partiel = analyserBalayage(etat.trames, etat.sens);
  const extreme = elt("tess-extreme");
  if (partiel.extremeMidi === null) {
    extreme.textContent = etat.sens === "grave"
      ? "no low note held yet"
      : "no high note held yet";
    extreme.dataset.trouve = "non";
  } else {
    extreme.textContent = (etat.sens === "grave" ? "lowest held  " : "highest held  ")
      + nommer(partiel.extremeMidi);
    extreme.dataset.trouve = "oui";
  }
  etat.partiel = partiel;
}

async function demarrerBalayage(sens) {
  // ON COUPE CE QUI ECOUTE DEJA. Le parcours normal enchaine les deux
  // balayages proprement, mais rien n'empechait un second appel de laisser le
  // premier flux branche sur le noeud. Mesure au banc navigateur, deux sources
  // simultanees, et le detecteur s'accroche a la plus grave des deux, donc le
  // second balayage rend la note du premier. Avec un microphone la faute est
  // invisible, il n'y a qu'une source, mais l'ecoute orpheline reste.
  if (etat.ecoute) {
    await etat.ecoute.arreter();
    etat.ecoute = null;
  }

  etat.sens = sens;
  etat.trames = [];
  etat.etape = sens;

  elt("tess-consigne").textContent = sens === "grave"
    ? "Sing ah on a comfortable note, then slide down as low as you can. Hold your lowest note for three seconds."
    : "Sing ah on a comfortable note, then slide up as high as you can. Hold your highest note for three seconds.";
  elt("tess-titre-etape").textContent = sens === "grave"
    ? "Step 1 of 2, your lowest note"
    : "Step 2 of 2, your highest note";
  elt("tess-suivant").textContent = sens === "grave" ? "Next, my highest note" : "See my range";

  montrer("tess-accueil", false);
  montrer("tess-mesure", true);
  montrer("tess-resultat", false);

  // La consigne dit d'abord ce que la page attend. Une demande de permission
  // peut mettre plusieurs secondes a apparaitre, et pendant ce temps un ecran
  // qui dit deja de chanter demande quelque chose que rien n'ecoute encore.
  const consigne = elt("tess-consigne").textContent;
  elt("tess-consigne").textContent = "Waiting for the microphone.";

  try {
    etat.ecoute = await ecouter((trame) => {
      etat.trames.push(trame);
      rafraichirDirect();
    }, etat.sourceDeTest ?? null);
    elt("tess-consigne").textContent = consigne;
    elt("tess-erreur").hidden = true;
  } catch (erreur) {
    // Trois causes derriere le meme ecran mort, et elles n'appellent pas la
    // meme manoeuvre. Un refus se leve dans les reglages du navigateur, une
    // demande sans reponse se rattrape dans la barre d'adresse, et le reste
    // se raconte avec ses propres mots plutot qu'avec les miens.
    montrer("tess-mesure", false);
    montrer("tess-accueil", true);
    elt("tess-consigne").textContent = consigne;
    const boite = elt("tess-erreur");
    boite.hidden = false;
    boite.textContent = erreur && erreur.name === "NotAllowedError"
      ? "The microphone is blocked for this page. Allow it in your browser "
        + "settings, then start again. Nothing is recorded and nothing is "
        + "uploaded, the whole test runs on your machine."
      : (erreur && erreur.message)
        || "The microphone is not available. Check that your browser is "
          + "allowed to use it, then try again.";
    etat.etape = "accueil";
  }
}

async function terminerBalayage() {
  if (etat.ecoute) {
    await etat.ecoute.arreter();
    etat.ecoute = null;
  }
  etat.balayages[etat.sens] = analyserBalayage(etat.trames, etat.sens);
  // On garde les trames brutes du balayage. Le resultat affiche ensuite la
  // courbe, et un verdict qui montre sa donnee se discute, un verdict qui la
  // cache se croit sur parole.
  etat.tramesDe[etat.sens] = etat.trames.slice();

  if (etat.sens === "grave") {
    await demarrerBalayage("aigu");
    return;
  }

  etat.etendue = composerEtendue(etat.balayages.grave, etat.balayages.aigu);
  await liberer();
  afficherResultat();
}

// ---------------------------------------------------------------------------
// Le resultat
// ---------------------------------------------------------------------------

/**
 * LA MESURE PRECEDENTE, GARDEE SUR L'APPAREIL ET NULLE PART AILLEURS.
 *
 * POURQUOI ELLE EXISTE. Une tessiture se mesure une fois et on n'y revient
 * jamais, ce qui fait de cette page un cul-de-sac. Elle a pourtant la seule
 * chose qui donne envie de revenir, un chiffre a comparer au sien.
 *
 * ELLE NE PART PAS AU SERVEUR, et ce n'est pas un detail de confort. La page
 * promet en toutes lettres que rien de ce qu'on chante ne quitte la machine.
 * Un historique envoye ailleurs contredirait cette phrase, donc il reste dans
 * `localStorage` et il se supprime en vidant les donnees du site.
 */
const CLE_MEMOIRE = "steady-pitch.tessiture";

/** Sous ce delai, on ne compare pas. Deux essais du meme quart d'heure
 *  mesurent la meme voix du meme jour, et annoncer une progression entre les
 *  deux serait mentir avec le bruit de sa propre mesure. */
const MS_AVANT_COMPARAISON = 6 * 3600 * 1000;

/** Un demi-ton d'ecart n'est pas un progres, c'est la journee qu'on a eue. Le
 *  cycle 10 a releve une derive naturelle mediane de dix cents en note tenue
 *  confortable, et bien davantage aux deux bouts. */
const DEMI_TONS_SIGNIFICATIFS = 2;

/**
 * `localStorage` LEVE VRAIMENT, ce n'est pas une precaution de principe.
 * Safari en navigation privee et un navigateur dont on a coupe les cookies
 * jettent des l'acces, avant meme la lecture. Une page qui tombe la-dessus
 * n'afficherait aucun resultat, pour un agrement.
 */
function lireMemoire() {
  try {
    const brut = window.localStorage.getItem(CLE_MEMOIRE);
    if (!brut) return null;
    const garde = JSON.parse(brut);
    if (!Number.isInteger(garde.basMidi) || !Number.isInteger(garde.hautMidi)) return null;
    if (!Number.isFinite(garde.quand)) return null;
    return garde;
  } catch {
    return null;
  }
}

function ecrireMemoire(etendue) {
  try {
    // ARRONDI A L'ECRITURE. `basMidi` sort de l'interpolation parabolique, donc
    // il vaut 45.00000148 et non 45. Range tel quel, l'ecart entre deux mesures
    // ressort a `2.0000148620576 semitones lower` dans la phrase affichee.
    window.localStorage.setItem(CLE_MEMOIRE, JSON.stringify({
      basMidi: Math.round(etendue.basMidi),
      hautMidi: Math.round(etendue.hautMidi),
      quand: Date.now(),
    }));
  } catch {
    /* Rien a faire. Le resultat du jour s'affiche quand meme. */
  }
}

/** `il y a trois semaines` plutot qu'une date, parce que l'ecart est
 *  l'information et la date ne l'est pas. */
function ilYA(ms) {
  const jours = Math.floor(ms / 86400000);
  if (jours < 1) return "earlier today";
  if (jours === 1) return "yesterday";
  if (jours < 14) return `${jours} days ago`;
  const semaines = Math.round(jours / 7);
  if (semaines < 9) return `${semaines} weeks ago`;
  return `${Math.round(jours / 30)} months ago`;
}

/** Un bout de tessiture, en mots, du point de vue du chanteur. Vers le grave
 *  c'est `lower`, vers l'aigu c'est `higher`, quel que soit le bout. */
function bougeDe(avant, apres) {
  const demiTons = Math.round(apres) - Math.round(avant);
  if (Math.abs(demiTons) < DEMI_TONS_SIGNIFICATIFS) return null;
  const pas = Math.abs(demiTons) === 1 ? "a semitone" : `${Math.abs(demiTons)} semitones`;
  return `${pas} ${demiTons > 0 ? "higher" : "lower"}`;
}

/**
 * COMPARER SANS FLATTER. Le piege evident serait d'annoncer un progres a
 * chaque demi-ton gagne, ce qui donnerait une bonne nouvelle presque a tous
 * les coups et ne vaudrait rien. En dessous de deux demi-tons la page dit que
 * rien n'a bouge, et c'est ce qui rend croyable le jour ou elle dit l'inverse.
 */
function comparerAvant(etendue) {
  const boite = elt("tess-avant");
  const avant = lireMemoire();
  ecrireMemoire(etendue);

  if (!avant || Date.now() - avant.quand < MS_AVANT_COMPARAISON) {
    montrer("tess-avant", false);
    return;
  }

  const quand = ilYA(Date.now() - avant.quand);
  const bornes = `${nommer(avant.basMidi)} to ${nommer(avant.hautMidi)}`;
  const bas = bougeDe(avant.basMidi, etendue.basMidi);
  const haut = bougeDe(avant.hautMidi, etendue.hautMidi);

  let verdict;
  if (!bas && !haut) {
    verdict = "The same range, within what a voice does from one day to the next.";
  } else if (bas && haut) {
    verdict = `Your bottom is ${bas} and your top is ${haut}.`;
  } else {
    verdict = bas
      ? `Your bottom is ${bas}, your top has not moved.`
      : `Your top is ${haut}, your bottom has not moved.`;
  }

  boite.textContent = `Last measured on this device ${quand}, ${bornes}. ${verdict}`;
  montrer("tess-avant", true);
}

function afficherResultat() {
  etat.etape = "resultat";
  montrer("tess-mesure", false);
  montrer("tess-resultat", true);

  const etendue = etat.etendue;
  if (!etendue) {
    elt("tess-bornes").textContent = "No note held";
    elt("tess-largeur").textContent =
      "The test did not hear a note held long enough to measure. "
      + "Sing ah out loud, close to the microphone, and hold each end for three seconds.";
    elt("tess-type").textContent = "";
    montrer("tess-partage", false);
    montrer("tess-tronquee", false);
    montrer("tess-avant", false);
    return;
  }

  montrer("tess-partage", true);
  elt("tess-bornes").textContent = `${nommer(etendue.basMidi)} to ${nommer(etendue.hautMidi)}`;
  elt("tess-largeur").textContent = etendueLisible(etendue);

  const classement = etendue.classement;
  elt("tess-type").textContent = classement.ambigu
    ? `Closest voice types, ${classement.meilleur.reference.etiquette} `
      + `or ${classement.second.reference.etiquette}`
    : `Closest voice type, ${classement.meilleur.reference.etiquette}`;

  comparerAvant(etendue);
  montrer("tess-tronquee", etendue.tronquee);
  dessinerBarres(etendue);
  elt("tess-detail").textContent = detailMesure();
  dessinerLesDeuxCourbes();
  proposerLaSuite(etendue);
}

/**
 * LA SUITE, ET C'EST LE SEUL ENDROIT DE CETTE PAGE QUI PARLE D'ARGENT.
 * Il vient APRES le resultat, jamais avant, et il porte les bornes que le
 * visiteur vient d'obtenir. Une invitation qui ne connait pas son
 * interlocuteur est une banniere, et personne ne clique sur une banniere.
 */
function proposerLaSuite(etendue) {
  const bas = nommer(etendue.basMidi);
  const haut = nommer(etendue.hautMidi);
  elt("tess-suite-titre").textContent = `You know where your voice goes. ${bas} to ${haut}.`;
  elt("tess-suite-texte").textContent =
    `Knowing the two ends says nothing about how accurately you sing between `
    + `them, and that is the part that gets noticed. The trainer plays a note `
    + `inside your range, listens to the one you hold, and grades it in cents. `
    + `The first level is free and opens in this browser.`;
  montrer("tess-suite", true);
}

/** Ce que la mesure a reellement vu. Un test qui ne montre pas son travail se
 *  croit sur parole, et personne ne croit un inconnu sur parole. */
function detailMesure() {
  const lignes = [];
  for (const sens of ["grave", "aigu"]) {
    const b = etat.balayages[sens];
    if (!b) continue;
    lignes.push(
      `${sens === "grave" ? "Low sweep" : "High sweep"}, ${b.tramesRetenues} frames kept, `
      + `${b.tenues.length} held notes, ${b.rejets.octaveRepliee} octave slips corrected, `
      + `${b.rejets.silence} silent frames.`);
  }
  return lignes.join(" ");
}

/**
 * LA COURBE DU BALAYAGE, ET POURQUOI ELLE VAUT LE DETOUR.
 * Le resultat annonce deux notes, et rien sur la page ne permettait de
 * verifier qu'elles viennent de ce que la personne a chante. Un test qui
 * refuse de montrer sa donnee demande qu'on le croie sur parole, et personne
 * ne croit un inconnu sur parole.
 *
 * On dessine la lecture BRUTE, trame par trame, sans le repli d'octave. Une
 * correction qu'on cache est exactement ce que je reproche aux autres.
 *
 * Les dimensions sont passees en parametres et non lues sur la toile. La toile
 * porte des pixels d'ecran, le contexte est mis a l'echelle du rapport de
 * l'appareil, et dessiner sur `toile.width` apres cette mise a l'echelle
 * deborderait d'un facteur deux sur un ecran dense.
 */
function dessinerCourbe(contexte, largeur, hauteur, trames, balayage) {
  const style = getComputedStyle(document.body);
  const trait = style.getPropertyValue("--trait").trim() || "#ddd8cc";
  const doux = style.getPropertyValue("--doux").trim() || "#5d5a52";
  const accent = style.getPropertyValue("--accent").trim() || "#8a3324";
  const MARGE = 30;

  contexte.clearRect(0, 0, largeur, hauteur);
  if (!trames || !trames.length || !balayage) return;

  const y = (midi) => hauteur - 6 - positionSurAxe(midi) * (hauteur - 12);

  contexte.strokeStyle = trait;
  contexte.lineWidth = 1;
  contexte.font = "10px ui-monospace, monospace";
  contexte.fillStyle = doux;
  for (let midi = MIDI_AXE_BAS; midi <= MIDI_AXE_HAUT; midi += 12) {
    const ligne = Math.round(y(midi)) + 0.5;
    contexte.beginPath();
    contexte.moveTo(MARGE, ligne);
    contexte.lineTo(largeur, ligne);
    contexte.stroke();
    contexte.fillText(nommer(midi), 2, ligne + 3);
  }

  contexte.strokeStyle = doux;
  contexte.lineWidth = 1.2;
  contexte.beginPath();
  let leve = true;
  trames.forEach((trame, i) => {
    const x = MARGE + (i / Math.max(1, trames.length - 1)) * (largeur - MARGE - 2);
    if (!(trame.hz > 0) || trame.confiance < REGLAGES_TESSITURE.confianceMin) {
      leve = true;
      return;
    }
    const ligne = y(hzVersMidi(trame.hz));
    if (leve) { contexte.moveTo(x, ligne); leve = false; } else { contexte.lineTo(x, ligne); }
  });
  contexte.stroke();

  if (balayage.extremeMidi !== null) {
    const ligne = Math.round(y(balayage.extremeMidi)) + 0.5;
    contexte.strokeStyle = accent;
    contexte.lineWidth = 2;
    contexte.setLineDash([4, 3]);
    contexte.beginPath();
    contexte.moveTo(MARGE, ligne);
    contexte.lineTo(largeur, ligne);
    contexte.stroke();
    contexte.setLineDash([]);
    contexte.fillStyle = accent;
    contexte.font = "600 11px ui-monospace, monospace";
    contexte.fillText(nommer(balayage.extremeMidi), largeur - 26, ligne - 4);
  }
}

const HAUTEUR_COURBE = 120;

/** LES IDENTIFIANTS SONT ECRITS EN CLAIR, ET CE N'EST PAS DE LA VERBOSITE.
 *  Le controle de construction releve les appels a elt par expression
 *  reguliere pour verifier que la page porte chaque identifiant. Un
 *  identifiant calcule dans un ternaire lui echappe, donc la seule garde
 *  contre une faute de frappe se tairait exactement quand elle sert. */
const COURBES = { grave: () => elt("tess-courbe-grave"), aigu: () => elt("tess-courbe-aigu") };

function dessinerLesDeuxCourbes() {
  for (const sens of ["grave", "aigu"]) {
    const toile = COURBES[sens]();
    const largeur = toile.clientWidth || 460;
    const densite = window.devicePixelRatio || 1;
    toile.width = Math.round(largeur * densite);
    toile.height = Math.round(HAUTEUR_COURBE * densite);
    const contexte = toile.getContext("2d");
    contexte.setTransform(densite, 0, 0, densite, 0, 0);
    dessinerCourbe(contexte, largeur, HAUTEUR_COURBE,
      etat.tramesDe[sens], etat.balayages[sens]);
  }
}

function positionSurAxe(midi) {
  const borne = Math.min(MIDI_AXE_HAUT, Math.max(MIDI_AXE_BAS, midi));
  return (borne - MIDI_AXE_BAS) / (MIDI_AXE_HAUT - MIDI_AXE_BAS);
}

function dessinerBarres(etendue) {
  const hote = elt("tess-barres");
  hote.textContent = "";

  const ligne = (etiquette, bas, haut, classe) => {
    const rang = document.createElement("div");
    rang.className = "tess-rang";
    const nom = document.createElement("span");
    nom.className = "tess-nom";
    nom.textContent = etiquette;
    const piste = document.createElement("span");
    piste.className = "tess-piste";
    const barre = document.createElement("span");
    barre.className = `tess-barre ${classe}`;
    const debut = positionSurAxe(bas);
    barre.style.left = `${debut * 100}%`;
    barre.style.width = `${Math.max(0.01, positionSurAxe(haut) - debut) * 100}%`;
    piste.appendChild(barre);
    rang.append(nom, piste);
    hote.appendChild(rang);
  };

  ligne("You", etendue.basMidi, etendue.hautMidi, "tess-barre-vous");
  for (const reference of VOIX_REFERENCE) {
    ligne(reference.etiquette, reference.basMidi, reference.hautMidi, "tess-barre-ref");
  }
}

// ---------------------------------------------------------------------------
// Le partage. C'est la seule fonction de cette page qui puisse lui amener un
// visiteur, donc elle vaut autant de soin que la mesure.
// ---------------------------------------------------------------------------

function texteDePartage() {
  const e = etat.etendue;
  if (!e) return "";
  const type = e.classement.ambigu
    ? `${e.classement.meilleur.reference.etiquette} or ${e.classement.second.reference.etiquette}`
    : e.classement.meilleur.reference.etiquette;
  return `My vocal range is ${nommer(e.basMidi)} to ${nommer(e.hautMidi)}, `
    + `${etendueLisible(e)}, closest to ${type}. `
    + `Measured at ${adresseAAfficher()}`;
}

async function copierResultat() {
  const bouton = elt("tess-copier");
  const texte = texteDePartage();
  try {
    await navigator.clipboard.writeText(texte);
    bouton.textContent = "Copied";
  } catch {
    // Le presse-papier est refuse hors contexte sur, et sur certains
    // navigateurs mobiles. On rend le texte selectionnable plutot que de
    // laisser le visiteur devant un bouton qui ne fait rien.
    const boite = elt("tess-texte-brut");
    boite.hidden = false;
    boite.value = texte;
    boite.select();
    bouton.textContent = "Select and copy";
  }
  setTimeout(() => { bouton.textContent = "Copy my result"; }, 2600);
}

const CARTE_LARGEUR = 1200;
const CARTE_HAUTEUR = 630;

function dessinerCarte() {
  const e = etat.etendue;
  const toile = document.createElement("canvas");
  toile.width = CARTE_LARGEUR;
  toile.height = CARTE_HAUTEUR;
  const c = toile.getContext("2d");

  c.fillStyle = "#14120F";
  c.fillRect(0, 0, CARTE_LARGEUR, CARTE_HAUTEUR);
  c.fillStyle = "#E7A33E";
  c.fillRect(0, 0, CARTE_LARGEUR, 10);

  c.fillStyle = "#FBF7F0";
  c.textAlign = "center";
  c.font = "600 34px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  c.fillText("My vocal range", CARTE_LARGEUR / 2, 96);

  c.font = "700 132px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  c.fillText(`${nommer(e.basMidi)} to ${nommer(e.hautMidi)}`, CARTE_LARGEUR / 2, 228);

  c.font = "500 40px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  c.fillStyle = "#E7A33E";
  c.fillText(etendueLisible(e), CARTE_LARGEUR / 2, 288);

  const type = e.classement.ambigu
    ? `${e.classement.meilleur.reference.etiquette} or ${e.classement.second.reference.etiquette}`
    : e.classement.meilleur.reference.etiquette;
  c.fillStyle = "#C9C0B2";
  c.font = "400 34px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  c.fillText(`Closest voice type, ${type}`, CARTE_LARGEUR / 2, 342);

  // LE SILLAGE, LES DEUX BALAYAGES BOUT A BOUT SUR LA CARTE.
  // La premiere version posait une simple reglette. Elle disait la meme chose
  // que le texte au-dessus, en moins lisible. Ce que personne d'autre ne peut
  // montrer, c'est la forme de VOTRE voix, et c'est la seule raison qu'on ait
  // de partager une image plutot que de recopier deux noms de notes.
  const marge = 110;
  const largeur = CARTE_LARGEUR - marge * 2;
  const hautPanneau = 396;
  const basPanneau = 528;
  const hauteurPanneau = basPanneau - hautPanneau;
  const yDe = (midi) => basPanneau - positionSurAxe(midi) * hauteurPanneau;

  // La bande de l'etendue, derriere, pour que la courbe se lise contre elle.
  c.fillStyle = "#221F19";
  c.fillRect(marge, yDe(e.hautMidi), largeur, yDe(e.basMidi) - yDe(e.hautMidi));

  c.strokeStyle = "#3A362E";
  c.lineWidth = 1;
  c.fillStyle = "#8B8377";
  c.textAlign = "right";
  c.font = "400 20px ui-monospace, monospace";
  for (let midi = MIDI_AXE_BAS; midi <= MIDI_AXE_HAUT; midi += 12) {
    const ligne = Math.round(yDe(midi)) + 0.5;
    c.beginPath();
    c.moveTo(marge, ligne);
    c.lineTo(marge + largeur, ligne);
    c.stroke();
    c.fillText(nommer(midi), marge - 10, ligne + 7);
  }

  const sillage = [...(etat.tramesDe.grave || []), ...(etat.tramesDe.aigu || [])];
  if (sillage.length > 1) {
    c.strokeStyle = "#E7A33E";
    c.lineWidth = 3;
    c.lineJoin = "round";
    c.beginPath();
    let leve = true;
    sillage.forEach((trame, i) => {
      const x = marge + (i / (sillage.length - 1)) * largeur;
      if (!(trame.hz > 0) || trame.confiance < REGLAGES_TESSITURE.confianceMin) {
        leve = true;
        return;
      }
      const ligne = yDe(hzVersMidi(trame.hz));
      if (leve) { c.moveTo(x, ligne); leve = false; } else { c.lineTo(x, ligne); }
    });
    c.stroke();
  }

  c.textAlign = "center";
  c.fillStyle = "#8B8377";
  c.font = "400 22px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  c.fillText("my two sweeps, low then high", CARTE_LARGEUR / 2, basPanneau + 28);

  c.fillStyle = "#FBF7F0";
  c.font = "500 30px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  c.fillText(adresseAAfficher(), CARTE_LARGEUR / 2, 604);

  return toile;
}

/**
 * LA CARTE PART PAR LA FEUILLE DE PARTAGE QUAND IL Y EN A UNE, ET SINON ELLE
 * SE TELECHARGE.
 *
 * POURQUOI CE N'EST PAS UN DETAIL DE CONFORT. Neuf des quinze premiers
 * visiteurs exterieurs de cette page sont arrives depuis un telephone, sept
 * sous iOS, mesure Cloudflare du 2026-09-04. Or `a[download]` sur une adresse
 * de donnees est mal tenu par Safari mobile, il ouvre l'image a la place, et
 * le visiteur se retrouve devant un PNG sans savoir comment revenir. La carte
 * est la seule chose de ce site que quelqu'un ait une raison de faire
 * circuler, donc elle doit partir la ou elle circule.
 *
 * L'ADRESSE VOYAGE AVEC L'IMAGE, `texteDePartage` la porte deja. Une image
 * partagee sans son lien ne ramene personne.
 */
function partageDeFichierPossible(fichier) {
  return typeof navigator.canShare === "function" && navigator.canShare({ files: [fichier] });
}

async function telechargerCarte() {
  if (!etat.etendue) return;
  const toile = dessinerCarte();

  const blob = await new Promise((resoudre) => toile.toBlob(resoudre, "image/png"));
  if (blob) {
    const fichier = new File([blob], "my-vocal-range.png", { type: "image/png" });
    if (partageDeFichierPossible(fichier)) {
      try {
        await navigator.share({
          files: [fichier],
          text: texteDePartage(),
        });
        return;
      } catch (erreur) {
        // Une feuille de partage refermee sans choisir leve `AbortError`. Ce
        // n'est pas une panne, l'utilisateur a change d'avis, et lui proposer
        // un telechargement derriere son dos serait pire que de ne rien faire.
        if (erreur && erreur.name === "AbortError") return;
      }
    }
  }

  const lien = document.createElement("a");
  lien.download = "my-vocal-range.png";
  lien.href = toile.toDataURL("image/png");
  lien.click();
}

// ---------------------------------------------------------------------------
// Branchement
// ---------------------------------------------------------------------------

function recommencer() {
  etat.balayages = { grave: null, aigu: null };
  etat.tramesDe = { grave: null, aigu: null };
  etat.etendue = null;
  etat.trames = [];
  etat.etape = "accueil";
  montrer("tess-resultat", false);
  montrer("tess-mesure", false);
  montrer("tess-accueil", true);
}

elt("tess-demarrer").addEventListener("click", () => demarrerBalayage("grave"));
elt("tess-suivant").addEventListener("click", () => terminerBalayage());
elt("tess-recommencer").addEventListener("click", recommencer);
elt("tess-copier").addEventListener("click", copierResultat);
elt("tess-image").addEventListener("click", telechargerCarte);

// Le libelle est fixe au chargement, pas au clic, parce qu'un bouton qui
// annonce un telechargement et ouvre une feuille de partage a menti.
if (partageDeFichierPossible(new File([""], "s.png", { type: "image/png" }))) {
  elt("tess-image").textContent = "Share my result";
}

/** La porte du banc en navigateur. Elle remplace le microphone par un son de
 *  frequence connue, exactement comme `ecouter` le prevoit. */
etat.pilote = {
  async balayer(hz, sens) {
    etat.sourceDeTest = hz;
    await demarrerBalayage(sens);
  },
  async changerSource(hz) {
    if (etat.ecoute) await etat.ecoute.arreter();
    etat.sourceDeTest = hz;
    etat.ecoute = await ecouter((trame) => {
      etat.trames.push(trame);
      rafraichirDirect();
    }, hz);
  },
  suivant: () => terminerBalayage(),
  /** Pose la carte dans la page pour qu'un banc puisse la REGARDER. Mesurer
   *  la taille du fichier ne dit rien de ce qui est dessine dessus. */
  carte: () => {
    document.getElementById("tess-carte-banc")?.remove();
    const toile = dessinerCarte();
    toile.id = "tess-carte-banc";
    toile.style.cssText = "width:600px;display:block;margin:1rem auto";
    document.body.appendChild(toile);
    return toile.toDataURL("image/png").length;
  },
  texte: texteDePartage,
};
