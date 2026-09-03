/**
 * micro-web.js - LE SEUL FICHIER DE LA VERSION WEB QUI TOUCHE AU MATERIEL.
 * Agent N4, 2026-08-28 (cycle 12).
 *
 * Il joue exactement le role de `src/micro.ts` cote application mobile, et il
 * est ecrit avec la meme discipline. Il ne juge rien, il ne nomme aucune note,
 * il ne connait aucun exercice. Il ouvre un microphone, accumule des fenetres,
 * les passe au detecteur et rend un tableau de trames au noyau, qui decide.
 *
 * QUATRE PIEGES DU NAVIGATEUR, ET LE QUATRIEME M'A COUTE UNE SEANCE ENTIERE.
 *
 * 1. LA FREQUENCE D'ECHANTILLONNAGE N'EST PAS 44 100 Hz. Le navigateur prend
 *    celle du materiel. Mesure du 2026-08-28 sur cette machine, 48 000 Hz,
 *    donc 42,67 ms par trame et non 46,4. Toutes mes mesures de justesse sont
 *    faites a 44 100, et ma duree d'attaque est exprimee en millisecondes. Une
 *    constante en dur ici fausserait le reglage de neuf pour cent. On lit donc
 *    la frequence REELLE et on en deduit la duree de trame.
 *
 * 2. LE NAVIGATEUR VEUT AMELIORER LE SON, ET CELA DETRUIRAIT LA MESURE.
 *    Suppression de bruit, controle automatique de gain, annulation d'echo,
 *    concus pour la parole au telephone. Ils ecrasent la dynamique et
 *    deforment le spectre. Les trois sont coupes explicitement.
 *
 * 3. LE CONTEXTE AUDIO DEMARRE SUSPENDU. Un navigateur refuse de produire du
 *    son avant un geste de l'utilisateur. On le reprend a la preparation, qui
 *    part toujours d'un clic.
 *
 * 4. UN CONTEXTE AUDIO PAR TENTATIVE FAIT PERDRE LE DEBUT DE LA TENTATIVE.
 *    C'est le defaut que la premiere seance jouee en navigateur a revele, le
 *    2026-08-28. Ma premiere version creait un AudioContext a chaque ecoute
 *    et le fermait a la fin. Resultat mesure, QUATRE tentatives sur NEUF
 *    rendaient ZERO trame en cinq cents millisecondes, et le produit
 *    repondait "rien entendu" a quelqu'un qui chantait juste. Le pire verdict
 *    possible, celui qui accuse l'utilisateur d'un defaut du logiciel.
 *    Le contexte et le worklet sont desormais crees UNE FOIS et gardes
 *    vivants toute la seance. Une ecoute ne fait plus que brancher la source
 *    et vider un tampon. Aucune relecture ne pouvait trouver ce defaut, seule
 *    une seance jouee pour de vrai.
 */

import { yinDetect, affinerHauteur } from "./noyau/pitch.js";

/** La taille de fenetre du produit. La MEME que sur mobile, 2048. Toutes mes
 *  mesures de justesse sont faites sur cette taille et sur aucune autre. */
export const TAILLE_FENETRE = 2048;

/** Le niveau sous lequel on ne cherche pas de note. Le meme qu'en mobile. */
export const VOLUME_MIN = -60;

/** Le code du worklet, ecrit ici plutot que dans un fichier a part, pour que
 *  le site reste un dossier de fichiers statiques sans surprise de chemin. */
const CODE_WORKLET = `
class Collecteur extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.taille = options.processorOptions.taille;
    this.tampon = new Float32Array(this.taille);
    this.remplis = 0;
  }
  process(entrees) {
    const canal = entrees[0] && entrees[0][0];
    if (!canal) return true;
    for (let i = 0; i < canal.length; i++) {
      this.tampon[this.remplis++] = canal[i];
      if (this.remplis === this.taille) {
        this.port.postMessage(this.tampon.slice());
        this.remplis = 0;
      }
    }
    return true;
  }
}
registerProcessor('collecteur', Collecteur);
`;

// ---------------------------------------------------------------------------
// L'ETAT PERSISTANT. Cree une fois, garde vivant. Voir le piege n4.
// ---------------------------------------------------------------------------
let contexte = null;
let noeud = null;
let mode = null;
let fluxMicro = null;
/** Le receveur courant des fenetres. Change a chaque ecoute, ce qui evite de
 *  brancher et debrancher le worklet et de perdre le debut du son. */
let receveur = null;

/**
 * Prepare le contexte audio et le worklet, une seule fois.
 * `avecMicro` a faux prepare la chaine sans demander le microphone, ce qui
 * sert au banc en navigateur pilote, qui n'a pas de microphone.
 */
