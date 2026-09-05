/**
 * test-libelles-ecran.mjs - AUCUN LIBELLE DE BOUTON DEUX FOIS SUR UN ECRAN.
 * Agent N4, 2026-09-05 (cycle 21).
 *
 * POURQUOI CE BANC EXISTE, ET IL VIENT D'UN RAPPORT D'UTILISATEUR. Le
 * 2026-09-04, quelqu'un a ecrit `I ended up in a weird state with two next
 * buttons`. J'ai essaye de reproduire en cliquant et j'ai echoue, parce que je
 * cherchais une PANNE. Il n'y en avait pas.
 *
 * LE DEFAUT VIVAIT DANS LA COMPOSITION, PAS DANS UN COMPOSANT. Le noyau rend
 * une liste de boutons, dont un `suivant`, actif des qu'une note se termine. La
 * couche web ajoutait PAR-DESSUS son propre gros bouton, qui bascule le
 * microphone, et le nommait aussi `suivant` quand le micro etait ouvert. Micro
 * ouvert plus note finie, deux boutons marques `Next`, et le plus visible des
 * deux etait celui qui ne faisait pas suivant.
 *
 * AUCUN TEST UNITAIRE NE POUVAIT LE VOIR, ET CE N'EST PAS UNE NEGLIGENCE. Les
 * deux composants sont justes pris separement. `test-ecran.ts` verifie la liste
 * du noyau, elle est correcte. Un test de la couche web verifierait le
 * basculement du micro, il marche. Un defaut de composition n'a pas d'unite ou
 * se loger.
 *
 * CE QUE CE BANC FAIT DONC, ET C'EST LE POINT. Il ne remodelise pas la regle de
 * la couche web, ce qui reviendrait a tester ma propre copie de l'idee. Il LIT
 * `public/app.js` et `app.html` et regarde quelle cle de traduction le gros
 * bouton porte reellement. Si quelqu'un y remet `suivant`, le banc rougit.
 *
 *     node travail/web-steady-pitch/test-libelles-ecran.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { vue as vue2 } from "../noyau-justesse/ecran.ts";
import { TEXTES } from "../noyau-justesse/langues.ts";

const ICI = dirname(fileURLToPath(import.meta.url));
const APP_JS = join(ICI, "public", "app.js");
const APP_HTML = resolve(ICI, "..", "pages-steady-pitch", "app.html");

let echecs = 0;
function verifier(nom, condition, detail = "") {
  if (!condition) {
    echecs++;
    console.log(`  ECHEC  ${nom}${detail ? "\n         " + detail : ""}`);
  }
}

/** La cle que le gros bouton porte quand le micro est ouvert, lue dans le
 *  fichier servi et non recopiee ici. */
function cleDuGrosBouton(chemin) {
  const source = readFileSync(chemin, "utf-8");
  const m = source.match(/texte:\s*app\.ecoute\s*\?\s*t\("([a-z_]+)",\s*app\.langue\)/);
  return m ? m[1] : null;
}

console.log("LES LIBELLES D'UN ECRAN ASSEMBLE");
console.log("=".repeat(70));

// ---------------------------------------------------------------------------
console.log("\n1. LE GROS BOUTON DE LA COUCHE WEB NE REPREND AUCUNE CLE DU NOYAU");

const CLES_DU_NOYAU = ["suivant", "reessayer"];
for (const [nom, chemin] of [["public/app.js", APP_JS], ["app.html", APP_HTML]]) {
  const cle = cleDuGrosBouton(chemin);
  verifier(`${nom} porte une cle lisible sur son gros bouton`, cle !== null,
    "le motif `texte: app.ecoute ? t(\"...\")` est introuvable, le banc ne mesure plus rien");
  if (cle === null) continue;
  verifier(`${nom} n'utilise pas une cle deja rendue par le noyau`,
    !CLES_DU_NOYAU.includes(cle),
    `il porte "${cle}", que le noyau met deja sur un de ses propres boutons`);
}

// LES DEUX COPIES DOIVENT S'ACCORDER. `app.html` porte une copie MANUELLE de
// `public/app.js`, aucun script ne la genere. Une correction appliquee d'un
// seul cote fait diverger la page en ligne et le fichier telecharge.
verifier("les deux copies de la couche web s'accordent sur ce libelle",
  cleDuGrosBouton(APP_JS) === cleDuGrosBouton(APP_HTML),
  `app.js dit "${cleDuGrosBouton(APP_JS)}", app.html dit "${cleDuGrosBouton(APP_HTML)}"`);

