import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Regista os tamanhos de texto do tema (text-theme-xs, text-title-md…) para o
// tailwind-merge não os confundir com cores e os remover ao lado de text-gray-500.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["title-2xl", "title-xl", "title-lg", "title-md", "title-sm", "theme-xl", "theme-sm", "theme-xs"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function recordCode(n: number | null | undefined) {
  return n ? `INS-${String(n).padStart(6, "0")}` : "—";
}

const dateFmt = new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const numberFmt = new Intl.NumberFormat("pt-PT");

export const formatDate = (v?: string | Date | null) => (v ? dateFmt.format(new Date(v)) : "—");
export const formatDateTime = (v?: string | Date | null) => (v ? dateTimeFmt.format(new Date(v)) : "—");
export const formatNumber = (v?: number | null) => (v === null || v === undefined ? "—" : numberFmt.format(v));

export function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export function relativeTime(v: string | Date) {
  const diff = (Date.now() - new Date(v).getTime()) / 1000;
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 7 * 86400) return `há ${Math.floor(diff / 86400)} dias`;
  return formatDate(v);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .filter((_, i, arr) => i === 0 || i === arr.length - 1)
    .join("")
    .toUpperCase();
}

export function storageLabel(gb: number | null | undefined) {
  if (!gb) return "—";
  return gb >= 1000 ? `${(gb / 1000).toLocaleString("pt-PT", { maximumFractionDigits: 1 })} TB` : `${gb} GB`;
}
