import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const ORBS = [
  { size: 520, x: "2%",  y: "-5%", delay: 0,   duration: 9  },
  { size: 380, x: "62%", y: "52%", delay: 1.5,  duration: 11 },
  { size: 260, x: "78%", y: "2%",  delay: 0.8,  duration: 8  },
  { size: 300, x: "-4%", y: "62%", delay: 2.5,  duration: 10 },
];

const CORNERS = [
  { top: "2rem",  left: "2rem",  right: "auto", bottom: "auto", flipX: 1,  flipY: 1  },
  { top: "2rem",  right: "2rem", left: "auto",  bottom: "auto", flipX: -1, flipY: 1  },
  { bottom: "2rem", left: "2rem", top: "auto", right: "auto",   flipX: 1,  flipY: -1 },
  { bottom: "2rem", right: "2rem", top: "auto", left: "auto",   flipX: -1, flipY: -1 },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cormorant+SC:wght@300;400&family=Jost:wght@200;300;400&display=swap";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 35%, #1d3a62 0%, #162b4e 45%, #0c1c33 100%)",
      }}
    >
      {/* ── Ambient golden orbs ─────────────────────────────────── */}
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
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
          transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* ── Subtle grid texture ──────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(191,161,90,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(191,161,90,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* ── Corner frame decorations ─────────────────────────────── */}
      {CORNERS.map((c, i) => (
        <motion.svg
          key={i}
          width="56"
          height="56"
          viewBox="0 0 56 56"
          className="absolute pointer-events-none"
          style={{
            top: c.top,
            left: c.left,
            right: c.right,
            bottom: c.bottom,
            transform: `scaleX(${c.flipX}) scaleY(${c.flipY})`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.4 }}
        >
          <path
            d="M 0 56 L 0 0 L 56 0"
            stroke="rgba(191,161,90,0.32)"
            strokeWidth="1"
            fill="none"
          />
          <circle cx="0" cy="0" r="2.5" fill="rgba(191,161,90,0.45)" />
        </motion.svg>
      ))}

      {/* ── Center content ───────────────────────────────────────── */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-8"
        style={{ maxWidth: "680px" }}
      >
        {/* Brand label */}
        <motion.div
          className="flex items-center gap-4 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 0.2 }}
        >
          <div
            style={{
              width: 52,
              height: 1,
              background: "linear-gradient(to right, transparent, rgba(191,161,90,0.55))",
            }}
          />
          <span
            style={{
              fontFamily: "'Cormorant SC', serif",
              fontSize: "0.62rem",
              letterSpacing: "0.45em",
              color: "rgba(191,161,90,0.75)",
              fontWeight: 300,
              whiteSpace: "nowrap",
            }}
          >
            INVITACIONES VIRTUALES
          </span>
          <div
            style={{
              width: 52,
              height: 1,
              background: "linear-gradient(to left, transparent, rgba(191,161,90,0.55))",
            }}
          />
        </motion.div>

        {/* Headline — line 1 */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(2.6rem, 7vw, 5.2rem)",
            fontWeight: 300,
            fontStyle: "italic",
            color: "rgba(255,252,245,0.91)",
            lineHeight: 1.15,
            marginBottom: "0.2rem",
          }}
        >
          Cada amor merece
        </motion.h1>

        {/* Headline — line 2 (gold) */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.72, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(2.6rem, 7vw, 5.2rem)",
            fontWeight: 300,
            fontStyle: "italic",
            color: "rgba(191,161,90,0.86)",
            lineHeight: 1.15,
            marginBottom: "2rem",
          }}
        >
          su propia historia.
        </motion.h1>

        {/* Ornament divider */}
        <motion.div
          className="flex items-center gap-2 mb-7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 1.05 }}
        >
          <div style={{ width: 44, height: 1, background: "rgba(191,161,90,0.28)" }} />
          <div style={{ width: 5, height: 5, background: "rgba(191,161,90,0.55)", transform: "rotate(45deg)" }} />
          <div style={{ width: 5, height: 5, background: "rgba(191,161,90,0.38)", transform: "rotate(45deg)" }} />
          <div style={{ width: 5, height: 5, background: "rgba(191,161,90,0.55)", transform: "rotate(45deg)" }} />
          <div style={{ width: 44, height: 1, background: "rgba(191,161,90,0.28)" }} />
        </motion.div>

        {/* Sub-description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.3, delay: 1.15 }}
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: "0.7rem",
            fontWeight: 200,
            letterSpacing: "0.28em",
            color: "rgba(255,252,245,0.38)",
            textTransform: "uppercase",
            marginBottom: "2.8rem",
          }}
        >
          Bodas · Eventos Especiales · Momentos Únicos
        </motion.p>

        {/* CTA button */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.35 }}
        >
          <motion.button
            onClick={() => navigate("/login")}
            whileHover={{
              borderColor: "rgba(191,161,90,0.65)",
              backgroundColor: "rgba(191,161,90,0.09)",
              color: "rgba(191,161,90,1)",
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.22 }}
            style={{
              fontFamily: "'Cormorant SC', serif",
              fontSize: "0.7rem",
              letterSpacing: "0.38em",
              fontWeight: 400,
              color: "rgba(191,161,90,0.78)",
              border: "1px solid rgba(191,161,90,0.28)",
              background: "transparent",
              padding: "1rem 3.2rem",
              cursor: "pointer",
            }}
          >
            INICIAR SESIÓN
          </motion.button>
        </motion.div>

        {/* Guest note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 1.9 }}
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: "0.66rem",
            fontWeight: 200,
            color: "rgba(255,252,245,0.2)",
            marginTop: "2.2rem",
            letterSpacing: "0.03em",
          }}
        >
          Si eres invitado, accede con el enlace personalizado que recibiste
        </motion.p>
      </div>
    </div>
  );
};

export default LandingPage;
