// src/components/users/UserForm.tsx
'use client';

import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
  ShieldCheck,
  Trash2,
  MessageSquare,
  BarChart3,
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
import { useCreateUser } from '@/hooks/useUsers';
import { USER_ROLES } from '@/types/user';
import type { UserRole } from '@/types/user';
import type { UserPermissions } from '@/lib/auth/permissions';
import {
  DEFAULT_USER_PERMISSIONS,
  ADMIN_PERMISSIONS,
  PERMISSION_LABELS,
} from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  full_name?: string;
  phone?: string;
  role?: string;
}

// آیکون برای هر permission
const PERMISSION_ICONS: Record<keyof UserPermissions, React.ElementType> = {
  can_delete: Trash2,
  can_manage_sms: MessageSquare,
  can_view_reports: BarChart3,
};

export function UserForm({ open, onOpenChange, disabled = false }: UserFormProps) {
  const createUser = useCreateUser();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'user' as UserRole,
  });

  const [permissions, setPermissions] = useState<UserPermissions>({
    ...DEFAULT_USER_PERMISSIONS,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  // ============ Reset Form ============
  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      role: 'user',
    });
    setPermissions({ ...DEFAULT_USER_PERMISSIONS });
    setErrors({});
    setShowPassword(false);
  };

  // ============ Role Change ============
  const handleRoleChange = (newRole: UserRole) => {
    setFormData({ ...formData, role: newRole });

    // اگه admin شد، همه permissions true
    if (newRole === 'admin') {
      setPermissions({ ...ADMIN_PERMISSIONS });
    } else {
      setPermissions({ ...DEFAULT_USER_PERMISSIONS });
    }
  };

  // ============ Validation ============
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'ایمیل الزامی است';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'فرمت ایمیل نامعتبر است';
    }

    if (!formData.password) {
      newErrors.password = 'رمز عبور الزامی است';
    } else if (formData.password.length < 8) {
      newErrors.password = 'رمز عبور باید حداقل ۸ کاراکتر باشد';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'نام الزامی است';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'نام باید حداقل ۲ کاراکتر باشد';
    }

    if (formData.phone && !/^09\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============ Submit ============
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await createUser.mutateAsync({
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        role: formData.role,
        permissions: formData.role === 'admin' ? ADMIN_PERMISSIONS : permissions,
      });

      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      if (err.fieldErrors) {
        setErrors(err.fieldErrors);
      }
    }
  };

  // ============ Cancel ============
  const handleCancel = () => {
    if (createUser.isPending) return;
    resetForm();
    onOpenChange(false);
  };

  const isAdminRole = formData.role === 'admin';

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (createUser.isPending) return;
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent
        className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <UserPlus className="h-5 w-5" />
            افزودن کاربر جدید
          </DialogTitle>
          <DialogDescription className="text-right">
            کاربر جدید با ایمیل و رمز عبور وارد سیستم می‌شود.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="user-email">
              ایمیل <span className="text-red-500">*</span>
            </Label>
            <Input
              id="user-email"
              type="email"
              dir="ltr"
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={createUser.isPending || disabled}
              className={errors.email ? 'border-red-500' : ''}
              autoComplete="off"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="user-password">
              رمز عبور <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="user-password"
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                placeholder="حداقل ۸ کاراکتر"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                disabled={createUser.isPending || disabled}
                className={errors.password ? 'border-red-500 pl-10' : 'pl-10'}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showPassword ? 'پنهان کردن رمز' : 'نمایش رمز'}
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

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="user-fullname">
              نام و نام خانوادگی <span className="text-red-500">*</span>
            </Label>
            <Input
              id="user-fullname"
              type="text"
              placeholder="مثال: علی رضایی"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              disabled={createUser.isPending || disabled}
              className={errors.full_name ? 'border-red-500' : ''}
            />
            {errors.full_name && (
              <p className="text-xs text-red-500">{errors.full_name}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="user-phone">
              شماره موبایل{' '}
              <span className="text-xs text-muted-foreground">(اختیاری)</span>
            </Label>
            <Input
              id="user-phone"
              type="tel"
              dir="ltr"
              placeholder="09xxxxxxxxx"
              value={formData.phone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  phone: e.target.value.replace(/\D/g, '').slice(0, 11),
                })
              }
              disabled={createUser.isPending || disabled}
              className={errors.phone ? 'border-red-500' : ''}
              maxLength={11}
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="user-role">
              نقش <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(v) => handleRoleChange(v as UserRole)}
              disabled={createUser.isPending || disabled}
            >
              <SelectTrigger id="user-role">
                <SelectValue placeholder="انتخاب نقش" />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex flex-col items-start text-right">
                      <span className="font-medium">{role.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {role.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Permissions */}
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <Label>دسترسی‌ها</Label>
            </div>

            {/* Admin message */}
            {isAdminRole && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 p-3">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  مدیران به همه بخش‌های سیستم دسترسی دارند و این دسترسی‌ها قابل تغییر نیستند.
                </p>
              </div>
            )}

            <div className="space-y-2">
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
                        disabled={isAdminRole || createUser.isPending || disabled}
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

            <p className="text-xs text-muted-foreground">
              <span className="text-red-500">*</span> دسترسی «مدیریت کاربران» فقط برای نقش مدیر فعال است.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={createUser.isPending}
            >
              انصراف
            </Button>
            <Button type="submit" disabled={createUser.isPending || disabled}>
              {createUser.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  در حال ایجاد...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 ml-2" />
                  ایجاد کاربر
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}