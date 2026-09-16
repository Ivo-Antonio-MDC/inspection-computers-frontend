import path from "node:path";
import type { NextConfig } from "next";

// O frontend chama /api/v1/* na própria origem e o Next.js reencaminha para a API
// NestJS. Assim os cookies de sessão (refresh + CSRF) ficam first-party.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

// Hosts/IPs autorizados a abrir o servidor de desenvolvimento além de localhost
// (ex.: acesso pelo IP da rede). Pode acrescentar mais em DEV_ORIGINS, separados por vírgula.
const DEV_ORIGINS = ["192.168.1.134", "172.29.80.1", ...(process.env.DEV_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean)];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Servidor autónomo mínimo (.next/standalone) usado pela imagem Docker
  output: "standalone",
  allowedDevOrigins: DEV_ORIGINS,
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
