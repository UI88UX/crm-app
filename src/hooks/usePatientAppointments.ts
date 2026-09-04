'use client';

import { useQuery } from '@tanstack/react-query';
import type { Appointment } from '@/types';

// کلیدهای Query
export const patientAppointmentKeys = {
  all: (patientId: string) => ['patient-appointments', patientId] as const,
  list: (patientId: string, limit?: number) => [...patientAppointmentKeys.all(patientId), 'list', { limit }] as const,
};

// دریافت نوبت‌های بیمار
export function usePatientAppointments(patientId: string, limit: number = 10) {
  return useQuery({
    queryKey: patientAppointmentKeys.list(patientId, limit),
    queryFn: async () => {
      const response = await fetch(`/api/appointments?patient_id=${patientId}&limit=${limit}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت نوبت‌ها');
      }
      const result = await response.json();
      return result.data as Appointment[];
    },
    enabled: !!patientId,
    staleTime: 3 * 60 * 1000,
  });
}