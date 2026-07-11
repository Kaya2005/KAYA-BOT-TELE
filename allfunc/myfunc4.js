/**
 * Create By king Badboi .
 * Contact Me on wa.me/2348140825959
 */

import { proto, delay, getContentType } from '@whiskeysockets/baileys'
import chalk from 'chalk'
import axios from 'axios'
import { sizeFormatter } from 'human-readable'
import fs from 'fs'
import Jimp from 'jimp'

// exports serialize
export const serialize = (ptz, m) => {
  m.isGroup = m.key.remoteJid.endsWith('@g.us')

  try {
    const berak = Object.keys(m.message)[0]
    m.type = berak
  } catch {
    m.type = null
  }

  try {
    const context = m.message[m.type].contextInfo.quotedMessage
    if (context['ephemeralMessage']) {
      m.quotedMsg = context.ephemeralMessage.message
    } else {
      m.quotedMsg = context
    }

    m.isQuotedMsg = true
    m.quotedMsg.sender = m.message[m.type].contextInfo.participant
    m.quotedMsg.fromMe =
      m.quotedMsg.sender ===
      ramz.user.id.split(':')[0] + '@s.whatsapp.net'
        ? true
        : false

    m.quotedMsg.type = Object.keys(m.quotedMsg)[0]

    let ane = m.quotedMsg
    m.quotedMsg.chats =
      (ane.type === 'conversation' && ane.conversation) ||
      (ane.type == 'imageMessage' && ane.imageMessage.caption) ||
      (ane.type == 'documentMessage' && ane.documentMessage.caption) ||
      (ane.type == 'videoMessage' && ane.videoMessage.caption) ||
      (ane.type == 'extendedTextMessage' && ane.extendedTextMessage.text) ||
      (ane.type == 'buttonsMessage' && ane.buttonsMessage.contentText) ||
      ''

    m.quotedMsg.id = m.message[m.type].contextInfo.stanzaId
  } catch {
    m.quotedMsg = null
    m.isQuotedMsg = false
  }

  try {
    const mention = m.message[m.type].contextInfo.mentionedJid
    m.mentioned = mention
  } catch {
    m.mentioned = []
  }

  if (m.isGroup) {
    m.sender = m.participant
  } else {
    m.sender = m.key.remoteJid
  }

  if (m.key.fromMe) {
    m.sender =
      ptz.user.id.split(':')[0] + '@s.whatsapp.net'
  }

  m.from = m.key.remoteJid
  m.now = m.messageTimestamp
  m.fromMe = m.key.fromMe

  return m
}

export const randomInt = (min, max) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const color = (text, color) => {
  return !color ? chalk.green(text) : chalk.keyword(color)(text)
}

export const getGroupAdmins = (participants) => {
  let admins = []
  for (let i of participants) {
    i.admin === 'superadmin'
      ? admins.push(i.id)
      : i.admin === 'admin'
      ? admins.push(i.id)
      : ''
  }
  return admins || []
}

export const generateProfilePicture = async (buffer) => {
  const jimp = await Jimp.read(buffer)
  const min = jimp.getWidth()
  const max = jimp.getHeight()
  const cropped = jimp.crop(0, 0, min, max)

  return {
    img: await cropped
      .scaleToFit(720, 720)
      .getBufferAsync(Jimp.MIME_JPEG),
    preview: await cropped
      .scaleToFit(720, 720)
      .getBufferAsync(Jimp.MIME_JPEG),
  }
}

export const getBuffer = async (url, options) => {
  try {
    const res = await axios({
      method: 'get',
      url,
      headers: {
        DNT: 1,
        'Upgrade-Insecure-Request': 1,
      },
      ...options,
      responseType: 'arraybuffer',
    })
    return res.data
  } catch (err) {
    return err
  }
}

export const toRupiah = (x) => {
  x = x.toString()
  var pattern = /(-?\d+)(\d{3})/
  while (pattern.test(x)) x = x.replace(pattern, '$1.$2')
  return x
}

export const sleep = async (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const parseMention = (text = '') => {
  return [
    ...text.matchAll(/@([0-9]{5,16}|0)/g),
  ].map((v) => v[1] + '@s.whatsapp.net')
}

export const bytesToSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = [
    'Bytes',
    'KB',
    'MB',
    'GB',
    'TB',
    'PB',
    'EB',
    'ZB',
    'YB',
  ]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (
    parseFloat(
      (bytes / Math.pow(k, i)).toFixed(dm)
    ) +
    ' ' +
    sizes[i]
  )
}

