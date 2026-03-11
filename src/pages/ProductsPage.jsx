import { useState, useEffect, useCallback } from "react";
import { api } from "../api/api";
import { Ico, Spin } from "../components/Icons";
import { Badge } from "../components/UI";
import { EditModal, PriceModal } from "../components/Modals";
import ProductCard from "../components/ProductCard";

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

  const filtered = products.filter(
    (p) =>
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.vendor?.toLowerCase().includes(search.toLowerCase()),
  );
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
      style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}
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

      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 32,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.5px",
          }}
        >
          Products
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 15 }}>
          Manage your Shopify product catalog
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 16,
          marginBottom: 24,
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
              borderRadius: 18,
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `${s.color}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ico n={s.icon} size={20} color={s.color} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: s.color,
                  fontFamily: "'Syne', sans-serif",
                  lineHeight: 1.2,
                }}
              >
                {loading ? "—" : s.value}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
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
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <div
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <Ico n="search" size={16} color="var(--text-muted)" />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="field-input"
            style={{ padding: "10px 14px 10px 38px", borderRadius: 14 }}
          />
        </div>
        <select
          value={statusF}
          onChange={(e) => setStatusF(e.target.value)}
          className="field-input"
          style={{
            padding: "10px 14px",
            borderRadius: 14,
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
            borderRadius: 12,
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
                padding: "8px 10px",
                borderRadius: 8,
                background: view === v.id ? "var(--accent)" : "transparent",
                border: "none",
                cursor: "pointer",
                color: view === v.id ? "#fff" : "var(--text-muted)",
                transition: "var(--transition)",
              }}
              aria-label={`${v.id} view`}
            >
              <Ico n={v.icon} size={16} />
            </button>
          ))}
        </div>
        <button
          onClick={syncShopify}
          disabled={loading}
          className="btn btn-primary"
          style={{ padding: "10px 18px" }}
        >
          🔄 Sync Shopify
        </button>
        <button
          onClick={() => setEditM(true)}
          className="btn btn-primary"
          style={{ padding: "10px 18px" }}
        >
          <Ico n="plus" size={16} /> Add Product
        </button>
      </div>

      {/* Bulk Actions */}
      {sel.size > 0 && (
        <div
          className="fade-up"
          style={{
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: 14,
            padding: "12px 18px",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{ fontSize: 14, color: "var(--accent)", fontWeight: 600 }}
          >
            {sel.size} selected
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setPriceM(true)}
            className="btn btn-secondary"
            style={{ padding: "8px 14px" }}
          >
            <Ico n="percent" size={14} color="var(--accent)" /> Adjust Prices
          </button>
          <button
            onClick={handleRemoveDuplicates}
            className="btn btn-secondary"
            style={{ padding: "8px 14px" }}
          >
            <Ico n="percent" size={14} color="var(--warning)" /> Remove
            Duplicates
          </button>
          <button
            onClick={handleBulkDel}
            className="btn btn-danger"
            style={{ padding: "8px 14px" }}
          >
            <Ico n="trash" size={14} /> Delete
          </button>
          <button
            onClick={() => setSel(new Set())}
            className="btn btn-secondary"
            style={{ padding: "8px 10px" }}
            aria-label="Clear selection"
          >
            <Ico n="x" size={14} />
          </button>
        </div>
      )}

      {/* Select All */}
      {filtered.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
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
              fontSize: 14,
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
              view === "grid" ? "repeat(auto-fill,minmax(220px,1fr))" : "1fr",
            gap: 16,
          }}
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: view === "grid" ? 320 : 72 }}
            />
          ))}
        </div>
      ) : view === "grid" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
            gap: 16,
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
                padding: 60,
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
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "14px 16px", width: 40 }}></th>
                {["Product", "Vendor", "Price", "Stock", "Status", ""].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "14px 16px",
                        textAlign: "left",
                        fontSize: 12,
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
                      (e.currentTarget.style.background = "#17172a")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <input
                        type="checkbox"
                        className="chk"
                        checked={sel.has(p.id)}
                        onChange={() => toggleSel(p.id)}
                        aria-label={`Select ${p.title}`}
                      />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            background: "#0d0d14",
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
                            <Ico n="image" size={18} color="#2a2a3d" />
                          )}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            {p.title}
                          </div>
                          {p.product_type && (
                            <div
                              style={{
                                fontSize: 12,
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
                        padding: "12px 16px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {p.vendor || "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontWeight: 600,
                        color: "var(--accent)",
                      }}
                    >
                      {price ? `$${price}` : "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: inv > 0 ? "var(--success)" : "var(--danger)",
                      }}
                    >
                      {inv} units
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge status={p.status} />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => setEditM(p)}
                          className="btn btn-secondary"
                          style={{ padding: "8px 10px" }}
                          aria-label="Edit"
                        >
                          <Ico n="edit" size={14} color="var(--accent)" />
                        </button>
                        <button
                          onClick={() => handleDel(p.id)}
                          disabled={deleting === p.id}
                          className="btn btn-secondary"
                          style={{
                            padding: "8px 10px",
                            color: "var(--danger)",
                          }}
                          aria-label="Delete"
                        >
                          {deleting === p.id ? (
                            <Spin size={14} />
                          ) : (
                            <Ico n="trash" size={14} color="var(--danger)" />
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
                      padding: 60,
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

export default ProductsPage;
