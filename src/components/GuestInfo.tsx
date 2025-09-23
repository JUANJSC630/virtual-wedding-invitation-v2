import React from "react";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Users } from "lucide-react";

import { Companion, Guest } from "@/types";

import { Button } from "@/components/ui/button";

interface GuestInfoProps {
  guest: Guest;
  onContinue: () => void;
}

// Hook para obtener guest actualizado por código
const useGuestByCode = (code: string) => {
  return useQuery<Guest | null>({
    queryKey: ["guest", "byCode", code],
    queryFn: async () => {
      const response = await fetch(`/api/guests/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      return data.valid ? data.guest : null;
    },
    refetchInterval: 5000, // Actualizar cada 5 segundos
    refetchOnWindowFocus: true,
    staleTime: 1000, // Considerar datos obsoletos después de 1 segundo
  });
};

const GuestInfo: React.FC<GuestInfoProps> = ({ guest: initialGuest, onContinue }) => {
  // Obtener datos actualizados del guest
  const { data: updatedGuest } = useGuestByCode(initialGuest.code);

  // Usar datos actualizados o los iniciales como fallback
  const guest = updatedGuest || initialGuest;
  const totalConfirmed =
    guest.companions.filter(c => c.confirmed).length + (guest.confirmed ? 1 : 0);
  const totalGuests = guest.maxGuests;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Imagen de fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/photos/IMG_0939-cut.jpeg')`,
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-white/10" />

      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        <div className="bg-[#f8eed2]/30 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
          {/* Saludo personalizado */}
          <div className="mb-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl font-serif font-semibold">
                {guest.name.split(",").map((name, index) => (
                  <div key={index} className="mb-1">
                    {name.trim().toUpperCase()}
                  </div>
                ))}
              </span>

              {/* Badge de confirmación */}
              {guest.confirmed && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium border border-green-200">
                  <CheckCircle className="w-4 h-4" />
                  Asistencia Confirmada
                </div>
              )}
            </div>

            <p className="text-gray-900 my-4">
              {guest.confirmed ? (
                <>
                  ¡Gracias por confirmar tu asistencia!
                  <br />
                  Te esperamos en nuestra boda.
                </>
              ) : (
                "¡Esperamos que puedan compartir esta fiesta junto a nosotros!"
              )}
            </p>
          </div>

          {/* Información de invitados */}
          <div className="bg-[#f8f9ff] rounded-lg p-2 mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Users className="w-5 h-5 text-[#466691]" />
              <span className="font-semibold text-[#162b4e]">N° de Invitados:</span>
            </div>
            <div className="text-3xl font-bold text-[#466691]">{totalGuests}</div>
          </div>

          {/* Info expandible de confirmaciones */}
          {guest.confirmed && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="text-sm text-blue-700">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Estado de Confirmaciones</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Invitado principal:</span>
                    <span className="font-medium text-green-600">✓ Confirmado</span>
                  </div>

                  {guest.companions.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>Acompañantes confirmados:</span>
                        <span className="font-medium">
                          {guest.companions.filter(c => c.confirmed).length}/
                          {guest.companions.length}
                        </span>
                      </div>

                      {guest.companions.map((companion, index) => (
                        <div key={companion.id} className="flex justify-between pl-2 opacity-75">
                          <span>• {companion.name}:</span>
                          <span
                            className={`font-medium ${
                              companion.confirmed ? "text-green-600" : "text-amber-600"
                            }`}
                          >
                            {companion.confirmed ? "✓ Confirmado" : "⏳ Pendiente"}
                          </span>
                        </div>
                      ))}
                    </>
                  )}

                  <div className="flex justify-between pt-1 border-t border-blue-200">
                    <span className="font-medium">Total confirmados:</span>
                    <span className="font-bold text-blue-600">
                      {totalConfirmed}/{totalGuests}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón para continuar */}
          <Button
            onClick={onContinue}
            className="w-full !py-4 !bg-[#466691] hover:!bg-[#3b5170] !text-white !rounded-full"
          >
            {guest.confirmed ? "Volver a ver invitación" : "Ver Invitación Completa"}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GuestInfo;
