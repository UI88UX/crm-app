// src/app/dashboard/sms/campaigns/[id]/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowRight, Send, Users, Calendar, Loader2, Trash2, Pencil, RotateCw } from "lucide-react";
import { toast } from "sonner";

// ✅ ایمپورت React Query
import { useCampaign, useSendCampaign, useDeleteCampaign } from "@/hooks/useSmsCampaigns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // ✅ React Query
  const { data: campaign, isLoading, isError, error, refetch } = useCampaign(id);
  const sendCampaign = useSendCampaign();
  const deleteCampaign = useDeleteCampaign();

  const handleSend = () => {
    if (!confirm("آیا از ارسال این کمپین اطمینان دارید؟")) return;
    sendCampaign.mutate(id);
  };

  const handleDelete = () => {
    if (!confirm("آیا از حذف این کمپین اطمینان دارید؟")) return;
    deleteCampaign.mutate(id, {
      onSuccess: () => {
        router.push("/dashboard/sms/campaigns");
      },
    });
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
  if (isError || !campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error?.message || "کمپین یافت نشد"}</p>
        <Button variant="link" onClick={() => router.push("/dashboard/sms/campaigns")}>
          بازگشت به لیست کمپین‌ها
        </Button>
      </div>
    );
  }

  const isSending = sendCampaign.isPending;
  const isDeleting = deleteCampaign.isPending;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowRight className="w-4 h-4 ml-2" />
            بازگشت
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              جزئیات کمپین پیامکی
            </p>
          </div>
        </div>
        <Badge className={statusColors[campaign.status]}>
          {statusLabels[campaign.status] || campaign.status}
        </Badge>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/sms/campaigns/${id}/edit`)}
          >
            <Pencil className="w-4 h-4 ml-2" />
            ویرایش
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 ml-2" />
            )}
            حذف
          </Button>
        </div>
      </div>

      {/* اطلاعات اصلی */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              تعداد گیرندگان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{campaign.total_recipients}</p>
            <p className="text-sm text-muted-foreground">بیمار</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              وضعیت ارسال
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {campaign.sent_count || 0}
              <span className="text-base font-normal text-muted-foreground mr-2">
                از {campaign.total_recipients}
              </span>
            </p>
            {campaign.failed_count > 0 && (
              <p className="text-sm text-red-500">
                {campaign.failed_count} ناموفق
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* متن پیامک */}
      <Card>
        <CardHeader>
          <CardTitle>متن پیامک</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
            {campaign.content}
          </div>
        </CardContent>
      </Card>

      {/* فیلترها */}
      {campaign.filters && Object.keys(campaign.filters).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>فیلترهای اعمال‌شده</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(campaign.filters).map(([key, value]) => {
                if (!value) return null;
                const labels: Record<string, string> = {
                  last_visit_days_ago: `آخرین ویزیت: ${value} روز پیش`,
                  hearing_aid_brand: `برند سمعک: ${value}`,
                  hearing_aid_purchased_months_ago: `خرید سمعک: ${value} ماه پیش`,
                  city: `شهر: ${value}`,
                  gender: `جنسیت: ${value === 'male' ? 'مرد' : value === 'female' ? 'زن' : value}`,
                  consent_to_sms: value ? 'رضایت پیامک دارد' : 'رضایت پیامک ندارد',
                };
                return (
                  <Badge key={key} variant="secondary">
                    {labels[key] || `${key}: ${value}`}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* تاریخ‌ها */}
      <Card>
        <CardHeader>
          <CardTitle>اطلاعات زمان‌بندی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">تاریخ ایجاد:</span>
            <span>{toJalaliDisplay(campaign.created_at)}</span>
          </div>
          {campaign.scheduled_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">زمان برنامه‌ریزی:</span>
              <span>{toJalaliDisplay(campaign.scheduled_at)}</span>
            </div>
          )}
          {campaign.sent_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">تاریخ ارسال:</span>
              <span>{toJalaliDisplay(campaign.sent_at)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* دکمه‌ها */}
      <div className="flex gap-4">
        {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
          <Button
            onClick={handleSend}
            disabled={isSending}
            className="flex-1"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 ml-2" />
            )}
            ارسال کمپین
          </Button>
        )}

        {(campaign.status === 'sent' || campaign.status === 'failed') && (
          <Button
            onClick={() => {
              if (!confirm("آیا از ارسال مجدد این کمپین اطمینان دارید؟")) return;
              sendCampaign.mutate(id);
            }}
            disabled={isSending}
            variant="outline"
            className="flex-1"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <RotateCw className="w-4 h-4 ml-2" />
            )}
            ارسال مجدد
          </Button>
        )}
      </div>
    </div>
  );
}