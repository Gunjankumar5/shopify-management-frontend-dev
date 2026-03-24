import { useEffect, useMemo, useState } from "react";
import GlobalStyles from "./components/GlobalStyles";
import { useToast, Toasts } from "./components/Toast";
import Sidebar from "./components/Sidebar";
import { Ico } from "./components/Icons";
import ProductsPage from "./pages/ProductsPage";
import UploadPage from "./pages/UploadPage";
import CollectionsPage from "./pages/CollectionsPage";
import InventoryPage from "./pages/InventoryPage";
import ConnectStore from "./pages/ConnectStore";
import ExportPage from "./pages/ExportPage";
import LoginPage from "./pages/LoginPage";
import UserManagementPage from "./pages/UserManagementPage";
import { hasSupabaseConfig, supabase } from "./lib/supabaseClient";
import MetafieldsPage from "./pages/MetafieldsPage";

export default function App() {
  const [page, setPage] = useState("products");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeStore, setActiveStore] = useState(null);
  const [pageKey, setPageKey] = useState(0);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState(null);
  const { toasts, add, remove } = useToast();

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setAuthError(
        "Missing Supabase env config. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    const initializeAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        setAuthError(error.message || "Failed to initialize authentication.");
        setUser(null);
      } else {
        setAuthError("");
        setUser(session?.user || null);
      }
      setAuthLoading(false);
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handler = () => setPageKey((k) => k + 1);
    window.addEventListener("store-switched", handler);
    return () => window.removeEventListener("store-switched", handler);
  }, []);

  const pageTitle = useMemo(() => {
    const labels = {
      products: "Products",
      upload: "Upload",
      collections: "Collections",
      inventory: "Inventory",
      export: "Export",
    };
    return labels[page] || "Dashboard";
  }, [page]);

  const handleSetPage = (nextPage) => {
    setPage(nextPage);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleStoreConnected = (data) => {
    setActiveStore({
      shop_key: data.shop_key,
      shop_name: data.shop_name,
      shop: data.shop,
      is_active: true,
    });
    add(`Connected to ${data.shop_name || data.shop}!`, "success");
    setPage("products");
    setPageKey((k) => k + 1);
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      add(error.message || "Failed to sign out.", "error");
      return;
    }
    add("Signed out successfully.", "success");
  };

  if (authLoading) {
    return (
      <>
        <GlobalStyles />
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            color: "var(--text-secondary)",
            fontWeight: 600,
          }}
        >
          Checking authentication...
        </div>
      </>
    );
  }

  if (authError) {
    return (
      <>
        <GlobalStyles />
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              maxWidth: 560,
              width: "100%",
              border: "1px solid var(--danger)",
              borderRadius: 12,
              background: "var(--danger-light)",
              color: "var(--danger)",
              padding: 18,
            }}
          >
            <h2 style={{ marginBottom: 8, fontSize: "1.2rem" }}>
              Authentication setup required
            </h2>
            <p style={{ lineHeight: 1.45 }}>{authError}</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <GlobalStyles />
        <LoginPage />
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <Toasts toasts={toasts} remove={remove} />
      <div className="app-shell">
        <Sidebar
          page={page}
          setPage={handleSetPage}
          isMobile={isMobile}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeStore={activeStore}
          setActiveStore={setActiveStore}
          userEmail={user?.email}
          onSignOut={handleSignOut}
        />
        {isMobile && isSidebarOpen && (
          <button
            type="button"
            className="app-sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation"
          />
        )}
        <main className="app-main">
          {isMobile && (
            <header className="app-mobile-header">
              <button
                type="button"
                className="app-mobile-menu-btn"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                aria-label="Toggle navigation"
              >
                <Ico n="menu" size={18} />
              </button>
              <h1>{pageTitle}</h1>
            </header>
          )}

          {page === "products" && (
            <ProductsPage
              key={`products-${pageKey}`}
              toast={add}
              activeStore={activeStore}
            />
          )}
          {page === "upload" && (
            <UploadPage key={`upload-${pageKey}`} toast={add} />
          )}
          {page === "collections" && (
            <CollectionsPage key={`collections-${pageKey}`} />
          )}
          {page === "inventory" && (
            <InventoryPage key={`inventory-${pageKey}`} />
          )}
          {page === "export" && (
            <ExportPage
              key={`export-${pageKey}`}
              toast={add}
              activeStore={activeStore}
            />
          )}
          {page === "metafields" && (
            <MetafieldsPage
              key={`metafields-${pageKey}`}
              toast={add}
              activeStore={activeStore}
            />
          )}
          {page === "connect" && (
            <ConnectStore onConnected={handleStoreConnected} />
          )}
          {page === "users" && (
            <UserManagementPage
              key={`users-${pageKey}`}
              activeStore={activeStore}
              userEmail={user?.email}
            />
          )}
        </main>
      </div>
    </>
  );
}
