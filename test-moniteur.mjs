/**
 * test-moniteur.mjs - LE BANC DU MONITEUR DE LA PAGE D'ACCUEIL.
 * Agent N4, 2026-08-31 (cycle 16).
 *
 * POURQUOI IL EXISTE. Ma regle du cycle 12 dit qu'un fichier qui touche au
 * materiel est repute FAUX tant qu'une machine ne l'a pas joue. Le materiel
 * ici, c'est le microphone, et Node n'en a pas. Mais tout ce qui vient APRES
 * la capture est du calcul ordinaire, et c'est la que vivent les fautes que je
 * ne verrais pas a l'oeil, une mediane qui glisse, un compteur de patience qui
 * n'efface jamais, une aiguille qui sort de sa boite.
 *
 * COMMENT IL S'Y PREND. Il monte un faux document et un faux contexte audio,
 * charge le VRAI `moniteur.js` et le VRAI `pitch.js`, puis lui pousse des
 * fenetres d'echantillons fabriquees a des frequences connues. Il relit
 * ensuite ce que le moniteur a ecrit dans le faux document.
 *
 * CE QU'IL NE PROUVE PAS, et je le dis ici plutot que de l'oublier. La capture
 * elle meme, le worklet, la permission du navigateur et le rendu visuel. Ces
 * quatre la se verifient dans un navigateur, sur la page publiee.
 *
 *     node travail/web-steady-pitch/test-moniteur.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ICI = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ICI, "public");

let echecs = 0;
const verifier = (nom, obtenu, attendu) => {
  const bon = obtenu === attendu;
  if (!bon) echecs++;
  console.log(`  ${bon ? "ok  " : "RATE"} ${nom}`);
  if (!bon) console.log(`       attendu ${attendu}, obtenu ${obtenu}`);
};

// ---------------------------------------------------------------------------
// LE FAUX DOCUMENT. Assez riche pour que le moniteur ne sache pas qu'il ment.
// ---------------------------------------------------------------------------

const noeuds = new Map();
function faireNoeud(id) {
  const n = {
    id,
    textContent: "",
    hidden: false,
    disabled: false,
    value: "",
    style: {},
    dataset: {},
    ecouteurs: {},
    addEventListener(type, f) { this.ecouteurs[type] = f; },
  };
  noeuds.set(id, n);
  return n;
}

for (const id of ["mon-note", "mon-octave", "mon-hz", "mon-ecart", "mon-jauge",
                  "mon-aiguille", "mon-avant", "mon-pendant", "mon-bouton",
                  "mon-stop", "mon-systeme", "mon-la", "mon-erreur"]) {
  faireNoeud(id);
}

/**
 * LA TOILE DE LA TRACE, ET ELLE N'EST PAS UN SIMPLE BOUCHON.
 *
 * Elle ENREGISTRE ce que le moniteur lui demande de dessiner. Sans cela le
 * banc dirait seulement que dessiner ne leve pas d'exception, ce qui ne vaut
 * rien. Avec, il peut verifier qu'un silence coupe bien le trait, ce qui est
 * la seule regle de dessin qui porte du sens musical.
 */
const toile = faireNoeud("mon-trace");
toile.clientWidth = 600;
toile.clientHeight = 110;
toile.width = 600;
toile.height = 110;
const journalDessin = { deplacements: 0, segments: 0, textes: [], traces: 0, redessins: 0 };
toile.getContext = () => ({
  setTransform() {}, clearRect() { journalDessin.redessins++; }, beginPath() {}, stroke() { journalDessin.traces++; },
  moveTo() { journalDessin.deplacements++; }, lineTo() { journalDessin.segments++; },
  fillText(t) { journalDessin.textes.push(String(t)); },
  set strokeStyle(v) {}, set fillStyle(v) {}, set lineWidth(v) {},
  set lineJoin(v) {}, set lineCap(v) {}, set font(v) {}, set textAlign(v) {},
});

/** Le collecteur de fenetres, capture au moment ou le moniteur le branche.
 *  C'est par lui que le banc pousse ses echantillons. */
let pousser = null;

const document = {
  readyState: "complete",
  getElementById: (id) => noeuds.get(id) ?? null,
  addEventListener() {},
};

