import React, { useEffect, useState } from "react";

import { AlertCircle, Heart, User } from "lucide-react";

import { Guest } from "@/types";

import { useValidateGuestCode } from "@/hooks/useGuests";

import { Button } from "@/components/ui/button";

interface GuestCodeEntryProps {
  onValidGuest: (code: string, guest: Guest) => void;
}

const GuestCodeEntry: React.FC<GuestCodeEntryProps> = ({ onValidGuest }) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  const validateMutation = useValidateGuestCode();

  // Cargar código desde localStorage al montar el componente
  useEffect(() => {
    const savedCode = localStorage.getItem("guestCode");
    if (savedCode) {
      setCode(savedCode);
    }
  }, []);

  // Mostrar mensaje de código guardado por 5 segundos
  useEffect(() => {
    if (code && localStorage.getItem("guestCode") === code && !error) {
      setShowSavedMsg(true);
      const timer = setTimeout(() => setShowSavedMsg(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowSavedMsg(false);
    }
    return undefined;
  }, [code, error]);

  setTimeout(() => {
    if (error) setError("");
  }, 5000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Por favor ingresa tu código de invitación");
      return;
    }

    try {
      const result = await validateMutation.mutateAsync(code.trim().toUpperCase());

      if (result.valid && result.guest) {
        // Guardar código en localStorage para futuros usos
        localStorage.setItem("guestCode", code.trim().toUpperCase());

        // Registrar acceso del guest
        try {
          await fetch("/api/guests/access", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestCode: code.trim().toUpperCase() }),
          });
        } catch (accessError) {
          console.warn("No se pudo registrar el acceso:", accessError);
        }

        // Proceder con el código válido y datos del guest
        onValidGuest(code.trim().toUpperCase(), result.guest);
      } else {
        setError(result.error || "Código de invitación no válido");
      }
    } catch (err) {
      setError("Error al validar el código. Por favor intenta de nuevo.");
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Imagen de fondo principal (foto) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/photos/98d53fe4-1b94-4620-ac85-0775d0cf6574.png')`,
        }}
      />

      {/* Overlay para oscurecer la foto */}
      <div className="absolute inset-0 bg-white/10" />

      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        <div className="bg-[#a3977b]/30 backdrop-blur rounded-2xl shadow-2xl p-8 text-center">
          {/* Título */}
          <h1 className="text-xl font-bold mb-1">
            ¡NOS ENCANTARÍA QUE SEAS PARTE DE ESTE DÍA TAN ESPECIAL!
          </h1>

          <p className="mb-6">Ingresá tu código para continuar:</p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Ej: AYP001"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c2a86c] focus:border-transparent text-center text-lg font-mono tracking-wider"
                maxLength={10}
                autoCapitalize="characters"
                disabled={validateMutation.isPending}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {showSavedMsg && (
              <div className="text-xs text-green-700 bg-green-50 p-2 rounded-lg">
                ✓ Código guardado anteriormente
              </div>
            )}

            <Button
              type="submit"
              className="w-full !py-4 !bg-[#466691] hover:!bg-[#3b5170]  !text-white !rounded-full"
              disabled={validateMutation.isPending}
            >
              {validateMutation.isPending ? "Validando..." : "Ver Invitación"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default GuestCodeEntry;
