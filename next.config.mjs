/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "ahrmcqirkteiphoaldyq.supabase.co" },
      { protocol: "https", hostname: "www.bdtrac.com" },
      { protocol: "https", hostname: "bdtrac.com" },
    ],
  },
  /* §4.6 — /products is the canonical shop URL (it is the live bdtrac.com
     structure, preserved); /shop permanently redirects to it. Product URLs
     stay /products/<uuid> so every live link keeps working. */
  async redirects() {
    return [{ source: "/shop", destination: "/products", permanent: true }];
  },
  /* Phase 12 security headers. CSP notes: 'unsafe-inline' for scripts is
     required by Next.js hydration + JSON-LD in this architecture; the
     policy still blocks external script origins, framing, base hijack
     and plugin content. img/media allow https: because catalog media is
     CDN-hosted (Supabase + own domain). */
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
