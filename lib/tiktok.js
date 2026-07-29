import axios from 'axios';

const clean = (data) => {
  if (!data) return '';
  data = data.replace(/(<br?\s?\/?>)/gi, "\n");
  return data.replace(/(<([^>]+)>)/gi, "");
};

async function shortener(url) {
  return url; 
}

export async function Tiktok(query) {
  try {
    const response = await axios.post("https://lovetik.com/api/ajax/search", 
      new URLSearchParams({ query }), {
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Origin": "https://lovetik.com",
        "Referer": "https://lovetik.com/"
      }
    });

    // Débogage : affiche la réponse brute dans la console du bot
    console.log("📦 Réponse brute de l'API TikTok :", response.data);

    const data = response.data || {};

    const result = {
      creator: "KAYA",
      title: clean(data.desc || ""),
      author: clean(data.author || ""),
      nowm: data.links?.[0]?.a ? await shortener(data.links[0].a.replace("https", "http")) : null,
      watermark: data.links?.[1]?.a ? await shortener(data.links[1].a.replace("https", "http")) : null,
      audio: data.links?.[2]?.a ? await shortener(data.links[2].a.replace("https", "http")) : null,
      thumbnail: data.cover ? await shortener(data.cover) : null,
    };

    return result;
  } catch (err) {
    console.error("Erreur dans Tiktok():", err.message);
    return {
      creator: "KAYA",
      title: "",
      author: "",
      nowm: null,
      watermark: null,
      audio: null,
      thumbnail: null,
    };
  }
}
