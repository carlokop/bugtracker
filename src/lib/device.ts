import type { DeviceType } from "@/types";

/** Bepaalt apparaattype op basis van schermorientatie en breedte. */
export function getDeviceTypeFromOrientation(): DeviceType {
  const width = window.innerWidth;
  const isPortrait = window.matchMedia("(orientation: portrait)").matches;

  if (isPortrait) {
    return width < 600 ? "mobile" : "tablet";
  }
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}
