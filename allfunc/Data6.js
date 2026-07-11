import fetch from 'node-fetch';
import FormData from 'form-data';
import { fromBuffer } from 'file-type';

/**
 * Upload image to catbox.moe
 * Supported mimetype:
 * - image/jpeg
 * - image/jpg
 * - image/png
 */
const uploadToCatbox = async (buffer) => {
  const { ext } = await fromBuffer(buffer);

  const bodyForm = new FormData();
  bodyForm.append('fileToUpload', buffer, `file.${ext}`);
  bodyForm.append('reqtype', 'fileupload');

  const res = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: bodyForm
  });

  const data = await res.text();
  return data;
};

export default uploadToCatbox;