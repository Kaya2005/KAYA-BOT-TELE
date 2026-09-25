// ==========================================
// FICHIER : bot.js
// KAYA BOT — Support multi-préfixes + Blockquotes globaux
// ==========================================

import './config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Telegraf } from 'telegraf';
import { forceCleanupSession } from './pair.js';
import { BOT_TOKEN } from './token.js';

import setupWelcome from './commandtele/welcome.js';
import setupAntiLink from './commandtele/antilink.js';
import setupGroupMenu from './commandtele/groupmenu.js';
import setupChatbot from './commandtele/chatbot.js';
import setupLanguage, { getLang, setLang } from './commandtele/language.js';
import setupTagAll from './commandtele/tagall.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ================= CONSTANTS & PATHS =================

const adminFilePath = path.join(__dirname, './database/admintele.json');
const usersFilePath = path.join(__dirname, './database/users.json');
const membersFilePath = path.join(__dirname, './database/members.json');
const pairingFolder = path.join(__dirname, './richstore/pairing');

const REQUIRED_CHANNELS = [
    '-1004453499318',
    '@kayatech2',
    '@society243'
];

// ================= DICTIONNAIRE DE LANGUES COMPLET =================

const langData = {
    en: {
        welcome: "Welcome! Connect your WhatsApp or add the bot to your group.",
        btnStart: "🚀 Start Menu (WhatsApp)",
        btnGroup: "➕ Add Bot to Group",
        btnLang: "🌐 Language: English 🇬🇧",
        selectLang: "Please select your preferred language:",
        langChanged: "✅ Language successfully changed to English 🇬🇧",
        adminOnly: "❌ Only group administrators can change the bot's language.",
        needPrivate: "❌ Please write to me in private to use this command.",
        btnOpenPrivate: "💬 Open Bot in Private",
        needGroup: "❌ Please add the bot to a group to use this command.",
        btnAddGroup: "➕ Add to Group",
        logoNotFound: "❌ Error: The logo.png image is missing.",
        statusOnline: "Online / En ligne",
        serverFull: "Error: Server capacity reached (60/60). Please try again later.",
        restrictedAccess: "Restricted access. Please join our channels to continue:",
        btnChat: "𝙺𝙰𝚈𝙰 𝙱𝙾𝚃 | 𝙲𝙷𝙰𝚃",
        btnChannel: "𝙺𝙰𝚈𝙰 𝙱𝙾𝚃 | 𝙲𝙰𝙽𝙰𝙻",
        btnSociety: "𝙎1𝙊𝙐𝙇 𝙎0𝘾IETY🪶",
        btnJoined: "✅ I Have Joined",
        joinSuccess: "✅ You can connect now.",
        accessAuthorized: "✅ Access authorized.",
        joinError: "❌ You must join the required channels first.",
        pairUsage: "Usage: /pair 243xxxxxx",
        invalidNumber: "Invalid number. Minimum 9 digits required.",
        initWait: "Initialization... please wait.",
        codeError: "Error: Pairing code could not be generated.",
        noDevices: "No devices linked.",
        delPairUsage: "Usage: /delpair [teleId or number]",
        sessionDisconnected: "Session disconnected successfully.",
        sessionNotFound: "Session not found.",
        broadcastUsage: "Usage: /broadcast Your message here...",
        noUsers: "No registered users at the moment.",
        broadcasting: "Broadcasting in progress to",
        usersCount: "user(s)...",
        broadcastDone: "Broadcast finished!",
        sentSuccess: "Successfully sent:",
        fails: "Failures (users who blocked the bot):",
        noGroups: "The bot is not currently in any groups.",
        groupsListTitle: "BOT REGISTERED GROUPS"
    },

    fr: {
        welcome: "Bienvenue ! Connectez votre WhatsApp ou ajoutez le bot à votre groupe.",
        btnStart: "🚀 Menu Principal (WhatsApp)",
        btnGroup: "➕ Ajouter le bot au groupe",
        btnLang: "🌐 Langue : Français 🇫🇷",
        selectLang: "Veuillez choisir votre langue préférée :",
        langChanged: "✅ Langue changée avec succès en Français 🇫🇷",
        adminOnly: "❌ Seuls les administrateurs du groupe peuvent modifier la langue du bot.",
        needPrivate: "❌ Veuillez m'écrire en privé pour utiliser cette commande.",
        btnOpenPrivate: "💬 Ouvrir le bot en privé",
        needGroup: "❌ Veuillez ajouter le bot dans un groupe pour utiliser cette commande.",
        btnAddGroup: "➕ Ajouter au groupe",
        logoNotFound: "❌ Erreur : L'image logo.png est introuvable.",
        statusOnline: "Online / En ligne",
        serverFull: "Erreur : Capacité du serveur atteinte (60/60). Veuillez réessayer plus tard.",
        restrictedAccess: "Accès restreint. Veuillez rejoindre nos canaux pour continuer :",
        btnChat: "𝙺𝙰𝚈𝙰 𝙱𝙾𝚃 | 𝙲𝙷𝙰𝚃",
        btnChannel: "𝙺𝙰𝚈𝙰 𝙱𝙾𝚃 | 𝙲𝙰𝙽𝙰𝙻",
        btnSociety: "𝙎1𝙊𝙐𝙇 𝙎0𝘾IETY🪶",
        btnJoined: "✅ J'ai rejoint",
        joinSuccess: "✅ Vous pouvez vous connecter maintenant.",
        accessAuthorized: "✅ Accès autorisé.",
        joinError: "❌ Vous devez d'abord rejoindre les canaux requis.",
        pairUsage: "Utilisation : /pair 243xxxxxx",
        invalidNumber: "Numéro invalide. Minimum 9 chiffres requis.",
        initWait: "Initialisation... veuillez patienter.",
        codeError: "Erreur : Le code d'appairage n'a pas pu être généré.",
        noDevices: "Aucun appareil lié.",
        delPairUsage: "Utilisation : /delpair [teleId ou numéro]",
        sessionDisconnected: "Session déconnectée avec succès.",
        sessionNotFound: "Session introuvable.",
        broadcastUsage: "Utilisation : /broadcast Votre message ici...",
        noUsers: "Aucun utilisateur enregistré pour le moment.",
        broadcasting: "Diffusion en cours vers",
        usersCount: "utilisateur(s)...",
        broadcastDone: "Diffusion terminée !",
        sentSuccess: "Envoyés avec succès :",
        fails: "Échecs (utilisateurs ayant bloqué le bot) :",
        noGroups: "Le bot n'est actuellement dans aucun groupe.",
        groupsListTitle: "GROUPES ENREGISTRÉS DU BOT"
    }
};

