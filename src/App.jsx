import { useState, useRef, useEffect, memo } from "react";
import InvitationSection1 from "@/components/InvitationSection1";
import InvitationSection2 from "@/components/InvitationSection2";
import InvitationSection3 from "@/components/InvitationSection3";
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
import { useInView } from "framer-motion";

function App() {
  // Componente separado para el contador para evitar re-renderizados innecesarios
  const CountdownTimer = memo(() => {
    const [timeLeft, setTimeLeft] = useState({
      days: 6,
      hours: 0,
      minutes: 45,
      seconds: 9,
    });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 };
          } else if (prev.minutes > 0) {
            return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
          } else if (prev.hours > 0) {
            return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
          } else if (prev.days > 0) {
            return {
              ...prev,
              days: prev.days - 1,
              hours: 23,
              minutes: 59,
              seconds: 59,
            };
          }
          return prev;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    // Evitar renderizado en el servidor para prevenir errores de hidratación
    if (!mounted) {
      return (
        <div className="space-y-4">
          <p className="text-lg text-gray-800 font-medium">FALTAN</p>
          <div className="flex justify-center gap-2 text-3xl font-light text-blue-400">
            <div className="text-center">
              <span>6</span>
              <span className="text-gray-400">:</span>
            </div>
            <div className="text-center">
              <span>00</span>
              <span className="text-gray-400">:</span>
            </div>
            <div className="text-center">
              <span>45</span>
              <span className="text-gray-400">:</span>
            </div>
            <div className="text-center">
              <span>09</span>
            </div>
          </div>
          <div className="flex justify-center gap-8 text-xs text-gray-500">
            <span>Días</span>
            <span>Horas</span>
            <span>Min</span>
            <span>Seg</span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-lg text-gray-800 font-medium">FALTAN</p>
        <div className="flex justify-center gap-2 text-3xl font-light text-blue-400">
          <div className="text-center">
            <span>{timeLeft.days}</span>
            <span className="text-gray-400">:</span>
          </div>
          <div className="text-center">
            <span>{timeLeft.hours.toString().padStart(2, "0")}</span>
            <span className="text-gray-400">:</span>
          </div>
          <div className="text-center">
            <span>{timeLeft.minutes.toString().padStart(2, "0")}</span>
            <span className="text-gray-400">:</span>
          </div>
          <div className="text-center">
            <span>{timeLeft.seconds.toString().padStart(2, "0")}</span>
          </div>
        </div>
        <div className="flex justify-center gap-8 text-xs text-gray-500">
          <span>Días</span>
          <span>Horas</span>
          <span>Min</span>
          <span>Seg</span>
        </div>
      </div>
    );
  });

  CountdownTimer.displayName = "CountdownTimer";

  // Componente separado para el reproductor de música
  // const MusicPlayer = memo(() => {
  //   const [isPlaying, setIsPlaying] = useState(false);
  //   const [currentTime, setCurrentTime] = useState(0);
  //   const [duration, setDuration] = useState(0);
  //   const audioRef = useRef < HTMLAudioElement > null;

  //   const toggleAudio = () => {
  //     if (audioRef.current) {
  //       if (isPlaying) {
  //         audioRef.current.pause();
  //       } else {
  //         audioRef.current.play().catch(() => {
  //           console.log("error playing audio");
  //         });
  //       }
  //       setIsPlaying(!isPlaying);
  //     }
  //   };

  //   const handleTimeUpdate = () => {
  //     if (audioRef.current) {
  //       setCurrentTime(audioRef.current.currentTime);
  //     }
  //   };

  //   const handleLoadedMetadata = () => {
  //     if (audioRef.current) {
  //       setDuration(audioRef.current.duration);
  //     }
  //   };

  //   const progressPercentage =
  //     duration > 0 ? (currentTime / duration) * 100 : 0;

  //   return (
  //     <div className="space-y-6">
  //       <div className="text-center">
  //         <h3 className="text-lg font-medium text-gray-800 mb-2">
  //           Nuestra Canción
  //         </h3>
  //         <p className="text-sm text-gray-600">Dale play para escuchar</p>
  //       </div>

  //       {/* Barra de progreso mejorada */}
  //       <div className="space-y-2">
  //         <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
  //           <div
  //             className="bg-blue-400 h-full rounded-full transition-all duration-300 ease-out"
  //             style={{ width: `${progressPercentage}%` }}
  //           />
  //         </div>
  //         <div className="flex justify-between text-xs text-gray-500">
  //           <span>
  //             {Math.floor(currentTime / 60)}:
  //             {(currentTime % 60).toFixed(0).padStart(2, "0")}
  //           </span>
  //           <span>
  //             {Math.floor(duration / 60)}:
  //             {(duration % 60).toFixed(0).padStart(2, "0")}
  //           </span>
  //         </div>
  //       </div>

  //       {/* Controles del reproductor */}

  //       <audio
  //         ref={audioRef}
  //         loop
  //         onTimeUpdate={handleTimeUpdate}
  //         onLoadedMetadata={handleLoadedMetadata}
  //       >
  //         <source src="/wedding-song.mp3" type="audio/mpeg" />
  //       </audio>
  //     </div>
  //   );
  // });

  // MusicPlayer.displayName = "MusicPlayer";
  // Estado para controlar si estamos en el cliente
  const [isMounted, setIsMounted] = useState(false);

  // Efecto para actualizar el estado cuando estamos en el cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // const fadeIn = {
  //   hidden: { opacity: 0 },
  //   visible: {
  //     opacity: 1,
  //     transition: { duration: 0.8, ease: "easeOut" },
  //   },
  // };

  const AnimatedSection = ({
    children,
    variant = fadeInUp,
    className = "",
  }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, {
      once: true,
      margin: "-50px",
      amount: 0.3,
    });

    return (
      <motion.section
        ref={ref}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={variant}
        className={className}
      >
        {children}
      </motion.section>
    );
  };
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

      {/* Imagen 3 - Tercera sección (Recreada en código) */}
      <InvitationSection3 />

      {/* Imagen 4 - Cuarta sección */}
      <section className="relative min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/4.png')`,
          }}
        />
      </section>

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
