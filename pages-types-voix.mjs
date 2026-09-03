/**
 * pages-types-voix.mjs - SIX PAGES, UNE PAR TYPE DE VOIX.
 * Agent N4, 2026-09-04 (cycle 19).
 *
 * POURQUOI. Dix-huit cycles, zero visiteur exterieur. La page est indexee
 * depuis le cycle 17, donc le mur n'est plus l'acces du robot, c'est la
 * SURFACE. Une seule page se bat contre sept sites etablis sur `vocal range
 * test`. Six pages se battent chacune sur une requete que personne ne sert,
 * `am i a tenor`, `alto vocal range test`, et ainsi de suite.
 *
 * CE QUI SEPARE CES PAGES D'UN REMPLISSAGE. Chacune porte le MEME test qui
 * marche, et un texte qui n'est vrai que pour son type, l'etendue de reference,
 * le type voisin avec lequel on le confond, et ce que la mesure ne tranchera
 * jamais. Une page qui ne dirait rien de plus que sa voisine ne merite pas
 * d'exister, et le controle 6 refuse d'ecrire si deux pages se ressemblent trop.
 *
 * LES TRANCHES REPRISES TELLES QUELLES a `vocal-range-test.html`, la feuille de
 * style, le bloc du test et le code injecte. Elles ne sont jamais recopiees a
 * la main, sinon elles divergeraient au premier correctif, et c'est exactement
 * la derive que le cycle 16 a payee entre le noyau et le moniteur.
 *
 *     node travail/web-steady-pitch/pages-types-voix.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import {
  SITE, RACINE, STYLE, TEST, CODE, ICONE, BEACON, ID_DU_TEST, nommer,
  plaintesDuDecoupage,
} from "./tranches.mjs";

const ICI = dirname(fileURLToPath(import.meta.url));

let fautes = 0;
const gronder = (m) => { console.log("  " + m); fautes++; };
for (const plainte of plaintesDuDecoupage()) gronder(`FAUTE, ${plainte}`);

// ---------------------------------------------------------------------------
// 2. LES SIX TYPES
//
// Les bornes sont celles de `noyau-justesse/tessiture.ts`, en MIDI, redites ici
// en noms de notes. Le controle 4 verifie qu'elles n'ont pas diverge, parce
// qu'une page qui annonce une etendue et un verdict qui en calcule une autre
// est pire qu'une page absente.
// ---------------------------------------------------------------------------

const TYPES = [
  {
    fichier: "bass-vocal-range-test.html",
    nom: "Bass",
    bas: "E2", haut: "E4", basMidi: 40, hautMidi: 64,
    titre: "Bass vocal range test, sing two notes and find out",
    description:
      "Am I a bass? Sing your lowest note and your highest, in the browser, and see how much of the E2 to E4 bass range you actually cover. No app, no account, nothing uploaded.",
    h1: "Am I a bass? Sing two notes and see.",
    sous:
      "The bass range is conventionally written E2 to E4. This page measures where your voice actually starts and stops, names both ends, and tells you how much of that span you cover. It runs in the tab and nothing you sing leaves your machine.",
    propre: [
      ["What the bass range is, and what it is not",
       `<p>Almost every choral score treats the bass as E2 up to E4, and that is
  the span this page measures you against. It is a convention of repertoire. It
  describes the notes a composer will write for the part, not a boundary your
  body is supposed to respect.</p>
  <p>The consequence catches people out. Plenty of singers who are comfortably
  basses in a choir cannot reach E2 cold, and plenty of baritones can. Reaching
  the bottom note is neither necessary nor sufficient. What the part actually
  asks for is the ability to sit around the middle of that span, bar after bar,
  without the sound thinning out.</p>`],
      ["What separates a bass from a baritone",
       `<p>The two ranges overlap for most of their length, so the extremes settle
  very little. A baritone with a developed bottom and a bass with a modest one
  will measure almost identically on this page, and both readings will be
  correct.</p>
  <p>What tends to separate them is not the range but the tessitura, the part of
  the range where the voice can stay for a long time without effort. A bass is
  generally at home lower and starts to feel the strain earlier on the way up,
  while a baritone keeps an easy sound noticeably higher. Weight and colour
  matter too, and neither of those is a frequency, which is why no browser tab
  can read them off a microphone.</p>
  <p>If your result lands between the two, that is information rather than a
  failure. It usually means the deciding evidence is somewhere this test cannot
  look. <a href="./baritone-vocal-range-test.html">The baritone page</a> shows
  the same sweep against the other span.</p>`],
      ["The one place this page will disappoint a real bass",
       `<p>The detector has an honest floor at 65.41 hertz, a C2. That sits well
  below the E2 the bass range starts on, so an ordinary bass sweep is
  comfortably inside what it can read. A true basso profondo working below C2 is
  not, and in that case the page says the sweep went past its floor rather than
  printing a number it cannot defend.</p>
  <p>That is deliberate. A test that guesses at the bottom of a bass range will
  flatter you, and a flattering number about the lowest note you can sing is
  worth nothing at a rehearsal.</p>`],
    ],
  },
  {
    fichier: "baritone-vocal-range-test.html",
    nom: "Baritone",
    bas: "A2", haut: "A4", basMidi: 45, hautMidi: 69,
    titre: "Baritone vocal range test, sing two notes and find out",
    description:
      "Am I a baritone? Sing your lowest note and your highest, in the browser, and see how much of the A2 to A4 baritone range you actually cover. No app, no account, nothing uploaded.",
    h1: "Am I a baritone? Sing two notes and see.",
    sous:
      "Baritone is the most common adult male voice, and the one most often mistaken for something else in both directions. This page measures your two extremes, names them, and shows how much of the A2 to A4 span you cover. It runs in the tab and nothing is uploaded.",
    propre: [
      ["Why so many singers land here",
       `<p>Baritone sits in the middle of the male range, which is exactly why it
  is both the most common answer and the least satisfying one. A voice that is
  not obviously low and not obviously high measures as a baritone, and that is
  usually right, but it is right in a way that tells you very little about what
  to sing.</p>
  <p>The span this page measures you against is A2 to A4. Notice how much of it
  you share with the bass below and the tenor above. The overlap is not a flaw
  in the classification, it is the classification. The parts were written to
  overlap so that choirs could be assembled from ordinary people.</p>`],
      ["What separates a baritone from a tenor",
       `<p>This is the single most common misclassification in amateur singing,
  and range is the worst possible way to settle it. A great many baritones can
  produce a note somewhere around C5 if they push, and a great many untrained
  tenors cannot. Measuring the top note therefore sends people the wrong way in
  both directions.</p>
  <p>The distinction teachers actually use is where the voice changes gear, and
  how high it can sit comfortably rather than how high it can reach once. A
  tenor keeps an easy, full sound higher up and shifts register later. A
  baritone singing sustained phrases in the same place is working, even when the
  notes are available.</p>
  <p>The practical test is not the extreme note. It is whether you could sing a
  whole phrase around the top of your range and still sound like yourself at the
  end of it. <a href="./tenor-vocal-range-test.html">The tenor page</a> puts the
  same reading against the higher span.</p>`],
      ["What to do with a result that says baritone",
       `<p>Treat it as a starting point rather than a verdict. If the measured
  span covers the reference well and sitting in its middle feels unremarkable,
  the label is probably doing its job. If the middle feels low and dull and you
  keep drifting upward, the reading is worth repeating warmed up.</p>
  <p>Range also moves. It is wider warmed up, narrower first thing in the
  morning, and it grows with training. One measurement is a snapshot. Two a
  month apart say considerably more.</p>`],
    ],
  },
  {
    fichier: "tenor-vocal-range-test.html",
    nom: "Tenor",
    bas: "C3", haut: "C5", basMidi: 48, hautMidi: 72,
    titre: "Tenor vocal range test, sing two notes and find out",
    description:
      "Am I a tenor? Sing your lowest note and your highest, in the browser, and see how much of the C3 to C5 tenor range you actually cover. No app, no account, nothing uploaded.",
    h1: "Am I a tenor? Sing two notes and see.",
    sous:
      "The tenor range is conventionally C3 to C5, and that top C is the most over-interpreted note in singing. This page measures both ends of your voice, names them, and shows how much of the span you actually cover. It runs in the tab and nothing is uploaded.",
    propre: [
      ["The top C proves less than everyone thinks",
       `<p>C5 is the note at the top of the conventional tenor range, and it has
  acquired a mystique the classification never gave it. Reaching it once, in a
  quiet room, on a good day, is not what makes a voice a tenor. Baritones reach
  it regularly. Trained sopranos treat it as the middle of their range.</p>
  <p>What the tenor part actually asks for is the ability to live near the top
  of that span, phrase after phrase, and still have a full sound to spend. That
  is a question about endurance and about where the voice changes gear, not
  about a single measurement, and this page can only give you the
  measurement.</p>`],
      ["What separates a tenor from a baritone",
       `<p>The two ranges overlap heavily, so the extremes are close to useless
  for telling them apart. The distinction teachers use is where the shift
  between registers falls and how high the voice stays comfortable.</p>
  <p>A tenor carries a full, easy sound higher before anything has to change,
  and can sit up there. A baritone with a good top can hit the same notes and is
  working for them, and the difference shows up over a sustained phrase rather
  than on one held note.</p>
  <p>This is why a result of tenor on range alone should be held loosely, and
  why a result of baritone should not discourage you if the top of your voice
  feels genuinely easy. Compare the two readings on
  <a href="./baritone-vocal-range-test.html">the baritone page</a> and trust the
  comfort more than the extreme.</p>`],
      ["Getting a top note the detector will believe",
       `<p>The test only counts a note you hold. A note that flashes past on the
  way up is discarded, because a single frame at the top of a sweep is almost
  always the detector slipping an octave rather than you singing. That rule
  costs you the note you screamed and keeps the one you sang.</p>
  <p>Slide up rather than jumping. Use an open <em>ah</em>. Stop before the
  sound turns into a shout, because a top note produced by force is not a note
  you can use, and a range built on it describes a voice you do not have.</p>`],
    ],
  },
  {
    fichier: "alto-vocal-range-test.html",
    nom: "Alto",
    bas: "F3", haut: "F5", basMidi: 53, hautMidi: 77,
    titre: "Alto vocal range test, sing two notes and find out",
    description:
      "Am I an alto? Sing your lowest note and your highest, in the browser, and see how much of the F3 to F5 alto range you actually cover. No app, no account, nothing uploaded.",
    h1: "Am I an alto? Sing two notes and see.",
    sous:
      "Alto is a choral part before it is a voice type, and that difference explains most of the confusion around it. This page measures both ends of your voice, names them, and shows how much of the F3 to F5 span you cover. It runs in the tab and nothing is uploaded.",
    propre: [
      ["Alto is a part, contralto is a voice",
       `<p>The word does double duty and it causes real trouble. In a choir, alto
  is the lower of the two upper parts, and it is filled by whoever can read it
  comfortably. As a solo voice type, contralto means something much narrower,
  and it is genuinely uncommon.</p>
  <p>So a great many people who have sung alto for years are not contraltos.
  They are mezzo-sopranos who were put on the alto line because the choir needed
  one, and who then spent a decade never practising the top of their range. The
  measurement on this page reflects the voice you have trained, which is not
  always the voice you have.</p>`],
      ["What separates an alto from a mezzo-soprano",
       `<p>The reference spans are a fourth apart and overlap almost entirely, so
  the bottom note settles very little on its own. What tends to separate them is
  the top, and specifically whether the top is missing or merely unused.</p>
  <p>A true contralto has genuine weight low down and the upper range stays
  comparatively modest even with training. A mezzo who has sung alto parts for
  years will often measure like a contralto and then gain most of an octave once
  she works on it, because the notes were never absent, only unpractised.</p>
  <p>If your result says alto and the top of the sweep felt weak rather than
  blocked, that is worth retesting after a proper warm up, and worth comparing
  against <a href="./mezzo-soprano-vocal-range-test.html">the mezzo-soprano
  page</a>.</p>`],
      ["Reading the low end honestly",
       `<p>The bottom of a female range is where this kind of test is easiest to
  fool, because the last few notes on the way down often turn into vocal fry.
  Fry has almost no pitch in it, a detector will either refuse it or invent
  something, and a range built on it is a range you cannot sing in.</p>
  <p>Stop the descent at the last note that still has tone. It will give you a
  smaller number and a truer one, which is the trade this whole page is built
  on.</p>`],
    ],
  },
  {
    fichier: "mezzo-soprano-vocal-range-test.html",
    nom: "Mezzo-soprano",
    bas: "A3", haut: "A5", basMidi: 57, hautMidi: 81,
    titre: "Mezzo-soprano vocal range test, sing two notes and find out",
    description:
      "Am I a mezzo-soprano? Sing your lowest note and your highest, in the browser, and see how much of the A3 to A5 mezzo range you actually cover. No app, no account, nothing uploaded.",
    h1: "Am I a mezzo-soprano? Sing two notes and see.",
    sous:
      "Mezzo-soprano sits between the two labels most singers are handed, and it is where a large share of adult female voices actually belong. This page measures both ends of your voice, names them, and shows how much of the A3 to A5 span you cover. It runs in the tab and nothing is uploaded.",
    propre: [
      ["The type that gets skipped over",
       `<p>Choirs mostly need two female lines, so singers get sorted into soprano
  or alto and the middle disappears. Mezzo is the type that sorting has no room
  for, which is why so many people arrive at it late and by elimination, after
  the soprano part felt permanently high and the alto part felt permanently
  dull.</p>
  <p>The span this page measures against is A3 to A5. It overlaps the soprano
  range above and the alto range below by most of their length, so expect your
  reading to touch all three. That is the normal result, not a failed test.</p>`],
      ["What separates a mezzo-soprano from a soprano",
       `<p>Not the top note, which is the assumption almost everyone starts with.
  A trained mezzo will often reach the same high notes a soprano does, and a
  soprano who has never worked on her lower range will measure shorter at the
  bottom than a mezzo does.</p>
  <p>The difference that actually holds up is where the voice is comfortable for
  a long time, and what it sounds like in the middle. A mezzo tends to have more
  body and colour in the middle of her range and finds sustained singing at the
  very top more costly. A soprano is lighter through the middle and gains rather
  than spends energy as she goes up.</p>
  <p>Both of those are qualities of sound rather than frequencies, and a
  microphone reading in a browser tab cannot see either. That is the honest
  limit of this measurement, and it is why the page names a closest type instead
  of handing down a verdict. Compare with
  <a href="./soprano-vocal-range-test.html">the soprano page</a> if your result
  sits on the boundary.</p>`],
      ["Why one measurement is not enough",
       `<p>Range is not a constant. It is wider once you are warmed up, noticeably
  narrower first thing in the morning, and it widens with training, usually at
  the top and usually slowly. A single sweep taken cold will under-report you at
  both ends.</p>
  <p>Take the test twice, once cold and once after ten minutes of warming up,
  and the gap between the two readings will tell you more about your voice than
  either number does alone.</p>`],
    ],
  },
  {
    fichier: "soprano-vocal-range-test.html",
    nom: "Soprano",
    bas: "C4", haut: "C6", basMidi: 60, hautMidi: 84,
    titre: "Soprano vocal range test, sing two notes and find out",
    description:
      "Am I a soprano? Sing your lowest note and your highest, in the browser, and see how much of the C4 to C6 soprano range you actually cover. No app, no account, nothing uploaded.",
    h1: "Am I a soprano? Sing two notes and see.",
    sous:
      "The soprano range is conventionally C4 to C6, two octaves starting at middle C. This page measures where your voice actually starts and stops, names both ends, and shows how much of that span you cover. It runs in the tab and nothing is uploaded.",
    propre: [
      ["Two octaves from middle C, and what that hides",
       `<p>C4 to C6 is a tidy span and it hides a real asymmetry. The bottom of
  it, around middle C, is territory every adult female voice has. The top of it
  is not, and the last few notes are the ones that take years rather than
  weeks.</p>
  <p>So a reading that covers the lower two thirds of the soprano range and
  stops is extremely common, and it is not evidence against you. It usually
  means the top has not been trained yet, which is a different statement from
  the top not being there.</p>`],
      ["What separates a soprano from a mezzo-soprano",
       `<p>The high note is the least reliable place to look. Mezzos reach high
  notes, sopranos who have not worked at it do not, and the reference ranges
  overlap by a full octave and a half.</p>
  <p>What separates them is where the voice wants to live. A soprano finds the
  upper part of her range easy to sustain and tends to sound thinner and less
  interesting low down. A mezzo has more weight in the middle and pays more for
  the top. Those are descriptions of timbre and of endurance, neither of which
  is a frequency, and neither of which this page can measure.</p>
  <p>If your reading lands between the two, take the label as a hypothesis
  rather than a result, and check it against
  <a href="./mezzo-soprano-vocal-range-test.html">the mezzo-soprano page</a>.</p>`],
      ["Getting the top of the sweep to read correctly",
       `<p>High notes are where pitch detectors are most likely to embarrass
  themselves, in both directions. A quiet, breathy top note gives the detector
  very little to work with, and a forced one is full of noise. Either can
  produce a reading an octave away from what you sang.</p>
  <p>This test only counts notes you hold for about three seconds, which throws
  away most of that. Slide up rather than jumping to the extreme, sing an open
  <em>ah</em> rather than humming, and stop at the last note that still sounds
  like singing. The number will be lower than the one a generous test gives you,
  and you will be able to use it.</p>`],
    ],
  },
];

// ---------------------------------------------------------------------------
// 3. LES SECTIONS COMMUNES
//
// Volontairement COURTES, et placees APRES le texte propre au type. Une page
// dont la moitie haute est identique a ses cinq voisines est une page mince,
// quoi qu'il y ait dessous.
// ---------------------------------------------------------------------------

const COMMUN = `  <h2>Getting a result you can trust</h2>
  <p>The test listens for a note you <em>hold</em>. A note that flashes past on
  the way through is not counted, because a single frame at the end of a sweep
  is almost always the detector slipping an octave rather than you singing. Hold
  each end for about three seconds and you will see it lock on.</p>
  <ul>
    <li>Sing an open <em>ah</em>, out loud. Humming is quieter and the low end
    of a hum is often too breathy to read.</li>
    <li>Start on a note that feels easy, then slide. Do not jump to the extreme,
    you will strain and the number will be worse.</li>
    <li>At the bottom, stop before it turns into a creak. Vocal fry has almost
    no pitch in it.</li>
    <li>Quiet room, microphone not too close. A phone at arm's length works
    fine.</li>
  </ul>

  <h2>Where the number comes from</h2>
  <p>The pitch detector is the same one that runs the
  <a href="./">live monitor</a> and the <a href="./app.html">trainer</a>. It is
  a YIN detector with a correction pass, and it used to read every note sharp,
  by 2.6 cents at a concert A and by nearly 30 at the bottom of a bass range.
  That failure and its fix are written up with the before and after measurements
  in <a href="./notes/pitch-detector-reads-sharp.html">my pitch detector read
  every note sharp</a>. An earlier version of the octave correction folded good
  readings away one frame at a time, and that one is written up in
  <a href="./notes/octave-correction-ratchet.html">an octave correction that
  could not tell a glitch from a soprano</a>.</p>

  <h2>Nothing is uploaded</h2>
  <p>The microphone stream is analysed inside the page. There is no server, no
  account, no upload and no cookie for this test. Close the tab and the whole
  thing is gone. The only file that ever leaves your machine is the result
  image, and only when you click the button that makes it.</p>
`;

/** Le pied de page, avec les cinq autres types. C'est le maillage interne. */
function pied(courant) {
  const autres = TYPES.filter((t) => t.fichier !== courant.fichier)
    .map((t) => `<a href="./${t.fichier}">${t.nom}</a>`)
    .join(", ");
  return `  <h2>The other five voice types</h2>
  <p>Each one has its own page, with the same test and the reference range for
  that type. ${autres}. If you would rather not pick a type first, the
  <a href="./vocal-range-test.html">general vocal range test</a> measures your
  voice and names the closest of the six for you, and the
  <a href="./vocal-range-chart.html">vocal range chart</a> shows all six drawn on
  one axis before you sing a note.</p>

  <footer>
    Steady Pitch, by Thibaud Lepan.
    Questions and bug reports, thibaudlepanpro@gmail.com.
    <a href="./">Home</a>.
    <a href="./vocal-range-test.html">All voice types</a>.
    <a href="https://payhip.com/SteadyPitch">The store</a>.
  </footer>`;
}

