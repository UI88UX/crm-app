// src/app/admin/(protected)/tenants/[id]/users/page.tsx
import { TenantHeader } from "@/components/admin/TenantHeader";
import { TenantTabs } from "@/components/admin/TenantTabs";
import { TenantUserLimit } from "@/components/admin/TenantUserLimit";
import { TenantUsersTable } from "@/components/admin/TenantUsersTable";
import { AddUserToTenantDialog } from "@/components/admin/AddUserToTenantDialog";
import { getTenant, getTenantUsers } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function TenantUsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const [{ data: tenant, error: tenantError }, { data: users }] =
    await Promise.all([getTenant(id), getTenantUsers(id)]);

  if (tenantError || !tenant) notFound();

  const usersCount = users?.length ?? 0;
  const isFull = usersCount >= 5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <TenantHeader tenant={tenant} />

      {/* Tabs */}
      <TenantTabs tenantId={id} />

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">کاربران مطب</h2>
          <p className="text-sm text-muted-foreground">
            مدیریت اعضای این مطب (حداکثر ۵ نفر)
          </p>
        </div>
        <AddUserToTenantDialog tenantId={id} disabled={isFull} />
      </div>

      {/* User Limit Bar */}
      <TenantUserLimit current={usersCount} max={5} />

      {/* Users Table */}
      <TenantUsersTable
        tenantId={id}
        users={users ?? []}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}