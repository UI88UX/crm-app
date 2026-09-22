// src/app/admin/(protected)/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { createAdminClientStateless } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  BarChart3,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

interface AdminProtectedLayoutProps {
  children: ReactNode;
}

export default async function AdminProtectedLayout({
  children,
}: AdminProtectedLayoutProps) {
  const supabase = await createClient();

  // ۱. چک احراز هویت
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  // ۲. چک is_super_admin
  const supabaseAdmin = createAdminClientStateless();

  const { data: userData, error: userDataError } = await supabaseAdmin
    .from("users")
    .select("is_super_admin, is_active, role, full_name")
    .eq("id", user.id)
    .single();

  if (userDataError || !userData) {
    redirect("/admin/login");
  }

  if (!userData.is_active) {
    redirect("/admin/login?error=session_expired");
  }

  if (!userData.is_super_admin) {
    redirect("/admin/login?error=not_super_admin");
  }

  const sidebarItems = [
    { title: "مدیریت مطب‌ها", href: "/admin/tenants", icon: Building2 },
    { title: "کاربران", href: "/admin/users", icon: Users },
    { title: "آمار کلی", href: "/admin/stats", icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30" dir="rtl">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-gray-900 text-white p-4 shrink-0">
        <div className="mb-8 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold">پنل مدیریت</h1>
              <p className="text-[10px] text-gray-400">
                {userData.full_name || "مدیر سیستم"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>

        <div className="space-y-2 mt-4 pt-4 border-t border-gray-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-xs"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>داشبورد مطب</span>
          </Link>
          <AdminLogoutButton />
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 right-0 left-0 z-40 bg-gray-900 text-white h-14 flex items-center justify-between px-4 shadow-md">
        <Link
          href="/admin/tenants"
          className="text-sm font-bold flex items-center gap-2"
        >
          <ShieldCheck className="h-4 w-4 text-amber-400" />
          پنل مدیریت
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            داشبورد
          </Link>
          <AdminLogoutButton compact />
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 min-h-screen overflow-auto p-4 md:p-6 pt-20 lg:pt-6">
        {children}
      </main>
    </div>
  );
}