'use client';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Sale {
  id: string;
  patient_id: string;
  hearing_aid_model: string;
  hearing_aid_serial: string;
  price: number;
  sale_date: string;
  warranty_expiry: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

// کلیدهای Query
export const patientSaleKeys = {
  all: (patientId: string) => ['patient-sales', patientId] as const,
  list: (patientId: string) => [...patientSaleKeys.all(patientId), 'list'] as const,
};

// دریافت فروش‌های بیمار
export function usePatientSales(patientId: string) {
  return useQuery({
    queryKey: patientSaleKeys.list(patientId),
    queryFn: async () => {
      const response = await fetch(`/api/patients/${patientId}/sales`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت فروش‌ها');
      }
      const result = await response.json();
      return result.data as Sale[];
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  });
}