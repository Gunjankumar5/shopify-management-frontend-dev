import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import CollectionsPage from "./pages/CollectionsPage";
import InventoryPage from "./pages/InventoryPage";

const API = "https://shopifymanagerbackend-production.up.railway.app/api";

// ===== GLOBAL STYLES WITH NEW COLOR SCHEME & FONTS =====
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    :root {
      --bg-primary: #0B1120;
      --bg-secondary: #111827;
      --bg-card: #1A2332;
      --bg-input: #1E293B;
      --border-color: #2D3A4F;
      --border-light: #3A4A62;
      --text-primary: #F1F5F9;
      --text-secondary: #94A3B8;
      --text-muted: #64748B;
      --accent: #8B5CF6;
      --accent-gradient: linear-gradient(135deg, #8B5CF6, #C084FC);
      --success: #10B981;
      --warning: #F59E0B;
      --danger: #EF4444;
      --info: #3B82F6;
      --shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.2);
      --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.3);
      --shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.4);
      --transition: all 0.2s ease;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: var(--bg-secondary); }
    ::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--accent); }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .fade-up { animation: fadeUp 0.4s cubic-bezier(0.2, 0.9, 0.3, 1) forwards; }
    .card-hover {
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    }
    .card-hover:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
      border-color: var(--accent) !important;
    }

    .btn {
      border: none;
      cursor: pointer;
      font-family: inherit;
      font-weight: 600;
      transition: var(--transition);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-radius: 14px;
      padding: 10px 20px;
      font-size: 14px;
      line-height: 1;
      letter-spacing: 0.3px;
    }
    .btn:active { transform: scale(0.97); }
    .btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .btn-primary {
      background: var(--accent-gradient);
      color: white;
      box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
    }
    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
      box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
    }
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-secondary {
      background: var(--bg-input);
      border: 1px solid var(--border-light);
      color: var(--text-secondary);
    }
    .btn-secondary:hover:not(:disabled) {
      background: #2D3A4F;
      border-color: var(--accent);
      color: var(--text-primary);
    }
    .btn-danger {
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .btn-danger:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.2);
      border-color: var(--danger);
    }

    .field-input {
      background: var(--bg-input);
      border: 1px solid var(--border-light);
      color: var(--text-primary);
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      font-family: inherit;
      width: 100%;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 14px;
    }
    .field-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
    }
    .field-input::placeholder { color: var(--text-muted); }

    .chk {
      appearance: none;
      width: 20px;
      height: 20px;
      min-width: 20px;
      border: 2px solid var(--border-light);
      border-radius: 6px;
      cursor: pointer;
      background: var(--bg-input);
      position: relative;
      transition: var(--transition);
    }
    .chk:checked {
      background: var(--accent);
      border-color: var(--accent);
    }
    .chk:checked::after {
      content: '✓';
      position: absolute;
      color: white;
      font-size: 13px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .chk:focus-visible { outline: 2px solid var(--accent); }

    .skeleton {
      background: linear-gradient(90deg, #1E293B 25%, #2D3A4F 50%, #1E293B 75%);
      background-size: 200% 100%;
      animation: shimmer 1.8s infinite;
      border-radius: 14px;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-box {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 28px;
      width: 100%;
      max-height: calc(100vh - 40px);
      overflow-y: auto;
      box-shadow: var(--shadow-lg);
      animation: fadeUp 0.3s ease;
    }
    .modal-box::-webkit-scrollbar { width: 6px; }
  `}</style>
);

// ===== API HELPER (unchanged) =====
const api = {
  get: (p) => fetch(`${API}${p}`).then((r) => r.json()),
  post: (p, b) =>
    fetch(`${API}${p}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    }).then((r) => r.json()),
  put: (p, b) =>
    fetch(`${API}${p}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    }).then((r) => r.json()),
  delete: (p) =>
    fetch(`${API}${p}`, { method: "DELETE" }).then((r) => r.json()),
  upload: (p, fd) =>
    fetch(`${API}${p}`, { method: "POST", body: fd }).then((r) => r.json()),
};

// ===== ICONS (unchanged) =====
const ICONS = {
  products: "M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m8 4v10M12 11L4 7",
  upload: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
  collections:
    "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  inventory:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  grid: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  list: "M4 6h16M4 10h16M4 14h16M4 18h16",
  plus: "M12 4v16m8-8H4",
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  trash:
    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0",
  x: "M6 18L18 6M6 6l12 12",
  check: "M5 13l4 4L19 7",
  percent:
    "M19 5L5 19M9 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM15 17.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  image:
    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  tag: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
};

const Ico = ({ n, size = 18, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d={ICONS[n] || ICONS.products} />
  </svg>
);

const Spin = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="var(--border-light)"
      strokeWidth="3"
    />
    <path
      d="M12 2a10 10 0 0110 10"
      stroke="var(--accent)"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

// ===== TOAST SYSTEM =====
const useToast = () => {
  const [toasts, set] = useState([]);
  const add = (msg, type = "success") => {
    const id = Date.now();
    set((p) => [...p, { id, msg, type }]);
    setTimeout(() => set((p) => p.filter((t) => t.id !== id)), 4500);
  };
  return {
    toasts,
    add,
    remove: (id) => set((p) => p.filter((t) => t.id !== id)),
  };
};

const Toasts = ({ toasts, remove }) => (
  <div
    style={{
      position: "fixed",
      top: 20,
      right: 20,
      zIndex: 99999,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      pointerEvents: "none",
    }}
  >
    {toasts.map((t) => (
      <div
        key={t.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 20px",
          background:
            t.type === "success"
              ? "#065F46"
              : t.type === "error"
                ? "#7F1D1D"
                : "#1E3A8A",
          borderLeft: `6px solid ${
            t.type === "success"
              ? "var(--success)"
              : t.type === "error"
                ? "var(--danger)"
                : "var(--info)"
          }`,
          borderRadius: 16,
          boxShadow: "var(--shadow-lg)",
          minWidth: 320,
          maxWidth: 420,
          pointerEvents: "all",
          animation: "slideIn 0.3s ease, fadeUp 0.3s ease",
        }}
      >
        <Ico
          n={t.type === "success" ? "check" : "x"}
          size={18}
          color={t.type === "success" ? "var(--success)" : "var(--danger)"}
        />
        <span
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          {t.msg}
        </span>
        <button
          onClick={() => remove(t.id)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            padding: 4,
            display: "flex",
            borderRadius: 8,
          }}
          aria-label="Dismiss"
        >
          <Ico n="x" size={16} />
        </button>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 4,
            width: "100%",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "0 0 16px 16px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "100%",
              background:
                t.type === "success"
                  ? "var(--success)"
                  : t.type === "error"
                    ? "var(--danger)"
                    : "var(--info)",
              animation: "shrink 4.5s linear forwards",
            }}
          />
        </div>
      </div>
    ))}
    <style>{`
      @keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }
    `}</style>
  </div>
);

// ===== BADGE =====
const Badge = ({ status }) => {
  const styles = {
    active: {
      bg: "rgba(16,185,129,0.15)",
      color: "var(--success)",
      border: "rgba(16,185,129,0.3)",
    },
    draft: {
      bg: "rgba(245,158,11,0.15)",
      color: "var(--warning)",
      border: "rgba(245,158,11,0.3)",
    },
    archived: {
      bg: "rgba(107,114,128,0.15)",
      color: "#94A3B8",
      border: "rgba(107,114,128,0.3)",
    },
  };
  const s = styles[status] || styles.draft;
  return (
    <span
      style={{
        padding: "4px 12px",
        borderRadius: 30,
        fontSize: 11,
        fontWeight: 600,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        textTransform: "uppercase",
        letterSpacing: "0.6px",
        display: "inline-block",
      }}
    >
      {status || "draft"}
    </span>
  );
};

// ===== MODAL =====
const Modal = ({ title, subtitle, onClose, children, maxWidth = 660 }) =>
  createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ maxWidth }}>
        <div
          style={{
            padding: "28px 32px 20px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 24,
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1.2,
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: 10, borderRadius: 14 }}
            aria-label="Close"
          >
            <Ico n="x" size={20} />
          </button>
        </div>
        <div style={{ padding: "28px 32px 32px" }}>{children}</div>
      </div>
    </div>,
    document.body,
  );

// ===== FIELD =====
const Field = ({
  label,
  value,
  onChange,
  type = "text",
  options,
  rows,
  pre,
  suf,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <label
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: "var(--text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "0.6px",
      }}
    >
      {label}
    </label>
    <div
      style={{ position: "relative", display: "flex", alignItems: "center" }}
    >
      {pre && (
        <span
          style={{
            position: "absolute",
            left: 14,
            color: "var(--text-muted)",
            fontSize: 14,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {pre}
        </span>
      )}
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="field-input"
          style={{
            padding: "12px 16px",
            appearance: "none",
            cursor: "pointer",
          }}
        >
          {options.map((o) => (
            <option key={o.v || o} value={o.v || o}>
              {o.l || o}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows || 3}
          className="field-input"
          style={{ resize: "vertical" }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="field-input"
          style={{
            padding: `12px ${suf ? "44px" : "16px"} 12px ${pre ? "40px" : "16px"}`,
          }}
        />
      )}
      {suf && (
        <span
          style={{
            position: "absolute",
            right: 14,
            color: "var(--text-muted)",
            fontSize: 14,
            pointerEvents: "none",
          }}
        >
          {suf}
        </span>
      )}
    </div>
  </div>
);

// ===== PRICE MODAL (updated styling) =====
const PriceModal = ({ count, onApply, onClose }) => {
  const [mode, setMode] = useState("percent");
  const [val, setVal] = useState("");
  const [dir, setDir] = useState("increase");
  const preview = val
    ? mode === "percent"
      ? dir === "increase"
        ? (100 * (1 + parseFloat(val) / 100)).toFixed(2)
        : (100 * (1 - parseFloat(val) / 100)).toFixed(2)
      : dir === "increase"
        ? (100 + parseFloat(val)).toFixed(2)
        : (100 - parseFloat(val)).toFixed(2)
    : null;
  return (
    <Modal
      title="Adjust Prices"
      subtitle={`${count} product${count !== 1 ? "s" : ""} selected`}
      onClose={onClose}
      maxWidth={500}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Type
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { id: "percent", label: "% Percentage" },
              { id: "fixed", label: "$ Fixed" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`btn ${mode === m.id ? "btn-primary" : "btn-secondary"}`}
                style={{ flex: 1 }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Direction
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { id: "increase", label: "↑ Increase", color: "var(--success)" },
              { id: "decrease", label: "↓ Decrease", color: "var(--danger)" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDir(d.id)}
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  borderColor: dir === d.id ? d.color : undefined,
                  background: dir === d.id ? `${d.color}15` : undefined,
                  color: dir === d.id ? d.color : undefined,
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <Field
          label={mode === "percent" ? "Percentage" : "Amount"}
          value={val}
          onChange={setVal}
          type="number"
          suf={mode === "percent" ? "%" : "$"}
        />
        {preview && (
          <div
            style={{
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.2)",
              borderRadius: 16,
              padding: "16px 20px",
              fontSize: 15,
              color: "var(--accent)",
            }}
          >
            $100.00 →{" "}
            <strong
              style={{
                color: dir === "increase" ? "var(--success)" : "var(--danger)",
              }}
            >
              ${preview}
            </strong>
          </div>
        )}
        <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
          <button
            onClick={() =>
              val && onApply({ mode, value: parseFloat(val), dir })
            }
            disabled={!val}
            className="btn btn-primary"
            style={{ flex: 1, padding: "14px" }}
          >
            Apply to {count} Products
          </button>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: "14px 28px" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ===== EDIT MODAL (updated styling) =====
const EditModal = ({ product, onSave, onClose }) => {
  const [f, setF] = useState({
    title: product?.title || "",
    vendor: product?.vendor || "",
    product_type: product?.product_type || "",
    tags: product?.tags || "",
    status: product?.status || "draft",
    body_html: product?.body_html || "",
    price: product?.variants?.[0]?.price || "",
    compare_at_price: product?.variants?.[0]?.compare_at_price || "",
    sku: product?.variants?.[0]?.sku || "",
    inventory_quantity: product?.variants?.[0]?.inventory_quantity || "",
    image_src: product?.images?.[0]?.src || "",
  });
  const [saving, setSaving] = useState(false);
  const update = (key) => (val) => setF((prev) => ({ ...prev, [key]: val }));
  const save = async () => {
    setSaving(true);
    await onSave({
      title: f.title,
      vendor: f.vendor,
      product_type: f.product_type,
      tags: f.tags,
      status: f.status,
      body_html: f.body_html,
      variants: [
        {
          price: f.price,
          compare_at_price: f.compare_at_price,
          sku: f.sku,
          inventory_quantity: parseInt(f.inventory_quantity) || 0,
        },
      ],
      ...(f.image_src ? { images: [{ src: f.image_src }] } : {}),
    });
    setSaving(false);
  };
  return (
    <Modal
      title={product ? "Edit Product" : "Add Product"}
      subtitle={product?.title}
      onClose={onClose}
      maxWidth={740}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Title *" value={f.title} onChange={update("title")} />
        </div>
        <Field label="Vendor" value={f.vendor} onChange={update("vendor")} />
        <Field
          label="Product Type"
          value={f.product_type}
          onChange={update("product_type")}
        />
        <Field label="Tags" value={f.tags} onChange={update("tags")} />
        <Field
          label="Status"
          value={f.status}
          onChange={update("status")}
          options={[
            { v: "draft", l: "Draft" },
            { v: "active", l: "Active" },
            { v: "archived", l: "Archived" },
          ]}
        />
        <div
          style={{
            gridColumn: "1/-1",
            borderTop: "1px solid var(--border-color)",
            paddingTop: 20,
            marginTop: 8,
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Pricing & Inventory
          </p>
        </div>
        <Field
          label="Price"
          value={f.price}
          onChange={update("price")}
          type="number"
          pre="$"
        />
        <Field
          label="Compare At Price"
          value={f.compare_at_price}
          onChange={update("compare_at_price")}
          type="number"
          pre="$"
        />
        <Field label="SKU" value={f.sku} onChange={update("sku")} />
        <Field
          label="Inventory Qty"
          value={f.inventory_quantity}
          onChange={update("inventory_quantity")}
          type="number"
        />
        <div
          style={{
            gridColumn: "1/-1",
            borderTop: "1px solid var(--border-color)",
            paddingTop: 20,
            marginTop: 8,
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Media & Description
          </p>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <Field
            label="Image URL"
            value={f.image_src}
            onChange={update("image_src")}
          />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <Field
            label="Description (HTML)"
            value={f.body_html}
            onChange={update("body_html")}
            type="textarea"
            rows={4}
          />
        </div>
        <div
          style={{
            gridColumn: "1/-1",
            display: "flex",
            gap: 14,
            paddingTop: 8,
          }}
        >
          <button
            onClick={save}
            disabled={saving || !f.title}
            className="btn btn-primary"
            style={{ flex: 1, padding: "14px" }}
          >
            {saving ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Spin size={16} /> Saving...
              </span>
            ) : (
              "Save to Shopify"
            )}
          </button>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: "14px 28px" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ===== PRODUCT CARD =====
const ProductCard = ({ p, sel, onSel, onEdit, onDel }) => {
  const img = p.images?.[0]?.src;
  const price = p.variants?.[0]?.price;
  const cmp = p.variants?.[0]?.compare_at_price;
  const inv = p.variants?.reduce((s, v) => s + (v.inventory_quantity || 0), 0);
  return (
    <div
      className="card-hover"
      style={{
        background: "var(--bg-card)",
        border: `2px solid ${sel ? "var(--accent)" : "var(--border-color)"}`,
        borderRadius: 24,
        overflow: "hidden",
        position: "relative",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ position: "absolute", top: 16, left: 16, zIndex: 2 }}>
        <input
          type="checkbox"
          className="chk"
          checked={sel}
          onChange={() => onSel(p.id)}
          aria-label={`Select ${p.title}`}
        />
      </div>
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 2 }}>
        <Badge status={p.status} />
      </div>
      <div
        style={{
          height: 190,
          background: "var(--bg-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {img ? (
          <img
            src={img}
            alt={p.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.4s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.08)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              color: "var(--text-muted)",
            }}
          >
            <Ico n="image" size={40} color="var(--text-muted)" />
            <span style={{ fontSize: 12 }}>No image</span>
          </div>
        )}
      </div>
      <div style={{ padding: 20 }}>
        <h3
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {p.title}
        </h3>
        {p.vendor && (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: 10,
            }}
          >
            {p.vendor}
          </p>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}
            >
              {price ? `$${price}` : "—"}
            </span>
            {cmp && (
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  textDecoration: "line-through",
                }}
              >
                ${cmp}
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 12,
              color: inv > 0 ? "var(--success)" : "var(--danger)",
              background:
                inv > 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              padding: "4px 10px",
              borderRadius: 30,
              fontWeight: 500,
            }}
          >
            {inv} in stock
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => onEdit(p)}
            className="btn btn-secondary"
            style={{ flex: 1, padding: "10px", fontSize: 14 }}
            aria-label="Edit"
          >
            <Ico n="edit" size={14} color="var(--accent)" /> Edit
          </button>
          <button
            onClick={() => onDel(p.id)}
            className="btn btn-danger"
            style={{ padding: "10px 12px" }}
            aria-label="Delete"
          >
            <Ico n="trash" size={14} color="var(--danger)" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== PRODUCTS PAGE =====
const ProductsPage = ({ toast }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [sel, setSel] = useState(new Set());
  const [editM, setEditM] = useState(null);
  const [priceM, setPriceM] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam =
        statusF && statusF !== "all" ? `?status=${statusF}` : "";
      const d = await api.get(`/products${statusParam}`);
      setProducts(d.products || []);
    } catch {
      toast("Failed to load products", "error");
    }
    setLoading(false);
  }, [statusF, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = products
    .filter(
      (p) =>
        !search ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.vendor?.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((p) => statusF === "all" || p.status === statusF);

  const toggleSel = (id) =>
    setSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const selAll = () =>
    setSel(
      sel.size === filtered.length
        ? new Set()
        : new Set(filtered.map((p) => p.id)),
    );

  const handleSave = async (payload) => {
    try {
      if (editM?.id) {
        await api.put(`/products/${editM.id}`, payload);
        toast("Product updated!");
      } else {
        await api.post("/products", payload);
        toast("Product created!");
      }
      setEditM(null);
      load();
    } catch {
      toast("Failed to save", "error");
    }
  };

  const handleDel = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    setDeleting(id);
    try {
      await api.delete(`/products/${id}`);
      toast("Deleted");
      load();
    } catch {
      toast("Failed", "error");
    }
    setDeleting(null);
  };

  const handleRemoveDuplicates = async () => {
    try {
      const preview = await api.get("/products/find-duplicates");
      if (preview.duplicates_found === 0) {
        toast("No duplicate products found! ✅", "success");
        return;
      }
      const list = preview.duplicates.map((d) => `• ${d.title}`).join("\n");
      if (
        !window.confirm(
          `Found ${preview.duplicates_found} duplicate(s):\n\n${list}\n\nDelete them? (keeps the first one)`,
        )
      )
        return;
      const result = await api.post("/products/remove-duplicates", {});
      toast(
        `Deleted ${result.deleted} duplicate(s)!${result.failed ? ` (${result.failed} failed)` : ""}`,
        result.deleted > 0 ? "success" : "error",
      );
      load();
    } catch {
      toast("Failed to remove duplicates", "error");
    }
  };

  const handleBulkDel = async () => {
    if (!sel.size || !window.confirm(`Delete ${sel.size} products?`)) return;
    let ok = 0,
      fail = 0;
    for (const id of sel) {
      try {
        await api.delete(`/products/${id}`);
        ok++;
      } catch {
        fail++;
      }
    }
    toast(`Deleted ${ok}${fail ? `, ${fail} failed` : ""}`);
    setSel(new Set());
    load();
  };

  const syncShopify = async () => {
    try {
      setLoading(true);
      const d = await api.get("/products/sync");
      setProducts(d.products || []);
      toast(`✅ Synced ${d.count} products from Shopify!`);
    } catch {
      toast("Failed to sync from Shopify", "error");
    }
    setLoading(false);
  };

  const handlePriceAdj = async ({ mode, value, dir }) => {
    const prods = products.filter((p) => sel.has(p.id));
    let ok = 0,
      fail = 0;
    for (const p of prods) {
      const v = p.variants?.[0];
      if (!v?.price) continue;
      const cur = parseFloat(v.price);
      let np =
        mode === "percent"
          ? dir === "increase"
            ? cur * (1 + value / 100)
            : cur * (1 - value / 100)
          : dir === "increase"
            ? cur + value
            : cur - value;
      np = Math.max(0, np).toFixed(2);
      try {
        await api.put(`/products/${p.id}`, {
          title: p.title,
          variants: [{ ...v, price: np }],
        });
        ok++;
      } catch {
        fail++;
      }
    }
    toast(`Updated ${ok} prices${fail ? `, ${fail} failed` : ""}`);
    setPriceM(false);
    setSel(new Set());
    load();
  };

  const stats = {
    total: products.length,
    active: products.filter((p) => p.status === "active").length,
    draft: products.filter((p) => p.status === "draft").length,
  };

  return (
    <div
      className="fade-up"
      style={{ maxWidth: 1400, margin: "0 auto", padding: "0 28px" }}
    >
      {editM !== null && (
        <EditModal
          product={editM === true ? null : editM}
          onSave={handleSave}
          onClose={() => setEditM(null)}
        />
      )}
      {priceM && (
        <PriceModal
          count={sel.size}
          onApply={handlePriceAdj}
          onClose={() => setPriceM(false)}
        />
      )}

      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 36,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.5px",
          }}
        >
          Products
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 16 }}>
          Manage your Shopify product catalog
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 20,
          marginBottom: 28,
        }}
      >
        {[
          {
            label: "Total",
            value: stats.total,
            color: "var(--accent)",
            icon: "products",
          },
          {
            label: "Active",
            value: stats.active,
            color: "var(--success)",
            icon: "check",
          },
          {
            label: "Drafts",
            value: stats.draft,
            color: "var(--warning)",
            icon: "edit",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: 24,
              padding: "22px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: `${s.color}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ico n={s.icon} size={24} color={s.color} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  color: s.color,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  lineHeight: 1.2,
                }}
              >
                {loading ? "—" : s.value}
              </div>
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
          <div
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <Ico n="search" size={18} color="var(--text-muted)" />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="field-input"
            style={{ padding: "12px 16px 12px 44px", borderRadius: 16 }}
          />
        </div>
        <select
          value={statusF}
          onChange={(e) => setStatusF(e.target.value)}
          className="field-input"
          style={{
            padding: "12px 18px",
            borderRadius: 16,
            cursor: "pointer",
            width: "auto",
          }}
        >
          {[
            { v: "all", l: "All Products" },
            { v: "active", l: "Active" },
            { v: "draft", l: "Draft" },
            { v: "archived", l: "Archived" },
          ].map((o) => (
            <option key={o.v} value={o.v}>
              {o.l}
            </option>
          ))}
        </select>
        <div
          style={{
            display: "flex",
            background: "var(--bg-card)",
            border: "1px solid var(--border-light)",
            borderRadius: 16,
            padding: 4,
            gap: 4,
          }}
        >
          {[
            { id: "grid", icon: "grid" },
            { id: "list", icon: "list" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                background: view === v.id ? "var(--accent)" : "transparent",
                border: "none",
                cursor: "pointer",
                color: view === v.id ? "#fff" : "var(--text-muted)",
                transition: "var(--transition)",
              }}
              aria-label={`${v.id} view`}
            >
              <Ico n={v.icon} size={18} />
            </button>
          ))}
        </div>
        <button
          onClick={syncShopify}
          disabled={loading}
          className="btn btn-primary"
          style={{ padding: "12px 22px" }}
        >
          {syncing ? <Spin size={18} /> : "🔄 Sync Shopify"}
        </button>
        <button
          onClick={() => setEditM(true)}
          className="btn btn-primary"
          style={{ padding: "12px 22px" }}
        >
          <Ico n="plus" size={18} /> Add Product
        </button>
      </div>

      {/* Bulk Actions */}
      {sel.size > 0 && (
        <div
          className="fade-up"
          style={{
            background: "rgba(139,92,246,0.08)",
            border: "1px solid rgba(139,92,246,0.25)",
            borderRadius: 18,
            padding: "14px 22px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{ fontSize: 15, color: "var(--accent)", fontWeight: 600 }}
          >
            {sel.size} selected
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setPriceM(true)}
            className="btn btn-secondary"
            style={{ padding: "10px 18px" }}
          >
            <Ico n="percent" size={16} color="var(--accent)" /> Adjust Prices
          </button>
          <button
            onClick={handleRemoveDuplicates}
            className="btn btn-secondary"
            style={{ padding: "10px 18px" }}
          >
            <Ico n="percent" size={16} color="var(--warning)" /> Remove
            Duplicates
          </button>
          <button
            onClick={handleBulkDel}
            className="btn btn-danger"
            style={{ padding: "10px 18px" }}
          >
            <Ico n="trash" size={16} /> Delete
          </button>
          <button
            onClick={() => setSel(new Set())}
            className="btn btn-secondary"
            style={{ padding: "10px 12px" }}
            aria-label="Clear selection"
          >
            <Ico n="x" size={16} />
          </button>
        </div>
      )}

      {/* Select All */}
      {filtered.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <input
            type="checkbox"
            className="chk"
            checked={sel.size === filtered.length && filtered.length > 0}
            onChange={selAll}
            id="selectAll"
          />
          <label
            htmlFor="selectAll"
            style={{
              fontSize: 15,
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            Select all {filtered.length}
          </label>
        </div>
      )}

      {/* Product Grid/List */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              view === "grid" ? "repeat(auto-fill,minmax(240px,1fr))" : "1fr",
            gap: 20,
          }}
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: view === "grid" ? 360 : 80 }}
            />
          ))}
        </div>
      ) : view === "grid" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
            gap: 20,
          }}
        >
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              sel={sel.has(p.id)}
              onSel={toggleSel}
              onEdit={setEditM}
              onDel={handleDel}
            />
          ))}
          {filtered.length === 0 && (
            <p
              style={{
                color: "var(--text-muted)",
                gridColumn: "1/-1",
                textAlign: "center",
                padding: 80,
                fontSize: 16,
              }}
            >
              No products found
            </p>
          )}
        </div>
      ) : (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "16px 20px", width: 40 }}></th>
                {["Product", "Vendor", "Price", "Stock", "Status", ""].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "16px 20px",
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const img = p.images?.[0]?.src;
                const price = p.variants?.[0]?.price;
                const inv = p.variants?.reduce(
                  (s, v) => s + (v.inventory_quantity || 0),
                  0,
                );
                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom:
                        i < filtered.length - 1
                          ? "1px solid var(--border-color)"
                          : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-secondary)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <input
                        type="checkbox"
                        className="chk"
                        checked={sel.has(p.id)}
                        onChange={() => toggleSel(p.id)}
                        aria-label={`Select ${p.title}`}
                      />
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: "var(--bg-secondary)",
                            overflow: "hidden",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {img ? (
                            <img
                              src={img}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <Ico
                              n="image"
                              size={20}
                              color="var(--text-muted)"
                            />
                          )}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            {p.title}
                          </div>
                          {p.product_type && (
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--text-muted)",
                              }}
                            >
                              {p.product_type}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "14px 20px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {p.vendor || "—"}
                    </td>
                    <td
                      style={{
                        padding: "14px 20px",
                        fontWeight: 600,
                        color: "var(--accent)",
                      }}
                    >
                      {price ? `$${price}` : "—"}
                    </td>
                    <td
                      style={{
                        padding: "14px 20px",
                        color: inv > 0 ? "var(--success)" : "var(--danger)",
                      }}
                    >
                      {inv} units
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <Badge status={p.status} />
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={() => setEditM(p)}
                          className="btn btn-secondary"
                          style={{ padding: "8px 12px" }}
                          aria-label="Edit"
                        >
                          <Ico n="edit" size={16} color="var(--accent)" />
                        </button>
                        <button
                          onClick={() => handleDel(p.id)}
                          disabled={deleting === p.id}
                          className="btn btn-secondary"
                          style={{
                            padding: "8px 12px",
                            color: "var(--danger)",
                          }}
                          aria-label="Delete"
                        >
                          {deleting === p.id ? (
                            <Spin size={16} />
                          ) : (
                            <Ico n="trash" size={16} color="var(--danger)" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 80,
                      textAlign: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    No products
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ===== UPLOAD PAGE (updated styling) =====
const UploadPage = ({ toast }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [full, setFull] = useState(null);
  const [edited, setEdited] = useState({});
  const [loading, setLoading] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [results, setResults] = useState(null);
  const [drag, setDrag] = useState(false);
  const [step, setStep] = useState(1);

  const drop = (f) => {
    setFile(f);
    setPreview(null);
    setFull(null);
    setResults(null);
    setStep(1);
  };
  const doPreview = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    const d = await api.upload("/upload/preview", fd);
    if (d.columns) {
      setPreview(d);
      setStep(2);
    } else toast(d.detail || "Failed", "error");
    setLoading(false);
  };
  const doParse = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    const d = await api.upload("/upload/parse", fd);
    if (d.columns) {
      setFull(d);
      setEdited({});
      setStep(3);
    } else toast(d.detail || "Failed", "error");
    setLoading(false);
  };
  const doPush = async () => {
    if (!full || !window.confirm(`Push ${full.total_rows} rows to Shopify?`))
      return;
    setPushing(true);
    const prods = full.data.map((r, i) => ({ ...r, ...edited[i] }));
    const d = await api.post("/upload/push-to-shopify", prods);
    setResults(d);
    toast(`${d.success?.length || 0} products pushed!`);
    setPushing(false);
    setStep(4);
  };
  const steps = ["Select File", "Preview", "Edit & Review", "Done"];

  return (
    <div
      className="fade-up"
      style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}
    >
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 36,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          Upload Products
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 16 }}>
          Import Excel or CSV and push to Shopify
        </p>
      </div>

      {/* Stepper */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 36,
          gap: 0,
        }}
      >
        {steps.map((s, i) => (
          <div
            key={s}
            style={{
              display: "flex",
              alignItems: "center",
              flex: i < steps.length - 1 ? 1 : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    step > i + 1
                      ? "var(--accent)"
                      : step === i + 1
                        ? "var(--accent-gradient)"
                        : "var(--bg-card)",
                  border: `2px solid ${step >= i + 1 ? "var(--accent)" : "var(--border-light)"}`,
                  fontSize: 14,
                  fontWeight: 700,
                  color: step >= i + 1 ? "#fff" : "var(--text-muted)",
                  transition: "var(--transition)",
                }}
              >
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color:
                    step === i + 1
                      ? "var(--accent)"
                      : step > i + 1
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                }}
              >
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background:
                    step > i + 1 ? "var(--accent)" : "var(--border-color)",
                  margin: "0 16px",
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Dropzone */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: 28,
          padding: 32,
          marginBottom: 24,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f) drop(f);
          }}
          onClick={() => document.getElementById("fileInput").click()}
          style={{
            border: `2px dashed ${drag ? "var(--accent)" : file ? "var(--success)" : "var(--border-light)"}`,
            borderRadius: 20,
            padding: "56px 28px",
            textAlign: "center",
            cursor: "pointer",
            background: drag
              ? "rgba(139,92,246,0.05)"
              : file
                ? "rgba(16,185,129,0.05)"
                : "transparent",
            transition: "var(--transition)",
          }}
        >
          <input
            id="fileInput"
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={(e) => e.target.files[0] && drop(e.target.files[0])}
          />
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <p
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: file ? "var(--success)" : "var(--text-primary)",
              marginBottom: 4,
            }}
          >
            {file ? `✓ ${file.name}` : "Drop file here or click to browse"}
          </p>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Supports .xlsx, .xls, .csv
          </p>
        </div>
        {file && (
          <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
            <button
              onClick={doPreview}
              disabled={loading}
              className="btn btn-secondary"
              style={{ flex: 1, padding: "14px" }}
            >
              {loading && step === 1 ? <Spin size={18} /> : null} Preview (10
              rows)
            </button>
            <button
              onClick={doParse}
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 1, padding: "14px" }}
            >
              {loading ? <Spin size={18} /> : null} Parse Full Data
            </button>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && !full && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: 28,
            padding: 28,
            marginBottom: 24,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <h3
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              Preview
            </h3>
            <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
              {preview.total_rows} rows · first 10 shown
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  {preview.columns.map((c) => (
                    <th
                      key={c}
                      style={{
                        padding: "12px 14px",
                        textAlign: "left",
                        color: "var(--text-muted)",
                        fontWeight: 600,
                        fontSize: 12,
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(preview.preview || preview.data || []).map((row, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    {preview.columns.map((c) => (
                      <td
                        key={c}
                        style={{
                          padding: "12px 14px",
                          color: "var(--text-secondary)",
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {String(row[c] || "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit & Review */}
      {full && !results && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: 28,
            padding: 28,
            marginBottom: 24,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <h3
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              Edit & Review
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
                {full.total_rows} rows
              </span>
              <button
                onClick={doPush}
                disabled={pushing}
                className="btn btn-primary"
                style={{ padding: "12px 22px" }}
              >
                {pushing ? (
                  <>
                    <Spin size={18} /> Pushing...
                  </>
                ) : (
                  "🚀 Push to Shopify"
                )}
              </button>
            </div>
          </div>
          <div
            style={{
              overflowX: "auto",
              maxHeight: 520,
              overflowY: "auto",
              border: "1px solid var(--border-color)",
              borderRadius: 16,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  background: "var(--bg-card)",
                  zIndex: 1,
                }}
              >
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <th
                    style={{
                      padding: "12px 14px",
                      color: "var(--text-muted)",
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    #
                  </th>
                  {full.columns.map((c) => (
                    <th
                      key={c}
                      style={{
                        padding: "12px 14px",
                        textAlign: "left",
                        color: "var(--text-muted)",
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {full.data.map((row, ri) => (
                  <tr
                    key={ri}
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <td
                      style={{
                        padding: "8px 14px",
                        color: "var(--text-muted)",
                        textAlign: "center",
                      }}
                    >
                      {ri + 1}
                    </td>
                    {full.columns.map((c) => (
                      <td key={c} style={{ padding: "6px 10px" }}>
                        <input
                          value={edited[ri]?.[c] ?? String(row[c] || "")}
                          onChange={(e) =>
                            setEdited((p) => ({
                              ...p,
                              [ri]: { ...p[ri], [c]: e.target.value },
                            }))
                          }
                          className="field-input"
                          style={{
                            padding: "8px 10px",
                            fontSize: 12,
                            minWidth: 90,
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div
          className="fade-up"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
        >
          <div
            style={{
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: 24,
              padding: 32,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: "var(--success)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                lineHeight: 1,
              }}
            >
              {results.success?.length}
            </div>
            <div
              style={{ fontSize: 16, color: "var(--success)", marginTop: 6 }}
            >
              Created successfully
            </div>
          </div>
          <div
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 24,
              padding: 32,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: "var(--danger)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                lineHeight: 1,
              }}
            >
              {results.errors?.length}
            </div>
            <div style={{ fontSize: 16, color: "var(--danger)", marginTop: 6 }}>
              Failed
            </div>
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
                setFull(null);
                setResults(null);
                setStep(1);
              }}
              className="btn btn-primary"
              style={{ padding: "16px 28px", fontSize: 16 }}
            >
              Upload Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== SIDEBAR =====
const Sidebar = ({ page, set }) => (
  <aside
    style={{
      width: 240,
      background: "var(--bg-secondary)",
      borderRight: "1px solid var(--border-color)",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      position: "fixed",
      left: 0,
      top: 0,
      zIndex: 100,
    }}
  >
    <div
      style={{
        padding: "28px 20px 20px",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: "var(--accent-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}
        >
          🛍️
        </div>
        <div>
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 18,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            ShopManager
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Shopify Control
          </div>
        </div>
      </div>
    </div>
    <nav
      style={{
        flex: 1,
        padding: "20px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {[
        { id: "products", label: "Products", icon: "products" },
        { id: "upload", label: "Upload", icon: "upload" },
        { id: "collections", label: "Collections", icon: "collections" },
        { id: "inventory", label: "Inventory", icon: "inventory" },
      ].map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => set(id)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 16px",
            borderRadius: 14,
            border: "none",
            cursor: "pointer",
            background: page === id ? "rgba(139,92,246,0.15)" : "transparent",
            color: page === id ? "var(--accent)" : "var(--text-muted)",
            fontSize: 15,
            fontWeight: page === id ? 600 : 400,
            transition: "var(--transition)",
            textAlign: "left",
            borderLeft: `4px solid ${page === id ? "var(--accent)" : "transparent"}`,
          }}
        >
          <Ico
            n={icon}
            size={20}
            color={page === id ? "var(--accent)" : "var(--text-muted)"}
          />
          {label}
        </button>
      ))}
    </nav>
    <div
      style={{
        padding: "20px 14px",
        borderTop: "1px solid var(--border-color)",
      }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: 18,
          padding: "16px 18px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "var(--success)",
            fontWeight: 600,
            marginBottom: 4,
            textTransform: "uppercase",
          }}
        >
          ● Connected
        </div>
        <div
          style={{
            fontSize: 15,
            color: "var(--text-primary)",
            fontWeight: 500,
          }}
        >
          gunjanck-2
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          myshopify.com
        </div>
      </div>
    </div>
  </aside>
);

// ===== MAIN APP =====
export default function App() {
  const [page, setPage] = useState("products");
  const { toasts, add, remove } = useToast();
  return (
    <>
      <GlobalStyles />
      <Toasts toasts={toasts} remove={remove} />
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "var(--bg-primary)",
          overflowX: "hidden",
        }}
      >
        <Sidebar page={page} set={setPage} />
        <main
          style={{
            flex: 1,
            marginLeft: 240,
            width: "calc(100vw - 240px)",
            padding: "36px 0",
            minHeight: "100vh",
          }}
        >
          {page === "products" && <ProductsPage toast={add} />}
          {page === "upload" && <UploadPage toast={add} />}
          {page === "collections" && <CollectionsPage />}
          {page === "inventory" && <InventoryPage />}
        </main>
      </div>
    </>
  );
}
