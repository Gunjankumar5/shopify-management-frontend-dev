import { Ico } from "./Icons";

const Sidebar = ({ page, set }) => (
  <aside
    style={{
      width: 220,
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
        padding: "24px 18px 18px",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "var(--accent-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          🛍️
        </div>
        <div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 16,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            ShopManager
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Shopify Control
          </div>
        </div>
      </div>
    </div>
    <nav
      style={{
        flex: 1,
        padding: "16px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
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
            gap: 12,
            padding: "10px 14px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            background: page === id ? "rgba(99,102,241,0.15)" : "transparent",
            color: page === id ? "var(--accent)" : "var(--text-muted)",
            fontSize: 14,
            fontWeight: page === id ? 600 : 400,
            transition: "var(--transition)",
            textAlign: "left",
            borderLeft: `3px solid ${page === id ? "var(--accent)" : "transparent"}`,
          }}
        >
          <Ico
            n={icon}
            size={18}
            color={page === id ? "var(--accent)" : "#444"}
          />
          {label}
        </button>
      ))}
    </nav>
    <div
      style={{
        padding: "16px 12px",
        borderTop: "1px solid var(--border-color)",
      }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: 14,
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            fontSize: 11,
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
            fontSize: 14,
            color: "var(--text-primary)",
            fontWeight: 500,
          }}
        >
          gunjanck-2
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          myshopify.com
        </div>
      </div>
    </div>
  </aside>
);

export default Sidebar;
