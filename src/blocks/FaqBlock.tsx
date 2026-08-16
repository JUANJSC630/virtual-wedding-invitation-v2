import { motion } from "framer-motion";

import { useAssets } from "@/context/AssetContext";

import { BlockComponentProps } from "./types";

interface FaqItem {
  q?: string;
  a?: string;
}

/**
 * Bloque de preguntas frecuentes. Config por instancia:
 *   { title?: string, items?: {q,a}[] }
 * En el panel se edita como texto "Pregunta | Respuesta" por línea (ver
 * LayoutBuilder), y aquí se parsea a items.
 */
const FaqBlock: React.FC<BlockComponentProps> = ({ config }) => {
  const assets = useAssets();
  const title = typeof config?.title === "string" && config.title ? config.title : "Preguntas frecuentes";

  // items puede venir como array {q,a} o como texto "P | R" por línea.
  let items: FaqItem[] = [];
  if (Array.isArray(config?.items)) {
    items = (config.items as FaqItem[]).filter(it => it && (it.q || it.a));
  } else if (typeof config?.items === "string") {
    items = (config.items as string)
      .split("\n")
      .map(line => {
        const idx = line.indexOf("|");
        const q = (idx >= 0 ? line.slice(0, idx) : line).trim();
        const a = idx >= 0 ? line.slice(idx + 1).trim() : "";
        return { q, a };
      })
      .filter(it => it.q !== "");
  }

  if (items.length === 0) return null;

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${assets.background}')` }}
      />
      <motion.div
        className="relative z-10 w-full max-w-md mx-auto px-8 py-12"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7 }}
      >
        <h2 className="font-serif text-2xl italic text-center text-[var(--color-primary)] mb-8">{title}</h2>
        <div className="space-y-5">
          {items.map((it, i) => (
            <div key={i} className="text-center">
              <p className="font-serif font-semibold text-[var(--color-primary)]">{it.q}</p>
              {it.a && <p className="font-serif text-sm text-[var(--color-text)] mt-1 whitespace-pre-line">{it.a}</p>}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default FaqBlock;
