// src/hooks/usePatientSearch.ts
'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { patientKeys } from './usePatients';

export function usePatientSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: patientKeys.search(query),
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const response = await fetch(
        `/api/patients/search?q=${encodeURIComponent(query)}&limit=10`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در جستجوی بیماران');
      }
      
      const result = await response.json();
      return result.data || [];
    },
    enabled: enabled && query.length >= 2,
    staleTime: 2 * 60 * 1000, // کش ۲ دقیقه‌ای
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false, // جلوگیری از رفرش هنگام فوکوس
    gcTime: 5 * 60 * 1000, // نگهداری کش حتی بعد از unmount
  });
}