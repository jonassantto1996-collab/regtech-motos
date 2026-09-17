import Image from "next/image";

type HeroMediaProps = {
  imageUrl: string;
  imageAlt: string;
  className?: string;
  priority?: boolean;
};

/**
 * Mídia de fundo do Hero da Home. Hoje só renderiza a foto real do
 * produto (next/image). É isolada num componente próprio de propósito:
 * quando o material oficial de vídeo do marketing chegar (poster + vídeo
 * desktop + vídeo mobile), a troca por um <video muted playsInline> com
 * fallback de poster e respeito a prefers-reduced-motion acontece só
 * aqui dentro — sem precisar reestruturar o Hero em app/(site)/page.tsx.
 *
 * Não implementa vídeo ainda (fora de escopo desta etapa).
 */
export default function HeroMedia({
  imageUrl,
  imageAlt,
  className,
  priority,
}: HeroMediaProps) {
  return (
    <Image src={imageUrl} alt={imageAlt} fill priority={priority} className={className} />
  );
}
