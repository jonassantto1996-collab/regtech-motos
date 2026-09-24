export default function ContactRider() {
  return (
    <div className="relative min-h-[32rem] overflow-hidden bg-[#0d3bb8] sm:min-h-[38rem] lg:min-h-full">
      <img
        src="https://bjodwjskwnpnqedjasid.supabase.co/storage/v1/object/public/product-images/site/regtech-rider-original.png"
        alt="Personagem Regtech Motors montado em uma moto elétrica"
        className="absolute left-1/2 top-[-2rem] w-[142%] max-w-none -translate-x-1/2 object-contain sm:top-[-3.5rem] sm:w-[120%] lg:left-[58%] lg:top-[-5rem] lg:w-[108%]"
        loading="eager"
        decoding="async"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-blue-950/20"
      />

      <div className="absolute left-5 top-5 z-10 max-w-[13rem] border-l border-cyan-300/60 pl-3 sm:left-8 sm:top-8">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-cyan-200">
          Regtech Motors
        </p>
        <p className="mt-2 text-sm font-medium leading-5 text-white/90">
          Sempre mais perto de você.
        </p>
      </div>

      <div className="absolute left-4 top-20 z-10 max-w-[16rem] border border-white/15 bg-blue-950/45 p-4 shadow-[0_18px_45px_rgba(2,6,23,0.18)] backdrop-blur-md sm:left-6 sm:top-24 sm:max-w-[17rem] sm:p-5 lg:left-6 lg:top-24 lg:max-w-[17rem]">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-cyan-200">
          Tradição que acompanha a inovação
        </p>

        <h3 className="mt-2 text-lg font-bold leading-tight tracking-tight text-white sm:text-xl">
          Referência em Tecnologia há +14 anos!
        </h3>

        <p className="mt-3 text-[0.8125rem] leading-5 text-blue-50/85 sm:text-sm sm:leading-6">
          Tecnologia, mobilidade e atendimento de confiança para acompanhar você no dia a dia.
        </p>
      </div>
    </div>
  );
}
