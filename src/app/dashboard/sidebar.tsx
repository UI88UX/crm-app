"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCog,
  ShoppingBag,
  Calendar,
  FileText,
  LogOut,
} from "lucide-react";
import { logout } from "@/src/lib/supabase/actions";

const menuItems = [
  {
    title: "داشبورد",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  // در فایل منوی ناوبری، زیر آیتم "بیماران" زیرمنو اضافه کنید:
  {
    title: "بیماران",
    href: "/dashboard/patients",
    icon: Users,
    items: [
      {
        title: "لیست بیماران",
        href: "/dashboard/patients",
      },
      {
        title: "ثبت بیمار جدید",
        href: "/dashboard/patients/new",
      },
    ]
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
];

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="fixed right-0 top-0 w-64 bg-gray-900 text-white h-screen flex flex-col p-4 z-50">
      {/* لوگو */}
      <div className="mb-8 pt-4">
        <h1 className="text-xl font-bold text-center">CRM شنوایی‌سنجی</h1>
        <p className="text-xs text-gray-400 text-center mt-1">مدیریت مطب</p>
      </div>

      {/* منو */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>
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
    </aside>
  );
}