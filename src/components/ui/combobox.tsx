import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Check, ChevronDown, X } from "lucide-react";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Línea secundaria: "4 libres", "Familia Torres"… */
  hint?: string | undefined;
  disabled?: boolean | undefined;
}

interface Props {
  options: ComboboxOption[];
  value?: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  /** Texto cuando la búsqueda no encuentra nada. */
  emptyText?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  "aria-label"?: string | undefined;
  /** Vacía la selección tras elegir. Útil en "sentar en…", que es una acción. */
  clearOnSelect?: boolean | undefined;
}

/**
 * Quita acentos y pasa a minúsculas para que la búsqueda sea tolerante.
 * En una lista de invitados en español es imprescindible: escribir "jose" tiene
 * que encontrar a "José", y "muñoz" a "Munoz".
 */
const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/**
 * Selector con búsqueda escribiendo en el propio campo.
 *
 * Sustituye a `<select>` donde la lista puede ser larga —94 invitados en un
 * desplegable nativo es inmanejable—. Para listas cortas y fijas (2-4 opciones)
 * el `<select>` nativo sigue siendo mejor en móvil, porque abre el selector del
 * sistema; ahí no se toca.
 *
 * Sigue el patrón ARIA de combobox: `role="combobox"` con `aria-expanded`,
 * `aria-controls` y `aria-activedescendant`, navegación con flechas, Enter para
 * elegir y Escape para cerrar.
 */
export const Combobox: React.FC<Props> = ({
  options,
  value,
  onChange,
  placeholder = "Buscar…",
  emptyText = "Sin resultados",
  disabled,
  className = "",
  "aria-label": ariaLabel,
  clearOnSelect,
}) => {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [resaltado, setResaltado] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  const seleccionada = options.find(o => o.value === value);

  const filtradas = useMemo(() => {
    const q = normalizar(busqueda.trim());
    if (!q) return options;
    // Las coincidencias por el principio van primero: al escribir "an" interesa
    // más "Ana" que "Juan".
    const empieza: ComboboxOption[] = [];
    const contiene: ComboboxOption[] = [];
    for (const o of options) {
      const texto = normalizar(`${o.label} ${o.hint ?? ""}`);
      if (normalizar(o.label).startsWith(q)) empieza.push(o);
      else if (texto.includes(q)) contiene.push(o);
    }
    return [...empieza, ...contiene];
  }, [options, busqueda]);

  // Cerrar al tocar fuera.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierto]);

  // Mantener a la vista la opción resaltada al navegar con el teclado.
  useEffect(() => {
    if (!abierto) return;
    listaRef.current?.querySelector(`#${CSS.escape(`${id}-op-${resaltado}`)}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [resaltado, abierto, id]);

  const abrir = () => {
    if (disabled) return;
    setAbierto(true);
    setBusqueda("");
    setResaltado(Math.max(0, filtradas.findIndex(o => o.value === value)));
  };

  const elegir = (opcion: ComboboxOption) => {
    if (opcion.disabled) return;
    onChange(opcion.value);
    setAbierto(false);
    setBusqueda("");
    if (clearOnSelect) inputRef.current?.blur();
  };

  const teclas = (e: React.KeyboardEvent) => {
    if (!abierto && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      abrir();
      return;
    }
    if (!abierto) return;

    const salto: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };
    if (e.key in salto) {
      e.preventDefault();
      const paso = salto[e.key] ?? 0;
      setResaltado(i => {
        const total = filtradas.length;
        if (total === 0) return 0;
        return (i + paso + total) % total;
      });
      return;
    }
    if (e.key === "Home") { e.preventDefault(); setResaltado(0); return; }
    if (e.key === "End") { e.preventDefault(); setResaltado(filtradas.length - 1); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      const opcion = filtradas[resaltado];
      if (opcion) elegir(opcion);
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); setAbierto(false); setBusqueda(""); }
  };

  return (
    <div ref={contenedor} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={abierto}
          aria-controls={`${id}-lista`}
          aria-autocomplete="list"
          aria-activedescendant={abierto ? `${id}-op-${resaltado}` : undefined}
          aria-label={ariaLabel}
          disabled={disabled}
          // 16px en móvil: por debajo, iOS hace zoom al enfocar.
          className="h-11 w-full touch-manipulation rounded-md border border-input bg-background pl-3 pr-16 text-base shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:text-sm"
          placeholder={seleccionada ? seleccionada.label : placeholder}
          value={abierto ? busqueda : (seleccionada?.label ?? "")}
          onChange={e => {
            if (!abierto) setAbierto(true);
            setBusqueda(e.target.value);
            setResaltado(0);
          }}
          onFocus={abrir}
          onKeyDown={teclas}
        />

        <div className="absolute inset-y-0 right-0 flex items-center">
          {seleccionada && !abierto && !disabled && (
            <button
              type="button"
              onClick={() => { onChange(""); inputRef.current?.focus(); }}
              className="flex h-11 w-9 touch-manipulation items-center justify-center text-muted-foreground hover:text-foreground sm:h-9"
              aria-label="Quitar selección"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="pointer-events-none flex h-11 w-8 items-center justify-center text-muted-foreground sm:h-9">
            <ChevronDown className={`h-4 w-4 transition-transform ${abierto ? "rotate-180" : ""}`} />
          </span>
        </div>
      </div>

      {abierto && (
        <ul
          ref={listaRef}
          id={`${id}-lista`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto overscroll-contain rounded-md border bg-popover p-1 shadow-lg"
        >
          {filtradas.length === 0 && (
            <li className="px-3 py-3 text-sm text-muted-foreground">{emptyText}</li>
          )}
          {filtradas.map((opcion, i) => {
            const activa = i === resaltado;
            const elegida = opcion.value === value;
            return (
              <li
                key={opcion.value}
                id={`${id}-op-${i}`}
                role="option"
                aria-selected={elegida}
                aria-disabled={opcion.disabled}
                onPointerDown={e => { e.preventDefault(); elegir(opcion); }}
                onPointerEnter={() => setResaltado(i)}
                className={`flex min-h-11 cursor-pointer touch-manipulation items-center gap-2 rounded px-3 py-2 text-sm sm:min-h-9 ${
                  opcion.disabled
                    ? "cursor-not-allowed opacity-45"
                    : activa
                      ? "bg-accent text-accent-foreground"
                      : ""
                }`}
              >
                <Check className={`h-4 w-4 shrink-0 ${elegida ? "" : "invisible"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{opcion.label}</span>
                  {opcion.hint && (
                    <span className="block truncate text-xs text-muted-foreground">{opcion.hint}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
