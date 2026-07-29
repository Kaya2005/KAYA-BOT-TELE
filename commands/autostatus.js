import { getSetting, setSetting } from '../setting.js';

const KEY_VIEW = 'autostatus_view';
const KEY_LIKE = 'autostatus_like';
const KEY_EMOJI = 'autostatus_emoji';

const readState = (ownerId) => {
    const view = getSetting(ownerId, KEY_VIEW, true);
    const like = getSetting(ownerId, KEY_LIKE, true);
    const emoji = getSetting(ownerId, KEY_EMOJI, '💚');

    return {
        autoView: typeof view === 'boolean' ? view : true,
        autoLike: typeof like === 'boolean' ? like : true,
        likeEmoji: typeof emoji === 'string' && emoji.trim() ? emoji.trim() : '💚'
    };
};

export default {
    name: 'autostatus',
    aliases: ['statusauto', 'autostory'],
    description: '🤖 Auto view et auto like des statuts WhatsApp',
    category: 'Owner',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const ownerId = kaya.user.id.split(':')[0];
            const sub = String(args[0] || 'status').toLowerCase();
            const state = readState(ownerId);

            if (sub === 'on') {
                setSetting(ownerId, KEY_VIEW, true);
                setSetting(ownerId, KEY_LIKE, true);
                return await kaya.sendMessage(from, { text: `✅ Auto status view and like enabled.\nEmoji: ${state.likeEmoji}` }, { quoted: mek });
            }

            if (sub === 'off') {
                setSetting(ownerId, KEY_VIEW, false);
                setSetting(ownerId, KEY_LIKE, false);
                return await kaya.sendMessage(from, { text: '✅ Auto status view and like disabled.' }, { quoted: mek });
            }

            if (sub === 'view') {
                const next = String(args[1] || '').toLowerCase();
                if (!['on', 'off'].includes(next)) {
                    return await kaya.sendMessage(from, { text: `❌ Usage: ${prefix}autostatus view <on|off>` }, { quoted: mek });
                }
                setSetting(ownerId, KEY_VIEW, next === 'on');
                return await kaya.sendMessage(from, { text: `✅ Auto status view ${next === 'on' ? 'enabled' : 'disabled'}.` }, { quoted: mek });
            }

            if (sub === 'like') {
                const next = String(args[1] || '').toLowerCase();
                if (!['on', 'off'].includes(next)) {
                    return await kaya.sendMessage(from, { text: `❌ Usage: ${prefix}autostatus like <on|off>` }, { quoted: mek });
                }
                setSetting(ownerId, KEY_LIKE, next === 'on');
                return await kaya.sendMessage(from, { text: `✅ Auto status like ${next === 'on' ? 'enabled' : 'disabled'}.` }, { quoted: mek });
            }

            if (sub === 'emoji') {
                const emoji = String(args[1] || '').trim();
                if (!emoji) {
                    return await kaya.sendMessage(from, { text: `❌ Usage: ${prefix}autostatus emoji 💚` }, { quoted: mek });
                }
                setSetting(ownerId, KEY_EMOJI, emoji);
                return await kaya.sendMessage(from, { text: `✅ Auto status like emoji set to ${emoji}` }, { quoted: mek });
            }

            const currentState = readState(ownerId);
            const msgText = `📊 *Auto Status*\n` +
                `View: ${currentState.autoView ? 'ON' : 'OFF'}\n` +
                `Like: ${currentState.autoLike ? 'ON' : 'OFF'}\n` +
                `Emoji: ${currentState.likeEmoji}\n\n` +
                `${prefix}autostatus on\n` +
                `${prefix}autostatus off\n` +
                `${prefix}autostatus view on\n` +
                `${prefix}autostatus like on\n` +
                `${prefix}autostatus emoji 💚`;

            await kaya.sendMessage(from, { text: msgText }, { quoted: mek });

        } catch (err) {
            console.error('❌ Erreur dans autostatus.js :', err);
            await kaya.sendMessage(from, { text: `⚠️ Une erreur est survenue : ${err.message}` }, { quoted: mek });
        }
    },

    // Détection automatique pour les statuts (status@broadcast)
    async detect(kaya, mek, from) {
        try {
            // DEBUG : Afficher tous les messages reçus pour voir si status@broadcast arrive bien
            if (from === 'status@broadcast') {
                console.log(`[AUTOSTATUS DEBUG] 📱 Statut détecté venant de :`, mek.key.participant || mek.sender);
            }

            if (from !== 'status@broadcast' || mek.key.fromMe) return;

            const ownerId = kaya.user.id.split(':')[0];
            const state = readState(ownerId);
            
            console.log(`[AUTOSTATUS DEBUG] État actuel -> View: ${state.autoView}, Like: ${state.autoLike}`);

            if (!state.autoView && !state.autoLike) return;

            if (state.autoView) {
                await kaya.readMessages([mek.key]);
                console.log(`[AUTOSTATUS] ✅ Statut marqué comme lu avec succès.`);
            }

            if (state.autoLike) {
                // Sur certaines versions de Baileys, le statut nécessite le bon participant dans la clé pour la réaction
                await kaya.sendMessage(from, {
                    react: { text: state.likeEmoji, key: mek.key }
                });
                console.log(`[AUTOSTATUS] ✅ Réaction ${state.likeEmoji} envoyée sur le statut.`);
            }
        } catch (e) {
            console.error('❌ Erreur détaillée dans autostatus detect:', e);
        }
    }
};
