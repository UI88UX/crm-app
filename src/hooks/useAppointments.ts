'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Appointment, AppointmentStatus, AppointmentType } from '@/types';

// 🔑 کلیدهای Query
export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (filters?: {
    patient_id?: string;
    status?: AppointmentStatus;
    type?: AppointmentType;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) => [...appointmentKeys.lists(), filters] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
  stats: () => [...appointmentKeys.all, 'stats'] as const,
};

// 📥 گرفتن لیست نوبت‌ها
export function useAppointments(filters?: {
  patient_id?: string;
  status?: AppointmentStatus;
  type?: AppointmentType;
  start_date?: string;
  end_date?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: appointmentKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.patient_id) params.set('patient_id', filters.patient_id);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.type) params.set('type', filters.type);
      if (filters?.start_date) params.set('start_date', filters.start_date);
      if (filters?.end_date) params.set('end_date', filters.end_date);
      if (filters?.limit) params.set('limit', String(filters.limit));

      const response = await fetch(`/api/appointments?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت نوبت‌ها');
      }
      const result = await response.json();
      return result.data as Appointment[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

// 📥 گرفتن یک نوبت
export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/appointments/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت اطلاعات نوبت');
      }
      const result = await response.json();
      return result.data as Appointment;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ➕ ایجاد نوبت جدید
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      patient_id: string;
      start_time: string;
      end_time: string;
      type: AppointmentType;
      status?: AppointmentStatus;
      title?: string | null;
      description?: string | null;
      notes?: string | null;
    }) => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در ایجاد نوبت');
      }

      const result = await response.json();
      return result.data as Appointment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.stats() });
      if (data.patient_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['patient-appointments', data.patient_id] 
        });
      }
      toast.success('نوبت با موفقیت ثبت شد');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در ایجاد نوبت');
    },
  });
}

// ✏️ ویرایش نوبت
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<{
      patient_id: string;
      start_time: string;
      end_time: string;
      type: AppointmentType;
      status: AppointmentStatus;
      title?: string | null;
      description?: string | null;
      notes?: string | null;
    }>) => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در ویرایش نوبت');
      }

      const result = await response.json();
      return result.data as Appointment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.stats() });
      if (data.patient_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['patient-appointments', data.patient_id] 
        });
      }
      toast.success('نوبت با موفقیت ویرایش شد');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در ویرایش نوبت');
    },
  });
}

// 🗑️ حذف نوبت
export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در حذف نوبت');
      }

      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.stats() });
      queryClient.removeQueries({ queryKey: appointmentKeys.detail(id) });
      toast.success('نوبت با موفقیت حذف شد');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در حذف نوبت');
    },
  });
}

// 🔄 تغییر وضعیت نوبت
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const response = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در تغییر وضعیت نوبت');
      }

      const result = await response.json();
      return result.data as Appointment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.stats() });
      if (data.patient_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['patient-appointments', data.patient_id] 
        });
      }
      toast.success('وضعیت نوبت با موفقیت تغییر کرد');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در تغییر وضعیت نوبت');
    },
  });
}

// 📊 دریافت آمار نوبت‌ها
export function useAppointmentStats() {
  return useQuery({
    queryKey: appointmentKeys.stats(),
    queryFn: async () => {
      const response = await fetch('/api/appointments/stats');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت آمار نوبت‌ها');
      }
      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}