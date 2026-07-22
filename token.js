// token.js (ESM)

export const BOT_TOKENS = [
  { token: '8892577598:AAGUQ9uZS2UnBT4nTS20Oawq4N_vjWHAyMo', active: true },
  { token: '8573048627:AAFF7q2eSose6iy3UxasrW2rXeM4SUC95QY', active: false },
  { token: 'TROISIEME_TOKEN_ICI_EXEMPLE', active: false },
  { token: 'QUATRIEME_TOKEN_ICI_EXEMPLE', active: false },
  { token: 'CINQUIEME_TOKEN_ICI_EXEMPLE', active: false },
  { token: 'SIXIEME_TOKEN_ICI_EXEMPLE', active: false },
  { token: 'SEPTIEME_TOKEN_ICI_EXEMPLE', active: false },
  { token: 'HUITIEME_TOKEN_ICI_EXEMPLE', active: false },
  { token: 'NEUVIEME_TOKEN_ICI_EXEMPLE', active: false },
  { token: 'DIXIEME_TOKEN_ICI_EXEMPLE', active: false }
];

// Helper pour récupérer automatiquement le premier VRAI token disponible (non utilisé)
export function getActiveToken() {
  // Regex pour valider le format d'un token Telegram (ex: chiffres + ":" + caractères)
  const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/;

  // On cherche un élément qui est à active: false ET dont le texte respecte le format d'un vrai token
  const found = BOT_TOKENS.find(t => t.active === false && tokenRegex.test(t.token));

  if (!found) {
    throw new Error("❌ Aucun vrai token valide et disponible n'a été trouvé dans la liste !");
  }
  
  return found.token;
}

export const startupPassword = '';
