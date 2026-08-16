import { motion } from "framer-motion";

import { useAssets } from "@/context/AssetContext";

import { BlockComponentProps } from "./types";

/**
 * Bloque de texto libre — título opcional + párrafo(s). Config por instancia:
 *   { title?: string, text?: string, align?: "center" | "left" }
 */
const TextBlock: React.FC<BlockComponentProps> = ({ config }) => {
  const assets = useAssets();
  const title = typeof config?.title === "string" ? config.title : "";
  const text = typeof config?.text === "string" ? config.text : "";
  const align = config?.align === "left" ? "text-left" : "text-center";

  if (!title && !text) return null;

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${assets.background}')` }}
      />
      <motion.div
        className={`relative z-10 w-full max-w-md mx-auto px-8 py-12 ${align}`}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7 }}
      >
        {title && (
          <h2 className="font-serif text-2xl italic text-[var(--color-primary)] mb-4">{title}</h2>
        )}
        {text && (
          <p className="font-serif text-[var(--color-text)] leading-relaxed whitespace-pre-line">{text}</p>
        )}
      </motion.div>
    </section>
  );
};

export default TextBlock;
