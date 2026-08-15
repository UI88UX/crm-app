// src/hooks/useAppointments.ts
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { Appointment, AppointmentFormData, AppointmentStatus, AppointmentType } from "@/types";

interface UseAppointmentsOptions {
  patientId?: string;
  status?: AppointmentStatus;
  type?: AppointmentType;
  startDate?: string;
  endDate?: string;
  autoFetch?: boolean;
}

interface UseAppointmentsReturn {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  total: number;
  fetchAppointments: (options?: UseAppointmentsOptions) => Promise<void>;
  createAppointment: (data: AppointmentFormData) => Promise<Appointment | null>;
  updateAppointment: (id: string, data: Partial<AppointmentFormData>) => Promise<Appointment | null>;
  cancelAppointment: (id: string, reason?: string) => Promise<Appointment | null>;
  deleteAppointment: (id: string) => Promise<boolean>;
  getAppointment: (id: string) => Promise<Appointment | null>;
  refetch: () => Promise<void>;
}

export function useAppointments(options: UseAppointmentsOptions = {}): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

  const { patientId, status, type, startDate, endDate, autoFetch = true } = options;

  const fetchAppointments = useCallback(async (fetchOptions?: UseAppointmentsOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      const opts = { ...options, ...fetchOptions };
      
      if (opts.patientId) params.append('patient_id', opts.patientId);
      if (opts.status) params.append('status', opts.status);
      if (opts.type) params.append('type', opts.type);
      if (opts.startDate) params.append('start_date', opts.startDate);
      if (opts.endDate) params.append('end_date', opts.endDate);

      const response = await fetch(`/api/appointments?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'خطا در دریافت نوبت‌ها');
      }

      setAppointments(result.data || []);
      setTotal(result.count || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در دریافت نوبت‌ها';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const createAppointment = useCallback(async (data: AppointmentFormData): Promise<Appointment | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'خطا در ثبت نوبت');
      }

      toast.success('نوبت با موفقیت ثبت شد');
      await fetchAppointments();
      
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در ثبت نوبت';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAppointments]);

  const updateAppointment = useCallback(async (id: string, data: Partial<AppointmentFormData>): Promise<Appointment | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'خطا در ویرایش نوبت');
      }

      toast.success('نوبت با موفقیت ویرایش شد');
      await fetchAppointments();
      
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در ویرایش نوبت';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAppointments]);

  const cancelAppointment = useCallback(async (id: string, reason?: string): Promise<Appointment | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'خطا در لغو نوبت');
      }

      toast.success('نوبت با موفقیت لغو شد');
      await fetchAppointments();
      
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در لغو نوبت';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAppointments]);

  const deleteAppointment = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'خطا در حذف نوبت');
      }

      toast.success('نوبت با موفقیت حذف شد');
      await fetchAppointments();
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در حذف نوبت';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAppointments]);

  const getAppointment = useCallback(async (id: string): Promise<Appointment | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'خطا در دریافت نوبت');
      }

      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در دریافت نوبت';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchAppointments();
    }
  }, [autoFetch, fetchAppointments]);

  return {
    appointments,
    isLoading,
    error,
    total,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    deleteAppointment,
    getAppointment,
    refetch: fetchAppointments,
  };
}