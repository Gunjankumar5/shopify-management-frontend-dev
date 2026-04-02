import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

// ── Views ─────────────────────────────────────────────────────────────────────
const VIEW = {
  LOGIN:   "login",
  SIGNUP:  "signup",
  FORGOT:  "forgot",
  RESET:   "reset",    // password reset (from email link)
  PENDING: "pending",  // email confirmation pending
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0A0A0A 0%, #1a1a2e 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "inherit",
  },
  card: {
    background: "rgba(17,17,30,0.8)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(59,130,246,0.2)",
    borderRadius: 24,
    padding: "40px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 24px 80px rgba(0,0,0,0.8), 0 0 40px rgba(59,130,246,0.1)",
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: "linear-gradient(135deg,#3B82F6,#8B5CF6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    margin: "0 auto 24px",
    boxShadow: "0 8px 24px rgba(59,130,246,0.3)",
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 1.5,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: "13px 16px",
    background: "rgba(15,15,25,0.9)",
    border: "1px solid #2a2a3d",
    borderRadius: 12,
    fontSize: 15,
    color: "#e8e8f0",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "all 0.2s",
  },
  btn: {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    background: "linear-gradient(135deg,#3B82F6,#8B5CF6)",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.2s",
    marginTop: 6,
    boxShadow: "0 8px 20px rgba(59,130,246,0.3)",
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  btnSecondary: {
    width: "100%",
    padding: "13px",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    background: "transparent",
    border: "1.5px solid #3B82F6",
    color: "#3B82F6",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.2s",
    marginTop: 8,
  },
  btnText: {
    width: "100%",
    padding: "13px",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    background: "transparent",
    border: "1px solid #2a2a3d",
    color: "#888",
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: 8,
    transition: "all 0.2s",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "20px 0",
    color: "#444",
    fontSize: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "#2a2a3d",
  },
  error: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 13,
    color: "#fca5a5",
    marginBottom: 18,
    fontWeight: 500,
    lineHeight: 1.5,
  },
  success: {
    background: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.3)",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 13,
    color: "#86efac",
    marginBottom: 18,
    fontWeight: 500,
    lineHeight: 1.5,
  },
  link: {
    background: "none",
    border: "none",
    color: "#3B82F6",
    cursor: "pointer",
    fontSize: 13,
    padding: 0,
    fontFamily: "inherit",
    fontWeight: 600,
  },
  googleBtn: {
    width: "100%",
    padding: "13px",
    borderRadius: 12,
    border: "1.5px solid rgba(232,232,240,0.15)",
    background: "rgba(26,26,46,0.5)",
    color: "#e8e8f0",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
    transition: "all 0.2s",
  },
};

// ── Google SVG ────────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    style={{ animation: "spin 0.8s linear infinite" }}>
    <circle cx="12" cy="12" r="10" stroke="#3d3d5c" strokeWidth="3"/>
    <path d="M12 2a10 10 0 0110 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

// ── Input component ───────────────────────────────────────────────────────────
function Input({ label, type = "text", value, onChange, placeholder, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";
  const inputType = isPasswordField && showPassword ? "text" : type;

  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={S.label}>{label}</label>}
      <div style={{ position: "relative" }}>
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...S.input,
            borderColor: focused ? "#3B82F6" : "#2a2a3d",
            boxShadow: focused ? "0 0 0 3px rgba(59,130,246,0.1)" : "none",
            paddingRight: isPasswordField ? "40px" : "14px",
          }}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: focused ? "#3B82F6" : "#666",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px",
              transition: "color 0.2s",
            }}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main AuthPage ─────────────────────────────────────────────────────────────
