/**
 * langues.ts, NOMS DE NOTES ET LOCALISATION.
 * Agent N4, 2026-08-25 (cycle 10, chantier 21). Aucune dependance.
 *
 * CE FICHIER REPOND A DEUX CHOSES MESUREES, PAS A UNE INTUITION.
 *
 * 1. UN GRIEF DE CONCURRENT, RELEVE AU CHANTIER 3. Un acheteur ecrit, sur un
 *    titre payant, "Fixed Do only! This is a total waste of money if you have to
 *    learn movable do. The stupid app only does fixed do." Il a paye et il
 *    demande un remboursement pour une option qui coute une journee.
 *    Le monde se partage en effet deux systemes de nommage, et un musicien
 *    formé dans l'un ne lit pas l'autre.
 *      SYLLABES FIXES, do re mi fa sol la si, ou do EST toujours ut. Pays
 *        latins, France, Italie, Espagne, Amerique latine, Russie.
 *      LETTRES, C D E F G A B. Pays anglophones et germanophones.
 *      DO MOBILE, les memes syllabes mais do designe la TONIQUE, quelle que
 *        soit la tonalite. C'est le systeme de l'enseignement Kodaly, donc
 *        celui de mon curriculum, et c'est celui que l'acheteur ci-dessus
 *        reclamait.
 *    PIEGE A NE PAS RATER, en allemand le SI se note H et non B, et B designe
 *    le si bemol. Un logiciel qui l'ignore affiche une fausse note a un
 *    musicien allemand, ce qui est pire que de ne pas traduire du tout.
 *
 * 2. UN CRITERE DE SELECTION D'APPLE, LU AU CHANTIER 20. Apple pondere
 *    explicitement la LOCALISATION dans le choix des applications qu'il met en
 *    avant, et la mise en avant editoriale est l'une des quatre portes
 *    d'acquisition, gratuite et ouverte aux inconnus. Mon produit a tres peu de
 *    texte, une trentaine de libelles, donc traduire est bon marche ici et
 *    couteux ailleurs. C'est exactement le genre d'asymetrie qu'il faut
 *    exploiter.
 */

// ---------------------------------------------------------------------------
// Les systemes de nommage des notes
// ---------------------------------------------------------------------------

                                                                            

/** Noms des douze degres chromatiques, du do au si, par systeme. */
const NOMS                                 = {
  // syllabes latines, do fixe
  syllabes: ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"],
  // lettres anglo-saxonnes
  lettres: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  // lettres allemandes, le si est H et le si bemol est B
  lettres_de: ["C", "Cis", "D", "Dis", "E", "F", "Fis", "G", "Gis", "A", "B", "H"],
  // do mobile, les syllabes designent des DEGRES et non des hauteurs
  mobile: ["Do", "Di", "Re", "Ri", "Mi", "Fa", "Fi", "Sol", "Si", "La", "Li", "Ti"],
};

/**
 * Nomme une note. `toniqueMidi` n'est utilise QUE par le systeme mobile, ou le
 * nom depend du degre dans la tonalite et non de la hauteur absolue.
 */
export function nommerNote(midi        , systeme               = "lettres",
                           toniqueMidi = 0)         {
  const m = Math.round(midi);
  // GARDE AJOUTEE AU CYCLE 11. Un systeme inconnu faisait planter la fonction
  // sur un tableau indefini, et un reglage enregistre par une version
  // precedente de l'app suffisait donc a faire tomber l'ecran entier. On
  // retombe silencieusement sur les lettres, qui sont le defaut.
  if (!NOMS[systeme]) systeme = "lettres";
  if (systeme === "mobile") {
    const degre = ((m - Math.round(toniqueMidi)) % 12 + 12) % 12;
    return NOMS.mobile[degre];
  }
  const octave = Math.floor(m / 12) - 1;
  return NOMS[systeme][((m % 12) + 12) % 12] + octave;
}

// ---------------------------------------------------------------------------
// Les libelles de l'interface
// ---------------------------------------------------------------------------

                                                             

