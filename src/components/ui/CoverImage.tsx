import { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

// Global cache so images never re-show skeleton after loading once
const loadedSrcs = new Set<string>();

interface CoverImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export function CoverImage({ src, alt, className, imgClassName, onError }: CoverImageProps) {
  const alreadyCached = loadedSrcs.has(src);
  const [loaded, setLoaded] = useState(alreadyCached);
  const prevSrc = useRef(src);

  useEffect(() => {
    if (src !== prevSrc.current) {
      prevSrc.current = src;
      if (loadedSrcs.has(src)) {
        setLoaded(true);
      } else {
        setLoaded(false);
      }
    }
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden bg-bg-card", className)}>
      {/* Skeleton */}
      {!loaded && (
        <div className="absolute inset-0 animate-shimmer shimmer-bg" />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          imgClassName
        )}
        onLoad={() => {
          loadedSrcs.add(src);
          setLoaded(true);
        }}
        onError={(e) => {
          setLoaded(true);
          onError?.(e);
        }}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