export default function AuthPage({ onAuth }) {
  const [view,     setView]     = useState(VIEW.LOGIN);
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [fullName, setFullName] = useState("");
  const [newPass,  setNewPass]  = useState("");
  const [newConf,  setNewConf]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  // ── Detect password reset link (from email) ───────────────────────────────
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setView(VIEW.RESET);
    }
  }, []);

  const clear = () => { setError(""); setSuccess(""); };

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) { setError("Email and password are required"); return; }
    setLoading(true); clear();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else onAuth?.();
    setLoading(false);
  };

  // ── Signup ────────────────────────────────────────────────────────────────
  const handleSignup = async () => {
    if (!fullName || !email || !password) { setError("All fields are required"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters"); return; }
    setLoading(true); clear();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) setError(error.message);
    else {
      setView(VIEW.PENDING);
      setSuccess("Check your email to confirm your account!");
    }
    setLoading(false);
  };

  // ── Forgot password ───────────────────────────────────────────────────────
  const handleForgot = async () => {
    if (!email) { setError("Enter your email address"); return; }
    setLoading(true); clear();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });
    if (error) setError(error.message);
    else setSuccess("Password reset email sent! Check your inbox.");
    setLoading(false);
  };

  // ── Reset password ────────────────────────────────────────────────────────
  const handleReset = async () => {
    if (!newPass) { setError("Enter a new password"); return; }
    if (newPass !== newConf) { setError("Passwords do not match"); return; }
    if (newPass.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); clear();
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) setError(error.message);
    else {
      setSuccess("Password updated! Redirecting to login...");
      setTimeout(() => {
        window.location.hash = "";
        setView(VIEW.LOGIN);
      }, 2000);
    }
    setLoading(false);
  };

  // ── Google login ──────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setLoading(true); clear();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  // ── Shared header ─────────────────────────────────────────────────────────
  const Header = ({ title, subtitle }) => (
    <>
      <div style={S.logo}>🛍️</div>
      <div style={S.title}>{title}</div>
      <div style={S.subtitle}>{subtitle}</div>
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* ── LOGIN ── */}
        {view === VIEW.LOGIN && (
          <>
            <Header title="Welcome back" subtitle="Sign in to your ShopManager account" />
            {error   && <div style={S.error}>❌ {error}</div>}
            {success && <div style={S.success}>✅ {success}</div>}

            {/* Google login */}
            <button style={S.googleBtn} onClick={handleGoogle} disabled={loading}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#3B82F6"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a3d"}
            >
              <GoogleIcon /> Continue with Google
            </button>

            <div style={S.divider}>
              <div style={S.dividerLine}/> or <div style={S.dividerLine}/>
            </div>

            <Input label="Email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email" />
            <Input label="Password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" autoComplete="current-password" />

            <div style={{ textAlign: "right", marginBottom: 16, marginTop: -8 }}>
              <button style={S.link} onClick={() => { clear(); setView(VIEW.FORGOT); }}>
                Forgot password?
              </button>
            </div>

            <button style={{ ...S.btn, ...(loading ? S.btnDisabled : {}) }}
              onClick={handleLogin} disabled={loading}>
              {loading ? <Spin /> : "Sign in"}
            </button>

            <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#666" }}>
              Don't have an account?{" "}
              <button style={S.link} onClick={() => { clear(); setView(VIEW.SIGNUP); }}>
                Sign up
              </button>
            </div>
          </>
        )}

        {/* ── SIGNUP ── */}
        {view === VIEW.SIGNUP && (
          <>
            <Header title="Create account" subtitle="Join ShopManager to manage your Shopify store" />
            {error && <div style={S.error}>❌ {error}</div>}

            {/* Google signup */}
            <button style={S.googleBtn} onClick={handleGoogle} disabled={loading}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#3B82F6"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a3d"}
            >
              <GoogleIcon /> Continue with Google
            </button>

            <div style={S.divider}>
              <div style={S.dividerLine}/> or <div style={S.dividerLine}/>
            </div>

            <Input label="Full Name" value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="John Doe" autoComplete="name" />
            <Input label="Email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email" />
            <Input label="Password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters" autoComplete="new-password" />
            <Input label="Confirm Password" type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password" autoComplete="new-password" />

            <button style={{ ...S.btn, ...(loading ? S.btnDisabled : {}) }}
              onClick={handleSignup} disabled={loading}>
              {loading ? <Spin /> : "Create account"}
            </button>

            <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#666" }}>
              Already have an account?{" "}
              <button style={S.link} onClick={() => { clear(); setView(VIEW.LOGIN); }}>
                Sign in
              </button>
            </div>
          </>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {view === VIEW.FORGOT && (
          <>
            <Header title="Reset password" subtitle="Enter your email and we'll send you a reset link" />
            {error   && <div style={S.error}>❌ {error}</div>}
            {success && <div style={S.success}>✅ {success}</div>}

            <Input label="Email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email" />

            <button style={{ ...S.btn, ...(loading ? S.btnDisabled : {}) }}
              onClick={handleForgot} disabled={loading}>
              {loading ? <Spin /> : "Send reset link"}
            </button>

            <button style={S.btnSecondary}
              onClick={() => { clear(); setView(VIEW.LOGIN); }}>
              ← Back to login
            </button>
          </>
        )}

        {/* ── RESET PASSWORD (from email link) ── */}
        {view === VIEW.RESET && (
          <>
            <Header title="Set new password" subtitle="Choose a strong password for your account" />
            {error   && <div style={S.error}>❌ {error}</div>}
            {success && <div style={S.success}>✅ {success}</div>}

            <Input label="New Password" type="password" value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="Min 6 characters" autoComplete="new-password" />
            <Input label="Confirm New Password" type="password" value={newConf}
              onChange={e => setNewConf(e.target.value)}
              placeholder="Repeat new password" autoComplete="new-password" />

            <button style={{ ...S.btn, ...(loading ? S.btnDisabled : {}) }}
              onClick={handleReset} disabled={loading}>
              {loading ? <Spin /> : "Update password"}
            </button>
          </>
        )}

        {/* ── EMAIL PENDING CONFIRMATION ── */}
        {view === VIEW.PENDING && (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
              <div style={S.title}>Check your email</div>
              <div style={{ ...S.subtitle, marginBottom: 24 }}>
                We sent a confirmation link to<br />
                <strong style={{ color: "#e8e8f0" }}>{email}</strong>
              </div>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 24 }}>
                Click the link in the email to activate your account.
                The link expires in 24 hours.
              </div>
              <button style={S.btnSecondary}
                onClick={() => { clear(); setView(VIEW.LOGIN); }}>
                Back to login
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
