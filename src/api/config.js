const DEFAULT_ORIGIN = "https://shopifymanagerbackend-production-b50f.up.railway.app";
const raw = (import.meta.env.VITE_API_BASE_URL || "").trim();

const withProtocol =
  raw && !raw.startsWith("http://") && !raw.startsWith("https://")
    ? `https://${raw}`
    : raw;

// if user sets .../api, normalize back to origin
const normalizedOrigin = (withProtocol || DEFAULT_ORIGIN)
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

export const API_ORIGIN = normalizedOrigin;

// keep old usage working: `${API_BASE_URL}/collections/` => .../api/collections/
export const API_BASE_URL = `${API_ORIGIN}/api`;

// keep previous export for health checks
export const API_HEALTH_URL = import.meta.env.DEV
  ? "/api/health"
  : `${API_ORIGIN}/health`;

// optional central endpoints for new code
export const API_ENDPOINTS = {
  products: `${API_BASE_URL}/products`,
  collections: `${API_BASE_URL}/collections/`,
  locations: `${API_BASE_URL}/inventory/locations`,
  inventoryLevels: `${API_BASE_URL}/inventory/levels`,
};

export async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${url} ${text}`);
  }

  return res.json();
}
