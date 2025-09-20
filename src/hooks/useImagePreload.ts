import { useEffect, useState } from "react";

import { UseImagePreloadOptions, UseImagePreloadReturn } from "@/types";

export const useImagePreload = (
  imageSources: string[],
  options: UseImagePreloadOptions = {}
): UseImagePreloadReturn => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const { delay = 100, onLoadComplete } = options;

  useEffect(() => {
    if (imageSources.length === 0) {
      setImagesLoaded(true);
      return;
    }

    // Esperar un poco antes de empezar a cargar para evitar bloquear el render
    const delayTimer = setTimeout(() => {
      let loadedImages = 0;

      const handleImageLoad = () => {
        loadedImages++;
        setLoadedCount(loadedImages);

        if (loadedImages === imageSources.length) {
          setImagesLoaded(true);
          onLoadComplete?.();
        }
      };

      // Precargar todas las imágenes
      imageSources.forEach(src => {
        const img = new Image();
        img.onload = handleImageLoad;
        img.onerror = handleImageLoad; // Continuar incluso si hay errores
        img.src = src;
      });
    }, delay);

    return () => clearTimeout(delayTimer);
  }, [imageSources, delay, onLoadComplete]);

  return {
    imagesLoaded,
    loadedCount,
    totalImages: imageSources.length,
    loadingProgress: imageSources.length > 0 ? (loadedCount / imageSources.length) * 100 : 100,
  } as UseImagePreloadReturn;
};
