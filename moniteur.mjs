/**
 * moniteur.mjs - POSE LE MONITEUR DANS LA PAGE D'ACCUEIL.
 * Agent N4, 2026-08-31 (cycle 16).
 *
 * La page d'accueil est un fichier ecrit a la main, et elle doit le rester,
 * c'est du texte de vente. Ce script n'y touche donc qu'a un seul endroit,
 * entre deux reperes, et il y depose le detecteur teste plus le moniteur.
 *
 * CE QUE LA MACHINE VERIFIE AVANT DE LIVRER, et chacun de ces controles
 * correspond a une facon dont cette page pourrait casser en silence.
 *   - le detecteur pose est bien celui du produit, pas une copie derivee,
 *   - aucun import ni export ne survit dans le code injecte,
 *   - les noms de notes du moniteur sont ceux du noyau, au caractere pres,
 *   - chaque identifiant que le moniteur va chercher existe dans le HTML.
 *
 * Le dernier est le plus utile. Un identifiant mal tape ne leve rien au
 * chargement, il leve au premier clic, chez le visiteur, et personne ne me le
 * dira jamais.
 *
 *     node travail/web-steady-pitch/moniteur.mjs
 */

import { readFileSync, writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ICI = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ICI, "public");
const PAGE = resolve(ICI, "..", "pages-steady-pitch", "index.html");

/** Le miroir sur surge. Il etait tenu a la main et il avait deja derive de
 *  trois balises. Il est desormais DERIVE de la page canonique, deux
 *  substitutions d'adresse et une balise canonique, rien d'autre. Un miroir
 *  qu'on edite des deux cotes n'est plus un miroir. */
const MIROIR = resolve(ICI, "..", "site-demo", "index.html");
const CANONIQUE = "https://thibaudlepan77-svg.github.io/steady-pitch/";
const ADRESSE_MIROIR = "https://steady-pitch.surge.sh/";

const DEBUT = "/* MONITEUR:DEBUT */";
const FIN = "/* MONITEUR:FIN */";

let fautes = 0;
const gronder = (m) => { console.log("  " + m); fautes++; };

// ---------------------------------------------------------------------------
// 1. LE CODE, ASSEMBLE
// ---------------------------------------------------------------------------

// LE CONTROLE DE FRAICHEUR, ET IL M'A DEJA COUTE UN DEPLOIEMENT.
//
// Ce script lit `public/noyau/pitch.js`, qui n'est pas une source, c'est un
// produit de `construire.mjs`. Le 2026-08-31 j'ai corrige `pitch.ts`, relance
// le banc, qui lit la source et passait au vert, puis publie SANS reconstruire.
// La page en ligne portait donc l'ancien detecteur pendant que tous mes bancs
// disaient que tout allait bien. Rien ne criait, parce que rien ne comparait
// les deux dates. Maintenant si.
const SOURCE_PITCH = resolve(ICI, "..", "noyau-justesse", "pitch.ts");
if (statSync(SOURCE_PITCH).mtimeMs > statSync(join(PUBLIC, "noyau", "pitch.js")).mtimeMs) {
  gronder("FAUTE, noyau-justesse/pitch.ts est plus recent que public/noyau/pitch.js");
  gronder("       lancer d'abord  node travail/web-steady-pitch/construire.mjs");
}

const pitch = readFileSync(join(PUBLIC, "noyau", "pitch.js"), "utf-8");
const moniteur = readFileSync(join(PUBLIC, "moniteur.js"), "utf-8");

const code =
  "/* Depose par travail/web-steady-pitch/moniteur.mjs. Ne pas editer ici. */\n" +
  "(function () {\n" +
  pitch.replace(/^([ \t]*)export\s+(async\s+)?(const|let|var|function|class)\b/gm, "$1$2$3") +
  "\n" +
  moniteur +
  "})();";

if (/^\s*import\s/m.test(code)) gronder("FAUTE, un import survit dans le code injecte");
if (/^\s*export\s/m.test(code)) gronder("FAUTE, un export survit dans le code injecte");
if (!code.includes("function yinDetect")) gronder("FAUTE, yinDetect est absent du code injecte");
if (/<\/script>/i.test(code)) gronder("FAUTE, le code contient une balise de fermeture de script");

// ---------------------------------------------------------------------------
// 2. LES NOMS DE NOTES DOIVENT ETRE CEUX DU NOYAU
//
// La page nomme les notes elle meme, pour ne pas embarquer les six langues du
// produit dans une page de vente. Le risque est donc qu'un jour l'un des deux
// change sans l'autre, et qu'un visiteur voie un nom que le produit ne dira
// pas. Ce controle rend cette derive impossible sans que la construction crie.
// ---------------------------------------------------------------------------

const langues = readFileSync(join(PUBLIC, "noyau", "langues.js"), "utf-8");

function tableauNomme(source, cle) {
  const m = source.match(new RegExp(cle + "\\s*:\\s*\\[([^\\]]*)\\]"));
  if (!m) return null;
  return m[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
}

for (const cle of ["lettres", "syllabes"]) {
  const auNoyau = tableauNomme(langues, cle);
  const auMoniteur = tableauNomme(moniteur, cle);
  if (!auNoyau || !auMoniteur) {
    gronder(`FAUTE, la table de noms ${cle} est introuvable d'un cote ou de l'autre`);
  } else if (auNoyau.join("|") !== auMoniteur.join("|")) {
    gronder(`FAUTE, la table de noms ${cle} a derive entre le noyau et le moniteur`);
    gronder(`  noyau    ${auNoyau.join(" ")}`);
    gronder(`  moniteur ${auMoniteur.join(" ")}`);
  }
}

// ---------------------------------------------------------------------------
// 3. INJECTION, ET LE CONTROLE DES IDENTIFIANTS
// ---------------------------------------------------------------------------

const attendus = [...new Set(
  [...moniteur.matchAll(/getElementById\("([^"]+)"\)|elt\("([^"]+)"\)/g)]
    .map((m) => m[1] || m[2])
)];

const html = readFileSync(PAGE, "utf-8");
const i = html.indexOf(DEBUT);
const j = html.indexOf(FIN);

if (i < 0 || j < 0 || j < i) {
  gronder("FAUTE, les reperes du moniteur manquent dans la page d'accueil");
}

const manquants = attendus.filter((id) => !html.includes(`id="${id}"`));
if (manquants.length) {
  gronder(`FAUTE, la page ne porte pas ${manquants.join(", ")}`);
}

if (fautes) {
  console.log(`\n${fautes} faute(s), rien n'est ecrit`);
  process.exit(1);
}

const canonique = html.slice(0, i + DEBUT.length) + "\n" + code + "\n" + html.slice(j);
writeFileSync(PAGE, canonique, "utf-8");

const miroir = canonique
  .replaceAll(CANONIQUE, ADRESSE_MIROIR)
  .replace("<style>", `<link rel="canonical" href="${CANONIQUE}">\n<style>`);
writeFileSync(MIROIR, miroir, "utf-8");

console.log(`  pages-steady-pitch/index.html, ${canonique.length} octets`);
console.log(`  site-demo/index.html,          ${miroir.length} octets`);
console.log("\nrien a signaler");
