import { getSetting, setSetting } from '../setting.js';

// Importation des fichiers de traduction
import fr from './locales/fr.js';
import en from './locales/en.js';
import ln from './locales/ln.js';
import wo from './locales/wo.js';
import ee from './locales/ee.js';
import sw from './locales/sw.js';
import zu from './locales/zu.js';
import ht from './locales/ht.js';
import hi from './locales/hi.js';

// Dictionnaire des traductions
const translations = { fr, en, ln, wo, ee, sw, zu, ht, hi };

/**
 * Récupère le texte traduit selon la clé et la langue de l'utilisateur.
 * La langue par défaut est 'en' (Anglais).
 */
export function getString(ownerId, key) {
    // Récupère la langue enregistrée, ou 'en' par défaut
    const userLang = getSetting(ownerId, 'botLanguage', 'en');
    
    // 1. Recherche dans la langue sélectionnée
    if (translations[userLang] && translations[userLang][key]) {
        return translations[userLang][key];
    }
    
    // 2. Sécurité (Fallback) : Si la clé manque, cherche en Anglais ('en')
    if (translations['en'] && translations['en'][key]) {
        return translations['en'][key];
    }

    // 3. Dernier secours : Cherche en Français ou renvoie directement la clé
    return translations['fr']?.[key] || key;
}

/**
 * Enregistre la nouvelle langue choisie.
 */
export function setLanguage(ownerId, lang) {
    const supportedLangs = ['fr', 'en', 'ln', 'wo', 'ee', 'sw', 'zu', 'ht', 'hi'];
    
    if (supportedLangs.includes(lang)) {
        setSetting(ownerId, 'botLanguage', lang);
        return true;
    }
    return false;
}
