"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { PatientFormData, SaleFormData } from "@/types";
import { createAdminClient } from "./admin";
import { tenantSchema, type TenantFormData } from "@/lib/validations/tenant";
import moment from "moment-jalaali";
import { addToQueue } from '@/lib/sms/queue';
import { SmsQueueType } from '@/types/messaging';
import { 
  onAppointmentCreated, 
  onAppointmentCancelled, 
  onAppointmentNoShow 
} from '@/lib/sms/event-handlers';
// ============================================
// Schemas
// ============================================

const patientSchema = z.object({
  first_name: z.string().min(2, "نام باید حداقل 2 کاراکتر باشد"),
  last_name: z.string().min(2, "نام خانوادگی باید حداقل 2 کاراکتر باشد"),
  national_code: z.string().length(10, "کد ملی باید 10 رقم باشد"),
  phone: z.string().min(11, "شماره تلفن نامعتبر است"),
  email: z.string().email("ایمیل نامعتبر است").optional().nullable(),
  birth_date: z.string().optional().nullable(),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const salesSchema = z.object({
  patient_id: z.string().uuid("شناسه بیمار نامعتبر است"),
  hearing_aid_model: z.string().min(2, "مدل سمعک باید حداقل 2 کاراکتر باشد"),
  hearing_aid_serial: z.string().min(3, "سریال سمعک باید حداقل 3 کاراکتر باشد"),
  price: z.number().min(0, "قیمت نمی‌تواند منفی باشد"),
  sale_date: z.string().optional(),
  warranty_expiry: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ============================================
// Helpers
// ============================================

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentTenantId() {
  const supabase = await createClient();
  const { data: tenantId, error } = await supabase
    .rpc('get_current_tenant_id');

  if (error || !tenantId) {
    throw new Error("کاربر به هیچ Tenant متصل نیست.");
  }
  return tenantId;
}

// ============================================
// Patients
// ============================================

export async function getPatients() {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching patients:", error);
    return { error: error.message, data: [] };
  }

  return { data: data || [], error: null };
}

export async function getPatient(id: string) {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

export async function createPatient(data: PatientFormData) {
  if (data.birth_date && data.birth_date.includes('/')) {
    const parts = data.birth_date.split('/');
    if (parts.length === 3 && parseInt(parts[0]) >= 1300) {
      // تاریخ شمسی است، به میلادی تبدیل کن
      const m = moment(data.birth_date, 'jYYYY/MM/DD');
      if (m.isValid()) {
        data.birth_date = m.format('YYYY-MM-DD');
      }
    }
  }
  const supabase = await createClient();
  const user = await getCurrentUser();
  const tenantId = await getCurrentTenantId();

  if (!user) {
    return { error: "لطفاً وارد حساب کاربری خود شوید." };
  }

  const validation = patientSchema.safeParse(data);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0] || "داده‌های وارد شده نامعتبر است";
    return { error: firstError, fieldErrors: errors };
  }

  const { data: result, error } = await supabase
    .from("patients")
    .insert({ ...validation.data, tenant_id: tenantId })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "کد ملی قبلاً ثبت شده است." };
    }
    return { error: "خطا در ذخیره بیمار: " + error.message };
  }

  revalidatePath("/dashboard/patients");
  return { data: result, error: null };
}

export async function updatePatient(id: string, data: PatientFormData) {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const validation = patientSchema.safeParse(data);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0] || "داده‌های وارد شده نامعتبر است";
    return { error: firstError, fieldErrors: errors };
  }

  const { data: result, error } = await supabase
    .from("patients")
    .update(validation.data)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    return { error: "خطا در ویرایش بیمار: " + error.message };
  }

  revalidatePath("/dashboard/patients");
  return { data: result, error: null };
}


