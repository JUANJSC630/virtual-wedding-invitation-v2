import { useEffect, useRef, useState } from "react";

import type Konva from "konva";
import { Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";

import { TableWithPeople, VenueElementRow } from "@/services/seating-service";

interface Props {
  tables: TableWithPeople[];
  /** Se llama UNA vez, al soltar. Durante el arrastre el movimiento es local. */
  onMove: (id: string, x: number, y: number) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Expone el escenario para poder exportarlo a imagen. */
  stageRef?: React.MutableRefObject<Konva.Stage | null>;
  /** Pista, escenario, barra… Se dibujan DEBAJO de las mesas. */
  venue?: VenueElementRow[];
  onMoveVenue?: (id: string, x: number, y: number) => void;
}

/**
 * Cada elemento del salón tiene su color y su nombre por defecto. Se distinguen
 * a simple vista porque su posición condiciona dónde conviene sentar a quién:
 * los mayores lejos de los altavoces, las sillas de ruedas cerca de los bordes.
 */
const VENUE = {
  pista:     { label: "Pista de baile", color: "#8b5cf6" },
  escenario: { label: "Escenario / DJ",  color: "#0ea5e9" },
  barra:     { label: "Barra",           color: "#f59e0b" },
  entrada:   { label: "Entrada",         color: "#10b981" },
  buffet:    { label: "Buffet",          color: "#ec4899" },
  otro:      { label: "Zona",            color: "#64748b" },
} as const;

const LIENZO = { width: 1400, height: 950 };
const REJILLA = 25;
const IMAN = 8; // distancia a la que una mesa se alinea con otra
/**
 * El tamaño dibujado depende de la CAPACIDAD: una mesa de 12 tiene que verse más
 * grande que una de 4, o el plano no sirve para entender el salón de un vistazo.
 * En una mesa redonda los comensales van por el perímetro, así que el radio
 * crece con el número de sitios; en una rectangular crece el largo.
 */
const RECT_ALTO = 78;
const radioDe = (capacity: number) => 30 + Math.max(2, capacity) * 3.5;
const anchoRectDe = (capacity: number) => 60 + Math.max(2, capacity) * 11;

const COLORES = {
  libre: "#466691",
  llena: "#d97706",
  excedida: "#dc2626",
};

/** Media dimensión de la mesa, para calcular sus bordes. */
const medio = (t: TableWithPeople) =>
  t.shape === "rect"
    ? { x: anchoRectDe(t.capacity) / 2, y: RECT_ALTO / 2 }
    : { x: radioDe(t.capacity), y: radioDe(t.capacity) };

/**
 * Plano del salón con Konva.
 *
 * Se pasó de SVG a canvas al pedir calidad de edición: Konva trae arrastre,
 * zoom con rueda y pellizco, y exportación a imagen de alta resolución sin
 * reimplementar nada. La accesibilidad que se pierde al dibujar en canvas la
 * cubre el modo lista, que hace lo mismo con controles nativos.
 * Ver ARQUITECTURA_MESAS.md §4.
 */
export const SeatingPlan: React.FC<Props> = ({
  tables, onMove, selectedId, onSelect, stageRef, venue = [], onMoveVenue,
}) => {
  const contenedor = useRef<HTMLDivElement>(null);
  const localStage = useRef<Konva.Stage | null>(null);
  const [ancho, setAncho] = useState(900);
  const [vista, setVista] = useState({ x: 0, y: 0, escala: 1 });
  /** Guías de alineación que se pintan mientras se arrastra. */
  const [guias, setGuias] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });

  // El lienzo se adapta al ancho disponible; la altura mantiene la proporción.
  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setAncho(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const alto = Math.round((ancho * LIENZO.height) / LIENZO.width);
  const base = ancho / LIENZO.width;

  const setStage = (node: Konva.Stage | null) => {
    localStage.current = node;
    if (stageRef) stageRef.current = node;
  };

  /** Zoom con rueda, centrado en el puntero. */
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = localStage.current;
    if (!stage) return;
    const puntero = stage.getPointerPosition();
    if (!puntero) return;

    const escalaVieja = vista.escala;
    const dir = e.evt.deltaY > 0 ? -1 : 1;
    const escala = Math.min(3, Math.max(0.4, escalaVieja * (dir > 0 ? 1.08 : 1 / 1.08)));

    // El punto bajo el cursor debe quedarse donde está.
    const mundo = {
      x: (puntero.x - vista.x) / escalaVieja,
      y: (puntero.y - vista.y) / escalaVieja,
    };
    setVista({ escala, x: puntero.x - mundo.x * escala, y: puntero.y - mundo.y * escala });
  };

  /**
   * Imán: redondea a la rejilla y, si hay otra mesa casi alineada, se alinea con
   * ella exactamente. Devuelve también las guías a dibujar.
   */
  const imantar = (id: string, x: number, y: number) => {
    let sx = Math.round(x / REJILLA) * REJILLA;
    let sy = Math.round(y / REJILLA) * REJILLA;
    const v: number[] = [];
    const h: number[] = [];

    for (const otra of tables) {
      if (otra.id === id) continue;
      if (Math.abs(otra.x - x) < IMAN) {
        sx = otra.x;
        v.push(otra.x);
      }
      if (Math.abs(otra.y - y) < IMAN) {
        sy = otra.y;
        h.push(otra.y);
      }
    }
    return { x: sx, y: sy, v, h };
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Arrastra las mesas para colocarlas. Rueda o pellizco para acercar; arrastra el fondo
        para desplazarte. Se alinean solas con la rejilla y con las demás mesas.
      </p>

      <div ref={contenedor} className="overflow-hidden rounded-lg border bg-muted/20">
        <Stage
          ref={setStage}
          width={ancho}
          height={alto}
          scaleX={base * vista.escala}
          scaleY={base * vista.escala}
          x={vista.x}
          y={vista.y}
          draggable
          onWheel={handleWheel}
          onDragEnd={e => {
            // Solo el arrastre del propio escenario mueve la vista.
            if (e.target === e.currentTarget) {
              setVista(v => ({ ...v, x: e.target.x(), y: e.target.y() }));
            }
          }}
          onMouseDown={e => {
            if (e.target === e.currentTarget) onSelect(null);
          }}
          onTouchStart={e => {
            if (e.target === e.currentTarget) onSelect(null);
          }}
        >
          <Layer listening={false}>
            {/* Rejilla de referencia */}
            {Array.from({ length: Math.ceil(LIENZO.width / 50) + 1 }, (_, i) => (
              <Line key={`v${i}`} points={[i * 50, 0, i * 50, LIENZO.height]} stroke="#0f172a" strokeWidth={0.5} opacity={0.07} />
            ))}
            {Array.from({ length: Math.ceil(LIENZO.height / 50) + 1 }, (_, i) => (
              <Line key={`h${i}`} points={[0, i * 50, LIENZO.width, i * 50]} stroke="#0f172a" strokeWidth={0.5} opacity={0.07} />
            ))}
            {/* Guías de alineación, solo mientras se arrastra */}
            {guias.v.map(x => (
              <Line key={`gv${x}`} points={[x, 0, x, LIENZO.height]} stroke="#bfa15a" strokeWidth={1.5} dash={[6, 6]} />
            ))}
            {guias.h.map(y => (
              <Line key={`gh${y}`} points={[0, y, LIENZO.width, y]} stroke="#bfa15a" strokeWidth={1.5} dash={[6, 6]} />
            ))}
          </Layer>

          {/* El salón va DEBAJO: es el fondo sobre el que se colocan las mesas. */}
          <Layer>
            {venue.map(el => {
              const meta = VENUE[el.kind] ?? VENUE.otro;
              return (
                <Group
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  draggable={Boolean(onMoveVenue)}
                  onDragMove={e => {
                    // Imán a la rejilla y, como en las mesas, sin salirse del
                    // lienzo: un elemento fuera de vista no se puede recuperar.
                    const x = Math.round(e.target.x() / REJILLA) * REJILLA;
                    const y = Math.round(e.target.y() / REJILLA) * REJILLA;
                    e.target.position({
                      x: Math.max(0, Math.min(LIENZO.width - el.width, x)),
                      y: Math.max(0, Math.min(LIENZO.height - el.height, y)),
                    });
                  }}
                  onDragEnd={e => onMoveVenue?.(el.id, Math.round(e.target.x()), Math.round(e.target.y()))}
                >
                  <Rect
                    width={el.width}
                    height={el.height}
                    cornerRadius={8}
                    fill={meta.color}
                    opacity={0.12}
                    stroke={meta.color}
                    strokeWidth={2}
                    dash={[10, 6]}
                    perfectDrawEnabled={false}
                  />
                  <Text
                    text={el.label || meta.label}
                    fontSize={16}
                    fontStyle="600"
                    fill={meta.color}
                    width={el.width}
                    height={el.height}
                    align="center"
                    verticalAlign="middle"
                    listening={false}
                  />
                </Group>
              );
            })}
          </Layer>

          <Layer>
            {tables.map(table => {
              const ocupadas = table.attendees.length;
              const color =
                ocupadas > table.capacity
                  ? COLORES.excedida
                  : ocupadas >= table.capacity
                    ? COLORES.llena
                    : COLORES.libre;
              const sel = selectedId === table.id;
              const m = medio(table);

              return (
                <Group
                  key={table.id}
                  x={table.x}
                  y={table.y}
                  draggable
                  onDragStart={() => onSelect(table.id)}
                  dragBoundFunc={pos => pos}
                  onDragMove={e => {
                    // El movimiento es LOCAL: nada de red mientras se arrastra.
                    const { x, y, v, h } = imantar(table.id, e.target.x(), e.target.y());
                    const cx = Math.max(m.x, Math.min(LIENZO.width - m.x, x));
                    const cy = Math.max(m.y, Math.min(LIENZO.height - m.y, y));
                    e.target.position({ x: cx, y: cy });
                    setGuias({ v, h });
                  }}
                  onDragEnd={e => {
                    setGuias({ v: [], h: [] });
                    // Se guarda UNA vez, al soltar.
                    onMove(table.id, Math.round(e.target.x()), Math.round(e.target.y()));
                  }}
                  onClick={() => onSelect(table.id)}
                  onTap={() => onSelect(table.id)}
                >
                  {table.shape === "rect" ? (
                    <Rect
                      x={-anchoRectDe(table.capacity) / 2}
                      y={-RECT_ALTO / 2}
                      width={anchoRectDe(table.capacity)}
                      height={RECT_ALTO}
                      cornerRadius={10}
                      fill={color}
                      opacity={sel ? 0.4 : 0.2}
                      stroke={color}
                      strokeWidth={sel ? 3 : 2}
                      shadowColor={color}
                      shadowBlur={sel ? 16 : 0}
                      perfectDrawEnabled={false}
                    />
                  ) : (
                    <Circle
                      radius={radioDe(table.capacity)}
                      fill={color}
                      opacity={sel ? 0.4 : 0.2}
                      stroke={color}
                      strokeWidth={sel ? 3 : 2}
                      shadowColor={color}
                      shadowBlur={sel ? 16 : 0}
                      perfectDrawEnabled={false}
                    />
                  )}
                  <Text
                    text={table.name}
                    fontSize={17}
                    fontStyle="600"
                    fill="#0f172a"
                    width={m.x * 2}
                    offsetX={m.x}
                    offsetY={10}
                    align="center"
                    listening={false}
                  />
                  <Text
                    text={`${ocupadas}/${table.capacity}`}
                    fontSize={15}
                    fill={color}
                    width={m.x * 2}
                    offsetX={m.x}
                    offsetY={-10}
                    align="center"
                    listening={false}
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setVista({ x: 0, y: 0, escala: 1 })}
          className="min-h-11 touch-manipulation rounded-md border px-3 text-sm hover:bg-muted sm:min-h-9"
        >
          Centrar vista
        </button>
        <span className="text-xs text-muted-foreground">Zoom {Math.round(vista.escala * 100)}%</span>
      </div>

      {selectedId && (() => {
        const t = tables.find(x => x.id === selectedId);
        if (!t) return null;
        return (
          <div className="rounded-lg border bg-card p-3">
            <p className="font-medium">
              {t.name}{" "}
              <span className="font-normal text-muted-foreground">
                {t.attendees.length}/{t.capacity}
              </span>
            </p>
            {t.attendees.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">Nadie sentado todavía.</p>
            ) : (
              <>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.attendees.filter(a => a.isPrimary).length} invitados +{" "}
                  {t.attendees.filter(a => !a.isPrimary).length} acompañantes
                </p>
                <ul className="mt-1 space-y-0.5 text-sm">
                  {[...t.attendees]
                    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
                    .map(a => (
                      <li key={a.id} className="flex items-center gap-1.5">
                        <span
                          className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                            a.isPrimary ? "bg-primary" : "bg-muted-foreground/40"
                          }`}
                          aria-hidden
                        />
                        <span className="truncate">{a.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {a.isPrimary ? "invitado" : "acomp."}
                        </span>
                      </li>
                    ))}
                </ul>
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
};
