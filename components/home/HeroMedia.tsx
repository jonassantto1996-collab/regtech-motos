"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (!videoSources) return;

    const video = videoRef.current;
    if (!video) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const markReady = () => {
      if (video.readyState >= 2) setVideoReady(true);
    };

    const ensurePlayback = () => {
      if (document.visibilityState !== "visible") return;

      // Mantém o mesmo frame do próprio vídeo para usuários com redução de
      // movimento, em vez de trocar por uma imagem de produto diferente.
      if (motionPreference.matches) {
        video.pause();
        markReady();
        return;
      }

      video.muted = true;
      const attempt = video.play();

      if (attempt) {
        attempt.catch(() => {
          if (retryTimer) clearTimeout(retryTimer);
          retryTimer = setTimeout(() => {
            if (document.visibilityState === "visible" && !motionPreference.matches) {
              void video.play().catch(() => undefined);
            }
          }, 180);
        });
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") ensurePlayback();
    };

    const handlePageShow = () => ensurePlayback();
    const handleCanPlay = () => {
      markReady();
      ensurePlayback();
    };

    video.addEventListener("loadeddata", markReady);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("playing", markReady);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);
    motionPreference.addEventListener("change", ensurePlayback);

    markReady();
    ensurePlayback();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      video.removeEventListener("loadeddata", markReady);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("playing", markReady);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
      motionPreference.removeEventListener("change", ensurePlayback);
    };
  }, [videoSources]);

  if (!videoSources) {
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
      ref={videoRef}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150 ${videoReady ? "opacity-100" : "opacity-0"} ${className ?? ""}`}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      controlsList="nodownload noremoteplayback"
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