const window = {
  isSecureContext: true,
  devicePixelRatio: 1,
  getComputedStyle: () => ({ getPropertyValue: () => "#000000" }),
  addEventListener() {},
  AudioContext: class {
    constructor() { this.sampleRate = 44100; this.state = "running"; }
    async resume() {}
    async close() { this.state = "closed"; }
    createMediaStreamSource() { return { connect() {} }; }
    createGain() { return { gain: {}, connect() {} }; }
    createScriptProcessor() { return { connect() {} }; }
    get audioWorklet() {
      return { addModule: async () => {} };
    }
  },
};

class AudioWorkletNode {
  constructor() {
    this.port = {};
    Object.defineProperty(this.port, "onmessage", {
      set(f) { pousser = (donnees) => f({ data: donnees }); },
    });
  }
}

const navigator = {
  mediaDevices: { getUserMedia: async () => ({ getTracks: () => [] }) },
};

const URL_STUB = { createObjectURL: () => "stub:", revokeObjectURL() {} };
const Blob_STUB = class {};

// ---------------------------------------------------------------------------
// CHARGEMENT DU VRAI CODE, dans le meme assemblage que la page publiee
// ---------------------------------------------------------------------------

const pitch = readFileSync(join(PUBLIC, "noyau", "pitch.js"), "utf-8")
  .replace(/^([ \t]*)export\s+(async\s+)?(const|let|var|function|class)\b/gm, "$1$2$3");
const moniteur = readFileSync(join(PUBLIC, "moniteur.js"), "utf-8");

// `getComputedStyle` est appele sans prefixe dans le module, comme dans un
// navigateur, il faut donc le passer separement.
const monter = new Function(
  "document", "window", "navigator", "AudioWorkletNode", "URL", "Blob", "getComputedStyle",
  pitch + "\n" + moniteur
);
monter(document, window, navigator, AudioWorkletNode, URL_STUB, Blob_STUB, window.getComputedStyle);

// ---------------------------------------------------------------------------
// LE SIGNAL D'ESSAI. Harmoniquement riche, comme une voix, et surtout PAS une
// sinusoide. Mesure du 2026-08-31, YIN lit une sinusoide jusqu'a trente cents
// trop haut dans le grave, un banc bati dessus mesurerait ce biais la.
// ---------------------------------------------------------------------------

function fenetre(hz, taille = 2048, fe = 44100, amplitude = 0.3) {
  const x = new Float32Array(taille);
  for (let i = 0; i < taille; i++) {
    let v = 0;
    for (let h = 1; h <= 6; h++) v += Math.sin(2 * Math.PI * hz * h * i / fe) / h;
    x[i] = amplitude * v;
  }
  return x;
}

const silence = new Float32Array(2048);

/** Pousse assez de fenetres pour remplir la mediane du moniteur. */
function jouer(hz, combien = 6) {
  for (let k = 0; k < combien; k++) pousser(fenetre(hz));
}

// ---------------------------------------------------------------------------
// LES EPREUVES
// ---------------------------------------------------------------------------

console.log("\nMONITEUR, banc du 2026-08-31\n");

await noeuds.get("mon-bouton").ecouteurs.click();
verifier("l'ecran de depart s'efface a l'allumage", noeuds.get("mon-avant").hidden, true);
verifier("l'ecran de lecture apparait", noeuds.get("mon-pendant").hidden, false);
verifier("le collecteur de fenetres est branche", typeof pousser, "function");

// LA440 exactement, le cas ou toute erreur saute aux yeux.
jouer(440);
verifier("440 Hz se nomme A", noeuds.get("mon-note").textContent, "A");
verifier("440 Hz est a l'octave 4", noeuds.get("mon-octave").textContent, 4);
verifier("440 Hz ne derive pas", noeuds.get("mon-ecart").textContent, "dead on");
verifier("l'aiguille est au centre", noeuds.get("mon-aiguille").style.left, "50%");
verifier("la jauge se declare juste", noeuds.get("mon-jauge").dataset.etat, "juste");

// Un demi-ton plus haut, et une octave plus bas, pour couvrir le nommage.
jouer(261.63);
verifier("261,63 Hz se nomme C", noeuds.get("mon-note").textContent, "C");
verifier("261,63 Hz est a l'octave 4", noeuds.get("mon-octave").textContent, 4);

