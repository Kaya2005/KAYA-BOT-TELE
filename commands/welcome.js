import fs from 'fs';
import path from 'path';
import { getContextInfo } from '../setting/contextInfo.js';
import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';
import { getSetting, setSetting } from '../setting.js';

const welcomeCache = new Set();

const delayMs = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));

/**
 * Initialise le système Welcome UNE SEULE FOIS.
 *
 * Important :
 * On utilise settings.json comme mémoire permanente.
 *
 * Première fois :
 * welcomeInitialized = true
 * welcomeAll = "on" (inchangé)
 */
async function ensureWelcomeInitialized(ownerId) {
    try {
        const initialized = getSetting(
            ownerId,
            'welcomeInitialized',
            false
        );

        if (initialized) {
            return;
        }

        await setSetting(
            ownerId,
            'welcomeInitialized',
            true
        );

        await setSetting(
            ownerId,
            'welcomeAll',
            'on'
        );

        console.log(
            `[WELCOME] Première initialisation pour ${ownerId} : welcomeAll = ON`
        );

    } catch (e) {
        console.error(
            '[WELCOME] Initialization error:',
            e
        );
    }
}

export default {

    name: 'welcome',

    alias: [
        'bienvenue',
        'wel'
    ],

    description: 'Manage welcome messages',

    category: 'Group',

    ownerOnly: true,

    /**
     * WELCOME COMMAND
     */
    async execute(
        kaya,
        mek,
        from,
        args,
        prefix
    ) {

        try {

            const status =
                await checkAdminOrOwner(
                    kaya,
                    from,
                    mek.sender
                );

            if (!status.isBotOwner) {

                return kaya.sendMessage(
                    from,
                    {
                        text: '❌ Owner Only',
                        contextInfo:
                            getContextInfo(
                                mek.sender
                            )
                    },
                    {
                        quoted: mek
                    }
                );
            }

            const ownerId =
                kaya.user.id
                    .split(':')[0];

            const groupId =
                from.split('@')[0];

            await ensureWelcomeInitialized(
                ownerId
            );

            const action =
                args
                    .map(a =>
                        a.toLowerCase()
                    )
                    .join(' ');

            /*
             * MENU
             */
            if (!action) {

                return kaya.sendMessage(
                    from,
                    {
                        text:
`⚙️ *WELCOME SETTINGS*

${prefix}welcome on
${prefix}welcome off
${prefix}welcome all
${prefix}welcome all off
${prefix}welcome status`,
                        contextInfo:
                            getContextInfo(
                                mek.sender
                            )
                    },
                    {
                        quoted: mek
                    }
                );
            }

            /*
             * ENABLE POUR LE GROUPE ACTUEL
             */
            if (action === 'on') {

                await setSetting(
                    ownerId,
                    'welcomeEnabled',
                    true,
                    groupId
                );

                return kaya.sendMessage(
                    from,
                    {
                        text:
                            '✅ Welcome enabled for this group.',
                        contextInfo:
                            getContextInfo(
                                mek.sender
                            )
                    },
                    {
                        quoted: mek
                    }
                );
            }

            /*
             * DISABLE POUR LE GROUPE ACTUEL ET GLOBAL (WELCOME OFF)
             */
            if (action === 'off') {

                // Désactive pour le groupe actuel
                await setSetting(
                    ownerId,
                    'welcomeEnabled',
                    false,
                    groupId
                );

                // Désactive également globalement pour tout couper
                await setSetting(
                    ownerId,
                    'welcomeAll',
                    'off'
                );

                return kaya.sendMessage(
                    from,
                    {
                        text:
                            '❌ Welcome disabled completely (Local & Global off).',
                        contextInfo:
                            getContextInfo(
                                mek.sender
                            )
                    },
                    {
                        quoted: mek
                    }
                );
            }

            /*
             * ENABLE GLOBAL
             *
             * welcome all
             */
            if (action === 'all') {

                await setSetting(
                    ownerId,
                    'welcomeAll',
                    'on'
                );

                return kaya.sendMessage(
                    from,
                    {
                        text:
                            '✅ Welcome enabled globally for all your groups.',
                        contextInfo:
                            getContextInfo(
                                mek.sender
                            )
                    },
                    {
                        quoted: mek
                    }
                );
            }

            /*
             * DISABLE GLOBAL
             *
             * welcome all off
             */
            if (action === 'all off') {

                await setSetting(
                    ownerId,
                    'welcomeAll',
                    'off'
                );

                return kaya.sendMessage(
                    from,
                    {
                        text:
                            '❌ Welcome disabled globally for all your groups.',
                        contextInfo:
                            getContextInfo(
                                mek.sender
                            )
                    },
                    {
                        quoted: mek
                    }
                );
            }

            /*
             * STATUS
             */
            if (action === 'status') {

                const isLocalEnabled =
                    getSetting(
                        ownerId,
                        'welcomeEnabled',
                        false,
                        groupId
                    );

                const isAll =
                    getSetting(
                        ownerId,
                        'welcomeAll',
                        'off'
                    );

                const initialized =
                    getSetting(
                        ownerId,
                        'welcomeInitialized',
                        false
                    );

                return kaya.sendMessage(
                    from,
                    {
                        text:
`📊 *WELCOME STATUS*

Local: ${isLocalEnabled ? 'ON' : 'OFF'}
Global (All): ${String(isAll).toUpperCase()}
Initialized: ${initialized ? 'YES' : 'NO'}`,
                        contextInfo:
                            getContextInfo(
                                mek.sender
                            )
                    },
                    {
                        quoted: mek
                    }
                );
            }

        } catch (e) {

            console.error(
                'Welcome command error:',
                e
            );
        }
    },

    /**
     * WELCOME NEW MEMBERS
     */
    async participantUpdate(
        kaya,
        update
    ) {

        try {

            if (
                update.action !== 'add' &&
                update.action !== 'invite'
            ) {
                return;
            }

            const from =
                update.id;

            const groupId =
                from.split('@')[0];

            const ownerId =
                kaya.user.id
                    .split(':')[0];

            await ensureWelcomeInitialized(
                ownerId
            );

            const isAll =
                getSetting(
                    ownerId,
                    'welcomeAll',
                    'off'
                );

            let isEnabled = false;

            if (isAll === 'on') {

                isEnabled = true;

            } else {

                isEnabled =
                    getSetting(
                        ownerId,
                        'welcomeEnabled',
                        false,
                        groupId
                    );
            }

            if (!isEnabled) {
                return;
            }

            const metadata =
                await kaya
                    .groupMetadata(from)
                    .catch(() => ({}));

            const groupName =
                metadata.subject ||
                'this group';

            const memberCount =
                metadata.participants
                    ? metadata
                        .participants
                        .length
                    : 0;

            const creationDate =
                metadata.creation
                    ? new Date(
                        metadata.creation *
                        1000
                    ).toLocaleDateString(
                        'en-GB',
                        {
                            timeZone:
                                'Africa/Lubumbashi'
                        }
                    )
                    : 'Unknown';

            const nowObj =
                new Date();

            const time =
                nowObj.toLocaleTimeString(
                    'en-GB',
                    {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone:
                            'Africa/Lubumbashi'
                    }
                );

            const date =
                nowObj.toLocaleDateString(
                    'en-GB',
                    {
                        timeZone:
                            'Africa/Lubumbashi'
                    }
                );

            const logoPath =
                path.join(
                    process.cwd(),
                    'setting',
                    'logo.png'
                );

            const logoBuffer =
                fs.existsSync(logoPath)
                    ? fs.readFileSync(
                        logoPath
                    )
                    : null;

            for (
                const user
                of update.participants
            ) {

                const userId =
                    typeof user === 'string'
                        ? user
                        : user.id;

                if (!userId) {
                    continue;
                }

                if (
                    welcomeCache.has(
                        userId
                    )
                ) {
                    continue;
                }

                welcomeCache.add(
                    userId
                );

                setTimeout(
                    () => {
                        welcomeCache.delete(
                            userId
                        );
                    },
                    30000
                );

                const randomDelay =
                    Math.floor(
                        Math.random() *
                        1000
                    ) + 4000;

                await delayMs(
                    randomDelay
                );

                const userNumber =
                    userId.split('@')[0];

                const userTag =
                    `@${userNumber}`;

                const welcomeMessage =
`🎉 Welcome to ${groupName} !

▰▰▰▰▰▰▰▰▰▰
➠ ᴛɪᴍᴇ : ${time}
➠ ᴅᴀᴛᴇ : ${date}
➠ ᴄʀᴇᴀᴛɪᴏɴ : ${creationDate}
➠ ᴍᴇᴍʙᴇʀs : ${memberCount}
╭▰▰▰▰▰▰▰◈
┆❏ 🙋 ᴜsᴇʀɴᴀᴍᴇ : ${userTag}
╰▰▰▰▰▰▰▰◈`.trim();

                const sendPayload = {
                    mentions: [
                        userId
                    ],

                    contextInfo:
                        getContextInfo(
                            ownerId +
                            '@s.whatsapp.net'
                        )
                };

                if (logoBuffer) {

                    sendPayload.image =
                        logoBuffer;

                    sendPayload.caption =
                        welcomeMessage;

                } else {

                    sendPayload.text =
                        welcomeMessage;
                }

                await kaya.sendMessage(
                    from,
                    sendPayload
                );
            }

        } catch (e) {

            console.error(
                'Welcome participantUpdate error:',
                e
            );
        }
    }
};
