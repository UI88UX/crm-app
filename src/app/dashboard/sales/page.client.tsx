"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ShoppingBag,
  Plus,
  Trash2,
  X,
  Calendar,
  DollarSign,
  Package,
  Hash,
  User,
  FileText,
  Search,
} from "lucide-react";
import { createSale, deleteSale } from "@/lib/supabase/actions";
import type { Sale } from "@/types";

// تعریف نوع ساده برای Patient
interface PatientSimple {
  id: string;
  first_name: string;
  last_name: string;
  national_code: string;
}

interface SalesClientProps {
  sales: Sale[];
  patients: PatientSimple[];
}

export default function SalesClient({ sales: initialSales, patients }: SalesClientProps) {
  const [sales, setSales] = useState(initialSales);
  const [filteredSales, setFilteredSales] = useState(initialSales);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: "",
    hearing_aid_model: "",
    hearing_aid_serial: "",
    price: "",
    sale_date: new Date().toISOString().split('T')[0],
    warranty_expiry: "",
    notes: "",
  });

  // جستجو در فروش‌ها
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredSales(sales);
      return;
    }

    const lowercasedTerm = term.toLowerCase().trim();
    const filtered = sales.filter((sale) => {
      const patientName = `${sale.patient?.first_name || ''} ${sale.patient?.last_name || ''}`.toLowerCase();
      const model = sale.hearing_aid_model.toLowerCase();
      const serial = sale.hearing_aid_serial.toLowerCase();
      const nationalCode = sale.patient?.national_code?.toLowerCase() || "";
      
      return (
        patientName.includes(lowercasedTerm) ||
        model.includes(lowercasedTerm) ||
        serial.includes(lowercasedTerm) ||
        nationalCode.includes(lowercasedTerm)
      );
    });
    setFilteredSales(filtered);
  };

  // ثبت فروش جدید
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // اعتبارسنجی فرم
    if (!formData.patient_id) {
      toast.error("لطفاً یک بیمار را انتخاب کنید");
      setIsLoading(false);
      return;
    }

    if (!formData.hearing_aid_model.trim()) {
      toast.error("لطفاً مدل سمعک را وارد کنید");
      setIsLoading(false);
      return;
    }

    if (!formData.hearing_aid_serial.trim()) {
      toast.error("لطفاً سریال سمعک را وارد کنید");
      setIsLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("لطفاً قیمت معتبر وارد کنید");
      setIsLoading(false);
      return;
    }

    const result = await createSale({
      patient_id: formData.patient_id,
      hearing_aid_model: formData.hearing_aid_model.trim(),
      hearing_aid_serial: formData.hearing_aid_serial.trim(),
      price: parseFloat(formData.price),
      sale_date: formData.sale_date,
      warranty_expiry: formData.warranty_expiry || null,
      notes: formData.notes || null,
    });

    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      toast.success("فروش با موفقیت ثبت شد");
      
      // ساخت شیء فروش با اطلاعات بیمار
      const selectedPatient = patients.find(p => p.id === formData.patient_id);
      const newSale = {
        ...result.data,
        patient: selectedPatient || undefined
      };
      
      const updatedSales = [newSale, ...sales];
      setSales(updatedSales);
      setFilteredSales(updatedSales);
      resetForm();
      setIsFormOpen(false);
    }

    setIsLoading(false);
  };

  // حذف فروش
  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این فروش اطمینان دارید؟")) return;

    const result = await deleteSale(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("فروش با موفقیت حذف شد");
      const updatedSales = sales.filter(sale => sale.id !== id);
      setSales(updatedSales);
      setFilteredSales(updatedSales);
    }
  };

  // ریست فرم
  const resetForm = () => {
    setFormData({
      patient_id: "",
      hearing_aid_model: "",
      hearing_aid_serial: "",
      price: "",
      sale_date: new Date().toISOString().split('T')[0],
      warranty_expiry: "",
      notes: "",
    });
  };

  // فرمت قیمت
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  // فرمت تاریخ
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fa-IR');
  };

  // محاسبه مجموع فروش
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.price, 0);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* هدر */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">مدیریت فروش</h1>
          <p className="text-gray-500 mt-1">ثبت و مدیریت فروش سمعک</p>
        </div>
        <Button onClick={() => setIsFormOpen(!isFormOpen)} className="w-full md:w-auto">
          {isFormOpen ? (
            <>
              <X className="w-4 h-4 ml-2" />
              بستن فرم
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 ml-2" />
              ثبت فروش جدید
            </>
          )}
        </Button>
      </div>

      {/* فرم ثبت فروش */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              ثبت فروش جدید
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* انتخاب بیمار */}
                <div>
                  <Label htmlFor="patient_id" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    بیمار <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="patient_id"
                    required
                    className="w-full p-2 border rounded-md mt-1 bg-white"
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  >
                    <option value="">انتخاب بیمار...</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} - {patient.national_code}
                      </option>
                    ))}
                  </select>
                </div>

                {/* مدل سمعک */}
                <div>
                  <Label htmlFor="hearing_aid_model" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    مدل سمعک <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="hearing_aid_model"
                    required
                    value={formData.hearing_aid_model}
                    onChange={(e) => setFormData({ ...formData, hearing_aid_model: e.target.value })}
                    placeholder="مثلاً: Phonak Audeo"
                  />
                </div>

                {/* سریال سمعک */}
                <div>
                  <Label htmlFor="hearing_aid_serial" className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    سریال سمعک <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="hearing_aid_serial"
                    required
                    value={formData.hearing_aid_serial}
                    onChange={(e) => setFormData({ ...formData, hearing_aid_serial: e.target.value })}
                    placeholder="شماره سریال"
                  />
                </div>

                {/* قیمت */}
                <div>
                  <Label htmlFor="price" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    قیمت (تومان) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="۰"
                  />
                </div>

                {/* تاریخ فروش */}
                <div>
                  <Label htmlFor="sale_date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    تاریخ فروش <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="sale_date"
                    type="date"
                    required
                    value={formData.sale_date}
                    onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                  />
                </div>

                {/* تاریخ انقضای گارانتی */}
                <div>
                  <Label htmlFor="warranty_expiry" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    تاریخ انقضای گارانتی
                  </Label>
                  <Input
                    id="warranty_expiry"
                    type="date"
                    value={formData.warranty_expiry}
                    onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                  />
                </div>

                {/* توضیحات */}
                <div className="md:col-span-2">
                  <Label htmlFor="notes" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    توضیحات
                  </Label>
                  <textarea
                    id="notes"
                    className="w-full p-2 border rounded-md mt-1 min-h-[80px]"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="توضیحات اضافی..."
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "در حال ثبت..." : "ثبت فروش"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                >
                  انصراف
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* جستجو و آمار */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="جستجو در فروش‌ها..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-gray-500">تعداد کل: <strong className="text-gray-900">{filteredSales.length}</strong></span>
          <span className="text-gray-500">مجموع فروش: <strong className="text-green-600">{formatPrice(totalRevenue)} تومان</strong></span>
        </div>
      </div>

      {/* لیست فروش‌ها */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            لیست فروش‌ها
            {searchTerm && (
              <Badge variant="outline" className="mr-2">
                {filteredSales.length} نتیجه
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? "هیچ فروشی با این جستجو یافت نشد" : "هیچ فروشی ثبت نشده است"}
              </p>
              {!searchTerm && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsFormOpen(true)}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  ثبت اولین فروش
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="default" className="bg-blue-500">
                        {sale.hearing_aid_model}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        <Hash className="w-3 h-3 inline ml-1" />
                        سریال: {sale.hearing_aid_serial}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <span className="font-medium text-gray-900">
                        <User className="w-3 h-3 inline ml-1" />
                        {sale.patient?.first_name} {sale.patient?.last_name}
                      </span>
                      {sale.patient?.national_code && (
                        <span className="text-gray-500">کد ملی: {sale.patient.national_code}</span>
                      )}
                      {sale.patient?.phone && (
                        <span className="text-gray-500">تلفن: {sale.patient.phone}</span>
                      )}
                    </div>
                    
                    {sale.notes && (
                      <p className="text-sm text-gray-500 flex items-start gap-1">
                        <FileText className="w-3 h-3 inline mt-0.5" />
                        {sale.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-end lg:items-end gap-2 mt-3 lg:mt-0">
                    <div className="text-left">
                      <div className="text-lg font-bold text-green-600">
                        {formatPrice(sale.price)} تومان
                      </div>
                      <div className="text-xs text-gray-500">
                        <Calendar className="w-3 h-3 inline ml-1" />
                        {formatDate(sale.sale_date)}
                        {sale.warranty_expiry && (
                          <span className="mr-3">
                            گارانتی تا: {formatDate(sale.warranty_expiry)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(sale.id)}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 ml-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}