/**
 * construire.mjs - LE CONSTRUCTEUR DE LA VERSION NAVIGATEUR.
 * Agent N4, 2026-08-28 (cycle 12).
 *
 * POURQUOI IL N'INSTALLE RIEN.
 * Node 24 sait retirer les annotations de type lui-meme, par
 * `module.stripTypeScriptTypes`. Les navigateurs savent charger des modules
 * ES nativement. Il n'y a donc besoin ni d'un empaqueteur, ni d'un
 * transpileur, ni d'un `npm install`, ni d'un serveur de developpement, que
 * ma constitution m'interdit de laisser tourner de toute facon.
 *
 * CE QU'IL FAIT.
 *   1. lit les modules du noyau, ceux qui portent les 806 verifications,
 *   2. retire les types et rien d'autre, le code executable est INTACT,
 *   3. reecrit les specificateurs d'import de .ts en .js,
 *   4. ecrit le tout dans public/noyau, aux cotes des fichiers du navigateur.
 *
 * LA PROPRIETE QUI COMPTE. Le noyau du site est le MEME FICHIER que le noyau
 * teste, a l'effacement des types pres. Aucune reecriture a la main, donc
 * aucune derive possible entre ce qui est prouve et ce qui est servi.
 *
 *     node travail/web-steady-pitch/construire.mjs
 */

import { stripTypeScriptTypes } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ICI = dirname(fileURLToPath(import.meta.url));
const NOYAU = resolve(ICI, "..", "noyau-justesse");
const SORTIE = join(ICI, "public", "noyau");

/** Les modules embarques. Une liste NOMMEE, jamais un balayage de dossier,
 *  pour ne pas expedier un banc d'essai ou un fichier oublie dans le site. */
const MODULES = [
  "notation.ts",
  "exercices.ts",
  "curriculum-intervalles.ts",
  "curriculum-tenues.ts",
  "seance.ts",
  "ecran.ts",
  "theme.ts",
  "langues.ts",
  "accessibilite.ts",
  "pitch.ts",
  "tessiture.ts",
];

mkdirSync(SORTIE, { recursive: true });

let octets = 0;
const rapport = [];

for (const nom of MODULES) {
  const source = readFileSync(join(NOYAU, nom), "utf-8");
  let js = stripTypeScriptTypes(source, { mode: "strip" });

  // Les specificateurs d'import passent de .ts a .js. Un navigateur ne sait
  // pas resoudre une extension .ts, et il ne DOIT pas la resoudre, sinon il
  // servirait du TypeScript a un moteur JavaScript.
  js = js.replace(/(from\s*["'])(\.[^"']*?)\.ts(["'])/g, "$1$2.js$3");
  js = js.replace(/(import\s*\(\s*["'])(\.[^"']*?)\.ts(["'])/g, "$1$2.js$3");

  const cible = join(SORTIE, nom.replace(/\.ts$/, ".js"));
  writeFileSync(cible, js, "utf-8");
  octets += Buffer.byteLength(js, "utf-8");
  rapport.push([nom, Buffer.byteLength(js, "utf-8")]);
}

// CONTROLE PAR MACHINE. Aucun fichier produit ne doit encore contenir une
// extension .ts dans un import, sinon le navigateur echouerait au chargement,
// et il echouerait SILENCIEUSEMENT dans la console plutot qu'a la
// construction.
let fautes = 0;
for (const f of readdirSync(SORTIE)) {
  if (!f.endsWith(".js")) continue;
  const t = readFileSync(join(SORTIE, f), "utf-8");
  const restes = t.match(/from\s*["']\.[^"']*\.ts["']/g);
  if (restes) {
    console.log(`  FAUTE, ${f} garde ${restes.length} import(s) en .ts`);
    fautes += restes.length;
  }
  // Un type qui aurait survecu ferait tomber le navigateur. On cherche les
  // mots-cles qui n'existent pas en JavaScript.
  for (const motif of [/^\s*interface\s+\w/m, /^\s*type\s+\w+\s*=/m, /^\s*enum\s+\w/m]) {
    if (motif.test(t)) {
      console.log(`  FAUTE, ${f} garde une declaration de type, ${motif}`);
      fautes++;
    }
  }
}

console.log("CONSTRUCTION DE LA VERSION NAVIGATEUR");
console.log("-".repeat(62));
for (const [nom, n] of rapport) {
  console.log(`  ${nom.padEnd(28)} ${String(n).padStart(7)} octets`);
}
console.log("-".repeat(62));
console.log(`  ${MODULES.length} modules, ${octets} octets, vers public/noyau`);
if (fautes > 0) {
  console.log(`  ${fautes} FAUTE(S), la construction n'est pas livrable.`);
  process.exit(1);
}
console.log("  aucun import en .ts, aucune declaration de type survivante.");
console.log("  Le noyau servi est le noyau teste, aux types effaces pres.");
