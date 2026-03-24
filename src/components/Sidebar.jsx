import { useState, useEffect, useRef } from "react";
import { Ico } from "./Icons";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../api/config";
import { authFetch } from "../lib/authFetch";
import { api } from "../api/api";

// Use CSS variables for theme-aware colors
const getColors = () => ({
  bgPrimary: "var(--bg-primary)",
  bgSecondary: "var(--bg-secondary)",
  bgCard: "var(--bg-card)",
  border: "var(--border-strong)",
  textPrimary: "var(--text-primary)",
  textMuted: "var(--text-muted)",
  accent: "var(--accent)",
  accentGradient: "var(--accent-gradient)",
});

const Sidebar = ({
  page,
  setPage,
  isMobile,
  isOpen,
  onClose,
  activeStore,
  setActiveStore,
  userEmail,
  onSignOut,
}) => {
  const [stores, setStores] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const colors = getColors();

  const fetchStores = async () => {
    try {
      const r = await authFetch(`${API_BASE_URL}/auth/stores`);
      if (!r.ok) return;
      const data = await r.json();
      const nextStores = data.stores || [];
      setStores(nextStores);

      const active =
        nextStores.find((s) => s.is_active) || nextStores[0] || null;
      if (!active) {
        setActiveStore(null);
        if (page !== "connect") {
          setPage("connect");
        }
        return;
      }
      if (!activeStore || activeStore.shop_key !== active.shop_key) {
        setActiveStore(active);
      }
    } catch {}
  };

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchStore = async (shop_key) => {
    try {
      const r = await authFetch(
        `${API_BASE_URL}/auth/active-store/${shop_key}`,
        {
          method: "POST",
        },
      );
      if (!r.ok) return;

      let nextActive = null;
      setStores((prev) =>
        prev.map((s) => {
          const next = { ...s, is_active: s.shop_key === shop_key };
          if (next.is_active) nextActive = next;
          return next;
        }),
      );

      if (nextActive) {
        setActiveStore(nextActive);
      }

      api.clearCache();

      setDropdownOpen(false);
      window.dispatchEvent(new CustomEvent("store-switched"));
    } catch {}
  };

  const disconnectStore = async (shop_key, e) => {
    e.stopPropagation();
    if (!window.confirm(`Disconnect ${shop_key}?`)) return;
    try {
      await authFetch(`${API_BASE_URL}/auth/stores/${shop_key}`, {
        method: "DELETE",
      });
      api.clearCache();
      await fetchStores();
      window.dispatchEvent(new CustomEvent("store-switched"));
    } catch {}
  };

  const navItems = [
    { id: "products", label: "Products", icon: "products" },
    { id: "metafields", label: "Metafields", icon: "tag" },
    { id: "upload", label: "Upload", icon: "upload" },
    { id: "collections", label: "Collections", icon: "collections" },
    { id: "inventory", label: "Inventory", icon: "inventory" },
    { id: "export", label: "Export", icon: "download" },
    { id: "users", label: "User Management", icon: "users" },
    { id: "connect", label: "Connect Store", icon: "tag" },
  ];

  return (
    <>
      <style>{`
        .scrollable-nav::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <aside
        className="app-sidebar"
        style={{
          width: 260,
          background: colors.bgSecondary,
          borderRight: `1px solid ${colors.border}`,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 1400,
          transform:
            isMobile && !isOpen ? "translateX(-100%)" : "translateX(0)",
          transition: "transform 180ms ease",
        }}
      >
        {/* Fixed Header Section */}
        <div
          style={{
            padding: "24px 18px 18px",
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <img
                  src="/icon.png"
                  alt="ShopManager"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 16,
                    fontWeight: 800,
                    color: colors.textPrimary,
                  }}
                >
                  ShopManager
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted }}>
                  Shopify Control
                </div>
              </div>
            </div>
            {isMobile && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close sidebar"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.bgCard,
                  color: colors.textMuted,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <Ico n="x" size={16} />
              </button>
            )}
          </div>
        </div>

        <nav
          style={{
            flex: 1,
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="scrollable-nav"
        >
          {navItems.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => {
                setPage(id);
                onClose?.();
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: page === id ? "var(--info-light)" : "transparent",
                color: page === id ? colors.accent : colors.textMuted,
                fontSize: 14,
                fontWeight: page === id ? 600 : 400,
                transition: "all 0.2s ease",
                textAlign: "left",
                borderLeft: `3px solid ${page === id ? colors.accent : "transparent"}`,
              }}
              onMouseEnter={(e) => {
                if (page !== id)
                  e.currentTarget.style.background = "var(--bg-overlay-light)";
              }}
              onMouseLeave={(e) => {
                if (page !== id)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <Ico
                n={icon}
                size={18}
                color={page === id ? colors.accent : colors.textMuted}
              />
              {label}
            </button>
          ))}
        </nav>

        {/* Fixed Footer Section */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "12px 12px",
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                width: "100%",
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: "transparent",
                color: colors.textMuted,
                cursor: "pointer",
                padding: "10px 12px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-overlay-light)";
                e.currentTarget.style.color = colors.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = colors.textMuted;
              }}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <Ico n={theme === "dark" ? "sun" : "moon"} size={16} />
              {theme === "dark" ? "Light" : "Dark"} Mode
            </button>
          </div>

          <div
            style={{
              padding: "16px 12px",
              borderTop: `1px solid ${colors.border}`,
              position: "relative",
              zIndex: 1000,
            }}
            ref={dropdownRef}
          >
            <button
              onClick={() => stores.length > 0 && setDropdownOpen((v) => !v)}
              style={{
                width: "100%",
                background: colors.bgCard,
                border: `1px solid ${dropdownOpen ? colors.accent : colors.border}`,
                borderRadius: 8,
                padding: "12px 14px",
                cursor: stores.length > 0 ? "pointer" : "default",
                textAlign: "left",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (stores.length > 0) {
                  e.currentTarget.style.background = "var(--bg-elevated)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.bgCard;
              }}
            >
              {(() => {
                // Use local stores state to find active store for immediate display
                const displayStore =
                  stores.find((s) => s.is_active) || activeStore;
                return (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: displayStore ? "#10B981" : colors.textMuted,
                          fontWeight: 600,
                          marginBottom: 3,
                          textTransform: "uppercase",
                        }}
                      >
                        ● {displayStore ? "Connected" : "No Store Connected"}
                      </div>
                      {stores.length > 1 && (
                        <div
                          style={{
                            color: colors.textMuted,
                            fontSize: 10,
                            transition: "transform 0.2s",
                            transform: dropdownOpen
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                          }}
                        >
                          ▼
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: colors.textPrimary,
                        fontWeight: 500,
                      }}
                    >
                      {displayStore?.shop_name || displayStore?.shop_key || "—"}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textMuted }}>
                      {displayStore ? ".myshopify.com" : "Go to Connect Store"}
                    </div>
                  </>
                );
              })()}
            </button>

            {dropdownOpen && stores.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  left: 12,
                  right: 12,
                  background: colors.bgCard,
                  border: `1px solid ${colors.accent}`,
                  borderRadius: 10,
                  overflow: "hidden",
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 1001,
                  maxHeight: "240px",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    padding: "8px 12px 6px",
                    fontSize: 10,
                    color: colors.textMuted,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  Connected Stores ({stores.length})
                </div>

                {stores.map((s) => (
                  <div
                    key={s.shop_key}
                    onClick={() => switchStore(s.shop_key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      cursor: "pointer",
                      background: s.is_active
                        ? "var(--accent-light)"
                        : "transparent",
                      borderLeft: `3px solid ${s.is_active ? colors.accent : "transparent"}`,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!s.is_active)
                        e.currentTarget.style.background =
                          "var(--bg-overlay-light)";
                    }}
                    onMouseLeave={(e) => {
                      if (!s.is_active)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          color: s.is_active
                            ? colors.accent
                            : colors.textPrimary,
                          fontWeight: s.is_active ? 600 : 400,
                        }}
                      >
                        {s.shop_name || s.shop_key}
                        {s.is_active && (
                          <span
                            style={{
                              fontSize: 10,
                              marginLeft: 6,
                              color: "#10B981",
                            }}
                          >
                            ✓ active
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: colors.textMuted }}>
                        {s.shop_key}
                      </div>
                    </div>

                    <button
                      onClick={(e) => disconnectStore(s.shop_key, e)}
                      title="Disconnect"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        fontSize: 14,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--danger-light)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "none")
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <div
                  onClick={() => {
                    setPage("connect");
                    setDropdownOpen(false);
                  }}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    borderTop: `1px solid ${colors.border}`,
                    fontSize: 13,
                    color: colors.accent,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--accent-light)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  + Connect Another Store
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              padding: "12px",
              borderTop: `1px solid ${colors.border}`,
              background: "transparent",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}
            >
              Signed In
            </div>
            <div
              style={{
                fontSize: 12,
                color: colors.textPrimary,
                marginBottom: 10,
                overflowWrap: "anywhere",
              }}
            >
              {userEmail || "Unknown user"}
            </div>
            <button
              type="button"
              onClick={onSignOut}
              style={{
                width: "100%",
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: "transparent",
                color: colors.textMuted,
                cursor: "pointer",
                padding: "10px 12px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Ico n="logout" size={16} />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
