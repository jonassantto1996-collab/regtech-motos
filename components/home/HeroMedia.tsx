"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type HeroVideoSources = {
  desktop: string;
  tablet: string;
  mobile: string;
};

type HeroMediaProps = {
  imageUrl?: string | null;
  imageAlt: string;
  videoSources?: HeroVideoSources | null;
  className?: string;
  priority?: boolean;
};

export default function HeroMedia({
  imageUrl,
  imageAlt,
  videoSources,
  className,
  priority,
}: HeroMediaProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  if (!videoSources || reduceMotion) {
    return imageUrl ? (
      <Image
        src={imageUrl}
        alt={imageAlt}
        fill
        priority={priority}
        className={className}
      />
    ) : null;
  }

  return (
    <video
      className={`absolute inset-0 h-full w-full object-cover ${className ?? ""}`}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={imageUrl ?? undefined}
      aria-hidden="true"
    >
      <source src={videoSources.mobile} media="(max-width: 639px)" type="video/mp4" />
      <source
        src={videoSources.tablet}
        media="(min-width: 640px) and (max-width: 1023px)"
        type="video/mp4"
      />
      <source src={videoSources.desktop} media="(min-width: 1024px)" type="video/mp4" />
    </video>
  );
}