export async function preparer(avecMicro = true) {
  if (contexte && contexte.state !== "closed") {
    if (contexte.state === "suspended") await contexte.resume();
    if (avecMicro && !fluxMicro) await brancherMicro();
    return { frequence: contexte.sampleRate, mode };
  }

  contexte = new (window.AudioContext || window.webkitAudioContext)();
  if (contexte.state === "suspended") await contexte.resume();

  try {
    const url = URL.createObjectURL(
      new Blob([CODE_WORKLET], { type: "application/javascript" }));
    await contexte.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    noeud = new AudioWorkletNode(contexte, "collecteur", {
      numberOfInputs: 1,
      numberOfOutputs: 0,
      processorOptions: { taille: TAILLE_FENETRE },
    });
    noeud.port.onmessage = (e) => { if (receveur) receveur(e.data); };
    mode = "worklet";
  } catch {
    // REPLI. Certains navigateurs n'ont pas de worklet. Le noeud de traitement
    // est deprecie mais il fonctionne partout, et un produit qui refuse de
    // s'ouvrir vaut moins qu'un produit qui utilise une vieille API.
    mode = "repli";
    noeud = contexte.createScriptProcessor(TAILLE_FENETRE, 1, 1);
    noeud.onaudioprocess = (e) => {
      if (receveur) receveur(e.inputBuffer.getChannelData(0).slice());
    };
    // Le noeud deprecie ne s'execute que s'il est relie a une sortie. On le
    // relie a un gain nul, sinon l'utilisateur s'entendrait dans ses enceintes
    // et le microphone reprendrait sa propre sortie.
    const muet = contexte.createGain();
    muet.gain.value = 0;
    noeud.connect(muet);
    muet.connect(contexte.destination);
  }

  if (avecMicro) await brancherMicro();
  await degourdir();
  return { frequence: contexte.sampleRate, mode, msDeChauffe };
}

/** Combien de millisecondes la premiere ouverture du materiel a coute. Zero
 *  ensuite. Publie par `diagnostic` pour que ce ne soit jamais une croyance. */
let msDeChauffe = 0;

/**
 * ATTENDRE QUE LE GRAPHE BATTE VRAIMENT, ET NON QU'IL SOIT CONSTRUIT.
 *
 * LE DEFAUT, MESURE AU NAVIGATEUR PILOTE LE 2026-08-28. La toute premiere
 * ecoute de la vie du navigateur a rendu ZERO trame en sept cents
 * millisecondes, alors que `preparer` avait deja rendu la main. Les ecoutes
 * suivantes, et meme la premiere apres un rechargement de page, n'en perdent
 * que quatre-vingt-cinq. Ce n'est donc pas le chargement du worklet, c'est
 * l'OUVERTURE DU MATERIEL AUDIO, qui n'arrive qu'une fois par processus.
 *
 * POURQUOI JE NE LE LAISSE PAS PASSER. C'est une fois par utilisateur, et
 * c'est exactement la premiere note qu'il chante. Mon marche entier repose
 * sur le fait que les concurrents n'entendent pas leurs acheteurs, et le
 * premier avis d'un acheteur qui n'a pas ete entendu dit toujours la meme
 * chose. Sept cents millisecondes au mauvais moment coutent plus cher qu'une
 * erreur de dix cents pendant une heure.
 *
 * LA PARADE. Une source SILENCIEUSE est branchee sur le collecteur, et on
 * attend une vraie trame avant de rendre la main. Elle est silencieuse parce
 * qu'un utilisateur ne doit rien entendre, et il faut quand meme une source,
 * car un noeud sans entree branchee n'est pas cadence par le navigateur.
 */
async function degourdir() {
  if (msDeChauffe > 0 || !noeud) return;
  const depart = performance.now();

  const silence = contexte.createConstantSource();
  silence.offset.value = 0;
  silence.connect(noeud);
  silence.start();

  await new Promise((resoudre) => {
    // Un delai de garde, parce qu'un materiel muet ne doit pas bloquer
    // l'ouverture de la seance. Mieux vaut demarrer sourd que ne pas demarrer.
    const garde = setTimeout(fini, 1500);
    const precedent = receveur;
    function fini() {
      clearTimeout(garde);
      receveur = precedent;
      try { silence.stop(); silence.disconnect(); } catch { /* deja arrete */ }
      resoudre();
    }
    receveur = () => fini();
  });

  msDeChauffe = Math.round(performance.now() - depart);
}

async function brancherMicro() {
  fluxMicro = await navigator.mediaDevices.getUserMedia({
    audio: {
      // LES TROIS QUI DETRUIRAIENT LA MESURE. Voir le piege n2.
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 1,
    },
  });
  contexte.createMediaStreamSource(fluxMicro).connect(noeud);
}

/**
 * Ouvre une ecoute. Rend un objet dont `arreter` clot la tentative et rend les
 * trames accumulees, exactement comme la version mobile.
 *
 * `surTrame` permet a l'ecran de bouger le curseur en direct, sans que ce
 * fichier sache ce qu'est un curseur.
 *
 * `sourceDeTest`, une frequence en hertz, remplace le microphone par un son
 * de synthese riche. Voir la note sur le banc plus bas.
 */
