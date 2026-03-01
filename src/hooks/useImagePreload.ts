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

    let loadedImages = 0;
    const images: HTMLImageElement[] = [];

    const delayTimer = setTimeout(() => {
      const handleImageLoad = () => {
        loadedImages++;
        setLoadedCount(loadedImages);

        if (loadedImages === imageSources.length) {
          setImagesLoaded(true);
          onLoadComplete?.();
        }
      };

      imageSources.forEach(src => {
        const img = new Image();
        img.onload = handleImageLoad;
        img.onerror = handleImageLoad;
        img.src = src;
        images.push(img);
      });
    }, delay);

    return () => {
      clearTimeout(delayTimer);
      images.forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [imageSources, delay, onLoadComplete]);

  return {
    imagesLoaded,
    loadedCount,
    totalImages: imageSources.length,
    loadingProgress: imageSources.length > 0 ? (loadedCount / imageSources.length) * 100 : 100,
  } as UseImagePreloadReturn;
};
