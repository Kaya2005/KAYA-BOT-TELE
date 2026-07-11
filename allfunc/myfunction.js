/**
 * Create By king Badboi .
 * Contact Me on wa.me/2348140825959
*/

import {
    extractMessageContent,
    jidNormalizedUser,
    proto,
    delay,
    getContentType,
    areJidsSameUser,
    generateWAMessage
} from "@whiskeysockets/baileys"

import chalk from "chalk"
import fs from "fs"
import Crypto from "crypto"
import axios from "axios"
import moment from "moment-timezone"
import { sizeFormatter } from "human-readable"
import util from "util"
import { defaultMaxListeners } from "stream"
import { read, MIME_JPEG } from "jimp"

import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ===== UTIL =====

export const unixTimestampSeconds = (date = new Date()) =>
    Math.floor(date.getTime() / 1000)

export const generateMessageTag = (epoch) => {
    let tag = unixTimestampSeconds().toString()
    if (epoch) tag += ".--" + epoch
    return tag
}

export const processTime = (timestamp, now) => {
    return moment.duration(now - moment(timestamp * 1000)).asSeconds()
}

export const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`
}

export const getBuffer = async (url, options = {}) => {
    try {
        const res = await axios({
            method: "get",
            url,
            headers: {
                DNT: 1,
                "Upgrade-Insecure-Request": 1
            },
            ...options,
            responseType: "arraybuffer"
        })
        return res.data
    } catch (err) {
        return err
    }
}

export const formatSize = (bytes) => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    if (bytes === 0) return "0 Bytes"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i]
}

export const fetchJson = async (url, options = {}) => {
    try {
        const res = await axios({
            method: "GET",
            url,
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            ...options
        })
        return res.data
    } catch (err) {
        return err
    }
}

export const runtime = (seconds) => {
    seconds = Number(seconds)
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor((seconds % (3600 * 24)) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)

    return `${d} days ${h} hours ${m} minutes ${s} seconds`
}

export const clockString = (ms) => {
    const h = isNaN(ms) ? "--" : Math.floor(ms / 3600000)
    const m = isNaN(ms) ? "--" : Math.floor(ms / 60000) % 60
    const s = isNaN(ms) ? "--" : Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(":")
}

export const reSize = async (buffer, x, z) => {
    const img = await read(buffer)
    return await img.resize(x, z).getBufferAsync(MIME_JPEG)
}

export const sleep = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms))

export const isUrl = (url) =>
    url.match(
        new RegExp(
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/,
            "gi"
        )
    )

export const getTime = (format, date) => {
    return date
        ? moment(date).locale("id").format(format)
        : moment.tz("Asia/Jakarta").locale("id").format(format)
}

export const jsonformat = (string) =>
    JSON.stringify(string, null, 2)

export const logic = (check, inp, out) => {
    if (inp.length !== out.length)
        throw new Error("Input and Output must have same length")
    for (let i in inp)
        if (util.isDeepStrictEqual(check, inp[i])) return out[i]
    return null
}

export const generateProfilePicture = async (buffer) => {
    const jimp = await read(buffer)
    const min = jimp.getWidth()
    const cropped = jimp.crop(0, 0, min, min)

    return {
        img: await cropped
            .scaleToFit(720, 720)
            .getBufferAsync(MIME_JPEG),
        preview: await cropped
            .scaleToFit(720, 720)
            .getBufferAsync(MIME_JPEG)
    }
}

// ===== SMESSAGE =====

export const smsg = (client, m, store) => {
    if (!m) return m
    const M = proto.WebMessageInfo

    if (m.key) {
        m.id = m.key.id
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith("@g.us")
        m.sender = client.decodeJid(
            m.fromMe
                ? client.user.id
                : m.participant || m.key.participant || m.chat
        )
    }

    if (m.message) {
        m.mtype = getContentType(m.message)
        m.msg =
            m.mtype === "viewOnceMessage"
                ? m.message[m.mtype].message[
                      getContentType(m.message[m.mtype].message)
                  ]
                : m.message[m.mtype]

        m.body =
            m.message.conversation ||
            m.msg?.caption ||
            m.msg?.text ||
            m.text ||
            ""

        const quoted = m.msg?.contextInfo?.quotedMessage

        m.quoted = quoted || null

        if (m.quoted) {
            const type = getContentType(quoted)
            m.quoted = m.quoted[type]
        }
    }

    m.reply = (text) =>
        client.sendText(m.chat, text, m)

    return m
}

// ===== WATCH FILE (ESM VERSION) =====

fs.watchFile(__filename, () => {
    fs.unwatchFile(__filename)
    console.log(chalk.redBright(`Update ${__filename}`))
    import(`file://${__filename}?update=${Date.now()}`)
})