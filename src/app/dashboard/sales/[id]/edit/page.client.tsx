// src/app/dashboard/sales/[id]/edit/page.client.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

import { useSale, useUpdateSale } from "@/hooks/useSales";
import { toJalaliDisplay } from "@/lib/util/jalaliDate";
import {
  ArrowRight,
  Package,
  User,
  Calendar,
  DollarSign,
  Loader2,
  Hash,
  FileText,
} from "lucide-react";

interface EditSaleClientProps {
  saleId: string;
}

export default function EditSaleClient({ saleId }: EditSaleClientProps) {
  const router = useRouter();

  const { data: sale, isLoading, isError, error } = useSale(saleId);
  const updateSale = useUpdateSale();

  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState({
    hearing_aid_model: "",
    hearing_aid_serial: "",
    price: "",
    sale_date: "",
    warranty_expiry: "",
    notes: "",
  });

  // ✅ پر کردن فرم وقتی داده رسید
  useEffect(() => {
    if (sale) {
      setFormData({
        hearing_aid_model: sale.hearing_aid_model || "",
        hearing_aid_serial: sale.hearing_aid_serial || "",
        price: sale.price?.toString() || "",
        sale_date: sale.sale_date
          ? sale.sale_date.split("T")[0]
          : new Date().toISOString().split("T")[0],
        warranty_expiry: sale.warranty_expiry
          ? sale.warranty_expiry.split("T")[0]
          : "",
        notes: sale.notes || "",
      });
    }
  }, [sale]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.hearing_aid_model.trim()) {
      toast.error("لطفاً مدل سمعک را وارد کنید");
      return;
    }
    if (!formData.hearing_aid_serial.trim()) {
      toast.error("لطفاً سریال سمعک را وارد کنید");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("لطفاً قیمت معتبر وارد کنید");
      return;
    }

    updateSale.mutate(
      {
        id: saleId,
        patient_id: sale?.patient_id || "",
        hearing_aid_model: formData.hearing_aid_model.trim(),
        hearing_aid_serial: formData.hearing_aid_serial.trim(),
        price: parseFloat(formData.price) || 0,
        sale_date: formData.sale_date,
        warranty_expiry: formData.warranty_expiry || null,
        notes: formData.notes || null,
      },
      {
        onSuccess: () => {
          router.push(`/dashboard/sales/${saleId}`);
          router.refresh();
        },
        onError: (err: any) => {
          if (err.fieldErrors) {
            setErrors(err.fieldErrors);
          }
          // پیام خطا در hook نمایش داده می‌شود
        },
      }
    );
  };

  const handleCancel = () => {
    router.push(`/dashboard/sales/${saleId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (isError || !sale) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">
          خطا در دریافت اطلاعات فروش
        </h2>
        <p className="text-gray-600 mt-2">
          {error?.message || "فروش یافت نشد"}
        </p>
        <Link href="/dashboard/sales">
          <Button className="mt-4">
            <ArrowRight className="w-4 h-4 ml-2" />
            بازگشت به لیست فروش‌ها
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* هدر */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">ویرایش فروش</h1>
          <p className="text-gray-500 mt-1">
            {sale.patient?.first_name} {sale.patient?.last_name}
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            اطلاعات فروش
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* بیمار (غیرقابل ویرایش) */}
              <div>
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  بیمار
                </Label>
                <Input
                  value={`${sale.patient?.first_name || ""} ${sale.patient?.last_name || ""}`}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  بیمار قابل تغییر نیست
                </p>
              </div>

              {/* مدل سمعک */}
              <div>
                <Label htmlFor="hearing_aid_model" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  مدل سمعک <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hearing_aid_model"
                  name="hearing_aid_model"
                  value={formData.hearing_aid_model}
                  onChange={handleChange}
                  placeholder="مثلاً: Phonak Audeo"
                  required
                  className={errors.hearing_aid_model ? "border-red-500" : ""}
                />
                {errors.hearing_aid_model && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.hearing_aid_model[0]}
                  </p>
                )}
              </div>

              {/* سریال سمعک */}
              <div>
                <Label htmlFor="hearing_aid_serial" className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  سریال سمعک <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hearing_aid_serial"
                  name="hearing_aid_serial"
                  value={formData.hearing_aid_serial}
                  onChange={handleChange}
                  placeholder="شماره سریال"
                  required
                  className={errors.hearing_aid_serial ? "border-red-500" : ""}
                />
                {errors.hearing_aid_serial && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.hearing_aid_serial[0]}
                  </p>
                )}
              </div>

              {/* قیمت */}
              <div>
                <Label htmlFor="price" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  قیمت (تومان) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="۰"
                  required
                  className={errors.price ? "border-red-500" : ""}
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price[0]}</p>
                )}
              </div>

              {/* تاریخ فروش */}
              <div>
                <Label htmlFor="sale_date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  تاریخ فروش <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sale_date"
                  name="sale_date"
                  type="date"
                  value={formData.sale_date}
                  onChange={handleChange}
                  required
                  className={errors.sale_date ? "border-red-500" : ""}
                />
                {formData.sale_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    شمسی: {toJalaliDisplay(formData.sale_date, "DD MMM YYYY")}
                  </p>
                )}
              </div>

              {/* تاریخ انقضای گارانتی */}
              <div>
                <Label htmlFor="warranty_expiry" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  تاریخ انقضای گارانتی
                </Label>
                <Input
                  id="warranty_expiry"
                  name="warranty_expiry"
                  type="date"
                  value={formData.warranty_expiry}
                  onChange={handleChange}
                />
                {formData.warranty_expiry && (
                  <p className="text-xs text-gray-500 mt-1">
                    شمسی:{" "}
                    {toJalaliDisplay(formData.warranty_expiry, "DD MMM YYYY")}
                  </p>
                )}
              </div>

              {/* توضیحات */}
              <div className="md:col-span-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  توضیحات
                </Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md mt-1 min-h-[80px]"
                  placeholder="توضیحات اضافی..."
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t flex-wrap">
              <Button
                type="submit"
                disabled={updateSale.isPending}
                className="min-w-[140px]"
              >
                {updateSale.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  "ذخیره تغییرات"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                انصراف
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}