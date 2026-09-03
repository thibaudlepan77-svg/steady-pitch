/**
 * emballer.mjs - L'EMBALLEUR, UN SEUL FICHIER HTML ET RIEN D'AUTRE.
 * Agent N4, 2026-08-28 (cycle 12).
 *
 * POURQUOI CE FICHIER EXISTE, ET C'EST UNE DECISION DE PRODUIT AVANT D'ETRE
 * UNE DECISION TECHNIQUE.
 *
 * 1. UN MODULE ES NE SE CHARGE PAS DEPUIS `file://`. Le navigateur traite un
 *    fichier local comme une origine opaque et refuse l'import. Tant que le
 *    site est fait de douze fichiers, il exige un serveur, donc un
 *    hebergement, donc un cout et une panne possible. Fondu en un seul
 *    fichier, il s'ouvre par un double-clic, hors ligne, pour toujours.
 * 2. LA CAISSE RETENUE VEND DES TELECHARGEMENTS. Payhip livre un fichier a
 *    l'acheteur. Un fichier, pas un dossier, pas un compte, pas une adresse a
 *    maintenir. Le produit devient exactement ce que la caisse sait livrer.
 * 3. RIEN A HEBERGER VEUT DIRE RIEN A PAYER ET RIEN A CASSER. Un acheteur qui
 *    revient dans trois ans ouvre le meme fichier et il marche encore.
 *
 * LA METHODE, ET POURQUOI CE N'EST PAS UNE SIMPLE CONCATENATION.
 * Le premier jet fondait tous les modules dans une seule portee. Son propre
 * controle a refuse de livrer, et il avait raison, QUATRE noms entraient en
 * collision, dont un `preparer` qui veut dire preparer un exercice d'un cote
 * et preparer le microphone de l'autre. Fondre les portees aurait remplace
 * l'un par l'autre en silence.
 *
 * Chaque module est donc enveloppe dans sa propre fonction, et rend un objet
 * de ses exports. Les imports deviennent une destructuration en tete. La
 * portee de chaque module est conservee a l'identique, donc le code servi se
 * comporte exactement comme le code teste.
 *
 * CE QUE LA MACHINE VERIFIE AVANT DE LIVRER.
 *   - chaque nom importe existe vraiment dans les exports du module vise,
 *   - chaque module est place apres ceux dont il depend,
 *   - aucun import ni export ne survit a l'enveloppement,
 *   - aucune reference exterieure ne survit dans le HTML.
 *
 *     node travail/web-steady-pitch/emballer.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ICI = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ICI, "public");
const SORTIE = join(ICI, "dist");

/** ORDRE DES DEPENDANCES, ecrit a la main et verifie par la machine juste
 *  apres. Un tri automatique se serait tu en cas de cycle, la liste nommee
 *  plus le controle se plaignent. */
const ORDRE = [
  "noyau/notation.js",
  "noyau/langues.js",
  "noyau/accessibilite.js",
  "noyau/exercices.js",
  "noyau/curriculum-intervalles.js",
  "noyau/curriculum-tenues.js",
  "noyau/seance.js",
  "noyau/ecran.js",
  "noyau/theme.js",
  "noyau/pitch.js",
  "micro-web.js",
  "app.js",
];

let fautes = 0;
const gronder = (m) => { console.log(`  ${m}`); fautes++; };
const controles = [];

