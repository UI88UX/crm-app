'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Trash2, Calendar, User } from 'lucide-react';

const supabase = createClient();

// -------------------------------------------------------------
// 1. توابع ارتباط با دیتابیس
// -------------------------------------------------------------

/**
 * دریافت اطلاعات کاربر جاری و tenant_id از سشن Supabase
 */
async function getCurrentUserContext() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('کاربر احراز هویت نشده است.');

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, tenant_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) throw new Error('پروفایل کاربر یافت نشد.');

  return { userId: profile.id, tenantId: profile.tenant_id };
}

/**
 * واکشی لیست تست‌های شنوایی همراه با نام بیمار و نام پزشک
 * از join داخلی (inner join) استفاده می‌کنیم.
 */
async function fetchHearingTests(tenantId: string) {
  const { data, error } = await supabase
    .from('hearing_tests')
    .select(
      `
      id,
      test_date,
      test_type,
      interpretation,
      created_at,
      patients ( id, first_name, last_name ),
      users:doctor_id ( id, full_name )
    `
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * حذف یک تست شنوایی
 */
async function deleteHearingTest(testId: string) {
  const { error } = await supabase.from('hearing_tests').delete().eq('id', testId);
  if (error) throw new Error(error.message);
  return testId;
}

// -------------------------------------------------------------
// 2. کامپوننت اصلی
// -------------------------------------------------------------

export default function AudiogramsListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- 2.1. دریافت اطلاعات کاربر و tenant ---
  const { data: userContext, isLoading: isUserLoading } = useQuery({
    queryKey: ['current-user-context'],
    queryFn: getCurrentUserContext,
    staleTime: Infinity,
  });

  const tenantId = userContext?.tenantId;

  // --- 2.2. واکشی لیست تست‌ها ---
  const {
    data: tests,
    isLoading: isLoadingTests,
    error: testsError,
  } = useQuery({
    queryKey: ['hearing_tests', tenantId],
    queryFn: () => fetchHearingTests(tenantId!),
    enabled: !!tenantId,
  });

  // --- 2.3. Mutation برای حذف ---
  const deleteMutation = useMutation({
    mutationFn: (testId: string) => deleteHearingTest(testId),
    onSuccess: () => {
      toast.success('تست شنوایی با موفقیت حذف شد.');
      queryClient.invalidateQueries({ queryKey: ['hearing_tests', tenantId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // --- 2.4. رندر حالت‌های بارگذاری / خطا ---
  if (isUserLoading || isLoadingTests) {
    return <div className="p-8 text-center">در حال بارگذاری...</div>;
  }

  if (testsError) {
    return (
      <div className="p-8 text-center text-red-500">
        خطا در بارگذاری تست‌ها. لطفاً صفحه را رفرش کنید.
      </div>
    );
  }

  // --- 2.5. رندر اصلی ---
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* هدر صفحه */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">تست‌های شنوایی</h1>
          <p className="text-sm text-muted-foreground mt-1">
            مدیریت و مشاهده همه تست‌های شنوایی کلینیک
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/audiograms/new')}>
          <Plus className="w-4 h-4 mr-2" />
          تست جدید
        </Button>
      </div>

      {/* جدول تست‌ها */}
      <Card>
        <CardHeader>
          <CardTitle>لیست تست‌ها</CardTitle>
          <CardDescription>
            {tests?.length || 0} تست ثبت شده است.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tests && tests.length > 0 ? (
            // به جای کامپوننت Table از Shadcn، از یک جدول ساده و مرتب استفاده می‌کنیم

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm text-right border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="px-4 py-3 font-semibold text-right">بیمار</th>
                    <th className="px-4 py-3 font-semibold text-right">پزشک</th>
                    <th className="px-4 py-3 font-semibold text-right">تاریخ تست</th>
                    <th className="px-4 py-3 font-semibold text-right">نوع تست</th>
                    <th className="px-4 py-3 font-semibold text-right">وضعیت گزارش</th>
                    <th className="px-4 py-3 font-semibold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {tests && tests.length > 0 ? (
                    tests.map((test: any) => (
                      <tr key={test.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-800">
                              {test.patients?.first_name} {test.patients?.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {test.users?.full_name || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {new Date(test.test_date).toLocaleDateString('fa-IR')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                            {test.test_type === 'comprehensive'
                              ? 'کامل'
                              : test.test_type === 'pure_tone_audiometry'
                                ? 'ادیومتری'
                                : test.test_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {test.interpretation ? (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">
                              تولید شده
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500 border-slate-300">
                              بدون گزارش
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/audiograms/${test.id}`)}
                              title="مشاهده جزئیات"
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  title="حذف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                {/* ... (محتوای دیالوگ حذف) ... */}
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                        <p className="mb-4">هنوز تست شنوایی ثبت نشده است.</p>
                        <Button onClick={() => router.push('/dashboard/audiograms/new')} variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          ثبت اولین تست
                        </Button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                هنوز تست شنوایی ثبت نشده است.
              </p>
              <Button
                onClick={() => router.push('/dashboard/audiograms/new')}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                ثبت اولین تست
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}