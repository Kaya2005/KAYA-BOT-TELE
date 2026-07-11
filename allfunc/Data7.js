import fetch from 'node-fetch';
import FormData from 'form-data';
import { fromBuffer } from 'file-type';

/* ===================== FILE.IO UPLOAD ===================== */

export const fileIO = async (buffer) => {
  const { ext } = (await fromBuffer(buffer)) || {};

  const form = new FormData();
  form.append('file', buffer, 'tmp.' + ext);

  const res = await fetch('https://file.io/?expires=1d', {
    method: 'POST',
    body: form
  });

  const json = await res.json();

  if (!json.success) throw json;
  return json.link;
};

/* ===================== RESTFUL API UPLOAD ===================== */

export const RESTfulAPI = async (inp) => {
  const form = new FormData();
  const buffers = Array.isArray(inp) ? inp : [inp];

  for (const buffer of buffers) {
    form.append('file', buffer);
  }

  const res = await fetch(
    'https://storage.restfulapi.my.id/upload',
    {
      method: 'POST',
      body: form
    }
  );

  let json = await res.text();

  try {
    json = JSON.parse(json);

    if (!Array.isArray(inp)) {
      return json.files[0].url;
    }

    return json.files.map((f) => f.url);
  } catch (e) {
    throw json;
  }
};

/* ===================== AUTO UPLOADER (FALLBACK) ===================== */

const uploader = async (inp) => {
  let err;

  for (const upload of [RESTfulAPI, fileIO]) {
    try {
      return await upload(inp);
    } catch (e) {
      err = e;
    }
  }

  throw err;
};

export default uploader;