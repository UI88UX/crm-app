// src/app/dashboard/sms/campaigns/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { Plus, Send, Eye, Pencil, Trash2, Loader2, MessageSquare } from "lucide-react";

import { useCampaigns, useSendCampaign, useDeleteCampaign } from "@/hooks/useSmsCampaigns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  formatJalaliDateIntl,
  toPersianNumber,
} from "@/lib/util/jalaliDate";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  sending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  sent: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  cancelled: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

const statusLabels: Record<string, string> = {
  draft: "پیش‌نویس",
  scheduled: "برنامه‌ریزی شده",
  sending: "در حال ارسال",
  sent: "ارسال شده",
  failed: "ناموفق",
  cancelled: "لغو شده",
};

export default function CampaignsPage() {
  const router = useRouter();

  const { data: campaigns = [], isLoading, isError, error, refetch } = useCampaigns();
  const sendCampaign = useSendCampaign();
  const deleteCampaign = useDeleteCampaign();

  const handleSendCampaign = (id: string) => {
    if (!confirm("آیا از ارسال این کمپین اطمینان دارید؟")) return;
    sendCampaign.mutate(id);
  };

  const handleDeleteCampaign = (id: string, name: string) => {
    if (!confirm(`آیا از حذف کمپین "${name}" اطمینان دارید؟`)) return;
    deleteCampaign.mutate(id);
  };

  // ============ Loading State (Skeleton) ============
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6" dir="rtl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-9 w-36 bg-muted rounded animate-pulse" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-4 bg-muted rounded flex-1" />
                <div className="h-4 bg-muted rounded w-20" />
                <div className="h-6 bg-muted rounded w-24" />
                <div className="h-4 bg-muted rounded w-28" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============ Error State ============
  if (isError) {
    return (
      <div className="p-4 sm:p-6" dir="rtl">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <MessageSquare className="h-10 w-10 text-red-600" />
            <h2 className="text-lg font-bold text-red-700 dark:text-red-400">
              خطا در دریافت کمپین‌ها
            </h2>
            <p className="text-sm text-muted-foreground">
              {error?.message || "خطای نامشخص"}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============ Main ============
  return (
    <div className="p-4 sm:p-6 space-y-6" dir="rtl">
      {/* ============ هدر ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">کمپین‌های پیامکی</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ایجاد و مدیریت کمپین‌های ارسال پیامک گروهی
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/sms/campaigns/new")}
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 ml-2" />
          کمپین جدید
        </Button>
      </div>

      {/* ============ Empty State ============ */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Send className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground mb-3">هیچ کمپینی ایجاد نشده است</p>
            <Button
              variant="link"
              onClick={() => router.push("/dashboard/sms/campaigns/new")}
            >
              اولین کمپین را بسازید
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ============ Desktop Table (hidden on mobile) ============ */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>عنوان</TableHead>
                    <TableHead>گیرندگان</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead className="text-center">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => {
                    const isSending =
                      sendCampaign.isPending && sendCampaign.variables === campaign.id;
                    const isDeleting =
                      deleteCampaign.isPending && deleteCampaign.variables === campaign.id;

                    return (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">
                          {campaign.name}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {toPersianNumber(campaign.total_recipients)} نفر
                          </div>
                          {campaign.sent_count > 0 && (
                            <div className="text-xs text-muted-foreground">
                              ارسال: {toPersianNumber(campaign.sent_count)} |
                              ناموفق: {toPersianNumber(campaign.failed_count)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              statusColors[campaign.status] || statusColors.draft
                            }
                          >
                            {statusLabels[campaign.status] || campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatJalaliDateIntl(campaign.created_at, "long")}
                          </div>
                          {campaign.scheduled_at && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              برنامه: {formatJalaliDateIntl(campaign.scheduled_at, "long")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {campaign.status === "draft" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendCampaign(campaign.id)}
                                disabled={isSending}
                                title="ارسال کمپین"
                              >
                                {isSending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/dashboard/sms/campaigns/${campaign.id}`)
                              }
                              title="مشاهده جزئیات"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {(campaign.status === "draft" ||
                              campaign.status === "scheduled") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/sms/campaigns/${campaign.id}/edit`
                                  )
                                }
                                title="ویرایش کمپین"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                              onClick={() =>
                                handleDeleteCampaign(campaign.id, campaign.name)
                              }
                              disabled={isDeleting}
                              title="حذف کمپین"
                            >
                              {isDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* ============ Mobile Cards (hidden on desktop) ============ */}
          <div className="md:hidden space-y-3">
            {campaigns.map((campaign) => {
              const isSending =
                sendCampaign.isPending && sendCampaign.variables === campaign.id;
              const isDeleting =
                deleteCampaign.isPending && deleteCampaign.variables === campaign.id;

              return (
                <Card key={campaign.id}>
                  <CardContent className="p-4 space-y-3">
                    {/* Header: Title + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{campaign.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatJalaliDateIntl(campaign.created_at, "long")}
                        </p>
                      </div>
                      <Badge
                        className={`shrink-0 ${
                          statusColors[campaign.status] || statusColors.draft
                        }`}
                      >
                        {statusLabels[campaign.status] || campaign.status}
                      </Badge>
                    </div>

                    {/* Info row */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground border-t pt-3">
                      <span>{toPersianNumber(campaign.total_recipients)} نفر</span>
                      {campaign.sent_count > 0 && (
                        <>
                          <span className="text-green-600">
                            ✓ {toPersianNumber(campaign.sent_count)}
                          </span>
                          {campaign.failed_count > 0 && (
                            <span className="text-red-600">
                              ✗ {toPersianNumber(campaign.failed_count)}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Scheduled date */}
                    {campaign.scheduled_at && (
                      <div className="text-xs text-muted-foreground">
                        برنامه: {formatJalaliDateIntl(campaign.scheduled_at, "long")}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 border-t pt-3">
                      {campaign.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleSendCampaign(campaign.id)}
                          disabled={isSending}
                        >
                          {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4 ml-1" />
                              ارسال
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(`/dashboard/sms/campaigns/${campaign.id}`)
                        }
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        مشاهده
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                        onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}