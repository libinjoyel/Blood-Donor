import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

const CACHE_TTL_MS = 25000;
const getCache = new Map();
const inFlight = new Map();

export function clearApiCache() {
  getCache.clear();
  inFlight.clear();
}

function serializeParams(params) {
  if (!params) return '';
  if (params instanceof URLSearchParams) return params.toString();
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  return new URLSearchParams(entries).toString();
}

function buildCacheKey(url, config) {
  const token = localStorage.getItem('token') || '';
  const query = serializeParams(config?.params);
  return `${token.slice(-12)}|${url}${query ? `?${query}` : ''}`;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const method = (response.config?.method || 'get').toLowerCase();
    if (method !== 'get') {
      clearApiCache();
    }
    return response;
  },
  (error) => {
    const method = (error.config?.method || 'get').toLowerCase();
    if (method !== 'get') {
      clearApiCache();
    }
    return Promise.reject(error);
  }
);

const rawGet = api.get.bind(api);

api.get = (url, config) => {
  if (config?.skipCache) {
    return rawGet(url, config);
  }

  const key = buildCacheKey(url, config);
  const cached = getCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return Promise.resolve({ ...cached.response });
  }

  const pending = inFlight.get(key);
  if (pending) {
    return pending;
  }

  const reqPromise = rawGet(url, config)
    .then((response) => {
      getCache.set(key, { response, ts: Date.now() });
      return response;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, reqPromise);
  return reqPromise;
};

export default api;