jouer(196.0);
verifier("196 Hz se nomme G", noeuds.get("mon-note").textContent, "G");
verifier("196 Hz est a l'octave 3", noeuds.get("mon-octave").textContent, 3);

// UNE NOTE FRANCHEMENT FAUSSE. Trente cents au dessus du la, c'est la moitie
// de ce que le moniteur doit savoir montrer, et c'est le cas qui vend.
jouer(440 * Math.pow(2, 30 / 1200));
verifier("trente cents trop haut se lit +30", noeuds.get("mon-ecart").textContent, "+30 cents");
verifier("trente cents trop haut classe la jauge loin", noeuds.get("mon-jauge").dataset.etat, "loin");
verifier("l'aiguille suit l'ecart", noeuds.get("mon-aiguille").style.left, "80%");

jouer(440 * Math.pow(2, -18 / 1200));
verifier("dix-huit cents trop bas se lit -18", noeuds.get("mon-ecart").textContent, "-18 cents");
verifier("dix-huit cents trop bas classe la jauge proche", noeuds.get("mon-jauge").dataset.etat, "proche");

// LE CHANGEMENT DE NOMMAGE. Il doit repeindre l'affichage SANS attendre la
// note suivante, sinon le visiteur croit que le reglage ne marche pas.
jouer(440);
noeuds.get("mon-systeme").value = "syllabes";
noeuds.get("mon-systeme").ecouteurs.change({ target: noeuds.get("mon-systeme") });
verifier("le la se nomme La en syllabes", noeuds.get("mon-note").textContent, "La");
noeuds.get("mon-systeme").value = "lettres";
noeuds.get("mon-systeme").ecouteurs.change({ target: noeuds.get("mon-systeme") });

// LE LA DE REFERENCE. A 442, un la joue a 440 doit devenir plat de huit cents.
// C'est l'argument que ma page de vente met en avant, il a interet a marcher.
noeuds.get("mon-la").value = "442";
noeuds.get("mon-la").ecouteurs.change({ target: noeuds.get("mon-la") });
verifier("a 442, un la a 440 devient plat", noeuds.get("mon-ecart").textContent, "-8 cents");
noeuds.get("mon-la").value = "440";
noeuds.get("mon-la").ecouteurs.change({ target: noeuds.get("mon-la") });

