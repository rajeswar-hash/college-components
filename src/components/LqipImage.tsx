import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LqipImageProps {
  src: string;
  alt: string;
  placeholderSrc?: string;
  className?: string;
  imgClassName?: string;
  placeholderClassName?: string;
  loading?: "eager" | "lazy";
  decoding?: "async" | "sync" | "auto";
  fetchPriority?: "high" | "low" | "auto";
  sizes?: string;
}

export function LqipImage({
  src,
  alt,
  placeholderSrc,
  className,
  imgClassName,
  placeholderClassName,
  loading = "lazy",
  decoding = "async",
  fetchPriority = "auto",
  sizes,
}: LqipImageProps) {
  const [loaded, setLoaded] = useState(false);
  const hasSeparatePlaceholder = Boolean(placeholderSrc && placeholderSrc !== src);

  useEffect(() => {
    setLoaded(false);

    if (!src) {
      setLoaded(true);
      return;
    }

    const preloader = new Image();
    preloader.decoding = decoding;
    if (sizes) {
      preloader.sizes = sizes;
    }

    const markLoaded = () => setLoaded(true);
    preloader.onload = markLoaded;
    preloader.onerror = markLoaded;
    preloader.src = src;

    if (preloader.complete) {
      setLoaded(true);
    }

    return () => {
      preloader.onload = null;
      preloader.onerror = null;
    };
  }, [decoding, sizes, src]);

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {hasSeparatePlaceholder && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className={cn(
            "absolute inset-0 h-full w-full scale-110 object-cover blur-2xl saturate-125 transition-opacity duration-500",
            loaded ? "opacity-0" : "opacity-100",
            placeholderClassName,
          )}
        />
      )}
      <div
        className={cn(
          "absolute inset-0 bg-[linear-gradient(110deg,transparent_10%,rgba(255,255,255,0.22)_38%,transparent_66%)] transition-opacity duration-500 dark:bg-[linear-gradient(110deg,transparent_10%,rgba(255,255,255,0.08)_38%,transparent_66%)]",
          loaded ? "opacity-0" : "animate-pulse opacity-100",
        )}
      />
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={cn(
          "relative h-full w-full object-cover transition-[opacity,transform,filter] duration-700",
          loaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-sm scale-[1.02]",
          imgClassName,
        )}
      />
    </div>
  );
}
