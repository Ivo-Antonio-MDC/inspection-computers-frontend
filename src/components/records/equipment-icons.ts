import type { ComponentType, SVGProps } from "react";
import {
  BagIcon,
  BatteryIcon,
  CableIcon,
  CpuIcon,
  DesktopIcon,
  DockIcon,
  HardDriveIcon,
  HeadphonesIcon,
  KeyboardIcon,
  LaptopIcon,
  MicrophoneIcon,
  MonitorIcon,
  MouseIcon,
  PhoneIcon,
  PrinterIcon,
  ProjectorIcon,
  RouterIcon,
  ScannerIcon,
  ServerIcon,
  SpeakerIcon,
  TabletIcon,
  TvIcon,
  UsbIcon,
  WatchIcon,
  WebcamIcon,
} from "../icons";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

/**
 * Ícones disponíveis para os equipamentos do catálogo. A chave é o valor
 * gravado em `equipment_categories.icon`; as palavras-chave servem para sugerir
 * o ícone a partir do nome (sem acentos, em minúsculas).
 */
export const CATALOG_ICONS = {
  tablet: { label: "Tablet", Icon: TabletIcon, keywords: ["tablet", "ipad", "galaxy tab"] },
  telefone: { label: "Telefone", Icon: PhoneIcon, keywords: ["telefone", "telemovel", "celular", "smartphone", "iphone", "phone"] },
  impressora: { label: "Impressora", Icon: PrinterIcon, keywords: ["impressora", "multifuncoes", "multifuncional", "printer", "plotter", "fotocopiadora"] },
  scanner: { label: "Scanner", Icon: ScannerIcon, keywords: ["scanner", "digitalizador", "leitor de codigo"] },
  projector: { label: "Projector", Icon: ProjectorIcon, keywords: ["projector", "projetor", "datashow", "data show"] },
  webcam: { label: "Câmara", Icon: WebcamIcon, keywords: ["webcam", "camara", "camera", "cctv"] },
  coluna: { label: "Coluna", Icon: SpeakerIcon, keywords: ["coluna", "colunas", "altifalante", "speaker", "som"] },
  microfone: { label: "Microfone", Icon: MicrophoneIcon, keywords: ["microfone", "mic"] },
  headset: { label: "Auscultadores", Icon: HeadphonesIcon, keywords: ["auricular", "auriculares", "earphone", "earbuds"] },
  router: { label: "Rede", Icon: RouterIcon, keywords: ["router", "roteador", "switch", "access point", "modem", "wifi", "rede", "firewall"] },
  servidor: { label: "Servidor", Icon: ServerIcon, keywords: ["servidor", "server", "nas", "rack"] },
  disco: { label: "Disco externo", Icon: HardDriveIcon, keywords: ["disco", "hdd", "ssd", "armazenamento"] },
  usb: { label: "Pen / USB", Icon: UsbIcon, keywords: ["pen", "usb", "flash", "pendrive"] },
  ups: { label: "UPS / Energia", Icon: BatteryIcon, keywords: ["ups", "no-break", "nobreak", "estabilizador", "bateria", "powerbank", "carregador"] },
  tv: { label: "TV / Ecrã", Icon: TvIcon, keywords: ["tv", "televisao", "televisor", "ecra", "smart board", "quadro interactivo"] },
  monitor: { label: "Monitor", Icon: MonitorIcon, keywords: ["monitor"] },
  computador: { label: "Computador", Icon: DesktopIcon, keywords: ["computador", "pc", "all-in-one", "mini pc", "thin client"] },
  portatil: { label: "Portátil", Icon: LaptopIcon, keywords: ["portatil", "notebook", "chromebook", "macbook"] },
  dock: { label: "Docking station", Icon: DockIcon, keywords: ["dock", "docking", "base", "hub"] },
  cabo: { label: "Cabo / Adaptador", Icon: CableIcon, keywords: ["cabo", "adaptador", "hdmi", "conversor", "extensao"] },
  teclado: { label: "Teclado", Icon: KeyboardIcon, keywords: ["teclado"] },
  rato: { label: "Rato", Icon: MouseIcon, keywords: ["rato", "mouse", "trackpad"] },
  pasta: { label: "Pasta / Mochila", Icon: BagIcon, keywords: ["pasta", "mochila", "bolsa", "mala", "estojo", "capa"] },
  relogio: { label: "Relógio / Biométrico", Icon: WatchIcon, keywords: ["relogio", "biometrico", "ponto", "smartwatch"] },
  outro: { label: "Genérico", Icon: CpuIcon, keywords: [] },
} satisfies Record<string, { label: string; Icon: IconComponent; keywords: string[] }>;

export type CatalogIconKey = keyof typeof CATALOG_ICONS;

export const CATALOG_ICON_KEYS = Object.keys(CATALOG_ICONS) as CatalogIconKey[];

const plain = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function isCatalogIcon(key: string | null | undefined): key is CatalogIconKey {
  return !!key && key in CATALOG_ICONS;
}

/** Sugere o ícone mais adequado a partir do nome do equipamento. */
export function suggestIcon(name: string | null | undefined): CatalogIconKey {
  const text = plain(name ?? "");
  if (!text.trim()) return "outro";
  const words = text.split(/[^a-z0-9-]+/);
  for (const key of CATALOG_ICON_KEYS) {
    if (CATALOG_ICONS[key].keywords.some((k) => (k.includes(" ") ? text.includes(k) : words.includes(k) || words.includes(`${k}s`) || words.includes(`${k}es`)))) return key;
  }
  return "outro";
}