export async function deletePatient(id: string) {
  const supabase = await createClient();

  // دریافت Tenant ID
  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    return { error: "Tenant یافت نشد" };
  }

  // ابتدا بررسی کنید که بیمار وجود دارد و متعلق به Tenant جاری است
  const { data: patient, error: checkError } = await supabase
    .from("patients")
    .select("id, tenant_id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .single();

  if (checkError || !patient) {
    console.error("Patient not found or access denied:", checkError);
    return { error: "بیمار یافت نشد یا دسترسی ندارید" };
  }

  // انجام soft delete با updated_at و deleted_at
  const { error } = await supabase
    .from("patients")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  if (error) {
    console.error("Delete patient error:", error);
    return { error: "خطا در حذف بیمار: " + error.message };
  }

  // بازآوری کش
  revalidatePath("/dashboard/patients");

  return { data: { success: true, id }, error: null };
}
//* حذف دائم بیمار(فقط برای super_admin) این تابع از Admin Client استفاده می‌کند تا RLS را دور بزند //* 

export async function deletePatientPermanent(id: string) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // بررسی اینکه کاربر جاری super_admin است
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "لطفاً وارد حساب کاربری خود شوید." };
  }

  // بررسی super_admin بودن
  const { data: currentUser, error: userError } = await supabaseAdmin
    .from('users')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (userError || !currentUser?.is_super_admin) {
    return { error: "شما دسترسی لازم برای حذف دائم بیماران را ندارید." };
  }

  // حذف دائم بیمار با Admin Client (دور زدن RLS)
  const { data, error } = await supabaseAdmin
    .from("patients")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error permanently deleting patient:", error);
    return { error: "خطا در حذف دائم بیمار: " + error.message };
  }

  // لاگ فعالیت
  try {
    await supabaseAdmin.from("activity_logs").insert({
      tenant_id: data.tenant_id,
      user_id: user.id,
      action: 'permanent_delete_patient',
      table_name: 'patients',
      record_id: id,
      metadata: {
        patient_name: `${data.first_name} ${data.last_name}`,
        national_code: data.national_code,
        deleted_by: user.id,
      },
    });
  } catch (logError) {
    console.error("Error logging permanent delete:", logError);
    // خطا را لاگ کن ولی اجرا را متوقف نکن
  }

  revalidatePath("/dashboard/patients");
  return { data: { success: true, id, deleted: true }, error: null };
}

// ============================================
// Sales
// ============================================

export async function getSales() {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from("sales")
    .select(`
      *,
      patient:patients(id, first_name, last_name, national_code, phone)
    `)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("sale_date", { ascending: false });

  if (error) {
    return { error: error.message, data: [] };
  }

  return { data: data || [], error: null };
}

export async function createSale(data: SaleFormData) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const tenantId = await getCurrentTenantId();

  if (!user) {
    return { error: "لطفاً وارد حساب کاربری خود شوید." };
  }

  const validation = salesSchema.safeParse(data);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0] || "داده‌های وارد شده نامعتبر است";
    return { error: firstError, fieldErrors: errors };
  }

  const { data: result, error } = await supabase
    .from("sales")
    .insert({
      ...validation.data,
      tenant_id: tenantId,
      created_by: user.id,
      sale_date: data.sale_date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "سریال سمعک قبلاً ثبت شده است." };
    }
    return { error: "خطا در ثبت فروش: " + error.message };
  }

  revalidatePath("/dashboard/sales");
  return { data: result, error: null };
}

