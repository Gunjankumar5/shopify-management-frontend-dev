import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../api/config";
import { api } from "../api/api";
import { Spin } from "../components/Icons";
import MetafieldsPanel from "../components/MetafieldsPanel";

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
};

const TABS = [
  { id: "products", label: "Products", emoji: "📦" },
  { id: "collections", label: "Collections", emoji: "📂" },
  { id: "variants", label: "Variants", emoji: "🎨" },
];

export default function MetafieldsPage({ toast, activeStore }) {
  const [tab, setTab] = useState("products");
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // ── Fetch resource list when tab changes ─────────────────────────────────
  const fetchResources = useCallback(async () => {
    setLoading(true);
    setResources([]);
    setSelectedResource(null);
    setSelectedVariant(null);
    setSearch("");
    try {
      if (tab === "products" || tab === "variants") {
        const data = await api.get(`/products/all`, { ttlMs: 300000 });
        setResources(data.products || []);
      } else {
        const data = await api.get(`/collections/`, { ttlMs: 300000 });
        setResources(data.custom_collections || []);
      }
    } catch {
      toast?.("Failed to load resources", "error");
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // ── When a product is selected in Variants tab, expose its variants ────────
  useEffect(() => {
    if (tab === "variants" && selectedResource) {
      setVariants(selectedResource.variants || []);
      setSelectedVariant(null);
    }
  }, [selectedResource, tab]);

  const filtered = resources.filter((r) =>
    r.title?.toLowerCase().includes(search.toLowerCase()),
  );

  // What MetafieldsPanel should render
  const panelResource =
    tab === "variants"
      ? "variants"
      : tab === "collections"
        ? "collections"
        : "products";
  const panelId =
    tab === "variants" ? selectedVariant?.id : selectedResource?.id;
  const panelName =
    tab === "variants"
      ? selectedVariant
        ? `${selectedResource?.title} / ${selectedVariant?.title}`
        : null
      : selectedResource?.title;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "inherit",
      }}
    >
      {/* ── Left panel: resource selector ─────────────────────────────────── */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          borderRight: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-secondary)",
        }}
      >
        {/* Page title */}
        <div
          style={{
            padding: "20px 16px 14px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 18,
              fontWeight: 800,
              color: C.text,
            }}
          >
            🏷️ Metafields
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
            View and edit custom data
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: "11px 4px",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${tab === t.id ? C.accent : "transparent"}`,
                color: tab === t.id ? C.accent : C.muted,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all .15s",
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div
          style={{
            padding: "10px 12px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${tab}…`}
            style={{
              width: "100%",
              padding: "7px 11px",
              background: "var(--bg-input)",
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              fontSize: 12,
              color: C.text,
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Resource list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div
              style={{ display: "flex", justifyContent: "center", padding: 24 }}
            >
              <Spin size={18} />
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                color: C.muted,
                fontSize: 12,
              }}
            >
              No {tab} found
            </div>
          ) : (
            filtered.map((resource) => (
              <div
                key={resource.id}
                onClick={() => setSelectedResource(resource)}
                style={{
                  padding: "11px 14px",
                  borderBottom: `1px solid ${C.border}`,
                  cursor: "pointer",
                  background:
                    selectedResource?.id === resource.id
                      ? "var(--accent-light)"
                      : "transparent",
                  borderLeft: `3px solid ${selectedResource?.id === resource.id ? C.accent : "transparent"}`,
                  transition: "all .15s",
                }}
                onMouseEnter={(e) => {
                  if (selectedResource?.id !== resource.id)
                    e.currentTarget.style.background =
                      "var(--panel-overlay-minimal)";
                }}
                onMouseLeave={(e) => {
                  if (selectedResource?.id !== resource.id)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: C.text,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {resource.title}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.disabled,
                    marginTop: 1,
                    fontFamily: "monospace",
                  }}
                >
                  {resource.id}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Variant sub-selector (only in Variants tab) */}
        {tab === "variants" && selectedResource && variants.length > 0 && (
          <div
            style={{
              borderTop: `1px solid ${C.border}`,
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                padding: "8px 14px 4px",
                fontSize: 10,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: ".06em",
              }}
            >
              Select variant
            </div>
            {variants.map((v) => (
              <div
                key={v.id}
                onClick={() => setSelectedVariant(v)}
                style={{
                  padding: "9px 14px",
                  borderBottom: `1px solid ${C.border}`,
                  cursor: "pointer",
                  background:
                    selectedVariant?.id === v.id
                      ? "var(--accent-light)"
                      : "transparent",
                  borderLeft: `3px solid ${selectedVariant?.id === v.id ? C.accent : "transparent"}`,
                  transition: "all .15s",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 500, color: C.text }}>
                  {v.title}
                </div>
                {v.sku && (
                  <div
                    style={{
                      fontSize: 10,
                      color: C.disabled,
                      fontFamily: "monospace",
                    }}
                  >
                    SKU: {v.sku}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right panel: MetafieldsPanel ────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 28,
          background: "var(--bg-primary)",
        }}
      >
        {panelId ? (
          <MetafieldsPanel
            resource={panelResource}
            resourceId={panelId}
            resourceName={panelName}
            toast={toast}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: C.muted,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.4 }}>
              🏷️
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: C.text,
                marginBottom: 6,
              }}
            >
              {tab === "variants" && selectedResource
                ? "Now select a variant"
                : `Select a ${tab === "collections" ? "collection" : tab === "variants" ? "product" : "product"}`}
            </div>
            <div style={{ fontSize: 13 }}>
              to view and manage its metafields
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
