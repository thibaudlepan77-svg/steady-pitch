// Mesure la justesse du detecteur sur des signaux synthetiques.
// node test-justesse.js
//
// Le detecteur vit dans app.html, dans une portee de module. On le sort du
// fichier publie plutot que d'en garder une copie, pour que ce test mesure
// toujours ce qui est reellement livre.

const fs = require('fs');
const path = require('path');

const SR = 44100;
const FENETRE = 2048; // la taille utilisee par le produit, voir TAILLE_FENETRE

function chargerDetecteur() {
  const src = fs.readFileSync(path.join(__dirname, 'app.html'), 'utf8');
  const debut = src.indexOf('const M$pitch');
  const fin = src.indexOf('const M$micro_web');
  if (debut < 0 || fin < 0) {
    throw new Error('bornes du module introuvables dans app.html');
  }
  const code = src.slice(debut, fin).replace('const M$pitch', 'var M$pitch');
  return new Function(code + '; return M$pitch;')();
}

function signal(f0, harmoniques, n = FENETRE) {
  const buf = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (const [rang, amplitude] of harmoniques) {
      v += amplitude * Math.sin(2 * Math.PI * f0 * rang * i / SR);
    }
    buf[i] = v * 0.5;
  }
  return buf;
}

const cents = (hz, reference) => 1200 * Math.log2(hz / reference);

// Une voix grave porte plus d'energie dans son harmonique 2 que dans sa
// fondamentale. C'est le cas qui fait monter un detecteur naif d'une octave.
const VOIX_GRAVE = [[1, 0.2], [2, 1.0], [3, 0.75], [4, 0.35]];
const SINUS_PUR = [[1, 1.0]];

const NOTES = [
  ['Do2', 65.41], ['Mi2', 82.41], ['Sol2', 98.00], ['La2', 110.00],
  ['Do3', 130.81], ['La3', 220.00], ['La4', 440.00], ['La5', 880.00],
];

const pitch = chargerDetecteur();
let echecs = 0;

function verifier(condition, message) {
  if (!condition) { echecs++; console.log('  ECHEC  ' + message); }
}

console.log(`Fenetre ${FENETRE} echantillons a ${SR} Hz, plancher declare ${pitch.YIN_FREQ_MIN} Hz\n`);
console.log('note  Hz       harmoniques     sinus pur');

for (const [nom, hz] of NOTES) {
  const riche = pitch.yinDetect(signal(hz, VOIX_GRAVE), SR);
  const pur = pitch.yinDetect(signal(hz, SINUS_PUR), SR);
  const ecartRiche = cents(riche.hz, hz);
  const ecartPur = cents(pur.hz, hz);
  const signe = (x) => ((x >= 0 ? '+' : '') + x.toFixed(1) + ' cents');
  console.log(
    nom.padEnd(6) + String(hz).padEnd(9) +
    signe(ecartRiche).padStart(11) + signe(ecartPur).padStart(14)
  );

  // Sur un son reel, on veut mieux que six cents, ce qui est sous le seuil
  // ou une oreille entrainee entend un probleme.
  verifier(Math.abs(ecartRiche) < 6, `${nom} riche en harmoniques, ${ecartRiche.toFixed(1)} cents`);
  // Et surtout, jamais l'octave au-dessus, meme quand la fondamentale est faible.
  verifier(Math.abs(ecartRiche - 1200) > 100, `${nom} rendu une octave trop haut`);
}

console.log('\nBords');
for (const hz of [41.20, 49.00, 55.00, 61.74]) {
  const r = pitch.yinDetect(signal(hz, VOIX_GRAVE), SR);
  console.log(`  ${String(hz).padEnd(6)} Hz, sous le plancher -> ${r.hz < 0 ? 'se tait' : r.hz.toFixed(2) + ' Hz'}`);
  verifier(r.hz < 0, `${hz} Hz aurait du rester muet`);
}

const silence = pitch.yinDetect(new Float64Array(FENETRE), SR);
console.log(`  silence                    -> ${silence.hz < 0 ? 'se tait' : silence.hz.toFixed(2) + ' Hz'}`);
verifier(silence.hz < 0, 'le silence a produit une note');

const bruit = new Float64Array(FENETRE);
for (let i = 0; i < FENETRE; i++) bruit[i] = Math.random() * 2 - 1;
const surBruit = pitch.yinDetect(bruit, SR);
console.log(`  bruit blanc                -> ${surBruit.hz < 0 ? 'se tait' : surBruit.hz.toFixed(2) + ' Hz'}`);
verifier(surBruit.hz < 0, 'le bruit blanc a produit une note');

console.log(echecs === 0 ? '\nTout passe.' : `\n${echecs} echec(s).`);
process.exit(echecs === 0 ? 0 : 1);