// ================= HELPERS D'ADMINISTRATION =================

const isOwner = (ctx) => {
    try {
        const admins = JSON.parse(
            fs.readFileSync(adminFilePath, 'utf8')
        );

        return admins.includes(String(ctx.from.id));
    } catch {
        return false;
    }
};

const isAdminOrOwner = async (ctx, userId) => {
    try {
        if (isOwner(ctx)) return true;

        if (ctx.chat.type === 'private') return true;

        const member = await ctx.telegram.getChatMember(
            ctx.chat.id,
            userId
        );

        return ['creator', 'administrator'].includes(member.status);

    } catch {
        return false;
    }
};

const saveUser = (userId) => {
    try {
        let users = [];

        if (fs.existsSync(usersFilePath)) {
            users = JSON.parse(
                fs.readFileSync(usersFilePath, 'utf8')
            );
        }

        if (!users.includes(String(userId))) {
            users.push(String(userId));

            fs.writeFileSync(
                usersFilePath,
                JSON.stringify(users, null, 2)
            );
        }

    } catch (e) {}
};

// ================= ENSURE PRIVATE =================

const ensurePrivate = (ctx) => {

    if (isOwner(ctx)) return true;

    if (!ctx.chat || ctx.chat.type !== 'private') {

        const chatId = ctx.chat
            ? ctx.chat.id
            : ctx.from.id;

        const lng = getLang(chatId);
        const t = langData[lng] || langData.en;

        const botUsername =
            ctx.botInfo?.username || 'KayaMdBot';

        ctx.reply(
            `<blockquote>${t.needPrivate}</blockquote>`,
            {
                parse_mode: 'HTML',
                reply_to_message_id:
                    ctx.message?.message_id,

                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: t.btnOpenPrivate,
                                url: `https://t.me/${botUsername}`
                            }
                        ]
                    ]
                }
            }
        );

        return false;
    }

    return true;
};

// ================= ENSURE GROUP =================

const ensureGroup = (ctx) => {

    if (
        ctx.chat &&
        ['group', 'supergroup'].includes(ctx.chat.type)
    ) {
        return true;
    }

    const chatId = ctx.chat
        ? ctx.chat.id
        : ctx.from.id;

    const lng = getLang(chatId);
    const t = langData[lng] || langData.en;

    const botUsername =
        ctx.botInfo?.username || 'KayaMdBot';

    ctx.reply(
        `<blockquote>${t.needGroup}</blockquote>`,
        {
            parse_mode: 'HTML',
            reply_to_message_id:
                ctx.message?.message_id,

            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: t.btnAddGroup,
                            url: `https://t.me/${botUsername}?startgroup=true`
                        }
                    ]
                ]
            }
        }
    );

    return false;
};

// ================= CHECK CHANNELS =================

const checkChannels = async (ctx) => {

    if (isOwner(ctx)) return true;

    for (const channel of REQUIRED_CHANNELS) {

        try {

            const member =
                await ctx.telegram.getChatMember(
                    channel,
                    ctx.from.id
                );

            if (
                ['left', 'kicked'].includes(
                    member.status
                )
            ) {
                return false;
            }

        } catch {
            return false;
        }
    }

    return true;
};

// ================= ACTIVE SESSIONS =================

const getActiveSessions = () => {

    if (!fs.existsSync(pairingFolder)) {
        return [];
    }

    return fs
        .readdirSync(pairingFolder, {
            withFileTypes: true
        })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(folderName => {

            const credsPath =
                path.join(
                    pairingFolder,
                    folderName,
                    'creds.json'
                );

            return fs.existsSync(credsPath);
        });
};

// ================= MENU =================

