// src/components/appointments/UpcomingAppointmentsAlert.tsx
"use client";

import { useEffect, useState } from "react";
import { Bell, Calendar, Clock, ChevronDown, User, Phone, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import moment from "moment-jalaali";
import type { Appointment } from "@/types";

export function UpcomingAppointmentsAlert() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const response = await fetch(
          `/api/appointments?start_date=${today}&end_date=${tomorrowStr}&limit=20`
        );
        const result = await response.json();

        if (result.data) {
          setAppointments(result.data);
        }
      } catch (error) {
        console.error("Error fetching upcoming appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const visibleAppointments = appointments.filter(app => !dismissedIds.has(app.id));

  if (isLoading) {
    return (
      <Card className="p-4 border-blue-200 bg-blue-50/50 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-blue-200 rounded w-1/3" />
            <div className="h-3 bg-blue-100 rounded w-2/3" />
          </div>
        </div>
      </Card>
    );
  }

  if (visibleAppointments.length === 0) {
    return null;
  }

  const todayAppointments = visibleAppointments.filter(
    (app) => new Date(app.start_time).toDateString() === new Date().toDateString()
  );
  const tomorrowAppointments = visibleAppointments.filter(
    (app) => new Date(app.start_time).toDateString() === 
      new Date(Date.now() + 86400000).toDateString()
  );

  if (todayAppointments.length === 0 && tomorrowAppointments.length === 0) {
    return null;
  }

  const AppointmentRow = ({ app, isToday }: { app: Appointment; isToday: boolean }) => (
    <div className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer">
      {/* Time */}
      <div className="flex-shrink-0 text-center min-w-[50px]">
        <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
          {moment(app.start_time).format("HH:mm")}
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5">
          {moment(app.start_time).fromNow()}
        </div>
      </div>

      {/* Divider */}
      <div className={`w-0.5 self-stretch rounded-full ${isToday ? 'bg-blue-300' : 'bg-purple-300'}`} />

      {/* Patient Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white
            ${isToday ? 'bg-blue-500' : 'bg-purple-500'}`}>
            {app.patient?.first_name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {app.patient?.first_name} {app.patient?.last_name}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span dir="ltr">{app.patient?.phone || '---'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={`tel:${app.patient?.phone}`}
          className="p-1.5 rounded-full hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors"
          title="تماس"
        >
          <Phone className="w-3.5 h-3.5" />
        </a>
        <button
          onClick={() => handleDismiss(app.id)}
          className="p-1.5 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
          title="رد کردن"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <Card className="overflow-hidden border-2 border-blue-200 dark:border-blue-800 shadow-lg">
      {/* Header */}
      <div 
        className="p-4 cursor-pointer select-none flex items-center gap-3 bg-gradient-to-l from-blue-50 to-transparent dark:from-blue-950/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md">
            <Bell className="w-5 h-5" />
          </div>
          {todayAppointments.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
              {todayAppointments.length}
            </span>
          )}
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-gray-800 dark:text-gray-100">
            نوبت‌های نزدیک
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {todayAppointments.length > 0 && `${todayAppointments.length} نوبت امروز`}
            {todayAppointments.length > 0 && tomorrowAppointments.length > 0 && " • "}
            {tomorrowAppointments.length > 0 && `${tomorrowAppointments.length} نوبت فردا`}
          </p>
        </div>

        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-blue-100 dark:border-blue-900/30">
          <div className="p-3 space-y-4 max-h-[400px] overflow-y-auto">
            {/* Today */}
            {todayAppointments.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-full">
                    <Calendar className="w-3.5 h-3.5" />
                    امروز
                  </span>
                  <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600">
                    {todayAppointments.length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {todayAppointments.slice(0, 5).map((app) => (
                    <AppointmentRow key={app.id} app={app} isToday={true} />
                  ))}
                  {todayAppointments.length > 5 && (
                    <button className="w-full text-center py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                      + {todayAppointments.length - 5} نوبت دیگر
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tomorrow */}
            {tomorrowAppointments.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-full">
                    <Calendar className="w-3.5 h-3.5" />
                    فردا
                  </span>
                  <Badge variant="outline" className="text-[10px] border-purple-200 text-purple-600">
                    {tomorrowAppointments.length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {tomorrowAppointments.slice(0, 5).map((app) => (
                    <AppointmentRow key={app.id} app={app} isToday={false} />
                  ))}
                  {tomorrowAppointments.length > 5 && (
                    <button className="w-full text-center py-1.5 text-xs text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-medium">
                      + {tomorrowAppointments.length - 5} نوبت دیگر
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}