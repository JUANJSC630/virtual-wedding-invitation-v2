import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { AdminUser } from "@/types";

// ── Background (shared aesthetic con LandingPage) ────────────────────────────

const ORBS = [
  { size: 520, x: "2%",  y: "-5%", delay: 0,   duration: 9  },
  { size: 380, x: "62%", y: "52%", delay: 1.5,  duration: 11 },
  { size: 260, x: "78%", y: "2%",  delay: 0.8,  duration: 8  },
  { size: 300, x: "-4%", y: "62%", delay: 2.5,  duration: 10 },
];

const Background: React.FC = () => (
  <div
    className="fixed inset-0 pointer-events-none"
    style={{
      background:
        "radial-gradient(ellipse at 50% 35%, #1d3a62 0%, #162b4e 45%, #0c1c33 100%)",
    }}
  >
    {ORBS.map((orb, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: orb.size,
          height: orb.size,
          left: orb.x,
          top: orb.y,
          background:
            "radial-gradient(circle, rgba(191,161,90,0.13) 0%, transparent 70%)",
          filter: `blur(${orb.size / 2.5}px)`,
        }}
        animate={{ y: [0, -22, 0], opacity: [0.4, 0.65, 0.4] }}
        transition={{
          duration: orb.duration,
          delay: orb.delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(191,161,90,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(191,161,90,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "80px 80px",
      }}
    />
  </div>
);

// ── Input con focus dorado gestionado por state ───────────────────────────────

interface StyledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const StyledInput: React.FC<StyledInputProps> = ({ label, id, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        style={{
          fontFamily: "'Cormorant SC', serif",
          fontSize: "0.58rem",
          letterSpacing: "0.35em",
          color: "rgba(191,161,90,0.65)",
          fontWeight: 300,
        }}
      >
        {label}
      </label>
      <input
        id={id}
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          background: focused
            ? "rgba(255,255,255,0.06)"
            : "rgba(255,255,255,0.03)",
          border: `1px solid ${focused ? "rgba(191,161,90,0.52)" : "rgba(191,161,90,0.16)"}`,
          boxShadow: focused ? "0 0 0 3px rgba(191,161,90,0.07)" : "none",
          color: "rgba(255,252,245,0.85)",
          fontFamily: "'Jost', sans-serif",
          fontSize: "0.82rem",
          fontWeight: 300,
          padding: "0.72rem 0.9rem",
          outline: "none",
          transition: "border-color 0.22s, box-shadow 0.22s, background 0.22s",
          width: "100%",
          caretColor: "rgba(191,161,90,0.8)",
        }}
      />
    </div>
  );
};

// ── LoginPage ────────────────────────────────────────────────────────────────

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Inyectar fuentes (mismas que LandingPage)
  useEffect(() => {
    if (document.getElementById("iv-fonts")) return;
    const link = document.createElement("link");
    link.id = "iv-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cormorant+SC:wght@300;400&family=Jost:wght@200;300;400&display=swap";
    document.head.appendChild(link);
  }, []);

  // Placeholder CSS para los inputs
  useEffect(() => {
    if (document.getElementById("iv-login-styles")) return;
    const style = document.createElement("style");
    style.id = "iv-login-styles";
    style.textContent = `
      #email::placeholder, #password::placeholder {
        color: rgba(255,252,245,0.22);
        font-family: 'Jost', sans-serif;
        font-weight: 200;
      }
    `;
    document.head.appendChild(style);
  }, []);

  const redirect = (user: AdminUser) => {
    navigate(user.role === "master" ? "/master" : "/admin", { replace: true });
  };

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (data?.user) redirect(data.user); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Credenciales incorrectas."); return; }
      redirect(data.user);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // ── Checking state ────────────────────────────────────────────────────────
  if (checking) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <Background />
        <motion.div
          className="relative z-10 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "1px solid rgba(191,161,90,0.55)",
              borderTopColor: "transparent",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
          />
          <span
            style={{
              fontFamily: "'Cormorant SC', serif",
              fontSize: "0.58rem",
              letterSpacing: "0.42em",
              color: "rgba(191,161,90,0.45)",
              fontWeight: 300,
            }}
          >
            VERIFICANDO
          </span>
        </motion.div>
      </div>
    );
  }

  // ── Login form ────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-6">
      <Background />

      <motion.div
        className="relative z-10 w-full"
        style={{ maxWidth: "420px" }}
        initial={{ opacity: 0, y: 22, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Glass card */}
        <div
          style={{
            background: "rgba(10, 20, 40, 0.68)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(191,161,90,0.18)",
            padding: "2.6rem 2.4rem 2.2rem",
            position: "relative",
          }}
        >
          {/* Card corner decorations */}
          {[
            { style: { top: -1, left: -1 } as React.CSSProperties,                                   tx: "none" },
            { style: { top: -1, right: -1 } as React.CSSProperties,                                  tx: "scaleX(-1)" },
            { style: { bottom: -1, left: -1 } as React.CSSProperties,                                tx: "scaleY(-1)" },
            { style: { bottom: -1, right: -1 } as React.CSSProperties,                               tx: "scale(-1)" },
          ].map((c, i) => (
            <svg
              key={i}
              width="18"
              height="18"
              viewBox="0 0 18 18"
              style={{ position: "absolute", ...c.style, transform: c.tx }}
            >
              <path
                d="M 0 18 L 0 0 L 18 0"
                stroke="rgba(191,161,90,0.45)"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          ))}

          {/* Header */}
          <div className="flex flex-col items-center mb-7">
            <motion.div
              className="flex items-center gap-3 mb-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.45 }}
            >
              <div
                style={{
                  width: 28,
                  height: 1,
                  background:
                    "linear-gradient(to right, transparent, rgba(191,161,90,0.48))",
                }}
              />
              <span
                style={{
                  fontFamily: "'Cormorant SC', serif",
                  fontSize: "0.57rem",
                  letterSpacing: "0.38em",
                  color: "rgba(191,161,90,0.65)",
                  fontWeight: 300,
                  whiteSpace: "nowrap",
                }}
              >
                ACCESO ADMINISTRATIVO
              </span>
              <div
                style={{
                  width: 28,
                  height: 1,
                  background:
                    "linear-gradient(to left, transparent, rgba(191,161,90,0.48))",
                }}
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.6 }}
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "2.1rem",
                fontWeight: 300,
                fontStyle: "italic",
                color: "rgba(255,252,245,0.88)",
                lineHeight: 1.1,
                marginBottom: "0.35rem",
              }}
            >
              Iniciar sesión
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.75 }}
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: "0.68rem",
                fontWeight: 200,
                letterSpacing: "0.1em",
                color: "rgba(255,252,245,0.32)",
              }}
            >
              Accede a tu panel de administración
            </motion.p>
          </div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <StyledInput
              label="EMAIL"
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
            />

            <StyledInput
              label="CONTRASEÑA"
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{
                    background: "rgba(220,80,60,0.1)",
                    border: "1px solid rgba(220,80,60,0.22)",
                    padding: "0.55rem 0.85rem",
                    fontFamily: "'Jost', sans-serif",
                    fontSize: "0.72rem",
                    fontWeight: 300,
                    color: "rgba(255,155,135,0.9)",
                    letterSpacing: "0.03em",
                    margin: 0,
                  }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { backgroundColor: "rgba(191,161,90,1)" } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              transition={{ duration: 0.2 }}
              style={{
                background: "rgba(191,161,90,0.84)",
                border: "none",
                padding: "0.88rem",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "0.3rem",
                opacity: loading ? 0.75 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.55rem",
                transition: "opacity 0.2s",
              }}
            >
              {loading ? (
                <>
                  <motion.div
                    style={{
                      width: 13,
                      height: 13,
                      borderRadius: "50%",
                      border: "1.5px solid rgba(12,28,51,0.4)",
                      borderTopColor: "rgba(12,28,51,0.85)",
                      flexShrink: 0,
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
                  />
                  <span
                    style={{
                      fontFamily: "'Cormorant SC', serif",
                      fontSize: "0.65rem",
                      letterSpacing: "0.32em",
                      color: "rgba(12,28,51,0.75)",
                      fontWeight: 400,
                    }}
                  >
                    INICIANDO
                  </span>
                </>
              ) : (
                <span
                  style={{
                    fontFamily: "'Cormorant SC', serif",
                    fontSize: "0.65rem",
                    letterSpacing: "0.38em",
                    color: "rgba(12,28,51,0.9)",
                    fontWeight: 400,
                  }}
                >
                  INICIAR SESIÓN
                </span>
              )}
            </motion.button>

            {/* Back link */}
            <motion.button
              type="button"
              onClick={() => navigate("/")}
              whileHover={{ color: "rgba(191,161,90,0.72)" }}
              transition={{ duration: 0.18 }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Jost', sans-serif",
                fontSize: "0.64rem",
                fontWeight: 200,
                color: "rgba(255,252,245,0.22)",
                letterSpacing: "0.08em",
                marginTop: "0.15rem",
              }}
            >
              ← Volver al inicio
            </motion.button>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
