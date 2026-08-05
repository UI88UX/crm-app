// src/app/dashboard/sales/new/page.client.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createSale } from "@/lib/supabase/actions";
import { toJalaliDisplay } from "@/lib/util/jalaliDate";
import { ArrowRight, Package, User, Calendar, DollarSign, Loader2, Hash, FileText } from "lucide-react";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  national_code: string;
}

interface NewSaleClientProps {
  patients: Patient[];
}

export default function NewSaleClient({ patients }: NewSaleClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [formData, setFormData] = useState({
    patient_id: patientIdFromUrl || "",
    hearing_aid_model: "",
    hearing_aid_serial: "",
    price: "",
    sale_date: new Date().toISOString().split('T')[0],
    warranty_expiry: "",
    notes: "",
  });

  // اگر patientId از URL آمده، اطلاعات بیمار را پیدا کن
  useEffect(() => {
    if (patientIdFromUrl) {
      const patient = patients.find(p => p.id === patientIdFromUrl);
      if (patient) {
        setSelectedPatient(patient);
        setFormData(prev => ({ ...prev, patient_id: patient.id }));
      }
    }
  }, [patientIdFromUrl, patients]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: [] }));
    }
    
    // اگر بیمار انتخاب شد، اطلاعات او را نمایش بده
    if (name === 'patient_id') {
      const patient = patients.find(p => p.id === value);
      setSelectedPatient(patient || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const dataToSubmit = {
        patient_id: formData.patient_id,
        hearing_aid_model: formData.hearing_aid_model.trim(),
        hearing_aid_serial: formData.hearing_aid_serial.trim(),
        price: parseFloat(formData.price) || 0,
        sale_date: formData.sale_date || new Date().toISOString().split('T')[0],
        warranty_expiry: formData.warranty_expiry || null,
        notes: formData.notes || null,
      };

      const result = await createSale(dataToSubmit);

      if (result.error) {
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
          toast.error("لطفاً فیلدهای مشخص شده را اصلاح کنید.");
        } else {
          toast.error(result.error);
        }
      } else if (result.data) {
        toast.success("فروش با موفقیت ثبت شد!");
        router.push("/dashboard/sales");
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating sale:", error);
      toast.error("خطای غیرمنتظره رخ داد.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">ثبت فروش جدید</h1>
          <p className="text-gray-500 mt-1">ثبت فروش سمعک برای بیمار</p>
        </div>
        <Link href="/dashboard/sales">
          <Button variant="outline">
            <ArrowRight className="w-4 h-4 ml-2" />
            بازگشت به لیست
          </Button>
        </Link>
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
              {/* انتخاب بیمار */}
              <div>
                <Label htmlFor="patient_id" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  بیمار <span className="text-red-500">*</span>
                </Label>
                <select
                  id="patient_id"
                  name="patient_id"
                  required
                  className="w-full p-2 border rounded-md mt-1 bg-white dark:bg-gray-800"
                  value={formData.patient_id}
                  onChange={handleChange}
                >
                  <option value="">انتخاب بیمار...</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} - {patient.national_code}
                    </option>
                  ))}
                </select>
                {selectedPatient && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ {selectedPatient.first_name} {selectedPatient.last_name} انتخاب شد
                  </p>
                )}
                {errors.patient_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.patient_id[0]}</p>
                )}
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
                  <p className="text-red-500 text-sm mt-1">{errors.hearing_aid_model[0]}</p>
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
                  <p className="text-red-500 text-sm mt-1">{errors.hearing_aid_serial[0]}</p>
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
                {errors.sale_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.sale_date[0]}</p>
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
                    شمسی: {toJalaliDisplay(formData.warranty_expiry, "DD MMM YYYY")}
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
              <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال ثبت...
                  </>
                ) : (
                  "ثبت فروش"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/sales")}
              >
                انصراف
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}