// src/lib/supabase/actions.ts
export async function deleteSale(id: string) {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  // ابتدا بررسی کنید که فروش متعلق به Tenant جاری است
  const { data: sale, error: checkError } = await supabase
    .from("sales")
    .select("id, tenant_id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .single();

  if (checkError || !sale) {
    return { error: "فروش یافت نشد یا دسترسی ندارید" };
  }

  // انجام soft delete
  const { error } = await supabase
    .from("sales")
    .update({
      deleted_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  if (error) {
    console.error("Delete sale error:", error);
    return { error: "خطا در حذف فروش: " + error.message };
  }

  revalidatePath("/dashboard/sales");
  return { data: { success: true, id }, error: null };
}

// ============================================
// Dashboard Stats
// ============================================

export async function getDashboardStats() {
  const supabase = await createClient();

  try {
    const { data: stats, error: statsError } = await supabase
      .rpc('get_current_tenant_stats');

    if (statsError) {
      return { error: statsError.message, data: null };
    }

    const { data: activities, error: activitiesError } = await supabase
      .rpc('get_recent_activities', { p_limit: 10 });

    return {
      data: {
        stats: stats || null,
        activities: activities || [],
      },
      error: null,
    };
  } catch (error) {
    return { error: "خطا در دریافت آمار", data: null };
  }
}

// ============================================
// Auth
// ============================================

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function register(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      data: {
        full_name: formData.get("fullName") as string,
        role: "user",
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// src/lib/supabase/actions.ts
// اضافه کردن به انتهای فایل

// ============================================
// Users Management
// ============================================

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "لطفاً وارد حساب کاربری خود شوید." };
  }

  const { data: currentUser } = await supabaseAdmin
    .from('users')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!currentUser?.is_super_admin) {
    return { error: "شما دسترسی لازم برای تغییر نقش کاربران را ندارید." };
  }

  const validRoles = ['admin', 'audiologist', 'receptionist', 'user'];
  if (!validRoles.includes(role)) {
    return { error: "نقش نامعتبر است." };
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return { error: "خطا در به‌روزرسانی نقش کاربر: " + error.message };
  }

  revalidatePath("/dashboard/users");
  return { data, error: null };
}

export async function toggleSuperAdmin(userId: string, isSuperAdmin: boolean) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "لطفاً وارد حساب کاربری خود شوید." };
  }

  const { data: currentUser } = await supabaseAdmin
    .from('users')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!currentUser?.is_super_admin) {
    return { error: "شما دسترسی لازم برای تغییر دسترسی مدیرکل را ندارید." };
  }

  if (userId === user.id) {
    return { error: "نمی‌توانید دسترسی خود را تغییر دهید." };
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ is_super_admin: isSuperAdmin })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return { error: "خطا در تغییر دسترسی مدیرکل: " + error.message };
  }

  revalidatePath("/dashboard/users");
  return { data, error: null };
}


// ============================================
// Tenants Management (Super Admin Only)
// ============================================

export async function getTenants() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "لطفاً وارد حساب کاربری خود شوید.", data: [] };
  }

  const supabaseAdmin = createAdminClient();

  // ابتدا همه tenants را بگیر
  const { data: tenants, error: tenantsError } = await supabaseAdmin
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (tenantsError) {
    console.error("Error fetching tenants:", tenantsError);
    return { error: tenantsError.message, data: [] };
  }

  // برای هر tenant تعداد کاربران و بیماران را جداگانه بگیر
  const tenantsWithCounts = await Promise.all(
    (tenants || []).map(async (tenant) => {
      // تعداد کاربران
      const { count: usersCount, error: usersError } = await supabaseAdmin
        .from("users")
        .select("*", { count: 'exact', head: true })
        .eq("tenant_id", tenant.id);

      // تعداد بیماران
      const { count: patientsCount, error: patientsError } = await supabaseAdmin
        .from("patients")
        .select("*", { count: 'exact', head: true })
        .eq("tenant_id", tenant.id)
        .is("deleted_at", null);

      // تعداد فروش
      const { count: salesCount, error: salesError } = await supabaseAdmin
        .from("sales")
        .select("*", { count: 'exact', head: true })
        .eq("tenant_id", tenant.id)
        .is("deleted_at", null);

      // مجموع درآمد
      const { data: revenueData, error: revenueError } = await supabaseAdmin
        .from("sales")
        .select("price")
        .eq("tenant_id", tenant.id)
        .is("deleted_at", null);

      const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;

      return {
        ...tenant,
        users_count: usersCount || 0,
        patients_count: patientsCount || 0,
        sales_count: salesCount || 0,
        total_revenue: totalRevenue,
      };
    })
  );

  return { data: tenantsWithCounts, error: null };
}

export async function getTenant(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "لطفاً وارد حساب کاربری خود شوید.", data: null };
  }

  // const isSuperAdmin = user.app_metadata?.is_super_admin === true;
  // if (!isSuperAdmin) {
  //   return { error: "شما دسترسی لازم را ندارید.", data: null };
  // }

  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

