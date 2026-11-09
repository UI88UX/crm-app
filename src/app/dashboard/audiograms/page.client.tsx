// src/app/dashboard/audiograms/page.client.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Eye,
  Trash2,
  Calendar,
  User,
  Stethoscope,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { formatJalaliDateIntl, formatJalaliDateTimeIntl } from "@/lib/util/jalaliDate";
import { AudiogramFilters} from "./filters";

const supabase = createClient();

// ============================================================
// Constants
// ============================================================

const PAGE_SIZE = 10;

// ============================================================
// DB Functions
// ============================================================

async function getCurrentUserContext() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("کاربر احراز هویت نشده است.");

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) throw new Error("پروفایل کاربر یافت نشد.");

  return { userId: profile.id, tenantId: profile.tenant_id };
}

interface FetchParams {
  tenantId: string;
  page: number;
  search?: string;
  from?: string;
  to?: string;
}

async function fetchHearingTests({
  tenantId,
  page,
  search,
  from,
  to
}: FetchParams) {
  const fromIdx = (page - 1) * PAGE_SIZE;
  const toIdx = fromIdx + PAGE_SIZE - 1;

  // کوئری پایه
  let query = supabase
    .from("hearing_tests")
    .select(
      `
      id,
      test_date,
      test_type,
      interpretation,
      created_at,
      patients!inner ( id, first_name, last_name, phone ),
      users:doctor_id ( id, full_name )
    `,
      { count: "exact" }
    )
    .eq("tenant_id", tenantId);

  // فیلتر بازه تاریخ (test_date)
  if (from) query = query.gte("test_date", from);
  if (to) query = query.lte("test_date", to);

  // جستجو در نام/نام‌خانوادگی/تلفن بیمار و نام پزشک
  if (search && search.trim().length >= 2) {
    const q = `%${search.trim()}%`;
    // یا در patients (inner join)
    query = query.or(
      `first_name.ilike.${q},last_name.ilike.${q},phone.ilike.${q}`,
      { foreignTable: "patients" }
    );
  }

  // مرتب‌سازی و صفحه‌بندی
  query = query
    .order("test_date", { ascending: false })
    .range(fromIdx, toIdx);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  return { data: data ?? [], totalCount: count ?? 0 };
}

async function deleteHearingTest(testId: string) {
  const { error } = await supabase.from("hearing_tests").delete().eq("id", testId);
  if (error) throw new Error(error.message);
  return testId;
}

// ============================================================
// Helpers
// ============================================================

const getTestTypeLabel = (type: string) => {
  if (type === "comprehensive") return "کامل";
  if (type === "pure_tone_audiometry") return "ادیومتری";
  return type;
};

// ============================================================
// Delete Dialog
// ============================================================

