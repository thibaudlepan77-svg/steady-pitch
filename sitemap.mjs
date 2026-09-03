/**
 * sitemap.mjs - LE PLAN DU SITE, CONSTRUIT DEPUIS LES FICHIERS QUI EXISTENT.
 * Agent N4, 2026-09-04 (cycle 19).
 *
 * POURQUOI PAS A LA MAIN. Le plan tenu a la main a deja pris du retard deux
 * fois, et un plan qui annonce une page absente ou qui tait une page presente
 * est pire qu'un plan absent. Ici on parcourt le dossier publie, donc il ne
 * peut plus mentir sur ce qui existe.
 *
 * LA DATE VIENT DU FICHIER, pas de l'horloge. Regenerer le plan sans avoir
 * touche a une page ne doit pas faire croire au robot qu'elle a change.
 *
 *     node travail/web-steady-pitch/sitemap.mjs
 */

import { readdirSync, statSync, writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ICI = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(ICI, "..", "pages-steady-pitch");
const RACINE = "https://thibaudlepan77-svg.github.io/steady-pitch/";

/** Les pages de verification de propriete et les fiches sans interet public. */
const EXCLUES = /^google[0-9a-f]+\.html$/;

/** La priorite se lit dans le nom, faute de quoi il faudrait la tenir a jour. */
function priorite(chemin) {
  if (chemin === "") return "1.0";
  if (chemin === "vocal-range-test.html") return "0.9";
  if (chemin === "vocal-range-chart.html") return "0.9";
  if (chemin.endsWith("-vocal-range-test.html")) return "0.8";
  if (chemin === "app.html") return "0.8";
  if (chemin.startsWith("notes/")) return "0.6";
  return "0.5";
}

/**
 * La date en heure LOCALE, et non `toISOString`. Ecrire ce script apres minuit
 * m'a rendu un plan date de la veille, parce que la conversion en UTC recule
 * d'une heure ou deux ici. Un jour d'ecart ne casse rien chez le robot, mais un
 * fichier qui se contredit avec l'horloge de la machine est un fichier auquel
 * on cesse de se fier.
 */
function jour(chemin) {
  const date = statSync(join(SITE, chemin)).mtime;
  const deuxChiffres = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${deuxChiffres(date.getMonth() + 1)}-${deuxChiffres(date.getDate())}`;
}

const pages = [];

for (const nom of readdirSync(SITE)) {
  if (!nom.endsWith(".html") || EXCLUES.test(nom)) continue;
  pages.push({ chemin: nom === "index.html" ? "" : nom, fichier: nom });
}

for (const nom of readdirSync(join(SITE, "notes"))) {
  if (nom.endsWith(".html")) pages.push({ chemin: `notes/${nom}`, fichier: `notes/${nom}` });
}

// Un `noindex` sur une page qu'on declare au plan est une contradiction que le
// robot signale, et je preferais l'apprendre ici que dans Search Console.
for (const page of pages) {
  const html = readFileSync(join(SITE, page.fichier), "utf-8");
  if (/name="robots"[^>]*noindex/i.test(html)) {
    console.log(`  ${page.fichier} porte un noindex, elle est retiree du plan`);
    page.retiree = true;
  }
}

const retenues = pages
  .filter((p) => !p.retiree)
  .sort((a, b) => priorite(b.chemin).localeCompare(priorite(a.chemin)) || a.chemin.localeCompare(b.chemin));

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  retenues
    .map(
      (p) =>
        `  <url>\n` +
        `    <loc>${RACINE}${p.chemin}</loc>\n` +
        `    <lastmod>${jour(p.fichier)}</lastmod>\n` +
        `    <priority>${priorite(p.chemin)}</priority>\n` +
        `  </url>\n`
    )
    .join("") +
  `</urlset>\n`;

writeFileSync(join(SITE, "sitemap.xml"), xml, "utf-8");

console.log("PLAN DU SITE");
console.log("-".repeat(66));
for (const p of retenues) console.log(`  ${priorite(p.chemin)}  ${RACINE}${p.chemin}`);
console.log(`  ${retenues.length} adresses, ${xml.length} octets`);
