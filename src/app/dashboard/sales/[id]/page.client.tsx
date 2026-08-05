// src/app/dashboard/sales/[id]/page.client.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { deleteSale } from "@/lib/supabase/actions";
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
  User as UserIcon
} from "lucide-react";

interface Sale {
  id: string;
  patient_id: string;
  hearing_aid_model: string;
  hearing_aid_serial: string;
  price: number;
  sale_date: string;
  warranty_expiry: string | null;
  notes: string | null;
  created_at: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    national_code: string;
    phone: string;
  };
}

interface SaleDetailClientProps {
  sale: Sale;
}

export default function SaleDetailClient({ sale }: SaleDetailClientProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("آیا از حذف این فروش اطمینان دارید؟")) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteSale(sale.id);
      if (result.data) {
        toast.success("فروش با موفقیت حذف شد!");
        router.push("/dashboard/sales");
        router.refresh();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error("خطا در حذف فروش");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">جزئیات فروش</h1>
          <p className="text-gray-500 mt-1">
            {sale.patient.first_name} {sale.patient.last_name}
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
            disabled={isDeleting}
          >
            {isDeleting ? (
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
              <Link href={`/dashboard/patients/${sale.patient.id}`}>
                <p className="font-medium text-blue-600 hover:underline">
                  {sale.patient.first_name} {sale.patient.last_name}
                </p>
              </Link>
            </div>
            <div>
              <span className="text-sm text-gray-500">کد ملی</span>
              <p className="font-medium">{sale.patient.national_code}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">تلفن</span>
              <p className="font-medium flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {sale.patient.phone}
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