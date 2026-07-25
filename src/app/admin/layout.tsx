// app/admin/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient();
  
  // گرفتن کاربر جاری
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect("/login");
  }

  // چک کردن is_super_admin در app_metadata
  const isSuperAdmin = user.app_metadata?.is_super_admin === true;
  
  if (!isSuperAdmin) {
    // اگر super_admin نیست، به داشبورد برگردانده شود
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar مخصوص ادمین (اختیاری، می‌توانید از همان Sidebar اصلی استفاده کنید) */}
      <aside className="w-64 bg-white border-l border-gray-200 min-h-screen p-4">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800">پنل مدیریت</h2>
          <p className="text-sm text-gray-500">تنها مدیرکل</p>
        </div>
        <nav className="space-y-2">
          <a
            href="/admin/tenants"
            className="block px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            🏢 مدیریت مطب‌ها
          </a>
          <a
            href="/admin/users"
            className="block px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            👥 کاربران
          </a>
          <a
            href="/admin/stats"
            className="block px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            📊 آمار کلی
          </a>
        </nav>
        <div className="mt-8 pt-4 border-t border-gray-200">
          <a
            href="/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-600"
          >
            ← بازگشت به داشبورد
          </a>
        </div>
      </aside>
      <main className="flex-1 min-h-screen overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}