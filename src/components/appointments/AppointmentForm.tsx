// src/components/appointments/AppointmentForm.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CalendarIcon,
  Clock,
  Loader2,
  Search,
  X,
  User,
  Phone,
  CreditCard,
  MapPin,
  Stethoscope,
  FileText,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Plus,
  UserPlus
} from "lucide-react";
import moment from "moment-jalaali";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { appointmentSchema, type AppointmentFormData } from "@/lib/validations/appointment";
import { APPOINTMENT_TYPES, APPOINTMENT_STATUSES, type Appointment, type AppointmentStatus, type Patient } from "@/types";
import { toJalali, fromJalali } from "@/lib/util/jalaliDate";


// ============================================
// Types
// ============================================

interface AppointmentFormProps {
  appointment?: Appointment | null;
  patientId?: string;
  onSuccess?: (data: Appointment) => void;
  onCancel?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// ============================================
// Custom Hook for Debounce
// ============================================
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// Status Badge Component
// ============================================
const StatusBadge = ({ status }: { status: AppointmentStatus }) => {
  const statusConfig: Record<AppointmentStatus, {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }> = {
    scheduled: {
      label: "برنامه‌ریزی شده",
      icon: CalendarIcon,
      className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100"
    },
    confirmed: {
      label: "تایید شده",
      icon: CheckCircle2,
      className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
    },
    pending: {
      label: "در انتظار",
      icon: Clock,
      className: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100"
    },
    in_progress: {
      label: "در حال انجام",
      icon: Loader2,
      className: "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
    },
    completed: {
      label: "تکمیل شده",
      icon: CheckCircle2,
      className: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100"
    },
    cancelled: {
      label: "لغو شده",
      icon: X,
      className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
    },
    no_show: {
      label: "عدم مراجعه",
      icon: AlertCircle,
      className: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100"
    },
  };

  const config = statusConfig[status];

  if (!config) {
    return (
      <Badge variant="outline" className="gap-1.5 bg-gray-100 text-gray-700">
        <AlertCircle className="w-3.5 h-3.5" />
        نامشخص
      </Badge>
    );
  }

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1.5 ${config.className}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  );
};
// ============================================
// Component
// ============================================

