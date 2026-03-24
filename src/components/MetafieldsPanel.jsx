import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../api/config";
import { authFetch } from "../lib/authFetch";
import { Spin } from "./Icons";

const C = {
  card: "var(--bg-card)",
  border: "var(--border-strong)",
  borderFocus: "var(--accent)",
  text: "var(--text-primary)",
  muted: "var(--text-muted)",
  disabled: "var(--text-muted)",
  accent: "var(--accent)",
  success: "var(--success)",
  danger: "var(--danger)",
  warning: "var(--warning)",
};

const METAFIELD_TYPE_GROUPS = [
  {
    group: "Text",
    types: [
      { value: "single_line_text_field", label: "Single line text" },
      { value: "multi_line_text_field", label: "Multi line text" },
      { value: "rich_text_field", label: "Rich text (HTML)" },
    ],
  },
  {
    group: "Number",
    types: [
      { value: "number_integer", label: "Integer" },
      { value: "number_decimal", label: "Decimal" },
      { value: "rating", label: "Rating" },
    ],
  },
  {
    group: "Date & Time",
    types: [
      { value: "date", label: "Date" },
      { value: "date_time", label: "Date & Time" },
    ],
  },
  {
    group: "Other",
    types: [
      { value: "boolean", label: "True / False" },
      { value: "color", label: "Color" },
      { value: "url", label: "URL" },
      { value: "json", label: "JSON" },
    ],
  },
  {
    group: "Measurements",
    types: [
      { value: "dimension", label: "Dimension" },
      { value: "weight", label: "Weight" },
      { value: "volume", label: "Volume" },
      { value: "money", label: "Money" },
    ],
  },
  {
    group: "References",
    types: [
      { value: "page_reference", label: "Page" },
      { value: "product_reference", label: "Product" },
      { value: "collection_reference", label: "Collection" },
      { value: "variant_reference", label: "Variant" },
      { value: "file_reference", label: "File" },
    ],
  },
  {
    group: "Lists",
    types: [
      { value: "list.single_line_text_field", label: "List: Text" },
      { value: "list.number_integer", label: "List: Integer" },
      { value: "list.color", label: "List: Colors" },
      { value: "list.date", label: "List: Dates" },
      { value: "list.date_time", label: "List: Date & Times" },
      { value: "list.url", label: "List: URLs" },
      { value: "list.product_reference", label: "List: Products" },
      { value: "list.collection_reference", label: "List: Collections" },
      { value: "list.variant_reference", label: "List: Variants" },
      { value: "list.file_reference", label: "List: Files" },
      { value: "list.page_reference", label: "List: Pages" },
    ],
  },
];

const TYPE_COLORS = {
  single_line_text_field: {
    bg: "var(--color-blue-light)",
    c: "var(--color-blue)",
  },
  multi_line_text_field: {
    bg: "var(--color-blue-light)",
    c: "var(--color-blue)",
  },
  rich_text_field: { bg: "var(--color-blue-light)", c: "var(--color-blue)" },
  number_integer: { bg: "var(--success-light)", c: "var(--success)" },
  number_decimal: { bg: "var(--success-light)", c: "var(--success)" },
  rating: { bg: "var(--warning-light)", c: "var(--warning)" },
  date: { bg: "var(--color-purple-light)", c: "var(--color-purple)" },
  date_time: { bg: "var(--color-purple-light)", c: "var(--color-purple)" },
  boolean: { bg: "var(--warning-light)", c: "var(--warning)" },
  color: { bg: "var(--color-red-light)", c: "var(--color-red)" },
  url: { bg: "var(--bg-overlay-light)", c: "var(--text-muted)" },
  json: { bg: "var(--bg-overlay-light)", c: "var(--text-muted)" },
  dimension: { bg: "var(--color-cyan-light)", c: "var(--color-cyan)" },
  weight: { bg: "var(--color-cyan-light)", c: "var(--color-cyan)" },
  volume: { bg: "var(--color-cyan-light)", c: "var(--color-cyan)" },
  money: { bg: "var(--color-cyan-light)", c: "var(--color-cyan)" },
};

function getTypeColor(type) {
  if (!type) return { bg: "var(--bg-overlay-light)", c: "var(--text-muted)" };
  if (type.startsWith("list."))
    return { bg: "var(--accent-light)", c: "var(--accent)" };
  if (type.endsWith("_reference"))
    return { bg: "var(--color-pink-light)", c: "var(--color-pink)" };
  return (
    TYPE_COLORS[type] || {
      bg: "var(--bg-overlay-light)",
      c: "var(--text-muted)",
    }
  );
}

