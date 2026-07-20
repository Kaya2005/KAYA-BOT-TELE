import axios from 'axios';
import { getBotName } from '../setting/botAssets.js';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'okhttp/4.9.3'
];

async function fetchWithRetry(url, maxRetries = 3, timeout = 30000, responseType = 'json') {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const userAgent = USER_AGENTS[(attempt - 1) % USER_AGENTS.length];
      const response = await axios.get(url, {
        timeout,
        responseType,
        headers: { 'User-Agent': userAgent }
      });
      return response;
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export default {
  name: 'apk',
  aliases: ['apkdownload', 'getapk', 'downloadapk'],
  category: 'media',
  description: '📱 Download APK files for Android apps',
  usage: '.apk <app name>',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const appName = args.join(' ').trim();
      const botName = getBotName(mek.sender);

      if (!appName) {
        return await kaya.sendMessage(from, { 
            text: `❌ Please provide an app name.\n\nExample: \`${prefix}apk WhatsApp\`` 
        }, { quoted: mek });
      }

      await kaya.sendMessage(from, { react: { text: '📥', key: mek.key } });

      const statusMsg = await kaya.sendMessage(from, { text: `⏳ Fetching APK details for *${appName}*...` }, { quoted: mek });
      const msgKey = statusMsg.key;

      // 1. Récupération des infos
      const infoUrl = `https://api.princetechn.com/api/download/apkdl?apikey=prince&appName=${encodeURIComponent(appName)}`;

      let infoResponse;
      try {
        infoResponse = await fetchWithRetry(infoUrl, 3, 15000);
      } catch (err) {
        await kaya.sendMessage(from, { text: `❌ Failed to fetch APK info. API may be down.`, edit: msgKey });
        await kaya.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return;
      }

      const infoData = infoResponse.data;

      if (!infoData || !infoData.success || !infoData.result) {
        await kaya.sendMessage(from, { text: `❌ No APK found for *${appName}*.`, edit: msgKey });
        await kaya.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return;
      }

      const { appname, appicon, developer, download_url } = infoData.result;

      if (!download_url) {
        await kaya.sendMessage(from, { text: `❌ APK download URL not available for *${appname}*.`, edit: msgKey });
        await kaya.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return;
      }

      // 2. Téléchargement APK
      await kaya.sendMessage(from, { text: `📥 Downloading APK: *${appname}*...`, edit: msgKey });

      let apkBuffer;
      try {
        const apkResponse = await fetchWithRetry(download_url, 2, 60000, 'arraybuffer');
        apkBuffer = Buffer.from(apkResponse.data);
      } catch (err) {
        await kaya.sendMessage(from, { text: `❌ Failed to download APK file.`, edit: msgKey });
        await kaya.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return;
      }

      // 3. Téléchargement icône (miniature)
      let iconBuffer = null;
      if (appicon) {
        try {
          const iconResponse = await axios.get(appicon, { responseType: 'arraybuffer', timeout: 10000 });
          iconBuffer = Buffer.from(iconResponse.data);
        } catch (err) {
          console.log('Icon download failed, sending without thumbnail');
        }
      }

      // 4. Envoi du message
      const fileName = `${appname.replace(/[^a-zA-Z0-9]/g, '_')}.apk`;
      const caption = `╔══════════════════════╗
║   *📱 APK File*     ║
╚══════════════════════╝

📦 *App:* ${appname}
👤 *Developer:* ${developer || 'Unknown'}
🔗 *Source:* ${download_url}

_Powered by ${botName}_`;

      const messageOptions = {
        document: apkBuffer,
        fileName: fileName,
        mimetype: 'application/vnd.android.package-archive',
        caption: caption
      };

      if (iconBuffer) messageOptions.thumbnail = iconBuffer;

      await kaya.sendMessage(from, messageOptions, { quoted: mek });

      // Suppression message statut
      try { await kaya.sendMessage(from, { delete: msgKey }); } catch {}

      await kaya.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
      console.error('APK download error:', error);
      await kaya.sendMessage(from, { text: `❌ Unexpected error: ${error.message}` }, { quoted: mek });
      await kaya.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
  }
};
