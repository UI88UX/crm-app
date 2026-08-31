// src/app/dashboard/appointments/page.client.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, Loader2, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment-jalaali";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { AppointmentStatusActions } from "@/components/appointments/AppointmentStatusActions";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { UpcomingAppointmentsAlert } from "@/components/appointments/UpcomingAppointmentsAlert";
import { toJalaliDisplay } from "@/lib/util/jalaliDate";
import { APPOINTMENT_TYPE_MAP, APPOINTMENT_STATUSES, APPOINTMENT_TYPES, type Appointment, type AppointmentStatus } from "@/types";

export function AppointmentsPageClient() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // فیلترها
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all">("all");

  // دریافت نوبت‌ها
  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);

      // فیلتر تاریخ
      if (dateRange !== "all") {
        const now = new Date();
        let startDate = "";
        let endDate = "";

        switch (dateRange) {
          case "today":
            startDate = now.toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
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

        if (startDate) params.append("start_date", startDate);
        if (endDate) params.append("end_date", endDate);
      }

      params.append("limit", "100");

      const response = await fetch(`/api/appointments?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "خطا در دریافت نوبت‌ها");
      }

      setAppointments(result.data || []);
      setTotal(result.count || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "خطا در دریافت نوبت‌ها";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, dateRange]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // فیلتر جستجو
  const filteredAppointments = appointments.filter((app) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase().trim();
    const patientName = app.patient
      ? `${app.patient.first_name} ${app.patient.last_name}`.toLowerCase()
      : "";
    const title = app.title?.toLowerCase() || "";
    return patientName.includes(query) || title.includes(query);
  });

  // آمار
  const stats = {
    total: appointments.length,
    today: appointments.filter(a => new Date(a.start_time).toDateString() === new Date().toDateString()).length,
    upcoming: appointments.filter(a => new Date(a.start_time) > new Date() && a.status !== "cancelled" && a.status !== "completed").length,
    completed: appointments.filter(a => a.status === "completed").length,
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowForm(true);
  };

  const handleDelete = async (appointment: Appointment) => {
    if (!confirm(`آیا از حذف نوبت "${appointment.title || 'بدون عنوان'}" اطمینان دارید؟`)) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "خطا در حذف نوبت");
      }

      await loadAppointments();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      alert(error instanceof Error ? error.message : "خطا در حذف نوبت");
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedAppointment(null);
    loadAppointments();
  };

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-red-500">{error}</p>
            <Button variant="outline" className="mt-4" onClick={loadAppointments}>
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* هدر */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">مدیریت نوبت‌ها</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total > 0 ? `${total} نوبت` : "هیچ نوبتی ثبت نشده است"}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 ml-2" />
          نوبت جدید
        </Button>
      </div>

      {/* آمار سریع */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">کل نوبت‌ها</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
            <p className="text-xs text-muted-foreground">امروز</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.upcoming}</p>
            <p className="text-xs text-muted-foreground">نوبت‌های آینده</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">انجام شده</p>
          </CardContent>
        </Card>
      </div>

      {/* اعلان نوبت‌های نزدیک */}
      <UpcomingAppointmentsAlert />

      {/* فیلترها و جستجو */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* جستجو */}
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجوی بیمار یا عنوان نوبت..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div>

        {/* فیلتر وضعیت */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {["all", "scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"].map((status) => {
            const label = status === "all" ? "همه" :
              APPOINTMENT_STATUSES.find(s => s.value === status)?.label || status;
            const isActive = statusFilter === status;
            const color = status === "all" ? "" :
              APPOINTMENT_STATUSES.find(s => s.value === status)?.color || "";

            return (
              <Button
                key={status}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status as any)}
                className="whitespace-nowrap text-xs"
              >
                {isActive && <div className={`w-1.5 h-1.5 rounded-full ml-1 bg-${color}-500`} />}
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* فیلتر تاریخ */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground self-center">بازه زمانی:</span>
        {[
          { value: "all", label: "همه" },
          { value: "today", label: "امروز" },
          { value: "week", label: "این هفته" },
          { value: "month", label: "این ماه" },
        ].map((item) => (
          <Button
            key={item.value}
            variant={dateRange === item.value ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange(item.value as any)}
            className="text-xs"
          >
            {item.label}
          </Button>
        ))}
      </div>

      {/* لیست نوبت‌ها */}
      <Card>
        <CardContent className="p-0 md:p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>هیچ نوبتی با این فیلترها یافت نشد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">بیمار</TableHead>
                    <TableHead className="min-w-[140px]">تاریخ و زمان</TableHead>
                    <TableHead className="hidden md:table-cell">نوع</TableHead>
                    <TableHead className="min-w-[100px]">وضعیت</TableHead>
                    <TableHead className="text-left min-w-[180px]">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium text-sm">
                          {appointment.patient?.first_name} {appointment.patient?.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {appointment.patient?.national_code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {toJalaliDisplay(appointment.start_time)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {moment(appointment.start_time).format("HH:mm")} -{" "}
                          {moment(appointment.end_time).format("HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {APPOINTMENT_TYPE_MAP[appointment.type as keyof typeof APPOINTMENT_TYPE_MAP] || appointment.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <AppointmentStatusBadge 
                          status={appointment.status} 
                          size="sm"
                          reason={appointment.no_show_reason || appointment.cancellation_reason}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          <AppointmentStatusActions
                            appointment={appointment}
                            onStatusChange={loadAppointments}
                            size="sm"
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <ChevronLeft className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)}>
                                مشاهده جزئیات
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(appointment)}>
                                ویرایش
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(appointment)}
                              >
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* فرم ثبت/ویرایش */}
      {showForm && (
        <AppointmentForm
          appointment={selectedAppointment}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setSelectedAppointment(null);
          }}
          isOpen={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) setSelectedAppointment(null);
          }}
        />
      )}
    </div>
  );
}