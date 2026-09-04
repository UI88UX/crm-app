'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export interface Campaign {
  id: string;
  name: string;
  content: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  filters?: any;
}

export interface CampaignFormData {
  name: string;
  content: string;
  filters?: any;
  scheduled_at?: string | null;
}

// ============================================
// Query Keys
// ============================================

export const campaignKeys = {
  all: ['sms-campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (filters?: { status?: string }) => [...campaignKeys.lists(), filters] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
  stats: () => [...campaignKeys.all, 'stats'] as const,
};

// ============================================
// Hooks
// ============================================

// 📥 دریافت لیست کمپین‌ها
export function useCampaigns(filters?: { status?: string }) {
  return useQuery({
    queryKey: campaignKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);

      const response = await fetch(`/api/sms/campaigns?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت کمپین‌ها');
      }
      const result = await response.json();
      return result.data as Campaign[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

// 📥 دریافت یک کمپین
export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/sms/campaigns/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت اطلاعات کمپین');
      }
      const result = await response.json();
      return result.data as Campaign;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ➕ ایجاد کمپین جدید
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const response = await fetch('/api/sms/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در ایجاد کمپین');
      }

      const result = await response.json();
      return result.data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campaignKeys.stats() });
      toast.success('کمپین با موفقیت ایجاد شد');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در ایجاد کمپین');
    },
  });
}

// ✏️ ویرایش کمپین
export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: CampaignFormData & { id: string }) => {
      const response = await fetch(`/api/sms/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در ویرایش کمپین');
      }

      const result = await response.json();
      return result.data as Campaign;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      toast.success('کمپین با موفقیت ویرایش شد');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در ویرایش کمپین');
    },
  });
}

// 🗑️ حذف کمپین
export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/sms/campaigns/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در حذف کمپین');
      }

      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.removeQueries({ queryKey: campaignKeys.detail(id) });
      toast.success('کمپین با موفقیت حذف شد');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در حذف کمپین');
    },
  });
}

// 📤 ارسال کمپین
export function useSendCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/sms/campaigns/${id}/send`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در ارسال کمپین');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      toast.success('کمپین با موفقیت ارسال شد');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در ارسال کمپین');
    },
  });
}

// 📊 دریافت آمار پیامک
export function useSmsStats() {
  return useQuery({
    queryKey: campaignKeys.stats(),
    queryFn: async () => {
      const response = await fetch('/api/sms/stats');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت آمار');
      }
      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// 🔍 پیش‌نمایش تعداد گیرندگان
export function usePreviewRecipients(filters: any) {
  return useQuery({
    queryKey: ['sms-preview', filters],
    queryFn: async () => {
      const response = await fetch('/api/sms/patients/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در پیش‌نمایش');
      }

      const result = await response.json();
      return result.count as number;
    },
    enabled: false, // فقط با دستور manual trigger اجرا می‌شود
    staleTime: 0,
  });
}