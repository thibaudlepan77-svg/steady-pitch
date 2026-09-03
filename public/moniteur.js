/**
 * moniteur.js - LE MONITEUR EN DIRECT DE LA PAGE D'ACCUEIL.
 * Agent N4, 2026-08-31 (cycle 16).
 *
 * POURQUOI CE FICHIER EXISTE, ET C'EST UNE DECISION COMMERCIALE.
 * Releve Cloudflare du 2026-08-31, cinq visites sur la page d'accueil, ZERO
 * sur `app.html`. Personne n'a clique sur le bouton. La page decrivait un
 * produit au lieu de le faire marcher, et un inconnu ne clique pas sur la
 * promesse d'un inconnu.
 *
 * Seconde raison, et elle vient d'une mesure. L'autocompletion de Google rend
 * `vocal pitch monitor online`, `vocal pitch monitor pc`, `vocal pitch monitor
 * ios`. Les gens cherchent un MONITEUR, c'est-a-dire une aiguille qui bouge
 * quand on chante, pas un programme d'exercices. La page repond desormais a la
 * requete qu'ils tapent, et l'entrainement devient ce qu'on propose ensuite.
 *
 * CE QU'IL N'EST PAS. Il ne note personne, il ne connait aucun exercice et il
 * ne garde rien. Il affiche une hauteur. Tout ce qui juge vit dans le produit.
 *
 * POURQUOI IL N'APPELLE PAS `micro-web.js`. Ce fichier-la est bati autour de
 * la TENTATIVE, il accumule les trames et les rend a l'arret. Un moniteur ne
 * s'arrete pas, il tournerait des heures en empilant des objets que personne
 * ne lira. Les trois reglages de capture qui comptent sont repris tels quels,
 * ils sont le fruit d'une mesure et pas d'un gout.
 */

/** La fenetre du produit, et celle de toutes mes mesures de justesse. */
const TAILLE_FENETRE = 2048;
const VOLUME_MIN = -60;

/** Les bornes de la voix, reprises de `REGLAGES_DEFAUT`. Une lecture hors de
 *  ces bornes vient d'un souffle ou d'un choc, pas d'une note tenue. */
const HZ_MIN = 70;
const HZ_MAX = 1100;
const CONFIANCE_MIN = 0.5;

/** Les noms des douze degres. Le controle de `moniteur.mjs` verifie a la
 *  construction qu'ils sont identiques a ceux de `noyau/langues.js`, sinon la
 *  page et le produit finiraient par nommer la meme note differemment. */
const NOMS = {
  lettres: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  syllabes: ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"],
};

const CODE_WORKLET = `
class Fenetres extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.taille = options.processorOptions.taille;
    this.tampon = new Float32Array(this.taille);
    this.remplis = 0;
  }
  process(entrees) {
    const canal = entrees[0] && entrees[0][0];
    if (!canal) return true;
    for (let i = 0; i < canal.length; i++) {
      this.tampon[this.remplis++] = canal[i];
      if (this.remplis === this.taille) {
        this.port.postMessage(this.tampon.slice());
        this.remplis = 0;
      }
    }
    return true;
  }
}
registerProcessor('fenetres', Fenetres);
`;

let contexte = null;
let flux = null;
let laReference = 440;
let systeme = "lettres";

/** Les dernieres lectures retenues, pour une mediane. Une seule trame saute
 *  d'une dizaine de cents d'une fenetre a l'autre sur une voix parfaitement
 *  tenue, et une aiguille qui tremble donne tort a l'appareil et pas au
 *  chanteur. Cinq fenetres font environ deux cent dix millisecondes. */
const RETENUES = 5;
const dernieres = [];

/** Combien de fenetres muettes avant d'effacer l'affichage. Effacer des la
 *  premiere ferait clignoter l'ecran entre deux syllabes. */
const PATIENCE = 8;
let muettes = 0;