// ---------------------------------------------------------------------------
console.log("\n2. AUCUN DOUBLON DE LIBELLE SUR L'ECRAN ASSEMBLE, DANS LES SEPT LANGUES");

/** Les etats qui produisent des boutons differents. `NOTE_FINIE` est celui du
 *  rapport, c'est la que `suivant` devient actif. */
const ETATS = ["ATTENTE", "AIDE", "NOTE_FINIE", "EXERCICE_FINI", "SEANCE_FINIE"];
const LANGUES = Object.keys(TEXTES);

let combinaisons = 0;
for (const langue of LANGUES) {
  const cle = cleDuGrosBouton(APP_JS);
  const libelleGros = cle ? TEXTES[langue][cle] : "";
  for (const etape of ETATS) {
    const etat = {
      etape,
      indexNote: 0,
      notes: [{ note: { midi: 60, hz: 261.63 }, reussie: etape === "NOTE_FINIE", passee: false, horsPortee: false }],
    };
    const dernier = etape === "NOTE_FINIE"
      ? { verdict: "JUSTE", hzMedian: 261.63, ecartCents: 3 }
      : null;
    let vue;
    try {
      vue = vue2(etat, dernier, { langue, systeme: "latin", chante: true, toniqueMidi: 60 });
    } catch (err) {
      verifier(`${langue}/${etape}, l'ecran se compose`, false, String(err.message).slice(0, 90));
      continue;
    }
    combinaisons++;
    const libelles = vue.boutons.map((b) => b.libelle);
    // Le gros bouton n'existe que pendant une seance, pas sur l'ecran de fin,
    // et seulement quand le micro est ouvert.
    const tous = vue.fini ? libelles : [...libelles, libelleGros];
    const vus = new Set();
    const doublons = tous.filter((l) => (vus.has(l) ? true : (vus.add(l), false)));
    verifier(`${langue}/${etape}, aucun libelle en double`, doublons.length === 0,
      `en double, ${JSON.stringify(doublons)} parmi ${JSON.stringify(tous)}`);
  }
}

// ---------------------------------------------------------------------------
console.log("\n3. LA COPIE DE app.js DANS app.html NE DIVERGE PAS");

// `app.html` est un paquet assemble, pose a la main, qui porte une copie de
// chaque module sous un en-tete `/* ===== nom.js ===== */`. Aucun script ne le
// regenere. J'ai deja corrige un libelle des deux cotes ce cycle, et la
// prochaine fois j'en oublierai un, donc le banc regarde.
//
// Les deux textes ne peuvent pas etre identiques, l'assembleur enveloppe chaque
// module dans sa propre portee. On compare donc les LIGNES DE CODE, sans
// l'indentation, les lignes vides ni les commentaires, qui ne changent rien au
// comportement et qui bougent a chaque reformatage.

// Les `import` et les `export` sont la seule chose que l'assembleur REECRIT,
// il les remplace par une destructuration de la portee du module. Les comparer
// ferait rougir le banc en permanence sur une transformation voulue, ce qui le
// rendrait inutile en une journee.
function lignesDeCode(source) {
  return source.split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//") && !l.startsWith("*") && !l.startsWith("/*"))
    .filter((l) => !/^(import|export)\b/.test(l));
}

const html = readFileSync(APP_HTML, "utf-8");
const debutSection = html.indexOf("/* ===== app.js ===== */");
verifier("app.html porte bien une section app.js", debutSection >= 0);

if (debutSection >= 0) {
  const dansHtml = new Set(lignesDeCode(html.slice(debutSection)));
  const manquantes = lignesDeCode(readFileSync(APP_JS, "utf-8"))
    .filter((l) => !dansHtml.has(l));
  verifier("chaque ligne de public/app.js se retrouve dans app.html",
    manquantes.length === 0,
    `${manquantes.length} ligne(s) absentes, la premiere est ` +
    JSON.stringify(manquantes[0] ?? "").slice(0, 100));
}

console.log("\n" + "=".repeat(70));
if (echecs === 0) {
  console.log(`RESULTAT, ${combinaisons} ecrans composes sur ${LANGUES.length} langues, ZERO doublon.`);
  console.log("Le gros bouton de la couche web ne reprend aucun libelle du noyau.");
} else {
  console.log(`RESULTAT, ${echecs} echec(s). NON LIVRABLE.`);
  process.exitCode = 1;
}
console.log("=".repeat(70));
