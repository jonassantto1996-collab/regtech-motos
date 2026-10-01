/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://bjodwjskwnpnqedjasid.supabase.co",
      "media-src 'self' https://bjodwjskwnpnqedjasid.supabase.co",
      "connect-src 'self' https://bjodwjskwnpnqedjasid.supabase.co wss://bjodwjskwnpnqedjasid.supabase.co",
      "font-src 'self' data:",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Uploads administrativos chegam a 15 MB. Cada Server Action ainda
    // valida tipo, tamanho e assinatura antes de persistir o arquivo.
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.regtechmotors.com.br" }],
        destination: "https://regtechmotors.com.br/:path*",
        permanent: true,
      },
      { source: "/products/l70", destination: "/products/zub-l70", permanent: true },
      { source: "/products/x16", destination: "/products/panda-x16", permanent: true },
      { source: "/products/zetrix", destination: "/products/trixx-bicicleta-eletrica", permanent: true },
      { source: "/products/triciclo", destination: "/products/zub-triciclo-eletrico-enjoy", permanent: true },
      { source: "/products/soyan-soyan", destination: "/products/soyan-sy-96-supao", permanent: true },
      { source: "/products/bike", destination: "/products/ouxi-gt16", permanent: true },
      { source: "/products/mini-moto", destination: "/products/impala-mini-moto-cross-2-tempo", permanent: true },
      { source: "/products/triciclo-eletrico-triciclo", destination: "/products/triciclo-eletrico-drift", permanent: true },
    ];
  },
  images: {
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
