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

// serialize
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

    const ane = m.quotedMsg

    m.quotedMsg.chats =
      (ane.type === 'conversation' && ane.conversation) ||
      (ane.type == 'imageMessage' && ane.imageMessage.caption) ||
      (ane.type == 'documentMessage' && ane.documentMessage.caption) ||
      (ane.type == 'videoMessage' && ane.videoMessage.caption) ||
      (ane.type == 'extendedTextMessage' &&
        ane.extendedTextMessage.text) ||
      (ane.type == 'buttonsMessage' &&
        ane.buttonsMessage.contentText) ||
      ''

    m.quotedMsg.id = m.message[m.type].contextInfo.stanzaId
  } catch {
    m.quotedMsg = null
    m.isQuotedMsg = false
  }

  try {
    m.mentioned =
      m.message[m.type].contextInfo.mentionedJid
  } catch {
    m.mentioned = []
  }

  m.sender = m.isGroup ? m.participant : m.key.remoteJid

  if (m.key.fromMe) {
    m.sender =
      ptz.user.id.split(':')[0] + '@s.whatsapp.net'
  }

  m.from = m.key.remoteJid
  m.now = m.messageTimestamp
  m.fromMe = m.key.fromMe

  return m
}

export const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min

export const color = (text, color) =>
  !color ? chalk.green(text) : chalk.keyword(color)(text)

export const getGroupAdmins = (participants) => {
  const admins = []
  for (const i of participants) {
    if (i.admin === 'superadmin' || i.admin === 'admin') {
      admins.push(i.id)
    }
  }
  return admins
}

export const generateProfilePicture = async (buffer) => {
  const jimp = await Jimp.read(buffer)
  const min = jimp.getWidth()
  const cropped = jimp.crop(0, 0, min, jimp.getHeight())

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
  const pattern = /(-?\d+)(\d{3})/
  while (pattern.test(x)) x = x.replace(pattern, '$1.$2')
  return x
}

export const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const parseMention = (text = '') =>
  [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
    (v) => v[1] + '@s.whatsapp.net'
  )

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
    parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) +
    ' ' +
    sizes[i]
  )
}

export const msToDate = (ms) => {
  const years = Math.floor(
    ms / (1000 * 60 * 60 * 24 * 365)
  )
  const months = Math.floor(
    (ms % (1000 * 60 * 60 * 24 * 365)) /
      (1000 * 60 * 60 * 24 * 30)
  )
  const weeks = Math.floor(
    (ms % (1000 * 60 * 60 * 24 * 30)) /
      (1000 * 60 * 60 * 24 * 7)
  )
  const days = Math.floor(
    (ms % (1000 * 60 * 60 * 24 * 7)) /
      (1000 * 60 * 60 * 24)
  )

  return `${years} tahun ${months} bulan ${weeks} minggu ${days} hari`
}