function DeleteTestDialog({
  testId,
  onDelete,
}: {
  testId: string;
  onDelete: (id: string) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:bg-red-50 hover:text-red-700"
          title="حذف"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حذف تست شنوایی</AlertDialogTitle>
          <AlertDialogDescription>
            آیا از حذف این تست مطمئن هستید؟ این عمل قابل بازگشت نیست.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>انصراف</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onDelete(testId)}
            className="bg-red-600 hover:bg-red-700"
          >
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function AudiogramsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // خواندن پارامترهای URL
  const search = searchParams.get("search") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const queryClient = useQueryClient();

  // کاربر و tenant
  const { data: userContext, isLoading: isUserLoading } = useQuery({
    queryKey: ["current-user-context"],
    queryFn: getCurrentUserContext,
    staleTime: Infinity,
  });

  const tenantId = userContext?.tenantId;

  // لیست تست‌ها
  const {
    data: result,
    isLoading: isLoadingTests,
    error: testsError,
    isFetching,
  } = useQuery({
    queryKey: ["hearing_tests", tenantId, { page, search, from, to }],
    queryFn: () =>
      fetchHearingTests({ tenantId: tenantId!, page, search, from, to }),
    enabled: !!tenantId,
    placeholderData: (prev) => prev,
  });


  const tests = result?.data ?? [];
  const totalCount = result?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Mutation حذف
  const deleteMutation = useMutation({
    mutationFn: (testId: string) => deleteHearingTest(testId),
    onSuccess: () => {
      toast.success("تست شنوایی با موفقیت حذف شد.");
      queryClient.invalidateQueries({ queryKey: ["hearing_tests"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // ======================================================
  // Pagination
  // ======================================================

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(newPage));
    }
    const qs = params.toString();
    router.replace(`/dashboard/audiograms${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  // ======================================================
  // Render: Loading / Error
  // ======================================================

  if (isUserLoading || isLoadingTests) {
    return (
      <div className="container mx-auto flex max-w-7xl items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (testsError) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          خطا در بارگذاری تست‌ها. لطفاً صفحه را رفرش کنید.
        </div>
      </div>
    );
  }

  // ======================================================
  // Render: Main
  // ======================================================

  return (
    <div className="container mx-auto max-w-7xl space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* هدر */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">تست‌های شنوایی</h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            مدیریت و مشاهده همه تست‌های شنوایی کلینیک
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/audiograms/new")}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          تست جدید
        </Button>
      </div>

      {/* فیلترها */}
      <Card>
        <CardContent className="p-4">
          <AudiogramFilters
            totalCount={totalCount}
            isLoading={isFetching}
          />
        </CardContent>
      </Card>

      {/* لیست تست‌ها */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">لیست تست‌ها</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {totalCount > 0
              ? `${totalCount.toLocaleString("fa-IR")} تست ثبت شده — نمایش صفحه ${page} از ${totalPages}`
              : "هیچ تستی با این فیلترها یافت نشد."}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {tests.length > 0 ? (
            <>
              {/* ============ دسکتاپ: جدول ============ */}
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">بیمار</TableHead>
                      <TableHead className="text-right">پزشک</TableHead>
                      <TableHead className="text-right">تاریخ تست</TableHead>
                      <TableHead className="text-right">نوع تست</TableHead>
                      <TableHead className="text-right">وضعیت گزارش</TableHead>
                      <TableHead className="text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.map((test: any) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {test.patients?.first_name} {test.patients?.last_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {test.users?.full_name || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatJalaliDateIntl(test.test_date, "long") || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getTestTypeLabel(test.test_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {test.interpretation ? (
                            <Badge
                              variant="default"
                              className="bg-green-500 text-white hover:bg-green-600"
                            >
                              تولید شده
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground"
                            >
                              بدون گزارش
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/dashboard/audiograms/${test.id}`)
                              }
                              title="مشاهده جزئیات"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <DeleteTestDialog
                              testId={test.id}
                              onDelete={(id) => deleteMutation.mutate(id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ============ موبایل: کارت‌ها ============ */}
              <div className="flex flex-col gap-3 md:hidden">
                {tests.map((test: any) => (
                  <div
                    key={test.id}
                    className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">
                            {test.patients?.first_name} {test.patients?.last_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">بیمار</p>
                        </div>
                      </div>
                      {test.interpretation ? (
                        <Badge
                          variant="default"
                          className="shrink-0 bg-green-500 text-[10px] text-white hover:bg-green-600"
                        >
                          تولید شده
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="shrink-0 text-[10px] text-muted-foreground"
                        >
                          بدون گزارش
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 border-t border-dashed pt-3 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Stethoscope className="h-3.5 w-3.5" />
                          پزشک:
                        </span>
                        <span className="font-medium text-foreground">
                          {test.users?.full_name || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          تاریخ:
                        </span>
                        <span className="font-medium text-foreground">
                          {formatJalaliDateTimeIntl(test.test_date) || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>نوع تست:</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {getTestTypeLabel(test.test_type)}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 border-t pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() =>
                          router.push(`/dashboard/audiograms/${test.id}`)
                        }
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        مشاهده
                      </Button>
                      <DeleteTestDialog
                        testId={test.id}
                        onDelete={(id) => deleteMutation.mutate(id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                هیچ تستی با این فیلترها یافت نشد.
              </p>
              <Button
                onClick={() => router.push("/dashboard/audiograms/new")}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                ثبت تست جدید
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ======================================================
          Pagination
      ====================================================== */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:p-4">
          <p className="text-xs text-muted-foreground sm:text-sm">
            نمایش {(totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1).toLocaleString("fa-IR")}{" "}
            تا {Math.min(page * PAGE_SIZE, totalCount).toLocaleString("fa-IR")} از{" "}
            {totalCount.toLocaleString("fa-IR")} مورد
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1 || isFetching}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="mr-1 hidden sm:inline">قبلی</span>
            </Button>

            {/* شماره صفحات (حداکثر ۵ صفحه اطراف صفحه فعلی) */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  return (
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - page) <= 1
                  );
                })
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev !== undefined && p - prev > 1;
                  return (
                    <div key={p} className="flex items-center gap-1">
                      {showEllipsis && (
                        <span className="px-1 text-xs text-muted-foreground">…</span>
                      )}
                      <Button
                        type="button"
                        variant={p === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(p)}
                        disabled={isFetching}
                        className="h-8 w-8 p-0 text-xs"
                      >
                        {p.toLocaleString("fa-IR")}
                      </Button>
                    </div>
                  );
                })}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages || isFetching}
            >
              <span className="ml-1 hidden sm:inline">بعدی</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}