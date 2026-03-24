import { useState } from "react";
import { Ico } from "./Icons";

export const useToast = () => {
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

export const Toasts = ({ toasts, remove }) => (
  <div
    style={{
      position: "fixed",
      top: 20,
      right: 20,
      zIndex: 99999,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      pointerEvents: "none",
    }}
  >
    {toasts.map((t) => (
      <div
        key={t.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 18px",
          background:
            t.type === "success"
              ? "var(--toast-success-bg)"
              : t.type === "error"
                ? "var(--toast-error-bg)"
                : "var(--toast-info-bg)",
          borderLeft: `4px solid ${
            t.type === "success"
              ? "var(--success)"
              : t.type === "error"
                ? "var(--danger)"
                : "var(--info)"
          }`,
          borderRadius: 12,
          boxShadow: "var(--shadow-lg)",
          minWidth: 300,
          maxWidth: 400,
          pointerEvents: "all",
          animation: "slideIn 0.3s ease, fadeUp 0.3s ease",
        }}
      >
        <Ico
          n={t.type === "success" ? "check" : "x"}
          size={16}
          color={t.type === "success" ? "var(--success)" : "var(--danger)"}
        />
        <span style={{ flex: 1, fontSize: 14, color: "var(--text-primary)" }}>
          {t.msg}
        </span>
        <button
          onClick={() => remove(t.id)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#666",
            padding: 4,
            display: "flex",
            borderRadius: 6,
          }}
          aria-label="Dismiss"
        >
          <Ico n="x" size={14} />
        </button>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 3,
            width: "100%",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "0 0 12px 12px",
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