export async function ecouter(surTrame, sourceDeTest = null) {
  await preparer(sourceDeTest === null);

  const frequence = contexte.sampleRate;
  // LA DUREE D'UNE TRAME, DEDUITE ET NON SUPPOSEE. Voir le piege n1.
  const msParTrame = (TAILLE_FENETRE / frequence) * 1000;

  const trames = [];
  let vivant = true;
  const aArreter = [];

  // LE BANC EN NAVIGATEUR, ET POURQUOI IL VIT DANS LE FICHIER DE PRODUIT.
  // Ce fichier est le seul de la version web que je ne peux pas eprouver en
  // Node, faute d'AudioContext. Il faut donc l'eprouver DANS un navigateur, et
  // un navigateur pilote par machine n'a pas de microphone. En remplacant la
  // seule source par un son de frequence connue, tout le reste de la chaine
  // est parcouru pour de vrai, worklet compris, a la vraie frequence du
  // materiel. Ce que ce mode NE prouve PAS, et je le dis, c'est la capture
  // elle-meme, le gain d'entree et la latence du bus audio.
  if (sourceDeTest !== null) {
    // Un son HARMONIQUEMENT RICHE, pas une sinusoide. La mesure du 2026-08-28
    // montre que YIN lit une sinusoide jusqu'a trente cents trop haut dans le
    // grave. Un banc bati sur une sinusoide mesurerait ce biais au lieu de
    // mesurer la chaine audio.
    const melange = contexte.createGain();
    melange.gain.value = 0.28;
    for (let h = 1; h <= 6; h++) {
      const osc = contexte.createOscillator();
      osc.type = "sine";
      osc.frequency.value = sourceDeTest * h;
      const g = contexte.createGain();
      g.gain.value = 1 / h;
      osc.connect(g);
      g.connect(melange);
      osc.start();
      aArreter.push(osc);
    }
    melange.connect(noeud);
    aArreter.push({ stop: () => melange.disconnect() });
  }

  receveur = (echantillons) => {
    if (!vivant) return;
    const r = yinDetect(echantillons, frequence, VOLUME_MIN);
    // L'AFFINAGE, AJOUTE LE 2026-08-31. Le detecteur lit systematiquement trop
    // haut, d'un cent sur un la et de trente dans le grave, pour une raison
    // arithmetique expliquee dans `affinerHauteur`. Sans cette ligne le
    // moniteur de la page d'accueil et l'entrainement diraient deux nombres
    // differents sur la meme note tenue, et un eleve qui voit ca ne croit plus
    // aucun des deux.
    const trame = {
      hz: r.hz > 0 ? affinerHauteur(echantillons, r.hz, frequence) : r.hz,
      confiance: r.confiance,
    };
    trames.push(trame);
    if (surTrame) surTrame(trame);
  };

  return {
    frequence,
    msParTrame,
    mode,
    get nbTrames() { return trames.length; },
    async arreter() {
      vivant = false;
      receveur = null;
      for (const o of aArreter) { try { o.stop(); } catch { /* deja arrete */ } }
      // LE CONTEXTE RESTE VIVANT. C'est tout l'objet de la correction du
      // piege n4. Le fermer ici couterait le debut de la tentative suivante.
      return trames;
    },
  };
}

/** Libere le materiel. A appeler quand l'utilisateur quitte la seance, pas
 *  entre deux notes. Le voyant du microphone s'eteint ici et nulle part
 *  ailleurs, ce qui est aussi une question de confiance. */
export async function liberer() {
  receveur = null;
  if (fluxMicro) {
    for (const piste of fluxMicro.getTracks()) piste.stop();
    fluxMicro = null;
  }
  if (contexte && contexte.state !== "closed") {
    try { await contexte.close(); } catch { /* deja ferme */ }
  }
  contexte = null;
  noeud = null;
  mode = null;
  // La chauffe est un fait du CONTEXTE, pas du processus. Un contexte ferme
  // puis rouvert se rechauffe, donc le compteur repart. L'oublier ici ferait
  // sauter la parade a la seance suivante, en silence.
  msDeChauffe = 0;
}

/**
 * Le microphone est-il seulement accessible ici. Un site servi en clair, hors
 * de localhost, n'y a PAS droit, et le message d'erreur du navigateur ne le
 * dit pas clairement. Autant le dire nous-memes.
 */
export function diagnostic() {
  const secure = window.isSecureContext === true;
  const api = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  return {
    contexteSecurise: secure,
    apiPresente: api,
    utilisable: secure && api,
    prepare: !!contexte,
    frequence: contexte ? contexte.sampleRate : null,
    mode,
    msDeChauffe,
    raison: !api
      ? "ce navigateur n'expose pas l'acces au microphone"
      : !secure
        ? "le microphone exige une page servie en HTTPS, ou en local"
        : "",
  };
}
