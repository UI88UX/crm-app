// src/app/dashboard/patients/[id]/page.client.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { updatePatient, getPatient, deletePatientPermanent, deletePatient } from "@/lib/supabase/actions";
import { FileUploader } from "@/components/ui/file-uploader";
import { getPatientFiles, type PatientFile } from "@/src/lib/storage/patientFiles";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { formatJalaliDateTime, fromJalaliToDate, toJalaliDisplay, toJalali } from "@/src/lib/util/jalaliDate";
import moment from 'moment-jalaali';
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
  Download,
  ShoppingBag,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Eye,
  Clock,
  DollarSign,
  Calendar as CalendarIcon,
  Hash,
  Info,
  Package
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
  created_at: string;
  updated_at: string;
}

interface Sale {
  id: string;
  patient_id: string;
  hearing_aid_model: string;
  hearing_aid_serial: string;
  price: number;
  sale_date: string;
  warranty_expiry: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

interface PatientEditClientProps {
  patientId: string;
  initialPatient: Patient | null;
}

export default function PatientEditClient({ patientId, initialPatient }: PatientEditClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingPermanent, setIsDeletingPermanent] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [patientFiles, setPatientFiles] = useState<PatientFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [birthDatePicker, setBirthDatePicker] = useState<string | null>(null);
  const initialPatientRef = useRef(initialPatient);
  const hasLoadedRef = useRef(false);

