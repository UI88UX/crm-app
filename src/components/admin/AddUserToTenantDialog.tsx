// src/components/admin/tenant/AddUserToTenantDialog.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTenantUser } from "@/lib/supabase/actions";
import { toast } from "sonner";

const userSchema = z.object({
  full_name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
  email: z.string().email("ایمیل نامعتبر است"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
  role: z.enum(["admin", "audiologist", "receptionist", "user"]),
  phone: z.string().optional(),
  specialty: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface AddUserToTenantDialogProps {
  tenantId: string;
  disabled?: boolean;
}

export function AddUserToTenantDialog({
  tenantId,
  disabled,
}: AddUserToTenantDialogProps) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      role: "user",
      phone: "",
      specialty: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const result = await createTenantUser(tenantId, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("کاربر با موفقیت ساخته و به مطب اضافه شد.");
      queryClient.invalidateQueries({
        queryKey: ["tenant-users", tenantId],
      });
      form.reset();
      setOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "خطا در ساخت کاربر");
    },
  });

  const onSubmit = (data: UserFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!mutation.isPending) {
          setOpen(o);
          if (!o) form.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled} className="gap-2">
          <UserPlus className="h-4 w-4" />
          افزودن کاربر جدید
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>افزودن کاربر جدید</DialogTitle>
          <DialogDescription>
            کاربر جدید در سیستم ساخته شده و به این مطب متصل می‌شود.
            اطلاعات ورود را به کاربر تحویل دهید.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* نام کامل */}
          <div className="space-y-2">
            <Label htmlFor="full_name">نام و نام خانوادگی *</Label>
            <Input
              id="full_name"
              {...form.register("full_name")}
              placeholder="مثال: دکتر احمد رضایی"
              disabled={mutation.isPending}
            />
            {form.formState.errors.full_name && (
              <p className="text-xs text-red-500">
                {form.formState.errors.full_name.message}
              </p>
            )}
          </div>

          {/* ایمیل */}
          <div className="space-y-2">
            <Label htmlFor="email">ایمیل (نام کاربری) *</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              {...form.register("email")}
              placeholder="user@example.com"
              disabled={mutation.isPending}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-500">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* رمز عبور */}
          <div className="space-y-2">
            <Label htmlFor="password">رمز عبور موقت *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                dir="ltr"
                {...form.register("password")}
                placeholder="حداقل ۶ کاراکتر"
                disabled={mutation.isPending}
                className="pl-10"
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
            {form.formState.errors.password && (
              <p className="text-xs text-red-500">
                {form.formState.errors.password.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              این رمز را به کاربر تحویل دهید. کاربر می‌تواند بعداً تغییرش بدهد.
            </p>
          </div>

          {/* نقش */}
          <div className="space-y-2">
            <Label htmlFor="role">نقش *</Label>
            <Select
              value={form.watch("role")}
              onValueChange={(v) =>
                form.setValue("role", v as UserFormData["role"])
              }
              disabled={mutation.isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">مدیر مطب</SelectItem>
                <SelectItem value="audiologist">شنوایی‌شناس</SelectItem>
                <SelectItem value="receptionist">منشی</SelectItem>
                <SelectItem value="user">کاربر عادی</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* تلفن (اختیاری) */}
          <div className="space-y-2">
            <Label htmlFor="phone">شماره تلفن (اختیاری)</Label>
            <Input
              id="phone"
              dir="ltr"
              {...form.register("phone")}
              placeholder="09123456789"
              disabled={mutation.isPending}
            />
          </div>

          {/* تخصص (اختیاری) */}
          <div className="space-y-2">
            <Label htmlFor="specialty">تخصص (اختیاری)</Label>
            <Input
              id="specialty"
              {...form.register("specialty")}
              placeholder="مثال: شنوایی‌سنجی"
              disabled={mutation.isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              لغو
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  در حال ساخت...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 ml-2" />
                  ساخت کاربر
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}