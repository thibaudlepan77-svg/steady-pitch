/**
 * pitch.ts - LE DETECTEUR DE HAUTEUR, EN TYPESCRIPT, POUR LE NAVIGATEUR.
 * Agent N4, 2026-08-28 (cycle 12).
 *
 * POURQUOI CE FICHIER EXISTE.
 * Sur iOS et Android, la detection est rendue par `react-native-pitchy`, un
 * coeur C++ que je ne fais qu'appeler. Dans un NAVIGATEUR il n'y a pas de
 * coeur C++, il n'y a que du JavaScript. Le web est la seule caisse qui coute
 * zero et qui paie en jours plutot qu'en mois, voir
 * `cerveau/recherche/rails-zero-euro-2026-08-28.md`, donc il faut ce fichier.
 *
 * CE QU'IL EST, EXACTEMENT.
 * Un portage FIDELE de `pitchy::yinDetect`, c'est-a-dire de `cpp/yin-fft.cpp`
 * du depot rnheroes/react-native-pitchy, licence MIT, lu le 2026-08-25. Il
 * passe par le meme intermediaire que toutes mes mesures, le portage Python
 * `cerveau/outils/pitch-sim.py`, sur lequel reposent mes 77 decisions justes
 * sur 77 voix reelles.
 *
 * CE QUI LE PROUVE, ET C'EST LA SEULE CHOSE QUI COMPTE.
 * `test-pitch.ts` rejoue 326 tampons de 2048 echantillons, dont 321 pris dans
 * de VRAIES voix chantees et 5 fabriques muets, et compare hauteur et
 * confiance a la reference Python nombre par nombre. Un portage non mesure
 * contre sa reference est une reecriture au hasard.
 *
 * UNE DIFFERENCE ASSUMEE AVEC LA REFERENCE PYTHON, ET ELLE VA DANS LE BON SENS.
 * Python utilisait la FFT de numpy comme substitut. Ici la FFT est ecrite a la
 * main, en radix-2 iteratif, ce qui est EXACTEMENT ce que fait le C++ d'origine.
 * Ce fichier est donc plus proche de la source que ne l'etait ma reference.
 *
 * ZERO DEPENDANCE, comme tout le reste du noyau.
 */

// ---------------------------------------------------------------------------
// 1. FFT RADIX-2, ecrite a la main.
// ---------------------------------------------------------------------------

/** Plus petite puissance de deux superieure ou egale a n. */
export function prochainePuissanceDeDeux(n        )         {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * FFT complexe en place, Cooley-Tukey radix-2 par decimation en temps.
 * `re` et `im` font la meme longueur, qui DOIT etre une puissance de deux.
 * `inverse` applique la transformation inverse SANS normaliser, la division
 * par n est faite par l'appelant, comme dans la plupart des implementations.
 */
export function fft(re              , im              , inverse         )       {
  const n = re.length;
  if (n <= 1) return;

  // Permutation par inversion de bits.
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }

  const signe = inverse ? 1 : -1;
  for (let longueur = 2; longueur <= n; longueur <<= 1) {
    const angle = (signe * 2 * Math.PI) / longueur;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    for (let i = 0; i < n; i += longueur) {
      let curRe = 1.0;
      let curIm = 0.0;
      const demi = longueur >> 1;
      for (let j = 0; j < demi; j++) {
        const uRe = re[i + j];
        const uIm = im[i + j];
        const vRe = re[i + j + demi] * curRe - im[i + j + demi] * curIm;
        const vIm = re[i + j + demi] * curIm + im[i + j + demi] * curRe;
        re[i + j] = uRe + vRe;
        im[i + j] = uIm + vIm;
        re[i + j + demi] = uRe - vRe;
        im[i + j + demi] = uIm - vIm;
        const nRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nRe;
      }
    }
  }
}

/**
 * Autocorrelation par FFT, la sequence exacte du C++.
 * Bourrage de zeros jusqu'a `tailleFft`, FFT, spectre de puissance, FFT
 * inverse. Rend la partie reelle.
 */
export function autocorrelationParFft(buf                         ,
                                      tailleFft        )               {
  const re = new Float64Array(tailleFft);
  const im = new Float64Array(tailleFft);
  const n = Math.min(buf.length, tailleFft);
  for (let i = 0; i < n; i++) re[i] = buf[i];

  fft(re, im, false);

  // Spectre de puissance, X * conj(X), donc reel et positif.
  for (let i = 0; i < tailleFft; i++) {
    const p = re[i] * re[i] + im[i] * im[i];
    re[i] = p;
    im[i] = 0.0;
  }

  fft(re, im, true);
  for (let i = 0; i < tailleFft; i++) re[i] /= tailleFft;
  return re;
}

// ---------------------------------------------------------------------------
// 2. YIN, portage fidele
// ---------------------------------------------------------------------------

/** Constantes du C++, conservees telles quelles. Ne pas les regler ici sans
 *  relancer `test-pitch.ts`, elles decident de toutes mes mesures. */