export async function createTenant(data: TenantFormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "لطفاً وارد حساب کاربری خود شوید." };
  }

  // const isSuperAdmin = user.app_metadata?.is_super_admin === true;
  // if (!isSuperAdmin) {
  //   return { error: "شما دسترسی لازم برای ایجاد مطب جدید را ندارید." };
  // }

  const validation = tenantSchema.safeParse(data);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0] || "داده‌های وارد شده نامعتبر است";
    return { error: firstError, fieldErrors: errors };
  }

  // تولید license_key به صورت خودکار اگر وارد نشده باشد
  const licenseKey = data.license_key || generateLicenseKey();

  const supabaseAdmin = createAdminClient();

  const { data: result, error } = await supabaseAdmin
    .from("tenants")
    .insert({
      name: data.name,
      slug: data.slug,
      email: data.email,
      phone: data.phone,
      address: data.address,
      website: data.website,
      registration_number: data.registration_number,
      license_key: licenseKey,
      is_active: data.is_active ?? true,
      // plan, expires_at, max_users, max_patients در دیتابیس نیستند
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "اسلاگ یا لایسنس قبلاً ثبت شده است." };
    }
    return { error: "خطا در ایجاد مطب: " + error.message };
  }

  revalidatePath("/admin/tenants");
  return { data: result, error: null };
}

export async function updateTenant(id: string, data: Partial<TenantFormData>) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "لطفاً وارد حساب کاربری خود شوید." };
  }

  const validation = tenantSchema.partial().safeParse(data);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0] || "داده‌های وارد شده نامعتبر است";
    return { error: firstError, fieldErrors: errors };
  }

  // فقط فیلدهای موجود در دیتابیس را به‌روز کنید
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.website !== undefined) updateData.website = data.website;
  if (data.registration_number !== undefined) updateData.registration_number = data.registration_number;
  if (data.license_key !== undefined) updateData.license_key = data.license_key;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;

  const supabaseAdmin = createAdminClient();

  const { data: result, error } = await supabaseAdmin
    .from("tenants")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: "خطا در ویرایش مطب: " + error.message };
  }

  revalidatePath("/admin/tenants");
  return { data: result, error: null };
}

export async function deleteTenant(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "لطفاً وارد حساب کاربری خود شوید." };
  }

  // const isSuperAdmin = user.app_metadata?.is_super_admin === true;
  // if (!isSuperAdmin) {
  //   return { error: "شما دسترسی لازم برای حذف مطب را ندارید." };
  // }

  const supabaseAdmin = createAdminClient();

  // ابتدا بررسی کنید که مطب کاربر ندارد
  const { count, error: countError } = await supabaseAdmin
    .from("users")
    .select("*", { count: 'exact', head: true })
    .eq("tenant_id", id);

  if (countError) {
    return { error: "خطا در بررسی کاربران مطب: " + countError.message };
  }

  if (count && count > 0) {
    return { error: "این مطب دارای کاربر است. ابتدا کاربران را انتقال یا حذف کنید." };
  }

  // حذف مطب
  const { error } = await supabaseAdmin
    .from("tenants")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: "خطا در حذف مطب: " + error.message };
  }

  revalidatePath("/admin/tenants");
  return { data: { success: true, id }, error: null };
}

export async function toggleTenantStatus(id: string, status: 'active' | 'inactive' | 'suspended') {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "لطفاً وارد حساب کاربری خود شوید." };
  }

  const isActive = status === 'active';

  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: "خطا در تغییر وضعیت مطب: " + error.message };
  }

  revalidatePath("/admin/tenants");
  return { data, error: null };
}

// تابع کمکی برای تولید license_key
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let license = '';
  for (let i = 0; i < 32; i++) {
    if (i > 0 && i % 8 === 0) {
      license += '-';
    }
    license += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return license;
}

// src/lib/supabase/actions.ts - اضافه کنید

