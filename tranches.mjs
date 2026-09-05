/**
 * tranches.mjs - CE QUE TOUTE PAGE DE TEST REPREND A `vocal-range-test.html`.
 * Agent N4, 2026-09-04 (cycle 19).
 *
 * POURQUOI CE FICHIER EXISTE. Deux scripts fabriquent maintenant des pages qui
 * portent le meme test, `pages-types-voix.mjs` et `page-tableau.mjs`. Chacun
 * pourrait redecouper le modele dans son coin, et le jour ou un repere bouge il
 * y aurait deux endroits a reparer, dont un qu'on oublierait. Le decoupage vit
 * donc ici et nulle part ailleurs.
 *
 * LE MODELE FAIT AUTORITE. On ne recopie jamais le style, le balisage du test
 * ni le code, on les PREND dans la page qui est en ligne et qui marche.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ICI = dirname(fileURLToPath(import.meta.url));

export const SITE = resolve(ICI, "..", "pages-steady-pitch");
export const RACINE = "https://thibaudlepan77-svg.github.io/steady-pitch/";
export const MIDI_AXE_BAS = 36;
export const MIDI_AXE_HAUT = 84;

const modele = readFileSync(join(SITE, "vocal-range-test.html"), "utf-8");

const plaintes = [];
export const plaintesDuDecoupage = () => plaintes;

function tranche(depuis, jusqu, garderFin) {
  const i = modele.indexOf(depuis);
  const j = modele.indexOf(jusqu, i + depuis.length);
  if (i < 0 || j < 0) {
    plaintes.push(`repere introuvable dans le modele, ${depuis.slice(0, 40)}`);
    return "";
  }
  return modele.slice(i, garderFin ? j + jusqu.length : j);
}

export const STYLE = tranche('<link rel="preconnect" href="https://fonts.googleapis.com">', "</style>", true);
/**
 * Le bloc de mesure de demande est PROPRE a la page maitresse et ne se recopie
 * pas. Deux raisons. Les pages de type de voix n'ont recu aucune visite au
 * releve du 2026-09-05, donc il n'y gagnerait rien. Et il ajoute une soixantaine
 * de mots identiques a chaque page, ce qui a fait tomber quatre d'entre elles
 * sous le seuil de prose propre du controle plus bas. Un garde qui refuse est
 * un garde qui marche, on retire la cause et non le garde.
 */
const DEBUT_DEMANDE = "<!-- DEMANDE:DEBUT -->";
const FIN_DEMANDE = "<!-- DEMANDE:FIN -->";

function sansDemande(html) {
  const i = html.indexOf(DEBUT_DEMANDE);
  if (i < 0) return html;
  const j = html.indexOf(FIN_DEMANDE, i);
  if (j < 0) {
    plaintes.push("bloc DEMANDE ouvert et jamais ferme dans le modele");
    return html;
  }
  return html.slice(0, i) + html.slice(j + FIN_DEMANDE.length);
}

export const TEST = sansDemande(
  tranche('<div class="test">', '<p><a class="lancer" href="./">Open the live pitch monitor', false));
export const CODE = tranche("<script>\n/* TESSITURE:DEBUT */", "/* TESSITURE:FIN */\n</script>", true);
export const ICONE = tranche('<link rel="icon" href="data:image/svg+xml', ">", true);
export const BEACON = tranche("<!-- Cloudflare Web Analytics -->", "<!-- End Cloudflare Web Analytics -->", true);

if (CODE.length < 50000) plaintes.push(`le code injecte fait ${CODE.length} octets, c'est trop peu`);
for (const attendu of ["function analyserBalayage", "function composerEtendue", "function yinDetect"]) {
  if (!CODE.includes(attendu)) plaintes.push(`${attendu} est absent du code repris`);
}

/** Les identifiants que le code cablera, donc ceux que la page doit porter. */
export const ID_DU_TEST = [...new Set([...TEST.matchAll(/id="([^"]+)"/g)].map((m) => m[1]))];

const NOMS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const nommer = (midi) => NOMS[midi % 12] + (Math.floor(midi / 12) - 1);
export const hertz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

/** La meme projection que `positionSurAxe` de tessiture-ui.js, en 0 a 1. */
export function positionSurAxe(midi) {
  const borne = Math.min(MIDI_AXE_HAUT, Math.max(MIDI_AXE_BAS, midi));
  return (borne - MIDI_AXE_BAS) / (MIDI_AXE_HAUT - MIDI_AXE_BAS);
}

/**
 * LES SIX ETENDUES, LUES DANS LE NOYAU ET NON RECOPIEES. Une table de plus
 * serait une table de plus a tenir a jour, et la page annoncerait un jour une
 * etendue que le verdict ne calcule pas.
 */
export function etenduesDeReference() {
  const noyau = readFileSync(resolve(ICI, "..", "noyau-justesse", "tessiture.ts"), "utf-8");
  const voix = [...noyau.matchAll(/etiquette: "([^"]+)", basMidi: (\d+), hautMidi: (\d+)/g)]
    .map(([, etiquette, bas, haut]) => ({ etiquette, basMidi: +bas, hautMidi: +haut }));
  if (voix.length !== 6) plaintes.push(`${voix.length} etendues lues dans tessiture.ts, six attendues`);
  return voix;
}
