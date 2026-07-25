"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { PatientFormData, SaleFormData } from "@/types";
import { createAdminClient } from "./admin";

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
  const tenantId = await getCurrentTenantId();

  const { error } = await supabase
    .from("patients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  if (error) {
    return { error: "خطا در حذف بیمار: " + error.message };
  }

  revalidatePath("/dashboard/patients");
  return { data: { success: true, id }, error: null };
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