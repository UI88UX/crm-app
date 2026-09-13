// src/hooks/useCallFollowups.ts
'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  CallFollowup,
  CallResult,
  CallFollowupStatus,
} from '@/types';
import { patientKeys } from './usePatients';

// ============================================
// 🔑 Query Keys
// ============================================

export const callFollowupKeys = {
  all: ['call-followups'] as const,

  lists: () => [...callFollowupKeys.all, 'list'] as const,
  list: (filters?: {
    status?: CallFollowupStatus;
    result?: CallResult;
    patient_id?: string;
    due_from?: string;
    due_to?: string;
    page?: number;
    limit?: number;
  }) => [...callFollowupKeys.lists(), filters] as const,

  details: () => [...callFollowupKeys.all, 'detail'] as const,
  detail: (id: string) => [...callFollowupKeys.details(), id] as const,

  byPatient: (patientId: string) =>
    [...callFollowupKeys.all, 'patient', patientId] as const,

  dueSoon: () => [...callFollowupKeys.all, 'due-soon'] as const,
  stats: () => [...callFollowupKeys.all, 'stats'] as const,
};

// ============================================
// 📥 Queries
// ============================================

/**
 * دریافت لیست پیگیری‌ها با فیلتر
 */
export function useCallFollowups(filters?: {
  status?: CallFollowupStatus;
  result?: CallResult;
  patient_id?: string;
  due_from?: string;
  due_to?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: callFollowupKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.result) params.set('result', filters.result);
      if (filters?.patient_id) params.set('patient_id', filters.patient_id);
      if (filters?.due_from) params.set('due_from', filters.due_from);
      if (filters?.due_to) params.set('due_to', filters.due_to);
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.limit) params.set('limit', String(filters.limit));

      const response = await fetch(`/api/call-followups?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت پیگیری‌ها');
      }
      const result = await response.json();
      return {
        data: result.data as CallFollowup[],
        count: result.count as number,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 دقیقه
    placeholderData: keepPreviousData,
  });
}

/**
 * دریافت یک پیگیری با ID
 */
export function useCallFollowup(id: string) {
  return useQuery({
    queryKey: callFollowupKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/call-followups/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت پیگیری');
      }
      const result = await response.json();
      return result.data as CallFollowup;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * دریافت پیگیری‌های یک بیمار
 */
export function usePatientCallFollowups(patientId: string) {
  return useQuery({
    queryKey: callFollowupKeys.byPatient(patientId),
    queryFn: async () => {
      const response = await fetch(
        `/api/call-followups?patient_id=${patientId}&limit=100`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت پیگیری‌های بیمار');
      }
      const result = await response.json();
      return result.data as CallFollowup[];
    },
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * دریافت پیگیری‌های نزدیک — برای Alert بنر
 * خودکار هر ۵ دقیقه refresh می‌شود
 */
export function useDueSoonCallFollowups() {
  return useQuery({
    queryKey: callFollowupKeys.dueSoon(),
    queryFn: async () => {
      const response = await fetch('/api/call-followups/due-soon');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت پیگیری‌های نزدیک');
      }
      const result = await response.json();
      return result.data as CallFollowup[];
    },
    staleTime: 60 * 1000,            // ۱ دقیقه
    refetchInterval: 5 * 60 * 1000,   // هر ۵ دقیقه refresh خودکار
    refetchOnWindowFocus: true,       // هنگام برگشت به تب، refresh
  });
}

// ============================================
// ✏️ Mutations
// ============================================

/**
 * ایجاد پیگیری جدید
 */
export function useCreateCallFollowup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      patient_id: string;
      due_date: string;
      notes?: string | null;
    }) => {
      const response = await fetch('/api/call-followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در ثبت پیگیری');
      }

      const result = await response.json();
      return result.data as CallFollowup;
    },

    onSuccess: (data) => {
      // Invalidate همه‌ی لیست‌ها
      queryClient.invalidateQueries({ queryKey: callFollowupKeys.lists() });
      // Invalidate لیست بیمار (چون next_call_due_at تغییر کرده)
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      // Invalidate این بیمار خاص
      queryClient.invalidateQueries({
        queryKey: patientKeys.detail(data.patient_id),
      });
      queryClient.invalidateQueries({
        queryKey: callFollowupKeys.byPatient(data.patient_id),
      });
      queryClient.invalidateQueries({ queryKey: callFollowupKeys.stats() });
      queryClient.invalidateQueries({ queryKey: callFollowupKeys.dueSoon() });

      toast.success('پیگیری تلفنی با موفقیت ثبت شد');
    },

    onError: (error: Error) => {
      toast.error(error.message || 'خطا در ثبت پیگیری');
    },
  });
}

/**
 * تکمیل پیگیری (ثبت نتیجه مکالمه)
 */
export function useCompleteCallFollowup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      result: CallResult;
      call_notes?: string | null;
      next_followup_date?: string | null;
    }) => {
      const response = await fetch(`/api/call-followups/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در ثبت نتیجه مکالمه');
      }

      const result = await response.json();
      return result.data as CallFollowup;
    },

    onSuccess: (data) => {
      // همه‌ی کش‌های مرتبط را invalidate کن
      queryClient.invalidateQueries({ queryKey: callFollowupKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: callFollowupKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: callFollowupKeys.byPatient(data.patient_id),
      });
      queryClient.invalidateQueries({ queryKey: callFollowupKeys.stats() });
      queryClient.invalidateQueries({ queryKey: callFollowupKeys.dueSoon() });

      // بیمار (چون last_call_result و next_call_due_at تغییر کرده)
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: patientKeys.detail(data.patient_id),
      });

      toast.success('نتیجه مکالمه با موفقیت ثبت شد');
    },

    onError: (error: Error) => {
      toast.error(error.message || 'خطا در ثبت نتیجه');
    },
  });
}

