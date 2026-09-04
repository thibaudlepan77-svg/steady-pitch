/**
 * oreille-ui.js, L'ECRAN DU TEST D'APPARIEMENT DE HAUTEUR.
 * Agent N4, 2026-09-04 (cycle 19).
 *
 * CE QUE CE TEST MESURE, ET C'EST LA SEULE CHOSE QUI LE DISTINGUE DU RAYON.
 * Les tests `tone deaf` du web font entendre DEUX sons et demandent s'ils sont
 * differents. C'est un test de PERCEPTION, et il est repondu correctement par
 * la quasi-totalite des gens qui se croient sourds aux sons. Le vrai probleme
 * de ces gens est la PRODUCTION, entendre la cible et ne pas savoir poser sa
 * voix dessus. Personne ne le mesure, parce que le mesurer demande un
 * detecteur de hauteur et pas un questionnaire.
 *
 * L'OCTAVE EST TRAITEE COMME UNE REUSSITE, ET C'EST DELIBERE. Un homme a qui
 * l'on joue un la 4 chante tres souvent un la 3, ce qui est la BONNE note dans
 * sa voix. Un test qui compte ca comme une faute dit a des gens justes qu'ils
 * sont faux, et c'est exactement le mensonge que je reproche aux autres. On
 * replie donc sur l'octave la plus proche avant de noter, et on compte les
 * replis a part, parce que c'est une information et non un echec.
 *
 * CE QU'IL EXPOSE POUR LE BANC, `window.__oreille`. Meme raison que pour le
 * test d'etendue, lire un etat coute une ligne, le deduire d'un dessin coute
 * vingt minutes.
 */

const REGLAGES_OREILLE = {
  /**
   * En deca, la trame est du souffle ou du bruit, pas une note tenue.
   *
   * CE CHIFFRE EST CELUI DU TEST D'ETENDUE, ET J'AI PAYE POUR L'APPRENDRE.
   * J'avais d'abord ecrit 0,82, choisi au jugé parce que ca sonnait exigeant.
   * La confiance rendue par YIN BAISSE QUAND LA NOTE DESCEND, mecaniquement,
   * parce qu'une fenetre de 2048 echantillons contient de moins en moins de
   * periodes. Mesure au banc en navigateur, sur un son parfait.
   *
   *     220 Hz   confiance 0,894     75 trames sur 75 retenues
   *     165 Hz   confiance 0,858     74 sur 75
   *     131 Hz   confiance 0,820     36 sur 75
   *     110 Hz   confiance 0,789     ZERO sur 75
   *
   * A 0,82 le test rendait donc `no held note` a tout homme chantant sous un
   * do 3, c'est-a-dire a la moitie grave de son public, ET precisement dans le
   * cas dont la page fait son argument, chanter la bonne note une octave plus
   * bas. Un seuil invente vaut moins qu'un seuil deja eprouve contre de vraies
   * voix, et celui-la l'est.
   */
  confianceMin: 0.55,
  /** Duree d'ecoute par note, en millisecondes. */
  msEcoute: 3200,
  /** Duree de la note de reference. */
  msReference: 1500,
  /** On jette le debut de l'ecoute, le temps que la voix se pose. */
  msAmorce: 700,
  /** Sans au moins ce nombre de trames sures, la tentative ne compte pas. */
  tramesMin: 8,
};

/**
 * LES CIBLES. Six notes, jamais dans l'ordre, parce qu'une suite qui monte se
 * chante de proche en proche et mesurerait l'intervalle plutot que la note.
 * Les degres sont donnes en demi-tons au-dessus de la base choisie.
 */
const DEGRES = [0, 7, 3, 10, 5, 2];

/** Les deux bases, en MIDI. La 2 pour les voix graves, la 3 pour les aigues. */
const BASES = { grave: 45, aigu: 57 };

const etat = {
  etape: "accueil",
  base: null,
  tour: 0,
  resultats: [],
  ecoute: null,
};

/**
 * CE QUI EST EXPOSE, ET POURQUOI CE N'EST PAS QUE L'ETAT. La notation est la
 * seule partie de ce fichier qui puisse etre fausse SANS QUE RIEN NE SE VOIE.
 * Un ecran casse saute aux yeux, un verdict de travers a l'air d'un verdict.
 * On la sort donc pour qu'un banc puisse la juger hors navigateur.
 */