const getMenu = (
    userName,
    isAdmin,
    chatId
) => {

    const lng = getLang(chatId);

    const now = new Date();

    const time =
        now.toLocaleTimeString(
            'en-GB',
            {
                timeZone: 'Africa/Lubumbashi',
                hour: '2-digit',
                minute: '2-digit'
            }
        );

    const date =
        now.toLocaleDateString(
            'en-GB',
            {
                timeZone: 'Africa/Lubumbashi',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }
        );

    let menu = `<blockquote>
 ▰▰▰▰▰▰▰▰▰
➠ User   : <b>${userName}</b>
➠ Lang   : <b>${lng.toUpperCase()}</b>
➠ Time   : <b>${time}</b>
➠ Date   : <b>${date}</b>
______________________
𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 𝙲𝙾𝙽𝙽𝙴𝙲𝚃
╭▰▰▰▰▰▰▰◈
┆❏ /pair
┆❏ /ping
╰▰▰▰▰▰▰▰◈
𝚃𝙴𝙻𝙴𝙶𝚁𝙰𝙼 𝙶𝚁𝙾𝚄𝙿𝚂
╭▰▰▰▰▰▰▰◈
┆❏ /group
┆❏ /groupmenu
╰▰▰▰▰▰▰▰◈`;

    if (isAdmin) {

        menu += `

> ╢ OWNER PANEL ♰
╭▰▰▰▰▰▰▰◈
┆❏ /listpair
┆❏ /delpair
┆❏ /groups
┆❏ /broadcast
╰▰▰▰▰▰▰▰◈`;
    }

    menu += `</blockquote>`;

    return menu;
};

// ================= INITIALISATION =================

const bot = new Telegraf(BOT_TOKEN);

// ==========================================================
// BLOCKQUOTE GLOBAL
// ==========================================================

const applyBlockquote = (text) => {

    if (typeof text !== 'string') {
        return text;
    }

    const trimmed = text.trim();

    // Déjà dans un blockquote
    if (
        trimmed.startsWith('<blockquote>') &&
        trimmed.endsWith('</blockquote>')
    ) {
        return text;
    }

    return `<blockquote>${text}</blockquote>`;
};

// ================= MIDDLEWARE BLOCKQUOTE GLOBAL =================

bot.use(async (ctx, next) => {

    // ---------- ctx.reply ----------

    if (ctx.reply) {

        const originalReply =
            ctx.reply.bind(ctx);

        ctx.reply = (text, extra = {}) => {

            const finalText =
                applyBlockquote(text);

            const finalExtra = {
                ...extra,
                parse_mode:
                    extra.parse_mode || 'HTML'
            };

            return originalReply(
                finalText,
                finalExtra
            );
        };
    }

    // ---------- ctx.replyWithPhoto ----------

    if (ctx.replyWithPhoto) {

        const originalReplyWithPhoto =
            ctx.replyWithPhoto.bind(ctx);

        ctx.replyWithPhoto = (
            photo,
            extra = {}
        ) => {

            const finalExtra = {
                ...extra
            };

            if (
                typeof finalExtra.caption ===
                'string'
            ) {

                finalExtra.caption =
                    applyBlockquote(
                        finalExtra.caption
                    );

                finalExtra.parse_mode =
                    finalExtra.parse_mode ||
                    'HTML';
            }

            return originalReplyWithPhoto(
                photo,
                finalExtra
            );
        };
    }

    // ---------- ctx.editMessageText ----------

    if (ctx.editMessageText) {

        const originalEditMessageText =
            ctx.editMessageText.bind(ctx);

        ctx.editMessageText = (
            text,
            extra = {}
        ) => {

            return originalEditMessageText(
                applyBlockquote(text),
                {
                    ...extra,
                    parse_mode:
                        extra.parse_mode || 'HTML'
                }
            );
        };
    }

    // ---------- ctx.editMessageCaption ----------

    if (ctx.editMessageCaption) {

        const originalEditMessageCaption =
            ctx.editMessageCaption.bind(ctx);

        ctx.editMessageCaption = (
            caption,
            extra = {}
        ) => {

            return originalEditMessageCaption(
                applyBlockquote(caption),
                {
                    ...extra,
                    parse_mode:
                        extra.parse_mode || 'HTML'
                }
            );
        };
    }

    return next();
});

// ==========================================================
// MIDDLEWARE UNIVERSEL DE NORMALISATION DES PRÉFIXES
// ==========================================================

bot.use((ctx, next) => {

    if (
        ctx.message &&
        ctx.message.text
    ) {

        let text =
            ctx.message.text.trim();

        if (/^[\.\!\/]/.test(text)) {

            ctx.message.text =
                '/' + text.slice(1);

        } else {

            const firstWord =
                text
                    .split(/\s+/)[0]
                    .toLowerCase();

            const knownCommands = [
                'pair',
                'ping',
                'group',
                'groupmenu',
                'antilink',
                'welcome',
                'tagall',
                'listpair',
                'delpair',
                'groups',
                'broadcast',
                'language',
                'lang'
            ];

            if (
                knownCommands.includes(firstWord)
            ) {

                ctx.message.text =
                    '/' + text;
            }
        }
    }

    return next();
});

