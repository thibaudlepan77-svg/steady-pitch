/**
 * theme.ts, LES COULEURS SONT DES DECISIONS, DONC ELLES SE VERIFIENT.
 * Agent N4, 2026-08-25 (cycle 11, chantier 10). Aucune dependance.
 *
 * POURQUOI CE FICHIER EST DANS LE NOYAU ET PAS DANS L'INTERFACE.
 * Un theme a l'air d'etre du gout. Il n'en est pas. Un couple texte et fond
 * porte un CONTRASTE, qui est un nombre, qui se calcule, et dont Apple fait un
 * critere de mise en avant editoriale. Tant qu'il est ecrit dans un composant,
 * personne ne le mesure et on decouvre le probleme par un avis a une etoile
 * d'un utilisateur qui ne lit rien au soleil.
 * Ici, chaque couple est verifie par un banc, en clair ET en sombre.
 *
 * LA REGLE RETENUE. Rapport de contraste minimal de 4,5 pour tout texte, seuil
 * WCAG AA pour le texte normal. Je ne descends pas a 3,0 en pretextant du gros
 * texte, parce que mes libelles ne sont pas tous gros et que la marge coute
 * zero.
 *
 * L'AMBRE VIENT D'UNE MESURE, PAS D'UN GOUT. J'ai analyse la teinte dominante
 * des 120 icones du palmares payant Musique et Education au cycle 10. Bleu et
 * turquoise cumulent 42,5 pour cent. L'ambre est deux fois moins encombre et
 * reste le plus lisible a 60 pixels, la taille de mes deux portes
 * d'acquisition. Le theme suit l'icone, sinon la fiche et l'app se
 * contredisent.
 */

                                      

                                      

                          
               
                    
                
                      
                 
                                            
                    
                 
                  
               
                 
 

/**
 * Les deux palettes. Aucune n'est choisie a l'oeil, chacune passe le banc de
 * contraste. Les valeurs sombres ne sont pas les claires inversees, un fond
 * noir pur fatigue et fait baver le texte clair sur les ecrans OLED.
 */
export const PALETTES                        = {
  clair: {
    fond: "#FBF7F0",
    fondCarte: "#FFFFFF",
    texte: "#1C1A17",
    texteFaible: "#5A5348",
    accent: "#8A5A00",
    surAccent: "#FFFFFF",
    // CORRIGE AU CYCLE 11, APRES REFUS DU BANC. Mes premieres valeurs,
    // vert 1F6B3A et rouge A32118, avaient un rapport de luminance de
    // 1,16. Un daltonien, huit pour cent des hommes, ne percoit pas la
    // teinte, il ne lui reste que la luminance, et 1,16 ne se voit pas.
    // Les deux verdicts se seraient confondus. Rapport porte a 1,59.
    succes: "#1F6B3A",
    presque: "#7A5A00",
    rate: "#7E1810",
    inerte: "#5A5348",
  },
  sombre: {
    fond: "#14120F",
    fondCarte: "#1F1C18",
    texte: "#F2EDE4",
    texteFaible: "#B7AE9F",
    accent: "#F0B23C",
    surAccent: "#1C1A17",
    succes: "#7FE0A4",
    presque: "#E0B84A",
    rate: "#E5675E",
    inerte: "#B7AE9F",
  },
};

/** La couleur d'un ton, dans un mode donne. */
export function couleurDeTon(ton     , mode      )         {
  const p = PALETTES[mode];
  switch (ton) {
    case "succes": return p.succes;
    case "presque": return p.presque;
    case "rate": return p.rate;
    case "inerte": return p.inerte;
    default: return p.texteFaible;
  }
}

// ---------------------------------------------------------------------------
// LE CALCUL DE CONTRASTE, formule WCAG 2, sans dependance
// ---------------------------------------------------------------------------

function composante(v        )         {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function luminance(hex        )         {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * composante(r) + 0.7152 * composante(g) + 0.0722 * composante(b);
}

/** Rapport de contraste entre deux couleurs, de 1 a 21. */
export function contraste(a        , b        )         {
  const la = luminance(a), lb = luminance(b);
  const clair = Math.max(la, lb), sombre = Math.min(la, lb);
  return (clair + 0.05) / (sombre + 0.05);
}

/** Tous les couples texte sur fond que le produit affiche reellement.
 *  Le banc les parcourt, dans les deux modes. Un couple non liste est un
 *  couple non verifie, donc la liste doit rester exhaustive. */
export function couplesAVerifier(mode      )                                                 {
  const p = PALETTES[mode];
  return [
    { nom: "texte sur fond", texte: p.texte, fond: p.fond },
    { nom: "texte sur carte", texte: p.texte, fond: p.fondCarte },
    { nom: "texte faible sur fond", texte: p.texteFaible, fond: p.fond },
    { nom: "texte faible sur carte", texte: p.texteFaible, fond: p.fondCarte },
    { nom: "accent sur fond", texte: p.accent, fond: p.fond },
    { nom: "accent sur carte", texte: p.accent, fond: p.fondCarte },
    { nom: "texte sur accent", texte: p.surAccent, fond: p.accent },
    { nom: "succes sur fond", texte: p.succes, fond: p.fond },
    { nom: "succes sur carte", texte: p.succes, fond: p.fondCarte },
    { nom: "presque sur fond", texte: p.presque, fond: p.fond },
    { nom: "presque sur carte", texte: p.presque, fond: p.fondCarte },
    { nom: "rate sur fond", texte: p.rate, fond: p.fond },
    { nom: "rate sur carte", texte: p.rate, fond: p.fondCarte },
    { nom: "inerte sur fond", texte: p.inerte, fond: p.fond },
  ];
}

export const CONTRASTE_MINIMAL = 4.5;

/**
 * LA COULEUR NE DIT JAMAIS SEULE. Un verdict rendu uniquement par une couleur
 * est invisible a huit pour cent des hommes. Chaque ton porte donc aussi une
 * FORME et un MOT, et ce tableau existe pour que l'interface ne puisse pas
 * l'oublier. Le mot vient de `langues.ts`, ici on ne fixe que la forme.
 */
export const FORME_DE_TON                      = {
  succes: "cercle plein",
  presque: "cercle a moitie plein",
  rate: "cercle vide",
  inerte: "trait",
  neutre: "aucune",
};
