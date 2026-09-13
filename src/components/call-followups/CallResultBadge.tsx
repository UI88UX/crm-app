// src/components/call-followups/CallResultBadge.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { CALL_RESULT_MAP, type CallResult } from "@/types";

interface CallResultBadgeProps {
  result: CallResult | null;
  size?: 'sm' | 'default' | 'lg';
  showEmoji?: boolean;
  showShort?: boolean;
}

export function CallResultBadge({
  result,
  size = 'default',
  showEmoji = true,
  showShort = false,
}: CallResultBadgeProps) {
  if (!result) {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-500">
        ثبت نشده
      </Badge>
    );
  }

  const config = CALL_RESULT_MAP[result];
  if (!config) {
    return <Badge variant="outline">{result}</Badge>;
  }

  const colorClasses: Record<string, string> = {
    green: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100',
    red: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
    gray: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100',
    blue: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
    orange: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100',
  };

  const sizeClasses: Record<string, string> = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    default: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <Badge
      variant="outline"
      className={`${colorClasses[config.color]} ${sizeClasses[size]} font-medium`}
    >
      {showEmoji && <span>{config.emoji}</span>}
      <span>{showShort ? config.shortLabel : config.label}</span>
    </Badge>
  );
}