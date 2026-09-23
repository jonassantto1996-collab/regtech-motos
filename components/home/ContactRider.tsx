"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export default function ContactRider() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        node.classList.remove("translate-x-10", "scale-[0.98]", "opacity-0");
        node.classList.add("translate-x-0", "scale-100", "opacity-100");
        observer.disconnect();
      },
      { threshold: 0.25 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-[30rem] overflow-hidden bg-[#0d3bb8] sm:min-h-[36rem] lg:min-h-full">
      <div
        ref={ref}
        className="absolute inset-0 translate-x-10 scale-[0.98] opacity-0 transition-all duration-1000 ease-out motion-reduce:translate-x-0 motion-reduce:scale-100 motion-reduce:opacity-100"
      >
        <Image
          src="/regtech-rider.webp"
          alt="Personagem Regtech Motors montado em uma moto elétrica"
          fill
          className="object-contain object-bottom"
          sizes="(max-width: 1023px) 100vw, 46vw"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-blue-950/20"
      />
      <div className="absolute left-5 top-5 max-w-[12rem] border-l border-cyan-300/60 pl-3 sm:left-8 sm:top-8">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-cyan-200">
          Regtech Motors
        </p>
        <p className="mt-2 text-sm font-medium leading-5 text-white/90">
          Sempre mais perto de você.
        </p>
      </div>
    </div>
  );
}