export const LANGUES           = ["en", "fr", "es", "de", "it", "pt"];

/** Le systeme de nommage par defaut d'une langue, celui qu'un musicien de ce
 *  pays attend. Il reste modifiable dans les reglages, c'est un defaut, pas
 *  une contrainte. */
export const SYSTEME_PAR_DEFAUT                               = {
  en: "lettres",
  de: "lettres_de",
  fr: "syllabes",
  es: "syllabes",
  it: "syllabes",
  pt: "syllabes",
};

                 
                                                                           
                                                                             
                                                                               
         
                                                                          
                                                                        
                                                                          
                                          
                                            
                                 
                                                                          
                                                                            
                                                                         
                                                        
           
                                                                       
                                                                       
                                                                       
                                                           
                                                 
                                                                         
                                                                          
                                                                            
                                                                             
                                                                         
                                                                             
                                                                      
                         

                                 

export const TEXTES                        = {
  en: {
    titre: "Steady Pitch", chantez: "Sing this note", jouez: "Play this note",
    excellent: "Spot on", bien: "Good", juste: "In tune", faux: "Off",
    silence: "Nothing heard", trop_grave: "A little low", trop_aigu: "A little high",
    score: "Score", niveau: "Level", reessayer: "Try again", suivant: "Next",
    cents: "cents", choisir_voix: "I will sing", choisir_instrument: "I will play",
    progression: "Progress",
    sur: "out of",
    diese: "sharp",
    a_revoir: "Review this one",
    nouveau_niveau: "New level next time",
    ecart_moyen: "Average error",
    choisir_entree: "How do you want to work on your pitch",
    tessiture: "Your range",
    recommencer: "Start again",
    ecoute_en_cours: "Listening",
    details_techniques: "Technical details",
    hors_portee_grave: "This note is too low for the microphone",
    hors_portee_aigu: "This note is too high for the microphone",
    micro_refuse: "Steady Pitch needs your microphone. Allow it in your browser, then tap the button again.",
    demo_suite: "This is level 1 of 6. The full file opens the other five, thirty exercises in all.",
  },
  fr: {
    titre: "Steady Pitch", chantez: "Chantez cette note", jouez: "Jouez cette note",
    excellent: "Parfait", bien: "Bien", juste: "Juste", faux: "Faux",
    silence: "Rien entendu", trop_grave: "Un peu bas", trop_aigu: "Un peu haut",
    score: "Score", niveau: "Niveau", reessayer: "Reessayer", suivant: "Suivant",
    cents: "cents", choisir_voix: "Je vais chanter", choisir_instrument: "Je vais jouer",
    progression: "Progression",
    sur: "sur",
    diese: "diese",
    a_revoir: "A revoir",
    nouveau_niveau: "Niveau suivant la prochaine fois",
    ecart_moyen: "Ecart moyen",
    choisir_entree: "Choisissez comment travailler votre justesse",
    tessiture: "Votre tessiture",
    recommencer: "Recommencer",
    ecoute_en_cours: "A l'ecoute",
    details_techniques: "Details techniques",
    hors_portee_grave: "Cette note est trop grave pour le micro",
    hors_portee_aigu: "Cette note est trop aigue pour le micro",
    micro_refuse: "Steady Pitch a besoin du microphone. Autorisez le micro dans le navigateur, puis appuyez de nouveau sur le bouton.",
    demo_suite: "Ceci est le niveau 1 sur 6. Le fichier complet ouvre les cinq autres, trente exercices en tout.",
  },
  es: {
    titre: "Steady Pitch", chantez: "Canta esta nota", jouez: "Toca esta nota",
    excellent: "Perfecto", bien: "Bien", juste: "Afinado", faux: "Desafinado",
    silence: "No se oye nada", trop_grave: "Un poco bajo", trop_aigu: "Un poco alto",
    score: "Puntuacion", niveau: "Nivel", reessayer: "Reintentar", suivant: "Siguiente",
    cents: "cents", choisir_voix: "Voy a cantar", choisir_instrument: "Voy a tocar",
    progression: "Progreso",
    sur: "de",
    diese: "sostenido",
    a_revoir: "Repasar esta",
    nouveau_niveau: "Nuevo nivel la proxima vez",
    ecart_moyen: "Error medio",
    choisir_entree: "Como quieres trabajar tu afinacion",
    tessiture: "Tu tesitura",
    recommencer: "Empezar de nuevo",
    ecoute_en_cours: "Escuchando",
    details_techniques: "Detalles tecnicos",
    hors_portee_grave: "Esta nota es demasiado grave para el microfono",
    hors_portee_aigu: "Esta nota es demasiado aguda para el microfono",
    micro_refuse: "Steady Pitch necesita el microfono. Permitelo en el navegador y vuelve a tocar el boton.",
    demo_suite: "Este es el nivel 1 de 6. El archivo completo abre los otros cinco, treinta ejercicios en total.",
  },
  de: {
    titre: "Steady Pitch", chantez: "Singe diesen Ton", jouez: "Spiele diesen Ton",
    excellent: "Genau", bien: "Gut", juste: "Sauber", faux: "Daneben",
    silence: "Nichts gehort", trop_grave: "Etwas zu tief", trop_aigu: "Etwas zu hoch",
    score: "Punkte", niveau: "Stufe", reessayer: "Nochmal", suivant: "Weiter",
    cents: "Cent", choisir_voix: "Ich singe", choisir_instrument: "Ich spiele",
    progression: "Fortschritt",
    sur: "von",
    diese: "Kreuz",
    a_revoir: "Nochmal ueben",
    nouveau_niveau: "Naechstes Mal neue Stufe",
    ecart_moyen: "Mittlere Abweichung",
    choisir_entree: "Wie willst du an deiner Intonation arbeiten",
    tessiture: "Dein Stimmumfang",
    recommencer: "Neu beginnen",
    ecoute_en_cours: "Hoert zu",
    details_techniques: "Technische Details",
    hors_portee_grave: "Dieser Ton ist zu tief fur das Mikrofon",
    hors_portee_aigu: "Dieser Ton ist zu hoch fur das Mikrofon",
    micro_refuse: "Steady Pitch braucht Ihr Mikrofon. Erlauben Sie es im Browser und tippen Sie erneut.",
    demo_suite: "Das ist Stufe 1 von 6. Die vollstandige Datei offnet die anderen funf, insgesamt dreissig Ubungen.",
  },
  it: {
    titre: "Steady Pitch", chantez: "Canta questa nota", jouez: "Suona questa nota",
    excellent: "Perfetto", bien: "Bene", juste: "Intonato", faux: "Stonato",
    silence: "Non si sente nulla", trop_grave: "Un po' basso", trop_aigu: "Un po' alto",
    score: "Punteggio", niveau: "Livello", reessayer: "Riprova", suivant: "Avanti",
    cents: "cents", choisir_voix: "Canto io", choisir_instrument: "Suono io",
    progression: "Progressi",
    sur: "su",
    diese: "diesis",
    a_revoir: "Da rivedere",
    nouveau_niveau: "Prossimo livello la volta prossima",
    ecart_moyen: "Errore medio",
    choisir_entree: "Come vuoi lavorare sulla tua intonazione",
    tessiture: "La tua estensione",
    recommencer: "Ricomincia",
    ecoute_en_cours: "In ascolto",
    details_techniques: "Dettagli tecnici",
    hors_portee_grave: "Questa nota e troppo grave per il microfono",
    hors_portee_aigu: "Questa nota e troppo acuta per il microfono",
    micro_refuse: "Steady Pitch ha bisogno del microfono. Autorizzalo nel browser, poi tocca di nuovo il pulsante.",
    demo_suite: "Questo e il livello 1 di 6. Il file completo apre gli altri cinque, trenta esercizi in tutto.",
  },
  pt: {
    titre: "Steady Pitch", chantez: "Cante esta nota", jouez: "Toque esta nota",
    excellent: "Perfeito", bien: "Bom", juste: "Afinado", faux: "Desafinado",
    silence: "Nada ouvido", trop_grave: "Um pouco baixo", trop_aigu: "Um pouco alto",
    score: "Pontuacao", niveau: "Nivel", reessayer: "Tentar de novo", suivant: "Proximo",
    cents: "cents", choisir_voix: "Vou cantar", choisir_instrument: "Vou tocar",
    progression: "Progresso",
    sur: "de",
    diese: "sustenido",
    a_revoir: "Rever esta",
    nouveau_niveau: "Novo nivel na proxima vez",
    ecart_moyen: "Erro medio",
    choisir_entree: "Como quer trabalhar a sua afinacao",
    tessiture: "A sua tessitura",
    recommencer: "Recomecar",
    ecoute_en_cours: "A escutar",
    details_techniques: "Detalhes tecnicos",
    hors_portee_grave: "Esta nota e demasiado grave para o microfone",
    hors_portee_aigu: "Esta nota e demasiado aguda para o microfone",
    micro_refuse: "Steady Pitch precisa do microfone. Autorize no navegador e toque outra vez no botao.",
    demo_suite: "Este e o nivel 1 de 6. O ficheiro completo abre os outros cinco, trinta exercicios ao todo.",
  },
};

