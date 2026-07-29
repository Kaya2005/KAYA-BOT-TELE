import gtts from 'gtts';
import fs from 'fs';
import path from 'path';

/**
 * Génère un buffer audio via la bibliothèque gtts
 * @param {string} text 
 * @param {string} lang 
 * @returns {Promise<Buffer>}
 */
export function getAudioBuffer(text, lang = 'fr') {
  return new Promise((resolve, reject) => {
    const g = new gtts(text, lang);
    const tempPath = path.join(process.cwd(), `tts_${Date.now()}.mp3`);

    g.save(tempPath, (err) => {
      if (err) return reject(err);
      try {
        const buffer = fs.readFileSync(tempPath);
        fs.unlinkSync(tempPath); // Supprime le fichier temporaire
        resolve(buffer);
      } catch (readErr) {
        reject(readErr);
      }
    });
  });
}