export function AppointmentForm({
  appointment,
  patientId: initialPatientId,
  onSuccess,
  onCancel,
  isOpen = true,
  onOpenChange,
}: AppointmentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSearch, setShowPatientSearch] = useState(!initialPatientId);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("10:00");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("patient");

  // استفاده از debounce برای searchQuery
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Ref برای جلوگیری از فراخوانی‌های تکراری
  const abortControllerRef = useRef<AbortController | null>(null);

  const isEditing = !!appointment;

  // تابع تشخیص تب دارای خطا 
  const getTabErrorStatus = (tab: string) => {
    switch (tab) {
      case 'patient':
        return !!errors.patient_id;
      case 'datetime':
        return !!(errors.start_time || errors.end_time);
      case 'details':
        return !!(errors.title || errors.description || errors.notes || errors.type || errors.status);
      default:
        return false;
    }
  };

  // تابع تغییر تب با اعتبارسنجی
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: appointment?.patient_id || initialPatientId || "",
      start_time: appointment?.start_time || "",
      end_time: appointment?.end_time || "",
      type: appointment?.type || "visit",
      status: appointment?.status || "scheduled",
      title: appointment?.title || "",
      description: appointment?.description || "",
      notes: appointment?.notes || "",
    },
  });

  const watchPatientId = watch("patient_id");
  const watchType = watch("type");
  const watchStatus = watch("status");

  // جستجوی بیماران با debounce و abort controller
  const searchPatients = useCallback(async (query: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!query || query.length < 2) {
      setPatients([]);
      return;
    }

    abortControllerRef.current = new AbortController();

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/patients/search?q=${encodeURIComponent(query)}&limit=10`,
        { signal: abortControllerRef.current.signal }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "خطا در جستجوی بیماران");
      }

      setPatients(result.data || []);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error("Error searching patients:", error);
      toast.error("خطا در جستجوی بیماران");
    } finally {
      setIsSearching(false);
    }
  }, []);

  // اجرای جستجو با debouncedSearchQuery
  useEffect(() => {
    searchPatients(debouncedSearchQuery);
  }, [debouncedSearchQuery, searchPatients]);

  // انتخاب بیمار
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setValue("patient_id", patient.id);
    setSearchQuery(`${patient.first_name} ${patient.last_name} - ${patient.national_code}`);
    setShowPatientSearch(false);
    setPatients([]);
    setActiveTab("datetime");
  };

  // تغییر input جستجو
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.length < 2) {
      setPatients([]);
    }
  };

  // تنظیم تاریخ و زمان
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    setStartTime(time);

    if (selectedDate && time) {
      const dateTime = new Date(`${selectedDate}T${time}:00`);
      if (!isNaN(dateTime.getTime())) {
        setValue("start_time", dateTime.toISOString());
      }
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    setEndTime(time);

    if (selectedDate && time) {
      const dateTime = new Date(`${selectedDate}T${time}:00`);
      if (!isNaN(dateTime.getTime())) {
        setValue("end_time", dateTime.toISOString());
      }
    }
  };

  // مقداردهی اولیه تاریخ و زمان
  useEffect(() => {
    if (appointment?.start_time) {
      const date = new Date(appointment.start_time);
      const dateStr = date.toISOString().split('T')[0];
      setSelectedDate(dateStr);
      setStartTime(date.toTimeString().slice(0, 5));
    }
    if (appointment?.end_time) {
      const date = new Date(appointment.end_time);
      setEndTime(date.toTimeString().slice(0, 5));
    }
    if (appointment?.patient_id) {
      setShowPatientSearch(false);
    }
  }, [appointment]);

  // اگر patientId از بیرون داده شده، بیمار را انتخاب کن
  useEffect(() => {
    if (initialPatientId && !appointment) {
      const fetchPatient = async () => {
        try {
          const response = await fetch(`/api/patients/${initialPatientId}`);
          const result = await response.json();
          if (response.ok && result.data) {
            setSelectedPatient(result.data);
            setValue("patient_id", initialPatientId);
            setSearchQuery(`${result.data.first_name} ${result.data.last_name}`);
            setShowPatientSearch(false);
          }
        } catch (error) {
          console.error("Error fetching patient:", error);
        }
      };
      fetchPatient();
    }
  }, [initialPatientId, appointment, setValue]);

  // ثبت فرم
  const onSubmit = async (data: AppointmentFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = isEditing ? `/api/appointments/${appointment?.id}` : "/api/appointments";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: data.patient_id,
          start_time: data.start_time,
          end_time: data.end_time,
          type: data.type,
          status: data.status || "scheduled",
          title: data.title || null,
          description: data.description || null,
          notes: data.notes || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "خطا در ثبت نوبت");
      }

      toast.success(isEditing ? "نوبت با موفقیت ویرایش شد" : "نوبت با موفقیت ثبت شد", {
        icon: <CheckCircle2 className="w-4 h-4" />,
      });

      if (onSuccess) {
        onSuccess(result.data);
      }

      reset();
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "خطا در ثبت نوبت";
      toast.error(message, {
        icon: <AlertCircle className="w-4 h-4" />,
      });
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup abort controller
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Helper function to get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'visit': return <Stethoscope className="w-4 h-4" />;
      case 'consultation': return <MessageSquare className="w-4 h-4" />;
      case 'followup': return <FileText className="w-4 h-4" />;
      default: return <CalendarIcon className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-background to-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {isEditing ? (
                  <>
                    <CalendarIcon className="w-6 h-6 text-primary" />
                    ویرایش نوبت
                  </>
                ) : (
                  <>
                    <Plus className="w-6 h-6 text-primary" />
                    ثبت نوبت جدید
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="mt-1.5">
                {isEditing
                  ? "اطلاعات نوبت را ویرایش کنید"
                  : "لطفاً اطلاعات نوبت جدید را وارد کنید"}
              </DialogDescription>
            </div>
            {isEditing && appointment && (
              <StatusBadge status={appointment.status} />
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger
                  value="patient"
                  className={`gap-2 ${getTabErrorStatus('patient') ? 'text-red-600 border-red-500 bg-red-50' : ''}`}
                >
                  <User className="w-4 h-4" />
                  بیمار
                  {getTabErrorStatus('patient') && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="datetime"
                  className={`gap-2 ${getTabErrorStatus('datetime') ? 'text-red-600 border-red-500 bg-red-50' : ''}`}
                >
                  <Clock className="w-4 h-4" />
                  تاریخ و زمان
                  {getTabErrorStatus('datetime') && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className={`gap-2 ${getTabErrorStatus('details') ? 'text-red-600 border-red-500 bg-red-50' : ''}`}
                >
                  <FileText className="w-4 h-4" />
                  جزئیات نوبت
                  {getTabErrorStatus('details') && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Tab: Patient Selection */}
              <TabsContent value="patient" className="space-y-4 mt-0">
                {showPatientSearch ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                        <Search className="w-4 h-4 text-primary" />
                        جستجوی بیمار
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          placeholder="نام، نام خانوادگی یا کد ملی را وارد کنید..."
                          value={searchQuery}
                          onChange={handleSearchInputChange}
                          className="pl-10 h-12 text-base shadow-sm focus:ring-2 focus:ring-primary/20"
                          autoFocus
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        حداقل ۲ کاراکتر برای جستجو وارد کنید
                      </p>
                    </div>

                    {/* نتایج جستجو */}
                    {patients.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">
                          نتایج جستجو ({patients.length} بیمار)
                        </Label>
                        <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto bg-background shadow-sm">
                          {patients.map((patient) => (
                            <button
                              key={patient.id}
                              type="button"
                              onClick={() => handleSelectPatient(patient)}
                              className="w-full text-left p-4 hover:bg-primary/5 transition-all duration-200 group"
                            >
                              <div className="flex items-start justify-between">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                      <User className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                      <div className="font-semibold text-base group-hover:text-primary transition-colors">
                                        {patient.first_name} {patient.last_name}
                                      </div>
                                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1">
                                          <CreditCard className="w-3.5 h-3.5" />
                                          {patient.national_code}
                                        </span>
                                        {patient.phone && (
                                          <span className="flex items-center gap-1">
                                            <Phone className="w-3.5 h-3.5" />
                                            {patient.phone}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isSearching && searchQuery.length >= 2 && patients.length === 0 && (
                      <div className="text-center py-8 bg-muted/30 rounded-lg">
                        <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">بیماری با این مشخصات یافت نشد</p>
                        <Button variant="link" className="mt-2">
                          ثبت بیمار جدید
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-primary" />
                      بیمار انتخاب شده
                    </Label>
                    <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-8 h-8 text-primary" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-xl font-bold">
                                {selectedPatient?.first_name} {selectedPatient?.last_name}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <CreditCard className="w-4 h-4" />
                                  کد ملی: {selectedPatient?.national_code}
                                </span>
                                {selectedPatient?.phone && (
                                  <span className="flex items-center gap-1.5">
                                    <Phone className="w-4 h-4" />
                                    تلفن: {selectedPatient?.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setShowPatientSearch(true);
                                    setSelectedPatient(null);
                                    setValue("patient_id", "");
                                  }}
                                  className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>تغییر بیمار</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {errors.patient_id && (
                  <p className="text-sm text-red-500 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.patient_id.message}
                  </p>
                )}
              </TabsContent>

              {/* Tab: Date & Time */}
              <TabsContent value="datetime" className="space-y-4 mt-0">
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-primary" />
                    تاریخ و زمان نوبت
                  </Label>
                  <Card>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* تاریخ */}
                        <div className="space-y-2">
                          <Label className="font-medium">تاریخ</Label>
                          <DatePicker
                            calendar={persian}
                            locale={persian_fa}
                            value={selectedDate ? new Date(selectedDate) : null}
                            onChange={(date: any) => {
                              if (date && date.isValid) {
                                const gregorianDate = date.toDate();
                                const dateStr = gregorianDate.toISOString().split('T')[0];
                                setSelectedDate(dateStr);

                                if (startTime) {
                                  const startDateTime = new Date(`${dateStr}T${startTime}:00`);
                                  if (!isNaN(startDateTime.getTime())) {
                                    setValue("start_time", startDateTime.toISOString());
                                  }
                                }
                                if (endTime) {
                                  const endDateTime = new Date(`${dateStr}T${endTime}:00`);
                                  if (!isNaN(endDateTime.getTime())) {
                                    setValue("end_time", endDateTime.toISOString());
                                  }
                                }
                              } else {
                                setSelectedDate("");
                              }
                            }}
                            format="YYYY/MM/DD"
                            placeholder="انتخاب تاریخ"
                            className="w-full p-2.5 border rounded-lg bg-background hover:border-primary/50 transition-colors"
                            containerClassName="w-full"
                          />
                        </div>

                        {/* زمان شروع */}
                        <div className="space-y-2">
                          <Label className="font-medium">زمان شروع</Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="time"
                              value={startTime}
                              onChange={handleStartTimeChange}
                              className="w-full p-2.5 pl-10 border rounded-lg bg-background hover:border-primary/50 transition-colors focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                          {errors.start_time && (
                            <p className="text-sm text-red-500 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {errors.start_time.message}
                            </p>
                          )}
                        </div>

                        {/* زمان پایان */}
                        <div className="space-y-2">
                          <Label className="font-medium">زمان پایان</Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="time"
                              value={endTime}
                              onChange={handleEndTimeChange}
                              className="w-full p-2.5 pl-10 border rounded-lg bg-background hover:border-primary/50 transition-colors focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                          {errors.end_time && (
                            <p className="text-sm text-red-500 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {errors.end_time.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* نمایش تاریخ انتخاب شده */}
                      {selectedDate && (
                        <div className="bg-muted/30 p-3 rounded-lg flex items-center gap-3">
                          <CalendarIcon className="w-5 h-5 text-primary" />
                          <span className="text-sm">
                            تاریخ انتخاب شده: <strong>{toJalali(selectedDate)}</strong>
                          </span>
                          <span className="text-sm text-muted-foreground">|</span>
                          <span className="text-sm">
                            ساعت: <strong>{startTime}</strong> تا <strong>{endTime}</strong>
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab: Appointment Details */}
              <TabsContent value="details" className="space-y-4 mt-0">
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-primary" />
                    جزئیات نوبت
                  </Label>
                  <Card>
                    <CardContent className="p-6 space-y-6">
                      {/* نوع و وضعیت */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="font-medium flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-primary" />
                            نوع نوبت
                          </Label>
                          <Select
                            defaultValue={watch("type")}
                            onValueChange={(value) => setValue("type", value as any)}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="نوع نوبت را انتخاب کنید" />
                            </SelectTrigger>
                            <SelectContent>
                              {APPOINTMENT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <span className="flex items-center gap-2">
                                    {getTypeIcon(type.value)}
                                    {type.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="font-medium flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-primary" />
                            وضعیت
                          </Label>
                          <Select
                            defaultValue={watch("status")}
                            onValueChange={(value) => setValue("status", value as AppointmentStatus)}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="وضعیت را انتخاب کنید">
                                {watchStatus && <StatusBadge status={watchStatus} />}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {APPOINTMENT_STATUSES.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  <StatusBadge status={status.value} />
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator />

                      {/* عنوان */}
                      <div className="space-y-2">
                        <Label className="font-medium flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          عنوان نوبت
                          <span className="text-xs text-muted-foreground font-normal">(اختیاری)</span>
                        </Label>
                        <Input
                          {...register("title")}
                          placeholder="مثال: ویزیت عمومی، مشاوره تغذیه..."
                          className="h-11"
                        />
                        {errors.title && (
                          <p className="text-sm text-red-500 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {errors.title.message}
                          </p>
                        )}
                      </div>

                      {/* توضیحات */}
                      <div className="space-y-2">
                        <Label className="font-medium flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          توضیحات
                          <span className="text-xs text-muted-foreground font-normal">(اختیاری)</span>
                        </Label>
                        <textarea
                          {...register("description")}
                          className="flex min-h-[100px] w-full rounded-lg border border-input bg-transparent px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
                          placeholder="توضیحات مربوط به نوبت را وارد کنید..."
                        />
                        {errors.description && (
                          <p className="text-sm text-red-500 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {errors.description.message}
                          </p>
                        )}
                      </div>

                      {/* یادداشت */}
                      <div className="space-y-2">
                        <Label className="font-medium flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          یادداشت داخلی
                          <span className="text-xs text-muted-foreground font-normal">(فقط برای پرسنل)</span>
                        </Label>
                        <textarea
                          {...register("notes")}
                          className="flex min-h-[80px] w-full rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-solid focus-visible:border-primary resize-none"
                          placeholder="یادداشت‌های داخلی را وارد کنید..."
                        />
                        {errors.notes && (
                          <p className="text-sm text-red-500 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {errors.notes.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/10">
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel || (() => onOpenChange?.(false))}
              disabled={isLoading}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-4 h-4 ml-2" />
              انصراف
            </Button>
            <div className="flex items-center gap-3">
              {!isEditing && (
                <span className="text-sm text-muted-foreground">
                  {watchPatientId ? "✓ بیمار انتخاب شد" : "! لطفاً بیمار را انتخاب کنید"}
                </span>
              )}
              <Button
                type="submit"
                disabled={isLoading || !watchPatientId}
                size="lg"
                className="gap-2"
                onClick={handleSubmit(onSubmit)}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEditing ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isEditing ? "ذخیره تغییرات" : "ثبت نوبت"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}