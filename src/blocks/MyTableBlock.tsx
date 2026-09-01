import { useEffect, useState } from "react";

import { motion } from "framer-motion";

import { useAssets } from "@/context/AssetContext";
import { useGuestContext } from "@/context/GuestContext";

import { BlockComponentProps } from "./types";

interface Seat {
  attendeeId: string;
  attendeeName: string;
  tableName: string;
  tablemates: string[];
}

/**
 * "Tu mesa" — dónde se sienta el invitado y con quién.
 *
 * La tendencia de 2026 es que el plano deje de ser un cartel de acrílico en la
 * entrada y se consulte desde el móvil. Aquí sale casi gratis: ya existe una
 * página por invitado autenticada por código, así que esto es un bloque más.
 * Ver INVESTIGACION_SISTEMA_COMPLETO_2026.md §3.2.
 *
 * Config por instancia: { title?: string }
 *
 * Si el organizador todavía no ha repartido las mesas, el bloque NO se dibuja:
 * es peor enseñar "sin mesa asignada" que no enseñar nada.
 */
const MyTableBlock: React.FC<BlockComponentProps> = ({ config }) => {
  const assets = useAssets();
  const { code, eventSlug } = useGuestContext();
  const [seats, setSeats] = useState<Seat[] | null>(null);

  const title = typeof config?.title === "string" && config.title ? config.title : "Tu mesa";

  useEffect(() => {
    if (!code || code === "PREVIEW") {
      // En vista previa no hay invitado real: se muestra un ejemplo.
      setSeats(
        code === "PREVIEW"
          ? [{
              attendeeId: "preview",
              attendeeName: "Vista Previa",
              tableName: "Mesa 7",
              tablemates: ["Ana Torres", "Luis Torres"],
            }]
          : []
      );
      return;
    }
    let vigente = true;
    fetch(`/api/guests/table/${encodeURIComponent(code)}?eventSlug=${encodeURIComponent(eventSlug)}`)
      .then(res => (res.ok ? res.json() : { seats: [] }))
      .then(data => vigente && setSeats(Array.isArray(data.seats) ? data.seats : []))
      .catch(() => vigente && setSeats([]));
    return () => {
      vigente = false;
    };
  }, [code, eventSlug]);

  // Ni mientras carga ni sin mesa asignada: el bloque desaparece.
  if (!seats || seats.length === 0) return null;

  /** Una sola mesa para toda la invitación es el caso normal. */
  const mesaUnica = new Set(seats.map(s => s.tableName)).size === 1;

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${assets.background}')` }}
      />
      <motion.div
        className="relative z-10 w-full max-w-md mx-auto px-8 py-12 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7 }}
      >
        <h2 className="font-serif text-3xl text-[var(--color-accent)]">{title}</h2>

        {mesaUnica ? (
          <>
            <p className="mt-6 font-serif text-5xl font-semibold text-[var(--color-primary)]">
              {seats[0]?.tableName}
            </p>
            {seats.length > 1 && (
              <p className="mt-2 font-serif text-sm text-[var(--color-text)]">
                {seats.map(s => s.attendeeName).join(" · ")}
              </p>
            )}
          </>
        ) : (
          // Reparto poco habitual: la invitación quedó en más de una mesa.
          <ul className="mt-6 space-y-3">
            {seats.map(seat => (
              <li key={seat.attendeeId} className="font-serif">
                <span className="text-[var(--color-text)]">{seat.attendeeName}</span>
                <span className="mx-2 text-[var(--color-accent)]">→</span>
                <span className="text-2xl font-semibold text-[var(--color-primary)]">
                  {seat.tableName}
                </span>
              </li>
            ))}
          </ul>
        )}

        {mesaUnica && (seats[0]?.tablemates.length ?? 0) > 0 && (
          <div className="mt-8">
            <p className="font-serif text-sm uppercase tracking-widest text-[var(--color-accent)]">
              Te acompañan
            </p>
            <p className="mt-2 font-serif text-lg leading-relaxed text-[var(--color-primary)]">
              {seats[0]?.tablemates.join(" · ")}
            </p>
          </div>
        )}
      </motion.div>
    </section>
  );
};

export default MyTableBlock;
