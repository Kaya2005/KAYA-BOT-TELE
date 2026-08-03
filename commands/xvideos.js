import fetch from "node-fetch";
import cheerio from "cheerio";
import { getBuffer } from "#serialize";
import db from '#db';

export default {
  name: 'xvideos',
  category: 'nsfw',
  description: 'Search and download videos from XVideos.',

  async execute(kaya, mek, from, args, prefix) {
    const chat = db.getChat(from);
    if (!chat.nsfw) {
      return await kaya.sendMessage(from, { 
        text: `ꕥ *NSFW* content is disabled in this group.\n\nAn *administrator* can enable it with the command:\n» *${prefix}nsfw on*` 
      }, { quoted: mek });
    }

    try {
      const query = args.join(" ");
      if (!query) {
        return await kaya.sendMessage(from, { text: "《✧》 Please enter the title or URL of the XVIDEOS video." }, { quoted: mek });
      }

      const isUrl = query.includes("xvideos.com");
      if (isUrl) {
        const res = await xvideosdl(query);
        const { duration, views, likes, deslikes } = res.result;
        const dll = res.result.url;
        const videoBuffer = await getBuffer(dll);

        let mensaje = { 
          document: videoBuffer, 
          mimetype: "video/mp4", 
          fileName: `${res.result.title}.mp4`, 
          caption: `乂 XVIDEOS - DOWNLOAD! 乂

≡ Title : ${res.result.title}
≡ Duration : ${duration || "Unknown"}
≡ Likes : ${likes || "Unknown"}
≡ Dislikes : ${deslikes || "Unknown"}
≡ Views : ${views || "Unknown"}` 
        };
        await kaya.sendMessage(from, mensaje, { quoted: mek });
        return;
      }

      const res = await search(encodeURIComponent(query));
      if (!res.length) {
        return await kaya.sendMessage(from, { text: "《✧》 No results found." }, { quoted: mek });
      }

      const list = res.slice(0, 10).map((v, i) => `${i + 1}\n≡ Title : ${v.title}\n≡ Link : ${v.url}`).join("\n\n");
      const caption = `乂 XVIDEOS - SEARCH! 乂\n\n${list}\n\n> » Directly use the URL of one of the videos to download it.`;
      await kaya.sendMessage(from, { text: caption }, { quoted: mek });

    } catch (e) {
      await kaya.sendMessage(from, { 
        text: `> An unexpected error occurred while executing command *${prefix}xvideos*.\n> [Error: *${e.message}*]` 
      }, { quoted: mek });
    }
  }
};

async function search(query) {
  return new Promise(async (resolve, reject) => {
    try {
      const url = `https://www.xvideos.com/?k=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const html = await res.text();
      const $ = cheerio.load(html);
      const results = [];
      $("div.mozaique > div").each((index, element) => {
        const title = $(element).find("p.title a").attr("title");
        const videoUrl = "https://www.xvideos.com" + $(element).find("p.title a").attr("href");
        const quality = $(element).find("span.video-hd-mark").text().trim();
        if (title && videoUrl) results.push({ title, url: videoUrl, quality });
      });
      resolve(results);
    } catch (error) {
      reject(error);
    }
  });
}

async function xvideosdl(url) {
  return new Promise((resolve, reject) => {
    fetch(url, { method: "get" }).then(res => res.text()).then(res => {
      const $ = cheerio.load(res, { xmlMode: false });
      const title = $("meta[property='og:title']").attr("content");
      const duration = (() => { 
        const s = parseInt($('meta[property="og:duration"]').attr("content"), 10) || 0;
        return s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s` 
             : s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` 
             : `${s}s`; 
      })();
      const views = $("span.nb_views").text().trim() || $("strong.mobile-hide").text().trim();
      const likes = $("span.rating-good-nbr").text().trim();
      const deslikes = $("span.rating-bad-nbr").text().trim();
      const thumb = $("meta[property='og:image']").attr("content");
      const videoUrl = $("#html5video > #html5video_base > div > a").attr("href");
      resolve({ status: 200, result: { title, duration, url: videoUrl, views, likes, deslikes, thumb }});
    }).catch(err => reject(err));
  });
}