// ==========================================================
// MIDDLEWARE ENREGISTREMENT MEMBRES & GROUPES
// ==========================================================

bot.use(async (ctx, next) => {

    try {

        if (
            ctx.chat &&
            ['supergroup', 'group']
                .includes(ctx.chat.type)
        ) {

            let data = {};

            if (
                fs.existsSync(
                    membersFilePath
                )
            ) {

                try {

                    data = JSON.parse(
                        fs.readFileSync(
                            membersFilePath,
                            'utf8'
                        )
                    );

                } catch (e) {

                    data = {};
                }
            }

            const chatId =
                String(ctx.chat.id);

            if (!data[chatId]) {

                data[chatId] = {
                    name:
                        ctx.chat.title ||
                        'Groupe Telegram',
                    members: {}
                };

            } else if (
                typeof data[chatId] ===
                'object' &&
                !data[chatId].name
            ) {

                const oldMembers =
                    data[chatId];

                data[chatId] = {
                    name:
                        ctx.chat.title ||
                        'Groupe Telegram',
                    members:
                        oldMembers
                };

            } else if (ctx.chat.title) {

                data[chatId].name =
                    ctx.chat.title;
            }

            if (
                ctx.from &&
                !ctx.from.is_bot
            ) {

                if (
                    !data[chatId].members
                ) {
                    data[chatId].members = {};
                }

                data[chatId].members[
                    String(ctx.from.id)
                ] = {

                    id: ctx.from.id,

                    name:
                        ctx.from.first_name ||
                        'Membre'
                };
            }

            fs.writeFileSync(
                membersFilePath,
                JSON.stringify(
                    data,
                    null,
                    2
                ),
                'utf8'
            );
        }

    } catch (err) {

        console.error(
            '[GROUP & MEMBER TRACKER ERROR]:',
            err
        );
    }

    return next();
});

// ==========================================================
// MIDDLEWARE UTILISATEUR
// ==========================================================

bot.use((ctx, next) => {

    if (ctx.from) {
        saveUser(ctx.from.id);
    }

    ctx.userMention = () => {

        const userId =
            ctx.from?.id;

        const userName =
            ctx.from?.first_name ||
            'User';

        return userId
            ? `<a href="tg://user?id=${userId}">${userName}</a>`
            : userName;
    };

    return next();
});

// ==========================================================
// MIDDLEWARE SÉCURITÉ COMMANDES DE GROUPE
// ==========================================================

bot.use(async (ctx, next) => {

    if (
        ctx.message &&
        ctx.message.text
    ) {

        const text =
            ctx.message.text.trim();

        const groupCommands = [
            '/groupmenu',
            '/antilink',
            '/welcome',
            '/tagall'
        ];

        const isGroupCmd =
            groupCommands.some(
                cmd =>
                    text.startsWith(cmd)
            );

        if (
            isGroupCmd &&
            (
                !ctx.chat ||
                ctx.chat.type === 'private'
            )
        ) {

            return ensureGroup(ctx);
        }
    }

    return next();
});

// ==========================================================
// MODULES
// ==========================================================

setupWelcome(bot);
setupAntiLink(bot);
setupGroupMenu(bot);
setupChatbot(bot);
setupLanguage(bot);
setupTagAll(bot);

// ==========================================================
// /START
// ==========================================================

bot.start(async (ctx) => {

    const chatId =
        ctx.chat.id;

    const lng =
        getLang(chatId);

    const t =
        langData[lng] ||
        langData.en;

    const logoPath =
        path.join(
            __dirname,
            'setting',
            'logo.png'
        );

    if (!fs.existsSync(logoPath)) {

        return ctx.reply(
            `<blockquote>${t.logoNotFound}</blockquote>`,
            {
                parse_mode: 'HTML'
            }
        );
    }

    const photo = {
        source:
            fs.readFileSync(logoPath)
    };

    if (
        ctx.chat.type ===
        'private'
    ) {

        await ctx.replyWithPhoto(
            photo,
            {

                caption:
                    `<blockquote>▉ 𝐊𝐀𝐘𝐀 𝐁𝐎𝐓 ▉\n\n${t.welcome}</blockquote>`,

                parse_mode: 'HTML',

                reply_to_message_id:
                    ctx.message?.message_id,

                reply_markup: {

                    inline_keyboard: [

                        [
                            {
                                text: t.btnStart,
                                callback_data:
                                    'start_bot'
                            }
                        ],

                        [
                            {
                                text: t.btnGroup,
                                callback_data:
                                    'info_group'
                            }
                        ],

                        [
                            {
                                text: '🇫🇷 Français',
                                callback_data:
                                    'setlang_fr'
                            },
                            {
                                text: '🇬🇧 English',
                                callback_data:
                                    'setlang_en'
                            }
                        ]
                    ]
                }
            }
        );

    } else {

        await ctx.replyWithPhoto(
            photo,
            {

                caption:
                    getMenu(
                        ctx.from.first_name,
                        isOwner(ctx),
                        chatId
                    ),

                parse_mode: 'HTML',

                reply_to_message_id:
                    ctx.message?.message_id,

                reply_markup: {

                    inline_keyboard: [

                        [
                            {
                                text: '🇫🇷 FR',
                                callback_data:
                                    'setlang_fr'
                            },
                            {
                                text: '🇬🇧 EN',
                                callback_data:
                                    'setlang_en'
                            }
                        ]
                    ]
                }
            }
        );
    }
});

