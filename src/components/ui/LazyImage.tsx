import React from 'react';
import { useLazyImage } from '@/hooks/useLazyImage';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
}

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
  const { imgRef, isLoaded } = useLazyImage(src, { threshold, rootMargin });

  return (
    <img
      ref={imgRef}
      src={isLoaded ? src : placeholder}
      alt={alt}
      className={className}
      style={{
        ...style,
        opacity: isLoaded ? 1 : 0.3,
        transition: 'opacity 0.3s ease',
      }}
      {...props}
    />
  );
};

export default LazyImage;