function getTypeLabel(type) {
  for (const group of METAFIELD_TYPE_GROUPS) {
    const found = group.types.find((t) => t.value === type);
    if (found) return found.label;
  }
  return type || "—";
}

function formatForDisplay(value) {
  if (value === null || value === undefined || value === "") return null;
  const str = typeof value === "object" ? JSON.stringify(value) : String(value);
  return str.length > 120 ? str.slice(0, 120) + "…" : str;
}

function formatForSave(value, type) {
  if (["dimension", "weight", "volume", "money"].includes(type)) {
    try {
      return JSON.stringify(
        typeof value === "string" ? JSON.parse(value) : value,
      );
    } catch {
      return value;
    }
  }
  if (type?.startsWith("list.")) {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(Array.isArray(parsed) ? parsed : [value]);
    } catch {
      return JSON.stringify([value]);
    }
  }
  return String(value ?? "");
}

const baseInput = {
  width: "100%",
  padding: "8px 12px",
  background: "var(--bg-input)",
  border: `1px solid ${C.border}`,
  borderRadius: 7,
  fontSize: 13,
  color: C.text,
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color .15s, box-shadow .15s",
  boxSizing: "border-box",
};

// ── Smart value input per type ─────────────────────────────────────────────────
function ValueInput({ type, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  const style = {
    ...baseInput,
    ...(focused
      ? {
          borderColor: C.borderFocus,
          boxShadow: "var(--focus-ring)",
        }
      : {}),
  };
  const onFocus = () => setFocused(true);
  const onBlur = () => setFocused(false);

  if (type === "boolean") {
    return (
      <select
        value={value || "true"}
        onChange={(e) => onChange(e.target.value)}
        style={style}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }
  if (["number_integer", "number_decimal", "rating"].includes(type)) {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={style}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
      />
    );
  }
  if (type === "date") {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={style}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    );
  }
  if (type === "date_time") {
    return (
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={style}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    );
  }
  if (type === "color") {
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 40,
            height: 38,
            borderRadius: 6,
            border: `1px solid ${C.border}`,
            cursor: "pointer",
            background: "transparent",
            padding: 2,
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...style, flex: 1 }}
          placeholder="#000000"
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>
    );
  }
  if (["json", "rich_text_field"].includes(type)) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{ ...style, minHeight: 90, resize: "vertical" }}
        placeholder={
          type === "json" ? '{"key": "value"}' : "<p>HTML content</p>"
        }
      />
    );
  }
  if (type === "multi_line_text_field") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{ ...style, minHeight: 80, resize: "vertical" }}
        placeholder={placeholder}
      />
    );
  }
  if (["dimension", "weight", "volume"].includes(type)) {
    let parsed = { value: "", unit: "" };
    try {
      const p = JSON.parse(value);
      if (p && typeof p === "object") parsed = p;
    } catch {}
    const hints = {
      dimension: "cm, mm, in, ft",
      weight: "kg, g, lb, oz",
      volume: "ml, L, fl_oz",
    };
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="number"
          value={parsed.value || ""}
          onChange={(e) =>
            onChange(JSON.stringify({ ...parsed, value: e.target.value }))
          }
          style={{ ...style, flex: 1 }}
          placeholder="Value"
        />
        <input
          type="text"
          value={parsed.unit || ""}
          onChange={(e) =>
            onChange(JSON.stringify({ ...parsed, unit: e.target.value }))
          }
          style={{ ...style, width: 110 }}
          placeholder={hints[type]}
        />
      </div>
    );
  }
  if (type === "money") {
    let parsed = { amount: "", currency_code: "USD" };
    try {
      const p = JSON.parse(value);
      if (p && typeof p === "object") parsed = p;
    } catch {}
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="number"
          value={parsed.amount || ""}
          onChange={(e) =>
            onChange(JSON.stringify({ ...parsed, amount: e.target.value }))
          }
          style={{ ...style, flex: 1 }}
          placeholder="0.00"
        />
        <input
          type="text"
          value={parsed.currency_code || ""}
          onChange={(e) =>
            onChange(
              JSON.stringify({ ...parsed, currency_code: e.target.value }),
            )
          }
          style={{ ...style, width: 80 }}
          placeholder="USD"
          maxLength={3}
        />
      </div>
    );
  }
  if (type?.startsWith("list.") || type?.endsWith("_reference")) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          ...style,
          minHeight: 70,
          resize: "vertical",
          fontFamily: "monospace",
          fontSize: 12,
        }}
        placeholder={
          type?.startsWith("list.") ? '["value1", "value2"]' : "gid://shopify/…"
        }
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={style}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
    />
  );
}

