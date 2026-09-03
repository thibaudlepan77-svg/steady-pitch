/**
 * test-oreille.mjs - LE BANC DE LA NOTATION DU TEST D'APPARIEMENT.
 * Agent N4, 2026-09-04 (cycle 19).
 *
 * POURQUOI CE BANC EXISTE. L'ecran, s'il casse, saute aux yeux. La NOTATION, si
 * elle est fausse, rend un verdict qui a l'air d'un verdict. Quelqu'un de juste
 * s'entendrait dire qu'il chante faux, le croirait, et ne me le dirait jamais.
 * C'est la seule partie de cette page dont une faute serait invisible.
 *
 * COMMENT IL S'Y PREND. Le code de la page est aplati dans une fonction, sans
 * navigateur. On lui donne un `window` et un `document` de facade, on empeche
 * le branchement de l'ecran en declarant le document en cours de chargement, et
 * on recupere la notation par `window.__oreilleNotation`.
 *
 *     node travail/web-steady-pitch/test-oreille.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createContext, runInContext } from "node:vm";

const ICI = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ICI, "public");
const NOYAU = join(PUBLIC, "noyau");

const MORCEAUX = [
  join(NOYAU, "notation.js"),
  join(NOYAU, "langues.js"),
  join(PUBLIC, "oreille-ui.js"),
];

const aplati = MORCEAUX.map((chemin) => readFileSync(chemin, "utf-8")
  .replace(/^\s*import\s[^;]*;\s*$/gm, "")
  .replace(/^([ \t]*)export\s+(async\s+)?(const|let|var|function|class)\b/gm, "$1$2$3")
  .replace(/^[ \t]*export\s*\{[^}]*\};?\s*$/gm, "")).join("\n");

const faux = {
  // `loading` empeche `brancher()` de tourner, donc aucun `elt()` n'est appele.
  document: { readyState: "loading", addEventListener() {} },
};
faux.window = faux;
const bac = createContext(faux);
runInContext(`(function(){${aplati}})();`, bac);

const { noterAppariement, composerBilan, hauteurRetenue, verdictDe } = faux.__oreilleNotation;

let echecs = 0;
const verifier = (nom, obtenu, attendu, tolerance = 0) => {
  const bon = typeof attendu === "number"
    ? Math.abs(obtenu - attendu) <= tolerance
    : obtenu === attendu;
  if (!bon) { console.log(`  ECHEC, ${nom}, obtenu ${obtenu}, attendu ${attendu}`); echecs++; }
};

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// ---------------------------------------------------------------------------
// L'ECART EN CENTS
// ---------------------------------------------------------------------------

verifier("pile sur la cible", noterAppariement(hz(57), hz(57)).ecartCents, 0, 0.01);
verifier("un demi-ton au-dessus", noterAppariement(hz(58), hz(57)).ecartCents, 100, 0.01);
verifier("un demi-ton en dessous", noterAppariement(hz(56), hz(57)).ecartCents, -100, 0.01);
verifier("vingt cents au-dessus", noterAppariement(hz(57) * Math.pow(2, 20 / 1200), hz(57)).ecartCents, 20, 0.01);

// ---------------------------------------------------------------------------
// L'OCTAVE, LE POINT QUI DECIDE SI CE TEST MENT OU NON
//
// Un homme a qui on joue un la 4 chante un la 3. C'est la BONNE note. Un test
// qui compte ca comme une faute d'une octave dit a des gens justes qu'ils sont
// faux, et c'est precisement ce que je reproche au rayon.
// ---------------------------------------------------------------------------

const octaveBas = noterAppariement(hz(45), hz(57));
verifier("une octave en dessous, ecart nul", octaveBas.ecartCents, 0, 0.01);
verifier("une octave en dessous, comptee", octaveBas.octavesDeplacees, 1);

const octaveHaut = noterAppariement(hz(69), hz(57));
verifier("une octave au-dessus, ecart nul", octaveHaut.ecartCents, 0, 0.01);
verifier("une octave au-dessus, comptee", octaveHaut.octavesDeplacees, -1);

const octaveEtDemiTon = noterAppariement(hz(46), hz(57));
verifier("octave basse et un demi-ton haut", octaveEtDemiTon.ecartCents, 100, 0.01);
verifier("octave basse et un demi-ton, repli compte", octaveEtDemiTon.octavesDeplacees, 1);

// ---------------------------------------------------------------------------
// LA HAUTEUR RETENUE
// ---------------------------------------------------------------------------

const trame = (h, c = 0.95) => ({ hz: h, confiance: c });
const msParTrame = 46;
const amorce = Math.ceil(700 / msParTrame);

const glissade = [
  ...Array.from({ length: amorce }, () => trame(hz(57) * 0.94)),
  ...Array.from({ length: 20 }, () => trame(hz(57))),
];
verifier("l'amorce glissee est jetee", hauteurRetenue(glissade, msParTrame), hz(57), 0.5);

const troisTrames = [...Array.from({ length: amorce }, () => trame(0)), trame(hz(57)), trame(hz(57))];
verifier("trop peu de trames sures rend null", hauteurRetenue(troisTrames, msParTrame), null);

const souffle = [...Array.from({ length: amorce + 20 }, () => trame(hz(57), 0.3))];
verifier("du souffle non sur rend null", hauteurRetenue(souffle, msParTrame), null);

// Une trame parasite a l'octave ne doit pas deplacer la mediane.
const avecParasite = [
  ...Array.from({ length: amorce }, () => trame(hz(57))),
  ...Array.from({ length: 15 }, () => trame(hz(57))),
  trame(hz(45)), trame(hz(69)),
];
verifier("une trame parasite ne bouge pas la mediane", hauteurRetenue(avecParasite, msParTrame), hz(57), 0.5);

// ---------------------------------------------------------------------------
// LE VERDICT ET LE BIAIS
// ---------------------------------------------------------------------------

verifier("aucune tentative valide", verdictDe(0, 0), "RIEN");
verifier("dix cents, juste", verdictDe(10, 6), "JUSTE");
verifier("trente cents, ordinaire", verdictDe(30, 6), "ORDINAIRE");
verifier("soixante-dix cents, approximatif", verdictDe(70, 6), "APPROXIMATIF");
verifier("deux cents cents, loin", verdictDe(200, 6), "LOIN");

const toujoursBas = [-32, -28, -35, -30, -27, -33].map((c) => ({
  ecartCents: c, octavesDeplacees: 0,
}));
const bilanBas = composerBilan(toujoursBas);
verifier("biais net detecte", bilanBas.biaisNet, true);
verifier("biais du bon cote", bilanBas.biais < 0, true);
verifier("ecart median sur les valeurs absolues", bilanBas.ecartMedian, 31, 1.5);

const disperse = [-32, 28, -35, 30, -27, 33].map((c) => ({
  ecartCents: c, octavesDeplacees: 0,
}));
verifier("dispersion, pas de biais net", composerBilan(disperse).biaisNet, false);

const avecNull = [{ ecartCents: 10, octavesDeplacees: 0 }, null, null];
const bilanNull = composerBilan(avecNull);
verifier("les tentatives vides sont comptees", bilanNull.tentatives, 3);
verifier("les tentatives vides ne sont pas notees", bilanNull.valides, 1);

const avecReplis = [
  { ecartCents: 5, octavesDeplacees: 1 },
  { ecartCents: -8, octavesDeplacees: 1 },
  { ecartCents: 3, octavesDeplacees: 0 },
];
const bilanReplis = composerBilan(avecReplis);
verifier("les replis sont comptes", bilanReplis.replis, 2);
verifier("un repli reste juste", bilanReplis.verdict, "JUSTE");

console.log("BANC DU TEST D'APPARIEMENT");
console.log("-".repeat(66));
if (echecs) {
  console.log(`  ${echecs} echec(s)`);
  process.exit(1);
}
console.log("  27 verifications, toutes passees");
console.log("  l'octave chantee juste est notee juste, et comptee a part");
