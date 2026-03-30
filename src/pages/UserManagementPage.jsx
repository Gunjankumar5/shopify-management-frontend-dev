import { useState, useEffect } from "react";
import { Ico, Spin } from "../components/Icons";
import { api } from "../api/api";
import { API_BASE_URL } from "../api/config";
import { useTheme } from "../context/ThemeContext";

const getColors = () => ({
  bgPrimary: "var(--bg-primary)",
  bgSecondary: "var(--bg-secondary)",
  bgCard: "var(--bg-card)",
  border: "var(--border-strong)",
  borderSubtle: "var(--border-subtle)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  textMuted: "var(--text-muted)",
  accent: "var(--accent)",
  accentLight: "var(--accent-light)",
  accentOverlay: "var(--accent-overlay)",
  dangerText: "var(--danger-text)",
  dangerBorder: "var(--danger-border)",
  dangerLight: "var(--danger-light)",
  successText: "var(--success-text)",
  successBorder: "var(--success-border)",
  successLight: "var(--success-light)",
  warningText: "var(--warning-text)",
  warningBorder: "var(--warning-border)",
  warningLight: "var(--warning-light)",
});

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin", color: "#ef4444" },
  { value: "manager", label: "Manager", color: "#f59e0b" },
  { value: "junior", label: "Junior User", color: "#3b82f6" },
];

const PERMISSIONS = [
  { key: "manage_products", label: "Manage Products", icon: "products" },
  { key: "manage_collections", label: "Manage Collections", icon: "tag" },
  { key: "manage_inventory", label: "Manage Inventory", icon: "inventory" },
  { key: "manage_metafields", label: "Manage Metafields", icon: "tag" },
  { key: "manage_upload", label: "Manage Upload", icon: "upload" },
  { key: "manage_export", label: "Manage Export", icon: "download" },
  { key: "view_analytics", label: "View Analytics", icon: "chart" },
];

