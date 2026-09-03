/**
 * page-tableau.mjs - LE TABLEAU DES ETENDUES, ET LE MOYEN D Y METTRE LA SIENNE.
 * Agent N4, 2026-09-04 (cycle 19).
 *
 * POURQUOI CETTE PAGE. Le test dessine deja les six etendues de reference avec
 * la votre par-dessus, mais SEULEMENT une fois la mesure faite. Quelqu un qui
 * cherche un tableau des tessitures veut le voir tout de suite, sans micro et
 * sans deux minutes de balayage, et un robot d indexation encore plus.
 *
 * DONC LE TABLEAU EST ECRIT EN DUR DANS LA PAGE, a la construction, avec la
 * meme projection d axe que le graphique du test. La page est utile et lisible
 * sans une ligne de JavaScript. Le test, lui, ajoute la barre `You` par-dessus
 * pour qui veut la sienne.
 *
 * CE QUI LA DISTINGUE DES AUTRES TABLEAUX DU RAYON. Les autres sont des images.
 * Celui-ci se mesure.
 *
 *     node travail/web-steady-pitch/page-tableau.mjs
 */

import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SITE, RACINE, STYLE, TEST, CODE, ICONE, BEACON, ID_DU_TEST,
  MIDI_AXE_BAS, MIDI_AXE_HAUT, nommer, hertz, positionSurAxe,
  etenduesDeReference, plaintesDuDecoupage,
} from "./tranches.mjs";

const FICHIER = "vocal-range-chart.html";
const URL = RACINE + FICHIER;

let fautes = 0;
const gronder = (m) => { console.log("  " + m); fautes++; };
for (const plainte of plaintesDuDecoupage()) gronder(`FAUTE, ${plainte}`);

const VOIX = etenduesDeReference();

/** Les pages de type, pour le maillage. Le nom du fichier suit l'etiquette. */
const fichierDuType = (etiquette) =>
  `./${etiquette.toLowerCase().replace(/\s+/g, "-")}-vocal-range-test.html`;

// ---------------------------------------------------------------------------
// 1. LE TABLEAU, EN HTML STATIQUE
//
// Memes classes que le graphique du test, donc meme allure et une seule feuille
// de style a tenir. La barre `You` n'est PAS dessinee ici, c'est le test qui
// l'ajoute, et la legende le dit pour ne pas promettre ce qui n'est pas la.
// ---------------------------------------------------------------------------

const pourcent = (midi) => (positionSurAxe(midi) * 100).toFixed(2);

const barres = VOIX.map((voix) => {
  const gauche = pourcent(voix.basMidi);
  const largeur = (positionSurAxe(voix.hautMidi) - positionSurAxe(voix.basMidi)) * 100;
  return `      <div class="tess-rang">
        <span class="tess-nom">${voix.etiquette}</span>
        <span class="tess-piste"><span class="tess-barre tess-barre-ref"
          style="left:${gauche}%;width:${largeur.toFixed(2)}%"></span></span>
      </div>`;
}).join("\n");

const graduations = [];
for (let midi = MIDI_AXE_BAS; midi <= MIDI_AXE_HAUT; midi += 12) graduations.push(nommer(midi));

const lignesTable = VOIX.map((voix) => {
  const octaves = (voix.hautMidi - voix.basMidi) / 12;
  return `    <tr>
      <td><a href="${fichierDuType(voix.etiquette)}">${voix.etiquette}</a></td>
      <td>${nommer(voix.basMidi)} to ${nommer(voix.hautMidi)}</td>
      <td>${hertz(voix.basMidi).toFixed(1)} to ${hertz(voix.hautMidi).toFixed(1)} Hz</td>
      <td>${octaves.toFixed(0)} octaves</td>
    </tr>`;
}).join("\n");

const TITRE = "Vocal range chart, and a test that puts your own range on it";
const DESCRIPTION =
  "The six voice types drawn on one pitch axis, bass to soprano, with note names and frequencies. Then sing two notes and the chart adds your own range next to them. Runs in the browser, nothing uploaded.";

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${TITRE}</title>
<meta name="description" content="${DESCRIPTION}">
<link rel="canonical" href="${URL}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Steady Pitch">
<meta property="og:title" content="${TITRE}">
<meta property="og:description" content="${DESCRIPTION}">
<meta property="og:url" content="${URL}">
<meta property="og:image" content="${RACINE}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The six voice type ranges drawn on a single pitch axis.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${TITRE}">
<meta name="twitter:description" content="${DESCRIPTION}">
<meta name="twitter:image" content="${RACINE}og.png">
${ICONE}
${STYLE}
<style>
  /* Le tableau statique reprend les classes du graphique du test, il n'a besoin
     que de son cadre et d'un peu d'air sous l'axe. */
  .test-tableau{border:1px solid var(--trait);background:var(--carte);
    border-radius:.5rem;padding:1rem .9rem .7rem;margin:1.2rem 0 .4rem}
  .test-tableau .axe{margin-top:.5rem;padding-left:7rem}
  table{border-collapse:collapse;width:100%;margin:1.4rem 0;font-size:.92rem}
  th,td{text-align:left;padding:.42rem .6rem;border-bottom:1px solid var(--trait)}
  th{font-family:"IBM Plex Mono",monospace;font-size:.72rem;font-weight:600;
    text-transform:uppercase;letter-spacing:.04em;color:var(--doux)}
  td:nth-child(2),td:nth-child(3),td:nth-child(4){
    font-family:"IBM Plex Mono",monospace;font-size:.84rem}
</style>
</head>
<body>
<main>

  <h1>Vocal range chart, with room for your own range.</h1>
  <p class="sous">The six voice types on one pitch axis, from a low bass E2 to a
  soprano C6. Every chart of this kind is a picture. This one has a microphone
  underneath it, so you can put your own range beside the six instead of holding
  a phone up to the screen and guessing.</p>

  <div class="test-tableau">
