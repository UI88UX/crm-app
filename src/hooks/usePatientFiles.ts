'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatientFiles, deletePatientFile, type PatientFile } from '@/lib/storage/patientFiles';
import { toast } from 'sonner';

// کلیدهای Query
export const patientFileKeys = {
  all: (patientId: string) => ['patient-files', patientId] as const,
  list: (patientId: string) => [...patientFileKeys.all(patientId), 'list'] as const,
};

// دریافت فایل‌های بیمار
export function usePatientFiles(patientId: string) {
  return useQuery({
    queryKey: patientFileKeys.list(patientId),
    queryFn: async () => {
      const { files, error } = await getPatientFiles(patientId);
      if (error) throw new Error(error);
      return files as PatientFile[];
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  });
}

// حذف فایل بیمار
export function useDeletePatientFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ patientId, fileId }: { patientId: string; fileId: string }) => {
      const { error } = await deletePatientFile(patientId, fileId);
      if (error) throw new Error(error);
      return { patientId, fileId };
    },
    onSuccess: ({ patientId }) => {
      queryClient.invalidateQueries({ queryKey: patientFileKeys.list(patientId) });
      toast.success('فایل با موفقیت حذف شد');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در حذف فایل');
    },
  });
}