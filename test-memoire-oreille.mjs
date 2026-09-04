/**
 * test-memoire-oreille.mjs - LA COMPARAISON AVEC LA MESURE PRECEDENTE.
 * Agent N4, 2026-09-04 (cycle 20).
 *
 * POURQUOI CE BANC EXISTE A PART. Le banc en navigateur du test d'appariement
 * n'exerce qu'une tentative isolee, il ne va jamais jusqu'au bilan, donc rien
 * ne couvrait la phrase qui compare la seance du jour a la precedente.
 *
 * IL PREND LE CODE DANS LE FICHIER SERVI, il ne le recopie pas. Un banc qui
 * recopie la logique qu'il pretend eprouver ne teste que la copie, et c'est
 * exactement le genre de vert qui ne veut rien dire.
 *
 *     node travail/web-steady-pitch/test-memoire-oreille.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ICI = dirname(fileURLToPath(import.meta.url));
const SOURCE = readFileSync(join(ICI, "public", "oreille-ui.js"), "utf-8");

const DEBUT = "const CLE_MEMOIRE_OREILLE";
const FIN = "function afficherBilan()";
const i = SOURCE.indexOf(DEBUT);
const j = SOURCE.indexOf(FIN);
if (i < 0 || j < 0 || j < i) {
  console.log("  FAUTE, le bloc de memoire est introuvable dans oreille-ui.js");
  process.exit(1);
}

/** Le magasin et les deux fonctions d'interface, remplaces par le strict
 *  minimum. Tout le reste vient du fichier tel qu'il est servi. */
let magasin = null;
let boite = { textContent: "", visible: null };

const bac = {
  window: {
    localStorage: {
      getItem: () => magasin,
      setItem: (_cle, valeur) => { magasin = valeur; },
    },
  },
  elt: () => boite,
  montrer: (_id, visible) => { boite.visible = visible; },
};

const fabrique = new Function(
  "window", "elt", "montrer",
  SOURCE.slice(i, j) + "\nreturn { comparerAvantOreille, CENTS_SIGNIFICATIFS };",
);
const { comparerAvantOreille, CENTS_SIGNIFICATIFS } =
  fabrique(bac.window, bac.elt, bac.montrer);

const JOUR = 86400000;
let fautes = 0;

function epreuve(nom, avant, bilan, attendu) {
  magasin = avant === null ? null : JSON.stringify(avant);
  boite = { textContent: "", visible: null };
  comparerAvantOreille(bilan);
  const obtenu = { visible: boite.visible, texte: boite.textContent };
  const bon = obtenu.visible === attendu.visible
    && (attendu.contient === undefined || obtenu.texte.includes(attendu.contient));
  console.log(`  ${bon ? "ok  " : "FAUTE"} ${nom}`);
  if (!bon) {
    fautes++;
    console.log(`        attendu ${JSON.stringify(attendu)}`);
    console.log(`        obtenu  ${JSON.stringify(obtenu)}`);
  }
  return magasin;
}

console.log("BANC DE LA MEMOIRE DU TEST D'APPARIEMENT");
console.log("-".repeat(66));

const vieux = (cents, jours) => ({ cents, quand: Date.now() - jours * JOUR });
const bilan = (ecartMedian, valides = 6) => ({ ecartMedian, valides });

epreuve("aucune memoire, rien ne s'affiche",
  null, bilan(30), { visible: false });

epreuve("memoire de ce matin, trop recente pour comparer",
  vieux(30, 0), bilan(20), { visible: false });

epreuve("progres net de 20 cents",
  vieux(40, 21), bilan(20), { visible: true, contient: "20 cents closer" });

epreuve("recul net de 15 cents, dit sans dramatiser",
  vieux(20, 21), bilan(35), { visible: true, contient: "15 cents further off" });

epreuve("ecart sous le seuil, declare identique",
  vieux(30, 21), bilan(36), { visible: true, contient: "the same" });

epreuve("ecart juste sous le seuil",
  vieux(30, 21), bilan(30 + CENTS_SIGNIFICATIFS - 1), { visible: true, contient: "the same" });

epreuve("ecart juste au seuil, il compte",
  vieux(30, 21), bilan(30 + CENTS_SIGNIFICATIFS), { visible: true, contient: "cents further off" });

epreuve("memoire corrompue, on n'affiche rien et rien ne leve",
  "n'importe quoi", bilan(30), { visible: false });

epreuve("une seance sans note tenue ne compare pas",
  vieux(30, 21), bilan(0, 0), { visible: false });

// LA SEANCE RATEE NE DOIT PAS EFFACER L'HISTOIRE. C'est la regression qui
// couterait le plus cher, un micro coupe remplacerait un vrai chiffre.
magasin = JSON.stringify(vieux(28, 21));
comparerAvantOreille(bilan(0, 0));
const garde = JSON.parse(magasin);
if (garde.cents === 28) {
  console.log("  ok   une seance sans note tenue n'ecrase pas la memoire");
} else {
  console.log(`  FAUTE, la memoire est passee de 28 a ${garde.cents} sur une seance ratee`);
  fautes++;
}

// L'ECRITURE ARRONDIT. Une mediane de 27,6 rangee telle quelle ressortirait
// dans la phrase affichee a la seance suivante.
magasin = null;
comparerAvantOreille(bilan(27.6, 6));
const arrondi = JSON.parse(magasin);
if (Number.isInteger(arrondi.cents)) {
  console.log(`  ok   la mesure est rangee arrondie, ${arrondi.cents}`);
} else {
  console.log(`  FAUTE, ${arrondi.cents} range sans arrondi`);
  fautes++;
}

console.log("-".repeat(66));
if (fautes) {
  console.log(`${fautes} faute(s).`);
  process.exit(1);
}
console.log("11 verifications, toutes passees.");
console.log("Le seuil, la memoire absente, la memoire trop recente, la memoire");
console.log("corrompue et la seance ratee sont couverts.");
