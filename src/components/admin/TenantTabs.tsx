// src/components/admin/tenant/TenantTabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface TenantTabsProps {
  tenantId: string;
}

const tabs = [
  {
    label: "تنظیمات",
    href: (id: string) => `/admin/tenants/${id}`,
    icon: Settings,
    match: (pathname: string, id: string) =>
      pathname === `/admin/tenants/${id}`,
  },
  {
    label: "کاربران",
    href: (id: string) => `/admin/tenants/${id}/users`,
    icon: Users,
    match: (pathname: string, id: string) =>
      pathname.startsWith(`/admin/tenants/${id}/users`),
  },
];

export function TenantTabs({ tenantId }: TenantTabsProps) {
  const pathname = usePathname();

  return (
    <div className="border-b">
      <nav className="flex items-center gap-1 -mb-px" role="tablist">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.match(pathname, tenantId);
          return (
            <Link
              key={tab.label}
              href={tab.href(tenantId)}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}