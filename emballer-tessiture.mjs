/**
 * emballer-tessiture.mjs - LA COPIE HORS LIGNE DU TEST D'ETENDUE.
 * Agent N4, 2026-09-03 (cycle 17).
 *
 * POURQUOI ELLE EXISTE, ET LA RAISON EST COMMERCIALE AVANT D'ETRE TECHNIQUE.
 * La page de resultat propose desormais l'ensemble en un fichier qui tourne
 * sans internet. Tant que ce fichier ne contient pas le test d'etendue, cette
 * phrase est fausse. Je ne laisse pas une page de vente promettre ce que la
 * caisse ne livre pas, meme pendant une journee.
 *
 * CE QUI SEPARE LA PAGE PUBLIQUE DE LA COPIE VENDUE, et rien d'autre.
 *   - les polices Google, la balise de mesure et la balise canonique partent,
 *     un fichier hors ligne qui appelle trois domaines n'est pas hors ligne,
 *   - les liens internes deviennent absolus, sauf celui de l'entraineur qui
 *     pointe vers le fichier voisin que l'acheteur a recu,
 *   - le paragraphe de vente part, on ne vend pas a quelqu'un qui a paye.
 *
 * LE CONTROLE QUI COMPTE. Aucune ressource CHARGEE ne doit rester exterieure.
 * Un lien qu'on clique est une invitation, une ressource qu'on charge est une
 * dependance, et seule la seconde casse hors ligne. Le controle distingue donc
 * `href` de balise `link`, `src` et `url(...)` d'un cote, des ancres de
 * l'autre, au lieu de chercher betement `https` partout.
 *
 *     node travail/web-steady-pitch/emballer-tessiture.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ICI = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(ICI, "..", "pages-steady-pitch", "vocal-range-test.html");
const DIST = join(ICI, "dist");
const CIBLE = join(DIST, "vocal-range-test.html");

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
couper(/\s*<p class="apres" id="tess-vente">[\s\S]*?<\/p>/, "le paragraphe de vente");

// LES DEUX BLOCS DE MESURE DE DEMANDE SORTENT DU FICHIER HORS LIGNE.
// Ils demandent au lecteur laquelle de trois choses inexistantes il voudrait, ce
// qui a un sens sur une page publique et aucun dans un fichier qu'on a
// telecharge et qu'on ouvre sans reseau. Leurs liens sont absolus, donc ils
// marcheraient, mais offrir trois choses qui n'existent pas a quelqu'un qui
// vient de recevoir son fichier est du bruit dans un produit livre.
couper(/\s*<!-- DEMANDE:DEBUT -->[\s\S]*?<!-- DEMANDE:FIN -->/, "le bloc de demande du resultat");
couper(/\s*<!-- DEMANDE-VISIBLE:DEBUT -->[\s\S]*?<!-- DEMANDE-VISIBLE:FIN -->/, "le bloc de demande visible");

// Les liens internes. `./app.html` devient le fichier voisin, les autres
// partent vers le site, ou ils existent pour de bon.
// Les fichiers VOISINS, ceux que l'acheteur a recus dans le meme lot. Ils
// doivent rester relatifs, sinon un fichier hors ligne renverrait au site pour
// ouvrir un fichier pose a cote de lui.
html = html.replaceAll('href="./app.html"', 'href="steady-pitch.html"');
html = html.replaceAll('href="./tone-deaf-test.html"', 'href="tone-deaf-test.html"');
html = html.replaceAll('href="./notes/', `href="${RACINE}notes/`);
html = html.replaceAll('href="./"', `href="${RACINE}"`);

/**
 * LE RESTE PART VERS LE SITE, ET CETTE REGLE EST GENERALE A DESSEIN.
 *
 * Les trois lignes ci-dessus nommaient chaque lien un par un. Le jour ou j'ai
 * ajoute six pages de type de voix et un tableau a la page publique, ce fichier
 * a refuse d'ecrire, parce que sept liens relatifs ne correspondaient a aucune
 * regle. Il a eu raison de refuser, mais une liste a tenir a jour est une liste
 * qu'on oublie. Tout ce qui reste en `./quelque-chose` est une page du site, et
 * s'y en va.
 */
html = html.replace(/href="\.\/([\w-]+\.html)"/g, `href="${RACINE}$1"`);

const restes = [
  ...html.matchAll(/<link[^>]+href="(https?:[^"]+)"/g),
  ...html.matchAll(/\ssrc="(https?:[^"]+)"/g),
  ...html.matchAll(/url\((https?:[^)]+)\)/g),
];
for (const reste of restes) gronder(`FAUTE, ressource exterieure restante, ${reste[1]}`);

if (/href="\.\//.test(html)) gronder("FAUTE, un lien relatif vers le site survit");
if (!html.includes("function analyserBalayage")) gronder("FAUTE, l'analyse a disparu du fichier");
if (!html.includes('href="steady-pitch.html"')) gronder("FAUTE, le lien vers l'entraineur a saute");

if (fautes) {
  console.log(`\n${fautes} faute(s), rien n'est ecrit`);
  process.exit(1);
}

mkdirSync(DIST, { recursive: true });
writeFileSync(CIBLE, html, "utf-8");

console.log("LA COPIE HORS LIGNE DU TEST D'ETENDUE");
console.log("-".repeat(62));
console.log(`  ${avant} octets en entree, ${html.length} en sortie`);
console.log(`  ${restes.length} ressource(s) exterieure(s) restante(s)`);
console.log(`  dist/vocal-range-test.html`);
