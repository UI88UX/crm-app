import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * کلاینت Supabase با Service Role Key
 * 
 * ⚠️ مهم: این فایل فقط در کد سمت سرور (API Routes, Server Actions, Route Handlers)
 * استفاده شود. هرگز در Client Components import نشود.
 * 
 * کاربردها:
 * - ایجاد کاربر جدید توسط ادمین
 * - مدیریت Tenantها
 * - عملیات مدیریتی که نیاز به دور زدن RLS دارند
 * - بکاپ و بازیابی داده
 * 
 * مثال:
 *   import { createAdminClient } from "@/lib/supabase/admin";
 *   const supabase = createAdminClient();
 *   const { data, error } = await supabase.auth.admin.listUsers();
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY یا NEXT_PUBLIC_SUPABASE_URL در .env.local تنظیم نشده است."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * کلاینت Supabase با Service Role Key برای عملیات مدیریتی
 * این نسخه از cookies استفاده نمیکند و کاملاً stateless است
 * 
 * مناسب برای:
 * - Cron jobs
 * - Backup operations
 * - Bulk operations
 */
export function createAdminClientStateless() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY یا NEXT_PUBLIC_SUPABASE_URL در .env.local تنظیم نشده است."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
  });
}

/**
 * بررسی اینکه آیا کاربر جاری super_admin است یا نه
 * این تابع فقط در سمت سرور استفاده میشود
 */
export async function isSuperAdmin() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // super_admin نیازی به set کردن کوکی ندارد
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  // چک کردن app_metadata برای is_super_admin
  const isSuperAdmin = user.app_metadata?.is_super_admin === true;
  
  return isSuperAdmin;
}

/**
 * دریافت tenant_id کاربر جاری از دیتابیس
 * این تابع فقط در سمت سرور استفاده میشود
 */
export async function getCurrentTenantId() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // فقط خواندن، نیازی به set کردن نیست
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // دریافت tenant_id از جدول users
  const { data, error } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return data.tenant_id;
}

/**
 * تابع کمکی برای لاگ کردن فعالیت‌ها در activity_logs
 * این تابع از Service Role استفاده میکند تا از RLS عبور کند
 */
export async function logActivity({
  tenantId,
  userId,
  action,
  tableName,
  recordId,
  metadata,
}: {
  tenantId: string;
  userId: string;
  action: string;
  tableName: string;
  recordId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("activity_logs").insert({
    tenant_id: tenantId,
    user_id: userId,
    action,
    table_name: tableName,
    record_id: recordId,
    metadata,
  });

  if (error) {
    console.error("Error logging activity:", error);
    // خطا را لاگ کن ولی اجرا را متوقف نکن
  }
}