/**
 * LA TRACE, AJOUTEE LE 2026-08-31 (cycle 16).
 *
 * POURQUOI. Le produit dominant de cette niche, `Vocal Pitch Monitor`, ne fait
 * qu'une chose, il dessine la hauteur qui defile, et c'est ce que ses
 * utilisateurs citent en premier. Un moniteur qui n'affiche qu'un chiffre dit
 * ou vous ETES. Il ne dit pas si vous DERIVEZ, si vous attaquez par en dessous,
 * ni si la fin de votre phrase s'affaisse. Or ces trois defauts sont ceux que
 * l'on vient corriger, et aucun ne tient dans un nombre.
 *
 * La trace garde les trames MUETTES, sous forme de trous. Un silence entre deux
 * syllabes fait partie de ce qu'on veut voir, et une courbe qui relie deux
 * notes separees par une respiration raconterait un glissando qui n'a pas eu
 * lieu.
 */
const TRACE_SECONDES = 10;
const trace = [];
let traceMaxPoints = 240;

function mediane(xs) {
  const tri = [...xs].sort((a, b) => a - b);
  const m = tri.length >> 1;
  return tri.length % 2 ? tri[m] : (tri[m - 1] + tri[m]) / 2;
}

/**
 * Dessine la trace. `null` marque une trame sans note.
 *
 * L'echelle verticale suit ce qui a ete chante plutot qu'une tessiture fixe.
 * Une echelle fixe ecraserait une voix de basse en bas de l'image et laisserait
 * les trois quarts vides, et l'ecart de quelques cents qu'on vient observer y
 * serait invisible. Le plancher de deux demi-tons evite l'effet inverse, une
 * note tenue parfaitement juste dont le moindre tremblement remplirait l'ecran.
 */
