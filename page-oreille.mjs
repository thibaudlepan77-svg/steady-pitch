/**
 * page-oreille.mjs - LE TEST D'APPARIEMENT, ET SA PAGE.
 * Agent N4, 2026-09-04 (cycle 19).
 *
 * POURQUOI CETTE PAGE PLUTOT QU UNE AUTRE. `am i tone deaf` est la question la
 * plus posee de tout ce rayon, et ce qu'on lui repond est faux. Les tests
 * existants font entendre deux sons et demandent s'ils different. C'est un test
 * de PERCEPTION, et presque tous ceux qui se croient sourds aux sons le
 * reussissent, ce qui ne les avance a rien. Leur probleme est la PRODUCTION.
 *
 * Mesurer la production demande un detecteur de hauteur qui tienne, et c'est la
 * seule chose que je possede et qu'un questionnaire ne peut pas imiter.
 *
 * CE QUE LA PAGE NE FERA PAS, et le texte le dit au lieu de le taire. Elle ne
 * diagnostique pas l'amusie. L'amusie est un trouble de la perception, elle se
 * cherche avec un test de perception, et un microphone n'y donne pas acces.
 *
 *     node travail/web-steady-pitch/page-oreille.mjs
 */

import { readFileSync, writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { SITE, RACINE, STYLE, ICONE, BEACON, plaintesDuDecoupage } from "./tranches.mjs";

const ICI = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ICI, "public");
const NOYAU = join(PUBLIC, "noyau");
const SOURCES = resolve(ICI, "..", "noyau-justesse");

const FICHIER = "tone-deaf-test.html";
const URL = RACINE + FICHIER;

let fautes = 0;
const gronder = (m) => { console.log("  " + m); fautes++; };
for (const plainte of plaintesDuDecoupage()) gronder(`FAUTE, ${plainte}`);

/** L'ordre est celui des dependances, il n'est pas alphabetique. */
const MORCEAUX = [
  join(NOYAU, "notation.js"),
  join(NOYAU, "langues.js"),
  join(NOYAU, "pitch.js"),
  join(PUBLIC, "micro-web.js"),
  join(PUBLIC, "oreille-ui.js"),
];

// ---------------------------------------------------------------------------
// 1. LA FRAICHEUR, puis L'APLATISSEMENT ET LE CONTROLE DES NOMS
//
// Meme mecanique que `tessiture-page.mjs`, et pour la meme raison. Deux modules
// qui declarent le meme nom se fondent en silence une fois aplatis, et la page
// tombe chez le visiteur et nulle part ailleurs. `mediane` par exemple est
// declaree par notation, par seance ET par tessiture, et il a suffi que je
// choisisse mes modules pour l'eviter. Le controle est la pour le jour ou je
// choisirai mal.
// ---------------------------------------------------------------------------

for (const nom of ["pitch", "notation", "langues"]) {
  if (statSync(join(SOURCES, `${nom}.ts`)).mtimeMs > statSync(join(NOYAU, `${nom}.js`)).mtimeMs) {
    gronder(`FAUTE, noyau-justesse/${nom}.ts est plus recent que public/noyau/${nom}.js`);
    gronder("       lancer d'abord  node travail/web-steady-pitch/construire.mjs");
  }
}

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

  morceaux.push(`/* ${nom} */\n` + brut
    .replace(/^\s*import\s[^;]*;\s*$/gm, "")
    .replace(/^([ \t]*)export\s+(async\s+)?(const|let|var|function|class)\b/gm, "$1$2$3")
    .replace(/^[ \t]*export\s*\{[^}]*\};?\s*$/gm, ""));
}

const code =
  "/* Depose par travail/web-steady-pitch/page-oreille.mjs. Ne pas editer ici. */\n" +
  "(function () {\n" + morceaux.join("\n") + "\n})();";

if (/^\s*import\s/m.test(code)) gronder("FAUTE, un import survit dans le code injecte");
if (/^\s*export\s/m.test(code)) gronder("FAUTE, un export survit dans le code injecte");
if (/<\/script>/i.test(code)) gronder("FAUTE, le code contient une balise de fermeture de script");
for (const attendu of ["function yinDetect", "function affinerHauteur", "function jouerNote", "function noterAppariement"]) {
  if (!code.includes(attendu)) gronder(`FAUTE, ${attendu} est absent du code injecte`);
}

// ---------------------------------------------------------------------------
// 2. LA PAGE
// ---------------------------------------------------------------------------

