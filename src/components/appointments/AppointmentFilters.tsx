// src/components/appointments/AppointmentFilters.tsx
"use client";

import { useState, useCallback } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { APPOINTMENT_TYPES, APPOINTMENT_STATUSES, type AppointmentStatus, type AppointmentType } from "@/types";

interface Filters {
  status?: AppointmentStatus | null;
  type?: AppointmentType | null;
  startDate?: string | null;
  endDate?: string | null;
  dateRange?: "today" | "week" | "month" | "custom" | null;
}

interface AppointmentFiltersProps {
  onFilterChange: (filters: Filters) => void;
  initialFilters?: Filters;
  className?: string;
}

export function AppointmentFilters({
  onFilterChange,
  initialFilters = {},
  className = "",
}: AppointmentFiltersProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [isOpen, setIsOpen] = useState(false);

  // اعمال فیلترهای سریع
  const applyQuickFilter = useCallback((range: "today" | "week" | "month") => {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    switch (range) {
      case "today":
        const today = now.toISOString().split('T')[0];
        startDate = today;
        endDate = today;
        break;
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        startDate = weekStart.toISOString().split('T')[0];
        endDate = weekEnd.toISOString().split('T')[0];
        break;
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDate = monthStart.toISOString().split('T')[0];
        endDate = monthEnd.toISOString().split('T')[0];
        break;
    }

    const newFilters = {
      ...filters,
      dateRange: range,
      startDate,
      endDate,
    };

    setFilters(newFilters);
    onFilterChange(newFilters);
  }, [filters, onFilterChange]);

  // اعمال فیلترها
  const applyFilters = useCallback(() => {
    onFilterChange(filters);
    setIsOpen(false);
  }, [filters, onFilterChange]);

  // بازنشانی فیلترها
  const resetFilters = useCallback(() => {
    const newFilters = {
      status: null,
      type: null,
      startDate: null,
      endDate: null,
      dateRange: null,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
    setIsOpen(false);
  }, [onFilterChange]);

  // تعداد فیلترهای فعال
  const activeFilterCount = [
    filters.status,
    filters.type,
    filters.startDate || filters.endDate,
  ].filter(Boolean).length;

  const quickFilterLabel = (() => {
    switch (filters.dateRange) {
      case "today": return "امروز";
      case "week": return "این هفته";
      case "month": return "این ماه";
      default: return null;
    }
  })();

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {/* دکمه فیلتر */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              فیلترها
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">فیلترهای نوبت</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  پاک کردن همه
                </Button>
              </div>

              {/* وضعیت */}
              <div className="space-y-2">
                <Label>وضعیت</Label>
                <Select
                  value={filters.status || ""}
                  onValueChange={(value) => {
                    setFilters({ ...filters, status: value as AppointmentStatus || null });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="همه وضعیت‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">همه</SelectItem>
                    {APPOINTMENT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* نوع */}
              <div className="space-y-2">
                <Label>نوع نوبت</Label>
                <Select
                  value={filters.type || ""}
                  onValueChange={(value) => {
                    setFilters({ ...filters, type: value as AppointmentType || null });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="همه انواع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">همه</SelectItem>
                    {APPOINTMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* بازه تاریخی */}
              <div className="space-y-2">
                <Label>بازه زمانی</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">از تاریخ</Label>
                    <Input
                      type="date"
                      value={filters.startDate || ""}
                      onChange={(e) => {
                        setFilters({
                          ...filters,
                          startDate: e.target.value || null,
                          dateRange: null,
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">تا تاریخ</Label>
                    <Input
                      type="date"
                      value={filters.endDate || ""}
                      onChange={(e) => {
                        setFilters({
                          ...filters,
                          endDate: e.target.value || null,
                          dateRange: null,
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={applyFilters}>
                  اعمال فیلترها
                </Button>
                <Button variant="outline" onClick={resetFilters}>
                  بازنشانی
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* فیلترهای سریع */}
        <Button
          variant={quickFilterLabel === "امروز" ? "default" : "outline"}
          size="sm"
          onClick={() => applyQuickFilter("today")}
        >
          امروز
        </Button>
        <Button
          variant={quickFilterLabel === "این هفته" ? "default" : "outline"}
          size="sm"
          onClick={() => applyQuickFilter("week")}
        >
          این هفته
        </Button>
        <Button
          variant={quickFilterLabel === "این ماه" ? "default" : "outline"}
          size="sm"
          onClick={() => applyQuickFilter("month")}
        >
          این ماه
        </Button>
      </div>
    </div>
  );
}