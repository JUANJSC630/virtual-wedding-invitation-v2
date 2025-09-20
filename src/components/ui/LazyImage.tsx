import React from "react";

import { LazyImageProps } from "@/types";

import { useLazyImage } from "@/hooks/useLazyImage";

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  threshold,
  rootMargin,
  className,
  style,
  ...props
}) => {
  const { imgRef, isLoaded } = useLazyImage(src, {
    ...(threshold !== undefined && { threshold }),
    ...(rootMargin !== undefined && { rootMargin }),
  });

  return (
    <img
      ref={imgRef}
      src={isLoaded ? src : placeholder}
      alt={alt}
      className={className}
      style={{
        ...style,
        opacity: isLoaded ? 1 : 0.3,
        transition: "opacity 0.3s ease",
      }}
      {...props}
    />
  );
};

export default LazyImage;
