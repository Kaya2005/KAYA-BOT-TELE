import { proto, delay, getContentType } from 'baileys-pro';
import chalk from 'chalk';
import fs from 'fs';
import Crypto from 'crypto';
import axios from 'axios';
import moment from 'moment-timezone';
import { sizeFormatter } from 'human-readable';
import util from 'util';
import Jimp from 'jimp';
import { defaultMaxListeners } from 'stream';

// ================== Utils ==================

export const unixTimestampSeconds = (date = new Date()) =>
  Math.floor(date.getTime() / 1000);

export function generateMessageTag(epoch) {
  let tag = unixTimestampSeconds().toString();
  if (epoch) tag += '.--' + epoch;
  return tag;
}

export function processTime(timestamp, now) {
  return moment.duration(now - moment(timestamp * 1000)).asSeconds();
}

export function getRandom(ext) {
  return `${Math.floor(Math.random() * 10000)}${ext}`;
}

export async function getBuffer(url, options = {}) {
  try {
    const res = await axios({
      method: 'get',
      url,
      headers: {
        DNT: 1,
        'Upgrade-Insecure-Request': 1
      },
      ...options,
      responseType: 'arraybuffer'
    });
    return res.data;
  } catch (err) {
    return err;
  }
}

export async function fetchJson(url, options = {}) {
  try {
    const res = await axios({
      method: 'GET',
      url,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
      },
      ...options
    });
    return res.data;
  } catch (err) {
    return err;
  }
}

export const formatp = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`
});

export function runtime(seconds) {
  seconds = Number(seconds);
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return (
    (d ? `${d} day${d === 1 ? '' : 's'}, ` : '') +
    (h ? `${h} hour${h === 1 ? '' : 's'}, ` : '') +
    (m ? `${m} minute${m === 1 ? '' : 's'}, ` : '') +
    (s ? `${s} second${s === 1 ? '' : 's'}` : '')
  ).trim();
}

export const clockString = (ms) => {
  const h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
  const m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
  const s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':');
};

export const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const isUrl = (url) =>
  url.match(
    new RegExp(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/,
      'gi'
    )
  );

export function getTime(format, date) {
  if (date) return moment(date).locale('id').format(format);
  return moment.tz('Asia/Jakarta').locale('id').format(format);
}

export function formatDate(n, locale = 'id') {
  const d = new Date(n);
  return d.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  });
}

export function tanggal(numer) {
  const myMonths = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'
  ];
  const myDays = ['Minggu','Senin','Selasa','Rabu','Kamis','Jum’at','Sabtu'];

  const tgl = new Date(numer);
  const day = tgl.getDate();
  const bulan = tgl.getMonth();
  const thisDay = myDays[tgl.getDay()];
  const year = tgl.getFullYear();

  return `${thisDay}, ${day} - ${myMonths[bulan]} - ${year}`;
}

export const jsonformat = (string) =>
  JSON.stringify(string, null, 2);

function getTypeMessage(message) {
  const type = Object.keys(message);
  return (
    (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(type[0]) &&
      type[0]) ||
    (type.length >= 3 && type[1] !== 'messageContextInfo' && type[1]) ||
    type[type.length - 1] ||
    type[0]
  );
}

export function logic(check, inp, out) {
  if (inp.length !== out.length)
    throw new Error('Input and Output must have same length');

  for (let i in inp)
    if (util.isDeepStrictEqual(check, inp[i])) return out[i];

  return null;
}

export async function generateProfilePicture(buffer) {
  const jimp = await Jimp.read(buffer);
  const min = jimp.getWidth();
  const cropped = jimp.crop(0, 0, min, min);

  return {
    img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
    preview: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG)
  };
}

export function bytesToSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes','KB','MB','GB','TB','PB','EB','ZB','YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) +
    ' ' +
    sizes[i]
  );
}

export function getSizeMedia(path) {
  return new Promise((resolve, reject) => {
    if (/http/.test(path)) {
      axios.get(path).then((res) => {
        const length = parseInt(res.headers['content-length']);
        const size = bytesToSize(length, 3);
        if (!isNaN(length)) resolve(size);
      });
    } else if (Buffer.isBuffer(path)) {
      const length = Buffer.byteLength(path);
      const size = bytesToSize(length, 3);
      if (!isNaN(length)) resolve(size);
    } else {
      reject('error gatau apah');
    }
  });
}

export function parseMention(text = '') {
  return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
    (v) => v[1] + '@s.whatsapp.net'
  );
}

export function getGroupAdmins(participants) {
  const admins = [];
  for (const i of participants) {
    if (i.admin === 'superadmin' || i.admin === 'admin') {
      admins.push(i.id);
    }
  }
  return admins;
}

export function removeEmojis(string) {
  const regex =
    /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|[\u2600-\u27ff])/g;
  return string.replace(regex, '');
}

export function getRandom(ext) {
  return `${Math.floor(Math.random() * 10000)}${ext}`;
}