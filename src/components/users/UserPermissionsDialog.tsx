// src/components/users/UserPermissionsDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  ShieldCheck,
  Trash2,
  MessageSquare,
  BarChart3,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateUser } from '@/hooks/useUsers';
import type { User } from '@/types/user';
import type { UserPermissions } from '@/lib/auth/permissions';
import {
  DEFAULT_USER_PERMISSIONS,
  ADMIN_PERMISSIONS,
  PERMISSION_LABELS,
} from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';

interface UserPermissionsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PERMISSION_ICONS: Record<keyof UserPermissions, React.ElementType> = {
  can_delete: Trash2,
  can_manage_sms: MessageSquare,
  can_view_reports: BarChart3,
};

export function UserPermissionsDialog({
  user,
  open,
  onOpenChange,
}: UserPermissionsDialogProps) {
  const updateUser = useUpdateUser();
  const [permissions, setPermissions] = useState<UserPermissions>({
    ...DEFAULT_USER_PERMISSIONS,
  });

  // Sync با user وقتی dialog باز می‌شه
  useEffect(() => {
    if (user && open) {
      setPermissions({
        ...DEFAULT_USER_PERMISSIONS,
        ...(user.permissions || {}),
      });
    }
  }, [user, open]);

  if (!user) return null;

  const isAdminRole = user.role === 'admin';

  const handleSave = async () => {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        permissions: isAdminRole ? ADMIN_PERMISSIONS : permissions,
      });
      onOpenChange(false);
    } catch {
      // toast خودش نمایش داده می‌شه
    }
  };

  // بررسی تغییرات
  const hasChanges =
    !isAdminRole &&
    (permissions.can_delete !== (user.permissions?.can_delete ?? true) ||
      permissions.can_manage_sms !== (user.permissions?.can_manage_sms ?? true) ||
      permissions.can_view_reports !== (user.permissions?.can_view_reports ?? true));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            ویرایش دسترسی‌های کاربر
          </DialogTitle>
          <DialogDescription className="text-right">
            تعیین کنید این کاربر به چه بخش‌هایی دسترسی داشته باشد.
          </DialogDescription>
        </DialogHeader>

        {/* User info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold">
              {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.full_name || 'بدون نام'}</p>
            <p className="text-xs text-muted-foreground truncate" dir="ltr">
              {user.email}
            </p>
          </div>
        </div>

        {/* Permissions */}
        <div className="space-y-2">
          {isAdminRole && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 p-3">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                این کاربر «مدیر» است و به همه بخش‌های سیستم دسترسی دارد.
              </p>
            </div>
          )}

          {(Object.keys(PERMISSION_LABELS) as (keyof UserPermissions)[]).map(
            (key) => {
              const config = PERMISSION_LABELS[key];
              const Icon = PERMISSION_ICONS[key];
              const isChecked = isAdminRole ? true : permissions[key];

              return (
                <label
                  key={key}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                    isChecked
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-muted/30 border-transparent',
                    isAdminRole && 'opacity-70 cursor-not-allowed'
                  )}
                >
                  <Checkbox
                    checked={isChecked}
                    disabled={isAdminRole || updateUser.isPending}
                    onCheckedChange={(checked: boolean | 'indeterminate') =>
                      setPermissions({
                        ...permissions,
                        [key]: checked === true,
                      })
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-sm">{config.label}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {config.description}
                    </p>
                  </div>
                </label>
              );
            }
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateUser.isPending}
          >
            انصراف
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateUser.isPending || !hasChanges}
          >
            {updateUser.isPending ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ml-2" />
                ذخیره تغییرات
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}