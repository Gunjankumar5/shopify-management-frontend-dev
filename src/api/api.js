import { API_BASE_URL } from "./config";
import { getAuthHeaders } from "../lib/authFetch";

const GET_CACHE_TTL_MS = 30000;
const getCache = new Map();
const inflightGets = new Map();

function clearGetCache() {
  getCache.clear();
  inflightGets.clear();
}

function getCachedValue(url, ttlMs) {
  const cached = getCache.get(url);
  if (!cached) return null;
  if (Date.now() - cached.ts > ttlMs) {
    getCache.delete(url);
    return null;
  }
  return cached.data;
}

function storeCachedValue(url, data) {
  getCache.set(url, { data, ts: Date.now() });
}

async function parseResponseBody(response) {
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (response.status === 204) {
    return null;
  }

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  } catch {
    return null;
  }
}

function extractErrorMessage(data, status) {
  if (data && typeof data === "object") {
    if (typeof data.detail === "string" && data.detail.trim()) return data.detail;
    if (typeof data.message === "string" && data.message.trim()) return data.message;
    if (Array.isArray(data.detail) && data.detail.length) {
      return data.detail.map((item) => JSON.stringify(item)).join("; ");
    }
  }
  return `HTTP ${status}`;
}

// Helper: fetch with timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = 120000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = await getAuthHeaders(options.headers || {});
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs / 1000}s`);
    }
    throw error;
  }
}

export const api = {
  get: async (p, options = {}) => {
    const url = `${API_BASE_URL}${p}`;
    const ttlMs = options.ttlMs ?? GET_CACHE_TTL_MS;
    const force = Boolean(options.force);
    console.log(`GET ${url}`);

    if (!force) {
      const cached = getCachedValue(url, ttlMs);
      if (cached !== null) {
        return cached;
      }

      const inflight = inflightGets.get(url);
      if (inflight) {
        return inflight;
      }
    }

    const request = (async () => {
      const r = await fetchWithTimeout(url, {}, 120000);
      const data = await parseResponseBody(r);
      if (!r.ok) {
        const error = new Error(extractErrorMessage(data, r.status));
        error.status = r.status;
        throw error;
      }
      storeCachedValue(url, data);
      return data;
    })();

    inflightGets.set(url, request);

    try {
      return await request;
    } finally {
      inflightGets.delete(url);
    }
  },

  post: async (p, b) => {
    const url = `${API_BASE_URL}${p}`;
    console.log(`POST ${url}`, b);
    const r = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    });
    const data = await parseResponseBody(r);
    if (!r.ok) {
      const error = new Error(extractErrorMessage(data, r.status));
      error.status = r.status;
      throw error;
    }
    clearGetCache();
    return data;
  },

  put: async (p, b) => {
    const url = `${API_BASE_URL}${p}`;
    console.log(`PUT ${url}`, b);
    const r = await fetchWithTimeout(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    });
    const data = await parseResponseBody(r);
    if (!r.ok) {
      const error = new Error(extractErrorMessage(data, r.status));
      error.status = r.status;
      throw error;
    }
    clearGetCache();
    return data;
  },

  delete: async (p) => {
    const url = `${API_BASE_URL}${p}`;
    console.log(`DELETE ${url}`);
    const r = await fetchWithTimeout(url, { method: "DELETE" });
    const data = await parseResponseBody(r);
    if (!r.ok) {
      const error = new Error(extractErrorMessage(data, r.status));
      error.status = r.status;
      throw error;
    }
    clearGetCache();
    return data;
  },

  upload: async (p, fd) => {
    const url = `${API_BASE_URL}${p}`;
    console.log(`UPLOAD ${url}`);
    const r = await fetchWithTimeout(url, { method: "POST", body: fd }, 300000);
    const data = await parseResponseBody(r);
    if (!r.ok) {
      const error = new Error(extractErrorMessage(data, r.status));
      error.status = r.status;
      throw error;
    }
    clearGetCache();
    return data;
  },
  clearCache: clearGetCache,
};
