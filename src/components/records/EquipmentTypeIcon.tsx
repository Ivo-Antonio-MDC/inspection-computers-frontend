import type { EquipmentTypeKey } from "@/lib/equipment-rules";
import { DesktopIcon, DeviceIcon, HeadphonesIcon, KeyboardIcon, LaptopIcon, MonitorIcon, MouseIcon } from "../icons";

const ICONS = {
  laptop: LaptopIcon,
  desktop: DesktopIcon,
  monitor: MonitorIcon,
  teclado: KeyboardIcon,
  rato: MouseIcon,
  headphones: HeadphonesIcon,
  outro: DeviceIcon,
};

export default function EquipmentTypeIcon({ type, size = 20, className }: { type: EquipmentTypeKey; size?: number; className?: string }) {
  const Icon = ICONS[type] ?? DeviceIcon;
  return <Icon size={size} className={className} />;
}
