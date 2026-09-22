// src/components/admin/tenant/TenantUserLimit.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface TenantUserLimitProps {
  current: number;
  max: number;
}

export function TenantUserLimit({ current, max }: TenantUserLimitProps) {
  const percentage = Math.min((current / max) * 100, 100);
  const isFull = current >= max;
  const isNearFull = current >= max - 1;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isFull
                  ? "bg-red-50"
                  : isNearFull
                  ? "bg-amber-50"
                  : "bg-blue-50"
              }`}
            >
              <Users
                className={`h-5 w-5 ${
                  isFull
                    ? "text-red-600"
                    : isNearFull
                    ? "text-amber-600"
                    : "text-blue-600"
                }`}
              />
            </div>
            <div>
              <p className="text-sm font-medium">ظرفیت کاربران</p>
              <p className="text-xs text-muted-foreground">
                {isFull
                  ? "ظرفیت تکمیل است"
                  : `${max - current} جای خالی باقی مانده`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-[180px]">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isFull
                    ? "bg-red-500"
                    : isNearFull
                    ? "bg-amber-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span
              className={`text-sm font-bold tabular-nums ${
                isFull
                  ? "text-red-600"
                  : isNearFull
                  ? "text-amber-600"
                  : "text-blue-600"
              }`}
            >
              {current}/{max}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}