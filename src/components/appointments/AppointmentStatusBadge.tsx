// src/components/appointments/AppointmentStatusBadge.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { APPOINTMENT_STATUS_MAP, type AppointmentStatus } from "@/types";

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus | string;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "default" | "lg";
  reason?: string | null;  // ✅ اضافه شد
}

export function AppointmentStatusBadge({
  status,
  className = "",
  showLabel = true,
  size = "default",
  reason,  // ✅ اضافه شد
}: AppointmentStatusBadgeProps) {
  const statusInfo = APPOINTMENT_STATUS_MAP[status as AppointmentStatus];
  
  if (!statusInfo) {
    return (
      <Badge variant="outline" className={className}>
        {status || "نامشخص"}
      </Badge>
    );
  }

  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
    green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
    orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  };

  const dotColorMap: Record<string, string> = {
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    gray: "bg-gray-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    default: "text-sm px-2.5 py-0.5 gap-1.5",
    lg: "text-base px-3 py-1 gap-2",
  };

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    default: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  // Badge اصلی
  const badge = (
    <Badge
      variant="outline"
      className={`${colorMap[statusInfo.color] || ''} ${sizeClasses[size]} ${className} flex items-center cursor-help`}
    >
      <span className={`${dotSizes[size]} rounded-full ${dotColorMap[statusInfo.color] || 'bg-gray-500'}`} />
      {showLabel && <span>{statusInfo.label}</span>}
    </Badge>
  );

  // اگر دلیلی وجود دارد و وضعیت عدم حضور یا لغو است، Tooltip نمایش بده
  if (reason && (status === 'no_show' || status === 'cancelled')) {
    const icon = status === 'no_show' ? '🚫' : '❌';
    const label = status === 'no_show' ? 'دلیل عدم حضور' : 'دلیل لغو';
    
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs p-3" align="center">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {icon} {label}:
              </p>
              <p className="text-sm break-words">{reason}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}