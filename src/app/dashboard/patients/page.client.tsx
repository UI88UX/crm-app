// src/app/dashboard/patients/page.client.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Search,
  RefreshCw,
  UserPlus,
  Trash2,
  User,
  Phone,
  Calendar,
  FolderOpen,
  ShoppingBag,
  Pencil,
  Filter,
  X,
  PhoneCall,
} from "lucide-react";

import { usePatients, useDeletePatient } from "@/hooks/usePatients";
import { CallResultBadge } from "@/components/call-followups/CallResultBadge";
import { CALL_RESULTS, type CallResult } from "@/types";

export default function PatientsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // خواندن فیلترها از URL
  const searchTerm = searchParams.get("q") || "";
  const callResult = (searchParams.get("call_result") as CallResult) || undefined;
  const hasPending = searchParams.get("has_pending") === "true";

  // state محلی برای input جستجو (debounced به URL می‌ره)
  const [searchInput, setSearchInput] = useState(searchTerm);

  // sync searchInput با URL
  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  // debounce برای به‌روزرسانی URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchTerm) {
        updateFilters({ q: searchInput || undefined });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ✅ تابع کمکی برای به‌روزرسانی URL
  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  // ✅ پاک کردن همه فیلترها
  const clearFilters = () => {
    setSearchInput("");
    router.push(pathname);
  };

  // ✅ آیا فیلتری فعاله؟
  const hasActiveFilters = !!(searchTerm || callResult || hasPending);

  // React Query
  const {
    data: patients = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePatients({
    search: searchTerm || undefined,
    call_result: callResult,
    has_pending_followup: hasPending || undefined,
    limit: 100,
  });

  const deletePatient = useDeletePatient();

  // محاسبه‌ی آمار نمایشی
  const stats = useMemo(() => {
    return {
      total: patients.length,
      positive: patients.filter((p) => (p as any).last_call_result === "positive")
        .length,
      withPending: patients.filter((p) => (p as any).next_call_due_at).length,
    };
  }, [patients]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("fa-IR");
    } catch {
      return "—";
    }
  };

  const getGenderLabel = (gender: string) => {
    const genders: Record<string, string> = {
      male: "مرد",
      female: "زن",
      other: "سایر",
    };
    return genders[gender] || gender;
  };

  if (isError) {
    return (
      <div className="p-6 space-y-6" dir="rtl">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <p>خطا در بارگذاری بیماران: {error?.message || "خطای ناشناخته"}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => refetch()}
          >
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-4">
        <div>
          <h1 className="text-3xl font-bold">مدیریت بیماران</h1>
          <p className="text-gray-500 mt-1">مدیریت اطلاعات بیماران مطب</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isFetching}
          >
            <RefreshCw
              className={`w-4 h-4 ml-2 ${isFetching ? "animate-spin" : ""}`}
            />
            {isFetching ? "در حال بارگذاری..." : "بروزرسانی"}
          </Button>
          <Link href="/dashboard/patients/new">
            <Button size="sm">
              <UserPlus className="w-4 h-4 ml-2" />
              بیمار جدید
            </Button>
          </Link>
        </div>
      </div>

      {/* نوار فیلترها */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* جستجو */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="جستجو در نام، کد ملی یا تلفن..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* فیلتر وضعیت پیگیری تلفنی */}
          <div className="md:w-72">
            <Select
              value={callResult || "all"}
              onValueChange={(val) =>
                updateFilters({
                  call_result: val === "all" ? undefined : val,
                })
              }
            >
              <SelectTrigger>
                <PhoneCall className="w-4 h-4 ml-2 text-blue-500" />
                <SelectValue placeholder="وضعیت پیگیری تلفنی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه بیماران</SelectItem>
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
          </div>

          {/* فیلتر پیگیری فعال */}
          <Button
            variant={hasPending ? "default" : "outline"}
            size="sm"
            onClick={() =>
              updateFilters({
                has_pending: hasPending ? undefined : "true",
              })
            }
            className={`h-10 ${
              hasPending ? "bg-blue-600 hover:bg-blue-700" : ""
            }`}
          >
            <PhoneCall className="w-4 h-4 ml-2" />
            پیگیری فعال
            {hasPending && (
              <X className="w-3 h-3 mr-2" />
            )}
          </Button>

          {/* پاک کردن فیلترها */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4 ml-1" />
              پاک کردن
            </Button>
          )}
        </div>

        {/* چیپ‌های فیلتر فعال */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">فیلترهای فعال:</span>

            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                جستجو: {searchTerm}
              </Badge>
            )}

            {callResult && (
              <Badge variant="secondary" className="gap-1">
                <CallResultBadge result={callResult} size="sm" />
              </Badge>
            )}

            {hasPending && (
              <Badge
                variant="secondary"
                className="gap-1 bg-blue-100 text-blue-700"
              >
                <PhoneCall className="w-3 h-3" />
                دارای پیگیری فعال
              </Badge>
            )}
          </div>
        )}

        {/* آمار */}
        <div className="flex gap-4 text-sm flex-wrap pt-2 border-t">
          <span className="text-gray-500">
            نمایش:{" "}
            <strong className="text-gray-900">{patients.length}</strong> بیمار
          </span>
          {isLoading && (
            <span className="text-blue-500 flex items-center gap-1">
              <LoadingSpinner size="sm" />
              بارگذاری...
            </span>
          )}
        </div>
      </div>

      {/* لیست بیماران */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {hasActiveFilters
              ? "هیچ بیماری با این فیلترها یافت نشد"
              : "هیچ بیمار ثبت نشده است"}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              <X className="w-4 h-4 ml-2" />
              پاک کردن فیلترها
            </Button>
          ) : (
            <Link href="/dashboard/patients/new">
              <Button variant="outline" className="mt-4">
                <UserPlus className="w-4 h-4 ml-2" />
                ثبت اولین بیمار
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {patients.map((patient) => {
            const lastCallResult = (patient as any).last_call_result as
              | CallResult
              | null
              | undefined;
            const nextCallDue = (patient as any).next_call_due_at as
              | string
              | null
              | undefined;

            return (
              <div
                key={patient.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-lg">
                      {patient.first_name} {patient.last_name}
                    </span>
                    <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                      {getGenderLabel(patient.gender || "")}
                    </span>
                    <span className="text-xs text-gray-400">
                      <Calendar className="w-3 h-3 inline ml-1" />
                      {formatDate(patient.created_at)}
                    </span>

                    {/* ✅ نتیجه آخرین پیگیری */}
                    {lastCallResult && (
                      <CallResultBadge result={lastCallResult} size="sm" />
                    )}

                    {/* ✅ هشدار پیگیری نزدیک */}
                    {nextCallDue && (
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200 gap-1 text-xs"
                      >
                        <PhoneCall className="w-3 h-3" />
                        پیگیری فعال
                      </Badge>
                    )}

                    {/* فایل‌ها و فروش‌ها */}
                    {(patient as any).file_count !== undefined &&
                      (patient as any).file_count > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FolderOpen className="w-3 h-3" />
                          {(patient as any).file_count} فایل
                        </span>
                      )}
                    {(patient as any).sales_count !== undefined &&
                      (patient as any).sales_count > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" />
                          {(patient as any).sales_count} خرید
                        </span>
                      )}
                  </div>

                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <span className="text-gray-600 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      کد ملی: {patient.national_code}
                    </span>
                    <span className="text-gray-600 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {patient.phone}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 md:mt-0">
                  <Link href={`/dashboard/patients/${patient.id}`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="w-4 h-4 ml-1" />
                      ویرایش
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      if (
                        confirm(
                          `آیا از حذف ${patient.first_name} ${patient.last_name} اطمینان دارید؟`
                        )
                      ) {
                        deletePatient.mutate(patient.id);
                      }
                    }}
                    variant="destructive"
                    size="sm"
                    disabled={
                      deletePatient.isPending &&
                      deletePatient.variables === patient.id
                    }
                  >
                    {deletePatient.isPending &&
                    deletePatient.variables === patient.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 ml-1" />
                        حذف
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}