// ==========================================================
// ACTION LANGUAGE
// ==========================================================

bot.action(
    /^setlang_(fr|en)$/,
    async (ctx) => {

        const selectedLang =
            ctx.match[1];

        const chatId =
            ctx.chat.id;

        const userId =
            ctx.from.id;

        if (
            ctx.chat.type !==
            'private'
        ) {

            const authorized =
                await isAdminOrOwner(
                    ctx,
                    userId
                );

            if (!authorized) {

                const lng =
                    getLang(chatId);

                const t =
                    langData[lng] ||
                    langData.en;

                return ctx.answerCbQuery(
                    t.adminOnly,
                    {
                        show_alert: true
                    }
                );
            }
        }

        setLang(
            chatId,
            selectedLang
        );

        const t =
            langData[selectedLang] ||
            langData.en;

        await ctx.answerCbQuery(
            t.langChanged
        );

        try {

            if (
                ctx.chat.type ===
                'private'
            ) {

                await ctx.editMessageCaption(
                    `<blockquote>▉ 𝐊𝐀𝐘𝐀 𝐁𝐎𝐓 ▉\n\n${t.welcome}</blockquote>`,
                    {

                        parse_mode: 'HTML',

                        reply_markup: {

                            inline_keyboard: [

                                [
                                    {
                                        text:
                                            t.btnStart,
                                        callback_data:
                                            'start_bot'
                                    }
                                ],

                                [
                                    {
                                        text:
                                            t.btnGroup,
                                        callback_data:
                                            'info_group'
                                    }
                                ],

                                [
                                    {
                                        text:
                                            '🇫🇷 Français',
                                        callback_data:
                                            'setlang_fr'
                                    },
                                    {
                                        text:
                                            '🇬🇧 English',
                                        callback_data:
                                            'setlang_en'
                                    }
                                ]
                            ]
                        }
                    }
                );
            }

        } catch (e) {}
    }
);

// ==========================================================
// ACTION START BOT
// ==========================================================

bot.action(
    'start_bot',
    async (ctx) => {

        const chatId =
            ctx.chat.id;

        await ctx.editMessageCaption(
            getMenu(
                ctx.from.first_name,
                isOwner(ctx),
                chatId
            ),
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: []
                }
            }
        ).catch(async () => {

            await ctx.reply(
                getMenu(
                    ctx.from.first_name,
                    isOwner(ctx),
                    chatId
                ),
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: []
                    }
                }
            );
        });
    }
);

// ==========================================================
// ACTION INFO GROUP
// ==========================================================

bot.action(
    'info_group',
    async (ctx) => {

        const chatId =
            ctx.chat.id;

        const lng =
            getLang(chatId);

        const text =
            lng === 'fr'

                ? `<blockquote>🤖 <b>CONFIGURATION DU GROUPE TELEGRAM</b>\n\nPour utiliser les commandes de modération :\n1️⃣ Ajoutez le bot.\n2️⃣ Promouvez-le en tant qu'<b>Admin</b>.\n3️⃣ Utilisez <code>/groupmenu</code> !</blockquote>`

                : `<blockquote>🤖 <b>TELEGRAM GROUP SETUP</b>\n\nTo use moderation commands:\n1️⃣ Add the bot.\n2️⃣ Promote as <b>Admin</b>.\n3️⃣ Use <code>/groupmenu</code>!</blockquote>`;

        const botUsername =
            ctx.botInfo?.username ||
            'KayaMdBot';

        const t =
            langData[lng] ||
            langData.en;

        await ctx.reply(
            text,
            {

                parse_mode: 'HTML',

                reply_to_message_id:
                    ctx.message?.message_id,

                reply_markup: {

                    inline_keyboard: [

                        [
                            {
                                text:
                                    t.btnAddGroup,

                                url:
                                    `https://t.me/${botUsername}?startgroup=true`
                            }
                        ]
                    ]
                }
            }
        );
    }
);

// ==========================================================
// /GROUP
// ==========================================================

bot.command(
    'group',
    async (ctx) => {

        const chatId =
            ctx.chat.id;

        const lng =
            getLang(chatId);

        const t =
            langData[lng] ||
            langData.en;

        const botUsername =
            ctx.botInfo?.username ||
            'KayaMdBot';

        const text =
            lng === 'fr'

                ? `<blockquote>🤖 <b>CONFIGURATION DU GROUPE TELEGRAM</b>\nUtilisez <code>/groupmenu</code> dans votre groupe après avoir rendu le bot admin.</blockquote>`

                : `<blockquote>🤖 <b>TELEGRAM GROUP SETUP</b>\nUse <code>/groupmenu</code> inside your group after making the bot admin.</blockquote>`;

        await ctx.reply(
            text,
            {

                parse_mode: 'HTML',

                reply_markup: {

                    inline_keyboard: [

                        [
                            {
                                text:
                                    t.btnAddGroup,

                                url:
                                    `https://t.me/${botUsername}?startgroup=true`
                            }
                        ]
                    ]
                }
            }
        );
    }
);

