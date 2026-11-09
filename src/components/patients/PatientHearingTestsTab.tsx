'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Calendar } from 'lucide-react';

const supabase = createClient();

async function fetchPatientHearingTests(patientId: string) {
  const { data, error } = await supabase
    .from('hearing_tests')
    .select('id, test_date, test_type, interpretation, created_at')
    .eq('patient_id', patientId) // ← فقط با patient_id فیلتر می‌کنیم
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

interface PatientHearingTestsTabProps {
  patientId: string;
}

export function PatientHearingTestsTab({ patientId }: PatientHearingTestsTabProps) {
  const router = useRouter();

  const { data: tests, isLoading, error } = useQuery({
    queryKey: ['hearing_tests', 'patient', patientId],
    queryFn: () => fetchPatientHearingTests(patientId),
    enabled: !!patientId,
  });

  if (isLoading) return <div className="p-4 text-center">در حال بارگذاری...</div>;
  if (error) {
    console.error('Error loading hearing tests:', error);
    return <div className="p-4 text-center text-red-500">خطا در بارگذاری تست‌ها.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">تست‌های شنوایی بیمار</h3>
        <Button
          size="sm"
          onClick={() => router.push(`/dashboard/audiograms/new?patientId=${patientId}`)}
        >
          <Plus className="w-4 h-4 mr-2" />
          تست جدید برای این بیمار
        </Button>
      </div>

      {tests && tests.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>تاریخ تست</TableHead>
              <TableHead>نوع تست</TableHead>
              <TableHead>وضعیت گزارش</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.map((test: any) => (
              <TableRow key={test.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {new Date(test.test_date).toLocaleDateString('fa-IR')}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {test.test_type === 'comprehensive'
                      ? 'کامل'
                      : test.test_type === 'pure_tone_audiometry'
                      ? 'ادیومتری'
                      : test.test_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {test.interpretation ? (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                      تولید شده
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      بدون گزارش
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-left">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/audiograms/${test.id}`)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground mb-4">هنوز تست شنوایی برای این بیمار ثبت نشده است.</p>
          <Button
            onClick={() => router.push(`/dashboard/audiograms/new?patientId=${patientId}`)}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            ثبت اولین تست
          </Button>
        </div>
      )}
    </div>
  );
}