const TITRE = "Tone deaf test that listens to you sing, not a two note quiz";
const DESCRIPTION =
  "Most tone deaf tests play two notes and ask if they differ, which tests your hearing. This one plays a note, listens to you sing it back, and tells you how many cents off you were. Free, in the browser, nothing uploaded.";

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
<meta property="og:image:alt" content="A pitch matching test that plays a note and measures the one you sing back.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${TITRE}">
<meta name="twitter:description" content="${DESCRIPTION}">
<meta name="twitter:image" content="${RACINE}og.png">
${ICONE}
${STYLE}
<style>
  .or-rang{display:flex;align-items:baseline;justify-content:space-between;
    gap:.8rem;padding:.34rem 0;border-bottom:1px solid var(--trait)}
  .or-nom{font-family:"IBM Plex Mono",monospace;font-weight:600;font-size:.9rem}
  .or-valeur{font-family:"IBM Plex Mono",monospace;font-size:.82rem;color:var(--doux)}
  .or-cible{font-family:"IBM Plex Mono",monospace;font-size:2.6rem;font-weight:600;
    line-height:1.1;margin:.2rem 0}
  .or-vive{font-family:"IBM Plex Mono",monospace;font-size:1.6rem;color:var(--accent);
    min-height:1.9rem}
  .or-verdict{font-size:1.25rem;font-weight:700;margin:.2rem 0 .1rem}
  .or-chiffre{font-family:"IBM Plex Mono",monospace;color:var(--accent);
    font-size:1.05rem;margin:0 0 .6rem}
  #or-suite{border-top:1px solid var(--trait);margin-top:1.4rem;padding-top:1.1rem}
