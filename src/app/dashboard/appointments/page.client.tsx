// src/app/dashboard/appointments/page.client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Clock,
  User,
  Phone,
  Filter,
  X,
  CheckCircle,
  Ban,
  Clock as ClockIcon,
  UserCheck,
  UserX,
  Calendar
} from "lucide-react";
import moment from "moment-jalaali";
import { toJalaliDisplay } from "@/lib/util/jalaliDate";
import {
  useAppointments,
  useDeleteAppointment,
  useUpdateAppointmentStatus,
} from "@/hooks/useAppointments";
import { APPOINTMENT_STATUSES, APPOINTMENT_TYPES, type AppointmentStatus } from "@/types";
import { UpcomingAppointmentsAlert } from "@/components/appointments/UpcomingAppointmentsAlert";

// کامپوننت نمایش وضعیت نوبت
function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const statusMap: Record<AppointmentStatus, { label: string; color: string }> = {
    scheduled: { label: "برنامه‌ریزی شده", color: "bg-blue-100 text-blue-700" },
    pending: { label: "در انتظار", color: "bg-yellow-100 text-yellow-700" },
    confirmed: { label: "تأیید شده", color: "bg-green-100 text-green-700" },
    in_progress: { label: "در حال انجام", color: "bg-purple-100 text-purple-700" },
    completed: { label: "انجام شده", color: "bg-gray-100 text-gray-700" },
    cancelled: { label: "لغو شده", color: "bg-red-100 text-red-700" },
    no_show: { label: "عدم حضور", color: "bg-orange-100 text-orange-700" },
  };

  const info = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-700" };
  return <Badge className={info.color}>{info.label}</Badge>;
}

interface FilterState {
  status: string;
  type: string;
  search: string;
  start_date: string;
  end_date: string;
}

export default function AppointmentsPageClient() {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>({
    status: "",
    type: "",
    search: "",
    start_date: "",
    end_date: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // ✅ دریافت نوبت‌ها با React Query
  const {
    data: appointments = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAppointments({
    status: filters.status as AppointmentStatus || undefined,
    start_date: filters.start_date || undefined,
    end_date: filters.end_date || undefined,
    limit: 50,
  });

  // ✅ حذف نوبت
  const deleteAppointment = useDeleteAppointment();

  // ✅ تغییر وضعیت نوبت
  const updateStatus = useUpdateAppointmentStatus();

  // فیلتر کردن بر اساس جستجو و نوع
  const filteredAppointments = appointments.filter((appointment) => {
    // فیلتر جستجو
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const patientName = 
        `${appointment.patient?.first_name || ""} ${appointment.patient?.last_name || ""}`.toLowerCase();
      const title = (appointment.title || "").toLowerCase();
      
      if (!patientName.includes(searchLower) && !title.includes(searchLower)) {
        return false;
      }
    }

    // فیلتر نوع
    if (filters.type && appointment.type !== filters.type) {
      return false;
    }

    return true;
  });

  // آمار وضعیت‌ها
  const statusStats = appointments.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleDelete = (id: string, title: string) => {
    if (confirm(`آیا از حذف نوبت "${title || 'بدون عنوان'}" اطمینان دارید؟`)) {
      deleteAppointment.mutate(id);
    }
  };

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    updateStatus.mutate({ id, status });
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      type: "",
      search: "",
      start_date: "",
      end_date: "",
    });
  };

  if (isError) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <p>خطا در بارگذاری نوبت‌ها: {error?.message || 'خطای ناشناخته'}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 ml-2" />
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* هدر */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">مدیریت نوبت‌ها</h1>
          <p className="text-gray-500 mt-1">مدیریت نوبت‌های بیماران</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 ml-2" />
            فیلترها
            {Object.values(filters).some(v => v) && (
              <Badge variant="secondary" className="mr-1">فعال</Badge>
            )}
          </Button>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? "در حال بارگذاری..." : "بروزرسانی"}
          </Button>
          <Link href="/dashboard/appointments/new">
            <Button size="sm">
              <Plus className="w-4 h-4 ml-2" />
              نوبت جدید
            </Button>
          </Link>
        </div>
      </div>
        <UpcomingAppointmentsAlert />

      {/* فیلترها */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">جستجو</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="نام بیمار یا عنوان نوبت..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pr-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">وضعیت</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2 border rounded-md bg-white"
                >
                  <option value="">همه وضعیت‌ها</option>
                  {APPOINTMENT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">نوع نوبت</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-2 border rounded-md bg-white"
                >
                  <option value="">همه انواع</option>
                  {APPOINTMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={resetFilters} className="flex-1">
                  <X className="w-4 h-4 ml-2" />
                  پاک کردن
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* آمار سریع */}
      {!isLoading && appointments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {APPOINTMENT_STATUSES.map((s) => (
            <div key={s.value} className="bg-gray-50 p-2 rounded-lg text-center">
              <div className="text-xs text-gray-500">{s.label}</div>
              <div className="text-lg font-bold">{statusStats[s.value] || 0}</div>
            </div>
          ))}
        </div>
      )}

      {/* لیست نوبت‌ها */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {filters.search || filters.status || filters.type
              ? "هیچ نوبتی با این فیلترها یافت نشد"
              : "هیچ نوبتی ثبت نشده است"}
          </p>
          {!filters.search && !filters.status && !filters.type && (
            <Link href="/dashboard/appointments/new">
              <Button variant="outline" className="mt-4">
                <Plus className="w-4 h-4 ml-2" />
                ثبت اولین نوبت
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredAppointments.map((appointment) => {
            const patientName = 
              appointment.patient 
                ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
                : "بیمار ناشناس";

            return (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* اطلاعات اصلی */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-lg">
                          {appointment.title || "نوبت بدون عنوان"}
                        </span>
                        <AppointmentStatusBadge status={appointment.status} />
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {patientName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {toJalaliDisplay(appointment.start_time)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {moment(appointment.start_time).format("HH:mm")} -{" "}
                          {moment(appointment.end_time).format("HH:mm")}
                        </span>
                        {appointment.patient?.phone && (
                          <span className="flex items-center gap-1 text-gray-400">
                            <Phone className="w-3 h-3" />
                            {appointment.patient.phone}
                          </span>
                        )}
                      </div>
                      
                      {appointment.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {appointment.description}
                        </p>
                      )}
                    </div>

                    {/* عملیات */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* تغییر وضعیت - فقط برای وضعیت‌های فعال */}
                      {appointment.status !== 'completed' && 
                       appointment.status !== 'cancelled' && 
                       appointment.status !== 'no_show' && (
                        <select
                          value={appointment.status}
                          onChange={(e) => handleStatusChange(appointment.id, e.target.value as AppointmentStatus)}
                          className="text-sm p-1 border rounded bg-white"
                          disabled={updateStatus.isPending}
                        >
                          {APPOINTMENT_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      )}

                      <Link href={`/dashboard/appointments/${appointment.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 ml-1" />
                          مشاهده
                        </Button>
                      </Link>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(appointment.id, appointment.title || '')}
                        disabled={deleteAppointment.isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}