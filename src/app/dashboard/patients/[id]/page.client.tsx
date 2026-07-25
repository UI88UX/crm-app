// src/app/dashboard/patients/[id]/page.client.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { updatePatient, getPatient } from "@/lib/supabase/actions";
import { FileUploader } from "@/components/ui/file-uploader";
import { getPatientFiles, type PatientFile } from "@/lib/storage/patientFiles";
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
  Download
} from "lucide-react";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  national_code: string;
  phone: string;
  email: string | null;
  birth_date: string | null;
  gender: 'male' | 'female' | 'other' | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
}

interface PatientEditClientProps {
  patientId: string;
  initialPatient: Patient | null;
}

export default function PatientEditClient({ patientId, initialPatient }: PatientEditClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [patientFiles, setPatientFiles] = useState<PatientFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Patient>>(initialPatient || {});

  // بارگذاری اطلاعات بیمار اگر initialPatient نداشته باشیم
  useEffect(() => {
    if (initialPatient) {
      // اگر اطلاعات اولیه وجود دارد، مستقیماً استفاده کن
      setFormData(initialPatient);
      return;
    }

    if (patientId) {
      const fetchPatient = async () => {
        try {
          console.log('Fetching patient with ID:', patientId);
          const result = await getPatient(patientId);
          console.log('Patient result:', result);

          if (result.data) {
            setFormData(result.data);
          } else if (result.error) {
            setError(result.error);
            toast.error("خطا در دریافت اطلاعات بیمار");
          }
        } catch (err) {
          console.error('Error fetching patient:', err);
          setError('خطا در بارگذاری اطلاعات');
          toast.error("خطای غیرمنتظره در بارگذاری اطلاعات");
        }
      };
      fetchPatient();
    }
  }, [patientId, initialPatient]);

  // بارگذاری فایل‌های بیمار
  useEffect(() => {
    if (!patientId) return;

    const fetchFiles = async () => {
      try {
        setIsLoadingFiles(true);
        console.log('Fetching files for patient:', patientId);
        const { files, error } = await getPatientFiles(patientId);
        console.log('Files result:', { files, error });

        if (error) {
          console.error('Error loading files:', error);
        } else {
          setPatientFiles(files || []);
        }
      } catch (err) {
        console.error('Error fetching files:', err);
      } finally {
        setIsLoadingFiles(false);
      }
    };

    fetchFiles();
  }, [patientId]);

  // تغییر فیلدها
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        first_name: formData.first_name || "",
        last_name: formData.last_name || "",
        national_code: formData.national_code || "",
        phone: formData.phone || "",
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

      const result = await updatePatient(patientId, dataToSubmit);

      if (result.error) {
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
          toast.error("لطفاً فیلدهای مشخص شده را اصلاح کنید.");
        } else {
          toast.error(result.error);
        }
      } else if (result.data) {
        toast.success("اطلاعات بیمار با موفقیت به‌روزرسانی شد!");
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating patient:", error);
      toast.error("خطای غیرمنتظره رخ داد.");
    } finally {
      setIsLoading(false);
    }
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

  // اگر خطایی رخ داده
  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">خطا در بارگذاری اطلاعات</h2>
        <p className="text-gray-600 mt-2">{error}</p>
        <Button className="mt-4" onClick={() => router.push("/dashboard/patients")}>
          بازگشت به لیست بیماران
        </Button>
      </div>
    );
  }

  // اگر اطلاعات بارگذاری نشده
  if (!formData || !formData.first_name) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
        <p className="mt-4 text-gray-600">در حال بارگذاری اطلاعات...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ویرایش بیمار</h1>
          <p className="text-gray-500 mt-1">
            {formData.first_name} {formData.last_name}
          </p>
        </div>
        <Link href="/dashboard/patients">
          <Button variant="outline">
            <ArrowRight className="w-4 h-4 ml-2" />
            بازگشت به لیست
          </Button>
        </Link>
      </div>

      {/* فرم اطلاعات بیمار */}
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
                  value={formData.first_name || ""}
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
                  value={formData.last_name || ""}
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
                  value={formData.national_code || ""}
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
                  value={formData.phone || ""}
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
                  value={formData.email || ""}
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
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  value={formData.birth_date || ""}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="gender" className="flex items-center gap-2">
                  <UserCircle className="w-4 h-4" />
                  جنسیت
                </Label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender || ""}
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
                    value={formData.address || ""}
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
                      value={formData.city || ""}
                      onChange={handleChange}
                      placeholder="شهر"
                    />
                  </div>

                  <div>
                    <Label htmlFor="province">استان</Label>
                    <Input
                      id="province"
                      name="province"
                      value={formData.province || ""}
                      onChange={handleChange}
                      placeholder="استان"
                    />
                  </div>

                  <div>
                    <Label htmlFor="postal_code">کد پستی</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      value={formData.postal_code || ""}
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
                    value={formData.emergency_contact_name || ""}
                    onChange={handleChange}
                    placeholder="نام فرد معتمد"
                  />
                </div>

                <div>
                  <Label htmlFor="emergency_contact_phone">شماره تماس</Label>
                  <Input
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone || ""}
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
                value={formData.notes || ""}
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
                    در حال ذخیره...
                  </>
                ) : (
                  "ذخیره تغییرات"
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

      {/* بخش فایل‌ها */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            فایل‌های بیمار
            <span className="text-sm font-normal text-gray-500 mr-2">
              ({patientFiles.length} فایل)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* نمایش فایل‌های موجود */}
          {isLoadingFiles ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="mr-2 text-gray-500">در حال بارگذاری فایل‌ها...</span>
            </div>
          ) : patientFiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {patientFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.url, '_blank')}
                    className="h-8 w-8 p-0 flex-shrink-0"
                    title="مشاهده فایل"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <File className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>هیچ فایلی برای این بیمار آپلود نشده است</p>
              <p className="text-sm text-gray-400 mt-1">
                با استفاده از بخش زیر می‌توانید فایل آپلود کنید
              </p>
            </div>
          )}

          {/* کامپوننت آپلود فایل */}
          {/* کامپوننت آپلود فایل */}
          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              آپلود فایل جدید
            </p>
            <FileUploader
              patientId={patientId}
              initialFiles={patientFiles.map(file => ({
                id: file.id,
                name: file.name,
                path: file.path,
                url: file.url || '',
                size: file.size,
                type: file.metadata.mimetype,
                createdAt: file.created_at,
              }))}
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
                    patient_id: patientId,
                    original_name: file.name,
                  },
                };
                setPatientFiles(prev => [...prev, newFile]);
                toast.success(`فایل ${file.name} با موفقیت آپلود شد`);
              }}
              onFileDelete={(fileId) => {
                setPatientFiles(prev => prev.filter(f => f.id !== fileId));
                toast.success('فایل با موفقیت حذف شد');
              }}
              maxFiles={10}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}