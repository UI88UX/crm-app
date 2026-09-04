// src/app/dashboard/patients/page.client.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
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
  Pencil
} from "lucide-react";

// ✅ ایمپورت Hooks جدید
import { usePatients, useDeletePatient } from "@/hooks/usePatients";
import type { Patient } from "@/types";

interface PatientsPageClientProps {
  // ❌ حذف: initialPatients دیگر نیازی نیست
  // چون داده‌ها از React Query می‌آید
}

export default function PatientsPageClient() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ استفاده از useQuery برای دریافت بیماران
  const {
    data: patients = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePatients({
    search: searchTerm || undefined,
    limit: 100,
  });

  // ✅ استفاده از useMutation برای حذف
  const deletePatient = useDeletePatient();

  // فیلتر کردن بیماران (اکنون در سمت سرور انجام می‌شود)
  // اما برای جستجوی لحظه‌ای، همچنان از useMemo استفاده می‌کنیم
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients;

    const term = searchTerm.toLowerCase().trim();
    return patients.filter((patient) => {
      const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
      const nationalCode = patient.national_code.toLowerCase();
      const phone = patient.phone.toLowerCase();

      return (
        fullName.includes(term) ||
        nationalCode.includes(term) ||
        phone.includes(term)
      );
    });
  }, [patients, searchTerm]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fa-IR');
    } catch {
      return '—';
    }
  };

  const getGenderLabel = (gender: string) => {
    const genders: Record<string, string> = {
      male: 'مرد',
      female: 'زن',
      other: 'سایر'
    };
    return genders[gender] || gender;
  };

  // اگر خطا رخ داده باشد
  if (isError) {
    return (
      <div className="p-6 space-y-6" dir="rtl">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <p>خطا در بارگذاری بیماران: {error?.message || 'خطای ناشناخته'}</p>
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
            <RefreshCw className={`w-4 h-4 ml-2 ${isFetching ? 'animate-spin' : ''}`} />
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

      {/* جستجو */}
      <div className="relative w-full md:w-96">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="جستجو در بیماران..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* آمار */}
      <div className="flex gap-4 text-sm">
        <span className="text-gray-500">
          تعداد کل: <strong className="text-gray-900">{patients.length}</strong>
        </span>
        {searchTerm && (
          <span className="text-gray-500">
            نتیجه جستجو: <strong className="text-gray-900">{filteredPatients.length}</strong>
          </span>
        )}
        {isLoading && (
          <span className="text-blue-500 flex items-center gap-1">
            <LoadingSpinner size="sm" />
            بارگذاری...
          </span>
        )}
      </div>

      {/* لیست بیماران */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? "هیچ بیماری با این جستجو یافت نشد" : "هیچ بیمار ثبت نشده است"}
          </p>
          {!searchTerm && (
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
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-lg">
                    {patient.first_name} {patient.last_name}
                  </span>
                  <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                    {getGenderLabel(patient.gender || '')}
                  </span>
                  <span className="text-xs text-gray-400">
                    <Calendar className="w-3 h-3 inline ml-1" />
                    {formatDate(patient.created_at)}
                  </span>
                  {/* فایل‌ها و فروش‌ها - در صورت وجود */}
                  {(patient as any).file_count !== undefined && (patient as any).file_count > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FolderOpen className="w-3 h-3" />
                      {(patient as any).file_count} فایل
                    </span>
                  )}
                  {(patient as any).sales_count !== undefined && (patient as any).sales_count > 0 && (
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
                    if (confirm(`آیا از حذف ${patient.first_name} ${patient.last_name} اطمینان دارید؟`)) {
                      deletePatient.mutate(patient.id);
                    }
                  }}
                  variant="destructive"
                  size="sm"
                  disabled={deletePatient.isPending && deletePatient.variables === patient.id}
                >
                  {deletePatient.isPending && deletePatient.variables === patient.id ? (
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
          ))}
        </div>
      )}
    </div>
  );
}