  const [formData, setFormData] = useState<Partial<Patient>>(initialPatient || {});

  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  // در useEffect برای بررسی super_admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        setIsCheckingAdmin(true);
        const response = await fetch('/api/auth/check-super-admin');
        const result = await response.json();
        setIsSuperAdmin(result.isSuperAdmin || false);
      } catch (err) {
        console.error('Error checking super admin:', err);
        setIsSuperAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };
    checkSuperAdmin();
  }, []);

  const testMoment = () => {
    const test = moment('1985-05-13');
    console.log('Test moment:', test.format('jYYYY/jMM/jDD'));
  };

  // در useEffect یا در یک useEffect جداگانه برای تست:
  useEffect(() => {
    testMoment();
  }, []);

  // بارگذاری اطلاعات بیمار
  useEffect(() => {
    if (hasLoadedRef.current) return;

    if (initialPatient) {
      hasLoadedRef.current = true;
      setFormData(initialPatient);

      // دیباگ: چاپ تاریخ خام
      console.log('Raw birth_date:', initialPatient.birth_date);

      // src/app/dashboard/patients/[id]/page.client.tsx

      // در useEffect برای مقداردهی تاریخ تولد:
      if (initialPatient.birth_date) {
        try {
          let birthDate = initialPatient.birth_date;

          // اگر تاریخ به صورت شمسی ذخیره شده، ابتدا به میلادی تبدیل کن
          if (birthDate && birthDate.startsWith('13')) {
            // تاریخ شمسی است، به میلادی تبدیل کن
            const m = moment(birthDate, 'jYYYY-MM-DD');
            if (m.isValid()) {
              birthDate = m.format('YYYY-MM-DD');
              // به‌روزرسانی formData با تاریخ میلادی صحیح
              setFormData(prev => ({ ...prev, birth_date: birthDate }));
            }
          }

          // حالا تاریخ میلادی را به شمسی تبدیل کن برای نمایش
          const m = moment(birthDate);
          if (m.isValid()) {
            const jalaliDate = m.format('jYYYY/jMM/jDD');
            console.log('Setting birthDatePicker to:', jalaliDate);
            setBirthDatePicker(jalaliDate);
          }
        } catch (error) {
          console.error('Error setting birth date:', error);
        }
      }
      return;
    }

    if (patientId) {
      const fetchPatient = async () => {
        try {
          const result = await getPatient(patientId);
          if (result.data) {
            hasLoadedRef.current = true;
            setFormData(result.data);


            // مقداردهی تاریخ تولد برای DatePicker
            if (result.data.birth_date) {
              try {
                const m = moment(result.data.birth_date);
                if (m.isValid()) {
                  const jalaliDate = m.format('jYYYY/jMM/jDD');
                  setBirthDatePicker(jalaliDate);
                }
              } catch (error) {
                console.error('Error setting birth date:', error);
              }
            }
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
        const { files, error } = await getPatientFiles(patientId);
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

  // بارگذاری فروش‌های بیمار
  useEffect(() => {
    if (!patientId) return;

    const fetchSales = async () => {
      try {
        setIsLoadingSales(true);
        const response = await fetch(`/api/patients/${patientId}/sales`);
        const result = await response.json();

        if (result.data) {
          setSales(result.data);
        } else if (result.error) {
          console.error('Error loading sales:', result.error);
        }
      } catch (err) {
        console.error('Error fetching sales:', err);
      } finally {
        setIsLoadingSales(false);
      }
    };

    fetchSales();
  }, [patientId]);

  // بررسی دسترسی super_admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const response = await fetch('/api/auth/check-super-admin');
        const result = await response.json();
        setIsSuperAdmin(result.isSuperAdmin || false);
      } catch (err) {
        console.error('Error checking super admin:', err);
      }
    };
    checkSuperAdmin();
  }, []);

  useEffect(() => {
    // جلوگیری از اجرای مجدد
    if (hasLoadedRef.current) return;

    if (initialPatient) {
      hasLoadedRef.current = true;
      setFormData(initialPatient);

      // مقداردهی تاریخ تولد برای DatePicker
      if (initialPatient.birth_date) {
        try {
          // استفاده از toJalali برای تبدیل
          const jalaliDate = toJalali(initialPatient.birth_date);
          if (jalaliDate) {
            setBirthDatePicker(jalaliDate);
          }
        } catch (error) {
          console.error('Error setting birth date:', error);
        }
      }
      return;
    }

    if (patientId) {
      const fetchPatient = async () => {
        try {
          const result = await getPatient(patientId);
          if (result.data) {
            hasLoadedRef.current = true;
            setFormData(result.data);

            // مقداردهی تاریخ تولد برای DatePicker
            if (result.data.birth_date) {
              try {
                const jalaliDate = toJalali(result.data.birth_date);
                if (jalaliDate) {
                  setBirthDatePicker(jalaliDate);
                }
              } catch (error) {
                console.error('Error setting birth date:', error);
              }
            }
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

  // حذف نرم (معمولی)
  const handleDeletePatient = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePatient(patientId);

      if (result?.data) {
        toast.success("بیمار با موفقیت حذف شد!");
        router.push("/dashboard/patients");
        router.refresh();
      } else if (result?.error) {
        toast.error(result.error);
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast.error("خطا در حذف بیمار");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // حذف دائم (فقط super_admin)
  const handlePermanentDelete = async () => {
    if (!isSuperAdmin) {
      toast.error("شما دسترسی لازم برای حذف دائم را ندارید");
      return;
    }

    if (!confirm("آیا از حذف دائم این بیمار اطمینان دارید؟ این عمل قابل بازگشت نیست!")) {
      return;
    }

    setIsDeletingPermanent(true);
    try {
      const result = await deletePatientPermanent(patientId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("بیمار با موفقیت حذف دائم شد!");
        router.push("/dashboard/patients");
        router.refresh();
      }
    } catch (error) {
      console.error("Error permanently deleting patient:", error);
      toast.error("خطا در حذف دائم بیمار");
    } finally {
      setIsDeletingPermanent(false);
    }
  };

  // 3. دکمه در هدر (قبلاً اضافه شده)
  {
    isSuperAdmin && (
      <Button
        variant="destructive"
        onClick={handlePermanentDelete}
        disabled={isDeletingPermanent}
        className="bg-red-600 hover:bg-red-700"
      >
        {isDeletingPermanent ? (
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
        ) : (
          <ShieldAlert className="w-4 h-4 ml-2" />
        )}
        حذف دائم
      </Button>
    )
  }

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

  // فرمت قیمت به تومان
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">ویرایش بیمار</h1>
          <p className="text-gray-500 mt-1">
            {formData.first_name} {formData.last_name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/patients">
            <Button variant="outline">
              <ArrowRight className="w-4 h-4 ml-2" />
              بازگشت به لیست
            </Button>
          </Link>

          {/* دکمه حذف دائم - فقط بعد از بارگذاری کامل نمایش داده شود */}
          {!isCheckingAdmin && isSuperAdmin && (
            <Button
              variant="destructive"
              onClick={handlePermanentDelete}
              disabled={isDeletingPermanent}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingPermanent ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <ShieldAlert className="w-4 h-4 ml-2" />
              )}
              حذف دائم
            </Button>
          )}

          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
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

      {/* دیالوگ تایید حذف */}
      {showDeleteConfirm && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-700 dark:text-red-300">
                  آیا از حذف این بیمار اطمینان دارید؟
                </h3>
                <p className="text-red-600 dark:text-red-400 mt-1">
                  {formData.first_name} {formData.last_name} - کد ملی: {formData.national_code}
                </p>
                <p className="text-sm text-red-500 mt-2">
                  این عمل قابل بازگشت نیست و تمام اطلاعات مرتبط با این بیمار حذف خواهد شد.
                </p>
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="destructive"
                    onClick={handleDeletePatient}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                      "تایید حذف"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    انصراف
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  value={birthDatePicker || ""}
                  onChange={(date: any) => {
                    if (date && date.isValid) {
                      const year = date.year;
                      const month = String(date.month).padStart(2, '0');
                      const day = String(date.day).padStart(2, '0');
                      const isoDate = `${year}-${month}-${day}`;

                      setFormData(prev => ({
                        ...prev,
                        birth_date: isoDate
                      }));
                      setBirthDatePicker(date.format("YYYY/MM/DD"));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        birth_date: null
                      }));
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
            <div className="flex gap-4 pt-4 border-t flex-wrap">
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

      {/* بخش سمعک‌های خریداری‌شده */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            سمعک‌های خریداری‌شده
            <span className="text-sm font-normal text-gray-500 mr-2">
              ({sales.length} مورد)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSales ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="mr-2 text-gray-500">در حال بارگذاری سمعک‌ها...</span>
            </div>
          ) : sales.length > 0 ? (
            <div className="space-y-3">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Package className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{sale.hearing_aid_model}</span>
                      <span className="text-sm text-gray-500">|</span>
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        سریال: {sale.hearing_aid_serial}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <span className="text-gray-600 flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        تاریخ فروش: {toJalaliDisplay(sale.sale_date, "DD MMM YYYY")}
                      </span>
                      <span className="text-gray-600 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatPrice(sale.price)}
                      </span>
                      {sale.warranty_expiry && (
                        <span className="text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          گارانتی تا: {toJalaliDisplay(sale.warranty_expiry, "DD MMM YYYY")}
                        </span>
                      )}
                    </div>
                    {sale.notes && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {sale.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <Link href={`/dashboard/sales/${sale.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 ml-1" />
                        مشاهده
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>هیچ سمعکی برای این بیمار ثبت نشده است</p>
              <Link href={`/dashboard/sales/new?patientId=${patientId}`}>
                <Button variant="outline" className="mt-4">
                  ثبت فروش جدید
                </Button>
              </Link>
            </div>
          )}
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

      {/* اطلاعات اضافی */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            اطلاعات ثبت
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">تاریخ ثبت:</span>
              <span className="mr-2 font-medium">
                {formatJalaliDateTime(formData.created_at)}
              </span>
            </div>
            {formData.updated_at && (
              <div>
                <span className="text-gray-500">آخرین ویرایش:</span>
                <span className="mr-2 font-medium">
                  {formatJalaliDateTime(formData.updated_at)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}