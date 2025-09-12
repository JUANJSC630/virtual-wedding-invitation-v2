import { useState, useEffect } from "react";
import InvitationSection1 from "@/components/InvitationSection1";
import InvitationSection2 from "@/components/InvitationSection2";
import InvitationSection3 from "@/components/InvitationSection3";
import InvitationSection4 from "@/components/InvitationSection4";
import InvitationSection5 from "@/components/InvitationSection5";
import {
  Play,
  Pause,
  MapPin,
  Church,
  Users,
  Utensils,
  Music,
  Gift,
  Calendar,
  Heart,
} from "lucide-react";

function App() {

  const [isMounted, setIsMounted] = useState(false);


  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white h-screen w-full">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/fondo.png')`,
          }}
        />
        <div className="relative z-10 text-center p-4">
          <p className="text-xl font-serif text-gray-800">
            Cargando invitación...
          </p>
          <div className="flex justify-center space-x-3 mt-2">
            <div
              className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"
              style={{ animationDelay: "300ms" }}
            ></div>
            <div
              className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"
              style={{ animationDelay: "600ms" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-b from-slate-50 to-white max-w-2xl mx-auto">
      {/* Imagen 1 - Primera sección (Recreada en código) */}
      <InvitationSection1 />

      {/* Imagen 2 - Segunda sección (Recreada en código) */}
      <InvitationSection2 />

      {/* Sección de la foto principal con hojas rasgadas */}
      <InvitationSection3 />

      {/* Imagen 3 - Tercera sección (Recreada en código) */}
      <InvitationSection4 />

      <InvitationSection5 />
      {/* Imagen 5 - Quinta sección */}
      <section className="relative min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/5.png')`,
          }}
        />
      </section>

      {/* Imagen 6 - Sexta sección */}
      <section className="relative min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/6.png')`,
          }}
        />
      </section>

      {/* Imagen 7 - Séptima sección */}
      <section className="relative min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/7.png')`,
          }}
        />
      </section>

      {/* Imagen 8 - Octava sección */}
      <section className="relative min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/8.png')`,
          }}
        />
      </section>

      {/* Imagen 9 - Novena sección */}
      <section className="relative min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/9.png')`,
          }}
        />
      </section>

      {/* Imagen 10 - Décima sección */}
      <section className="relative min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/10.png')`,
          }}
        />
      </section>
    </div>
  );
}

export default App;
