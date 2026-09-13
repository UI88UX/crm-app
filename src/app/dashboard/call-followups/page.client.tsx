// src/app/dashboard/call-followups/page.client.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  RefreshCw,
  Filter,
  Search,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
} from "lucide-react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";

import {
  useCallFollowups,
  useCompleteCallFollowup,
  useCancelCallFollowup,
} from "@/hooks/useCallFollowups";
import { useCallFollowupStats } from "@/hooks/useCallFollowupStats";
import { CallFollowupCard } from "@/components/call-followups/CallFollowupCard";
import { CompleteCallFollowupDialog } from "@/components/call-followups/CompleteCallFollowupDialog";
import { CALL_RESULTS, type CallFollowup, type CallResult } from "@/types";

type TabValue = 'active' | 'history' | 'all';
type DateRangePreset = 'all' | 'today' | 'week' | 'month' | '3months' | 'custom';

/**
 * محاسبه بازه تاریخی بر اساس preset
 * customFrom/customTo تاریخ میلادی (Date) هستند
 */
function getDateRangeBounds(
  preset: DateRangePreset,
  customFrom: Date | null,
  customTo: Date | null
): { from: Date | null; to: Date | null } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { from: startOfToday, to: null };
    case 'week':
      return { from: new Date(startOfToday.getTime() - 7 * 86400000), to: null };
    case 'month':
      return { from: new Date(startOfToday.getTime() - 30 * 86400000), to: null };
    case '3months':
      return { from: new Date(startOfToday.getTime() - 90 * 86400000), to: null };
    case 'custom': {
      const from = customFrom ? new Date(customFrom) : null;
      const to = customTo ? new Date(customTo) : null;
      if (from) from.setHours(0, 0, 0, 0);
      if (to) to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    default:
      return { from: null, to: null };
  }
}

