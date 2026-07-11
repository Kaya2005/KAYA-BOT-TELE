import baileysPro from "baileys-pro";
import fs from "node:fs";
import PhoneNumber from "awesome-phonenumber";
import axios from "axios";
import mime from "mime-types";
import Jimp from "jimp";
import path from "path";
import FileType from "file-type";

const config = baileysPro;

export default (connection, store) => {
  global.ephemeral = {
    ephemeralExpiration: config.WA_DEFAULT_EPHEMERAL,
  };

  const sock = config.makeWASocket(connection);

  sock.decodeJid = (jid) => {
    if (!jid) return jid;

    if (/:\d+@/gi.test(jid)) {
      const decode = config.jidDecode(jid) || {};
      return (
        (decode.user && decode.server && `${decode.user}@${decode.server}`) ||
        jid
      );
    }

    return jid;
  };

  sock.sendButtonMessage = async (
    jid,
    array,
    quoted,
    json = {},
    options = {}
  ) => {
    const result = [];

    for (const data of array) {
      if (data.type === "reply") {
        for (const pair of data.value) {
          result.push({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: pair[0],
              id: pair[1],
            }),
          });
        }
      } else if (data.type === "url") {
        for (const pair of data.value) {
          result.push({
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: pair[0],
              url: pair[1],
              merBott_url: pair[1],
            }),
          });
        }
      } else if (data.type === "copy") {
        for (const pair of data.value) {
          result.push({
            name: "cta_copy",
            buttonParamsJson: JSON.stringify({
              display_text: pair[0],
              copy_code: pair[1],
            }),
          });
        }
      } else if (data.type === "list") {
        const transformedData = data.value.map((item) => ({
          ...(item.headers ? { title: item.headers } : {}),
          rows: item.rows.map((row) => ({
            header: row.headers,
            title: row.title,
            description: row.body,
            id: row.command,
          })),
        }));

        const listMessage = {
          title: data.title,
          sections: transformedData,
        };

        result.push({
          name: "single_select",
          buttonParamsJson: JSON.stringify(listMessage),
        });
      }
    }

    let msg;

    if (json.url) {
      const file = await sock.getFile(json.url);
      const mimeType = file.mime.split("/")[0];

      const mediaMessage = await config.prepareWAMessageMedia(
        {
          ...(mimeType === "image"
            ? { image: file.data }
            : mimeType === "video"
            ? { video: file.data }
            : {
                document: file.data,
                mimetype: file.mime,
                fileName:
                  json.filename || "AkiraaBot." + mime.extension(file.mime),
              }),
        },
        { upload: sock.waUploadToServer }
      );

      msg = config.generateWAMessageFromContent(
        jid,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
              },
              interactiveMessage:
                config.proto.Message.InteractiveMessage.create({
                  body:
                    config.proto.Message.InteractiveMessage.Body.create({
                      text: json.body,
                    }),
                  footer:
                    config.proto.Message.InteractiveMessage.Footer.create({
                      text: json.footer,
                    }),
                  header:
                    config.proto.Message.InteractiveMessage.Header.create({
                      hasMediaAttachment: true,
                      ...mediaMessage,
                    }),
                  nativeFlowMessage:
                    config.proto.Message.InteractiveMessage.NativeFlowMessage.create(
                      {
                        buttons: result,
                      }
                    ),
                  ...options,
                }),
            },
          },
        },
        {
          userJid: sock.user.jid,
          quoted,
          upload: sock.waUploadToServer,
          ...ephemeral,
        }
      );
    } else {
      msg = config.generateWAMessageFromContent(
        jid,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
              },
              interactiveMessage:
                config.proto.Message.InteractiveMessage.create({
                  body:
                    config.proto.Message.InteractiveMessage.Body.create({
                      text: json.body,
                    }),
                  footer:
                    config.proto.Message.InteractiveMessage.Footer.create({
                      text: json.footer,
                    }),
                  header:
                    config.proto.Message.InteractiveMessage.Header.create({
                      hasMediaAttachment: false,
                    }),
                  nativeFlowMessage:
                    config.proto.Message.InteractiveMessage.NativeFlowMessage.create(
                      {
                        buttons:
                          result.length > 0
                            ? result
                            : [{ text: "" }],
                      }
                    ),
                  ...options,
                }),
            },
          },
        },
        {
          userJid: sock.user.jid,
          quoted,
          upload: sock.waUploadToServer,
          ...ephemeral,
        }
      );
    }

    await sock.relayMessage(msg.key.remoteJid, msg.message, {
      messageId: msg.key.id,
    });

    return msg;
  };

  sock.appendTextMessage = async (m, text, chatUpdate) => {
    const messages = await config.generateWAMessage(
      m.cht,
      {
        text,
        mentions: m.mentions,
      },
      {
        userJid: sock.user.id,
        quoted: m.quoted,
        ...ephemeral,
      }
    );

    messages.key.fromMe = config.areJidsSameUser(
      m.sender,
      sock.user.id
    );

    messages.key.id = m.key.id;
    messages.pushName = m.pushName;

    if (m.isGroup) messages.participant = m.sender;

    const msg = {
      ...chatUpdate,
      messages: [config.proto.WebMessageInfo.fromObject(messages)],
      type: "append",
    };

    sock.ev.emit("messages.upsert", msg);
    return m;
  };

  sock.delay = (ms) => new Promise((r) => setTimeout(r, ms));

  sock.getFile = async (PATH) => {
    let res;
    let filename;

    const data = Buffer.isBuffer(PATH)
      ? PATH
      : /^data:.*?\/.*?;base64,/i.test(PATH)
      ? Buffer.from(PATH.split(",")[1], "base64")
      : /^https?:\/\//.test(PATH)
      ? (res = await axios.get(PATH, {
          responseType: "arraybuffer",
        }))
      : fs.existsSync(PATH)
      ? ((filename = PATH), fs.readFileSync(PATH))
      : Buffer.alloc(0);

    if (!Buffer.isBuffer(data.data || data)) {
      throw new TypeError("Result is not a buffer");
    }

    const type = res
      ? {
          mime: res.headers["content-type"],
          ext: mime.extension(res.headers["content-type"]),
        }
      : (await FileType.fromBuffer(data)) || {
          mime: "application/bin",
          ext: ".bin",
        };

    return {
      filename,
      ...type,
      data: data.data ? data.data : data,
      deleteFile: () => filename && fs.promises.unlink(filename),
    };
  };

  sock.sendContact = async (jid, data, quoted, options) => {
    if (!Array.isArray(data[0]) && typeof data[0] === "string") {
      data = [data];
    }

    const contacts = [];

    for (let [number, name] of data) {
      number = number.replace(/[^0-9]/g, "");
      const njid = number + "@s.whatsapp.net";

      const biz =
        (await sock.getBusinessProfile(njid).catch(() => null)) || {};

      const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${name.replace(/\n/g, "\\n")}
TEL;type=CELL;waid=${number}:${PhoneNumber(
        "+" + number
      ).getNumber("international")}
END:VCARD
`.trim();

      contacts.push({ vcard, displayName: name });
    }

    return sock.sendMessage(
      jid,
      {
        contacts: {
          displayName:
            contacts.length >= 2
              ? `${contacts.length} contacts`
              : contacts[0].displayName,
          contacts,
        },
      },
      { quoted, ...options, ...ephemeral }
    );
  };

  sock.sendFile = async (
    jid,
    media,
    filename = null,
    caption = null,
    quoted = null,
    options = {}
  ) => {
    const data = await sock.getFile(media);

    const buffer = data.data;
    const mimeType = data.mime || "application/octet-stream";
    const ext = data.ext || ".tmp";

    const isSticker = data.ext === "webp";

    if (options.useDocument) {
      return sock.sendMessage(
        jid,
        {
          document: buffer,
          fileName: filename || "file" + ext,
          caption,
          mimetype: mimeType,
          ...options,
        },
        { quoted, ...global.ephemeral }
      );
    }

    if (/image/.test(mimeType) && !isSticker) {
      return sock.sendMessage(
        jid,
        { image: buffer, caption, mimetype: mimeType, ...options },
        { quoted, ...global.ephemeral }
      );
    }

    if (/video/.test(mimeType)) {
      return sock.sendMessage(
        jid,
        { video: buffer, caption, mimetype: mimeType, ...options },
        { quoted, ...global.ephemeral }
      );
    }

    if (/audio/.test(mimeType)) {
      return sock.sendMessage(
        jid,
        { audio: buffer, ...options },
        { quoted, ...global.ephemeral }
      );
    }

    return sock.sendMessage(
      jid,
      {
        document: buffer,
        fileName: filename || "file" + ext,
        mimetype: mimeType,
        caption,
        ...options,
      },
      { quoted, ...global.ephemeral }
    );
  };

  sock.resize = async (image, width, height) => {
    const img = await Jimp.read(image);
    return await img
      .resize(width, height)
      .getBufferAsync(Jimp.MIME_JPEG);
  };

  sock.parseMention = (text = "") =>
    [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
      (v) => v[1] + "@s.whatsapp.net"
    );

  sock.serializeM = (m) =>
    import("./serialize.js").then((mod) =>
      mod.default(m, sock, store)
    );

  Object.defineProperty(sock, "name", {
    value: "WASocket",
    configurable: true,
  });

  return sock;
};