// ---------------------------------------------------------------------------
// 4. LE CONTROLE DES BORNES CONTRE LE NOYAU
//
// Le verdict affiche par la page vient de `tessiture.ts`. Le texte, lui, est
// ecrit ici. Si les deux divergent, la page annonce une etendue et en calcule
// une autre, et c'est la faute la plus couteuse possible sur une page dont
// l'argument de vente est la justesse.
// ---------------------------------------------------------------------------

const noyau = readFileSync(resolve(ICI, "..", "noyau-justesse", "tessiture.ts"), "utf-8");
for (const type of TYPES) {
  const ligne = new RegExp(
    `etiquette: "${type.nom}", basMidi: (\\d+), hautMidi: (\\d+)`
  ).exec(noyau);
  if (!ligne) { gronder(`FAUTE, ${type.nom} est introuvable dans tessiture.ts`); continue; }
  const [, bas, haut] = ligne;
  if (+bas !== type.basMidi || +haut !== type.hautMidi) {
    gronder(`FAUTE, ${type.nom}, le noyau dit ${bas}-${haut}, cette page dit ${type.basMidi}-${type.hautMidi}`);
  }
  if (nommer(type.basMidi) !== type.bas || nommer(type.hautMidi) !== type.haut) {
    gronder(`FAUTE, ${type.nom}, ${type.basMidi}-${type.hautMidi} se nomme ${nommer(type.basMidi)} a ${nommer(type.hautMidi)}`);
  }
}

