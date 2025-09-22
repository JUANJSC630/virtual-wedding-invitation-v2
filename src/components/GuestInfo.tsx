import React from "react";

import { Heart, Users } from "lucide-react";

import { Guest } from "@/types";

import { Button } from "@/components/ui/button";

interface GuestInfoProps {
  guest: Guest;
  onContinue: () => void;
}

const GuestInfo: React.FC<GuestInfoProps> = ({ guest, onContinue }) => {
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
            <h1 className="text-2xl font-serif font-semibold mb-2">
              {guest.name.split(",").map((name, index) => (
                <div key={index} className="mb-1">
                  {name.trim().toUpperCase()}
                </div>
              ))}
            </h1>
            <p className="text-gray-900 mb-4">
              ¡Esperamos que puedan compartir esta fiesta junto a nosotros!
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

          {/* Botón para continuar */}
          <Button
            onClick={onContinue}
            className="w-full !py-4 !bg-[#466691] hover:!bg-[#3b5170]  !text-white !rounded-full"
          >
            Ver Invitación Completa
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GuestInfo;
