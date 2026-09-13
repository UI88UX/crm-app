// src/lib/supabase/call-followups.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CallFollowup, CallResult, CallFollowupStatus } from "@/types";
import {
  createCallFollowupSchema,
  completeCallFollowupSchema,
  updateCallFollowupSchema,
} from "@/lib/validations/call-followup";

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
  const { data: tenantId, error } = await supabase.rpc('get_current_tenant_id');
  if (error || !tenantId) {
    throw new Error("کاربر به هیچ Tenant متصل نیست.");
  }
  return tenantId;
}

/**
 * Revalidate کردن مسیرهای مرتبط با پیگیری
 */
function revalidateCallFollowupPaths(patientId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/patients");
  if (patientId) {
    revalidatePath(`/dashboard/patients/${patientId}`);
  }
}

// ============================================
// Queries (خواندن)
// ============================================

/**
 * دریافت لیست پیگیری‌ها با فیلتر
 */
export async function getCallFollowups(filters?: {
  status?: CallFollowupStatus;
  result?: CallResult;
  patient_id?: string;
  due_from?: string;
  due_to?: string;
  page?: number;
  limit?: number;
}) {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  let query = supabase
    .from("call_followups")
    .select(`
      *,
      patient:patients(id, first_name, last_name, national_code, phone)
    `, { count: 'exact' })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("due_date", { ascending: true });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.result) query = query.eq("result", filters.result);
  if (filters?.patient_id) query = query.eq("patient_id", filters.patient_id);
  if (filters?.due_from) query = query.gte("due_date", filters.due_from);
  if (filters?.due_to) query = query.lte("due_date", filters.due_to);

  const page = filters?.page || 1;
  const limit = filters?.limit || 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching call followups:", error);
    return { error: error.message, data: [], count: 0 };
  }

  return { data: (data || []) as CallFollowup[], error: null, count: count || 0 };
}

/**
 * دریافت یک پیگیری با ID
 */
export async function getCallFollowup(id: string) {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from("call_followups")
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
  return { data: data as CallFollowup, error: null };
}

/**
 * دریافت پیگیری‌های یک بیمار
 */
export async function getPatientCallFollowups(patientId: string) {
  return getCallFollowups({ patient_id: patientId, limit: 100 });
}

/**
 * دریافت پیگیری‌های نزدیک (طی ۲۴ ساعت آینده) — برای Alert
 */
export async function getDueSoonCallFollowups() {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("call_followups")
    .select(`
      *,
      patient:patients(id, first_name, last_name, national_code, phone)
    `)
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .is("deleted_at", null)
    .lte("due_date", tomorrow.toISOString())
    .order("due_date", { ascending: true })
    .limit(50);

  if (error) {
    return { error: error.message, data: [] };
  }
  return { data: (data || []) as CallFollowup[], error: null };
}

/**
 * آمار پیگیری‌ها — برای Bell و Dashboard
 */
/**
 * آمار پیگیری‌ها — برای Bell و Dashboard
 */