export const msToDate = (ms) => {
  let years = Math.floor(ms / (1000 * 60 * 60 * 24 * 365))
  let months = Math.floor(
    (ms % (1000 * 60 * 60 * 24 * 365)) /
      (1000 * 60 * 60 * 24 * 30)
  )
  let weeks = Math.floor(
    (ms % (1000 * 60 * 60 * 24 * 30)) /
      (1000 * 60 * 60 * 24 * 7)
  )
  let days = Math.floor(
    (ms % (1000 * 60 * 60 * 24 * 7)) /
      (1000 * 60 * 60 * 24)
  )

  return `${years} tahun ${months} bulan ${weeks} minggu ${days} hari`
}

export const msToDay = (ms) => {
  let temp = ms

  let years = Math.floor(temp / (365 * 24 * 60 * 60 * 1000))
  temp %= 365 * 24 * 60 * 60 * 1000

  let months = Math.floor(temp / (30 * 24 * 60 * 60 * 1000))
  temp %= 30 * 24 * 60 * 60 * 1000

  let weeks = Math.floor(temp / (7 * 24 * 60 * 60 * 1000))
  temp %= 7 * 24 * 60 * 60 * 1000

  let days = Math.floor(temp / (24 * 60 * 60 * 1000))

  let result = ''
  if (years) result += years + ' tahun '
  if (months) result += months + ' bulan '
  if (weeks) result += weeks + ' minggu '
  if (days) result += days + ' hari '

  return result.trim()
}

export const checkBandwidth = async () => {
  let ind = 0
  let out = 0

  for (let i of await require('node-os-utils').netstat.stats()) {
    ind += parseInt(i.inputBytes)
    out += parseInt(i.outputBytes)
  }

  return {
    download: bytesToSize(ind),
    upload: bytesToSize(out),
  }
}

export const formatSize = (bytes) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (
    (bytes / Math.pow(1024, i)).toFixed(2) +
    ' ' +
    sizes[i]
  )
}

export const getRandom = (ext) => {
  return `${Math.floor(Math.random() * 10000)}${ext}`
}

export const isUrl = (url) => {
  return url.match(
    new RegExp(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/,
      'gi'
    )
  )
}

export const jsonformat = (string) => {
  return JSON.stringify(string, null, 2)
}

export const nganuin = async (url, options) => {
  try {
    const res = await axios({
      method: 'GET',
      url,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      ...options,
    })
    return res.data
  } catch (err) {
    return err
  }
}

export const pickRandom = (ext) => {
  return `${Math.floor(Math.random() * 10000)}${ext}`
}

export const runtime = function (seconds) {
  seconds = Number(seconds)

  var d = Math.floor(seconds / (3600 * 24))
  var h = Math.floor(
    (seconds % (3600 * 24)) / 3600
  )
  var m = Math.floor((seconds % 3600) / 60)
  var s = Math.floor(seconds % 60)

  return `${d} days ${h} hours ${m} minutes ${s} seconds`
}

export const shorturl = async function (longUrl) {
  try {
    const response = await axios.post(
      'https://shrtrl.vercel.app/',
      { url: longUrl }
    )
    return response.data.data.shortUrl
  } catch (error) {
    return error
  }
}

export const formatp = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) =>
    `${literal} ${symbol}B`,
})

export const smsg = (ptz, m, store) => {
  try {
    if (!m) return m
    let M = proto.WebMessageInfo

    if (m.key) {
      m.id = m.key.id
      m.isBaileys =
        m.id.startsWith('BAE5') &&
        m.id.length === 16
      m.chat = m.key.remoteJid
      m.fromMe = m.key.fromMe
      m.isGroup = m.chat.endsWith('@g.us')
      m.sender = ptz.decodeJid(
        m.fromMe
          ? ptz.user.id
          : m.participant ||
              m.key.participant ||
              m.chat
      )
    }

    return m
  } catch (e) {}
}

// watcher (ESM version)
const file = new URL(import.meta.url).pathname

fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright(`Update ${file}`))
  import(file)
})