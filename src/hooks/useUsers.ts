// src/hooks/useUsers.ts
'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  User,
  UserFormData,
  UserUpdateData,
  UsersListResponse,
  UserLimitInfo,
} from '@/types/user';

// ============================================
// Query Keys
// ============================================
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: () => [...userKeys.lists()] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  limit: () => [...userKeys.all, 'limit'] as const,
};

// ============================================
// 📥 لیست کاربران + محدودیت
// ============================================
export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: async (): Promise<UsersListResponse> => {
      const response = await fetch('/api/users');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت کاربران');
      }

      const result = await response.json();
      return result.data as UsersListResponse;
    },
    staleTime: 2 * 60 * 1000, // ۲ دقیقه
    placeholderData: keepPreviousData,
  });
}

// ============================================
// 📥 یک کاربر
// ============================================
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async (): Promise<User> => {
      const response = await fetch(`/api/users/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت اطلاعات کاربر');
      }

      const result = await response.json();
      return result.data as User;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// 📥 اطلاعات محدودیت (limit)
// ============================================
export function useUserLimit() {
  return useQuery({
    queryKey: userKeys.limit(),
    queryFn: async (): Promise<UserLimitInfo> => {
      const response = await fetch('/api/users');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت محدودیت کاربران');
      }
      const result = await response.json();
      return (result.data as UsersListResponse).limit;
    },
    staleTime: 30 * 1000, // ۳۰ ثانیه (چون ممکنه سریع تغییر کنه)
  });
}

// ============================================
// ➕ ایجاد کاربر جدید
// ============================================
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UserFormData): Promise<User> => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        // پرتاب خطا با اطلاعات limit
        const err: any = new Error(error.error || 'خطا در ایجاد کاربر');
        err.code = error.code;
        err.limit = error.limit;
        throw err;
      }

      const result = await response.json();
      return result.data as User;
    },
    onSuccess: (data) => {
      // invalidate لیست + limit
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.limit() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      toast.success(
        `کاربر «${data.full_name || data.email}» با موفقیت اضافه شد.`
      );
    },
    onError: (error: Error & { code?: string; limit?: { current: number; max: number } }) => {
      if (error.code === 'USER_LIMIT_REACHED') {
        toast.error(error.message, {
          duration: 6000,
          description: error.limit
            ? `${error.limit.current} از ${error.limit.max} کاربر استفاده شده`
            : undefined,
        });
      } else {
        toast.error(error.message || 'خطا در ایجاد کاربر');
      }
    },
  });
}

// ============================================
// ✏️ ویرایش کاربر
// ============================================
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: UserUpdateData & { id: string }): Promise<User> => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در ویرایش کاربر');
      }

      const result = await response.json();
      return result.data as User;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.limit() });

      toast.success('کاربر با موفقیت ویرایش شد.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در ویرایش کاربر');
    },
  });
}

// ============================================
// 🗑️ غیرفعال‌سازی کاربر (soft delete)
// ============================================
export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<User> => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در غیرفعال‌سازی کاربر');
      }

      const result = await response.json();
      return result.data as User;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.limit() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      toast.success(
        `کاربر «${data.full_name || 'بدون نام'}» غیرفعال شد.`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در غیرفعال‌سازی کاربر');
    },
  });
}

// ============================================
// 🔄 فعال‌سازی مجدد کاربر 
// ============================================
export function useReactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<User> => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در فعال‌سازی کاربر');
      }

      const result = await response.json();
      return result.data as User;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.limit() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      toast.success(
        `کاربر «${data.full_name || 'بدون نام'}» با موفقیت فعال شد.`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در فعال‌سازی کاربر');
    },
  });
}
// ============================================
// 🔑 تغییر رمز عبور کاربر (توسط ادمین)
// ============================================
export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      password,
    }: {
      id: string;
      password: string;
    }): Promise<void> => {
      const response = await fetch(`/api/users/${id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در تغییر رمز عبور');
      }
    },
    onSuccess: () => {
      toast.success('رمز عبور با موفقیت تغییر کرد');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در تغییر رمز عبور');
    },
  });
}