export async function getCallFollowupStats() {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);

  // ✅ عقب‌افتاده: هر پیگیری pending که due_date < الان
  const { count: overdueCount } = await supabase
    .from("call_followups")
    .select("*", { count: 'exact', head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .is("deleted_at", null)
    .lt("due_date", now.toISOString());

  // ✅ امروز: پیگیری pending که due_date بین الان و پایان امروز
  const { count: todayCount } = await supabase
    .from("call_followups")
    .select("*", { count: 'exact', head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .is("deleted_at", null)
    .gte("due_date", now.toISOString())
    .lte("due_date", todayEnd.toISOString());

  // فردا: از فردا صبح تا پایان فردا
  const { count: tomorrowCount } = await supabase
    .from("call_followups")
    .select("*", { count: 'exact', head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .is("deleted_at", null)
    .gte("due_date", todayEnd.toISOString())
    .lte("due_date", tomorrowEnd.toISOString());

  // مجموع pending
  const { count: totalPending } = await supabase
    .from("call_followups")
    .select("*", { count: 'exact', head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .is("deleted_at", null);

  return {
    data: {
      overdue: overdueCount || 0,
      today: todayCount || 0,
      tomorrow: tomorrowCount || 0,
      total_pending: totalPending || 0,
      unread: (overdueCount || 0) + (todayCount || 0),
    },
    error: null,
  };
}

// ============================================
// Mutations (نوشتن)
// ============================================

/**
 * ایجاد پیگیری جدید
 */
export async function createCallFollowup(data: {
  patient_id: string;
  due_date: string;
  notes?: string | null;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const tenantId = await getCurrentTenantId();

  if (!user) {
    return { error: "لطفاً وارد حساب کاربری خود شوید." };
  }

  const validation = createCallFollowupSchema.safeParse(data);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0] || "داده‌های وارد شده نامعتبر است";
    return { error: firstError, fieldErrors: errors };
  }

  // بررسی: آیا بیمار پیگیری فعال دارد؟ (اگر بله → خطا، چون unique index داریم)
  const { data: existing } = await supabase
    .from("call_followups")
    .select("id, due_date")
    .eq("tenant_id", tenantId)
    .eq("patient_id", data.patient_id)
    .eq("status", "pending")
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    return {
      error: "این بیمار از قبل یک پیگیری فعال دارد. ابتدا آن را تکمیل یا لغو کنید.",
    };
  }

  const { data: result, error } = await supabase
    .from("call_followups")
    .insert({
      ...validation.data,
      tenant_id: tenantId,
      status: 'pending',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating call followup:", error);
    return { error: "خطا در ثبت پیگیری: " + error.message };
  }

  revalidateCallFollowupPaths(data.patient_id);
  return { data: result as CallFollowup, error: null };
}

/**
 * تکمیل پیگیری (ثبت نتیجه مکالمه)
 */
/**
 * تکمیل پیگیری (ثبت نتیجه مکالمه)
 * - اگر نتیجه callback باشد، یک پیگیری جدید pending می‌سازد
 */
export async function completeCallFollowup(
  id: string,
  data: {
    result: CallResult;
    call_notes?: string | null;
    next_followup_date?: string | null;
  }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const tenantId = await getCurrentTenantId();

  if (!user) {
    return { error: "لطفاً وارد حساب کاربری خود شوید." };
  }

  const validation = completeCallFollowupSchema.safeParse(data);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    const firstError =
      Object.values(errors).flat()[0] || "داده‌های وارد شده نامعتبر است";
    return { error: firstError, fieldErrors: errors };
  }

  // بررسی وجود پیگیری
  const { data: existing, error: checkError } = await supabase
    .from("call_followups")
    .select("id, patient_id, status, tenant_id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .single();

  if (checkError || !existing) {
    return { error: "پیگیری یافت نشد یا دسترسی ندارید" };
  }

  if (existing.status === "completed" || existing.status === "cancelled") {
    return { error: "این پیگیری قبلاً بسته شده است." };
  }

  // ✅ مرحله ۱: تکمیل پیگیری فعلی
  const { data: result, error } = await supabase
    .from("call_followups")
    .update({
      status: "completed",
      result: validation.data.result,
      call_notes: validation.data.call_notes || null,
      next_followup_date: validation.data.next_followup_date || null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (error) {
    console.error("Error completing call followup:", error);
    return { error: "خطا در ثبت نتیجه: " + error.message };
  }

  // ✅ مرحله ۲: اگر نتیجه callback باشد، پیگیری جدید pending بساز
  if (
    validation.data.result === "callback" &&
    validation.data.next_followup_date
  ) {
    // ابتدا بررسی کن که patient_id پیگیری قبلی، پیگیری pending نداشته باشد
    // (اگر کاربر قبلاً یکی ساخته، دوباره نساز)
    const { data: existingPending } = await supabase
      .from("call_followups")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("patient_id", existing.patient_id)
      .eq("status", "pending")
      .is("deleted_at", null)
      .maybeSingle();

    if (!existingPending) {
      const { error: insertError } = await supabase
        .from("call_followups")
        .insert({
          tenant_id: tenantId,
          patient_id: existing.patient_id,
          due_date: validation.data.next_followup_date,
          status: "pending",
          notes: "تماس مجدد طبق درخواست بیمار",
          created_by: user.id,
        });

      if (insertError) {
        console.error("Error creating next followup:", insertError);
        // خطا رو نادیده می‌گیریم چون پیگیری اصلی ثبت شده
      }
    }
  }

  revalidateCallFollowupPaths(existing.patient_id);
  return { data: result as CallFollowup, error: null };
}

/**
 * ویرایش پیگیری (تاریخ/یادداشت)
 */
export async function updateCallFollowup(
  id: string,
  data: {
    due_date?: string;
    notes?: string | null;
  }
) {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const validation = updateCallFollowupSchema.safeParse(data);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0] || "داده‌های وارد شده نامعتبر است";
    return { error: firstError, fieldErrors: errors };
  }

  const { data: existing } = await supabase
    .from("call_followups")
    .select("patient_id, status")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .single();

  if (!existing) {
    return { error: "پیگیری یافت نشد یا دسترسی ندارید" };
  }

  const { data: result, error } = await supabase
    .from("call_followups")
    .update(validation.data)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (error) {
    return { error: "خطا در ویرایش پیگیری: " + error.message };
  }

  revalidateCallFollowupPaths(existing.patient_id);
  return { data: result as CallFollowup, error: null };
}

/**
 * لغو پیگیری
 */
export async function cancelCallFollowup(id: string) {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const { data: existing } = await supabase
    .from("call_followups")
    .select("patient_id, status")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .single();

  if (!existing) {
    return { error: "پیگیری یافت نشد یا دسترسی ندارید" };
  }

  if (existing.status !== 'pending' && existing.status !== 'rescheduled') {
    return { error: "این پیگیری قابل لغو نیست." };
  }

  const { data: result, error } = await supabase
    .from("call_followups")
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (error) {
    return { error: "خطا در لغو پیگیری: " + error.message };
  }

  revalidateCallFollowupPaths(existing.patient_id);
  return { data: result as CallFollowup, error: null };
}

/**
 * حذف نرم پیگیری
 */
export async function deleteCallFollowup(id: string) {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const { data: existing } = await supabase
    .from("call_followups")
    .select("patient_id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .single();

  if (!existing) {
    return { error: "پیگیری یافت نشد یا دسترسی ندارید" };
  }

  const { error } = await supabase
    .from("call_followups")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  if (error) {
    return { error: "خطا در حذف پیگیری: " + error.message };
  }

  revalidateCallFollowupPaths(existing.patient_id);
  return { data: { success: true, id }, error: null };
}