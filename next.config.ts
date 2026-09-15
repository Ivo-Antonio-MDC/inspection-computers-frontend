import path from "node:path";
import type { NextConfig } from "next";

// O frontend chama /api/v1/* na própria origem e o Next.js reencaminha para a API
// NestJS. Assim os cookies de sessão (refresh + CSRF) ficam first-party.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Evita que o Turbopack assuma como raiz uma pasta acima com outro package-lock.json
  turbopack: { root: path.resolve(__dirname) },
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${BACKEND_URL}/api/v1/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