// ==========================================================
// /PING
// ==========================================================

bot.command(
    'ping',
    async (ctx) => {

        const chatId =
            ctx.chat.id;

        const lng =
            getLang(chatId);

        const t =
            langData[lng] ||
            langData.en;

        const mention =
            ctx.userMention();

        ctx.reply(
            `<blockquote>▉ 𝐊𝐀𝐘𝐀 𝐁𝐎𝐓 ▉\n\n👤 User : ${mention}\n✅ <b>Status:</b> ${t.statusOnline}</blockquote>`,
            {

                parse_mode: 'HTML',

                reply_to_message_id:
                    ctx.message?.message_id
            }
        );
    }
);

// ==========================================================
// /GROUPS
// ==========================================================

bot.command(
    'groups',
    async (ctx) => {

        if (!isOwner(ctx)) return;

        if (!ensurePrivate(ctx)) return;

        const mention =
            ctx.userMention();

        const chatId =
            ctx.chat.id;

        const lng =
            getLang(chatId);

        const t =
            langData[lng] ||
            langData.en;

        let data = {};

        try {

            if (
                fs.existsSync(
                    membersFilePath
                )
            ) {

                data = JSON.parse(
                    fs.readFileSync(
                        membersFilePath,
                        'utf8'
                    )
                );
            }

        } catch (e) {}

        const groupIds =
            Object.keys(data);

        if (
            groupIds.length === 0
        ) {

            return ctx.reply(
                `<blockquote>👤 User : ${mention}\n❌ ${t.noGroups}</blockquote>`,
                {
                    parse_mode: 'HTML',
                    reply_to_message_id:
                        ctx.message?.message_id
                }
            );
        }

        let text =
            `<blockquote>👤 User : ${mention}\n> ╢ ${t.groupsListTitle} : ${groupIds.length} ♰\n`;

        groupIds.forEach(
            (id, index) => {

                let groupName =
                    'Groupe Inconnu';

                const groupObj =
                    data[id];

                if (groupObj) {

                    if (
                        groupObj.name
                    ) {
                        groupName =
                            groupObj.name;
                    }
                }

                text +=
                    `┆❏ ${index + 1}. <b>${groupName}</b> (<code>${id}</code>)\n`;
            }
        );

        text +=
            `</blockquote>`;

        ctx.reply(
            text,
            {
                parse_mode: 'HTML',

                reply_to_message_id:
                    ctx.message?.message_id
            }
        );
    }
);

// ==========================================================
// /PAIR
// ==========================================================

bot.command(
    'pair',
    async (ctx) => {

        if (!ensurePrivate(ctx)) return;

        const chatId =
            ctx.chat.id;

        const lng =
            getLang(chatId);

        const t =
            langData[lng] ||
            langData.en;

        const mention =
            ctx.userMention();

        const activeSessions =
            getActiveSessions();

        if (
            activeSessions.length >= 60
        ) {

            return ctx.reply(
                `<blockquote>❌ ${mention}, <b>${t.serverFull}</b></blockquote>`,
                {
                    parse_mode: 'HTML',
                    reply_to_message_id:
                        ctx.message?.message_id
                }
            );
        }

        if (
            !(await checkChannels(ctx))
        ) {

            return ctx.reply(
                `<blockquote>⚠️ ${mention}, ${t.restrictedAccess}</blockquote>`,
                {

                    parse_mode: 'HTML',

                    reply_to_message_id:
                        ctx.message?.message_id,

                    reply_markup: {

                        inline_keyboard: [

                            [
                                {
                                    text: t.btnChat,
                                    url:
                                        'https://t.me/+nctwjD43hDk0ODBk'
                                }
                            ],

                            [
                                {
                                    text: t.btnChannel,
                                    url:
                                        'https://t.me/kayatech2'
                                }
                            ],

                            [
                                {
                                    text: t.btnSociety,
                                    url:
                                        'https://t.me/society243'
                                }
                            ],

                            [
                                {
                                    text: t.btnJoined,
                                    callback_data:
                                        'check_join'
                                }
                            ]
                        ]
                    }
                }
            );
        }

        const text =
            ctx.message.text
                .split(' ')[1];

        if (!text) {

            return ctx.reply(
                `<blockquote>⚠️ ${mention}, ${t.pairUsage}</blockquote>`,
                {
                    parse_mode: 'HTML',
                    reply_to_message_id:
                        ctx.message?.message_id
                }
            );
        }

        const number =
            text.replace(
                /\D/g,
                ''
            );

        if (
            number.length < 9
        ) {

            return ctx.reply(
                `<blockquote>❌ ${mention}, ${t.invalidNumber}</blockquote>`,
                {
                    parse_mode: 'HTML',
                    reply_to_message_id:
                        ctx.message?.message_id
                }
            );
        }

        const jid =
            number +
            '@s.whatsapp.net';

        const teleId =
            ctx.from.id;

        const userName =
            ctx.from.first_name ||
            'Unknown';

        const requestPath =
            path.join(
                pairingFolder,
                `request_${teleId}.json`
            );

        fs.writeFileSync(
            requestPath,
            JSON.stringify({
                jid,
                name: userName
            })
        );

        ctx.reply(
            `<blockquote>⏳ ${mention}, ${t.initWait}</blockquote>`,
            {
                parse_mode: 'HTML',
                reply_to_message_id:
                    ctx.message?.message_id
            }
        );

        let attempts = 0;
        let cuObj = null;

        const pairingFile =
            path.join(
                pairingFolder,
                `pairing_${teleId}.json`
            );

        while (
            attempts < 20
        ) {

            if (
                fs.existsSync(
                    pairingFile
                )
            ) {

                try {

                    cuObj =
                        JSON.parse(
                            fs.readFileSync(
                                pairingFile,
                                'utf-8'
                            )
                        );

                    break;

                } catch (e) {}
            }

            await new Promise(
                r =>
                    setTimeout(
                        r,
                        1000
                    )
            );

            attempts++;
        }

        if (cuObj) {

            const pairingStyle =
                `<blockquote>▰▰▰▰▰▰▰▰▰▰\n> ╢ PAIRING CODE ♰\n👤 User: ${mention}\n╭▰▰▰▰▰▰▰◈\n┆🔑 Code: <code>${cuObj.code}</code>\n╰▰▰▰▰▰▰▰◈</blockquote>`;

            ctx.reply(
                pairingStyle,
                {

                    parse_mode: 'HTML',

                    reply_to_message_id:
                        ctx.message?.message_id
                }
            );

        } else {

            ctx.reply(
                `<blockquote>❌ ${mention}, ${t.codeError}</blockquote>`,
                {

                    parse_mode: 'HTML',

                    reply_to_message_id:
                        ctx.message?.message_id
                }
            );
        }
    }
);

