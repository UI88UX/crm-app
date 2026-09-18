// src/components/users/ConfirmUserActionDialog.tsx
'use client';

import { AlertTriangle, CheckCircle2, Loader2, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { User } from '@/types/user';
import { cn } from '@/lib/utils';

type ActionType = 'activate' | 'deactivate';

interface ConfirmUserActionDialogProps {
  user: User | null;
  action: ActionType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
}

function UserAvatar({ user }: { user: User }) {
  const initial = (user.full_name || user.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase();

  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
  ];
  const colorIndex = (user.id?.charCodeAt(0) || 0) % colors.length;

  return (
    <div
      className={cn(
        'h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0',
        colors[colorIndex]
      )}
    >
      {initial}
    </div>
  );
}

export function ConfirmUserActionDialog({
  user,
  action,
  open,
  onOpenChange,
  onConfirm,
  loading,
}: ConfirmUserActionDialogProps) {
  if (!user) return null;

  const isActivate = action === 'activate';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            {isActivate ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                فعال‌سازی کاربر
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-red-600" />
                غیرفعال‌سازی کاربر
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-right">
            {isActivate
              ? 'کاربر می‌تواند مجدداً وارد سیستم شود.'
              : 'کاربر دیگر نمی‌تواند وارد سیستم شود، ولی اطلاعاتش حفظ می‌شود.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <UserAvatar user={user} />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.full_name || 'بدون نام'}</p>
            <p className="text-xs text-muted-foreground truncate" dir="ltr">
              {user.email}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            انصراف
          </Button>
          <Button
            variant={isActivate ? 'default' : 'destructive'}
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              isActivate &&
                'bg-green-600 hover:bg-green-700 text-white'
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                در حال پردازش...
              </>
            ) : isActivate ? (
              <>
                <CheckCircle2 className="h-4 w-4 ml-2" />
                فعال‌سازی
              </>
            ) : (
              <>
                <UserX className="h-4 w-4 ml-2" />
                غیرفعال‌سازی
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}