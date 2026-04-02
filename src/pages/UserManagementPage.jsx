import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { API_BASE_URL } from "../api/config";


// ── Permission definitions ────────────────────────────────────────────────────
const ALL_PERMISSIONS = [
  { key: "manage_products",    label: "Manage Products",    icon: "package",   desc: "Create & edit products" },
  { key: "delete_products",    label: "Delete Products",    icon: "trash",     desc: "Permanently delete products" },
  { key: "manage_collections", label: "Collections",        icon: "tag",       desc: "Create & edit collections" },
  { key: "manage_inventory",   label: "Inventory",          icon: "layers",    desc: "Update stock levels" },
  { key: "manage_metafields",  label: "Metafields",         icon: "code",      desc: "Edit metafield values" },
  { key: "manage_upload",      label: "Bulk Upload",        icon: "upload",    desc: "Upload CSV/Excel files" },
  { key: "manage_export",      label: "Export",             icon: "download",  desc: "Export product data" },
  { key: "use_ai",             label: "AI Features",        icon: "zap",       desc: "Use AI content generation" },
  { key: "manage_stores",      label: "Manage Stores",      icon: "link",      desc: "Connect/disconnect stores" },
  { key: "manage_users",       label: "Manage Users",       icon: "users",     desc: "Create & manage team members" },
  { key: "view_analytics",     label: "Analytics",          icon: "bar-chart", desc: "View analytics dashboard" },
];

const ROLES = {
  admin:   { label: "Admin",   color: "#ef4444", bg: "rgba(239,68,68,0.12)",   desc: "Full access to everything" },
  manager: { label: "Manager", color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  desc: "All except user management" },
  junior:  { label: "Junior",  color: "#6366f1", bg: "rgba(99,102,241,0.12)",  desc: "Only granted permissions" },
};

