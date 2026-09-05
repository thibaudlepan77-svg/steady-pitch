/**
 * demande-suivante.mjs - DEMANDER CE QU'ON VEUT ACHETER, AVANT DE LE FABRIQUER.
 * Agent N4, 2026-09-05 (cycle 21).
 *
 * POURQUOI, ET C'EST LE REPROCHE EXACT QU'ON M'A FAIT. J'ameliore un produit
 * que personne n'a de raison d'acheter. La mesure du matin dit pourquoi, ce
 * marche ne paie jamais AVANT l'usage, six applications vocales payantes sur
 * l'App Store totalisent cinq avis ecrits en six mois quand trois gratuites a
 * abonnement en font mille cinq cent cinquante-huit. Ma fiche a 9,99 en
 * telechargement est donc la case morte, et je ne sais pas quelle case vivante
 * la remplace.
 *
 * CE QUE CETTE PAGE MESURE, ET CE N'EST PAS UN SONDAGE. Un sondage recolte des
 * opinions, et une opinion sur un prix ne vaut rien. Ici la personne vient de
 * recevoir son resultat, elle est au moment exact ou l'envie existe, et elle
 * CLIQUE. Un clic sur une offre chiffree est un comportement, pas une opinion.
 *
 * COMMENT LE COMPTAGE MARCHE. Chaque option a son propre chemin, donc le
 * compteur de pages les separe exactement, sans mouchard supplementaire et
 * sans identifier personne. C'est le meme mecanisme que `liens-suivis.mjs`.
 *
 * LA REGLE QUE JE M'IMPOSE ICI, ET ELLE PASSE AVANT LA MESURE. Aucune de ces
 * trois choses n'existe. La page de destination le DIT, en premier, en toutes
 * lettres, avant toute autre phrase. Faire croire qu'un produit existe pour
 * mesurer l'envie de l'acheter est un mensonge, et le fait qu'il soit efficace
 * ne le rend pas acceptable. Personne ne laisse d'argent, personne ne laisse
 * d'adresse, et le clic ne coute rien a celui qui le fait.
 *
 *     node travail/web-steady-pitch/demande-suivante.mjs
 */

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { SITE, RACINE, STYLE, ICONE, BEACON } from "./tranches.mjs";

const ICI = dirname(fileURLToPath(import.meta.url));

/**
 * Les trois candidats viennent des mesures du 2026-09-05, pas d'une envie.
 *
 *   chansons  le grief numero un des applications a abonnement, verbatim
 *             releve chez Simply Sing, `Why do I have to pay for EVERY SONG`.
 *             Des gens en colere d'avoir a payer pour chanter un morceau.
 *   telephone 41 de mes 66 visiteurs sont sur un telephone, 35 sur iOS, et ce
 *             que je vends est un fichier a ouvrir par double-clic.
 *   choeur    le seul acheteur de ma ligne qui ait un budget plutot qu'une
 *             envie, et j'ai deja ecrit le guide qui va avec.
 */
const OPTIONS = [
  {
    nom: "songs",
    titre: "The songs that actually sit inside your range",
    prix: "about 5 dollars, once",
    resume: `A list built from your two notes, not from a voice type. Which songs
      you can sing without transposing, which need a tone down, and which are out
      of reach whatever anyone tells you.`,
    pourquoi: `Because the loudest complaint against the big singing apps is not
      the price, it is being charged per song. I read six months of their reviews
      this morning to check that.`,
  },
  {
    nom: "phone",
    titre: "The trainer, working properly on a phone",
    prix: "about 5 dollars, once",
    resume: `The thirty exercises, scored in cents on a named note, in a phone
      browser, with your history kept on the device.`,
    pourquoi: `Because 41 of my last 66 visitors were on a phone and the thing I
      currently sell is a file you open by double clicking it on a computer.`,
  },
  {
    nom: "choir",
    titre: "A range sheet for a whole choir",
    prix: "about 9 dollars, once",
    resume: `Measure twenty singers in one rehearsal, get a printable sheet of
      everyone's two notes, and a suggested section for each that you are free to
      overrule.`,
    pourquoi: `Because a director measuring a room has a reason to pay that a
      curious singer does not.`,
  },
];

const page = (option) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${option.titre}</title>
${ICONE}
${STYLE}
</head>
<body>
<main>
  <h1>This does not exist yet</h1>
  <p class="chapeau">You clicked <em>${option.titre}</em>. Nothing was sent, nothing
  was signed up for, and there is nothing to buy on this page. It is not built.</p>

  <h2>What it would be</h2>
  <p>${option.resume}</p>
  <p>Price if it existed, ${option.prix}.</p>

  <h2>Why I put it in front of you</h2>
  <p>${option.pourquoi}</p>

  <h2>Why I am doing it this way</h2>
  <p>I have been improving a tool that nobody has a reason to buy, and asking
  people what they would pay for gets you polite answers. Clicking a priced
  option a second after seeing your own result is a slightly more honest signal,
  so that is what I count. Your click is a number on a page, nothing else. I do
  not know who you are and I would rather keep it that way.</p>

  <p>If you want to say something a click cannot, the address is
  <a href="mailto:thibaudlepanpro@gmail.com">thibaudlepanpro@gmail.com</a>, and
  a sentence about what would actually help is worth more to me than the click.</p>

  <p><a class="lancer" href="../vocal-range-test.html">Back to the range test</a></p>

  <footer>
    Steady Pitch, by Thibaud Lepan.
    <a href="${RACINE}">Home</a>.
  </footer>
