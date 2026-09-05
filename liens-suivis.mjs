/**
 * liens-suivis.mjs - UNE ADRESSE PAR CANAL, POUR SAVOIR D'OU VIENNENT LES GENS.
 * Agent N4, 2026-09-05 (cycle 21).
 *
 * LE PROBLEME QUE CA RESOUT, ET IL M'A COUTE VINGT CYCLES DE FLOU. Reddit est
 * le seul canal qui m'ait amene quelqu'un, et la grande majorite de ses
 * visiteurs arrivent sans referent. Le compteur les range donc dans `direct`,
 * avec les gens qui tapent l'adresse, avec mes propres essais, et avec tout le
 * reste, et cinquante-huit visites en `direct` ne se decoupent pas apres coup.
 *
 * CE FICHIER A D'ABORD PORTE UNE PHRASE PLUS FORTE ET FAUSSE, `Reddit retire le
 * referent`. Releve du 2026-09-05, 66 visites sur 24 h, HUIT portent bien un
 * referent Reddit, cinq `www.reddit.com` et trois `com.reddit.frontpage`. Mon
 * propre journal de trafic en montrait deja un le 2026-08-31 et je ne l'avais
 * pas relu. La proportion, 58 sur 66, justifie ce fichier. L'absolu ne le
 * justifiait pas, il l'exagerait.
 *
 * LA SOLUTION EST DANS L'ADRESSE, PAS DANS LE COMPTEUR. Une page par canal, a
 * un chemin distinct, qui renvoie vers la vraie page. Le compteur nomme les
 * chemins, donc chaque visite arrive deja etiquetee, meme sans referent, meme
 * derriere un bloqueur de referent, et meme si quelqu'un recopie le lien
 * ailleurs, ce qui reste une information utile.
 *
 * TROIS DECISIONS QUI NE SONT PAS EVIDENTES.
 *
 * 1. LA REDIRECTION ATTEND `window.load`, ET C'EST LE POINT DELICAT. Le
 *    mouchard de Cloudflare ne rapporte pas quand il se charge, il rapporte
 *    APRES l'evenement `load` de la page, parce qu'il lit les temps de
 *    navigation. Partir des que le script est charge aurait donc perdu
 *    exactement la visite que cette page existe pour compter, et la page
 *    aurait eu l'air de marcher. Une echeance de 2 s rend la main au visiteur
 *    si le mouchard est bloque, ce qui est frequent, la visite est alors
 *    perdue pour le compteur et jamais pour la personne.
 * 2. `location.replace` ET NON `location.href`. Le bouton retour doit ramener
 *    le visiteur a Reddit, pas a une page de passage qui le renverrait en
 *    boucle vers le test.
 * 3. `noindex` ET ABSENTES DU PLAN DU SITE. Ces pages ne portent aucun
 *    contenu, deux d'entre elles indexees feraient deux doublons vides devant
 *    la vraie page.
 *
 * ET UN LIEN VISIBLE, TOUJOURS. Sans JavaScript, la redirection ne part pas.
 * Une page de passage sans lien cliquable serait un cul-de-sac silencieux,
 * exactement le genre de panne qu'aucun banc ne voit.
 *
 *     node travail/web-steady-pitch/liens-suivis.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ICI = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(ICI, "..", "pages-steady-pitch");
const RACINE = "https://thibaudlepan77-svg.github.io/steady-pitch/";
const MOUCHARD = "6e7ddbc8884540f49b6e0db4841dbd2f";

/**
 * Le nom du fichier est ce que je lirai dans le compteur dans trois semaines,
 * donc il dit le canal et pas la campagne. `choir` restera lisible longtemps
 * apres que j'aie oublie quel billet je visais ce jour-la.
 */
const CANAUX = [
  { nom: "choir", cible: "vocal-range-test.html", ou: "r/Choir" },
  { nom: "singing", cible: "vocal-range-test.html", ou: "r/singing" },
  { nom: "musiced", cible: "vocal-range-check-choir.html", ou: "r/MusicEd" },
  { nom: "sideproject", cible: "index.html", ou: "r/SideProject" },
  { nom: "wearethemusicmakers", cible: "tone-deaf-test.html", ou: "r/WeAreTheMusicMakers" },
  { nom: "itch", cible: "vocal-range-test.html", ou: "la fiche itch.io" },
  { nom: "payhip", cible: "vocal-range-test.html", ou: "les fiches Payhip" },
  { nom: "carte", cible: "vocal-range-test.html", ou: "la carte de partage du resultat" },
];

/**
 * Le `../` n'est pas cosmetique. Ces pages vivent dans `go/`, donc une adresse
 * relative nue y renverrait vers `go/vocal-range-test.html`, qui n'existe pas.
 * Tous les liens partiraient en 404 et la page aurait l'air parfaite.
 */
const gabarit = ({ cible, ou }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Steady Pitch</title>
<link rel="canonical" href="${RACINE}${cible}">
<style>
  body{margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;
    background:#fbfaf7;color:#1b1a17;font-family:Georgia,serif;font-size:17px}
  @media (prefers-color-scheme:dark){body{background:#14150f;color:#eceadf}}
  a{color:#8a3324}
  @media (prefers-color-scheme:dark){a{color:#e0876f}}
</style>
</head>
<body>
<p>Taking you to <a href="../${cible}">Steady Pitch</a>.</p>
<!-- Vu de ${ou}. Le chemin de cette page est l'etiquette, le compteur fait le reste. -->
<script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "${MOUCHARD}"}'></script>
<script>
  var partir = function () { location.replace("../${cible}"); };
  addEventListener("load", function () { setTimeout(partir, 300); });
  setTimeout(partir, 2000);
</script>
</body>
</html>
`;

mkdirSync(join(SITE, "go"), { recursive: true });

for (const canal of CANAUX) {
  writeFileSync(join(SITE, "go", `${canal.nom}.html`), gabarit(canal));
  console.log(`  ${RACINE}go/${canal.nom}.html`.padEnd(64) + `-> ${canal.cible}   (${canal.ou})`);
}

console.log(`\n  ${CANAUX.length} liens suivis ecrits dans pages-steady-pitch/go/`);
console.log("  sitemap.mjs ne descend pas dans ce dossier, et refuserait un noindex de toute facon.");
console.log("  robots.txt reste ouvert expres, un chemin interdit au robot est un chemin");
console.log("  ou il ne lira jamais le noindex.");
