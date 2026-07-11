import axios from 'axios';

class FunctionUtils {
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  runtime(seconds) {
    seconds = Number(seconds);

    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const dDisplay = d > 0 ? `${d} ${d === 1 ? 'day' : 'days'}, ` : '';
    const hDisplay = h > 0 ? `${h} ${h === 1 ? 'hour' : 'hours'}, ` : '';
    const mDisplay = m > 0 ? `${m} ${m === 1 ? 'minute' : 'minutes'}, ` : '';
    const sDisplay = s > 0 ? `${s} ${s === 1 ? 'second' : 'seconds'}` : '';

    return dDisplay + hDisplay + mDisplay + sDisplay;
  }

  async fetchJson(url, options = {}) {
    try {
      const res = await axios(url, {
        method: 'get',
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
          origin: url,
          referer: url
        },
        responseType: 'json',
        ...options
      });

      return res?.data;
    } catch (e) {
      return e;
    }
  }

  getUserName(user) {
    try {
      const last_name = user?.last_name || '';
      const full_name = `${user.first_name} ${last_name}`.trim();

      user.full_name = full_name;
      return user;
    } catch (e) {
      throw e;
    }
  }

  isUrl(url) {
    return url.match(
      new RegExp(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/,
        'gi'
      )
    );
  }

  range(start, stop, step = 1) {
    if (typeof stop === 'undefined') {
      stop = start;
      start = 0;
    }

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
      return [];
    }

    const result = [];

    for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
      result.push(i);
    }

    return result;
  }
}

export const simple = new FunctionUtils();