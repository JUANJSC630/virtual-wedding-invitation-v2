import { useRef, useState } from "react";

import { TableWithPeople } from "@/services/seating-service";

interface Props {
  tables: TableWithPeople[];
  onMove: (id: string, x: number, y: number) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const LIENZO = { width: 1000, height: 700 };
const RADIO_REDONDA = 55;
const RECT = { w: 130, h: 70 };

/**
 * Modo plano: el salón visto desde arriba, con las mesas colocables.
 *
 * En SVG y no en canvas a propósito: se conserva la accesibilidad, el texto es
 * seleccionable, se estila con Tailwind y se imprime bien. Para 12–30 mesas
 * sobra. Ver ARQUITECTURA_MESAS.md §4.
 *
 * El arrastre se implementa con eventos de puntero nativos —que cubren ratón y
 * dedo con el mismo código— en vez de con @dnd-kit: aquí no hay listas ni zonas
 * de destino, solo una coordenada libre dentro del lienzo.
 */
export const SeatingPlan: React.FC<Props> = ({ tables, onMove, selectedId, onSelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  /** Pasa las coordenadas del puntero al sistema del SVG. */
  const toSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * LIENZO.width,
      y: ((clientY - rect.top) / rect.height) * LIENZO.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragging(id);
    onSelect(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const p = toSvg(e.clientX, e.clientY);
    if (!p) return;
    // Se mantiene dentro del lienzo para que ninguna mesa se pierda de vista.
    onMove(
      dragging,
      Math.max(RADIO_REDONDA, Math.min(LIENZO.width - RADIO_REDONDA, p.x)),
      Math.max(RADIO_REDONDA, Math.min(LIENZO.height - RADIO_REDONDA, p.y))
    );
  };

  const endDrag = () => setDragging(null);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Arrastra las mesas para colocarlas como está el salón. Toca una para ver quién se sienta.
      </p>
      <div className="overflow-x-auto rounded-lg border bg-muted/30">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${LIENZO.width} ${LIENZO.height}`}
          className="h-auto w-full min-w-[560px] touch-none select-none"
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          role="application"
          aria-label="Plano de mesas"
        >
          <defs>
            <pattern id="cuadricula" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
            </pattern>
          </defs>
          <rect width={LIENZO.width} height={LIENZO.height} fill="url(#cuadricula)" />

          {tables.map(table => {
            const ocupadas = table.attendees.length;
            const llena = ocupadas >= table.capacity;
            const excedida = ocupadas > table.capacity;
            const seleccionada = selectedId === table.id;
            const color = excedida
              ? "hsl(var(--destructive))"
              : llena
                ? "hsl(38 92% 50%)"
                : "hsl(var(--primary))";

            return (
              <g
                key={table.id}
                transform={`translate(${table.x || LIENZO.width / 2}, ${table.y || LIENZO.height / 2})`}
                onPointerDown={e => handlePointerDown(e, table.id)}
                className="cursor-grab active:cursor-grabbing"
                tabIndex={0}
                role="button"
                aria-label={`${table.name}, ${ocupadas} de ${table.capacity}`}
              >
                {table.shape === "rect" ? (
                  <rect
                    x={-RECT.w / 2}
                    y={-RECT.h / 2}
                    width={RECT.w}
                    height={RECT.h}
                    rx={10}
                    fill={color}
                    fillOpacity={seleccionada ? 0.35 : 0.18}
                    stroke={color}
                    strokeWidth={seleccionada ? 3 : 2}
                  />
                ) : (
                  <circle
                    r={RADIO_REDONDA}
                    fill={color}
                    fillOpacity={seleccionada ? 0.35 : 0.18}
                    stroke={color}
                    strokeWidth={seleccionada ? 3 : 2}
                  />
                )}
                <text
                  textAnchor="middle"
                  y={-6}
                  className="pointer-events-none fill-foreground text-[15px] font-semibold"
                >
                  {table.name}
                </text>
                <text
                  textAnchor="middle"
                  y={14}
                  className="pointer-events-none fill-muted-foreground text-[13px]"
                >
                  {ocupadas}/{table.capacity}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {selectedId && (
        <div className="rounded-lg border bg-card p-3">
          {(() => {
            const t = tables.find(x => x.id === selectedId);
            if (!t) return null;
            return (
              <>
                <p className="font-medium">
                  {t.name}{" "}
                  <span className="font-normal text-muted-foreground">
                    {t.attendees.length}/{t.capacity}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t.attendees.length === 0
                    ? "Nadie sentado todavía."
                    : t.attendees.map(a => a.name).join(", ")}
                </p>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
