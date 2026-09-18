// src/app/dashboard/sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  BarChart3,
  Settings,
  LayoutDashboard,
  Users,
  UserCog,
  ShoppingBag,
  Calendar,
  LogOut,
  Phone,
  Menu,
  X,
} from "lucide-react";
import { logout } from "@/src/lib/supabase/actions";
import { CallFollowupBell } from "@/components/call-followups/CallFollowupBell";
import { cn } from "@/lib/utils";
import { LoadingLink } from "@/components/ui/loading-link";
import { useCurrentPermissions } from "@/hooks/useCurrentPermissions";
import { canAccessRoute } from "@/lib/auth/permissions";

const menuItems = [
  {
    title: "داشبورد",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "بیماران",
    href: "/dashboard/patients",
    icon: Users,
  },
  {
    title: "مدیریت کاربران",
    href: "/dashboard/users",
    icon: UserCog,
  },
  {
    title: "فروش",
    href: "/dashboard/sales",
    icon: ShoppingBag,
  },
  {
    title: "نوبت‌ها",
    href: "/dashboard/appointments",
    icon: Calendar,
  },
  {
    title: "پیگیری‌های تلفنی",
    href: "/dashboard/call-followups",
    icon: Phone,
  },
  {
    title: "پیامک‌ها",
    href: "/dashboard/sms/campaigns",
    icon: MessageSquare,
  },
  {
    title: "گزارش‌های پیامکی",
    href: "/dashboard/sms/reports",
    icon: BarChart3,
  },
  {
    title: "تنظیمات پیامک",
    href: "/dashboard/sms/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: perms } = useCurrentPermissions();

  // ✅ فیلتر کردن منوها بر اساس دسترسی
  const visibleMenuItems = menuItems.filter((item) => {
    if (!perms) return false; // تا وقتی perms لود نشده، هیچی نشون نده
    return canAccessRoute(
      item.href,
      perms.role,
      perms.permissions
    );
  });

  // ✅ بستن خودکار در تغییر مسیر (در موبایل)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // ✅ جلوگیری از اسکرول پشت overlay در موبایل
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    // ۱. پاک کردن cache
    queryClient.clear();
    // ۲. logout
    await logout();
  };

  // محتوای مشترک sidebar
  const sidebarContent = (
    <>
      {/* لوگو + دکمه بستن در موبایل */}
      <div className="mb-6 pt-4 flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-center">CRM شنوایی‌سنجی</h1>
          <p className="text-xs text-gray-400 text-center mt-1">مدیریت مطب</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          data-loading="false"
          className="lg:hidden p-2 text-gray-400 hover:text-white"
          aria-label="بستن منو"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Bell پیگیری تلفنی */}
      <div className="mb-4 flex justify-center">
        <div className="bg-gray-800 rounded-lg p-2 w-full flex items-center justify-between px-4">
          <span className="text-sm text-gray-300">پیگیری‌ها</span>
          <CallFollowupBell />
        </div>
      </div>

      {/* منو */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <LoadingLink
              key={item.href}
              href={item.href}
              isActive={isActive}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white"
              activeClassName="bg-blue-600 text-white hover:bg-blue-600"
              spinnerClassName="mr-auto"
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.title}</span>
            </LoadingLink>
          );
        })}
      </nav>

      {/* خروج */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-red-900/50 hover:text-white transition-colors w-full mt-auto"
      >
        <LogOut className="w-5 h-5" />
        <span>خروج</span>
      </button>
    </>
  );

  return (
    <>
      {/* Header موبایل */}
      <header className="lg:hidden fixed top-0 right-0 left-0 z-30 bg-gray-900 text-white h-14 flex items-center justify-between px-4 shadow-md">
        <button
          onClick={() => setIsOpen(true)}
          data-loading="false"
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="باز کردن منو"
        >
          <Menu className="w-6 h-6" />
        </button>

        <h1 className="text-base font-bold">CRM شنوایی‌سنجی</h1>

        <div className="flex items-center">
          <CallFollowupBell />
        </div>
      </header>

      {/* Overlay در موبایل */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed right-0 top-0 w-64 bg-gray-900 text-white h-screen flex flex-col p-4 z-50 transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}