// ==========================================================
// CHECK JOIN
// ==========================================================

bot.action(
    'check_join',
    async (ctx) => {

        const chatId =
            ctx.chat.id;

        const lng =
            getLang(chatId);

        const t =
            langData[lng] ||
            langData.en;

        if (
            await checkChannels(ctx)
        ) {

            await ctx.editMessageText(
                `<blockquote>${t.joinSuccess}</blockquote>`,
                {
                    parse_mode: 'HTML'
                }
            );

            ctx.answerCbQuery(
                t.accessAuthorized
            );

        } else {

            ctx.answerCbQuery(
                t.joinError,
                {
                    show_alert: true
                }
            );
        }
    }
);

// ==========================================================
// /LISTPAIR
// ==========================================================

bot.command(
    'listpair',
    async (ctx) => {

        if (!isOwner(ctx)) return;

        if (!ensurePrivate(ctx)) return;

        const mention =
            ctx.userMention();

        const activeSessions =
            getActiveSessions();

        const chatId =
            ctx.chat.id;

        const lng =
            getLang(chatId);

        const t =
            langData[lng] ||
            langData.en;

        if (
            activeSessions.length === 0
        ) {

            return ctx.reply(
                `<blockquote>${mention}, ${t.noDevices}</blockquote>`,
                {
                    parse_mode: 'HTML',

                    reply_to_message_id:
                        ctx.message?.message_id
                }
            );
        }

        let text =
            `<blockquote>👤 User : ${mention}\n> ╢ CONNECTED : ${activeSessions.length}/60 ♰\n`;

        activeSessions.forEach(
            (number, i) => {

                let userName =
                    'Unknown';

                let teleId =
                    'N/A';

                try {

                    const metaPath =
                        path.join(
                            pairingFolder,
                            number,
                            'metadata.json'
                        );

                    if (
                        fs.existsSync(
                            metaPath
                        )
                    ) {

                        const data =
                            JSON.parse(
                                fs.readFileSync(
                                    metaPath,
                                    'utf-8'
                                )
                            );

                        userName =
                            data.userName ||
                            'Unknown';

                        teleId =
                            data.teleId ||
                            'N/A';
                    }

                } catch (e) {}

                text +=
                    `┆❏ ${i + 1}. <b>${userName}</b> (${number}) [TeleID: ${teleId}]\n`;
            }
        );

        text +=
            `</blockquote>`;

        ctx.reply(
            text,
            {

                parse_mode: 'HTML',

                reply_to_message_id:
                    ctx.message?.message_id
            }
        );
    }
);

// ==========================================================
// /DELPAIR
// ==========================================================