export async function getAllUsers() {
  try {
    const supabaseAdmin = createAdminClient();

    // دریافت لیست کاربران از Auth API
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error("Auth error:", authError);
      return { error: authError.message, data: [] };
    }

    // دریافت اطلاعات تکمیلی از جدول users (بدون deleted_at)
    const { data: dbUsers, error: dbError } = await supabaseAdmin
      .from("users")
      .select("id, full_name, role, phone, specialty, is_active, is_super_admin, created_at, tenant_id");

    if (dbError) {
      console.error("DB error:", dbError);
      return { error: dbError.message, data: [] };
    }

    // ترکیب داده‌ها
    const combinedUsers = authUsers.users.map((authUser: any) => {
      const dbUser = dbUsers?.find((u: any) => u.id === authUser.id);

      return {
        id: authUser.id,
        email: authUser.email || "نامشخص",
        full_name: dbUser?.full_name || authUser.user_metadata?.full_name || "-",
        role: dbUser?.role || "user",
        phone: dbUser?.phone || authUser.phone || "-",
        specialty: dbUser?.specialty || "-",
        is_active: dbUser?.is_active ?? true,
        is_super_admin: dbUser?.is_super_admin || authUser.app_metadata?.is_super_admin || false,
        created_at: dbUser?.created_at || authUser.created_at,
        tenant_id: dbUser?.tenant_id,
      };
    });

    // مرتب‌سازی بر اساس تاریخ ایجاد
    combinedUsers.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return { data: combinedUsers, error: null };
  } catch (error: any) {
    console.error("Error in getAllUsers:", error);
    return { error: error.message || "خطا در دریافت کاربران", data: [] };
  }
}

export async function getAdminStats() {
  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin
    .from("tenant_stats")
    .select("*")
    .order("tenant_name");

  if (error) {
    return { error: error.message, data: [] };
  }

  return { data: data || [], error: null };
}

// ============================================
// Appointments
// ============================================

// ============================================
// Types
// ============================================

export type AppointmentStatus =
  | 'scheduled'
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type AppointmentType =
  | 'visit'
  | 'follow_up'
  | 'test'
  | 'fitting'
  | 'consultation'
  | 'other';

// ============================================
// Schema
// ============================================

