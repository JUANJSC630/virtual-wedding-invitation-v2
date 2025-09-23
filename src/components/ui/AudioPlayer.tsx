import React, { useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

import { AudioPlayerProps } from "@/types";

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Eventos para sincronizar el estado
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);

    // Agregar event listeners
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    // Cleanup
    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  const togglePlay = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          await audioRef.current.play();
        }
      } catch (error) {
        console.error("Error al reproducir audio:", error);
        setIsPlaying(false);
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current || !duration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div>
      {/* Contenedor principal con flexibilidad para reorganizar */}
      <div className="flex flex-col items-center gap-4">
        {/* Imagen de onda de audio con animación */}
        <div className="w-full flex justify-center relative">
          <motion.div
            animate={
              isPlaying
                ? {
                    scale: [1, 1.02, 1],
                    opacity: [0.7, 1, 0.7],
                  }
                : {
                    scale: 1,
                    opacity: 0.7,
                  }
            }
            transition={{
              duration: 2,
              repeat: isPlaying ? Infinity : 0,
              ease: "easeInOut",
            }}
            className="relative"
          >
            <img
              src="/onda-audio.png"
              alt="Audio wave visualization for song player"
              loading="lazy"
              className="object-contain mx-auto"
            />

            {/* Efecto de ondas adicionales cuando está reproduciéndose */}
            {isPlaying && (
              <>
                <motion.div
                  className="absolute inset-0 bg-[#466691]/10 rounded-full"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.1, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2,
                  }}
                />
                <motion.div
                  className="absolute inset-0 bg-[#466691]/5 rounded-full"
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.2, 0.05, 0.2],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                />
              </>
            )}
          </motion.div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full flex flex-col gap-1">
          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            className="relative w-full h-2 bg-gray-300 rounded-full overflow-hidden cursor-pointer"
          >
            <div
              className="absolute top-0 left-0 h-full bg-[#162b4e] rounded-full transition-all duration-100"
              style={{
                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controles y título */}
        <div className="flex items-center justify-center gap-4 w-full">
          {/* Botones de navegación */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="!rounded-full !flex !items-center !justify-center !w-10 !h-10 !border !border-[#162b4e] !bg-[#162b4e]/10 !hover:bg-[#162b4e]/20 !transition-colors"
            aria-label="Previous track"
          >
            <SkipBack size={20} className="text-[#162b4e]" />
          </motion.button>

          {/* Botón de reproducción */}
          <motion.button
            onClick={togglePlay}
            animate={
              isPlaying
                ? {
                    scale: [1, 1.05, 1],
                  }
                : {
                    scale: 1,
                  }
            }
            transition={{
              duration: 1.8,
              repeat: isPlaying ? Infinity : 0,
              ease: "easeInOut",
            }}
            className="!rounded-full !flex !items-center !justify-center !w-10 !h-10 !border !border-[#162b4e] !bg-[#162b4e] !hover:bg-[#162b4e]/80 !transition-colors"
            aria-label={isPlaying ? "Pause song" : "Play song"}
          >
            {isPlaying ? (
              <Pause size={20} className="text-white" />
            ) : (
              <Play size={20} className="text-white ml-0.5" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="!rounded-full !flex !items-center !justify-center !w-10 !h-10 !border !border-[#162b4e] !bg-[#162b4e]/10 !hover:bg-[#162b4e]/20 !transition-colors"
            aria-label="Next track"
          >
            <SkipForward size={20} className="text-[#162b4e]" />
          </motion.button>
        </div>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
};

export default AudioPlayer;
