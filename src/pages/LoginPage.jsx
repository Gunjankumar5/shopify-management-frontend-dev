import { useEffect, useMemo, useState } from "react";
import { Ico, Spin } from "../components/Icons";
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const [isCompact, setIsCompact] = useState(() => window.innerWidth <= 920);
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const trimmedEmail = email.trim();
  const submitLabel = mode === "signin" ? "Sign In" : "Create Account";
  const isLocked = cooldownSeconds > 0;

  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 8,
      letter: /[A-Za-z]/.test(password),
      number: /\d/.test(password),
    }),
    [password],
  );

  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth <= 920);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownSeconds(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil(cooldownUntil - Date.now() / 1000));
      setCooldownSeconds(remaining);
      if (remaining === 0) {
        setCooldownUntil(0);
        setFailedAttempts(0);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [cooldownUntil]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setMessage("");
    setShowPassword(false);
  };

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");

    if (!hasSupabaseConfig || !supabase) {
      setError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }

    if (!trimmedEmail) {
      setError("Enter your email first, then use forgot password.");
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          redirectTo: `${window.location.origin}/`,
        },
      );
      if (resetError) throw resetError;
      setMessage("If the email exists, a password reset link has been sent.");
    } catch (e) {
      setError(e?.message || "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (isLocked) {
      setError(`Too many failed attempts. Please wait ${cooldownSeconds}s and try again.`);
      return;
    }

    if (!hasSupabaseConfig || !supabase) {
      setError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }

    if (!trimmedEmail || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    if (
      mode === "signup" &&
      (!passwordChecks.length || !passwordChecks.letter || !passwordChecks.number)
    ) {
      setError("Use a stronger password: 8+ chars with letters and numbers.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });
        if (signUpError) throw signUpError;
        setMessage(
          "Account created. Check your email to confirm your account, then sign in.",
        );
        setMode("signin");
      }
      setFailedAttempts(0);
    } catch (e) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        const until = Math.floor(Date.now() / 1000) + 30;
        setCooldownUntil(until);
        setError("Too many failed attempts. Please wait 30s before trying again.");
      } else {
        setError(e?.message || "Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background:
          "radial-gradient(1200px 600px at 15% -20%, rgba(99,102,241,0.25), transparent), radial-gradient(1200px 700px at 120% 120%, rgba(16,185,129,0.18), transparent), var(--bg-primary)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 940,
          borderRadius: 18,
          border: "1px solid var(--border-strong)",
          background:
            "linear-gradient(180deg, rgba(24,24,30,0.97), rgba(14,14,20,0.98))",
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: isCompact
            ? "1fr"
            : "minmax(280px, 1fr) minmax(340px, 1.1fr)",
        }}
      >
        <div
          style={{
            padding: "34px 32px",
            borderRight: isCompact ? "none" : "1px solid var(--border-subtle)",
            borderBottom: isCompact ? "1px solid var(--border-subtle)" : "none",
            background:
              "linear-gradient(145deg, rgba(99,102,241,0.14), rgba(16,185,129,0.06) 55%, transparent)",
            display: "grid",
            alignContent: "space-between",
            gap: 24,
          }}
        >
          <div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "var(--accent-gradient)",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                marginBottom: 14,
              }}
            >
              <Ico n="user" size={22} color="currentColor" />
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
                lineHeight: 1.02,
              }}
            >
              Shopify Manager
            </h1>
            <p
              style={{
                marginTop: 12,
                color: "var(--text-secondary)",
                fontSize: "var(--text-sm)",
                maxWidth: 360,
              }}
            >
              Secure dashboard access for each store owner. Your account only sees its own connected stores.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: 10,
              color: "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Ico n="check" size={14} color="#6ee7b7" />
              Isolated store access per user
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Ico n="check" size={14} color="#6ee7b7" />
              Session handled by Supabase Auth
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Ico n="check" size={14} color="#6ee7b7" />
              Revocable access and secure sign out
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "28px 28px 30px" }}>
          <div style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                display: "inline-grid",
                gridTemplateColumns: "1fr 1fr",
                background: "var(--bg-input)",
                border: "1px solid var(--border-strong)",
                borderRadius: 10,
                padding: 4,
              }}
            >
              <button
                type="button"
                onClick={() => switchMode("signin")}
                style={{
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 12px",
                  background: mode === "signin" ? "var(--accent-gradient)" : "transparent",
                  color: mode === "signin" ? "#fff" : "var(--text-secondary)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                style={{
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 12px",
                  background: mode === "signup" ? "var(--accent-gradient)" : "transparent",
                  color: mode === "signup" ? "#fff" : "var(--text-secondary)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Create Account
              </button>
            </div>

            <label style={{ display: "grid", gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}
              >
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  borderRadius: 10,
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  padding: "12px 14px",
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}
              >
                Password
              </span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 8,
                  alignItems: "center",
                  borderRadius: 10,
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-input)",
                }}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder="Enter your password"
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    color: "var(--text-primary)",
                    padding: "12px 14px",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--text-muted)",
                    padding: "0 12px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ico n={showPassword ? "eye-off" : "eye"} size={16} />
                </button>
              </div>
            </label>

            {mode === "signup" && (
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  Password requirements
                </div>
                <div style={{ fontSize: 12, color: passwordChecks.length ? "#6ee7b7" : "var(--text-muted)" }}>
                  {passwordChecks.length ? "✓" : "○"} At least 8 characters
                </div>
                <div style={{ fontSize: 12, color: passwordChecks.letter ? "#6ee7b7" : "var(--text-muted)" }}>
                  {passwordChecks.letter ? "✓" : "○"} Includes a letter
                </div>
                <div style={{ fontSize: 12, color: passwordChecks.number ? "#6ee7b7" : "var(--text-muted)" }}>
                  {passwordChecks.number ? "✓" : "○"} Includes a number
                </div>
              </div>
            )}

            {mode === "signin" && (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                style={{
                  justifySelf: "start",
                  border: "none",
                  background: "transparent",
                  color: "var(--accent)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            )}

            {isLocked && (
              <div
                style={{
                  borderRadius: 10,
                  border: "1px solid rgba(245,158,11,0.4)",
                  background: "rgba(245,158,11,0.12)",
                  color: "#fcd34d",
                  fontSize: 13,
                  padding: "10px 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Ico n="clock" size={14} />
                Try again in {cooldownSeconds}s
              </div>
            )}

            {error && (
              <div
                style={{
                  borderRadius: 10,
                  border: "1px solid rgba(239,68,68,0.4)",
                  background: "rgba(239,68,68,0.12)",
                  color: "#fda4af",
                  fontSize: 13,
                  padding: "10px 12px",
                }}
                role="alert"
              >
                {error}
              </div>
            )}

            {message && (
              <div
                style={{
                  borderRadius: 10,
                  border: "1px solid rgba(16,185,129,0.4)",
                  background: "rgba(16,185,129,0.12)",
                  color: "#6ee7b7",
                  fontSize: 13,
                  padding: "10px 12px",
                }}
                aria-live="polite"
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isLocked}
              style={{
                marginTop: 4,
                border: "none",
                borderRadius: 10,
                padding: "12px 14px",
                background: "var(--accent-gradient)",
                color: "#fff",
                fontWeight: 700,
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                cursor: loading || isLocked ? "not-allowed" : "pointer",
                opacity: loading || isLocked ? 0.75 : 1,
              }}
            >
              {loading && <Spin size={16} color="#fff" />}
              {submitLabel}
            </button>

            <p
              style={{
                color: "var(--text-muted)",
                fontSize: 11,
                lineHeight: 1.45,
                textAlign: "center",
              }}
            >
              By continuing, you agree to secure account access and responsible use of connected store credentials.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