const appointmentSchema = z.object({
  patient_id: z.string().uuid("شناسه بیمار نامعتبر است"),
  start_time: z.string().datetime("زمان شروع نامعتبر است"),
  end_time: z.string().datetime("زمان پایان نامعتبر است"),
  type: z.enum(['visit', 'follow_up', 'test', 'fitting', 'consultation', 'other']),
  status: z.enum(['scheduled', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).default('scheduled'),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// ============================================
// Appointments CRUD
// ============================================

/**
 * دریافت لیست نوبت‌ها با فیلترهای اختیاری
 */
export async function getAppointments(filters?: {
  patient_id?: string;
  status?: AppointmentStatus;
  type?: AppointmentType;
  start_date?: string;  // YYYY-MM-DD
  end_date?: string;    // YYYY-MM-DD
  page?: number;
  limit?: number;
}) {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  let query = supabase
    .from("appointments")
    .select(`
      *,
      patient:patients(id, first_name, last_name, national_code, phone)
    `)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("start_time", { ascending: true });

  // اعمال فیلترها
  if (filters?.patient_id) {
    query = query.eq("patient_id", filters.patient_id);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  if (filters?.start_date) {
    query = query.gte("start_time", `${filters.start_date}T00:00:00`);
  }

  if (filters?.end_date) {
    query = query.lte("end_time", `${filters.end_date}T23:59:59`);
  }

  // Pagination
  const page = filters?.page || 1;
  const limit = filters?.limit || 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching appointments:", error);
    return { error: error.message, data: [], count: 0 };
  }

  return { data: data || [], error: null, count: count || 0 };
}

/**
 * دریافت نوبت با ID
 */
export async function getAppointment(id: string) {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      patient:patients(id, first_name, last_name, national_code, phone)
    `)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

/**
 * دریافت نوبت‌های یک بیمار خاص
 */
export async function getPatientAppointments(patientId: string) {
  return getAppointments({ patient_id: patientId, limit: 100 });
}

/**
 * ایجاد نوبت جدید
 */
export async function createAppointment(data: {
  patient_id: string;
  start_time: string;
  end_time: string;
  type: AppointmentType;
  status?: AppointmentStatus;
  title?: string | null;
  description?: string | null;
  notes?: string | null;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const tenantId = await getCurrentTenantId();

  if (!user) {
    return { error: "لطفاً وارد حساب کاربری خود شوید." };
  }

  // اعتبارسنجی
  const validation = appointmentSchema.safeParse({
    ...data,
    status: data.status || 'scheduled',
  });

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0] || "داده‌های وارد شده نامعتبر است";
    return { error: firstError, fieldErrors: errors };
  }


  // بخش createAppointment - بررسی تداخل

  // بررسی تداخل زمانی - فقط نوبت‌های فعال
  const { data: conflicting, error: conflictError } = await supabase
    .from("appointments")
    .select("id, status, start_time, end_time")
    .eq("tenant_id", tenantId)
    .eq("patient_id", data.patient_id)
    .is("deleted_at", null)
    .in("status", ["scheduled", "pending", "confirmed", "in_progress"])
    .or(`start_time.lte.${data.end_time},end_time.gte.${data.start_time}`)
    .limit(1);

  if (conflictError) {
    console.error("Error checking appointment conflict:", conflictError);
  }

  if (conflicting && conflicting.length > 0) {
    return { error: "بیمار در این زمان نوبت فعال دیگری دارد." };
  }

  // ایجاد نوبت
  const { data: result, error } = await supabase
    .from("appointments")
    .insert({
      ...validation.data,
      tenant_id: tenantId,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating appointment:", error);
    return { error: "خطا در ثبت نوبت: " + error.message };
  }

  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/patients/${data.patient_id}`);

  return { data: result, error: null };
}

/**
 * ویرایش نوبت
 */
export async function updateAppointment(id: string, data: Partial<{
  patient_id: string;
  start_time: string;
  end_time: string;
  type: AppointmentType;
  status: AppointmentStatus;
  title?: string | null;
  description?: string | null;
  notes?: string | null;
}>) {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const validation = appointmentSchema.partial().safeParse(data);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0] || "داده‌های وارد شده نامعتبر است";
    return { error: firstError, fieldErrors: errors };
  }

  // اگر زمان تغییر کرده، تداخل را بررسی کن
  if (data.start_time || data.end_time || data.patient_id) {
    // ابتدا نوبت فعلی را بگیر
    const { data: existing, error: existingError } = await supabase
      .from("appointments")
      .select("patient_id, start_time, end_time")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .single();

    if (!existingError && existing) {
      const patientId = data.patient_id || existing.patient_id;
      const startTime = data.start_time || existing.start_time;
      const endTime = data.end_time || existing.end_time;

      const { data: conflicting, error: conflictError } = await supabase
        .from("appointments")
        .select("id, status")
        .eq("tenant_id", tenantId)
        .eq("patient_id", patientId)
        .is("deleted_at", null)
        .neq("id", id)
        .in("status", ["scheduled", "pending", "confirmed", "in_progress"])
        .or(`start_time.lte.${endTime},end_time.gte.${startTime}`)
        .limit(1);

      if (!conflictError && conflicting && conflicting.length > 0) {
        return { error: "بیمار در این زمان نوبت دیگری دارد." };
      }
    }
  }

  const { data: result, error } = await supabase
    .from("appointments")
    .update(validation.data)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    return { error: "خطا در ویرایش نوبت: " + error.message };
  }

  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/patients/${result.patient_id}`);

  return { data: result, error: null };
}

/**
 * لغو نوبت (با دلیل اختیاری)
 */
export async function cancelAppointment(id: string, reason?: string) {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const { data: appointment, error: checkError } = await supabase
    .from("appointments")
    .select("patient_id, status")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .single();

  if (checkError || !appointment) {
    return { error: "نوبت یافت نشد یا دسترسی ندارید" };
  }

  // اگر نوبت قبلاً لغو شده یا انجام شده
  if (appointment.status === 'cancelled' || appointment.status === 'completed' || appointment.status === 'no_show') {
    return { error: "نوبت قابل لغو نیست" };
  }

  const { data: result, error } = await supabase
    .from("appointments")
    .update({
      status: 'cancelled',
      cancellation_reason: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    return { error: "خطا در لغو نوبت: " + error.message };
  }

  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/patients/${result.patient_id}`);

  return { data: result, error: null };
}

/**
 * حذف نوبت (soft delete)
 */
