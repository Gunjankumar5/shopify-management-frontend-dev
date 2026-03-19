import { getAuthHeaders } from "../lib/authFetch";

const rawOrigin = (import.meta.env.VITE_API_ORIGIN || "")
  .trim()
  .replace(/\/$/, "");

const origin = rawOrigin
  ? /^https?:\/\//i.test(rawOrigin)
    ? rawOrigin
    : `https://${rawOrigin}`
  : "";

export const API_ORIGIN = origin || "http://127.0.0.1:8000";
export const API_BASE_URL = `${API_ORIGIN}/api`;
export const API_HEALTH_URL = `${API_ORIGIN}/health`;

export const API_ENDPOINTS = {
  products: `${API_BASE_URL}/products`,
  collections: `${API_BASE_URL}/collections/`,
  locations: `${API_BASE_URL}/inventory/locations`,
  inventoryLevels: `${API_BASE_URL}/inventory/levels`,
};

export async function fetchJson(url, options = {}) {
  const headers = await getAuthHeaders(options.headers || {});
  const res = await fetch(url, {
    headers,
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${url} ${text}`);
  }

  return res.json();
}