bot.command(
    'delpair',
    async (ctx) => {

        if (!isOwner(ctx)) return;

        if (!ensurePrivate(ctx)) return;

        const mention =
            ctx.userMention();

        const chatId =
            ctx.chat.id;

        const lng =
            getLang(chatId);

        const t =
            langData[lng] ||
            langData.en;

        const arg =
            ctx.message.text
                .split(' ')[1];

        if (!arg) {

            return ctx.reply(
                `<blockquote>⚠️ ${mention}, ${t.delPairUsage}</blockquote>`,
                {

                    parse_mode: 'HTML',

                    reply_to_message_id:
                        ctx.message?.message_id
                }
            );
        }

        let teleId =
            arg.replace(
                /\D/g,
                ''
            );

        let foundNumber = null;

        const activeSessions =
            getActiveSessions();

        for (
            const number of activeSessions
        ) {

            try {

                const metaPath =
                    path.join(
                        pairingFolder,
                        number,
                        'metadata.json'
                    );

                if (
                    fs.existsSync(
                        metaPath
                    )
                ) {

                    const data =
                        JSON.parse(
                            fs.readFileSync(
                                metaPath,
                                'utf-8'
                            )
                        );

                    if (
                        String(data.teleId) ===
                            teleId ||
                        number === teleId
                    ) {

                        foundNumber =
                            number;

                        teleId =
                            String(
                                data.teleId ||
                                teleId
                            );

                        break;
                    }
                }

            } catch (e) {}
        }

        if (foundNumber) {

            forceCleanupSession(
                foundNumber,
                teleId
            );

            return ctx.reply(
                `<blockquote>✅ ${mention}, Session <code>${foundNumber}</code> ${t.sessionDisconnected}</blockquote>`,
                {

                    parse_mode: 'HTML',

                    reply_to_message_id:
                        ctx.message?.message_id
                }
            );
        }

        if (
            fs.existsSync(
                path.join(
                    pairingFolder,
                    teleId
                )
            )
        ) {

            forceCleanupSession(
                teleId,
                'default'
            );

            return ctx.reply(
                `<blockquote>✅ ${mention}, Session <code>${teleId}</code> ${t.sessionDisconnected}</blockquote>`,
                {

                    parse_mode: 'HTML',

                    reply_to_message_id:
                        ctx.message?.message_id
                }
            );
        }

        ctx.reply(
            `<blockquote>❌ ${mention}, ${t.sessionNotFound}</blockquote>`,
            {

                parse_mode: 'HTML',

                reply_to_message_id:
                    ctx.message?.message_id
            }
        );
    }
);

// ==========================================================
// /BROADCAST
// ==========================================================

bot.command(
    'broadcast',
    async (ctx) => {

        if (!isOwner(ctx)) return;

        if (!ensurePrivate(ctx)) return;

        const mention =
            ctx.userMention();

        const chatId =
            ctx.chat.id;

        const lng =
            getLang(chatId);

        const t =
            langData[lng] ||
            langData.en;

        const messageText =
            ctx.message.text
                .split(' ')
                .slice(1)
                .join(' ');

        if (!messageText) {

            return ctx.reply(
                `<blockquote>⚠️ ${mention}, ${t.broadcastUsage}</blockquote>`,
                {

                    parse_mode: 'HTML',

                    reply_to_message_id:
                        ctx.message?.message_id
                }
            );
        }

        let targetIds = [];

        try {

            if (
                fs.existsSync(
                    usersFilePath
                )
            ) {

                targetIds =
                    JSON.parse(
                        fs.readFileSync(
                            usersFilePath,
                            'utf8'
                        )
                    );
            }

        } catch (e) {}

        if (
            targetIds.length === 0
        ) {

            return ctx.reply(
                `<blockquote>❌ ${mention}, ${t.noUsers}</blockquote>`,
                {

                    parse_mode: 'HTML',

                    reply_to_message_id:
                        ctx.message?.message_id
                }
            );
        }

        await ctx.reply(
            `<blockquote>⏳ ${mention}, ${t.broadcasting} <b>${targetIds.length}</b> ${t.usersCount}</blockquote>`,
            {
                parse_mode: 'HTML'
            }
        );

        let successCount = 0;
        let failCount = 0;

        for (
            const teleId of targetIds
        ) {

            try {

                await bot.telegram.sendMessage(
                    teleId,

                    `<blockquote>📢 <b>ANNONCE - KAYA BOT</b>\n\n${messageText}</blockquote>`,

                    {
                        parse_mode: 'HTML'
                    }
                );

                successCount++;

            } catch (error) {

                failCount++;
            }

            await new Promise(
                r =>
                    setTimeout(
                        r,
                        50
                    )
            );
        }

        await ctx.reply(
            `<blockquote>✅ ${mention}, <b>${t.broadcastDone}</b>\n\n📤 ${t.sentSuccess} <b>${successCount}</b>\n❌ ${t.fails} <b>${failCount}</b></blockquote>`,
            {
                parse_mode: 'HTML'
            }
        );
    }
);

// ==========================================================
// GESTION ROBUSTE DES ERREURS
// ==========================================================

bot.catch(
    (err, ctx) => {

        console.error(
            `[TELEGRAF ERROR] dans la mise à jour ${ctx.updateType}:`,
            err
        );
    }
);

// ==========================================================
// LANCEMENT DU BOT
// ==========================================================

const startTelegramBot = () => {

    bot.launch({
        dropPendingUpdates: true

    }).then(() => {

        console.log(
            '▉ KAYA BOT is online with active token & full commands.'
        );

    }).catch((err) => {

        console.error(
            '⚠️ Connexion Telegram perdue, nouvelle tentative dans 5 secondes...',
            err
        );

        setTimeout(
            startTelegramBot,
            5000
        );
    });
};

startTelegramBot();

// ==========================================================
// ARRÊT PROPRE
// ==========================================================

process.once(
    'SIGINT',
    () => bot.stop('SIGINT')
);

process.once(
    'SIGTERM',
    () => bot.stop('SIGTERM')
);