window.__oreille = etat;
window.__oreilleNotation = { noterAppariement, composerBilan, hauteurRetenue, verdictDe };

/**
 * LE BANC EN NAVIGATEUR. Il remplace le microphone par un son de frequence
 * CONNUE et fait tourner tout le reste pour de vrai, worklet compris, a la
 * vraie frequence d'echantillonnage du materiel.
 *
 * Sans lui, la seule facon d'eprouver la chaine de mesure serait de chanter
 * dans un navigateur pilote, qui n'a pas de microphone. Le banc hors
 * navigateur, lui, ne juge que la notation, en lui donnant des trames que
 * j'ai ecrites moi-meme. Entre les deux il reste le detecteur et le transport
 * audio, et c'est precisement la que le cycle 16 avait cache sa faute.
 *
 * CE QU'IL NE PROUVE PAS, et je prefere l'ecrire, la capture elle-meme, le
 * gain d'entree et la latence du bus audio.
 */
window.__oreilleBanc = async function (hzSource, cibleMidi) {
  const ecoute = await ecouter(null, hzSource);
  await new Promise((resoudre) => setTimeout(resoudre, REGLAGES_OREILLE.msEcoute));
  const trames = await ecoute.arreter();
  const hz = hauteurRetenue(trames, ecoute.msParTrame);
  await liberer();
  const confiances = trames.map((t) => t.confiance).sort((a, b) => a - b);
  return {
    trames: trames.length,
    hzRetenu: hz,
    // La confiance sert a comprendre un `null`. Sans elle, une tentative non
    // notee ne dit pas si l'utilisateur s'est tu ou si le detecteur a doute.
    confianceMediane: confiances.length ? confiances[Math.floor(confiances.length / 2)] : null,
    confianceHaute: confiances.length ? confiances[confiances.length - 1] : null,
    surLeSeuil: trames.filter((t) => t.hz > 0 && t.confiance >= REGLAGES_OREILLE.confianceMin).length,
    note: hz === null ? null : noterAppariement(hz, midiVersHz(cibleMidi)),
  };
};

function elt(id) {
  const noeud = document.getElementById(id);
  if (!noeud) throw new Error(`element absent, ${id}`);
  return noeud;
}

function montrer(id, visible) {
  elt(id).hidden = !visible;
}

/**
 * POUR LES SEULS ELEMENTS QUE LA COPIE HORS LIGNE RETIRE.
 *
 * `emballer-oreille.mjs` coupe le paragraphe de vente, parce qu'on n'argumente
 * pas un prix aupres de quelqu'un qui a deja paye. Le code de l'ecran, lui,
 * continuait de le masquer ou de le montrer selon le verdict, et `elt` leve
 * quand l'element n'est pas la. **Le fichier vendu plantait donc sur l'ecran de
 * resultat, c'est-a-dire chez le seul utilisateur qui ait sorti sa carte.**
 *
 * On ne rend pas `elt` tolerant pour autant. Ailleurs, un identifiant absent
 * est une faute de frappe et doit crier. Ici seulement, l'absence est prevue.
 */
function montrerSiPresent(id, visible) {
  const noeud = document.getElementById(id);
  if (noeud) noeud.hidden = !visible;
}

const cibleDuTour = (tour) => BASES[etat.base] + DEGRES[tour];

// ---------------------------------------------------------------------------
// LA NOTATION D'UNE TENTATIVE
// ---------------------------------------------------------------------------

/**
 * Rend la hauteur retenue pour une tentative, ou null si l'utilisateur n'a
 * rien chante d'exploitable.
 *
 * ON PREND LA MEDIANE ET NON LA MOYENNE. Une seule trame parasite a une
 * octave de distance deplacerait une moyenne de plusieurs centaines de cents,
 * et le debut d'une note chantee est presque toujours une glissade vers la
 * cible. La mediane ignore les deux.
 */
