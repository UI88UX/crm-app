"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { PatientFormData, SaleFormData } from "@/types";
import { createAdminClient } from "./admin";
import { tenantSchema, type TenantFormData } from "@/lib/validations/tenant";
import moment from "moment-jalaali";

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

async function getCurrentTenantId() {
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