// ── Button ─────────────────────────────────────────────────────────────────────
function Btn({ children, onClick, disabled, variant = "secondary", style: s }) {
  const [hov, setHov] = useState(false);
  const map = {
    primary: {
      background: hov ? "var(--accent)" : C.accent,
      color: C.text,
      border: "none",
    },
    secondary: {
      background: hov ? C.border : C.card,
      color: C.muted,
      border: `1px solid ${C.border}`,
    },
    danger: {
      background: hov ? "var(--danger-light)" : "transparent",
      color: C.danger,
      border: `1px solid ${hov ? C.danger : C.border}`,
    },
    ghost: { background: "transparent", color: C.muted, border: "none" },
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "7px 14px",
        borderRadius: 7,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all .15s",
        opacity: disabled ? 0.5 : 1,
        ...map[variant],
        ...s,
      }}
    >
      {children}
    </button>
  );
}

// ── Definition row — shown when definition exists but no value yet ─────────────
function DefinitionRow({ def, resource, resourceId, toast, onSaved }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const type = def.type?.name || "single_line_text_field";
  const tc = getTypeColor(type);

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await authFetch(
        `${API_BASE_URL}/metafields/${resource}/${resourceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            namespace: def.namespace,
            key: def.key,
            type,
            value: formatForSave(value, type),
          }),
        },
      );
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Failed");
      toast?.("Saved!", "success");
      setEditing(false);
      setValue("");
      onSaved();
    } catch (e) {
      toast?.(e.message, "error");
    }
    setSaving(false);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        padding: "14px 0",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {/* Label */}
      <div style={{ width: 200, flexShrink: 0, paddingTop: 2 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
          {def.name || def.key}
        </div>
        <code
          style={{
            fontSize: 10,
            color: C.disabled,
            display: "block",
            marginTop: 2,
          }}
        >
          {def.namespace}.{def.key}
        </code>
        <span
          style={{
            background: tc.bg,
            color: tc.c,
            fontSize: 9,
            padding: "2px 5px",
            borderRadius: 3,
            fontWeight: 700,
            display: "inline-block",
            marginTop: 4,
          }}
        >
          {getTypeLabel(type)}
        </span>
      </div>

      {/* Input area */}
      <div style={{ flex: 1 }}>
        {editing ? (
          <div>
            <ValueInput
              type={type}
              value={value}
              onChange={setValue}
              placeholder={def.description || "Enter value…"}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Btn
                onClick={handleSave}
                disabled={saving}
                variant="primary"
                style={{ fontSize: 12, padding: "5px 12px" }}
              >
                {saving ? <Spin size={11} /> : "Save"}
              </Btn>
              <Btn
                onClick={() => {
                  setEditing(false);
                  setValue("");
                }}
                variant="secondary"
                style={{ fontSize: 12, padding: "5px 12px" }}
              >
                Cancel
              </Btn>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setEditing(true)}
            style={{
              padding: "8px 12px",
              background: C.card,
              border: `1px dashed ${C.border}`,
              borderRadius: 7,
              fontSize: 12,
              color: C.disabled,
              cursor: "text",
              transition: "border-color .15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.accent)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
          >
            {def.description || "Click to add value…"}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Existing metafield row (already has a value) ───────────────────────────────
function MetafieldRow({ mf, defName, toast, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const tc = getTypeColor(mf.type);

  const startEdit = () => {
    setEditing(true);
    setEditVal(
      typeof mf.value === "object"
        ? JSON.stringify(mf.value)
        : String(mf.value ?? ""),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await authFetch(`${API_BASE_URL}/metafields/${mf.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: formatForSave(editVal, mf.type) }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Failed");
      toast?.("Updated!", "success");
      setEditing(false);
      onSaved();
    } catch (e) {
      toast?.(e.message, "error");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this metafield?")) return;
    setDeleting(true);
    try {
      const r = await authFetch(`${API_BASE_URL}/metafields/${mf.id}`, {
        method: "DELETE",
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.detail || "Failed");
      }
      toast?.("Deleted", "success");
      onDeleted(mf.id);
    } catch (e) {
      toast?.(e.message, "error");
    }
    setDeleting(false);
  };

  const displayed = formatForDisplay(mf.value);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        padding: "14px 0",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {/* Label */}
      <div style={{ width: 200, flexShrink: 0, paddingTop: 2 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
          {defName || mf.key}
        </div>
        <code
          style={{
            fontSize: 10,
            color: C.disabled,
            display: "block",
            marginTop: 2,
          }}
        >
          {mf.namespace}.{mf.key}
        </code>
        <span
          style={{
            background: tc.bg,
            color: tc.c,
            fontSize: 9,
            padding: "2px 5px",
            borderRadius: 3,
            fontWeight: 700,
            display: "inline-block",
            marginTop: 4,
          }}
        >
          {getTypeLabel(mf.type)}
        </span>
      </div>

      {/* Value / edit */}
      <div style={{ flex: 1 }}>
        {editing ? (
          <div>
            <ValueInput type={mf.type} value={editVal} onChange={setEditVal} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Btn
                onClick={handleSave}
                disabled={saving}
                variant="primary"
                style={{ fontSize: 12, padding: "5px 12px" }}
              >
                {saving ? <Spin size={11} /> : "Save"}
              </Btn>
              <Btn
                onClick={() => setEditing(false)}
                variant="secondary"
                style={{ fontSize: 12, padding: "5px 12px" }}
              >
                Cancel
              </Btn>
            </div>
          </div>
        ) : (
          <div
            onClick={startEdit}
            style={{
              padding: "8px 12px",
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              fontSize: 12,
              color: displayed ? C.text : C.disabled,
              cursor: "text",
              transition: "border-color .15s",
              fontFamily: ["json", "rich_text_field"].includes(mf.type)
                ? "monospace"
                : "inherit",
              wordBreak: "break-all",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.accent)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
          >
            {displayed || "—"}
          </div>
        )}
      </div>

      {/* Actions */}
      {!editing && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0, paddingTop: 2 }}>
          <Btn
            onClick={startEdit}
            variant="ghost"
            style={{ fontSize: 11, padding: "4px 8px" }}
          >
            Edit
          </Btn>
          <Btn
            onClick={handleDelete}
            disabled={deleting}
            variant="danger"
            style={{ fontSize: 11, padding: "4px 8px" }}
          >
            {deleting ? <Spin size={10} /> : "✕"}
          </Btn>
        </div>
      )}
    </div>
  );
}