// LA TRACE. ON REGARDE CE QU'ELLE CONTIENT, PAS SEULEMENT CE QU'ELLE DESSINE.
//
// LE PIEGE QUI M'A COUTE VINGT MINUTES, et il vaut la note. J'avais compte les
// levers de crayon pour savoir si la courbe etait continue. Elle l'etait, mais
// CHAQUE LIGNE DE PORTEE leve aussi le crayon, et mon compteur additionnait les
// deux. Une note tenue sortait a trois levers et j'ai cru a un defaut du
// produit, alors que la trace contenait seize valeurs identiques et aucun trou.
// La lecon, quand une mesure accuse le code, verifier d'abord qu'elle mesure
// bien ce qu'on croit. Ici la donnee se lit directement par `window.__trace`,
// et une donnee lue vaut mieux qu'une donnee deduite d'un dessin.
console.log("");
async function traceNeuve() {
  await noeuds.get("mon-stop").ecouteurs.click();
  await noeuds.get("mon-bouton").ecouteurs.click();
  journalDessin.deplacements = 0;
  journalDessin.segments = 0;
  journalDessin.textes.length = 0;
}
const sansTrous = (t) => t.filter((p) => p === null).length;
{
  // 1. LA DONNEE. Une note tenue ne doit produire aucun trou.
  await traceNeuve();
  verifier("l'allumage repart d'une trace vide", window.__trace.lire().length, 0);
  jouer(440, 16);
  const tenue = window.__trace.lire();
  verifier("seize trames tenues donnent seize points", tenue.length, 16);
  verifier("une note tenue ne fait aucun trou", sansTrous(tenue), 0);
  verifier("et toutes les valeurs sont la meme note",
    new Set(tenue.map((p) => p.toFixed(2))).size, 1);

  // 2. LA DONNEE, AVEC UNE RESPIRATION. Chaque trame muette doit laisser un
  // trou, sinon la courbe relierait deux notes separees par un silence et
  // dessinerait un glissando qui n'a jamais eu lieu.
  await traceNeuve();
  jouer(440, 6);
  for (let k = 0; k < 4; k++) pousser(silence);
  jouer(440, 6);
  const coupee = window.__trace.lire();
  verifier("quatre trames muettes laissent quatre trous", sansTrous(coupee), 4);
  verifier("les trous sont au milieu, pas au bord",
    coupee.slice(6, 10).every((p) => p === null), true);

  // 3. LE DESSIN, EN COMPARATIF. Le nombre absolu de levers depend du nombre de
  // lignes de portee, l'ECART entre les deux cas n'en depend pas.
  await traceNeuve();
  jouer(440, 12);
  journalDessin.deplacements = 0;
  jouer(440, 1);
  const leversTenue = journalDessin.deplacements;
  verifier("une note tenue trace des segments", journalDessin.segments > 5, true);

  await traceNeuve();
  jouer(440, 6);
  for (let k = 0; k < 4; k++) pousser(silence);
  jouer(440, 6);
  journalDessin.deplacements = 0;
  jouer(440, 1);
  verifier("une respiration ajoute exactement un lever de crayon",
    journalDessin.deplacements, leversTenue + 1);

  // 4. LES LIGNES DE PORTEE portent le nom des notes et suivent le nommage.
  await traceNeuve();
  jouer(440, 8);
  verifier("la trace nomme ses lignes en lettres",
    journalDessin.textes.some((t) => /^A\d$/.test(t)), true);
  journalDessin.textes.length = 0;
  noeuds.get("mon-systeme").value = "syllabes";
  noeuds.get("mon-systeme").ecouteurs.change({ target: noeuds.get("mon-systeme") });
  verifier("le changement de nommage repeint la trace",
    journalDessin.textes.some((t) => /^La\d$/.test(t)), true);
  noeuds.get("mon-systeme").value = "lettres";
  noeuds.get("mon-systeme").ecouteurs.change({ target: noeuds.get("mon-systeme") });

  // 5. L'ARRET VIDE LA TRACE, sinon la seance suivante commencerait avec la
  // voix de la precedente a l'ecran.
  await noeuds.get("mon-stop").ecouteurs.click();
  verifier("l'arret vide la trace", window.__trace.lire().length, 0);
  await noeuds.get("mon-bouton").ecouteurs.click();
}

// LE SILENCE. Il doit effacer, mais pas au premier blanc entre deux syllabes.
jouer(440);
for (let k = 0; k < 7; k++) pousser(silence);
verifier("sept fenetres muettes n'effacent pas encore", noeuds.get("mon-note").textContent, "A");
pousser(silence);
verifier("la huitieme efface la note", noeuds.get("mon-note").textContent, "-");
verifier("le silence rend l'aiguille au centre", noeuds.get("mon-aiguille").style.left, "50%");
verifier("le silence remet la jauge a muet", noeuds.get("mon-jauge").dataset.etat, "muet");

// L'AIGUILLE NE SORT PAS DE SA BOITE. Une note a une quarte de la voisine
// donnerait une position hors de l'ecran si la borne manquait. Elle ne peut
// pas se produire par le nommage, qui ramene toujours a moins de cinquante
// cents, mais elle se produirait au premier reglage de la reference.
noeuds.get("mon-la").value = "415";
noeuds.get("mon-la").ecouteurs.change({ target: noeuds.get("mon-la") });
jouer(440);
const gauche = parseFloat(noeuds.get("mon-aiguille").style.left);
verifier("l'aiguille reste dans sa boite a 415",
  gauche >= 0 && gauche <= 100, true);
noeuds.get("mon-la").value = "440";
noeuds.get("mon-la").ecouteurs.change({ target: noeuds.get("mon-la") });

// L'ARRET. Le voyant du microphone s'eteint ici, et c'est une question de
// confiance autant que de technique.
jouer(440);
await noeuds.get("mon-stop").ecouteurs.click();
verifier("l'arret rend l'ecran de depart", noeuds.get("mon-avant").hidden, false);
verifier("l'arret cache l'ecran de lecture", noeuds.get("mon-pendant").hidden, true);
verifier("l'arret reactive le bouton", noeuds.get("mon-bouton").disabled, false);

console.log(echecs ? `\n${echecs} epreuve(s) ratee(s)\n` : "\ntoutes les epreuves passent\n");
process.exit(echecs ? 1 : 0);
