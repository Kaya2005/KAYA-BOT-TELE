import axios from 'axios';

/**
 * Nettoie le texte en retirant les balises HTML et en remplaçant <br> par des sauts de ligne
 * @param {string} data 
 * @returns {string}
 */
const clean = (data) => {
  if (!data) return '';
  data = data.replace(/(<br?\s?\/?>)/gi, "\n");
  return data.replace(/(<([^>]+)>)/gi, "");
};

async function shortener(url) {
  return url; 
}

/**
 * Récupère les liens TikTok sans filigrane avec un système de secours (Multi-API)
 * @param {string} query Lien ou recherche TikTok
 * @returns {Promise<object>}
 */
export async function Tiktok(query) {
  // ==========================================
  // MÉTHODE 1 : Utilisation de l'API TikWM (Très stable)
  // ==========================================
  try {
    const response = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const resData = response.data;
    if (resData && resData.code === 0 && resData.data) {
      const d = resData.data;
      return {
        creator: "KAYA",
        title: clean(d.title || ""),
        author: clean(d.author?.nickname || "Unknown"),
        nowm: d.play ? await shortener(d.play.replace("https", "http")) : null,
        watermark: d.wmplay ? await shortener(d.wmplay.replace("https", "http")) : null,
        audio: d.music ? await shortener(d.music.replace("https", "http")) : null,
        thumbnail: d.cover ? await shortener(d.cover) : null,
      };
    }
  } catch (err) {
    // Échec silencieux pour passer à la méthode suivante
  }

  // ==========================================
  // MÉTHODE 2 : Utilisation de Lovetik (Secours)
  // ==========================================
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

    const data = response.data || {};

    let nowmLink = null;
    let wmLink = null;
    let audioLink = null;

    if (Array.isArray(data.links)) {
      nowmLink = data.links.find(l => l.type === 'nowm' || l.a)?.a || data.links?.[0]?.a;
      wmLink = data.links.find(l => l.type === 'wm')?.a || data.links?.[1]?.a;
      audioLink = data.links.find(l => l.type === 'audio')?.a || data.links?.[2]?.a;
    }

    if (nowmLink) {
      return {
        creator: "KAYA",
        title: clean(data.desc || ""),
        author: clean(data.author || ""),
        nowm: await shortener(nowmLink.replace("https", "http")),
        watermark: wmLink ? await shortener(wmLink.replace("https", "http")) : null,
        audio: audioLink ? await shortener(audioLink.replace("https", "http")) : null,
        thumbnail: data.cover ? await shortener(data.cover) : null,
      };
    }
  } catch (err) {
    // Échec silencieux
  }

  // Si toutes les méthodes échouent
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