// ── Add custom metafield form ──────────────────────────────────────────────────
function AddCustomForm({ resource, resourceId, toast, onSaved, onClose }) {
  const [form, setForm] = useState({
    namespace: "custom",
    key: "",
    type: "single_line_text_field",
    value: "",
  });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.key.trim()) {
      toast?.("Key is required", "error");
      return;
    }
    setSaving(true);
    try {
      const r = await authFetch(
        `${API_BASE_URL}/metafields/${resource}/${resourceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            namespace: form.namespace || "custom",
            key: form.key,
            type: form.type,
            value: formatForSave(form.value, form.type),
          }),
        },
      );
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Failed");
      toast?.("Metafield created!", "success");
      onSaved();
      onClose();
    } catch (e) {
      toast?.(e.message, "error");
    }
    setSaving(false);
  };

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.accent}`,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: C.text,
          marginBottom: 14,
        }}
      >
        Add custom metafield
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div>
          <label
            style={{
              fontSize: 11,
              color: C.muted,
              display: "block",
              marginBottom: 4,
            }}
          >
            Namespace
          </label>
          <input
            value={form.namespace}
            onChange={(e) =>
              setForm((p) => ({ ...p, namespace: e.target.value }))
            }
            style={baseInput}
            placeholder="custom"
          />
        </div>
        <div>
          <label
            style={{
              fontSize: 11,
              color: C.muted,
              display: "block",
              marginBottom: 4,
            }}
          >
            Key *
          </label>
          <input
            value={form.key}
            onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
            style={baseInput}
            placeholder="my_field"
          />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label
          style={{
            fontSize: 11,
            color: C.muted,
            display: "block",
            marginBottom: 4,
          }}
        >
          Type
        </label>
        <div style={{ position: "relative" }}>
          <select
            value={form.type}
            onChange={(e) =>
              setForm((p) => ({ ...p, type: e.target.value, value: "" }))
            }
            style={{
              ...baseInput,
              appearance: "none",
              cursor: "pointer",
              paddingRight: 32,
            }}
          >
            {METAFIELD_TYPE_GROUPS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.types.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <svg
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke={C.muted}
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            fontSize: 11,
            color: C.muted,
            display: "block",
            marginBottom: 4,
          }}
        >
          Value
        </label>
        <ValueInput
          type={form.type}
          value={form.value}
          onChange={(v) => setForm((p) => ({ ...p, value: v }))}
        />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={handleCreate} disabled={saving} variant="primary">
          {saving ? <Spin size={12} /> : "Save metafield"}
        </Btn>
        <Btn onClick={onClose} variant="secondary">
          Cancel
        </Btn>
      </div>
    </div>
  );
}

