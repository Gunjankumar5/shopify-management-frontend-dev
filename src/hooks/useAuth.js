import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * useAuth hook - Centralized authentication state
 * Fetches user info, role, and permissions from Supabase
 * Returns: { user, role, permissions, loading, signOut, can }
 * - can(permission) - Check if user has a specific permission
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const fetchInProgressRef = useRef(false);
  const lastUserIdRef = useRef(null);

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchUserDataOnce(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          fetchUserDataOnce(session.user.id);
        } else {
          setRole(null);
          setPermissions({});
          setLoading(false);
          lastUserIdRef.current = null;
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  async function fetchUserDataOnce(userId) {
    // Don't fetch if already fetching or if we already fetched this user
    if (fetchInProgressRef.current || lastUserIdRef.current === userId) {
      return;
    }

    fetchInProgressRef.current = true;
    lastUserIdRef.current = userId;

    try {
      setLoading(true);

      // Fetch user with role
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, full_name, role, is_active, avatar_url")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("User fetch error:", userError);
        // Set defaults and stop trying to fetch
        setRole(null);
        setPermissions({});
        setLoading(false);
        return;
      }

      if (!userData) {
        console.error("No user data returned");
        setRole(null);
        setPermissions({});
        setLoading(false);
        return;
      }

      // Fetch user permissions
      let permData = {};
      try {
        const { data, error: permError } = await supabase
          .from("user_permissions")
          .select(
            "manage_products, delete_products, manage_collections, manage_inventory, " +
            "manage_metafields, manage_upload, manage_export, use_ai, manage_stores, " +
            "manage_users, view_analytics"
          )
          .eq("user_id", userId)
          .single();

        if (!permError && data) {
          permData = data;
        } else if (permError && permError.code !== "PGRST116") {
          // PGRST116 = no rows found (expected for new users)
          console.warn("Permissions fetch warning:", permError);
        }

        // If user is admin and no permissions yet, grant all
        if (userData.role === "admin" && Object.keys(permData).length === 0) {
          permData = {
            manage_products: true,
            delete_products: true,
            manage_collections: true,
            manage_inventory: true,
            manage_metafields: true,
            manage_upload: true,
            manage_export: true,
            use_ai: true,
            manage_stores: true,
            manage_users: true,
            view_analytics: true,
          };
        }
      } catch (err) {
        console.warn("Permissions error:", err);
        // For admins, grant all permissions anyway
        if (userData.role === "admin") {
          permData = {
            manage_products: true,
            delete_products: true,
            manage_collections: true,
            manage_inventory: true,
            manage_metafields: true,
            manage_upload: true,
            manage_export: true,
            use_ai: true,
            manage_stores: true,
            manage_users: true,
            view_analytics: true,
          };
        }
      }

      setPermissions(permData || {});
      setRole(userData.role || null);
    } catch (err) {
      console.error("Auth fetch error:", err);
      setRole(null);
      setPermissions({});
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setPermissions({});
    lastUserIdRef.current = null;
    fetchInProgressRef.current = false;
  }

  function can(permission) {
    // Admin has all permissions
    if (role === "admin") return true;
    // Check specific permission
    return permissions[permission] === true;
  }

  return {
    user,
    role,
    permissions,
    loading,
    signOut,
    can,
  };
}