export const YIN_SEUIL_DEFAUT = 0.13;
export const YIN_BIAIS = 0.15;
export const YIN_FREQ_MIN = 65.41;
export const VOLUME_MIN_DEFAUT = -60.0;

                            
                                                          
             
                            
                    
 

/**
 * Port de `pitchy::yinDetect`. Meme entree, meme sortie, memes constantes.
 * `buf` est une fenetre d'echantillons entre -1 et 1.
 */
export function yinDetect(
  buf                         ,
  frequenceEchantillonnage = 44100.0,
  volumeMin = VOLUME_MIN_DEFAUT,
  seuil = YIN_SEUIL_DEFAUT,
)            {
  const taille = buf.length;
  if (taille < 4) return { hz: -1.0, confiance: 0.0 };

  // Porte de volume. Sous ce niveau, on ne cherche pas de note dans du bruit
  // de fond, ce qui evite de faire clignoter l'ecran dans le calme.
  let somme = 0.0;
  for (let i = 0; i < taille; i++) somme += buf[i] * buf[i];
  const rms = Math.sqrt(somme / taille);
  if (20.0 * Math.log10(rms + 1e-10) < volumeMin) {
    return { hz: -1.0, confiance: 0.0 };
  }

  const tauMax = Math.floor(taille / 2);
  const tailleFft = prochainePuissanceDeDeux(taille * 2);
  const acf = autocorrelationParFft(buf, tailleFft);

  const r0 = acf[0];

  // Difference d, puis difference moyenne cumulee normalisee dPrime.
  const d = new Float64Array(tauMax);
  for (let tau = 0; tau < tauMax; tau++) {
    const v = 2.0 * r0 - 2.0 * acf[tau];
    d[tau] = v < 0 ? 0.0 : v;
  }
  d[0] = 0.0;

  const dPrime = new Float64Array(tauMax);
  dPrime.fill(1.0);
  let cumul = d[0];
  for (let tau = 1; tau < tauMax; tau++) {
    cumul += d[tau];
    dPrime[tau] = cumul > 0 ? (d[tau] * tau) / cumul : 1.0;
  }

  // Biais qui favorise les tau courts, exactement la formule du C++.
  const biaise = new Float64Array(tauMax);
  const denom = tauMax - 1;
  for (let tau = 0; tau < tauMax; tau++) {
    const biais = ((denom - tau) / denom) * YIN_BIAIS;
    biaise[tau] = dPrime[tau] - biais;
  }

  const tauLimite = Math.min(
    Math.trunc(frequenceEchantillonnage / YIN_FREQ_MIN), tauMax);

  // Selection multi-candidats par lobes sous le seuil.
  let meilleurTau = -1;
  let meilleureValeur = Infinity;
  let tau = 2;
  while (tau < tauLimite) {
    if (biaise[tau] - seuil < 0) {
      let tauLobe = tau;
      let valLobe = biaise[tau];
      while (tau < tauLimite && biaise[tau] - seuil < 0) {
        if (biaise[tau] < valLobe) {
          valLobe = biaise[tau];
          tauLobe = tau;
        }
        tau++;
      }
      if (valLobe < meilleureValeur) {
        meilleureValeur = valLobe;
        meilleurTau = tauLobe;
      }
    } else {
      tau++;
    }
  }

  // Repli quand aucun lobe ne passe sous le seuil. Le minimum global doit
  // quand meme etre franchement marque, sinon on declare qu'on n'entend rien.
  if (meilleurTau < 0) {
    if (tauLimite <= 2) return { hz: -1.0, confiance: 0.0 };
    let j = 2;
    let minVal = biaise[2];
    for (let k = 3; k < tauLimite; k++) {
      if (biaise[k] < minVal) { minVal = biaise[k]; j = k; }
    }
    if (minVal >= 0.5) return { hz: -1.0, confiance: 0.0 };
    meilleurTau = j;
  }

  // Interpolation parabolique sur la CMND NON biaisee. Le biais sert a
  // choisir le lobe, jamais a affiner la position dans le lobe.
  let affine = meilleurTau;
  if (meilleurTau > 0 && meilleurTau < tauMax - 1) {
    const x0 = dPrime[meilleurTau - 1];
    const x1 = dPrime[meilleurTau];
    const x2 = dPrime[meilleurTau + 1];
    const a = (x0 + x2 - 2.0 * x1) / 2.0;
    if (Math.abs(a) > 1e-12) {
      const delta = -((x2 - x0) / 2.0) / (2.0 * a);
      if (Math.abs(delta) < 1.0) affine = meilleurTau + delta;
    }
  }

  if (affine <= 0) return { hz: -1.0, confiance: 0.0 };

  const brut = dPrime[meilleurTau];
  const confiance = 1.0 - Math.min(Math.max(brut, 0.0), 1.0);
  return { hz: frequenceEchantillonnage / affine, confiance };
}

// ---------------------------------------------------------------------------
// 3. L'AFFINAGE, AJOUTE LE 2026-08-31 (cycle 16)
// ---------------------------------------------------------------------------