// ── Main MetafieldsPanel ───────────────────────────────────────────────────────
export default function MetafieldsPanel({
  resource,
  resourceId,
  resourceName,
  toast,
}) {
  const [metafields, setMetafields] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // ── Fetch both metafields and definitions in parallel ──────────────────────
  const fetchAll = useCallback(async () => {
    if (!resourceId) return;
    setLoading(true);
    try {
      const [mfRes, defRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/metafields/${resource}/${resourceId}`),
        authFetch(`${API_BASE_URL}/metafields/definitions/${resource}`),
      ]);
      const mfData = await mfRes.json();
      const defData = defRes.ok ? await defRes.json() : { definitions: [] };
      setMetafields(mfData.metafields || []);
      setDefinitions(defData.definitions || []);
    } catch {
      toast?.("Failed to load metafields", "error");
    }
    setLoading(false);
  }, [resource, resourceId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Build merged view (same logic as Shopify admin) ────────────────────────
  // For each definition → find matching metafield value if it exists
  const defRows = definitions.map((def) => ({
    def,
    existing:
      metafields.find(
        (mf) => mf.namespace === def.namespace && mf.key === def.key,
      ) || null,
  }));

  // Metafields that don't match any definition = custom/ad-hoc ones
  const definitionKeys = new Set(
    definitions.map((d) => `${d.namespace}.${d.key}`),
  );
  const customMetafields = metafields.filter(
    (mf) => !definitionKeys.has(`${mf.namespace}.${mf.key}`),
  );

  const handleDeleted = (id) =>
    setMetafields((prev) => prev.filter((m) => m.id !== id));

  const hasAnything = defRows.length > 0 || customMetafields.length > 0;

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 40,
        }}
      >
        <Spin size={22} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "inherit" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
            Metafields
            <span
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: C.muted,
                marginLeft: 8,
              }}
            >
              {metafields.length} field{metafields.length !== 1 ? "s" : ""}
            </span>
          </div>
          {resourceName && (
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              {resourceName}
            </div>
          )}
        </div>
        <Btn
          onClick={() => setShowAdd((p) => !p)}
          variant="primary"
          style={{ fontSize: 12 }}
        >
          + Add metafield
        </Btn>
      </div>

      {/* Add custom form */}
      {showAdd && (
        <AddCustomForm
          resource={resource}
          resourceId={resourceId}
          toast={toast}
          onSaved={fetchAll}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Empty state */}
      {!hasAnything && !showAdd && (
        <div style={{ textAlign: "center", padding: "36px 0", color: C.muted }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🏷️</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            No metafields yet
          </div>
          <div style={{ fontSize: 12 }}>
            Add custom data to extend this {resource.slice(0, -1)}
          </div>
        </div>
      )}

      {/* Definition-based rows — shown even when empty, just like Shopify */}
      {defRows.length > 0 && (
        <div>
          {defRows.map(({ def, existing }) =>
            existing ? (
              <MetafieldRow
                key={existing.id}
                mf={existing}
                defName={def.name}
                toast={toast}
                onSaved={fetchAll}
                onDeleted={handleDeleted}
              />
            ) : (
              <DefinitionRow
                key={`def-${def.id}`}
                def={def}
                resource={resource}
                resourceId={resourceId}
                toast={toast}
                onSaved={fetchAll}
              />
            ),
          )}
        </div>
      )}

      {/* Custom / ad-hoc metafields with no matching definition */}
      {customMetafields.length > 0 && (
        <div>
          {defRows.length > 0 && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: ".06em",
                padding: "14px 0 4px",
              }}
            >
              Custom metafields
            </div>
          )}
          {customMetafields.map((mf) => (
            <MetafieldRow
              key={mf.id}
              mf={mf}
              defName={null}
              toast={toast}
              onSaved={fetchAll}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
