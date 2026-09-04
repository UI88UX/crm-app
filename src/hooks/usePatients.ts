'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Patient, PatientFormData } from '@/types';

const supabase = createClient();

// 🔑 کلیدهای Query
export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (filters?: { search?: string; limit?: number; offset?: number }) =>
    [...patientKeys.lists(), filters] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  // ✅ اضافه کردن کلید جستجو
  search: (query: string) => [...patientKeys.all, 'search', query] as const,
};

// 📥 گرفتن لیست بیماران با فیلتر
export function usePatients(filters?: { search?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: patientKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.set('search', filters.search);
      if (filters?.limit) params.set('limit', String(filters.limit));
      if (filters?.offset) params.set('offset', String(filters.offset));

      const response = await fetch(`/api/patients?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت بیماران');
      }
      return response.json() as Promise<Patient[]>;
    },
    staleTime: 2 * 60 * 1000, // 2 دقیقه
  });
}

// 🔍 جستجوی بیماران (برای استفاده در فرم‌ها)
export function useSearchPatients(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: patientKeys.search(query),
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const params = new URLSearchParams();
      params.set('q', query);
      params.set('limit', '10');

      const response = await fetch(`/api/patients/search?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در جستجوی بیماران');
      }
      const result = await response.json();
      return result.data as Patient[];
    },
    enabled: enabled && query.length >= 2,
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

// 📥 گرفتن یک بیمار
export function usePatient(id: string) {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/patients/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت اطلاعات بیمار');
      }
      return response.json() as Promise<Patient>;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ➕ ایجاد بیمار جدید
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PatientFormData) => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در ایجاد بیمار');
      }

      return response.json() as Promise<Patient>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      toast.success('بیمار با موفقیت اضافه شد');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در ایجاد بیمار');
    },
  });
}

// ✏️ ویرایش بیمار
export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: PatientFormData & { id: string }) => {
      const response = await fetch(`/api/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در ویرایش بیمار');
      }

      return response.json() as Promise<Patient>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      toast.success('بیمار با موفقیت ویرایش شد');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در ویرایش بیمار');
    },
  });
}

// 🗑️ حذف بیمار (soft delete)
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/patients/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در حذف بیمار');
      }

      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.removeQueries({ queryKey: patientKeys.detail(id) });
      toast.success('بیمار با موفقیت حذف شد');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در حذف بیمار');
    },
  });
}