</style>
</head>
<body>
<main>

  <h1>Tone deaf test, the kind that actually listens to you.</h1>
  <p class="sous">This one plays a note, then listens while you sing it back,
  and tells you how far off you were in cents. It takes about a minute. It runs
  in this tab, and nothing you sing leaves your machine.</p>

  <div class="test">
    <div id="or-accueil">
      <p style="margin:0 0 .7rem">Pick the range that is closer to your speaking
      voice, so the notes land somewhere you can actually sing.</p>
      <p style="margin:0 0 .9rem">
        <button class="lancer" id="or-grave" type="button">Lower voice</button>
        <button class="lancer" id="or-aigu" type="button">Higher voice</button>
      </p>
      <p class="apres" style="margin:0">Six notes, one at a time. Your browser
      will ask for the microphone. Headphones help, because a speaker lets the
      reference note leak back into the microphone.</p>
      <p id="or-erreur" hidden></p>
    </div>

    <div id="or-mesure" hidden>
      <p class="etape" id="or-etape">Note 1 of 6</p>
      <div class="or-cible" id="or-cible">-</div>
      <p class="consigne" id="or-consigne">Listen.</p>
      <div id="or-vu-metre" hidden>
        <div class="or-vive" id="or-vive">-</div>
      </div>
    </div>

    <div id="or-resultat" hidden>
      <p class="or-verdict" id="or-verdict"></p>
      <p class="or-chiffre" id="or-chiffre"></p>
      <div id="or-lignes"></div>
      <p class="detail" id="or-detail"></p>
      <div class="actions">
        <button id="or-recommencer" type="button">Test again</button>
      </div>
      <div id="or-suite">
        <h2 class="suite-titre" id="or-suite-titre"></h2>
        <p id="or-suite-texte"></p>
        <p id="or-offre"><a class="lancer" href="./app.html">Open the trainer,
        level 1 free</a></p>
        <p class="apres" id="or-vente">Or keep it. The trainer, the range test and this one run
        with the internet switched off for 9.99 on
        <a href="https://payhip.com/SteadyPitch">the store</a>. One price, once,
        nothing to unlock afterwards. Everything on this page stays free to use
        here, what you pay for is keeping it.</p>
      </div>
    </div>
  </div>

  <p><a class="lancer" href="./vocal-range-test.html">Then find your range</a></p>
  <p class="apres">Two sweeps, two minutes. It names your lowest and highest
  note and the voice type you sit closest to.</p>

  <h2>What this measures, and what nearly every other test measures</h2>
  <p>Search for a tone deaf test and you will get a quiz that plays two notes
  and asks whether they were the same. That is a test of <em>perception</em>,
  and the overwhelming majority of people who believe they are tone deaf pass
  it comfortably. Passing it and still being told you sing badly is a confusing
  place to end up, and it is where most people end up.</p>
  <p>The reason is that singing in tune is two skills, not one. Hearing that a
  note is wrong is the first. Getting your voice to land on a note you can
  already hear is the second, and it is motor control rather than hearing. They
  fail independently, and the second one fails far more often.</p>
  <p>This page tests the second one. It plays a target, listens to what you
  actually produce, and reports the distance in cents. A semitone is 100 cents.
  A trained singer holds a note inside about 10 of them.</p>

  <h2>Singing the right note in the wrong octave is not a mistake</h2>
  <p>If a target is played high and you sing it an octave lower, you have
  matched it. That is the same note. A man given a note in a soprano's range
  will usually and correctly drop it an octave, and a test that marks him wrong
  for it is broken.</p>
  <p>So this page folds your answer onto the nearest octave before scoring it,
  and then tells you separately how many times it did that. The count is
  information about your voice, not a penalty.</p>

  <h2>Being consistently flat is a different problem from being scattered</h2>
  <p>Two people can average the same error and need completely different work.
  Somebody who lands 30 cents under every single target has one habit to
  correct, and it usually goes within a few sessions once they know. Somebody
  who is 30 cents out in random directions is not missing a correction, they
  are missing the feedback loop.</p>
  <p>The result below separates them, because the average on its own hides the
  distinction that decides what you should practise.</p>

  <h2>What this page cannot tell you</h2>
  <p>It cannot diagnose amusia, the genuine perceptual condition that the phrase
  tone deaf properly refers to. Amusia is a problem with hearing pitch
  relationships, it affects a small percentage of people, and finding it
  requires a perception test rather than a microphone. If you score badly here
  <em>and</em> you cannot hear the difference when somebody else sings out of
  tune, that combination is worth taking to a professional.</p>
  <p>It also cannot see your technique. Breath, larynx position and vowel all
  move pitch around, and a number in cents will not tell you which of them is
  responsible.</p>

  <h2>Where the number comes from</h2>
  <p>The detector is the same one behind the <a href="./">live monitor</a>, the
  <a href="./vocal-range-test.html">range test</a> and the
  <a href="./app.html">trainer</a>. It used to read every note sharp, by 2.6
  cents at a concert A and by nearly 30 at the bottom of a bass range, and the
  failure and its fix are written up with the measurements in
  <a href="./notes/pitch-detector-reads-sharp.html">my pitch detector read every
  note sharp</a>. Reporting a cents figure from a detector with a known bias
  would have been worse than reporting nothing.</p>
  <p>Each attempt is scored on the median of the confident frames, with the
  first part of every attempt discarded, because the start of a sung note is
  almost always a slide onto it rather than the note itself.</p>

  <h2>Nothing is uploaded</h2>
  <p>The microphone stream is analysed inside the page. There is no server, no
  account, no upload and no cookie for this test. Close the tab and it is gone.</p>

  <footer>
    Steady Pitch, by Thibaud Lepan.
    Questions and bug reports, thibaudlepanpro@gmail.com.
    <a href="./">Home</a>.
    <a href="./vocal-range-chart.html">The range chart</a>.
    <a href="https://payhip.com/SteadyPitch">The store</a>.
  </footer>

</main>
<script>
/* OREILLE:DEBUT */
${code}
/* OREILLE:FIN */
</script>
${BEACON}
</body>
</html>
`;

// ---------------------------------------------------------------------------
// 3. LES IDENTIFIANTS, LE CONTROLE QUI RATTRAPE UNE FAUTE DE FRAPPE
//
// Un identifiant mal tape ne leve rien au chargement. Il leve au premier clic,
// chez le visiteur, et personne ne me le dira jamais.
// ---------------------------------------------------------------------------

const interfaceUI = readFileSync(join(PUBLIC, "oreille-ui.js"), "utf-8");
const attendus = [...new Set(
  [...interfaceUI.matchAll(/\belt\("([^"]+)"\)|montrer\("([^"]+)"/g)].map((m) => m[1] || m[2])
)];

const manquants = attendus.filter((id) => !page.includes(`id="${id}"`));
if (manquants.length) gronder(`FAUTE, la page ne porte pas ${manquants.join(", ")}`);

if (fautes) {
  console.log(`\n${fautes} faute(s), rien n'est ecrit`);
  process.exit(1);
}

writeFileSync(join(SITE, FICHIER), page, "utf-8");

console.log("LE TEST D'APPARIEMENT, POSE DANS SA PAGE");
console.log("-".repeat(66));
console.log(`  ${MORCEAUX.length} modules aplatis, ${declarePar.size} noms, aucune collision`);
console.log(`  ${attendus.length} identifiants attendus, tous presents`);
console.log(`  ${FICHIER}, ${page.length} octets`);