// ── Auth helper ───────────────────────────────────────────────────────────────
async function authHeaders() {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  console.log("[authHeaders] Token:", token ? `${token.substring(0,20)}...` : "NO TOKEN");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeaders()),
    ...(options.headers || {}),
  };
  console.log("[apiFetch] Headers:", { Authorization: headers.Authorization ? "Bearer..." : "MISSING" });
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.detail || json.error || `HTTP ${res.status}`);
  return json;
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function UserManagementPage({ toast }) {
  const { user, role, can, signOut, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const fetchedRef = useRef(false);

  const c = {
    bg: "var(--bg-primary)",
    card: "var(--bg-card)",
    border: "var(--border-subtle)",
    text: "var(--text-primary)",
    muted: "var(--text-muted)",
    accent: "var(--accent)",
    accentLight: "var(--accent-light)",
    danger: "var(--danger-text)",
    dangerBg: "var(--danger-light)",
    dangerBorder: "var(--danger-border)",
    success: "var(--success-text)",
    successBg: "var(--success-light)",
  };

  // Fetch users list
  useEffect(() => {
    // Wait for auth to finish loading before attempting to fetch
    if (authLoading) return;
    
    // Guard to prevent duplicate fetches (React Strict Mode causes unmount/remount in dev)
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");
        console.log("[UserManagementPage] Starting to fetch users...");
        console.log("[UserManagementPage] Auth loaded - role:", role);
        console.log("[UserManagementPage] can('manage_users'):", can("manage_users"));
        
        if (!can("manage_users")) {
          console.log("[UserManagementPage] User does not have manage_users permission");
          setError("You don't have permission to manage users");
          setLoading(false);
          return;
        }

        const data = await apiFetch("/users/");
        console.log("[UserManagementPage] Users fetched:", data);
        
        setUsers(data.users || []);
        if (data.users?.length > 0) {
          setSelectedUser(data.users[0]);
        }
      } catch (err) {
        console.error("[UserManagementPage] Fetch error:", err);
        setError(err.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [authLoading, can]);

  // Update user role
  const handleRoleChange = async (userId, newRole) => {
    if (!selectedUser || !can("manage_users")) return;
    try {
      setUpdating(true);
      setError("");
      await apiFetch(`/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      // Refresh user
      setSelectedUser((prev) => ({ ...prev, role: newRole }));
      // Refresh list
      const data = await apiFetch("/users/");
      setUsers(data.users || []);
      toast?.("Role updated successfully", "success");
    } catch (err) {
      setError(err.message);
      toast?.(err.message, "error");
    } finally {
      setUpdating(false);
    }
  };

  // Update user permission
  const handlePermissionToggle = async (userId, permission, value) => {
    if (!selectedUser || !can("manage_users")) return;
    try {
      setUpdating(true);
      setError("");
      await apiFetch(`/users/${userId}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissions: { [permission]: value } }),
      });
      // Update selected user
      setSelectedUser((prev) => ({
        ...prev,
        permissions: { ...prev.permissions, [permission]: value },
      }));
      // Refresh list
      const data = await apiFetch("/users/");
      setUsers(data.users || []);
      toast?.(
        `Permission ${value ? "granted" : "revoked"}`,
        "success"
      );
    } catch (err) {
      setError(err.message);
      toast?.(err.message, "error");
    } finally {
      setUpdating(false);
    }
  };

  // Toggle all permissions
  const handleToggleAllPermissions = async (userId, enable) => {
    if (!selectedUser || !can("manage_users")) return;
    try {
      setUpdating(true);
      setError("");
      const permissions = {};
      ALL_PERMISSIONS.forEach((p) => {
        permissions[p.key] = enable;
      });
      await apiFetch(`/users/${userId}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissions }),
      });
      // Update selected user
      setSelectedUser((prev) => ({
        ...prev,
        permissions,
      }));
      // Refresh list
      const data = await apiFetch("/users/");
      setUsers(data.users || []);
      toast?.(
        enable ? "All permissions granted" : "All permissions revoked",
        "success"
      );
    } catch (err) {
      setError(err.message);
      toast?.(err.message, "error");
    } finally {
      setUpdating(false);
    }
  };

  // Toggle user active status
  const handleToggleActive = async (userId, isActive) => {
    if (!selectedUser || !can("manage_users")) return;
    try {
      setUpdating(true);
      setError("");
      // Deactivate or reactivate using appropriate endpoint
      const endpoint = isActive ? `/users/${userId}` : `/users/${userId}/reactivate`;
      const method = isActive ? "DELETE" : "POST";
      await apiFetch(endpoint, { method, body: "" });
      // Update selected user
      setSelectedUser((prev) => ({
        ...prev,
        is_active: !isActive,
      }));
      // Refresh list
      const data = await apiFetch("/users/");
      setUsers(data.users || []);
      toast?.(
        (isActive ? "User deactivated" : "User activated"),
        "success"
      );
    } catch (err) {
      setError(err.message);
      toast?.(err.message, "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: c.bg, display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          {error ? (
            <>
              <p style={{ color: c.danger, fontWeight: 600, marginBottom: "12px" }}>❌ {error}</p>
              <p style={{ color: c.muted, fontSize: "14px" }}>Check the console for more details</p>
            </>
          ) : (
            <p style={{ color: c.muted }}>Loading...</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: c.bg, display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: c.danger, fontWeight: 600, marginBottom: "12px" }}>❌ {error}</p>
          <p style={{ color: c.muted, fontSize: "14px" }}>Check the console for more details</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: c.bg }}>
      {/* ── LEFT PANEL (User List) ── */}
      <div style={{ width: "300px", borderRight: `1px solid ${c.border}`, overflow: "auto" }}>
        <div style={{ padding: "20px", borderBottom: `1px solid ${c.border}` }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: c.text, margin: "0 0 12px 0" }}>
            Team Members ({users.length})
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedUser(u)}
              style={{
                padding: "12px 16px",
                borderBottom: `1px solid ${c.border}`,
                background: selectedUser?.id === u.id ? c.accentLight : "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                if (selectedUser?.id !== u.id) {
                  e.currentTarget.style.background = `${c.accentLight}40`;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedUser?.id !== u.id) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 600, color: c.text }}>
                {u.full_name || u.email}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: c.muted,
                  marginTop: "4px",
                }}
              >
                {u.email}
              </div>
              <div style={{ fontSize: "10px", color: c.muted, marginTop: "4px" }}>
                {u.is_active ? "✓ Active" : "✗ Inactive"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL (User Details) ── */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {selectedUser ? (
          <>
            {/* Header */}
            <div style={{ padding: "20px", borderBottom: `1px solid ${c.border}`, background: c.card }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" }}>
                <div>
                  <h1 style={{ fontSize: "20px", fontWeight: 700, color: c.text, margin: 0, marginBottom: "4px" }}>
                    {selectedUser.full_name}
                  </h1>
                  <div style={{ fontSize: "13px", color: c.muted }}>
                    {selectedUser.email}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleToggleActive(selectedUser.id, selectedUser.is_active)}
                    disabled={updating}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      background: selectedUser.is_active ? "transparent" : c.dangerBg,
                      border: `1px solid ${selectedUser.is_active ? c.border : c.dangerBorder}`,
                      color: selectedUser.is_active ? c.muted : c.danger,
                      cursor: updating ? "not-allowed" : "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                      opacity: updating ? 0.6 : 1,
                      transition: "all 0.2s",
                    }}
                  >
                    {selectedUser.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  padding: "10px 12px",
                  background: c.dangerBg,
                  border: `1px solid ${c.dangerBorder}`,
                  borderRadius: "6px",
                  color: c.danger,
                  fontSize: "12px",
                }}>
                  {error}
                </div>
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: "24px", overflow: "auto" }}>
              {/* Role Section */}
              <div style={{ marginBottom: "32px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: 700, color: c.text, margin: "0 0 16px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Role
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {Object.entries(ROLES).map(([roleKey, roleInfo]) => (
                    <label
                      key={roleKey}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px",
                        background: selectedUser.role === roleKey ? roleInfo.bg : c.card,
                        border: `1px solid ${c.border}`,
                        borderRadius: "8px",
                        cursor: updating ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                        opacity: updating ? 0.6 : 1,
                      }}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={roleKey}
                        checked={selectedUser.role === roleKey}
                        onChange={() => handleRoleChange(selectedUser.id, roleKey)}
                        disabled={updating}
                        style={{ marginRight: "12px", cursor: "pointer" }}
                      />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: roleInfo.color }}>
                          {roleInfo.label}
                        </div>
                        <div style={{ fontSize: "12px", color: c.muted, marginTop: "2px" }}>
                          {roleInfo.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Permissions Section */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "14px", fontWeight: 700, color: c.text, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Permissions
                  </h2>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleToggleAllPermissions(selectedUser.id, true)}
                      disabled={updating}
                      style={{
                        padding: "6px 12px",
                        background: "transparent",
                        border: `1px solid ${c.border}`,
                        color: c.text,
                        borderRadius: "6px",
                        cursor: updating ? "not-allowed" : "pointer",
                        fontSize: "11px",
                        fontWeight: 600,
                        opacity: updating ? 0.6 : 1,
                        transition: "all 0.2s",
                      }}
                    >
                      Grant all
                    </button>
                    <button
                      onClick={() => handleToggleAllPermissions(selectedUser.id, false)}
                      disabled={updating}
                      style={{
                        padding: "6px 12px",
                        background: "transparent",
                        border: `1px solid ${c.border}`,
                        color: c.text,
                        borderRadius: "6px",
                        cursor: updating ? "not-allowed" : "pointer",
                        fontSize: "11px",
                        fontWeight: 600,
                        opacity: updating ? 0.6 : 1,
                        transition: "all 0.2s",
                      }}
                    >
                      Revoke all
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                  {ALL_PERMISSIONS.map((perm) => (
                    <label
                      key={perm.key}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        padding: "12px",
                        background: c.card,
                        border: `1px solid ${c.border}`,
                        borderRadius: "8px",
                        cursor: updating ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                        opacity: updating ? 0.6 : 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUser.permissions?.[perm.key] || false}
                        onChange={(e) =>
                          handlePermissionToggle(selectedUser.id, perm.key, e.target.checked)
                        }
                        disabled={updating}
                        style={{ marginRight: "10px", marginTop: "2px", cursor: "pointer" }}
                      />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: c.text }}>
                          {perm.label}
                        </div>
                        <div style={{ fontSize: "11px", color: c.muted, marginTop: "2px" }}>
                          {perm.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "grid", placeItems: "center", color: c.muted }}>
            Select a user to manage permissions
          </div>
        )}
      </div>
    </div>
  );
}