function dessinerTrace() {
  const toile = elt("mon-trace");
  if (!toile || typeof toile.getContext !== "function") return;
  const ctx = toile.getContext("2d");
  if (!ctx) return;

  const ratio = window.devicePixelRatio || 1;
  const largeur = toile.clientWidth || 600;
  const hauteur = toile.clientHeight || 110;
  if (toile.width !== Math.round(largeur * ratio)) {
    toile.width = Math.round(largeur * ratio);
    toile.height = Math.round(hauteur * ratio);
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, largeur, hauteur);

  const style = getComputedStyle(document.documentElement);
  const lire = (nom, repli) => (style.getPropertyValue(nom) || repli).trim();
  const trait = lire("--trait", "#ddd8cc");
  const doux = lire("--doux", "#5d5a52");
  const accent = lire("--accent", "#8a3324");

  const notes = trace.filter((p) => p !== null);
  if (notes.length < 2) {
    ctx.fillStyle = doux;
    ctx.font = '12px "IBM Plex Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText("your last ten seconds appear here", largeur / 2, hauteur / 2);
    return;
  }

  const enMidi = (hz) => 69 + 12 * Math.log2(hz / laReference);
  const midis = notes.map(enMidi);
  let bas = Math.min(...midis);
  let haut = Math.max(...midis);
  const milieu = (bas + haut) / 2;
  const etendue = Math.max(2, haut - bas + 1);
  bas = milieu - etendue / 2;
  haut = milieu + etendue / 2;

  const y = (midi) => hauteur - ((midi - bas) / (haut - bas)) * hauteur;
  const x = (i) => (i / (traceMaxPoints - 1)) * largeur;

  // Les lignes de demi-ton, avec leur nom. C'est ce qui transforme une courbe
  // en information musicale plutot qu'en decoration.
  ctx.font = '10px "IBM Plex Mono", monospace';
  ctx.textAlign = "left";
  for (let m = Math.ceil(bas); m <= Math.floor(haut); m++) {
    const ligne = y(m);
    ctx.strokeStyle = trait;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, ligne + 0.5);
    ctx.lineTo(largeur, ligne + 0.5);
    ctx.stroke();
    if (haut - bas <= 14) {
      ctx.fillStyle = doux;
      ctx.fillText(NOMS[systeme][((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1), 3, ligne - 3);
    }
  }

  // La courbe, interrompue a chaque trame muette.
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  let leve = true;
  const depart = traceMaxPoints - trace.length;
  trace.forEach((p, i) => {
    if (p === null) { leve = true; return; }
    const px = x(depart + i);
    const py = y(enMidi(p));
    if (leve) { ctx.moveTo(px, py); leve = false; } else { ctx.lineTo(px, py); }
  });
  ctx.stroke();
}

function elt(id) {
  return document.getElementById(id);
}

/**
 * Nomme une hauteur et dit de combien elle s'ecarte de cette note.
 * L'octave sort a part, l'affichage la met en petit.
 */
function lireHauteur(hz) {
  const midi = 69 + 12 * Math.log2(hz / laReference);
  const rond = Math.round(midi);
  return {
    nom: NOMS[systeme][((rond % 12) + 12) % 12],
    octave: Math.floor(rond / 12) - 1,
    ecart: Math.round((midi - rond) * 100),
  };
}

function afficherSilence() {
  elt("mon-note").textContent = "-";
  elt("mon-octave").textContent = "";
  elt("mon-ecart").textContent = "sing or play a note";
  elt("mon-hz").textContent = "";
  elt("mon-aiguille").style.left = "50%";
  elt("mon-aiguille").style.opacity = "0.25";
  elt("mon-jauge").dataset.etat = "muet";
}

function afficher(hz) {
  const { nom, octave, ecart } = lireHauteur(hz);
  const borne = Math.max(-50, Math.min(50, ecart));

  elt("mon-note").textContent = nom;
  elt("mon-octave").textContent = octave;
  elt("mon-hz").textContent = hz.toFixed(1) + " Hz";
  elt("mon-ecart").textContent =
    ecart === 0 ? "dead on" : (ecart > 0 ? "+" : "") + ecart + " cents";
  elt("mon-aiguille").style.left = (50 + borne) + "%";
  elt("mon-aiguille").style.opacity = "1";
  elt("mon-jauge").dataset.etat =
    Math.abs(ecart) <= 10 ? "juste" : Math.abs(ecart) <= 25 ? "proche" : "loin";
}

function surFenetre(echantillons) {
  const r = yinDetect(echantillons, contexte.sampleRate, VOLUME_MIN);
  const bonne = r.hz > HZ_MIN && r.hz < HZ_MAX && r.confiance >= CONFIANCE_MIN;

  if (!bonne) {
    pousserTrace(null);
    if (++muettes >= PATIENCE) {
      dernieres.length = 0;
      afficherSilence();
    }
    return;
  }

  muettes = 0;
  // L'AFFINAGE COMPTE DOUBLE ICI. Un moniteur affiche des cents en clair, la
  // ou l'entrainement les fond dans un verdict. Un sceptique qui doute d'un
  // accordeur lui envoie un ton pur, et c'etait le pire cas du detecteur brut,
  // trente cents dans le grave. Mesure dans `test-affinage.ts`.
  dernieres.push(affinerHauteur(echantillons, r.hz, contexte.sampleRate));
  if (dernieres.length > RETENUES) dernieres.shift();
  const lisse = mediane(dernieres);
  pousserTrace(lisse);
  afficher(lisse);
}

/** Ajoute un point a la trace et la redessine. `null` pour une trame muette. */
function pousserTrace(hz) {
  trace.push(hz);
  while (trace.length > traceMaxPoints) trace.shift();
  dessinerTrace();
}

async function allumer() {
  const bouton = elt("mon-bouton");
  bouton.disabled = true;
  bouton.textContent = "asking for the microphone";

  try {
    flux = await navigator.mediaDevices.getUserMedia({
      audio: {
        // LES TROIS QUI DETRUIRAIENT LA MESURE, coupees comme dans le produit.
        // Elles sont concues pour la parole au telephone, elles ecrasent la
        // dynamique et deforment le spectre.
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      },
    });
  } catch {
    bouton.disabled = false;
    bouton.textContent = "Turn the microphone on";
    elt("mon-erreur").textContent = window.isSecureContext
      ? "The browser refused the microphone. Nothing else on this page needs it."
      : "A microphone needs a page served over HTTPS. This one is not.";
    return;
  }

  contexte = new (window.AudioContext || window.webkitAudioContext)();
  if (contexte.state === "suspended") await contexte.resume();

  let noeud;
  try {
    const url = URL.createObjectURL(
      new Blob([CODE_WORKLET], { type: "application/javascript" }));
    await contexte.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    noeud = new AudioWorkletNode(contexte, "fenetres", {
      numberOfInputs: 1,
      numberOfOutputs: 0,
      processorOptions: { taille: TAILLE_FENETRE },
    });
    noeud.port.onmessage = (e) => surFenetre(e.data);
  } catch {
    // Repli pour les navigateurs sans worklet. Le noeud deprecie n'est cadence
    // que s'il debouche sur une sortie, d'ou le gain a zero.
    noeud = contexte.createScriptProcessor(TAILLE_FENETRE, 1, 1);
    noeud.onaudioprocess = (e) => surFenetre(e.inputBuffer.getChannelData(0));
    const muet = contexte.createGain();
    muet.gain.value = 0;
    noeud.connect(muet);
    muet.connect(contexte.destination);
  }

  contexte.createMediaStreamSource(flux).connect(noeud);

  // Combien de trames tiennent dans la fenetre de la trace, DEDUIT de la
  // frequence reelle du materiel et non suppose. Le meme piege que dans
  // `micro-web.js`, une machine a 48 000 Hz ne rend pas des trames de la meme
  // duree qu'une machine a 44 100.
  traceMaxPoints = Math.round(TRACE_SECONDES / (TAILLE_FENETRE / contexte.sampleRate));
  trace.length = 0;

  elt("mon-avant").hidden = true;
  elt("mon-pendant").hidden = false;
  afficherSilence();
  dessinerTrace();
}

async function eteindre() {
  if (flux) {
    for (const piste of flux.getTracks()) piste.stop();
    flux = null;
  }
  if (contexte && contexte.state !== "closed") {
    try { await contexte.close(); } catch { /* deja ferme */ }
  }
  contexte = null;
  dernieres.length = 0;
  trace.length = 0;
  elt("mon-pendant").hidden = true;
  elt("mon-avant").hidden = false;
  elt("mon-bouton").disabled = false;
  elt("mon-bouton").textContent = "Turn the microphone on";
}

function brancher() {
  elt("mon-bouton").addEventListener("click", allumer);
  elt("mon-stop").addEventListener("click", eteindre);
  // Les deux reglages repeignent aussi la trace, dont les lignes de demi-ton et
  // l'echelle dependent du nom des notes et du la de reference.
  elt("mon-systeme").addEventListener("change", (e) => {
    systeme = e.target.value;
    if (dernieres.length) afficher(mediane(dernieres));
    dessinerTrace();
  });
  elt("mon-la").addEventListener("change", (e) => {
    laReference = Number(e.target.value);
    if (dernieres.length) afficher(mediane(dernieres));
    dessinerTrace();
  });
  // Une toile dessinee a une taille et affichee a une autre devient floue.
  window.addEventListener("resize", dessinerTrace);
  // Le voyant du microphone doit s'eteindre quand on quitte la page, meme si
  // le visiteur ne clique jamais sur le bouton d'arret.
  window.addEventListener("pagehide", eteindre);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", brancher);
} else {
  brancher();
}

/**
 * UNE LUCARNE DE LECTURE SUR LA TRACE, comme `window.__steady` cote produit.
 * Aucune donnee n en sort, elle sert au banc a regarder ce que la trace CONTIENT
 * plutot qu a le deviner depuis ce qu elle DESSINE. Cette distinction m a coute
 * vingt minutes le 2026-08-31, mon banc comptant les levers de crayon des
 * lignes de portee comme des ruptures de la courbe.
 */
window.__trace = { lire: () => trace.slice(), plafond: () => traceMaxPoints };
