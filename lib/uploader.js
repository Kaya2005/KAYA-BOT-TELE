import axios from 'axios';
import FormData from 'form-data';
import { fromBuffer } from 'file-type';

/**
 * Upload une image (buffer) vers Telegraph et retourne l'URL
 * @param {Buffer} buffer 
 */
export async function uploadImageToTelegraph(buffer) {
    try {
        const { ext } = await fromBuffer(buffer);
        let form = new FormData();
        form.append('file', buffer, 'tmp.' + ext);
        
        let res = await axios.post('https://telegra.ph/upload', form, {
            headers: form.getHeaders()
        });
        
        return 'https://telegra.ph' + res.data[0].src;
    } catch (err) {
        throw new Error("Erreur lors de l'upload sur Telegraph");
    }
}
