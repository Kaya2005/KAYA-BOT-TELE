// ==================== setting/theme.js ====================

/**
 * Convertit un texte standard en petites capitales (Small Caps) pour un style esthétique.
 */
export function toSmallCaps(str) {
    const caps = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 
        'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 
        'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ', 
        'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
        'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ', 
        'H': 'ʜ', 'I': 'ɪ', 'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 
        'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ', 'S': 's', 'T': 'ᴛ', 'U': 'ᴜ', 
        'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ'
    };
    return str.split('').map(char => caps[char] || char).join('');
}

/**
 * Génère une boîte stylisée compacte et responsive (idéal écrans ~350px).
 * @param {string} title - Le titre de la boîte
 * @param {string} content - Le contenu du message
 * @param {string} icon - L'emoji principal
 */
export function boxMessage(title, content, icon = '📌') {
    const formattedTitle = toSmallCaps(title);
    return `╭─ ${icon} *${formattedTitle}* ─╮\n` +
           `│\n` +
           content.split('\n').map(line => `│  ${line}`).join('\n') + `\n` +
           `│\n` +
           `╰─────────────╯`;
}

/**
 * Message d'erreur standardisé
 */
export function errorBox(text = 'an error occurred.') {
    return boxMessage('error', text, '❌');
}

/**
 * Message de succès standardisé
 */
export function successBox(text) {
    return boxMessage('success', text, '✅');
}

/**
 * Message d'aide / Usage standardisé
 */
export function usageBox(prefix, cmdName, syntax = '') {
    const usageLine = syntax ? `\`${prefix}${cmdName} ${syntax}\`` : `\`${prefix}${cmdName}\``;
    const content = `*ᴜsᴀɢᴇ :*\n│  • ${usageLine}`;
    return boxMessage('help', content, '💡');
}