export default function UserManagementPage({ activeStore, userEmail }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentUserPerms, setCurrentUserPerms] = useState(null);
  const colors = getColors();
  const { theme } = useTheme();

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "junior",
    permissions: {},
  });

  useEffect(() => {
    fetchUsers();
    fetchCurrentUserPermissions();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/api/users/`);
      setUsers(data.users || []);
      setError("");
    } catch (err) {
      setError("Error loading users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUserPermissions = async () => {
    try {
      const data = await api.get(`/api/users/me/permissions`);
      setCurrentUserPerms(data);
    } catch {}
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.full_name) {
      setError("Email and name are required");
      return;
    }

    try {
      const permissions =
        formData.role === "junior" ? formData.permissions : {};
      await api.post(`/api/users/create-junior`, {
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        permissions,
      });

      setError("");
      setShowCreateModal(false);
      setFormData({
        email: "",
        full_name: "",
        role: "junior",
        permissions: {},
      });
      await fetchUsers();
    } catch (err) {
      setError("Error creating user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Deactivate this user? This action cannot be undone."))
      return;

    try {
      await api.delete(`/api/users/${userId}`);

      await fetchUsers();
    } catch (err) {
      setError("Error deleting user");
    }
  };

  const togglePermission = (permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission],
      },
    }));
  };

  const canManageUsers =
    currentUserPerms?.permissions?.manage_users ||
    currentUserPerms?.role === "admin";

  return (
    <div
      style={{
        padding: "24px",
        paddingTop: "16px",
        background: colors.bgPrimary,
        minHeight: "100vh",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <Ico n="users" size={32} color={colors.accent} />
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: colors.textPrimary,
              margin: 0,
            }}
          >
            User Management
          </h1>
        </div>
        <p style={{ fontSize: "14px", color: colors.textMuted, margin: "0" }}>
          Manage team members and assign permissions
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: colors.dangerLight,
            border: `1px solid ${colors.dangerBorder}`,
            borderRadius: "8px",
            color: colors.dangerText,
            marginBottom: "16px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Ico n="alert-circle" size={16} color={colors.dangerText} />
          {error}
        </div>
      )}

      {/* Permission Denied Message */}
      {!canManageUsers && (
        <div
          style={{
            padding: "12px 16px",
            background: colors.warningLight,
            border: `1px solid ${colors.warningBorder}`,
            borderRadius: "8px",
            color: colors.warningText,
            marginBottom: "16px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Ico n="alert-circle" size={16} color={colors.warningText} />
          You don't have permission to manage users. Please contact an
          administrator.
        </div>
      )}

      {/* Create User Button */}
      {canManageUsers && (
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            width: "100%",
            padding: "14px 16px",
            background: `linear-gradient(135deg, ${colors.accent}, #a855f7)`,
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "transform 0.2s, box-shadow 0.2s",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 8px 16px rgba(99, 102, 241, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(99, 102, 241, 0.3)";
          }}
        >
          <Ico n="plus" size={16} /> Create Junior User
        </button>
      )}

      {/* Users List */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: colors.textMuted,
          }}
        >
          <Spin size={32} />
          <p style={{ marginTop: "12px" }}>Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div
          style={{
            padding: "48px 32px",
            background: colors.bgCard,
            border: `1px solid ${colors.borderSubtle}`,
            borderRadius: "12px",
            textAlign: "center",
            color: colors.textMuted,
          }}
        >
          <Ico
            n="users"
            size={48}
            color={colors.textMuted}
            style={{ marginBottom: "16px", opacity: 0.6 }}
          />
          <p style={{ fontSize: "16px", marginBottom: "8px" }}>No users yet</p>
          <p style={{ fontSize: "13px", margin: 0 }}>
            Create your first junior user to get started
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {users.map((user) => (
            <UserCard
              key={user.user_id}
              user={user}
              colors={colors}
              onDelete={handleDeleteUser}
              canManage={canManageUsers}
              currentEmail={userEmail}
            />
          ))}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateUser}
          onCancel={() => {
            setShowCreateModal(false);
            setFormData({
              email: "",
              full_name: "",
              role: "junior",
              permissions: {},
            });
          }}
          colors={colors}
          togglePermission={togglePermission}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function UserCard({ user, colors, onDelete, canManage, currentEmail }) {
  const roleOption = ROLE_OPTIONS.find((r) => r.value === user.role);
  const isCurrentUser = user.email === currentEmail;

  return (
    <div
      style={{
        padding: "16px",
        background: colors.bgCard,
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: "8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: `${roleOption?.color}20`,
              border: `2px solid ${roleOption?.color}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 600,
              color: roleOption?.color,
            }}
          >
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: colors.textPrimary,
              }}
            >
              {user.full_name}
              {isCurrentUser && (
                <span
                  style={{
                    marginLeft: "8px",
                    padding: "2px 6px",
                    background: colors.accentLight,
                    color: colors.accent,
                    borderRadius: "3px",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  You
                </span>
              )}
            </div>
            <div style={{ fontSize: "12px", color: colors.textMuted }}>
              {user.email}
            </div>
          </div>
        </div>

        {/* Role Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "2px 8px",
              background: `${roleOption?.color}20`,
              color: roleOption?.color,
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {user.role}
          </span>
          {!user.is_active && (
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                background: colors.warningLight,
                color: colors.warningText,
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              Inactive
            </span>
          )}
        </div>

        {/* Permissions */}
        {user.permissions && Object.keys(user.permissions).length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              marginTop: "8px",
            }}
          >
            {PERMISSIONS.map((perm) => {
              if (user.permissions[perm.key]) {
                return (
                  <span
                    key={perm.key}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "2px 6px",
                      background: colors.accentOverlay,
                      color: colors.accent,
                      borderRadius: "3px",
                      fontSize: "10px",
                      fontWeight: 500,
                    }}
                  >
                    <Ico n={perm.icon} size={12} />
                    {perm.label}
                  </span>
                );
              }
              return null;
            })}
          </div>
        )}

        <div
          style={{
            fontSize: "11px",
            color: colors.textMuted,
            marginTop: "8px",
          }}
        >
          Created {new Date(user.created_at).toLocaleDateString()}
          {user.last_login &&
            ` • Last login: ${new Date(user.last_login).toLocaleString()}`}
        </div>
      </div>

      {/* Actions */}
      {canManage && !isCurrentUser && (
        <button
          onClick={() => onDelete(user.user_id)}
          style={{
            padding: "6px 12px",
            background: colors.dangerLight,
            color: colors.dangerText,
            border: `1px solid ${colors.dangerBorder}`,
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Deactivate
        </button>
      )}
    </div>
  );
}

function CreateUserModal({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  colors,
  togglePermission,
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: colors.bgCard,
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          border: `1px solid ${colors.borderSubtle}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: colors.textPrimary,
            marginBottom: "20px",
          }}
        >
          Create Junior User
        </h2>

        <form
          onSubmit={onSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {/* Email */}
          <div>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: colors.textMuted,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="user@example.com"
              style={{
                width: "100%",
                padding: "8px 12px",
                background: colors.bgPrimary,
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: "6px",
                color: colors.textPrimary,
                fontSize: "13px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Full Name */}
          <div>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: colors.textMuted,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Full Name
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              placeholder="John Doe"
              style={{
                width: "100%",
                padding: "8px 12px",
                background: colors.bgPrimary,
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: "6px",
                color: colors.textPrimary,
                fontSize: "13px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Role */}
          <div>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: colors.textMuted,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              style={{
                width: "100%",
                padding: "8px 12px",
                background: colors.bgPrimary,
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: "6px",
                color: colors.textPrimary,
                fontSize: "13px",
                boxSizing: "border-box",
              }}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Permissions (Junior only) */}
          {formData.role === "junior" && (
            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: colors.textMuted,
                  display: "block",
                  marginBottom: "12px",
                }}
              >
                Permissions
              </label>
              <div style={{ display: "grid", gap: "8px" }}>
                {PERMISSIONS.map((perm) => (
                  <label
                    key={perm.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      padding: "8px",
                      background: colors.bgPrimary,
                      borderRadius: "4px",
                      border: `1px solid ${colors.borderSubtle}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions[perm.key] || false}
                      onChange={() => togglePermission(perm.key)}
                      style={{ cursor: "pointer" }}
                    />
                    <span
                      style={{
                        fontSize: "12px",
                        color: colors.textPrimary,
                        fontWeight: 500,
                      }}
                    >
                      {perm.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "flex-end",
              marginTop: "8px",
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: "8px 16px",
                background: colors.bgPrimary,
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: "6px",
                color: colors.textPrimary,
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                background: "var(--accent)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
