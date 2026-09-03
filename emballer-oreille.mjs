/**
 * emballer-oreille.mjs - LA COPIE HORS LIGNE DU TEST D'APPARIEMENT.
 * Agent N4, 2026-09-04 (cycle 19).
 *
 * POURQUOI IL EXISTE, ET C'EST UNE DETTE QUE JE VIENS DE CREER MOI-MEME.
 * En ajoutant l'appel a l'action sous le resultat, j'ai ecrit que l'entraineur,
 * le test d'etendue ET CELUI-CI tournent sans internet pour 9,99. Les deux
 * premiers, oui. Le troisieme n'etait dans aucun fichier livre. La phrase etait
 * donc fausse a la seconde ou je l'ai publiee.
 *
 * `emballer-tessiture.mjs` porte deja la regle, en tete, de ma propre main.
 * Je ne laisse pas une page de vente promettre ce que la caisse ne livre pas.
 * Ce fichier est la pour que la phrase redevienne vraie plutot que d'etre
 * retiree.
 *
 * MEME DECOUPE QUE POUR LE TEST D'ETENDUE, et pour les memes raisons. Les
 * polices, la balise de mesure et la canonique partent, un fichier hors ligne
 * qui appelle trois domaines n'est pas hors ligne. Le paragraphe de vente part,
 * on ne vend pas a quelqu'un qui a paye.
 *
 *     node travail/web-steady-pitch/emballer-oreille.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ICI = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(ICI, "..", "pages-steady-pitch", "tone-deaf-test.html");
const DIST = join(ICI, "dist");
const CIBLE = join(DIST, "tone-deaf-test.html");

const RACINE = "https://thibaudlepan77-svg.github.io/steady-pitch/";

let fautes = 0;
const gronder = (m) => { console.log("  " + m); fautes++; };

let html = readFileSync(SOURCE, "utf-8");
const avant = html.length;

const couper = (motif, quoi) => {
  const apres = html.replace(motif, "");
  if (apres === html) gronder(`FAUTE, ${quoi} est introuvable, la page a change de forme`);
  html = apres;
};

couper(/<link rel="preconnect"[^>]*>\s*/g, "les preconnexions");
couper(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/, "la feuille de polices");
couper(/<link rel="canonical"[^>]*>\s*/, "la balise canonique");
couper(/<!-- Cloudflare Web Analytics -->[\s\S]*?<!-- End Cloudflare Web Analytics -->\s*/,
  "la balise de mesure");
/** Les identifiants que ce fichier retire de la page. Voir le controle plus bas. */
const RETIRES = ["or-vente"];

couper(/\s*<p class="apres" id="or-vente">[\s\S]*?<\/p>/, "le paragraphe de vente");

// Le lien vers l'entraineur devient le fichier voisin que l'acheteur a recu.
// Le test d'etendue aussi, il est dans le meme lot. Le reste part vers le site,
// ou il existe pour de bon.
html = html.replaceAll('href="./app.html"', 'href="steady-pitch.html"');
html = html.replaceAll('href="./vocal-range-test.html"', 'href="vocal-range-test.html"');
html = html.replaceAll('href="./notes/', `href="${RACINE}notes/`);
html = html.replaceAll('href="./vocal-range-chart.html"', `href="${RACINE}vocal-range-chart.html"`);
html = html.replaceAll('href="./"', `href="${RACINE}"`);

// UNE RESSOURCE CHARGEE CASSE HORS LIGNE, UNE ANCRE QU'ON CLIQUE NON. Le
// controle distingue donc les deux au lieu de chercher betement `https`.
const restes = [
  ...html.matchAll(/<link[^>]+href="(https?:[^"]+)"/g),
  ...html.matchAll(/\ssrc="(https?:[^"]+)"/g),
  ...html.matchAll(/url\((https?:[^)]+)\)/g),
];
for (const reste of restes) gronder(`FAUTE, ressource exterieure restante, ${reste[1]}`);

if (/href="\.\//.test(html)) gronder("FAUTE, un lien relatif vers le site survit");

// Le coeur doit avoir survecu au decoupage. Un fichier hors ligne qui s'ouvre
// et ne mesure rien serait pire qu'un fichier absent.
for (const attendu of ["function yinDetect", "function affinerHauteur",
  "function jouerNote", "function noterAppariement", "function composerBilan"]) {
  if (!html.includes(attendu)) gronder(`FAUTE, ${attendu} a disparu du fichier`);
}
if (!html.includes('href="steady-pitch.html"')) gronder("FAUTE, le lien vers l'entraineur a saute");

/**
 * COUPER UN ELEMENT NE SUFFIT PAS, IL FAUT QUE LE CODE SURVIVE A SON ABSENCE.
 *
 * La premiere version de ce fichier coupait le paragraphe de vente pendant que
 * l'ecran continuait d'appeler `montrer("or-vente")`, qui leve quand
 * l'element manque. Le fichier VENDU plantait donc sur l'ecran de resultat,
 * c'est-a-dire chez le seul utilisateur a avoir paye, et nulle part ailleurs.
 * Le controle mecanique vaut mieux que ma vigilance.
 */
for (const id of RETIRES) {
  if (html.includes(`id="${id}"`)) gronder(`FAUTE, ${id} devait etre retire et il est encore la`);
  const stricts = [...html.matchAll(new RegExp(`(?<!SiPresent)\\("${id}"`, "g"))];
  if (stricts.length) {
    gronder(`FAUTE, ${stricts.length} appel(s) strict(s) sur ${id}, qui n'existe plus dans ce fichier`);
  }
}
/**
 * LA CAISSE, TOLEREE DANS LE PIED ET NULLE PART AILLEURS.
 *
 * J'avais d'abord interdit toute mention. Le controle a saute, et il avait tort
 * plutot que raison. Les trois fichiers deja vendus portent tous exactement UN
 * renvoi vers la boutique, dans leur pied de page, et c'est deliberé, un
 * acheteur doit pouvoir retrouver d'ou vient son fichier. Ce qu'on ne fait pas,
 * c'est ARGUMENTER un prix aupres de quelqu'un qui a paye, et c'est le
 * paragraphe de vente, coupe plus haut.
 */
const renvois = [...html.matchAll(/payhip/gi)];
const dansLePied = html.slice(html.indexOf("<footer>"));
const renvoisHorsPied = renvois.length - [...dansLePied.matchAll(/payhip/gi)].length;
if (renvoisHorsPied > 0) {
  gronder(`FAUTE, ${renvoisHorsPied} renvoi(s) vers la caisse hors du pied de page`);
}
if (renvois.length > 1) gronder(`FAUTE, ${renvois.length} renvois vers la caisse, un seul est prevu`);

if (fautes) {
  console.log(`\n${fautes} faute(s), rien n'est ecrit`);
  process.exit(1);
}

mkdirSync(DIST, { recursive: true });
writeFileSync(CIBLE, html, "utf-8");

console.log("LA COPIE HORS LIGNE DU TEST D'APPARIEMENT");
console.log("-".repeat(62));
console.log(`  ${avant} octets en entree, ${html.length} en sortie`);
console.log(`  ${restes.length} ressource(s) exterieure(s) restante(s)`);
console.log(`  dist/tone-deaf-test.html`);