function hauteurRetenue(trames, msParTrame) {
  const aJeter = Math.floor(REGLAGES_OREILLE.msAmorce / msParTrame);
  const sures = trames
    .slice(aJeter)
    .filter((t) => t.hz > 0 && t.confiance >= REGLAGES_OREILLE.confianceMin)
    .map((t) => t.hz);

  if (sures.length < REGLAGES_OREILLE.tramesMin) return null;
  return mediane(sures);
}

/**
 * Note une tentative contre sa cible. `replie` dit que l'utilisateur a chante
 * la bonne note dans une autre octave, ce qui n'est pas une faute.
 */
function noterAppariement(hzChante, cibleHz) {
  const replie = replierOctave(hzChante, cibleHz);
  const octaves = Math.round(Math.log2(replie / hzChante));
  return {
    hzChante,
    hzReplie: replie,
    cibleHz,
    ecartCents: cents(replie, cibleHz),
    octavesDeplacees: octaves,
  };
}

// ---------------------------------------------------------------------------
// LE VERDICT D'ENSEMBLE
// ---------------------------------------------------------------------------

/**
 * LES SEUILS, ET D'OU ILS SORTENT. Un demi-ton fait cent cents. Un chanteur
 * entraine tient une note a mieux que dix cents, un adulte non entraine mais
 * juste tourne autour de vingt-cinq, et au-dela d'un demi-ton l'auditeur
 * entend une fausse note plutot qu'une note un peu basse. Ce sont des reperes
 * d'usage, pas un diagnostic, et la page le dit en toutes lettres.
 */
function verdictDe(ecartMedian, tentativesValides) {
  if (tentativesValides === 0) return "RIEN";
  if (ecartMedian < 25) return "JUSTE";
  if (ecartMedian < 50) return "ORDINAIRE";
  if (ecartMedian < 100) return "APPROXIMATIF";
  return "LOIN";
}

const TEXTE_VERDICT = {
  JUSTE: "You match pitch accurately.",
  ORDINAIRE: "You match pitch about as well as most untrained singers.",
  APPROXIMATIF: "You are finding the notes, but not landing on them.",
  LOIN: "Your attempts did not line up with the targets.",
  RIEN: "Not enough held sound to score.",
};

/**
 * CE QU'ON PROPOSE APRES LE VERDICT, ET CE N'EST PAS LE MEME TEXTE POUR TOUS.
 *
 * Le moment ou quelqu'un vient d'apprendre un chiffre sur sa propre voix est le
 * seul de la page ou il a une raison de vouloir la suite. Lui servir la meme
 * phrase de vente qu'il ait ete a huit cents ou a deux cents serait
 * malhonnete, et se verrait.
 *
 * Celui qui est deja juste n'a rien a corriger, on ne lui vend pas une
 * correction. Celui qui n'a rien produit d'exploitable a un probleme de
 * materiel ou de consigne, et lui proposer un achat a ce moment-la serait
 * profiter d'une mesure ratee.
 */
const SUITE = {
  JUSTE: {
    titre: "You do not need fixing, so here is the honest next thing.",
    texte: "Matching a note you have just heard is the easy half. Holding it "
      + "through a phrase, and finding it without a reference first, are the "
      + "parts that take work. That is what the trainer drills.",
  },
  ORDINAIRE: {
    titre: "This is the range where practice moves the number fastest.",
    texte: "You are landing near the notes and not on them, which is the most "
      + "common result and the most responsive to work. What changes it is "
      + "short sessions with feedback on every attempt rather than long ones.",
  },
  APPROXIMATIF: {
    titre: "You are hearing the notes. The gap is in landing on them.",
    texte: "That gap closes with immediate feedback, because the correction has "
      + "to arrive while the note is still sounding. Being told afterwards that "
      + "you were flat teaches almost nothing.",
  },
  LOIN: {
    titre: "Before concluding anything, rule out the boring explanations.",
    texte: "A noisy room, a distant microphone, or singing while the reference "
      + "note is still playing will all produce this. Try once more with "
      + "headphones. If it holds up, start from single held notes with a "
      + "reference sounding next to you rather than from songs.",
  },
  RIEN: {
    titre: "Nothing was measured, so there is nothing to conclude.",
    texte: "The page needs a note held for about a second to score it. Sing an "
      + "open ah out loud rather than humming, and check that the browser is "
      + "using the microphone you think it is.",
  },
};

