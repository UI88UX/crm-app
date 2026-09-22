// src/components/admin/tenant/TenantUsersTable.tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Mail,
  UserCircle,
  Calendar,
  UserMinus,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { removeUserFromTenant } from "@/lib/supabase/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface TenantUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string;
  specialty: string;
  is_active: boolean;
  is_super_admin: boolean;
  created_at: string;
}

interface TenantUsersTableProps {
  tenantId: string;
  users: TenantUser[];
  currentUserId?: string;
}

export function TenantUsersTable({
  tenantId,
  users,
  currentUserId,
}: TenantUsersTableProps) {
  const [userToRemove, setUserToRemove] = useState<TenantUser | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await removeUserFromTenant(userId, tenantId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("کاربر از مطب حذف شد.");
      queryClient.invalidateQueries({
        queryKey: ["tenant-users", tenantId],
      });
      queryClient.invalidateQueries({ queryKey: ["unassigned-users"] });
      setUserToRemove(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "خطا در حذف کاربر");
    },
  });

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg">
        <Users className="h-12 w-12 text-gray-300 mb-3" />
        <h3 className="font-semibold mb-1">هنوز کاربری وجود ندارد</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          اولین کاربر را با دکمه «افزودن کاربر» به این مطب اضافه کنید.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="text-right text-xs font-medium text-gray-500 uppercase">
                  کاربر
                </TableHead>
                <TableHead className="text-right text-xs font-medium text-gray-500 uppercase">
                  ایمیل
                </TableHead>
                <TableHead className="text-right text-xs font-medium text-gray-500 uppercase">
                  نقش
                </TableHead>
                <TableHead className="text-right text-xs font-medium text-gray-500 uppercase">
                  وضعیت
                </TableHead>
                <TableHead className="text-right text-xs font-medium text-gray-500 uppercase">
                  تاریخ ثبت
                </TableHead>
                <TableHead className="text-right text-xs font-medium text-gray-500 uppercase w-[80px]">
                  {/* خالی برای دکمه */}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <TableRow
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <UserCircle className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {user.full_name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {user.specialty || "بدون تخصص"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                        <span className="text-gray-700 text-sm" dir="ltr">
                          {user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_super_admin ? (
                        <Badge
                          variant="destructive"
                          className="bg-amber-500 hover:bg-amber-500 gap-1"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          مدیرکل
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                        >
                          {user.role === "admin"
                            ? "مدیر"
                            : user.role === "audiologist"
                            ? "شنوایی‌شناس"
                            : user.role === "receptionist"
                            ? "منشی"
                            : "کاربر"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.is_active ? "default" : "outline"}
                        className={
                          user.is_active
                            ? "bg-emerald-500 hover:bg-emerald-500"
                            : "bg-gray-100 text-gray-500"
                        }
                      >
                        {user.is_active ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.created_at).toLocaleDateString("fa-IR")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setUserToRemove(user)}
                        disabled={isSelf}
                        title={isSelf ? "نمی‌توانید خودتان را حذف کنید" : "حذف از مطب"}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* دیالوگ تایید حذف */}
      <Dialog
        open={!!userToRemove}
        onOpenChange={(o) => !o && setUserToRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف کاربر از مطب</DialogTitle>
            <DialogDescription>
              آیا از حذف «{userToRemove?.full_name}» از این مطب مطمئن هستید؟
              کاربر به لیست کاربران بدون مطب منتقل می‌شود و می‌توانید
              بعداً او را به مطب دیگری اضافه کنید.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserToRemove(null)}
              disabled={mutation.isPending}
            >
              لغو
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                userToRemove && mutation.mutate(userToRemove.id)
              }
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  در حال حذف...
                </>
              ) : (
                <>
                  <UserMinus className="h-4 w-4 ml-2" />
                  حذف از مطب
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}