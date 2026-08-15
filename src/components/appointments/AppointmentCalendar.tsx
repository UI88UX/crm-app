// src/components/appointments/AppointmentCalendar.tsx
"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import moment from "moment-jalaali";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";
import type { Appointment } from "@/types";
import { toJalali, fromJalali } from "@/lib/util/jalaliDate";

// ============================================
// Types
// ============================================

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onDateSelect?: (date: string) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  className?: string;
}

// ============================================
// Component
// ============================================

export function AppointmentCalendar({
  appointments,
  onDateSelect,
  onAppointmentClick,
  className = "",
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // دریافت روزهای ماه
  const days = useMemo(() => {
    const start = currentDate.clone().startOf("jMonth");
    const end = currentDate.clone().endOf("jMonth");
    const daysArray = [];
    
    // اصلاح: استفاده از day() به جای jDayOfWeek()
    // روز اول ماه شمسی (شنبه = 6 در moment)
    const firstDayOfMonth = start.day(); // 0=Sunday, 1=Monday, ...
    // تبدیل به شنبه = 0
    const startOffset = (firstDayOfMonth + 1) % 7;
    
    for (let i = 0; i < startOffset; i++) {
      daysArray.push(null);
    }
  
    for (let i = 1; i <= end.jDate(); i++) {
      daysArray.push(i);
    }
  
    return daysArray;
  }, [currentDate]);

  // دریافت نوبت‌های یک روز خاص
  const getAppointmentsForDay = (day: number): Appointment[] => {
    if (!day) return [];
    
    const date = currentDate.clone().jDate(day).format("jYYYY/jMM/jDD");
    
    return appointments.filter((app) => {
      if (!app.start_time) return false;
      const appDate = moment(app.start_time).format("jYYYY/jMM/jDD");
      return appDate === date;
    });
  };

  // بررسی اینکه روز جاری است یا نه
  const isToday = (day: number): boolean => {
    if (!day) return false;
    const today = moment();
    const date = currentDate.clone().jDate(day);
    return date.format("jYYYY/jMM/jDD") === today.format("jYYYY/jMM/jDD");
  };

  // بررسی اینکه روز انتخاب شده است یا نه
  const isSelected = (day: number): boolean => {
    if (!day || !selectedDate) return false;
    const date = currentDate.clone().jDate(day).format("jYYYY/jMM/jDD");
    return date === selectedDate;
  };

  // تغییر ماه
  const goToPrevMonth = () => {
    setCurrentDate(currentDate.clone().subtract(1, "jMonth"));
  };

  const goToNextMonth = () => {
    setCurrentDate(currentDate.clone().add(1, "jMonth"));
  };

  const goToToday = () => {
    setCurrentDate(moment());
  };

  // انتخاب روز
  const handleDayClick = (day: number) => {
    if (!day) return;
    const date = currentDate.clone().jDate(day).format("jYYYY/jMM/jDD");
    setSelectedDate(date);
    if (onDateSelect) {
      const gregorianDate = fromJalali(date);
      if (gregorianDate) {
        onDateSelect(gregorianDate);
      }
    }
  };

  // نام ماه‌های شمسی
  const monthName = currentDate.format("jMMMM");
  const year = currentDate.format("jYYYY");

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            تقویم نوبت‌ها
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              امروز
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevMonth}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {monthName} {year}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* روزهای هفته */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((day, index) => (
            <div
              key={index}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* روزهای ماه */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const appointmentsForDay = day ? getAppointmentsForDay(day) : [];
            const isTodayDay = day ? isToday(day) : false;
            const isSelectedDay = day ? isSelected(day) : false;

            return (
              <div
                key={index}
                className={`
                  min-h-[70px] p-1 rounded-lg border cursor-pointer transition-colors
                  ${!day ? "invisible" : ""}
                  ${isSelectedDay ? "border-primary bg-primary/5" : "border-transparent hover:border-muted"}
                  ${isTodayDay ? "border-primary/50 bg-primary/10" : ""}
                `}
                onClick={() => day && handleDayClick(day)}
              >
                {day && (
                  <>
                    <div className={`
                      text-xs font-medium text-center py-0.5 rounded-full w-6 h-6 flex items-center justify-center mx-auto
                      ${isTodayDay ? "bg-primary text-primary-foreground" : ""}
                    `}>
                      {day}
                    </div>

                    <div className="mt-1 space-y-0.5 max-h-[40px] overflow-y-auto">
                      {appointmentsForDay.slice(0, 3).map((app) => (
                        <div
                          key={app.id}
                          className="text-[10px] truncate px-1 py-0.5 rounded bg-muted/50 hover:bg-muted cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onAppointmentClick) {
                              onAppointmentClick(app);
                            }
                          }}
                        >
                          {app.title || app.type}
                        </div>
                      ))}
                      {appointmentsForDay.length > 3 && (
                        <div className="text-[10px] text-muted-foreground text-center">
                          +{appointmentsForDay.length - 3} بیشتر
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* افسانه (Legend) */}
        <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">وضعیت‌ها:</span>
          {["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"].map((status) => (
            <div key={status} className="flex items-center gap-1">
              <AppointmentStatusBadge status={status} size="sm" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}