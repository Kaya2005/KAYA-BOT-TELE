import axios from 'axios';
import cheerio from 'cheerio';
import path, { resolve } from 'path';
import util from 'util';
import FormData from 'form-data';
import { fromBuffer } from 'file-type';
import fs from 'fs';
import { promises as fsp } from 'fs';
import child_process from 'child_process';
import ffmpeg from 'fluent-ffmpeg';

/* ===================== BASIC UTILS ===================== */

export const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

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

export const fetchBuffer = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'GET',
      url,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

/* ===================== WEBP -> MP4 (EZGIF) ===================== */

export const webp2mp4File = (pathFile) =>
  new Promise(async (resolve, reject) => {
    try {
      const form = new FormData();
      form.append('new-image-url', '');
      form.append('new-image', fs.createReadStream(pathFile));

      const res1 = await axios({
        method: 'POST',
        url: 'https://s6.ezgif.com/webp-to-mp4',
        data: form,
        headers: form.getHeaders()
      });

      const $ = cheerio.load(res1.data);
      const file = $('input[name="file"]').attr('value');

      const form2 = new FormData();
      form2.append('file', file);
      form2.append('convert', 'Convert WebP to MP4!');

      const res2 = await axios({
        method: 'POST',
        url: 'https://ezgif.com/webp-to-mp4/' + file,
        data: form2,
        headers: form2.getHeaders()
      });

      const $$ = cheerio.load(res2.data);
      const result =
        'https:' +
        $$('div#output > p.outfile > video > source').attr('src');

      resolve({
        status: true,
        message: 'Created By Eternity',
        result
      });
    } catch (err) {
      reject(err);
    }
  });

/* ===================== WA VERSION ===================== */

export const WAVersion = async () => {
  const get = await fetchJson(
    'https://web.whatsapp.com/check-update?version=1&platform=web'
  );

  return [get.currentVersion.replace(/[.]/g, ', ')];
};

/* ===================== HELPERS ===================== */

export const getRandom = (ext) =>
  `${Math.floor(Math.random() * 10000)}${ext}`;

export const isUrl = (url) =>
  url.match(
    new RegExp(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'gi'
    )
  );

export const isNumber = (number) => {
  const int = parseInt(number);
  return typeof int === 'number' && !isNaN(int);
};

/* ===================== TELEGRAPH ===================== */

export const TelegraPh = (Path) =>
  new Promise(async (resolve, reject) => {
    if (!fs.existsSync(Path))
      return reject(new Error('File not Found'));

    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(Path));

      const data = await axios({
        url: 'https://telegra.ph/upload',
        method: 'POST',
        headers: form.getHeaders(),
        data: form
      });

      resolve('https://telegra.ph' + data.data[0].src);
    } catch (err) {
      reject(new Error(String(err)));
    }
  });

/* ===================== GIF -> MP4 ===================== */

const sleepy = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const buffergif = async (image) => {
  const filename = Math.random().toString(36);

  const gifPath = `./GlobalMedia/trash/${filename}.gif`;
  const mp4Path = `./GlobalMedia/trash/${filename}.mp4`;

  fs.writeFileSync(gifPath, image);

  child_process.exec(
    `ffmpeg -i ${gifPath} -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ${mp4Path}`
  );

  await sleepy(4000);

  const buffer = fs.readFileSync(mp4Path);

  await Promise.all([
    fsp.unlink(mp4Path).catch(() => {}),
    fsp.unlink(gifPath).catch(() => {})
  ]);

  return buffer;
};