/**
 * ویرایش پیگیری (تاریخ/یادداشت)
 */
export function useUpdateCallFollowup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      due_date?: string;
      notes?: string | null;
    }) => {
      const response = await fetch(`/api/call-followups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در ویرایش پیگیری');
      }

      const result = await response.json();
      return result.data as CallFollowup;
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: callFollowupKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: callFollowupKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: callFollowupKeys.byPatient(data.patient_id),
      });
      queryClient.invalidateQueries({ queryKey: callFollowupKeys.stats() });
      queryClient.invalidateQueries({ queryKey: callFollowupKeys.dueSoon() });

      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: patientKeys.detail(data.patient_id),
      });

      toast.success('پیگیری با موفقیت ویرایش شد');
    },

    onError: (error: Error) => {
      toast.error(error.message || 'خطا در ویرایش پیگیری');
    },
  });
}

/**
 * لغو پیگیری
 */
export function useCancelCallFollowup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/call-followups/${id}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در لغو پیگیری');
      }

      const result = await response.json();
      return result.data as CallFollowup;
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: callFollowupKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: callFollowupKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: callFollowupKeys.byPatient(data.patient_id),
      });
      queryClient.invalidateQueries({ queryKey: callFollowupKeys.stats() });
      queryClient.invalidateQueries({ queryKey: callFollowupKeys.dueSoon() });

      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: patientKeys.detail(data.patient_id),
      });

      toast.success('پیگیری لغو شد');
    },

    onError: (error: Error) => {
      toast.error(error.message || 'خطا در لغو پیگیری');
    },
  });
}

/**
 * حذف پیگیری (soft delete)
 */
export function useDeleteCallFollowup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/call-followups/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در حذف پیگیری');
      }

      return id;
    },

    onSuccess: (id) => {
      // ✅ پاک کردن query تفصیلی این پیگیری
      queryClient.removeQueries({ queryKey: callFollowupKeys.detail(id) });

      // ✅ invalidate همه‌ی کش‌های پیگیری (ساده و مطمئن)
      queryClient.invalidateQueries({ queryKey: callFollowupKeys.all });

      // ✅ invalidate لیست بیماران (چون next_call_due_at تغییر کرده)
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });

      toast.success('پیگیری حذف شد');
    },

    onError: (error: Error) => {
      toast.error(error.message || 'خطا در حذف پیگیری');
    },
  });
}