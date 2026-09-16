/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Escopo restrito ao domínio e ao path exato de objetos públicos do
    // Storage deste projeto — não usar um wildcard genérico como
    // "*.supabase.co", que permitiria otimizar imagens de qualquer projeto
    // Supabase, não só o nosso.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bjodwjskwnpnqedjasid.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

module.exports = nextConfig;
