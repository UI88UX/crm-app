// src/components/call-followups/CallFollowupStatusBadge.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, RotateCcw, AlertCircle } from "lucide-react";
import { CALL_FOLLOWUP_STATUS_MAP, type CallFollowupStatus } from "@/types";
import React from "react";

interface CallFollowupStatusBadgeProps {
  status: CallFollowupStatus;
  size?: 'sm' | 'default';
}

export function CallFollowupStatusBadge({
  status,
  size = 'default',
}: CallFollowupStatusBadgeProps) {
  const config = CALL_FOLLOWUP_STATUS_MAP[status];

  const statusConfig: Record<CallFollowupStatus, {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }> = {
    pending: {
      label: config?.label || 'در انتظار',
      icon: Clock,
      className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    completed: {
      label: config?.label || 'انجام شده',
      icon: CheckCircle2,
      className: 'bg-green-100 text-green-700 border-green-200',
    },
    cancelled: {
      label: config?.label || 'لغو شده',
      icon: XCircle,
      className: 'bg-gray-100 text-gray-700 border-gray-200',
    },
    rescheduled: {
      label: config?.label || 'به تعویق افتاده',
      icon: RotateCcw,
      className: 'bg-orange-100 text-orange-700 border-orange-200',
    },
  };

  const c = statusConfig[status];
  if (!c) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-700 gap-1">
        <AlertCircle className="w-3 h-3" />
        نامشخص
      </Badge>
    );
  }

  const Icon = c.icon;
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <Badge variant="outline" className={`${c.className} ${sizeClasses} font-medium`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {c.label}
    </Badge>
  );
}