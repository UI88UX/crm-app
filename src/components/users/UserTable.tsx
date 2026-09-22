// src/components/users/UserTable.tsx
'use client';

import { useState } from 'react';
import {
  User as UserIcon,
  Phone,
  ShieldCheck,
  UserX,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeactivateUser, useReactivateUser } from '@/hooks/useUsers';
import { USER_ROLE_MAP, USER_ROLE_COLORS } from '@/types/user';
import type { User } from '@/types/user';
import { formatJalaliDateIntl } from '@/lib/util/jalaliDate';
import { cn } from '@/lib/utils';
import { ConfirmUserActionDialog } from './ConfirmUserActionDialog';
import { EditUserDialog } from './EditUserDialog';
import { Pencil } from 'lucide-react';

interface UserTableProps {
  users: User[];
  currentUserId?: string;
  loading?: boolean;
}

type ActionType = 'activate' | 'deactivate';
type PendingAction = { user: User; type: ActionType } | null;

// ============================================
// Avatar
// ============================================
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

// ============================================
// Status Badge
// ============================================
function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
        <CheckCircle2 className="h-3 w-3 ml-1" />
        فعال
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
      <XCircle className="h-3 w-3 ml-1" />
      غیرفعال
    </Badge>
  );
}

// ============================================
// Main
// ============================================
export function UserTable({
  users,
  currentUserId,
  loading = false,
}: UserTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const deactivate = useDeactivateUser();
  const reactivate = useReactivateUser();

  const isLoading =
    (pendingAction?.type === 'deactivate' && deactivate.isPending) ||
    (pendingAction?.type === 'activate' && reactivate.isPending);

  const handleConfirm = async () => {
    if (!pendingAction) return;
    try {
      if (pendingAction.type === 'activate') {
        await reactivate.mutateAsync(pendingAction.user.id);
      } else {
        await deactivate.mutateAsync(pendingAction.user.id);
      }
      setPendingAction(null);
    } catch {
      // toast خودش نمایش داده می‌شه
    }
  };

  // ============ Loading ============
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // ============ Empty ============
  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <UserIcon className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">هیچ کاربری ثبت نشده است</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* ============ Desktop Table ============ */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>کاربر</TableHead>
                <TableHead>تماس</TableHead>
                <TableHead>نقش</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تاریخ عضویت</TableHead>
                <TableHead className="text-center">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const isSuperAdmin = user.is_super_admin;
                const isProtected = isSelf || isSuperAdmin;

                return (
                  <TableRow
                    key={user.id}
                    className={cn(!user.is_active && 'opacity-60')}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} />
                        <div className="min-w-0">
                          <p className="font-medium truncate flex items-center gap-2">
                            {user.full_name || 'بدون نام'}
                            {isSelf && (
                              <span className="text-xs text-muted-foreground">
                                (شما)
                              </span>
                            )}
                          </p>
                          <p
                            className="text-xs text-muted-foreground truncate"
                            dir="ltr"
                          >
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {user.phone ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span dir="ltr">{user.phone}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={cn(USER_ROLE_COLORS[user.role])}>
                          {isSuperAdmin && (
                            <ShieldCheck className="h-3 w-3 ml-1" />
                          )}
                          {USER_ROLE_MAP[user.role]?.label || user.role}
                        </Badge>
                        {isSuperAdmin && (
                          <span className="text-xs text-amber-600 font-medium">
                            مدیر کل سیستم
                          </span>
                        )}
                        {/* 🆕 نمایش خلاصه دسترسی */}
                        {user.role === 'user' && user.permissions && (
                          <span className="text-[10px] text-muted-foreground">
                            {Object.values(user.permissions).filter(Boolean).length} از{' '}
                            {Object.keys(user.permissions).length} دسترسی
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusBadge isActive={user.is_active} />
                    </TableCell>

                    <TableCell>
                      <span className="text-sm">
                        {formatJalaliDateIntl(user.created_at, 'long')}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" title="عملیات">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isProtected ? (
                              <DropdownMenuItem
                                disabled
                                className="text-muted-foreground"
                              >
                                {isSelf ? (
                                  <>
                                    <UserIcon className="h-4 w-4 ml-2" />
                                    نمی‌توانید خود را غیرفعال کنید
                                  </>
                                ) : (
                                  <>
                                    <Shield className="h-4 w-4 ml-2" />
                                    مدیر کل قابل غیرفعال‌سازی نیست
                                  </>
                                )}
                              </DropdownMenuItem>
                            ) : !user.is_active ? (
                              <DropdownMenuItem
                                className="text-green-600 focus:text-green-600"
                                onClick={() =>
                                  setPendingAction({ user, type: 'activate' })
                                }
                              >
                                <CheckCircle2 className="h-4 w-4 ml-2" />
                                فعال‌سازی مجدد
                              </DropdownMenuItem>
                            ) : (
                              <>
                                {user.role === 'user' && (
                                  <DropdownMenuItem
                                    onClick={() => setEditingUser(user)}
                                  >
                                    <Pencil className="h-4 w-4 ml-2" />
                                    ویرایش کاربر
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() =>
                                    setPendingAction({
                                      user,
                                      type: 'deactivate',
                                    })
                                  }
                                >
                                  <UserX className="h-4 w-4 ml-2" />
                                  غیرفعال‌سازی کاربر
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ============ Mobile Cards ============ */}
      <div className="md:hidden space-y-3">
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          const isSuperAdmin = user.is_super_admin;
          const isProtected = isSelf || isSuperAdmin;

          return (
            <Card
              key={user.id}
              className={cn(!user.is_active && 'opacity-60')}
            >
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <UserAvatar user={user} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">
                        {user.full_name || 'بدون نام'}
                      </p>
                      {isSelf && (
                        <span className="text-xs text-muted-foreground">
                          (شما)
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs text-muted-foreground truncate"
                      dir="ltr"
                    >
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn(USER_ROLE_COLORS[user.role])}>
                    {isSuperAdmin && (
                      <ShieldCheck className="h-3 w-3 ml-1" />
                    )}
                    {USER_ROLE_MAP[user.role]?.label || user.role}
                  </Badge>
                  <StatusBadge isActive={user.is_active} />
                </div>

                {/* 🆕 خلاصه دسترسی (موبایل) */}
                {user.role === 'user' && user.permissions && (
                  <p className="text-[10px] text-muted-foreground">
                    {Object.values(user.permissions).filter(Boolean).length} از{' '}
                    {Object.keys(user.permissions).length} دسترسی
                  </p>
                )}

                {/* Details */}
                <div className="space-y-1 text-xs text-muted-foreground border-t pt-3">
                  {user.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span dir="ltr">{user.phone}</span>
                    </div>
                  )}
                  <div>
                    عضویت: {formatJalaliDateIntl(user.created_at, 'long')}
                  </div>
                </div>

                {/* Actions */}
                {isProtected ? (
                  <div className="text-xs text-muted-foreground text-center py-2 border-t">
                    {isSelf
                      ? 'نمی‌توانید خود را غیرفعال کنید'
                      : 'مدیر کل قابل غیرفعال‌سازی نیست'}
                  </div>
                ) : !user.is_active ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/40 border-green-200"
                    onClick={() =>
                      setPendingAction({ user, type: 'activate' })
                    }
                  >
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                    فعال‌سازی مجدد
                  </Button>
                ) : user.role === 'user' ? (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setEditingUser(user)}
                    >
                      <ShieldCheck className="h-4 w-4 ml-2" />
                      ویرایش کاربر
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200"
                      onClick={() =>
                        setPendingAction({ user, type: 'deactivate' })
                      }
                    >
                      <UserX className="h-4 w-4 ml-2" />
                      غیرفعال‌سازی
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200"
                    onClick={() =>
                      setPendingAction({ user, type: 'deactivate' })
                    }
                  >
                    <UserX className="h-4 w-4 ml-2" />
                    غیرفعال‌سازی
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ============ Confirm Dialog ============ */}
      <ConfirmUserActionDialog
        user={pendingAction?.user || null}
        action={pendingAction?.type || 'deactivate'}
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
        onConfirm={handleConfirm}
        loading={isLoading}
      />

      {/* Dialog ویرایش کاربر */}
      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        currentUserId={currentUserId}
      />
    </>
  );
}