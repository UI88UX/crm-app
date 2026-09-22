// src/components/users/EditUserDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Save,
  ShieldCheck,
  Trash2,
  MessageSquare,
  BarChart3,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateUser } from '@/hooks/useUsers';
import { USER_ROLES } from '@/types/user';
import type { User, UserRole } from '@/types/user';
import type { UserPermissions } from '@/lib/auth/permissions';
import {
  DEFAULT_USER_PERMISSIONS,
  ADMIN_PERMISSIONS,
  PERMISSION_LABELS,
} from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EditUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}

const PERMISSION_ICONS: Record<keyof UserPermissions, React.ElementType> = {
  can_delete: Trash2,
  can_manage_sms: MessageSquare,
  can_view_reports: BarChart3,
};

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  currentUserId,
}: EditUserDialogProps) {
  const updateUser = useUpdateUser();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [permissions, setPermissions] = useState<UserPermissions>({
    ...DEFAULT_USER_PERMISSIONS,
  });

  // رمز عبور
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [errors, setErrors] = useState<{ full_name?: string; phone?: string; password?: string }>({});

  // Sync با user وقتی dialog باز می‌شه
  useEffect(() => {
    if (user && open) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setRole(user.role);
      setPermissions({
        ...DEFAULT_USER_PERMISSIONS,
        ...(user.permissions || {}),
      });
      setNewPassword('');
      setErrors({});
    }
  }, [user, open]);

  if (!user) return null;

  const isSelf = user.id === currentUserId;
  const isSuperAdmin = user.is_super_admin;
  const isAdminRole = role === 'admin';

  // کاربر عادی و سوپر ادمین قابل ویرایش نقش نیستن (به جز از پنل ادمین)
  const canEditRoleAndPermissions = !isSelf && !isSuperAdmin;

  // ============ تغییر نقش ============
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setPermissions({ ...ADMIN_PERMISSIONS });
    } else {
      setPermissions({ ...DEFAULT_USER_PERMISSIONS });
    }
  };

  // ============ اعتبارسنجی ============
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.full_name = 'نام باید حداقل ۲ کاراکتر باشد';
    }

    if (phone && !/^09\d{9}$/.test(phone)) {
      newErrors.phone = 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد';
    }

    if (newPassword && newPassword.length < 8) {
      newErrors.password = 'رمز عبور باید حداقل ۸ کاراکتر باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============ ذخیره ============
  const handleSave = async () => {
    if (!validate()) return;

    try {
      // ۱. ذخیره مشخصات
      const updateData: any = {
        id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      };

      if (canEditRoleAndPermissions) {
        updateData.role = role;
        updateData.permissions = isAdminRole ? ADMIN_PERMISSIONS : permissions;
      }

      await updateUser.mutateAsync(updateData);

      // ۲. تغییر رمز (اگه پر شده)
      if (newPassword) {
        setPasswordLoading(true);
        const res = await fetch(`/api/users/${user.id}/password`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: newPassword }),
        });

        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || 'خطا در تغییر رمز عبور');
          setPasswordLoading(false);
          return;
        }
        setPasswordLoading(false);
        toast.success('رمز عبور با موفقیت تغییر کرد');
      }

      onOpenChange(false);
    } catch {
      // toast خودش از هوک نشون داده می‌شه
    }
  };

  const isLoading = updateUser.isPending || passwordLoading;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (isLoading) return;
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            ویرایش کاربر
          </DialogTitle>
          <DialogDescription className="text-right" dir="ltr">
            {user.email}
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

        <div className="space-y-4">
          {/* نام */}
          <div className="space-y-2">
            <Label htmlFor="edit-fullname">
              نام و نام خانوادگی <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              className={errors.full_name ? 'border-red-500' : ''}
            />
            {errors.full_name && (
              <p className="text-xs text-red-500">{errors.full_name}</p>
            )}
          </div>

          {/* تلفن */}
          <div className="space-y-2">
            <Label htmlFor="edit-phone">
              شماره موبایل{' '}
              <span className="text-xs text-muted-foreground">(اختیاری)</span>
            </Label>
            <Input
              id="edit-phone"
              dir="ltr"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))
              }
              disabled={isLoading}
              maxLength={11}
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* نقش — فقط اگه مجاز باشه */}
          {canEditRoleAndPermissions && (
            <div className="space-y-2">
              <Label>نقش</Label>
              <Select
                value={role}
                onValueChange={(v) => handleRoleChange(v as UserRole)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex flex-col items-start text-right">
                        <span className="font-medium">{r.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {r.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* دسترسی‌ها — فقط اگه مجاز باشه */}
          {canEditRoleAndPermissions && (
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <Label>دسترسی‌ها</Label>
              </div>

              {isAdminRole && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 p-3">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    مدیران به همه بخش‌ها دسترسی دارند.
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
                        disabled={isAdminRole || isLoading}
                        onCheckedChange={(checked) =>
                          setPermissions({
                            ...permissions,
                            [key]: Boolean(checked),
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
          )}

          {/* تغییر رمز عبور */}
          <div className="space-y-2 pt-3 border-t">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="edit-password">
                تغییر رمز عبور{' '}
                <span className="text-xs text-muted-foreground">
                  (خالی بذار اگه نمی‌خوای عوض کنی)
                </span>
              </Label>
            </div>
            <div className="relative">
              <Input
                id="edit-password"
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                placeholder="حداقل ۸ کاراکتر"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                className={errors.password ? 'border-red-500 pl-10' : 'pl-10'}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            انصراف
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
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