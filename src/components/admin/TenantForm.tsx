// components/admin/TenantForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { tenantSchema, type TenantFormData } from "@/lib/validations/tenant";
import { createTenant, updateTenant } from "@/lib/supabase/actions";

interface TenantFormProps {
  initialData?: (TenantFormData & { id?: string }) | Partial<TenantFormData> & { id?: string };
  isEdit?: boolean;
}

export function TenantForm({ initialData, isEdit = false }: TenantFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: initialData || {
      plan: "free",
      is_active: true,
      max_users: 5,
      max_patients: 100,
    },
  });

  const plan = watch("plan");
  const isActive = watch("is_active");

  const onSubmit = async (data: TenantFormData) => {
    setIsLoading(true);
    try {
      // داده‌ها را برای دیتابیس آماده کنید
      const payload = {
        name: data.name,
        slug: data.slug,
        email: data.email,
        phone: data.phone,
        address: data.address,
        website: data.website,
        registration_number: data.registration_number,
        license_key: data.license_key,
        is_active: data.is_active,
        // این فیلدها در دیتابیس نیستند ولی برای نمایش نگه می‌داریم
        plan: data.plan,
        expires_at: data.expires_at,
        max_users: data.max_users,
        max_patients: data.max_patients,
      };

      let result;
      if (isEdit && initialData?.id) {
        result = await updateTenant(initialData.id, payload);
      } else {
        result = await createTenant(payload);
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEdit ? "مطب با موفقیت ویرایش شد" : "مطب با موفقیت ایجاد شد");
        router.push("/admin/tenants");
        router.refresh();
      }
    } catch (error) {
      toast.error("خطا در ذخیره اطلاعات");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "ویرایش مطب" : "افزودن مطب جدید"}</CardTitle>
        <CardDescription>
          اطلاعات مطب را وارد کنید. فیلدهای ستاره‌دار الزامی هستند.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                نام مطب <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="مثال: کلینیک شنوایی تهران"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                اسلاگ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                placeholder="مثال: hearing-tehran"
                {...register("slug")}
              />
              {errors.slug && (
                <p className="text-sm text-red-500">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                placeholder="info@clinic.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">تلفن</Label>
              <Input
                id="phone"
                placeholder="021-12345678"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">آدرس</Label>
              <Input
                id="address"
                placeholder="آدرس کامل مطب"
                {...register("address")}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">وب‌سایت</Label>
              <Input
                id="website"
                placeholder="https://example.com"
                {...register("website")}
              />
              {errors.website && (
                <p className="text-sm text-red-500">{errors.website.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_number">شماره ثبت</Label>
              <Input
                id="registration_number"
                placeholder="شماره ثبت مطب"
                {...register("registration_number")}
              />
              {errors.registration_number && (
                <p className="text-sm text-red-500">{errors.registration_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">پلن</Label>
              <Select
                value={plan}
                onValueChange={(value) => setValue("plan", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="پلن را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">رایگان</SelectItem>
                  <SelectItem value="basic">پایه</SelectItem>
                  <SelectItem value="premium">پرمیوم</SelectItem>
                  <SelectItem value="enterprise">سازمانی</SelectItem>
                </SelectContent>
              </Select>
              {errors.plan && (
                <p className="text-sm text-red-500">{errors.plan.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_active">وضعیت</Label>
              <Select
                value={isActive ? "active" : "inactive"}
                onValueChange={(value) => setValue("is_active", value === "active")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="وضعیت را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="inactive">غیرفعال</SelectItem>
                </SelectContent>
              </Select>
              {errors.is_active && (
                <p className="text-sm text-red-500">{errors.is_active.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_users">حداکثر کاربران</Label>
              <Input
                id="max_users"
                type="number"
                min="1"
                {...register("max_users", { valueAsNumber: true })}
              />
              {errors.max_users && (
                <p className="text-sm text-red-500">{errors.max_users.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_patients">حداکثر بیماران</Label>
              <Input
                id="max_patients"
                type="number"
                min="1"
                {...register("max_patients", { valueAsNumber: true })}
              />
              {errors.max_patients && (
                <p className="text-sm text-red-500">{errors.max_patients.message}</p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="expires_at">تاریخ انقضا</Label>
              <Input
                id="expires_at"
                type="date"
                {...register("expires_at")}
              />
              {errors.expires_at && (
                <p className="text-sm text-red-500">{errors.expires_at.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              بازگشت
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "در حال ذخیره..." : isEdit ? "ویرایش" : "ایجاد مطب"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}