function composerBilan(resultats) {
  const valides = resultats.filter((r) => r !== null);
  const ecarts = valides.map((r) => Math.abs(r.ecartCents));
  const ecartMedian = ecarts.length ? mediane(ecarts) : 0;
  const signes = valides.map((r) => r.ecartCents);
  const replis = valides.filter((r) => r.octavesDeplacees !== 0).length;

  // UN BIAIS CONSTANT EST UNE AUTRE MALADIE QU'UNE DISPERSION. Quelqu'un qui
  // est bas de trente cents SUR TOUTES les notes s'entend et se corrige en une
  // seance. Quelqu'un qui est a plus ou moins trente au hasard a un tout autre
  // probleme. On ne peut pas les distinguer avec une valeur absolue seule.
  const biais = signes.length ? mediane(signes) : 0;
  const biaisNet = Math.abs(biais) > 15 && signes.every((s) => Math.sign(s) === Math.sign(biais));

  return {
    tentatives: resultats.length,
    valides: valides.length,
    ecartMedian,
    biais,
    biaisNet,
    replis,
    verdict: verdictDe(ecartMedian, valides.length),
  };
}

// ---------------------------------------------------------------------------
// LE DEROULEMENT
// ---------------------------------------------------------------------------

async function jouerUnTour() {
  const cibleMidi = cibleDuTour(etat.tour);
  const cibleHz = midiVersHz(cibleMidi);

  elt("or-etape").textContent =
    `Note ${etat.tour + 1} of ${DEGRES.length}`;
  elt("or-cible").textContent = nommerNote(cibleMidi, "lettres");

  elt("or-consigne").textContent = "Listen.";
  montrer("or-vu-metre", false);
  await jouerNote(cibleHz, REGLAGES_OREILLE.msReference);

  elt("or-consigne").textContent = "Now sing it, on ah, and hold it.";
  montrer("or-vu-metre", true);

  let derniere = 0;
  etat.ecoute = await ecouter((trame) => {
    if (trame.hz > 0 && trame.confiance >= REGLAGES_OREILLE.confianceMin) {
      derniere = trame.hz;
      elt("or-vive").textContent = nommerNote(Math.round(hzVersMidi(trame.hz)), "lettres");
    }
  });

  await new Promise((resoudre) => setTimeout(resoudre, REGLAGES_OREILLE.msEcoute));
  const trames = await etat.ecoute.arreter();
  const msParTrame = etat.ecoute.msParTrame;
  etat.ecoute = null;

  const hz = hauteurRetenue(trames, msParTrame);
  etat.resultats.push(hz === null ? null : noterAppariement(hz, cibleHz));
  elt("or-vive").textContent = "-";
}

/**
 * LE MICROPHONE, DEMANDE UNE SEULE FOIS ET SOUS GARDE.
 *
 * POURQUOI CETTE GARDE EXISTE, ET ELLE VIENT D'UN VRAI PLANTAGE. Si l'on
 * demande le microphone et que l'utilisateur ne repond NI oui NI non, la
 * promesse de `getUserMedia` ne se resout jamais. Elle ne rejette pas non plus,
 * donc aucun `catch` ne la rattrape. La page reste alors sur `Now sing it` pour
 * toujours, en silence, et le visiteur conclut que le test est casse.
 *
 * Ca n'arrive pas qu'aux navigateurs pilotes. Un utilisateur qui ecarte la
 * demande sans cliquer, ou un onglet en arriere-plan quand elle apparait,
 * tombent au meme endroit. Un refus franc, lui, rejette proprement et se dit
 * tout seul.
 */
async function obtenirMicro() {
  elt("or-consigne").textContent = "Waiting for microphone permission.";
  const attente = new Promise((_, rejeter) =>
    setTimeout(() => rejeter(new Error(
      "The browser never returned an answer about the microphone. Look for a "
      + "permission prompt in the address bar, allow it, and start again."
    )), 20000));
  await Promise.race([preparer(true), attente]);
}

