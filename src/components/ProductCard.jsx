import { Ico } from "./Icons";
import { Badge } from "./UI";

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
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 2 }}>
        <input
          type="checkbox"
          className="chk"
          checked={sel}
          onChange={() => onSel(p.id)}
          aria-label={`Select ${p.title}`}
        />
      </div>
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}>
        <Badge status={p.status} />
      </div>
      <div
        style={{
          height: 190,
          background: "#0d0d14",
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
              color: "#2a2a3d",
            }}
          >
            <Ico n="image" size={36} color="#2a2a3d" />
            <span style={{ fontSize: 11 }}>No image</span>
          </div>
        )}
      </div>
      <div style={{ padding: 16 }}>
        <h3
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 16,
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
              fontSize: 12,
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
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)" }}
            >
              {price ? `$${price}` : "—"}
            </span>
            {cmp && (
              <span
                style={{
                  fontSize: 12,
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
              fontSize: 11,
              color: inv > 0 ? "var(--success)" : "var(--danger)",
              background:
                inv > 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              padding: "3px 8px",
              borderRadius: 20,
              fontWeight: 500,
            }}
          >
            {inv} in stock
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onEdit(p)}
            className="btn btn-secondary"
            style={{ flex: 1, padding: "8px", fontSize: 13 }}
            aria-label="Edit"
          >
            <Ico n="edit" size={13} color="var(--accent)" /> Edit
          </button>
          <button
            onClick={() => onDel(p.id)}
            className="btn btn-danger"
            style={{ padding: "8px 10px" }}
            aria-label="Delete"
          >
            <Ico n="trash" size={13} color="var(--danger)" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
