import { createPortal } from "react-dom";
import { Ico } from "./Icons";

export const Badge = ({ status }) => {
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
      color: "#6b7280",
      border: "rgba(107,114,128,0.3)",
    },
  };
  const s = styles[status] || styles.draft;
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        display: "inline-block",
      }}
    >
      {status || "draft"}
    </span>
  );
};

export const Modal = ({ title, subtitle, onClose, children, maxWidth = 660 }) =>
  createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ maxWidth }}>
        <div
          style={{
            padding: "24px 28px 16px",
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
                fontFamily: "'Syne', sans-serif",
                fontSize: 22,
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
                  fontSize: 13,
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
            style={{ padding: 8, borderRadius: 10 }}
            aria-label="Close"
          >
            <Ico n="x" size={18} />
          </button>
        </div>
        <div style={{ padding: "24px 28px 28px" }}>{children}</div>
      </div>
    </div>,
    document.body,
  );

export const Field = ({
  label,
  value,
  onChange,
  type = "text",
  options,
  rows,
  pre,
  suf,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label
      style={{
        fontSize: 12,
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
            left: 12,
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
            padding: "10px 14px",
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
            padding: `10px ${suf ? "40px" : "14px"} 10px ${pre ? "36px" : "14px"}`,
          }}
        />
      )}
      {suf && (
        <span
          style={{
            position: "absolute",
            right: 12,
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
