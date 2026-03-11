import { API_BASE_URL } from "./config";

export const api = {
  get: (p) => fetch(`${API_BASE_URL}${p}`).then((r) => r.json()),
  post: (p, b) =>
    fetch(`${API_BASE_URL}${p}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    }).then((r) => r.json()),
  put: (p, b) =>
    fetch(`${API_BASE_URL}${p}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    }).then((r) => r.json()),
  delete: (p) =>
    fetch(`${API_BASE_URL}${p}`, { method: "DELETE" }).then((r) => r.json()),
  upload: (p, fd) =>
    fetch(`${API_BASE_URL}${p}`, { method: "POST", body: fd }).then((r) =>
      r.json(),
    ),
};
