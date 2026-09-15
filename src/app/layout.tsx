import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import Providers from "@/context/providers";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit-next", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Inspecção de Computadores | MD Consultores", template: "%s | Inspecção de Computadores" },
  description: "Sistema de Recolha de Dados para Inspecção de Computadores — Departamento de Tecnologia de Informática",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#101828" },
  ],
};

// Aplica o tema antes da primeira pintura para evitar o "flash" claro em modo escuro.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={outfit.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
