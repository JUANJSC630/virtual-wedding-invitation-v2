import { SectionErrorBoundary } from "@/components/ErrorBoundary";

import { SECTION_REGISTRY } from "./registry";
import { BlockInstance } from "./types";

/**
 * Renderiza un array de bloques en orden. Filtra los deshabilitados y los tipos
 * desconocidos (forward-compat: un tipo nuevo aún no registrado se ignora en
 * vez de romper). Cada bloque va envuelto en su propio error boundary.
 */
export function BlockRenderer({ blocks }: { blocks: BlockInstance[] }) {
  return (
    <>
      {blocks
        .filter(b => b.enabled)
        .map(b => {
          const entry = SECTION_REGISTRY[b.type];
          if (!entry) return null;
          const Block = entry.component;
          return (
            <SectionErrorBoundary key={b.id}>
              <Block config={b.config ?? {}} />
            </SectionErrorBoundary>
          );
        })}
    </>
  );
}
