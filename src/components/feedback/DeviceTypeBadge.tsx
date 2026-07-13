import { Monitor, Smartphone, Tablet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DeviceType } from "@/types";
import { DEVICE_TYPE_LABELS } from "@/types";

const deviceIcons: Record<DeviceType, typeof Monitor> = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
};

export function DeviceTypeBadge({ deviceType }: { deviceType: DeviceType }) {
  const Icon = deviceIcons[deviceType];
  return (
    <Badge variant="secondary">
      <Icon className="h-3 w-3" />
      {DEVICE_TYPE_LABELS[deviceType]}
    </Badge>
  );
}
