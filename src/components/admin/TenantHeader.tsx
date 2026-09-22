// src/components/admin/tenant/TenantHeader.tsx
import Link from "next/link";
import { ArrowRight, Building2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TenantHeaderProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    is_active: boolean | null;
    license_key?: string | null;
    email?: string | null;
  };
}

export function TenantHeader({ tenant }: TenantHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/admin/tenants"
          className="hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          مطب‌ها
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{tenant.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                {tenant.name}
              </h1>
              <Badge
                variant={tenant.is_active ? "default" : "outline"}
                className={
                  tenant.is_active
                    ? "bg-emerald-500 hover:bg-emerald-500"
                    : "bg-gray-100 text-gray-500"
                }
              >
                {tenant.is_active ? "فعال" : "غیرفعال"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground" dir="ltr">
              /{tenant.slug}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}