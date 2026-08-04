// src/app/dashboard/patients/new/page.client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createPatient } from "@/lib/supabase/actions";
import { FileUploader } from "@/components/ui/file-uploader";
import { type PatientFile } from "@/lib/storage/patientFiles";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { fromJalaliToDate, toJalaliDisplay } from "@/lib/util/jalaliDate";
import {
  ArrowRight,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Home,
  FileText,
  Loader2,
  UserCircle,
  PhoneCall,
  FolderOpen,
  File,
  Image,
  FileIcon,
  CheckCircle
} from "lucide-react";

interface FormData {
  first_name: string;
  last_name: string;
  national_code: string;
  phone: string;
  email: string;
  birth_date: string | null;
  gender: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
}

export default function NewPatientClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null);
  const [createdPatientName, setCreatedPatientName] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<PatientFile[]>([]);
  const [isPatientCreated, setIsPatientCreated] = useState(false);
  const [birthDatePicker, setBirthDatePicker] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    national_code: "",
    phone: "",
    email: "",
    birth_date: null,
    gender: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
  });

  // تغییر فیلدها
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // پاک کردن خطای مربوط به فیلد
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: [] }));
    }
  };

  // ارسال فرم
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const dataToSubmit = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        national_code: formData.national_code,
        phone: formData.phone,
        email: formData.email || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender as 'male' | 'female' | 'other' | null || null,
        address: formData.address || null,
        city: formData.city || null,
        province: formData.province || null,
        postal_code: formData.postal_code || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        notes: formData.notes || null,
      };

      const result = await createPatient(dataToSubmit);

      if (result.error) {
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
          toast.error("لطفاً فیلدهای مشخص شده را اصلاح کنید.");
        } else {
          toast.error(result.error);
        }
      } else if (result.data) {
        // ذخیره ID و نام بیمار ایجاد شده
        setCreatedPatientId(result.data.id);
        setCreatedPatientName(`${result.data.first_name} ${result.data.last_name}`);
        setIsPatientCreated(true);
        toast.success(`بیمار ${result.data.first_name} ${result.data.last_name} با موفقیت ثبت شد!`);

        // اسکرول به بخش فایل‌ها
        setTimeout(() => {
          const filesSection = document.getElementById('files-section');
          if (filesSection) {
            filesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
    } catch (error) {
      console.error("Error creating patient:", error);
      toast.error("خطای غیرمنتظره رخ داد.");
    } finally {
      setIsLoading(false);
    }
  };

  // رفتن به صفحه ویرایش بیمار
  const goToEditPatient = () => {
    if (createdPatientId) {
      router.push(`/dashboard/patients/${createdPatientId}`);
      router.refresh();
    }
  };

  // رفتن به لیست بیماران
  const goToPatientsList = () => {
    router.push("/dashboard/patients");
    router.refresh();
  };

  // آیکون بر اساس نوع فایل
  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    if (mimetype === 'application/pdf') {
      return <FileIcon className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  // فرمت حجم فایل
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ثبت بیمار جدید</h1>
          <p className="text-gray-500 mt-1">
            {isPatientCreated
              ? `بیمار ${createdPatientName} با موفقیت ثبت شد`
              : "اطلاعات بیمار را وارد کنید"}
          </p>
        </div>
        <Link href="/dashboard/patients">
          <Button variant="outline">
            <ArrowRight className="w-4 h-4 ml-2" />
            بازگشت به لیست
          </Button>
        </Link>
      </div>

      {/* فرم - فقط در صورتی که بیمار ثبت نشده باشد نمایش داده می‌شود */}
      {!isPatientCreated ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              اطلاعات بیمار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* اطلاعات شخصی */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="flex items-center gap-2">
                    نام <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="نام"
                    required
                    className={errors.first_name ? "border-red-500" : ""}
                  />
                  {errors.first_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.first_name[0]}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="last_name" className="flex items-center gap-2">
                    نام خانوادگی <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="نام خانوادگی"
                    required
                    className={errors.last_name ? "border-red-500" : ""}
                  />
                  {errors.last_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.last_name[0]}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="national_code" className="flex items-center gap-2">
                    کد ملی <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="national_code"
                    name="national_code"
                    value={formData.national_code}
                    onChange={handleChange}
                    placeholder="کد ملی ۱۰ رقمی"
                    maxLength={10}
                    required
                    className={errors.national_code ? "border-red-500" : ""}
                  />
                  {errors.national_code && (
                    <p className="text-red-500 text-sm mt-1">{errors.national_code[0]}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    تلفن همراه <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    required
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone[0]}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    ایمیل
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email[0]}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="birth_date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    تاریخ تولد
                  </Label>

                  <DatePicker
                    calendar={persian}
                    locale={persian_fa}
                    value={birthDatePicker || ""}
                    onChange={(date: any) => {
                      if (date && date.isValid) {
                        // دریافت تاریخ میلادی از شیء date
                        const gregorianDate = date.toDate(); // این یک Date object میلادی می‌دهد
                        const isoDate = gregorianDate.toISOString().split('T')[0]; // YYYY-MM-DD

                        console.log('Selected Jalali:', date.format('YYYY/MM/DD'));
                        console.log('Saving as Gregorian:', isoDate);

                        setFormData(prev => ({ ...prev, birth_date: isoDate }));
                        setBirthDatePicker(date.format("YYYY/MM/DD"));
                      } else {
                        setFormData(prev => ({ ...prev, birth_date: null }));
                        setBirthDatePicker(null);
                      }
                    }}
                    format="YYYY/MM/DD"
                    placeholder="انتخاب تاریخ تولد"
                    className="w-full p-2 border rounded-md mt-1 bg-white dark:bg-gray-800"
                    containerClassName="w-full"
                    inputClass="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                  />
                  {formData.birth_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      میلادی: {formData.birth_date}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="gender" className="flex items-center gap-2">
                    <UserCircle className="w-4 h-4" />
                    جنسیت
                  </Label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md mt-1 bg-white"
                  >
                    <option value="">انتخاب جنسیت...</option>
                    <option value="male">مرد</option>
                    <option value="female">زن</option>
                    <option value="other">سایر</option>
                  </select>
                </div>
              </div>

              {/* آدرس */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  آدرس
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      آدرس
                    </Label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-md mt-1 min-h-[80px]"
                      placeholder="آدرس کامل"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="city">شهر</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="شهر"
                      />
                    </div>

                    <div>
                      <Label htmlFor="province">استان</Label>
                      <Input
                        id="province"
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        placeholder="استان"
                      />
                    </div>

                    <div>
                      <Label htmlFor="postal_code">کد پستی</Label>
                      <Input
                        id="postal_code"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                        placeholder="کد پستی"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* اطلاعات اضطراری */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PhoneCall className="w-5 h-5" />
                  تماس اضطراری
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergency_contact_name">نام و نام خانوادگی</Label>
                    <Input
                      id="emergency_contact_name"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleChange}
                      placeholder="نام فرد معتمد"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergency_contact_phone">شماره تماس</Label>
                    <Input
                      id="emergency_contact_phone"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleChange}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    />
                  </div>
                </div>
              </div>

              {/* توضیحات */}
              <div className="border-t pt-6">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  توضیحات
                </Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md mt-1 min-h-[100px]"
                  placeholder="توضیحات اضافی..."
                />
              </div>

              {/* دکمه‌ها */}
              <div className="flex gap-4 pt-4 border-t">
                <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      در حال ثبت...
                    </>
                  ) : (
                    "ثبت بیمار"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/patients")}
                >
                  انصراف
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* پیام موفقیت */
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-full text-white">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
                  بیمار با موفقیت ثبت شد!
                </h3>
                <p className="text-green-600 dark:text-green-400">
                  {createdPatientName} - اکنون می‌توانید فایل‌های مربوط به این بیمار را آپلود کنید.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* بخش فایل‌ها - فقط بعد از ثبت بیمار نمایش داده می‌شود */}
      {isPatientCreated && createdPatientId && (
        <Card id="files-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              آپلود فایل‌های بیمار
              <span className="text-sm font-normal text-gray-500 mr-2">
                ({uploadedFiles.length} فایل)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* نمایش فایل‌های آپلود شده */}
            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {getFileIcon(file.metadata.mimetype)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* کامپوننت آپلود فایل */}
            <FileUploader
              patientId={createdPatientId}
              onUploadComplete={(file) => {
                const newFile: PatientFile = {
                  id: file.id,
                  name: file.name,
                  path: file.path,
                  size: file.size,
                  url: file.url,
                  created_at: file.createdAt,
                  updated_at: file.createdAt,
                  bucket_id: 'patient-files',
                  metadata: {
                    mimetype: file.type,
                    size: file.size,
                    patient_id: createdPatientId,
                    original_name: file.name,
                  },
                };
                setUploadedFiles(prev => [...prev, newFile]);
                toast.success(`فایل ${file.name} با موفقیت آپلود شد`);
              }}
              onFileDelete={(fileId) => {
                setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
                toast.success('فایل با موفقیت حذف شد');
              }}
              maxFiles={10}
            />

            {/* دکمه‌های اقدام */}
            <div className="flex flex-wrap gap-4 pt-4 border-t">
              <Button
                onClick={goToEditPatient}
                variant="default"
                className="min-w-[140px]"
              >
                <User className="w-4 h-4 ml-2" />
                ویرایش اطلاعات بیمار
              </Button>
              <Button
                onClick={goToPatientsList}
                variant="outline"
                className="min-w-[140px]"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                رفتن به لیست بیماران
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}