/**
 * UNE CLE INCONNUE NE DOIT PLUS RENDRE DU VIDE, ET C'EST UNE LECON DU CYCLE 12.
 * Cette fonction rendait `undefined` en silence pour une cle qu'elle ne
 * connait pas. Cote mobile, en TypeScript, le type `Cle` l'empeche a la
 * compilation. Cote WEB, en JavaScript simple, il n'y a aucun filet, et
 * l'ecran d'accueil est parti a l'ecran avec trois libelles VIDES sans que
 * rien ne proteste, ni dans la console, ni dans un banc.
 *
 * Un texte manquant est desormais VISIBLE. Un defaut qu'on voit coute une
 * minute, un defaut qui se cache coute un cycle. Le marqueur ne contient
 * aucun symbole interdit dans une annonce vocale, il peut donc traverser la
 * couche d'accessibilite sans la casser.
 */
export function t(cle     , langue         = "en")         {
  const valeur = (TEXTES[langue] ?? TEXTES.en)[cle] ?? TEXTES.en[cle];
  if (typeof valeur !== "string" || valeur.length === 0) {
    return `texte manquant, ${String(cle)}`;
  }
  return valeur;
}

/** Toutes les cles declarees, pour qu'un banc puisse verifier qu'une couche
 *  d'interface n'en invente aucune. Sert au banc, et a rien d'autre. */
export function clesConnues()           {
  return Object.keys(TEXTES.en);
}

/**
 * LE NOM D'UNE NOTE, DIT A VOIX HAUTE, ET CE N'EST PAS LE MEME QUE L'ECRIT.
 * Ajoute au cycle 11 apres qu'un banc a trouve le defaut. `nommerNote` rend
 * "Do#3", et le diese est justement dans la liste des symboles que mon propre
 * controle d'accessibilite interdit dans une annonce. Un lecteur d'ecran le lit
 * "Do croisillon trois", ou l'ignore purement et simplement, ce qui est pire,
 * parce que l'utilisateur entend alors "Do trois" et chante une autre note.
 * L'allemand ecrit "Cis" et le do mobile "Di", ni l'un ni l'autre n'a de diese
 * ecrit, cette fonction ne les touche donc pas.
 */
export function nommerNoteParle(midi        , systeme               = "lettres",
                                toniqueMidi = 0, langue         = "en")         {
  const ecrit = nommerNote(midi, systeme, toniqueMidi);
  if (!ecrit.includes("#")) return ecrit;
  return ecrit.replace("#", " " + t("diese", langue) + " ");
}
