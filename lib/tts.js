// ==================== lib/tts.js ====================
import querystring from 'querystring';

/**
 * Génère l'URL audio via l'API Google Translate TTS (Stable et sans restriction)
 * @param {string} text 
 * @param {object} options 
 * @returns {string}
 */
export function getAudioUrl(text, options = {}) {
  const { lang = 'fr' } = options;

  const params = {
    ie: 'UTF-8',
    q: text,
    tl: lang,
    client: 'tw-ob'
  };

  return `https://translate.google.com/translate_tts?${querystring.stringify(params)}`;
}
