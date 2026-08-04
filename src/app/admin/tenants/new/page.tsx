// app/admin/tenants/new/page.tsx
import { TenantForm } from "@/components/admin/TenantForm";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function NewTenantPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

//   const isSuperAdmin = user.app_metadata?.is_super_admin === true;
//   if (!isSuperAdmin) {
//     redirect("/dashboard");
//   }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">افزودن مطب جدید</h1>
        <p className="text-muted-foreground">
          اطلاعات مطب جدید را وارد کنید
        </p>
      </div>

      <TenantForm />
    </div>
  );
}