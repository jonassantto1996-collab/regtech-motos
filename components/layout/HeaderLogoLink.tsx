"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/layout/BrandLogo";

/**
 * Logo do topo. No celular, a Home já mostra a marca grande no hero,
 * então o logo do topo fica escondido só ali (no computador aparece sempre).
 */
export default function HeaderLogoLink() {
  const isHome = usePathname() === "/";

  return (
    <Link
      href="/"
      aria-label="Regtech Motors — início"
      className={`${isHome ? "hidden sm:inline-flex" : "inline-flex"} flex-none items-center outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-4 focus-visible:ring-offset-blue-950`}
    >
      <BrandLogo priority className="h-8 sm:h-10" />
    </Link>
  );
}
