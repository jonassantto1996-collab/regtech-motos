export default function ContactRider() {
  return (
    <div className="relative min-h-[30rem] overflow-hidden bg-[#0d3bb8] sm:min-h-[36rem] lg:min-h-full">
      <img
        src="/regtech-rider-clean.webp"
        alt="Personagem Regtech Motors montado em uma moto elétrica"
        className="absolute inset-0 h-full w-full object-contain object-bottom"
        loading="eager"
        decoding="async"
      />

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