async function lancer(base) {
  etat.base = base;
  etat.tour = 0;
  etat.resultats = [];
  etat.etape = "mesure";

  montrer("or-accueil", false);
  montrer("or-resultat", false);
  montrer("or-mesure", true);
  elt("or-erreur").hidden = true;

  try {
    await obtenirMicro();
    for (etat.tour = 0; etat.tour < DEGRES.length; etat.tour++) {
      await jouerUnTour();
    }
  } catch (souci) {
    montrer("or-mesure", false);
    montrer("or-accueil", true);
    const erreur = elt("or-erreur");
    erreur.textContent = String(souci && souci.message ? souci.message : souci);
    erreur.hidden = false;
    etat.etape = "accueil";
    return;
  }

  await liberer();
  afficherBilan();
}

// ---------------------------------------------------------------------------
// L'AFFICHAGE DU BILAN
// ---------------------------------------------------------------------------

/**
 * LA MESURE PRECEDENTE, SUR L APPAREIL ET NULLE PART AILLEURS.
 *
 * Meme motif que sur le test d etendue, et pour la meme raison. On passe ce
 * test une fois et on n a aucune raison de revenir, alors que la seule chose
 * qui donnerait envie de revenir est un chiffre a soi a comparer. Rien ne part
 * au serveur, sinon la phrase de la page sur ce qui ne quitte pas la machine
 * deviendrait fausse.
 */
const CLE_MEMOIRE_OREILLE = "steady-pitch.oreille";

/** Sous ce delai on ne compare pas, deux essais du meme quart d heure mesurent
 *  la meme voix du meme jour. */
const MS_AVANT_COMPARAISON_OREILLE = 6 * 3600 * 1000;

/**
 * DIX CENTS AVANT D APPELER CA UN CHANGEMENT, ET LE CHIFFRE VIENT DE LA TAILLE
 * DE L ECHANTILLON, PAS DE LA PRUDENCE.
 *
 * Le bilan est une MEDIANE sur six notes, dont certaines peuvent etre
 * invalides. Six points, c est peu, et l ecart type d une seance a l autre chez
 * la meme personne couvre facilement une dizaine de cents. Annoncer un progres
 * de trois cents reviendrait a feliciter quelqu un pour le bruit de sa propre
 * mesure, et le jour ou la page annoncerait un vrai progres, plus personne ne
 * la croirait.
 */
const CENTS_SIGNIFICATIFS = 10;

function lireMemoireOreille() {
  try {
    const brut = window.localStorage.getItem(CLE_MEMOIRE_OREILLE);
    if (!brut) return null;
    const garde = JSON.parse(brut);
    if (!Number.isFinite(garde.cents) || !Number.isFinite(garde.quand)) return null;
    return garde;
  } catch {
    return null;
  }
}

function ecrireMemoireOreille(bilan) {
  try {
    window.localStorage.setItem(CLE_MEMOIRE_OREILLE, JSON.stringify({
      cents: Math.round(bilan.ecartMedian),
      quand: Date.now(),
    }));
  } catch {
    /* Rien a faire. Le resultat du jour s affiche quand meme. */
  }
}

function ilYAOreille(ms) {
  const jours = Math.floor(ms / 86400000);
  if (jours < 1) return "earlier today";
  if (jours === 1) return "yesterday";
  if (jours < 14) return `${jours} days ago`;
  const semaines = Math.round(jours / 7);
  if (semaines < 9) return `${semaines} weeks ago`;
  return `${Math.round(jours / 30)} months ago`;
}

/**
 * ON N ECRIT QUE LES MESURES QUI ONT REUSSI. Un essai ou rien n a ete tenu
 * n est pas un score de zero, c est une absence de score, et l ecrire
 * effacerait un vrai chiffre au profit d une panne de microphone.
 */
