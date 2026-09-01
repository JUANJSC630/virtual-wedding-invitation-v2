import { createContext, useCallback, useContext, useRef, useState } from "react";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface ConfirmOptions {
  title: string;
  /** Explica la consecuencia. El título hace la pregunta; esto dice qué pasa. */
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** `destructive` pinta el botón en rojo y enfoca Cancelar por defecto. */
  variant?: "default" | "destructive";
}

type Resolver = (ok: boolean) => void;

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

/**
 * Confirmación con el diseño de la app, en vez del `confirm()` del navegador.
 *
 * El nativo muestra "localhost:3000 dice", ignora los estilos, no distingue una
 * acción destructiva de una normal y en móvil aparece pegado al borde superior.
 *
 * Devuelve una promesa para que sustituirlo sea casi literal:
 *   `if (!confirm(txt)) return;`  →  `if (!(await confirmar({ title: txt }))) return;`
 */
export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<Resolver | null>(null);

  const confirmar = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>(resolve => {
      resolver.current = resolve;
    });
  }, []);

  const cerrar = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  };

  const destructiva = options?.variant === "destructive";

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}

      <Dialog
        open={options !== null}
        // Cerrar con Escape o tocando fuera equivale a cancelar: nunca a aceptar.
        onOpenChange={abierto => !abierto && cerrar(false)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-start gap-2 text-left">
              {destructiva && (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
              )}
              <span>{options?.title}</span>
            </DialogTitle>
          </DialogHeader>

          {options?.description && (
            <p className="text-sm text-muted-foreground">{options.description}</p>
          )}

          {/* En móvil se apilan a ancho completo; en escritorio van a la derecha,
              con Cancelar primero para que el destructivo no quede bajo el pulgar. */}
          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => cerrar(false)} className="sm:!w-auto">
              {options?.cancelText ?? "Cancelar"}
            </Button>
            <Button
              variant={destructiva ? "destructive" : "default"}
              onClick={() => cerrar(true)}
              // Una acción destructiva no se autoenfoca: que haya que apuntar.
              autoFocus={!destructiva}
              className="sm:!w-auto"
            >
              {options?.confirmText ?? "Continuar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
};

/** Devuelve una función que abre la confirmación y resuelve a true/false. */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  return ctx;
}