// ---------------------------------------------------------------------------
// 5. LA COMPOSITION
// ---------------------------------------------------------------------------

function composer(type) {
  const url = RACINE + type.fichier;
  const corps = type.propre.map(([titre, texte]) => `  <h2>${titre}</h2>\n${texte}\n`).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${type.titre}</title>
<meta name="description" content="${type.description}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Steady Pitch">
<meta property="og:title" content="${type.titre}">
<meta property="og:description" content="${type.description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${RACINE}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A vocal range test that runs in a browser tab and names your lowest and highest note.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${type.titre}">
<meta name="twitter:description" content="${type.description}">
<meta name="twitter:image" content="${RACINE}og.png">
${ICONE}
${STYLE}
</head>
<body>
<main>

  <h1>${type.h1}</h1>
  <p class="sous">${type.sous}</p>

${TEST}
  <p><a class="lancer" href="./vocal-range-test.html">Or run the general range test</a></p>
  <p class="apres">Same measurement, no type chosen in advance. It names the
  closest of the six for you.</p>

${corps}
${COMMUN}
${pied(type)}

</main>
${CODE}
${BEACON}
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// 6. LES CONTROLES, PUIS L'ECRITURE
// ---------------------------------------------------------------------------

const pages = TYPES.map((type) => [type, composer(type)]);

for (const [type, page] of pages) {
  const manquants = ID_DU_TEST.filter((id) => !page.includes(`id="${id}"`));
  if (manquants.length) gronder(`FAUTE, ${type.fichier} ne porte pas ${manquants.join(", ")}`);
  if (!page.includes("/* TESSITURE:DEBUT */")) gronder(`FAUTE, ${type.fichier} n'a pas recu le code`);
  for (const balise of ["<title>", "</html>", "</main>"]) {
    if (!page.includes(balise)) gronder(`FAUTE, ${type.fichier} n'a pas de ${balise}`);
  }
}

/**
 * LE CONTROLE QUI COMPTE, ET MA PREMIERE VERSION MESURAIT LA MAUVAISE CHOSE.
 * Elle comparait le vocabulaire de la page ENTIERE, donc le bloc du test, les
 * sections communes et le pied, qui sont partages a dessein. Elle rendait 75 a
 * 80 pour cent partout, ce qui ne dit rien de plus que `ces pages ont un
 * gabarit`. Tous les sites en ont un.
 *
 * Ce qu'on veut savoir est autre chose, EST-CE QUE LA PART PROPRE EST PROPRE,
 * et EST-CE QU'IL Y EN A ASSEZ. Deux mesures, donc, et la seconde est celle qui
 * attrape une page mince, une page peut avoir un texte unique et n'en avoir que
 * trois lignes.
 */
const mots = (texte) => new Set(
  texte.replace(/<[^>]+>/g, " ").toLowerCase().match(/[a-z']{4,}/g) || []
);

const compter = (texte) => (texte.replace(/<[^>]+>/g, " ").match(/[a-z']+/gi) || []).length;

const prose = pages.map(([type]) => [
  type,
  mots(type.h1 + " " + type.sous + " " + type.propre.map(([t, x]) => t + " " + x).join(" ")),
]);

const GABARIT = compter(TEST) + compter(COMMUN);

console.log("PART PROPRE DE CHAQUE PAGE");
for (const [type] of pages) {
  const propres = compter(type.h1 + type.sous + type.propre.map(([t, x]) => t + " " + x).join(" "));
  const part = propres / (propres + GABARIT);
  console.log(`  ${type.nom.padEnd(15)} ${String(propres).padStart(4)} mots propres, ${(part * 100).toFixed(0)} pour cent de la prose`);
  if (part < 0.45) gronder(`FAUTE, ${type.nom} est a ${(part * 100).toFixed(0)} pour cent de propre, c'est une page de gabarit`);
}

for (let a = 0; a < prose.length; a++) {
  for (let b = a + 1; b < prose.length; b++) {
    const [typeA, motsA] = prose[a];
    const [typeB, motsB] = prose[b];
    const communs = [...motsA].filter((m) => motsB.has(m)).length;
    const recouvrement = communs / Math.min(motsA.size, motsB.size);
    if (recouvrement > 0.55) {
      gronder(`FAUTE, la part propre de ${typeA.nom} et celle de ${typeB.nom} se recouvrent a ${(recouvrement * 100).toFixed(0)} pour cent`);
    }
  }
}

if (fautes) {
  console.log(`\n${fautes} faute(s), rien n'est ecrit`);
  process.exit(1);
}

for (const [type, page] of pages) {
  writeFileSync(join(SITE, type.fichier), page, "utf-8");
}

console.log("SIX PAGES DE TYPE DE VOIX");
console.log("-".repeat(66));
for (const [type, page] of pages) {
  const mots = prose.find(([t]) => t === type)[1].size;
  console.log(`  ${type.fichier.padEnd(38)} ${String(page.length).padStart(7)} o, ${mots} mots distincts`);
}
console.log(`  bornes confrontees a tessiture.ts, ${TYPES.length} types, aucun ecart`);
console.log(`  ${ID_DU_TEST.length} identifiants du test, presents sur les six`);
