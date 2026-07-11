import {
  proto,
  delay,
  getContentType
} from '@whiskeysockets/baileys';

import chalk from 'chalk';
import fs from 'fs';
import Crypto from 'crypto';
import axios from 'axios';
import moment from 'moment-timezone';
import { sizeFormatter } from 'human-readable';
import util from 'util';
import Jimp from 'jimp';
import { defaultMaxListeners } from 'stream';

/* ===================== BASIC UTILS ===================== */

export const unixTimestampSeconds = (date = new Date()) =>
  Math.floor(date.getTime() / 1000);

export const generateMessageTag = (epoch) => {
  let tag = unixTimestampSeconds().toString();
  if (epoch) tag += '.--' + epoch;
  return tag;
};

export const processTime = (timestamp, now) =>
  moment.duration(now - moment(timestamp * 1000)).asSeconds();

export const getRandom = (ext) =>
  `${Math.floor(Math.random() * 10000)}${ext}`;

export const getBuffer = async (url, options = {}) => {
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
};

export const getImg = async (url, options = {}) => {
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
};

export const fetchJson = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'GET',
      url,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      ...options
    });
    return res.data;
  } catch (err) {
    return err;
  }
};

export const runtime = (seconds) => {
  seconds = Number(seconds);

  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return `${d ? d + ' days, ' : ''}${h ? h + ' hours, ' : ''}${
    m ? m + ' minutes, ' : ''
  }${s ? s + ' seconds' : ''}`;
};

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
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/,
      'gi'
    )
  );

export const getTime = (format, date) =>
  date
    ? moment(date).locale('id').format(format)
    : moment.tz('Asia/Karachi').locale('id').format(format);

export const formatDate = (n, locale = 'id') => {
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
};

export const tanggal = (numer) => {
  const myMonths = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'
  ];

  const myDays = [
    'Minggu','Senin','Selasa','Rabu','Kamis',"Jum’at",'Sabtu'
  ];

  const tgl = new Date(numer);
  const day = tgl.getDate();
  const thisDay = myDays[tgl.getDay()];
  const year =
    tgl.getYear() < 1000 ? tgl.getYear() + 1900 : tgl.getYear();

  return `${thisDay}, ${day} - ${myMonths[tgl.getMonth()]} - ${year}`;
};

export const jam = (numer, options = {}) => {
  const format = options.format || 'HH:mm';

  const timeZone = options.timeZone || 'Asia/Karachi';

  return options.timeZone
    ? moment(numer).tz(timeZone).format(format)
    : moment(numer).format(format);
};

export const formatp = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (l, s) => `${l} ${s}B`
});

export const json = (string) =>
  JSON.stringify(string, null, 2);

export const logic = (check, inp, out) => {
  if (inp.length !== out.length)
    throw new Error('Input and Output must have same length');

  for (let i in inp) {
    if (util.isDeepStrictEqual(check, inp[i])) return out[i];
  }

  return null;
};

export const generateProfilePicture = async (buffer) => {
  const jimp = await Jimp.read(buffer);
  const min = jimp.getWidth();
  const cropped = jimp.crop(0, 0, min, jimp.getHeight());

  return {
    img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
    preview: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG)
  };
};

export const bytesToSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes','KB','MB','GB','TB','PB','EB','ZB','YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) +
    ' ' + sizes[i];
};

export const getSizeMedia = (path) =>
  new Promise((resolve, reject) => {
    if (/http/.test(path)) {
      axios.get(path).then((res) => {
        const length = parseInt(res.headers['content-length']);
        if (!isNaN(length)) resolve(bytesToSize(length, 3));
      });
    } else if (Buffer.isBuffer(path)) {
      const length = Buffer.byteLength(path);
      if (!isNaN(length)) resolve(bytesToSize(length, 3));
    } else {
      reject('error gatau apah');
    }
  });

export const parseMention = (text = '') =>
  [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
    (v) => v[1] + '@s.whatsapp.net'
  );

export const getGroupAdmins = (participants) => {
  const admins = [];

  for (const i of participants) {
    if (i.admin === 'superadmin' || i.admin === 'admin') {
      admins.push(i.id);
    }
  }

  return admins;
};

/* ===================== RELOAD WATCHER ===================== */
/* (removed require.cache auto-reload because ESM doesn't support it cleanly) */