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
  /** En deca, la trame est du souffle ou du bruit, pas une note tenue. */
  confianceMin: 0.82,
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

function elt(id) {
  const noeud = document.getElementById(id);
  if (!noeud) throw new Error(`element absent, ${id}`);
  return noeud;
}

function montrer(id, visible) {
  elt(id).hidden = !visible;
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

async function lancer(base) {
  etat.base = base;
  etat.tour = 0;
  etat.resultats = [];
  etat.etape = "mesure";

  montrer("or-accueil", false);
  montrer("or-resultat", false);
  montrer("or-mesure", true);

  try {
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
