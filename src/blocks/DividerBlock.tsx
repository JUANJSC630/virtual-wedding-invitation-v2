import { useAssets } from "@/context/AssetContext";

import { BlockComponentProps } from "./types";

/**
 * Separador decorativo entre bloques. Config por instancia:
 *   { symbol?: string }  — por defecto un pequeño rombo dorado.
 */
const DividerBlock: React.FC<BlockComponentProps> = ({ config }) => {
  const assets = useAssets();
  const symbol = typeof config?.symbol === "string" && config.symbol ? config.symbol : "✦";

  return (
    <section className="relative flex items-center justify-center py-10 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${assets.background}')` }}
      />
      <div className="relative z-10 flex items-center justify-center gap-4 w-full max-w-xs">
        <span className="h-px flex-1 bg-[var(--color-accent)] opacity-40" />
        <span className="text-[var(--color-accent)] text-xl">{symbol}</span>
        <span className="h-px flex-1 bg-[var(--color-accent)] opacity-40" />
      </div>
    </section>
  );
};

export default DividerBlock;