export default function CallFollowupsPageClient() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabValue>('active');
  const [searchTerm, setSearchTerm] = useState("");
  const [resultFilter, setResultFilter] = useState<CallResult | 'all'>('all');
  const [selectedFollowupForComplete, setSelectedFollowupForComplete] =
    useState<CallFollowup | null>(null);

  // فیلتر تاریخ — فقط برای تاریخچه و همه
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('all');
  // برای نمایش در DatePicker (رشته شمسی)
  const [customFrom, setCustomFrom] = useState<string | null>(null);
  const [customTo, setCustomTo] = useState<string | null>(null);
  // برای منطق فیلتر (Date میلادی)
  const [customFromDate, setCustomFromDate] = useState<Date | null>(null);
  const [customToDate, setCustomToDate] = useState<Date | null>(null);

  // آمار
  const { data: stats } = useCallFollowupStats();

  // لیست
  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useCallFollowups({
    limit: 200,
  });

  const allFollowups = response?.data || [];

  // Mutations
  const cancelFollowup = useCancelCallFollowup();

  // فیلتر بر اساس تب و جستجو
  const filteredFollowups = useMemo(() => {
    let list = allFollowups;

    // تب
    if (activeTab === 'active') {
      list = list.filter((f) => f.status === 'pending' || f.status === 'rescheduled');
    } else if (activeTab === 'history') {
      list = list.filter((f) => f.status === 'completed' || f.status === 'cancelled');
    }

    // فیلتر تاریخ — فقط برای تاریخچه و همه
    if (activeTab !== 'active') {
      const { from, to } = getDateRangeBounds(
        dateRangePreset,
        customFromDate,
        customToDate
      );

      if (from || to) {
        list = list.filter((f) => {
          const targetDate = f.completed_at
            ? new Date(f.completed_at)
            : new Date(f.due_date);

          if (from && targetDate < from) return false;
          if (to && targetDate > to) return false;
          return true;
        });
      }
    }

    // فیلتر نتیجه
    if (resultFilter !== 'all') {
      list = list.filter((f) => f.result === resultFilter);
    }

    // جستجو
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter((f) => {
        const patient = f.patient;
        if (!patient) return false;
        const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
        const nationalCode = patient.national_code?.toLowerCase() || '';
        const phone = patient.phone?.toLowerCase() || '';
        return (
          fullName.includes(term) ||
          nationalCode.includes(term) ||
          phone.includes(term)
        );
      });
    }

    return list;
  }, [
    allFollowups,
    activeTab,
    resultFilter,
    searchTerm,
    dateRangePreset,
    customFromDate,
    customToDate,
  ]);

  // تفکیک برای نمایش در تب فعال
  const now = new Date();
  const overdueFollowups = filteredFollowups.filter(
    (f) => new Date(f.due_date) < now && f.status === 'pending'
  );

  // ریست فیلترها هنگام تغییر تب
  useEffect(() => {
    if (activeTab === 'active') {
      setResultFilter('all');
      setDateRangePreset('all');
      setCustomFrom(null);
      setCustomTo(null);
      setCustomFromDate(null);
      setCustomToDate(null);
    }
  }, [activeTab]);

  // هندلرها
  const handleCancelFollowup = (followup: CallFollowup) => {
    if (confirm('آیا از لغو این قرار تماس اطمینان دارید؟')) {
      cancelFollowup.mutate(followup.id);
    }
  };

  const handleComplete = (followup: CallFollowup) => {
    setSelectedFollowupForComplete(followup);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setResultFilter('all');
    setDateRangePreset('all');
    setCustomFrom(null);
    setCustomTo(null);
    setCustomFromDate(null);
    setCustomToDate(null);
  };

  const hasActiveFilter =
    searchTerm || resultFilter !== 'all' || dateRangePreset !== 'all';

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* هدر */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Phone className="w-7 h-7 text-orange-500" />
            پیگیری‌های تلفنی
          </h1>
          <p className="text-gray-500 mt-1">
            مدیریت قرارهای تماس تلفنی با بیماران
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isFetching}
          >
            <RefreshCw
              className={`w-4 h-4 ml-2 ${isFetching ? 'animate-spin' : ''}`}
            />
            {isFetching ? "در حال بارگذاری..." : "بروزرسانی"}
          </Button>
        </div>
      </div>

      {/* کارت‌های آمار */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-600 font-medium">عقب‌افتاده</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">
                    {stats.overdue}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-600 font-medium">امروز</p>
                  <p className="text-2xl font-bold text-orange-700 mt-1">
                    {stats.today}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">فردا</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {stats.tomorrow}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-gray-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">کل در انتظار</p>
                  <p className="text-2xl font-bold text-gray-700 mt-1">
                    {stats.total_pending}
                  </p>
                </div>
                <Phone className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* فیلترها */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* جستجو */}
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="جستجو در نام، کد ملی یا تلفن بیمار..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* فیلتر نتیجه */}
            <div className="md:w-64">
              <Select
                value={resultFilter}
                onValueChange={(val) => setResultFilter(val as CallResult | 'all')}
                disabled={activeTab === 'active'}
              >
                <SelectTrigger
                  disabled={activeTab === 'active'}
                  title={
                    activeTab === 'active'
                      ? 'در تب «فعال» فیلتر نتیجه کار نمی‌کند (پیگیری‌ها هنوز نتیجه ندارند)'
                      : undefined
                  }
                >
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="فیلتر بر اساس نتیجه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه نتایج</SelectItem>
                  {CALL_RESULTS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <span className="flex items-center gap-2">
                        <span>{r.emoji}</span>
                        {r.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeTab === 'active' && (
                <p className="text-xs text-muted-foreground mt-1 mr-1">
                  در تب «فعال» فیلتر نتیجه غیرفعال است
                </p>
              )}
            </div>
          </div>

          {/* فیلتر تاریخ — فقط برای تاریخچه و همه */}
          {activeTab !== 'active' && (
            <div className="mt-3 pt-3 border-t flex flex-col md:flex-row gap-3">
              <div className="md:w-48">
                <Select
                  value={dateRangePreset}
                  onValueChange={(v) => setDateRangePreset(v as DateRangePreset)}
                >
                  <SelectTrigger>
                    <CalendarDays className="w-4 h-4 ml-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه زمان‌ها</SelectItem>
                    <SelectItem value="today">امروز</SelectItem>
                    <SelectItem value="week">۷ روز اخیر</SelectItem>
                    <SelectItem value="month">۳۰ روز اخیر</SelectItem>
                    <SelectItem value="3months">۳ ماه اخیر</SelectItem>
                    <SelectItem value="custom">بازه دلخواه</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRangePreset === 'custom' && (
                <>
                  <div className="flex-1">
                    <DatePicker
                      calendar={persian}
                      locale={persian_fa}
                      value={customFrom || ""}
                      onChange={(date: any) => {
                        if (date && date.isValid) {
                          const gregorian = date.toDate();
                          setCustomFrom(date.format("YYYY/MM/DD"));
                          setCustomFromDate(gregorian);
                        } else {
                          setCustomFrom(null);
                          setCustomFromDate(null);
                        }
                      }}
                      format="YYYY/MM/DD"
                      placeholder="از تاریخ"
                      className="w-full"
                      containerClassName="w-full"
                      inputClass="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      calendarPosition="bottom-right"
                    />
                  </div>
                  <div className="flex-1">
                    <DatePicker
                      calendar={persian}
                      locale={persian_fa}
                      value={customTo || ""}
                      onChange={(date: any) => {
                        if (date && date.isValid) {
                          const gregorian = date.toDate();
                          setCustomTo(date.format("YYYY/MM/DD"));
                          setCustomToDate(gregorian);
                        } else {
                          setCustomTo(null);
                          setCustomToDate(null);
                        }
                      }}
                      format="YYYY/MM/DD"
                      placeholder="تا تاریخ"
                      className="w-full"
                      containerClassName="w-full"
                      inputClass="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      calendarPosition="bottom-right"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* آمار فیلترشده */}
          <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
            <span>
              نمایش: <strong className="text-gray-900">{filteredFollowups.length}</strong> از{' '}
              {allFollowups.length}
            </span>
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-7 text-xs"
              >
                پاک کردن فیلترها
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* تب‌ها */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as TabValue)}
      >
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="active" className="gap-2">
            <Clock className="w-4 h-4" />
            فعال
            {activeTab === 'active' && (
              <Badge variant="secondary" className="text-[10px] h-5">
                {filteredFollowups.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            تاریخچه
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            همه
          </TabsTrigger>
        </TabsList>

        {/* محتوای تب‌ها */}
        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredFollowups.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm
                    ? "هیچ پیگیری‌ای با این جستجو یافت نشد"
                    : activeTab === 'active'
                      ? "پیگیری فعالی وجود ندارد"
                      : activeTab === 'history'
                        ? "تاریخچه‌ای وجود ندارد"
                        : "هیچ پیگیری‌ای ثبت نشده است"}
                </p>
                {hasActiveFilter && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleClearFilters}
                  >
                    پاک کردن فیلترها
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeTab === 'active' && overdueFollowups.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-red-600 flex items-center gap-2 px-1">
                    <AlertTriangle className="w-4 h-4" />
                    عقب‌افتاده ({overdueFollowups.length})
                  </h3>
                  {overdueFollowups.map((f) => (
                    <CallFollowupCard
                      key={f.id}
                      followup={f}
                      onComplete={handleComplete}
                      onCancel={handleCancelFollowup}
                    />
                  ))}
                </div>
              )}

              {(() => {
                const restList =
                  activeTab === 'active'
                    ? filteredFollowups.filter(
                        (f) => !overdueFollowups.some((o) => o.id === f.id)
                      )
                    : filteredFollowups;

                if (restList.length === 0) return null;

                return (
                  <div className="space-y-2">
                    {activeTab === 'active' && overdueFollowups.length > 0 && (
                      <h3 className="text-sm font-bold text-gray-600 px-1 mt-4">
                        سایر پیگیری‌ها ({restList.length})
                      </h3>
                    )}
                    {restList.map((f) => (
                      <CallFollowupCard
                        key={f.id}
                        followup={f}
                        onComplete={activeTab === 'active' ? handleComplete : undefined}
                        onCancel={activeTab === 'active' ? handleCancelFollowup : undefined}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* دیالوگ ثبت نتیجه */}
      <CompleteCallFollowupDialog
        followup={selectedFollowupForComplete}
        open={!!selectedFollowupForComplete}
        onOpenChange={(open) => {
          if (!open) setSelectedFollowupForComplete(null);
        }}
        onSuccess={() => {
          setSelectedFollowupForComplete(null);
          toast.success('نتیجه مکالمه ثبت شد');
        }}
      />
    </div>
  );
}