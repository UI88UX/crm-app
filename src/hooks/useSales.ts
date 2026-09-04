'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Sale, SaleFormData } from '@/types';

// 🔑 کلیدهای Query
export const saleKeys = {
  all: ['sales'] as const,
  lists: () => [...saleKeys.all, 'list'] as const,
  list: (filters?: { patient_id?: string; search?: string }) =>
    [...saleKeys.lists(), filters] as const,
  details: () => [...saleKeys.all, 'detail'] as const,
  detail: (id: string) => [...saleKeys.details(), id] as const,
};

// 📥 گرفتن لیست فروش‌ها
export function useSales(filters?: { patient_id?: string; search?: string }) {
  return useQuery({
    queryKey: saleKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.patient_id) params.set('patient_id', filters.patient_id);
      if (filters?.search) params.set('search', filters.search);

      const response = await fetch(`/api/sales?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت فروش‌ها');
      }
      const result = await response.json();
      return result.data as Sale[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

// 📥 گرفتن یک فروش
export function useSale(id: string) {
  return useQuery({
    queryKey: saleKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/sales/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت اطلاعات فروش');
      }
      const result = await response.json();
      return result.data as Sale;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ➕ ایجاد فروش جدید
export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SaleFormData) => {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در ایجاد فروش');
      }

      const result = await response.json();
      return result.data as Sale;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      if (data.patient_id) {
        queryClient.invalidateQueries({
          queryKey: ['patient-sales', data.patient_id]
        });
      }
      toast.success('فروش با موفقیت ثبت شد');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در ایجاد فروش');
    },
  });
}

// ✏️ ویرایش فروش
export function useUpdateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: SaleFormData & { id: string }) => {
      const response = await fetch(`/api/sales/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در ویرایش فروش');
      }

      const result = await response.json();
      return result.data as Sale;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      if (data.patient_id) {
        queryClient.invalidateQueries({
          queryKey: ['patient-sales', data.patient_id]
        });
      }
      toast.success('فروش با موفقیت ویرایش شد');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در ویرایش فروش');
    },
  });
}

// 🗑️ حذف فروش
export function useDeleteSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/sales/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در حذف فروش');
      }

      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      queryClient.removeQueries({ queryKey: saleKeys.detail(id) });
      toast.success('فروش با موفقیت حذف شد');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در حذف فروش');
    },
  });
}