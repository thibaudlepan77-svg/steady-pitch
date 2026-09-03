/**
 * tessiture-page.mjs - POSE LE TEST D'ETENDUE DANS SA PAGE.
 * Agent N4, 2026-09-03 (cycle 17).
 *
 * Meme principe que `moniteur.mjs`, et pour la meme raison. La page est du
 * texte de vente ecrit a la main, elle doit le rester, donc ce script n'y
 * touche qu'entre deux reperes.
 *
 * CE QU'IL AJOUTE PAR RAPPORT A `moniteur.mjs`. Le moniteur n'inlinait qu'un
 * seul module sans dependance. Le test en demande cinq, dont deux qui
 * s'importent l'un l'autre. Aplatir cinq modules dans une meme portee cree un
 * risque qui n'existait pas, DEUX MODULES QUI DECLARENT LE MEME NOM. En module
 * ES, chacun garde le sien. Aplatis, le second ecrase le premier en silence, et
 * la page tombe chez le visiteur et nulle part ailleurs. Le controle est donc
 * mecanique ici, et il refuse d'ecrire.
 *
 *     node travail/web-steady-pitch/tessiture-page.mjs
 */

import { readFileSync, writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ICI = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ICI, "public");
const NOYAU = join(PUBLIC, "noyau");
const SOURCES = resolve(ICI, "..", "noyau-justesse");
const PAGE = resolve(ICI, "..", "pages-steady-pitch", "vocal-range-test.html");

const DEBUT = "/* TESSITURE:DEBUT */";
const FIN = "/* TESSITURE:FIN */";

/** L'ordre est celui des dependances, il n'est pas alphabetique. */
const MORCEAUX = [
  join(NOYAU, "notation.js"),
  join(NOYAU, "langues.js"),
  join(NOYAU, "pitch.js"),
  join(NOYAU, "tessiture.js"),
  join(PUBLIC, "micro-web.js"),
  join(PUBLIC, "tessiture-ui.js"),
];

let fautes = 0;
const gronder = (m) => { console.log("  " + m); fautes++; };

// ---------------------------------------------------------------------------
// 1. LA FRAICHEUR. Le meme controle que pour le moniteur, et il vient du meme
// deploiement rate du 2026-08-31, ou la page en ligne portait un detecteur que
// tous mes bancs declaraient corrige.
// ---------------------------------------------------------------------------

for (const nom of ["pitch", "notation", "tessiture", "langues"]) {
  const source = join(SOURCES, `${nom}.ts`);
  const produit = join(NOYAU, `${nom}.js`);
  if (statSync(source).mtimeMs > statSync(produit).mtimeMs) {
    gronder(`FAUTE, noyau-justesse/${nom}.ts est plus recent que public/noyau/${nom}.js`);
    gronder("       lancer d'abord  node travail/web-steady-pitch/construire.mjs");
  }
}

// ---------------------------------------------------------------------------
// 2. L'APLATISSEMENT, ET LE CONTROLE DES NOMS
// ---------------------------------------------------------------------------

const DECLARATION = /^(?:export\s+)?(?:async\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm;

const declarePar = new Map();
const morceaux = [];

for (const chemin of MORCEAUX) {
  const brut = readFileSync(chemin, "utf-8");
  const nom = chemin.split(/[\\/]/).pop();

  for (const trouve of brut.matchAll(DECLARATION)) {
    const identifiant = trouve[1];
    if (declarePar.has(identifiant)) {
      gronder(`FAUTE, ${identifiant} est declare par ${declarePar.get(identifiant)} et par ${nom}`);
    } else {
      declarePar.set(identifiant, nom);
    }
  }

  // Les imports disparaissent, tout vit dans la meme portee. Les exports
  // perdent leur mot-cle et gardent leur declaration.
  const aplati = brut
    .replace(/^\s*import\s[^;]*;\s*$/gm, "")
    .replace(/^([ \t]*)export\s+(async\s+)?(const|let|var|function|class)\b/gm, "$1$2$3")
    .replace(/^[ \t]*export\s*\{[^}]*\};?\s*$/gm, "");

  morceaux.push(`/* ${nom} */\n${aplati}`);
}

const code =
  "/* Depose par travail/web-steady-pitch/tessiture-page.mjs. Ne pas editer ici. */\n" +
  "(function () {\n" + morceaux.join("\n") + "\n})();";

if (/^\s*import\s/m.test(code)) gronder("FAUTE, un import survit dans le code injecte");
if (/^\s*export\s/m.test(code)) gronder("FAUTE, un export survit dans le code injecte");
if (/<\/script>/i.test(code)) gronder("FAUTE, le code contient une balise de fermeture de script");
for (const attendu of ["function yinDetect", "function analyserBalayage", "function composerEtendue"]) {
  if (!code.includes(attendu)) gronder(`FAUTE, ${attendu} est absent du code injecte`);
}

// ---------------------------------------------------------------------------
// 3. LES IDENTIFIANTS DU HTML
//
// Le controle le plus utile des deux scripts. Un identifiant mal tape ne leve
// rien au chargement, il leve au premier clic, chez le visiteur, et personne ne
// me le dira jamais.
// ---------------------------------------------------------------------------

const interface_ = readFileSync(join(PUBLIC, "tessiture-ui.js"), "utf-8");
const attendus = [...new Set(
  [...interface_.matchAll(/\belt\("([^"]+)"\)|montrer\("([^"]+)"/g)].map((m) => m[1] || m[2])
)];

const html = readFileSync(PAGE, "utf-8");
const manquants = attendus.filter((id) => !html.includes(`id="${id}"`));
if (manquants.length) gronder(`FAUTE, la page ne porte pas ${manquants.join(", ")}`);

const i = html.indexOf(DEBUT);
const j = html.indexOf(FIN);
if (i < 0 || j < 0 || j < i) gronder("FAUTE, les reperes manquent dans la page");

if (fautes) {
  console.log(`\n${fautes} faute(s), rien n'est ecrit`);
  process.exit(1);
}

const ecrite = html.slice(0, i + DEBUT.length) + "\n" + code + "\n" + html.slice(j);
writeFileSync(PAGE, ecrite, "utf-8");

console.log("LE TEST D'ETENDUE, POSE DANS SA PAGE");
console.log("-".repeat(62));
console.log(`  ${MORCEAUX.length} modules aplatis, ${declarePar.size} noms, aucune collision`);
console.log(`  ${attendus.length} identifiants attendus, tous presents`);
console.log(`  pages-steady-pitch/vocal-range-test.html, ${ecrite.length} octets`);
