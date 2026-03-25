import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../api/api";
import { Ico, Spin } from "../components/Icons";
import { Badge } from "../components/UI";
import { PriceModal } from "../components/Modals";
import ProductCard from "../components/ProductCard";
import AddProductPage from "./Addproductpage";
import { FixedSizeGrid, FixedSizeList } from "react-window";

const ProductsPage = ({ toast }) => {
  const CLIENT_PAGE_SIZE = 50;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [sel, setSel] = useState(new Set());
  const [priceM, setPriceM] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewportW, setViewportW] = useState(() => window.innerWidth);
  const [viewportH, setViewportH] = useState(() => window.innerHeight);

  // null = list view, true = new product form, object = edit product form
  const [formMode, setFormMode] = useState(null);

  // ── FIX: removed toast from deps — toast is a new ref every render ──────────
  const loadAllProducts = useCallback(
    async ({ force = false } = {}) => {
      setLoading(true);
      setIsFetchingAll(true);
      setProducts([]);
      setLoadedCount(0);
      setCurrentPage(1);

      try {
        const all = [];
        let cursor = null;
        let hasNext = true;
        let pagesFetched = 0;
        const maxPages = 500;

        while (hasNext && pagesFetched < maxPages) {
          const params = new URLSearchParams({ limit: "250" });
          if (statusF && statusF !== "all") params.set("status", statusF);
          if (searchQuery) params.set("search", searchQuery);
          if (cursor) params.set("page_info", cursor);

          const d = await api.get(`/products?${params.toString()}`, {
            force: force || Boolean(cursor),
          });

          const batch = d.products || [];
          all.push(...batch);
          setLoadedCount(all.length);

          cursor = d.next_page_info || null;
          hasNext = Boolean(d.has_next_page && cursor);
          pagesFetched += 1;
        }

        setProducts(all);
      } catch (error) {
        toast(`Failed to load products: ${error.message}`, "error");
      } finally {
        setIsFetchingAll(false);
        setLoading(false);
      }
    },
    // ── FIX: removed toast and loadAllProducts from deps ──────────────────────
    [statusF, searchQuery],
  );

  useEffect(() => {
    const onResize = () => {
      setViewportW(window.innerWidth);
      setViewportH(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearchQuery(search.trim());
    }, 300);
    return () => window.clearTimeout(id);
  }, [search]);

  // ── FIX: removed loadAllProducts from deps — it was causing infinite loop ───
  useEffect(() => {
    setSel(new Set());
    loadAllProducts({ force: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusF, searchQuery]);

  const filtered = products;
  const productCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(productCount / CLIENT_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageStart = (safeCurrentPage - 1) * CLIENT_PAGE_SIZE;
  const pagedProducts = useMemo(
    () => filtered.slice(pageStart, pageStart + CLIENT_PAGE_SIZE),
    [filtered, pageStart],
  );

  const gridColumns = useMemo(() => {
    if (viewportW < 640) return 2;
    if (viewportW < 900) return 3;
    if (viewportW < 1200) return 4;
    return 5;
  }, [viewportW]);

  const gridGap = 12;
  const gridContainerWidth = Math.max(320, viewportW - 360);
  const gridItemWidth = Math.max(180, Math.floor((gridContainerWidth - gridGap * (gridColumns + 1)) / gridColumns));
  const gridItemHeight = 395;
  const gridRows = Math.ceil(pagedProducts.length / gridColumns);
  const virtualHeight = Math.max(320, Math.min(760, viewportH - 360));

  // Keep hook order stable by placing conditional return after hooks.
  if (formMode !== null) {
    return (
      <AddProductPage
        toast={toast}
        editProduct={formMode === true ? null : formMode}
        onBack={() => {
          setFormMode(null);
          loadAllProducts({ force: true });
        }}
      />
    );
  }

  const toggleSel = (id) =>
    setSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selAll = () =>
    setSel(
      sel.size === pagedProducts.length
        ? new Set()
        : new Set(pagedProducts.map((p) => p.id)),
    );

  const handleDel = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    setDeleting(id);
    try {
      await api.delete(`/products/${id}`);
      toast("Deleted");
      loadAllProducts({ force: true });
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
      loadAllProducts({ force: true });
    } catch {
      toast("Failed to remove duplicates", "error");
    }
  };

  const handleBulkDel = async () => {
    if (!sel.size || !window.confirm(`Delete ${sel.size} products?`)) return;
    const results = await Promise.allSettled(
      Array.from(sel).map((id) => api.delete(`/products/${id}`)),
    );
    const ok = results.filter((result) => result.status === "fulfilled").length;
    const fail = results.length - ok;
    toast(`Deleted ${ok}${fail ? `, ${fail} failed` : ""}`);
    setSel(new Set());
    loadAllProducts({ force: true });
  };

  const handlePriceAdj = async ({ mode, value, dir }) => {
    const prods = products.filter((p) => sel.has(p.id));
    const priceUpdateRequests = prods
      .map((p) => {
        const v = p.variants?.[0];
        if (!v?.price) return null;
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
        return api.put(`/products/${p.id}`, {
          title: p.title,
          variants: [{ ...v, price: np }],
        });
      })
      .filter(Boolean);

    const results = await Promise.allSettled(priceUpdateRequests);
    const ok = results.filter((result) => result.status === "fulfilled").length;
    const fail = results.length - ok;
    toast(`Updated ${ok} prices${fail ? `, ${fail} failed` : ""}`);
    setPriceM(false);
    setSel(new Set());
    loadAllProducts({ force: true });
  };

  const stats = {
    total: products.length,
    active: products.filter((p) => p.status === "active").length,
    draft: products.filter((p) => p.status === "draft").length,
  };

  return (
    <div
      className="fade-up container max-w-7xl mx-auto px-4 py-8"
      style={{ position: "relative", minHeight: "calc(100vh - 120px)" }}
    >
      {priceM && (
        <PriceModal
          count={sel.size}
          onApply={handlePriceAdj}
          onClose={() => setPriceM(false)}
        />
      )}

      {/* Header */}
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
          <Ico n="products" size="lg" /> Products
        </h1>
        <p className="text-muted text-xs mt-0.5">
          Manage your Shopify product catalog
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        {[
          { label: "Total",  value: stats.total,  color: "accent",   icon: "products" },
          { label: "Active", value: stats.active, color: "success",  icon: "check"    },
          { label: "Drafts", value: stats.draft,  color: "warning",  icon: "edit"     },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-2 p-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: `var(--${s.color}-light)`,
                color: `var(--${s.color})`,
              }}
            >
              <Ico n={s.icon} size={16} color={`var(--${s.color})`} />
            </div>
            <div>
              <div className={`font-display text-lg font-bold text-${s.color}`}>
                {loading ? "—" : s.value}
              </div>
              <div className="text-muted text-xs">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div
        className="flex flex-row flex-wrap items-center gap-2 mb-6 p-2 rounded-xl"
        style={{
          background: "rgba(26,26,30,0.5)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(58,58,68,0.2)",
        }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] group">
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <Ico n="search" size={14} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg transition-all outline-none placeholder:text-muted/60"
            style={{
              background: "var(--bg-input)",
              border: "1px solid transparent",
              color: "var(--text-primary)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusF}
            onChange={(e) => setStatusF(e.target.value)}
            className="appearance-none cursor-pointer px-4 py-2 pr-10 text-sm rounded-lg transition-all outline-none"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-strong)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-strong)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {[
              { v: "all",      l: "All Status" },
              { v: "active",   l: "Active"     },
              { v: "draft",    l: "Draft"      },
              { v: "archived", l: "Archived"   },
            ].map((o) => (
              <option key={o.v} value={o.v}>{o.l}</option>
            ))}
          </select>
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          >
            <Ico n="chevron-down" size={12} />
          </div>
        </div>

        {/* View toggle */}
        <div
          className="flex p-1 rounded-lg"
          style={{
            background: "rgba(58,58,68,0.2)",
            border: "1px solid rgba(58,58,68,0.3)",
          }}
        >
          {[
            { id: "grid", icon: "grid" },
            { id: "list", icon: "list" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className="flex items-center justify-center w-8 h-8 rounded-md transition-all"
              style={{
                background: view === v.id ? "var(--bg-card)" : "transparent",
                boxShadow: view === v.id ? "var(--shadow-sm)" : "none",
                color: view === v.id ? "var(--text-primary)" : "var(--text-muted)",
              }}
              aria-label={`${v.id} view`}
            >
              <Ico n={v.icon} size={14} />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => loadAllProducts({ force: true })}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-strong)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-card)")}
          >
            {loading ? <Spin size={14} /> : <Ico n="sync" size={14} />}
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setFormMode(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all active:scale-95"
            style={{
              background: "var(--accent-gradient)",
              color: "white",
              boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
            }}
          >
            <Ico n="plus" size={14} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {sel.size > 0 && (
        <div className="bg-accent-light border border-accent/25 rounded-lg p-2 mb-3 flex flex-wrap items-center gap-2 fade-up">
          <span className="text-xs font-semibold text-accent">{sel.size} selected</span>
          <div className="flex-1" />
          <button onClick={() => setPriceM(true)} className="btn btn-secondary btn-sm">
            <Ico n="percent" size="xs" color="var(--accent)" /> Adjust Prices
          </button>
          <button onClick={handleRemoveDuplicates} className="btn btn-secondary btn-sm">
            <Ico n="percent" size="xs" color="var(--warning)" /> Remove Duplicates
          </button>
          <button onClick={handleBulkDel} className="btn btn-danger btn-sm">
            <Ico n="trash" size="xs" /> Delete
          </button>
          <button
            onClick={() => setSel(new Set())}
            className="btn btn-secondary btn-sm"
            aria-label="Clear selection"
          >
            <Ico n="x" size="xs" />
          </button>
        </div>
      )}

      {/* Select All */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2">
          <input
            type="checkbox"
            className="chk"
            checked={sel.size === pagedProducts.length && pagedProducts.length > 0}
            onChange={selAll}
            id="selectAll"
          />
          <label htmlFor="selectAll" className="text-xs text-secondary cursor-pointer">
            Select all {pagedProducts.length} on this page
          </label>
        </div>
      )}

      {/* Product Grid/List */}
      {loading ? (
        <div className={view === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" : "space-y-2"}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: view === "grid" ? 280 : 60 }} />
          ))}
        </div>
      ) : view === "grid" ? (
        <div style={{ width: "100%", overflow: "hidden" }}>
          {pagedProducts.length > 0 ? (
            <FixedSizeGrid
              columnCount={gridColumns}
              columnWidth={gridItemWidth + gridGap}
              height={virtualHeight}
              rowCount={gridRows}
              rowHeight={gridItemHeight + gridGap}
              width={Math.min(gridContainerWidth + gridGap, viewportW - 40)}
            >
              {({ columnIndex, rowIndex, style }) => {
                const index = rowIndex * gridColumns + columnIndex;
                const p = pagedProducts[index];
                if (!p) return null;
                return (
                  <div
                    style={{
                      ...style,
                      left: style.left + gridGap,
                      top: style.top + gridGap,
                      width: gridItemWidth,
                      height: gridItemHeight,
                    }}
                  >
                    <ProductCard
                      p={p}
                      sel={sel.has(p.id)}
                      onSel={toggleSel}
                      onEdit={() => setFormMode(p)}
                      onDel={handleDel}
                    />
                  </div>
                );
              }}
            </FixedSizeGrid>
          ) : (
            <p className="text-muted text-center py-8">No products found</p>
          )}
        </div>
      ) : (
        <div className="card overflow-x-auto overflow-y-hidden" style={{ height: virtualHeight + 8 }}>
          {pagedProducts.length > 0 ? (
            <FixedSizeList
              height={virtualHeight}
              itemCount={pagedProducts.length}
              itemSize={74}
              width={Math.max(860, Math.min(gridContainerWidth, 1400))}
            >
              {({ index, style }) => {
                const p = pagedProducts[index];
                const img = p.images?.[0]?.src;
                const price = p.variants?.[0]?.price;
                const inv = p.variants?.reduce((s, v) => s + (v.inventory_quantity || 0), 0);
                return (
                  <div
                    style={{
                      ...style,
                      display: "grid",
                      gridTemplateColumns: "34px minmax(220px,1.6fr) minmax(120px,1fr) 90px 70px 90px 92px",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderBottom: "1px solid var(--border-strong)",
                    }}
                  >
                    <input
                      type="checkbox"
                      className="chk"
                      checked={sel.has(p.id)}
                      onChange={() => toggleSel(p.id)}
                      aria-label={`Select ${p.title}`}
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded bg-secondary overflow-hidden flex items-center justify-center flex-shrink-0">
                        {img ? (
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Ico n="image" size={12} className="text-muted" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-primary text-xs truncate">{p.title}</div>
                        {p.product_type && (
                          <div className="text-[0.6rem] text-muted truncate">{p.product_type}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-secondary text-xs truncate">{p.vendor || "—"}</div>
                    <div className="font-semibold text-accent text-xs">{price ? `$${price}` : "—"}</div>
                    <div className={`text-xs ${inv > 0 ? "text-success" : "text-danger"}`}>{inv}</div>
                    <div><Badge status={p.status} /></div>
                    <div className="flex gap-1 justify-end" style={{ minWidth: 92 }}>
                      <button
                        onClick={() => setFormMode(p)}
                        className="btn btn-secondary"
                        style={{ padding: "4px", fontSize: "0" }}
                        aria-label="Edit"
                      >
                        <Ico n="edit" size={12} color="var(--accent)" />
                      </button>
                      <button
                        onClick={() => handleDel(p.id)}
                        disabled={deleting === p.id}
                        className="btn btn-secondary"
                        style={{ padding: "4px", fontSize: "0" }}
                        aria-label="Delete"
                      >
                        {deleting === p.id ? <Spin size={12} /> : <Ico n="trash" size={12} color="var(--danger)" />}
                      </button>
                    </div>
                  </div>
                );
              }}
            </FixedSizeList>
          ) : (
            <div className="p-6 text-center text-muted">No products</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && (
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
          <div className="text-xs text-muted">
            {isFetchingAll
              ? `Loading all products... ${loadedCount} loaded`
              : `Showing ${pagedProducts.length} of ${productCount} products`}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
            >
              Prev
            </button>
            <span className="text-xs text-secondary">
              Page {safeCurrentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
