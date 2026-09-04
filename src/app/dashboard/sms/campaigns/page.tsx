// src/app/dashboard/sms/campaigns/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { Plus, Send, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ✅ ایمپورت React Query
import { useCampaigns, useSendCampaign, useDeleteCampaign } from "@/hooks/useSmsCampaigns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toJalaliDisplay } from "@/lib/util/jalaliDate";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  sending: "bg-yellow-100 text-yellow-700",
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-orange-100 text-orange-700",
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

  // ✅ React Query
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

  // بارگذاری
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // خطا
  if (isError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error?.message || "خطا در دریافت کمپین‌ها"}</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">کمپین‌های پیامکی</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ایجاد و مدیریت کمپین‌های ارسال پیامک گروهی
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/sms/campaigns/new")}>
          <Plus className="w-4 h-4 ml-2" />
          کمپین جدید
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Send className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>هیچ کمپینی ایجاد نشده است</p>
              <Button 
                variant="link" 
                onClick={() => router.push("/dashboard/sms/campaigns/new")}
              >
                اولین کمپین را بسازید
              </Button>
            </div>
          ) : (
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
                  const isSending = sendCampaign.isPending && sendCampaign.variables === campaign.id;
                  const isDeleting = deleteCampaign.isPending && deleteCampaign.variables === campaign.id;

                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {campaign.total_recipients} نفر
                        </div>
                        {campaign.sent_count > 0 && (
                          <div className="text-xs text-muted-foreground">
                            ارسال: {campaign.sent_count} | ناموفق: {campaign.failed_count}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[campaign.status]}>
                          {statusLabels[campaign.status] || campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {toJalaliDisplay(campaign.created_at)}
                        </div>
                        {campaign.scheduled_at && (
                          <div className="text-xs text-muted-foreground">
                            برنامه: {toJalaliDisplay(campaign.scheduled_at)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {campaign.status === 'draft' && (
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
                            onClick={() => router.push(`/dashboard/sms/campaigns/${campaign.id}`)}
                            title="مشاهده جزئیات"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/dashboard/sms/campaigns/${campaign.id}/edit`)}
                              title="ویرایش کمپین"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}