/** Le nom de la variable qui portera les exports d'un module. */
const sceau = (chemin) =>
  "M$" + chemin.replace(/^noyau\//, "").replace(/\.js$/, "").replace(/[^A-Za-z0-9]/g, "_");

/** Resout un specificateur relatif vers une cle de ORDRE. */
function resoudre(depuis, specificateur) {
  const nu = specificateur.replace(/^\.\//, "").replace(/^\.\.\//, "");
  if (nu.includes("/")) return nu;
  return depuis.includes("/") ? "noyau/" + nu : nu;
}

// ---------------------------------------------------------------------------
// 1. LES EXPORTS DE CHAQUE MODULE, RELEVES AVANT TOUTE REECRITURE
// ---------------------------------------------------------------------------

const sources = new Map();
const exportsDe = new Map();

for (const chemin of ORDRE) {
  const brut = readFileSync(join(PUBLIC, chemin), "utf-8");
  sources.set(chemin, brut);
  const noms = [];
  for (const m of brut.matchAll(
    /^export\s+(?:async\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm
  )) {
    noms.push(m[1]);
  }
  if (/^export\s+default\b/m.test(brut)) {
    gronder(`FAUTE, ${chemin} porte un export par defaut, que cet emballeur ne gere pas`);
  }
  exportsDe.set(chemin, noms);
}

// ---------------------------------------------------------------------------
// 2. ENVELOPPEMENT MODULE PAR MODULE
// ---------------------------------------------------------------------------

const morceaux = [];
const placees = new Set();

for (const chemin of ORDRE) {
  let js = sources.get(chemin);
  const entetes = [];

  // Les imports, y compris ceux ecrits sur plusieurs lignes, deviennent une
  // destructuration de l'objet rendu par le module vise.
  js = js.replace(
    /^[ \t]*import\s*\{([\s\S]*?)\}\s*from\s*["'](\.[^"']*)["']\s*;?[ \t]*$/gm,
    (_tout, dedans, spec) => {
      const cible = resoudre(chemin, spec);
      if (!placees.has(cible)) {
        gronder(`FAUTE D'ORDRE, ${chemin} importe ${cible} qui n'est pas encore place`);
        return "";
      }
      const noms = dedans
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const n of noms) {
        if (!exportsDe.get(cible).includes(n)) {
          gronder(`FAUTE, ${chemin} importe ${n} que ${cible} n'exporte pas`);
        }
      }
      entetes.push(`  const { ${noms.join(", ")} } = ${sceau(cible)};`);
      return "";
    }
  );

  // Un import sans accolades ne servirait qu'a un effet de bord. Je n'en ai
  // aucun, et j'aime mieux le refuser que le laisser passer en silence.
  if (/^[ \t]*import\s+["']/m.test(js)) {
    gronder(`FAUTE, ${chemin} porte un import a effet de bord, non gere`);
  }

  js = js.replace(/^([ \t]*)export\s+(async\s+)?(const|let|var|function|class)\b/gm, "$1$2$3");

  const rendus = exportsDe.get(chemin);
  const rendu = rendus.length ? `\n  return { ${rendus.join(", ")} };\n` : "\n";

  morceaux.push(
    `/* ===== ${chemin} ===== */\n` +
      `const ${sceau(chemin)} = (function () {\n` +
      (entetes.length ? entetes.join("\n") + "\n" : "") +
      js.trim() +
      rendu +
      `})();\n`
  );
  placees.add(chemin);
}

// ---------------------------------------------------------------------------
// 3. INJECTION DANS LE HTML
// ---------------------------------------------------------------------------

const html = readFileSync(join(PUBLIC, "index.html"), "utf-8");
const BALISE = '<script type="module" src="./app.js"></script>';
if (!html.includes(BALISE)) {
  console.log("  FAUTE, la balise script attendue est absente de index.html");
  process.exit(1);
}

const code = morceaux.join("\n");
// Un `</script>` a l'interieur d'une chaine de caracteres fermerait la balise
// hote. Aucun de mes modules n'en contient aujourd'hui, la parade est ecrite
// pour le jour ou l'un d'eux en contiendra.
const codeSur = code.replace(/<\/script>/gi, "<\\/script>");

/** LES DEUX OFFRES, SORTIES DU MEME CODE ET DU MEME NOYAU.
 *  Un seul mot les separe, et il est pose ici et nulle part ailleurs. Deux
 *  sources auraient derive, et c'est la version gratuite, celle que les gens
 *  essaient, qui aurait fini par etre la moins soignee. */
const OFFRES = [
  { cle: "complet", fichier: "steady-pitch.html" },
  { cle: "demo", fichier: "steady-pitch-demo.html" },
];

mkdirSync(SORTIE, { recursive: true });

// ---------------------------------------------------------------------------
// 4. CONTROLES PAR MACHINE, avant de se rejouir
// ---------------------------------------------------------------------------

if (/^\s*import\s/m.test(code)) gronder("FAUTE, un import survit a l'enveloppement");
if (/^\s*export\s/m.test(code)) gronder("FAUTE, un export survit a l'enveloppement");

// ---------------------------------------------------------------------------
// 3 bis. LA DEMONSTRATION NE CONTIENT PAS CE QU'ELLE NE DONNE PAS
//
// Le premier jet posait un simple drapeau `__OFFRE` et filtrait a l'affichage.
// Les deux fichiers pesaient alors 147 481 et 147 478 octets, trois octets
// d'ecart, parce que **les trente exercices etaient dans les deux**. Changer
// un mot dans un editeur de texte ouvrait tout. Ce n'etait pas une limite,
// c'etait une politesse.
//
// Un mur qu'on franchit en editant un mot n'est pas un mur, et le vendre comme
// tel serait malhonnete envers celui qui paie. Le tableau du curriculum est
// donc RECRIT au moment de l'emballage, filtre au niveau 1, et les
// vingt-cinq autres exercices ne sont tout simplement pas dans le fichier.
//
// Le filtre a l'affichage reste, ceinture et bretelles. Il ne coute rien et il
// rend la demonstration coherente meme si ce decoupage change un jour.
// ---------------------------------------------------------------------------
const { CURRICULUM } = await import(
  "file:///" + join(ICI, "..", "noyau-justesse", "exercices.ts").replace(/\\/g, "/")
);
const MOTIF_CURRICULUM = /const CURRICULUM\s*=\s*\[[\s\S]*?\n\];/;
if (!MOTIF_CURRICULUM.test(codeSur)) {
  gronder("FAUTE, le tableau du curriculum est introuvable dans le code emballe");
}

function pourOffre(js, cle) {
  if (cle !== "demo") return js;
  const garde = CURRICULUM.filter((e) => e.niveau === 1);
  if (garde.length === 0 || garde.length === CURRICULUM.length) {
    gronder(`FAUTE, le filtre de demonstration garde ${garde.length} exercices sur ${CURRICULUM.length}`);
  }
  return js.replace(MOTIF_CURRICULUM,
    "const CURRICULUM = " + JSON.stringify(garde, null, 1) + ";");
}

const rendus = [];
for (const offre of OFFRES) {
  const tete = `<script>globalThis.__OFFRE = ${JSON.stringify(offre.cle)};</script>\n`;
  const corps = pourOffre(codeSur, offre.cle);
  const page = html.replace(BALISE, tete + `<script type="module">\n${corps}\n</script>`);

  // LE CONTROLE QUI COMPTE, ET SON PREMIER JET ETAIT FAUX.
  //
  // Je cherchais d'abord chaque identifiant et chaque titre paye dans le texte
  // livre. Il a crie quatre fuites, et il avait tort les quatre fois, les
  // titres `Par tierces`, `La sensible` et `L'octave` existent AUSSI dans les
  // curriculums d'intervalles et de tenues, qui sont livres avec la
  // demonstration en toute legitimite. Un controle approximatif qui crie au
  // loup finit par se faire desactiver, ce qui est pire que pas de controle.
  //
  // On relit donc le tableau REELLEMENT ecrit dans le fichier, et on le compare
  // exactement a ce qu'il devait contenir. Plus d'a-peu-pres, plus de faux cri.
  if (offre.cle === "demo") {
    const bloc = page.match(/const CURRICULUM = (\[[\s\S]*?\n\]);/);
    if (!bloc) {
      gronder("FAUTE, le tableau du curriculum est illisible dans la demonstration");
    } else {
      const livres = JSON.parse(bloc[1]).map((e) => e.id).sort();
      const dus = CURRICULUM.filter((e) => e.niveau === 1).map((e) => e.id).sort();
      if (livres.join(",") !== dus.join(",")) {
        gronder(`FAUTE, la demonstration livre ${livres.length} exercices au lieu de ${dus.length}`);
      }
      controles.push(`demonstration, ${livres.length} exercices livres sur ${CURRICULUM.length}, `
        + `les ${CURRICULUM.length - livres.length} autres absents du fichier`);
    }
  }

  for (const motif of [/\ssrc\s*=\s*["'](?!data:)/i, /<link\b/i, /@import\b/i]) {
    if (motif.test(page)) gronder(`FAUTE, ${offre.fichier} garde une reference exterieure, ${motif}`);
  }
  // L'offre doit etre lisible dans le fichier livre. Sans ce controle, une
  // faute de frappe dans la balise donnerait deux fichiers COMPLETS, et je
  // vendrais ce que je donne.
  if (!page.includes(`globalThis.__OFFRE = "${offre.cle}"`)) {
    gronder(`FAUTE, ${offre.fichier} ne porte pas son offre`);
  }
  rendus.push({ ...offre, page, octets: Buffer.byteLength(page, "utf-8") });
}

const nbExports = ORDRE.reduce((a, c) => a + exportsDe.get(c).length, 0);

console.log("EMBALLAGE EN UN SEUL FICHIER");
console.log("-".repeat(62));
for (const chemin of ORDRE) {
  console.log(`  ${chemin.padEnd(32)} ${String(exportsDe.get(chemin).length).padStart(3)} export(s)`);
}
console.log("-".repeat(62));
console.log(`  ${ORDRE.length} modules enveloppes, ${nbExports} exports cables et verifies`);

if (fautes > 0) {
  console.log(`  ${fautes} FAUTE(S), aucun fichier n'est ecrit.`);
  process.exit(1);
}

for (const r of rendus) {
  writeFileSync(join(SORTIE, r.fichier), r.page, "utf-8");
  console.log(`  ${r.fichier.padEnd(26)} ${String(r.octets).padStart(7)} octets, offre ${r.cle}`);
}
for (const c of controles) console.log("  " + c);
console.log("  autonomes, aucune ressource exterieure, s'ouvrent par file://");
