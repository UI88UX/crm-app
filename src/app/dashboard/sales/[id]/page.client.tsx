// src/app/dashboard/sales/[id]/page.client.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// ✅ ایمپورت React Query
import { useSale, useDeleteSale } from "@/hooks/useSales";

import { toJalaliDisplay, formatJalaliDateTime } from "@/lib/util/jalaliDate";
import { 
  ArrowRight, 
  Package, 
  User, 
  Calendar, 
  DollarSign, 
  Trash2, 
  Loader2, 
  Hash,
  FileText,
  Phone,
} from "lucide-react";

interface SaleDetailClientProps {
  saleId: string;
}

export default function SaleDetailClient({ saleId }: SaleDetailClientProps) {
  const router = useRouter();

  // ✅ دریافت فروش با React Query
  const { 
    data: sale, 
    isLoading, 
    isError, 
    error 
  } = useSale(saleId);

  // ✅ حذف با React Query
  const deleteSale = useDeleteSale();

  const handleDelete = () => {
    if (!sale) return;
    if (!confirm("آیا از حذف این فروش اطمینان دارید؟")) return;
    
    deleteSale.mutate(saleId, {
      onSuccess: () => {
        toast.success("فروش با موفقیت حذف شد!");
        router.push("/dashboard/sales");
        router.refresh();
      },
      onError: (error: Error) => {
        toast.error(error.message || "خطا در حذف فروش");
      }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !sale) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">خطا در دریافت اطلاعات فروش</h2>
        <p className="text-gray-600 mt-2">{error?.message || "فروش یافت نشد"}</p>
        <Button className="mt-4" onClick={() => router.push("/dashboard/sales")}>
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت به لیست فروش‌ها
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">جزئیات فروش</h1>
          <p className="text-gray-500 mt-1">
            {sale.patient?.first_name} {sale.patient?.last_name}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/dashboard/sales">
            <Button variant="outline">
              <ArrowRight className="w-4 h-4 ml-2" />
              بازگشت به لیست
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteSale.isPending}
          >
            {deleteSale.isPending ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 ml-2" />
            )}
            حذف
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* اطلاعات فروش */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              اطلاعات فروش
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">مدل سمعک</span>
              <p className="font-medium">{sale.hearing_aid_model}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">شماره سریال</span>
              <p className="font-medium flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {sale.hearing_aid_serial}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">قیمت</span>
              <p className="font-medium text-green-600">{formatPrice(sale.price)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">تاریخ فروش</span>
              <p className="font-medium">{toJalaliDisplay(sale.sale_date, "DD MMM YYYY")}</p>
            </div>
            {sale.warranty_expiry && (
              <div>
                <span className="text-sm text-gray-500">انقضای گارانتی</span>
                <p className="font-medium">{toJalaliDisplay(sale.warranty_expiry, "DD MMM YYYY")}</p>
              </div>
            )}
            {sale.notes && (
              <div>
                <span className="text-sm text-gray-500">توضیحات</span>
                <p className="text-gray-700 flex items-start gap-1">
                  <FileText className="w-3 h-3 mt-0.5" />
                  {sale.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* اطلاعات بیمار */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              اطلاعات بیمار
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">نام و نام خانوادگی</span>
              <Link href={`/dashboard/patients/${sale.patient?.id}`}>
                <p className="font-medium text-blue-600 hover:underline">
                  {sale.patient?.first_name} {sale.patient?.last_name}
                </p>
              </Link>
            </div>
            <div>
              <span className="text-sm text-gray-500">کد ملی</span>
              <p className="font-medium">{sale.patient?.national_code}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">تلفن</span>
              <p className="font-medium flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {sale.patient?.phone}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* اطلاعات ثبت */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            اطلاعات ثبت
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            تاریخ ثبت: {formatJalaliDateTime(sale.created_at)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}