import Image from "next/image";

/**
 * Logo oficial da Regtech Motors.
 * O arquivo /logo-regtech-motors.png (947×452) tem muita margem transparente;
 * aqui recortamos só a área do desenho (697×188 a partir de x=95, y=125),
 * para o logo aparecer no tamanho certo sem precisar de outro arquivo.
 */
export default function BrandLogo({
  className = "h-10",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={`relative inline-block overflow-hidden ${className}`}
      style={{ aspectRatio: "697 / 188" }}
    >
      <Image
        src="/logo-regtech-motors.png"
        alt="Regtech Motors"
        width={947}
        height={452}
        priority={priority}
        sizes="(max-width: 640px) 240px, 320px"
        className="absolute max-w-none"
        style={{
          width: "135.868%",
          height: "auto",
          left: "-13.630%",
          top: "-66.489%",
        }}
      />
    </span>
  );
}