/**
 * POURQUOI CETTE FONCTION EXISTE, ET POURQUOI ELLE EST A COTE ET NON DEDANS.
 *
 * LE DEFAUT, MESURE. `yinDetect` lit systematiquement TROP HAUT, de un cent
 * environ sur un la 440 et de pres de trente cents sur un son grave. Le biais
 * est toujours positif, jamais negatif, ce qui designe une cause et pas du
 * bruit.
 *
 * LA CAUSE. L'autocorrelation par FFT est BIAISEE. A l'ecart tau elle ne somme
 * que les N moins tau echantillons qui se recouvrent, et elle divise quand
 * meme par N. Elle decroit donc avec tau pour une raison purement arithmetique.
 * Or la difference de YIN s'ecrit ici `2 r0 moins 2 acf`, formule qui suppose
 * les deux termes de puissance egaux a r0. Ils ne le sont pas, la difference
 * est donc surestimee d'autant plus que tau est grand, le minimum se deplace
 * vers les tau COURTS, et un tau court veut dire une frequence haute. Cela
 * explique le sens du biais et le fait qu'il grossisse dans le grave, ou tau
 * est grand.
 *
 * POURQUOI JE NE CORRIGE PAS `yinDetect`. C'est un portage fidele de
 * `pitchy::yinDetect`, et `test-pitch.ts` compare 326 tampons a la reference
 * Python au dix-millieme de cent pres. Ce banc ne mesure pas la justesse, il
 * mesure la FIDELITE du portage, et c'est sa raison d'etre. Le corriger dedans
 * ferait passer 326 epreuves au rouge et me priverait du seul controle qui
 * m'avertirait d'une derive future. La correction vient donc APRES, elle a son
 * propre banc, et elle se mesure en cents contre des frequences connues.
 *
 * CE QU'ELLE FAIT. Elle repart de l'estimation grossiere, et recalcule la
 * VRAIE difference de YIN sur une poignee d'ecarts autour d'elle, avec une
 * fenetre de comparaison de longueur CONSTANTE. Longueur constante veut dire
 * que le biais ci-dessus ne peut plus exister, chaque tau est evalue sur
 * exactement le meme nombre de termes.
 */

/**
 * Le rayon de recherche, en PART DE LA PERIODE et non en echantillons.
 *
 * PREMIERE VERSION, TROIS ECHANTILLONS, ET SON ECHEC MESURE. Le biais a
 * corriger vaut jusqu'a trente cents, ce qui fait NEUF echantillons sur un mi
 * grave et moins d'un sur un la aigu. Un rayon fixe rate donc exactement les
 * cas pour lesquels il a ete ecrit, et le banc l'a montre, la sinusoide a
 * 82 Hz ressortait inchangee.
 *
 * Quatre pour cent de la periode couvrent soixante-dix cents de part et
 * d'autre, largement de quoi rattraper le pire biais mesure. Et cela reste
 * loin du minimum concurrent le plus proche, qui est a la moitie ou au double
 * de la periode, donc l'affinage ne peut pas changer de note en chemin.
 */
const AFFINAGE_PART = 0.04;
const AFFINAGE_RAYON_MIN = 3;

/**
 * Affine une hauteur deja trouvee. Rend la hauteur affinee, ou la hauteur
 * d'entree telle quelle quand elle sort de ce que la fenetre permet de mesurer.
 */
export function affinerHauteur(
  buf                                        ,
  hz        ,
  frequenceEchantillonnage = 44100.0,
)         {
  if (hz <= 0) return hz;

  const n = buf.length;
  const tauCentre = frequenceEchantillonnage / hz;
  // La fenetre de comparaison. Constante pour tous les tau, c'est tout
  // l'objet de cette fonction.
  const largeur = n >> 1;
  const rayon = Math.max(AFFINAGE_RAYON_MIN, Math.round(tauCentre * AFFINAGE_PART));
  const tauMin = Math.max(1, Math.floor(tauCentre) - rayon);
  const tauMax = Math.min(n - largeur, Math.ceil(tauCentre) + rayon);
  if (tauMax - tauMin < 2) return hz;

  const d = new Float64Array(tauMax - tauMin + 1);
  for (let tau = tauMin; tau <= tauMax; tau++) {
    let somme = 0.0;
    for (let j = 0; j < largeur; j++) {
      const ecart = buf[j] - buf[j + tau];
      somme += ecart * ecart;
    }
    d[tau - tauMin] = somme;
  }

  let creux = 0;
  for (let i = 1; i < d.length; i++) if (d[i] < d[creux]) creux = i;

  // Un minimum sur un bord n'est pas un minimum, c'est une pente qui sort de
  // la fenetre. On rend alors l'estimation d'origine plutot qu'un chiffre
  // fabrique par une interpolation sans point a droite ou a gauche.
  if (creux === 0 || creux === d.length - 1) return hz;

  let tauAffine = tauMin + creux;
  const a = (d[creux - 1] + d[creux + 1] - 2 * d[creux]) / 2;
  if (Math.abs(a) > 1e-12) {
    const delta = -((d[creux + 1] - d[creux - 1]) / 2) / (2 * a);
    if (Math.abs(delta) < 1.0) tauAffine += delta;
  }

  return tauAffine > 0 ? frequenceEchantillonnage / tauAffine : hz;
}