function comparerAvantOreille(bilan) {
  const boite = elt("or-avant");
  const avant = lireMemoireOreille();
  if (bilan.valides > 0) ecrireMemoireOreille(bilan);

  if (!avant || !bilan.valides || Date.now() - avant.quand < MS_AVANT_COMPARAISON_OREILLE) {
    montrer("or-avant", false);
    return;
  }

  const maintenant = Math.round(bilan.ecartMedian);
  const ecart = avant.cents - maintenant;
  const quand = ilYAOreille(Date.now() - avant.quand);

  let verdict;
  if (Math.abs(ecart) < CENTS_SIGNIFICATIFS) {
    verdict = "That is the same, within what six notes can tell apart.";
  } else if (ecart > 0) {
    verdict = `You are ${ecart} cents closer than you were.`;
  } else {
    verdict = `You are ${-ecart} cents further off than you were, which one bad `
      + "morning is enough to explain.";
  }

  boite.textContent = `Last measured on this device ${quand}, ${avant.cents} cents. ${verdict}`;
  montrer("or-avant", true);
}

function afficherBilan() {
  const bilan = composerBilan(etat.resultats);
  etat.bilan = bilan;
  etat.etape = "resultat";

  montrer("or-mesure", false);
  montrer("or-resultat", true);

  elt("or-verdict").textContent = TEXTE_VERDICT[bilan.verdict];

  elt("or-chiffre").textContent = bilan.valides
    ? `${Math.round(bilan.ecartMedian)} cents off, typically`
    : "";

  comparerAvantOreille(bilan);

  const detail = [];
  if (bilan.valides < bilan.tentatives) {
    detail.push(`${bilan.tentatives - bilan.valides} of ${bilan.tentatives} attempts had no held note in them and were not scored.`);
  }
  if (bilan.replis > 0) {
    detail.push(`${bilan.replis} of your notes were the right note in a different octave. That is counted as correct, because it is.`);
  }
  if (bilan.biaisNet) {
    detail.push(`You were consistently ${bilan.biais > 0 ? "above" : "below"} every target rather than scattered around them, which is the easier of the two problems to fix.`);
  }
  detail.push("A semitone is 100 cents. Trained singers hold a note inside 10.");
  elt("or-detail").textContent = detail.join(" ");

  const suite = SUITE[bilan.verdict];
  elt("or-suite-titre").textContent = suite.titre;
  elt("or-suite-texte").textContent = suite.texte;

  // RIEN veut dire que la mesure a echoue, pas que la personne chante mal.
  // Lui presenter un prix a ce moment-la serait encaisser sur une panne.
  const mesureRatee = bilan.verdict === "RIEN";
  montrerSiPresent("or-offre", !mesureRatee);
  montrerSiPresent("or-vente", !mesureRatee);

  const hote = elt("or-lignes");
  hote.textContent = "";
  etat.resultats.forEach((resultat, i) => {
    const cible = cibleDuTour(i);
    const rang = document.createElement("div");
    rang.className = "or-rang";

    const nom = document.createElement("span");
    nom.className = "or-nom";
    nom.textContent = nommerNote(cible, "lettres");

    const valeur = document.createElement("span");
    valeur.className = "or-valeur";
    if (resultat === null) {
      valeur.textContent = "no held note";
    } else {
      const ecart = Math.round(resultat.ecartCents);
      const sens = ecart === 0 ? "exact" : ecart > 0 ? "sharp" : "flat";
      valeur.textContent = ecart === 0
        ? "exact"
        : `${Math.abs(ecart)} cents ${sens}`;
      if (resultat.octavesDeplacees !== 0) {
        valeur.textContent += `, ${Math.abs(resultat.octavesDeplacees)} octave ${resultat.octavesDeplacees > 0 ? "down" : "up"}`;
      }
    }
    rang.append(nom, valeur);
    hote.appendChild(rang);
  });
}

// ---------------------------------------------------------------------------
// LE BRANCHEMENT
// ---------------------------------------------------------------------------

function brancher() {
  elt("or-grave").addEventListener("click", () => lancer("grave"));
  elt("or-aigu").addEventListener("click", () => lancer("aigu"));
  elt("or-recommencer").addEventListener("click", () => {
    montrer("or-resultat", false);
    montrer("or-accueil", true);
    etat.etape = "accueil";
  });

  const diag = diagnostic();
  if (!diag.utilisable) {
    const erreur = elt("or-erreur");
    erreur.textContent = diag.raison;
    erreur.hidden = false;
    elt("or-grave").disabled = true;
    elt("or-aigu").disabled = true;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", brancher);
} else {
  brancher();
}