${barres}
    <div class="axe">${graduations.map((n) => `<span>${n}</span>`).join("")}</div>
  </div>
  <p class="apres">Reference ranges only. Run the test below and your own range
  is drawn on the same axis, directly above them.</p>

  <table>
    <thead>
      <tr><th>Voice type</th><th>Range</th><th>In hertz</th><th>Width</th></tr>
    </thead>
    <tbody>
${lignesTable}
    </tbody>
  </table>

${TEST}
  <h2>Why the bars overlap so much</h2>
  <p>The first thing people notice about this chart is that the six ranges are
  not six separate boxes. Neighbouring types share most of their span, and even
  a bass and a tenor share an octave. That is not sloppiness in the
  classification, it is the point of it.</p>
  <p>These spans describe the notes a composer will write for a part, so that a
  choir assembled from ordinary people can sing it. They were never meant to
  partition singers into six bins. If your measured range covers parts of three
  of them, you have not failed the test, you have got the normal result.</p>

  <h2>Range is not tessitura, and the chart only shows range</h2>
  <p>Your range is every note you can produce. Your tessitura is the part of it
  where you can stay for a long time without paying for it. The chart above
  shows the first, and almost every decision about what you should sing depends
  on the second.</p>
  <p>This is why two people with an identical bar on this chart can belong to
  different voice types, and why reaching an impressive extreme proves much less
  than it feels like it should. A note you can hit once is on your chart. A note
  you can sing a phrase on is in your voice.</p>

  <h2>Where these numbers come from, and how firm they are</h2>
  <p>The six spans are the ones that turn up unchanged from one textbook to the
  next, each a full two octaves. They are conventions rather than measurements,
  and other sources will place a boundary a tone or two either way. Nothing on
  this page depends on the exact edge, because the overlap is wide enough that a
  tone makes no difference to the reading.</p>
  <p>The pitch measurement is a different matter, and there the number is meant
  to be exact. The detector is the same one behind the
  <a href="./">live monitor</a> and the <a href="./app.html">trainer</a>. It
  used to read every note sharp, by 2.6 cents at a concert A and by nearly 30 at
  the bottom of a bass range, and that failure is written up with the before and
  after measurements in
  <a href="./notes/pitch-detector-reads-sharp.html">my pitch detector read every
  note sharp</a>. Its honest floor is 65.41 hertz, and when a sweep goes below
  it the page says so rather than printing a number it cannot defend.</p>

  <h2>A page for each type</h2>
  <p>If you are checking yourself against one type in particular, each has its
  own page with the same test and what separates it from the type it gets
  confused with.
  ${VOIX.map((v) => `<a href="${fichierDuType(v.etiquette)}">${v.etiquette}</a>`).join(", ")}.
  The <a href="./vocal-range-test.html">general range test</a> measures you
  first and names the closest of the six afterwards.</p>

  <footer>
    Steady Pitch, by Thibaud Lepan.
    Questions and bug reports, thibaudlepanpro@gmail.com.
    <a href="./">Home</a>.
    <a href="./vocal-range-test.html">The range test</a>.
    <a href="https://payhip.com/SteadyPitch">The store</a>.
  </footer>

</main>
${CODE}
${BEACON}
</body>
</html>
`;

// ---------------------------------------------------------------------------
// 2. LES CONTROLES
// ---------------------------------------------------------------------------

const manquants = ID_DU_TEST.filter((id) => !page.includes(`id="${id}"`));
if (manquants.length) gronder(`FAUTE, la page ne porte pas ${manquants.join(", ")}`);
if (!page.includes("/* TESSITURE:DEBUT */")) gronder("FAUTE, la page n'a pas recu le code");

// Le tableau doit etre LISIBLE SANS JAVASCRIPT, c'est toute sa raison d'etre.
// On le verifie sur la partie de la page qui precede le script.
const avantScript = page.slice(0, page.indexOf("<script>"));
for (const voix of VOIX) {
  if (!avantScript.includes(`>${voix.etiquette}</span>`)) {
    gronder(`FAUTE, ${voix.etiquette} n'a pas de barre statique`);
  }
  if (!avantScript.includes(`${nommer(voix.basMidi)} to ${nommer(voix.hautMidi)}`)) {
    gronder(`FAUTE, ${voix.etiquette} n'a pas sa ligne dans la table`);
  }
}

// Une barre qui deborde de sa piste passerait inapercue a la relecture et
// sauterait aux yeux du visiteur.
for (const voix of VOIX) {
  const fin = positionSurAxe(voix.basMidi) + (positionSurAxe(voix.hautMidi) - positionSurAxe(voix.basMidi));
  if (fin > 1.0001 || positionSurAxe(voix.basMidi) < 0) {
    gronder(`FAUTE, la barre de ${voix.etiquette} sort de l'axe`);
  }
}

if (fautes) {
  console.log(`\n${fautes} faute(s), rien n'est ecrit`);
  process.exit(1);
}

writeFileSync(join(SITE, FICHIER), page, "utf-8");

console.log("LE TABLEAU DES ETENDUES");
console.log("-".repeat(66));
for (const voix of VOIX) {
  console.log(`  ${voix.etiquette.padEnd(15)} ${nommer(voix.basMidi).padStart(3)} a ${nommer(voix.hautMidi).padEnd(3)}  ${pourcent(voix.basMidi).padStart(6)}% a ${pourcent(voix.hautMidi).padStart(6)}% de l'axe`);
}
console.log(`  ${FICHIER}, ${page.length} octets, lisible sans JavaScript`);
