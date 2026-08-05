// src/app/dashboard/patients/page.client.tsx
"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { deletePatient, getPatients } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Search, RefreshCw, UserPlus, Trash2, User, Phone, Calendar, FolderOpen, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import Link from "next/link";



interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  national_code: string;
  phone: string;
  gender: string;
  created_at: string;
  file_count?: number;
  sales_count?: number;
}

interface PatientsPageProps {
  initialPatients: Patient[];
}

export default function PatientsPageClient({ initialPatients }: PatientsPageProps) {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // تابع بروزرسانی لیست بیماران
  const refreshPatients = async () => {
    setIsLoading(true);
    try {
      const result = await getPatients();
      if (result?.data) {
        // دریافت تعداد فایل‌ها و فروش‌ها برای هر بیمار
        const { getPatientFiles } = await import("@/lib/storage/patientFiles");

        const patientsWithData = await Promise.all(
          result.data.map(async (patient: Patient) => {
            try {
              // دریافت تعداد فایل‌ها
              const { files } = await getPatientFiles(patient.id);

              // دریافت تعداد فروش‌ها
              const salesResponse = await fetch(`/api/patients/${patient.id}/sales`);
              const salesResult = await salesResponse.json();
              const salesCount = salesResult.data?.length || 0;

              return {
                ...patient,
                file_count: files.length,
                sales_count: salesCount
              };
            } catch {
              return { ...patient, file_count: 0, sales_count: 0 };
            }
          })
        );

        setPatients(patientsWithData);
      } else if (result?.error) {
        console.error("Error refreshing patients:", result.error);
        setError(result.error);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("خطا در بروزرسانی لیست بیماران");
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleDeletePatient = async (id: string) => {
    // تنظیم ID بیمار در حال حذف
    setDeletingPatientId(id);

    try {
      const result = await deletePatient(id);

      if (result?.data) {
        toast.success("بیمار با موفقیت حذف شد!");
        setPatients(prev => prev.filter(p => p.id !== id));
      } else if (result?.error) {
        toast.error(result.error);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("خطای غیرمنتظره رخ داد.");
    } finally {
      setDeletingPatientId(null);
    }
  };

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

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">مدیریت بیماران</h1>
          <p className="text-gray-500 mt-1">مدیریت اطلاعات بیماران مطب</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={refreshPatients}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? "در حال بارگذاری..." : "بروزرسانی"}
          </Button>
          <Link href="/dashboard/patients/new">
            <Button size="sm">
              <UserPlus className="w-4 h-4 ml-2" />
              بیمار جدید
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
          <Button
            variant="outline"
            size="sm"
            className="mr-4"
            onClick={() => setError(null)}
          >
            بستن
          </Button>
        </div>
      )}

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

      <div className="flex gap-4 text-sm">
        <span className="text-gray-500">
          تعداد کل: <strong className="text-gray-900">{patients.length}</strong>
        </span>
        {searchTerm && (
          <span className="text-gray-500">
            نتیجه جستجو: <strong className="text-gray-900">{filteredPatients.length}</strong>
          </span>
        )}
      </div>

      {filteredPatients.length === 0 ? (
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
            <div key={patient.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-lg">
                    {patient.first_name} {patient.last_name}
                  </span>
                  <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                    {getGenderLabel(patient.gender)}
                  </span>
                  <span className="text-xs text-gray-400">
                    <Calendar className="w-3 h-3 inline ml-1" />
                    {formatDate(patient.created_at)}
                  </span>
                  {patient.file_count !== undefined && patient.file_count > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FolderOpen className="w-3 h-3" />
                      {patient.file_count} فایل
                    </span>
                  )}

                  {patient.sales_count !== undefined && patient.sales_count > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" />
                      {patient.sales_count} خرید
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
                  onClick={() => handleDeletePatient(patient.id)}
                  variant="destructive"
                  size="sm"
                  disabled={deletingPatientId === patient.id}
                >
                  {deletingPatientId === patient.id ? (
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