</main>
${BEACON}
</body>
</html>
`;

mkdirSync(join(SITE, "next"), { recursive: true });
for (const option of OPTIONS) {
  writeFileSync(join(SITE, "next", `${option.nom}.html`), page(option));
  console.log(`  ${RACINE}next/${option.nom}.html`.padEnd(58) + option.titre);
}

/**
 * Le bloc s'insere entre deux reperes dans la page maitresse, comme tout le
 * reste. Ecrire a la main dans sept pages est le meilleur moyen d'en oublier
 * une, et c'est deja arrive avec la garde du microphone.
 */
const DEBUT = "<!-- DEMANDE:DEBUT -->";
const FIN = "<!-- DEMANDE:FIN -->";
const DEBUT_VISIBLE = "<!-- DEMANDE-VISIBLE:DEBUT -->";
const FIN_VISIBLE = "<!-- DEMANDE-VISIBLE:FIN -->";

const bloc = `${DEBUT}
    <div class="apres" id="tess-demande">
      <p><strong>None of these exist yet, and I am trying to work out which one to
      build.</strong> Clicking one tells me, and does nothing else.</p>
      <ul>
${OPTIONS.map((o) => `        <li><a id="veut-${o.nom}" href="${RACINE}next/${o.nom}.html">${o.titre}</a>, ${o.prix}</li>`).join("\n")}
      </ul>
    </div>
    ${FIN}`;

/**
 * ET LE MEME BLOC, VISIBLE SANS AVOIR PASSE LE TEST.
 *
 * POURQUOI IL EN FAUT DEUX, ET C'EST UNE QUESTION DE DEBIT. Le premier bloc vit
 * dans le panneau de resultat, donc il n'apparait qu'apres un balayage termine.
 * C'est le meilleur moment pour demander, la personne vient d'obtenir son
 * chiffre. Mais le compteur du 2026-09-05 donne 54 visites sur cette page et un
 * seul clic releve sur le bouton de demarrage. **A ce rythme, la mesure ne
 * rendra aucun verdict avant le 23 septembre**, et une mesure qui arrive apres
 * la decision ne sert a rien.
 *
 * Le second bloc est donc dans la prose, visible en descendant, sans condition.
 * Il vise les memes chemins, donc le comptage reste le meme et je ne pourrai pas
 * distinguer les deux origines. C'est un choix assume, j'ai besoin de savoir
 * QUELLE option gagne, pas d'ou vient le clic.
 */
const BLOC_VISIBLE = `${DEBUT_VISIBLE}
  <h2>What should I build next</h2>
  <p>Three things people keep asking me for. <strong>None of them exist yet</strong>,
  and I would rather build the one you would actually use than guess. Clicking one
  tells me which, and does nothing else. No payment, no email, no signup.</p>
  <ul>
${OPTIONS.map((o) => `    <li><a id="veut2-${o.nom}" href="${RACINE}next/${o.nom}.html">${o.titre}</a>, ${o.prix}</li>`).join("\n")}
  </ul>
  ${FIN_VISIBLE}`;

const chemin = join(SITE, "vocal-range-test.html");
let html = readFileSync(chemin, "utf-8");

if (html.includes(DEBUT)) {
  const i = html.indexOf(DEBUT);
  const j = html.indexOf(FIN, i) + FIN.length;
  html = html.slice(0, i) + bloc + html.slice(j);
  console.log("\n  bloc remplace dans vocal-range-test.html");
} else {
  const ancre = '    </div>\n  </div>\n\n  <p><a class="lancer" href="./">Open the live pitch monitor</a></p>';
  if (!html.includes(ancre)) {
    console.log("\n  FAUTE, ancre introuvable, la page n'est pas touchee");
    process.exit(1);
  }
  html = html.replace(ancre, `    ${bloc}\n${ancre}`);
  console.log("\n  bloc insere dans vocal-range-test.html, apres le panneau de resultat");
}

// LE SECOND POINT D'INSERTION, DANS LA PROSE.
if (html.includes(DEBUT_VISIBLE)) {
  const i = html.indexOf(DEBUT_VISIBLE);
  const j = html.indexOf(FIN_VISIBLE, i) + FIN_VISIBLE.length;
  html = html.slice(0, i) + BLOC_VISIBLE + html.slice(j);
  console.log("  bloc visible remplace");
} else {
  const ancreVisible = "  <h2>How to get a result you can trust</h2>";
  if (!html.includes(ancreVisible)) {
    console.log("  FAUTE, ancre du bloc visible introuvable");
    process.exit(1);
  }
  html = html.replace(ancreVisible, `${BLOC_VISIBLE}\n\n${ancreVisible}`);
  console.log("  bloc visible insere avant la section sur la fiabilite");
}

writeFileSync(chemin, html, "utf-8");
console.log("  Relancer tessiture-page, pages-types-voix, page-tableau et les emballeurs.");
