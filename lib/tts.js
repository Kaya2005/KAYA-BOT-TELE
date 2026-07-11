// ==================== lib/tts.js ====================
import querystring from 'querystring';

export function getAudioUrl(text, options = {}) {
  const { lang = 'fr' } = options;

  const params = {
    voice: lang === 'fr' ? 'fr-FR-Wavenet-D' : 'en-US-Wavenet-D',
    text: text // querystring gère l'encodage automatiquement
  };

  return `https://api.streamelements.com/kappa/v2/speech?${querystring.stringify(params)}`;
}