export async function deleteAppointment(id: string) {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const { data: appointment, error: checkError } = await supabase
    .from("appointments")
    .select("patient_id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .single();

  if (checkError || !appointment) {
    return { error: "نوبت یافت نشد یا دسترسی ندارید" };
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  if (error) {
    return { error: "خطا در حذف نوبت: " + error.message };
  }

  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/patients/${appointment.patient_id}`);

  return { data: { success: true, id }, error: null };
}

/**
 * دریافت آمار نوبت‌ها
 */
export async function getAppointmentStats() {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString();

  const { data: stats, error } = await supabase
    .from("appointments")
    .select("status", { count: 'exact', head: false })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .gte("start_time", todayStr)
    .lte("start_time", nextWeekStr);

  if (error) {
    return { error: error.message, data: null };
  }

  // محاسبه آمار
  const total = stats?.length || 0;
  const byStatus: Record<string, number> = {};

  stats?.forEach((item: any) => {
    const status = item.status || 'unknown';
    byStatus[status] = (byStatus[status] || 0) + 1;
  });

  return {
    data: {
      total,
      by_status: byStatus,
      scheduled: byStatus.scheduled || 0,
      pending: byStatus.pending || 0,
      confirmed: byStatus.confirmed || 0,
      in_progress: byStatus.in_progress || 0,
      completed: byStatus.completed || 0,
      cancelled: byStatus.cancelled || 0,
      no_show: byStatus.no_show || 0,
    },
    error: null,
  };
}
export async function sendAppointmentConfirmation(
  appointmentId: string,
  patientPhone: string,
  patientName: string,
  clinicName: string,
  appointmentDate: string,
  appointmentTime: string
) {
  const tenantId = await getCurrentTenantId();
  
  const content = `سلام ${patientName} عزیز، نوبت شما برای ${appointmentDate} ساعت ${appointmentTime} در ${clinicName} ثبت شد.`;

  return await addToQueue({
    tenant_id: tenantId,
    phone: patientPhone,
    content,
    type: 'appointment_confirmation',
    reference_id: appointmentId,
    reference_type: 'appointments',
    priority: 2, // اولویت بالا
  });
}

/**
 * برنامه‌ریزی یادآوری نوبت (۲۴ ساعت قبل)
 */
export async function scheduleAppointmentReminder(
  appointmentId: string,
  patientPhone: string,
  patientName: string,
  appointmentDate: string,
  appointmentTime: string
) {
  const tenantId = await getCurrentTenantId();
  
  // ۲۴ ساعت قبل
  const scheduledAt = new Date();
  scheduledAt.setHours(scheduledAt.getHours() + 24);
  
  const content = `سلام ${patientName} عزیز، فردا ساعت ${appointmentTime} نوبت شنوایی‌سنجی دارید. لطفاً ۱۵ دقیقه زودتر حاضر باشید.`;

  return await addToQueue({
    tenant_id: tenantId,
    phone: patientPhone,
    content,
    type: 'appointment_reminder',
    scheduled_at: scheduledAt.toISOString(),
    reference_id: appointmentId,
    reference_type: 'appointments',
    priority: 1,
  });
}
// ============================================
// SMS Event Handlers - Integration
// ============================================

/**
 * ایجاد نوبت با ارسال پیامک
 */
export async function createAppointmentWithSms(data: any) {
  // ... کد ایجاد نوبت (که قبلاً در actions.ts دارید) ...
  
  const result = await createAppointment(data);
  
  if (result.data) {
    // ارسال پیامک تأیید نوبت
    await onAppointmentCreated(result.data.id);
  }
  
  return result;
}

/**
 * لغو نوبت با ارسال پیامک
 */
export async function cancelAppointmentWithSms(id: string, reason?: string) {
  const result = await cancelAppointment(id, reason);
  
  if (result.data) {
    // ارسال پیامک لغو نوبت
    await onAppointmentCancelled(id, reason);
  }
  
  return result;
}

/**
 * ثبت عدم مراجعه با ارسال پیامک
 */
export async function setAppointmentNoShow(id: string, reason?: string) {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('appointments')
    .update({
      status: 'no_show',
      no_show_reason: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // ارسال پیامک پیگیری عدم مراجعه
  if (data) {
    await onAppointmentNoShow(id);
  }

  revalidatePath('/dashboard/appointments');
  return { data, error: null };
}