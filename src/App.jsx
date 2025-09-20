import { useState, useEffect } from "react";
import InvitationSection1 from "@/components/InvitationSection1";
import InvitationSection2 from "@/components/InvitationSection2";
import InvitationSection3 from "@/components/InvitationSection3";
import InvitationSection4 from "@/components/InvitationSection4";
import InvitationSection5 from "@/components/InvitationSection5";
import InvitationSection6 from "@/components/InvitationSection6";
import InvitationSection7 from "@/components/InvitationSection7";
import InvitationSection8 from "@/components/InvitationSection8";
import InvitationSection9 from "@/components/InvitationSection9";

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
          <div className="flex justify-center gap-2 mt-2">
            <div
              className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"
              style={{ animationDelay: "300ms" }}
            ></div>
            <div
              className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"
              style={{ animationDelay: "600ms" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col justify-center items-center bg-white">
      <div className="max-w-2xl mx-auto">
        <InvitationSection1 />
        <InvitationSection2 />
        <InvitationSection3 />
        <InvitationSection4 />
        <InvitationSection5 />
        <InvitationSection6 />
        <InvitationSection9 />
        <InvitationSection7 />
        <InvitationSection8 />
      </div>
    </div>
  );
}

export default App;
