import {
    proto,
    getContentType,
    areJidsSameUser,
    generateWAMessage
} from "@whiskeysockets/baileys"

import fs from "fs"
import axios from "axios"
import moment from "moment-timezone"
import util from "util"
import Jimp from "jimp"
import chalk from "chalk"

// ===== UTILS =====

export const unixTimestampSeconds = (date = new Date()) =>
    Math.floor(date.getTime() / 1000)

export const getRandom = (ext) =>
    `${Math.floor(Math.random() * 10000)}${ext}`

export const sleep = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms))

export const isUrl = (url) =>
    url.match(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi
    )

export const bytesToSize = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return (
        parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) +
        " " +
        sizes[i]
    )
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

    return `${d}d ${h}h ${m}m ${s}s`
}

export const clockString = (ms) => {
    const h = isNaN(ms) ? "--" : Math.floor(ms / 3600000)
    const m = isNaN(ms) ? "--" : Math.floor(ms / 60000) % 60
    const s = isNaN(ms) ? "--" : Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, "0")).join(":")
}

export const formatDate = (n, locale = "id") => {
    const d = new Date(n)
    return d.toLocaleDateString(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
    })
}

export const parseMention = (text = "") =>
    [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
        v => v[1] + "@s.whatsapp.net"
    )

// ===== SMESSAGE SERIALIZER =====

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
            const type = Object.keys(m.quoted)[0]
            m.quoted = m.quoted[type]

            m.quoted.mtype = type
            m.quoted.id = m.msg.contextInfo.stanzaId
            m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
            m.quoted.sender = client.decodeJid(
                m.msg.contextInfo.participant
            )

            m.quoted.fromMe =
                m.quoted.sender === client.decodeJid(client.user.id)

            m.quoted.text =
                m.quoted.text ||
                m.quoted.caption ||
                m.quoted.conversation ||
                ""
        }
    }

    m.reply = (text) => client.sendText(m.chat, text, m)

    m.copy = () => smsg(client, M.fromObject(M.toObject(m)))

    m.copyNForward = (jid, force = false, opt = {}) =>
        client.copyNForward(jid, m, force, opt)

    return m
}