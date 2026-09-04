// src/app/dashboard/sms/campaigns/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowRight, Save, Loader2, Users, Calendar } from "lucide-react";
import { toast } from "sonner";

// ✅ ایمپورت React Query
import { useCampaign, useUpdateCampaign, usePreviewRecipients } from "@/hooks/useSmsCampaigns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterState {
  last_visit_days_ago?: number;
  hearing_aid_brand?: string;
  hearing_aid_purchased_months_ago?: number;
  city?: string;
  gender?: string;
  consent_to_sms?: boolean;
}

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Stateهای فرم
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [filters, setFilters] = useState<FilterState>({});
  const [scheduleLater, setScheduleLater] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [showRecipients, setShowRecipients] = useState(false);

  // ✅ React Query
  const { data: campaign, isLoading, isError, error } = useCampaign(id);
  const updateCampaign = useUpdateCampaign();
  const { 
    data: recipientsCount, 
    refetch: previewRecipients, 
    isFetching: isPreviewing 
  } = usePreviewRecipients(filters);

  // پر کردن فرم با داده‌های کمپین
  useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setContent(campaign.content);
      setFilters(campaign.filters || {});
      if (campaign.scheduled_at) {
        setScheduleLater(true);
        setScheduledDate(campaign.scheduled_at);
      }
    }
  }, [campaign]);

  const handlePreview = async () => {
    setShowRecipients(true);
    await previewRecipients();
    if (recipientsCount !== undefined) {
      toast.success(`${recipientsCount} بیمار یافت شد`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("لطفاً عنوان کمپین را وارد کنید");
      return;
    }

    if (!content.trim()) {
      toast.error("لطفاً متن پیامک را وارد کنید");
      return;
    }

    updateCampaign.mutate({
      id,
      name: name.trim(),
      content: content.trim(),
      filters,
      scheduled_at: scheduleLater ? scheduledDate : null,
    }, {
      onSuccess: () => {
        router.push(`/dashboard/sms/campaigns/${id}`);
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

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت
        </Button>
        <div>
          <h1 className="text-2xl font-bold">ویرایش کمپین</h1>
          <p className="text-sm text-muted-foreground mt-1">
            تغییر اطلاعات کمپین
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* اطلاعات کمپین */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات کمپین</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">عنوان کمپین</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="content">متن پیامک</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px]"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                متغیرها: {"{{patient.first_name}}"}، {"{{patient.last_name}}"}، {"{{patient.national_code}}"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* فیلترها */}
        <Card>
          <CardHeader>
            <CardTitle>فیلترهای بیماران</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="last_visit">آخرین ویزیت (روز پیش)</Label>
                <Input
                  id="last_visit"
                  type="number"
                  value={filters.last_visit_days_ago || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, last_visit_days_ago: parseInt(e.target.value) || undefined })
                  }
                  placeholder="مثلاً: 180"
                />
              </div>

              <div>
                <Label htmlFor="hearing_aid_brand">برند سمعک</Label>
                <Input
                  id="hearing_aid_brand"
                  value={filters.hearing_aid_brand || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, hearing_aid_brand: e.target.value || undefined })
                  }
                  placeholder="مثلاً: Widex"
                />
              </div>

              <div>
                <Label htmlFor="purchased_months">مدت خرید سمعک (ماه)</Label>
                <Input
                  id="purchased_months"
                  type="number"
                  value={filters.hearing_aid_purchased_months_ago || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      hearing_aid_purchased_months_ago: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="مثلاً: 6"
                />
              </div>

              <div>
                <Label htmlFor="city">شهر</Label>
                <Input
                  id="city"
                  value={filters.city || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, city: e.target.value || undefined })
                  }
                  placeholder="مثلاً: تهران"
                />
              </div>

              <div>
                <Label htmlFor="gender">جنسیت</Label>
                <Select
                  value={filters.gender || ""}
                  onValueChange={(value) =>
                    setFilters({ ...filters, gender: value || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="همه" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">همه</SelectItem>
                    <SelectItem value="male">مرد</SelectItem>
                    <SelectItem value="female">زن</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={filters.consent_to_sms !== false}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, consent_to_sms: checked })
                    }
                  />
                  <Label>فقط بیماران با رضایت پیامک</Label>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={isPreviewing}
              className="w-full"
            >
              {isPreviewing ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Users className="w-4 h-4 ml-2" />
              )}
              پیش‌نمایش تعداد گیرندگان
            </Button>

            {showRecipients && recipientsCount !== undefined && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <span className="text-lg font-bold">{recipientsCount}</span>
                <span className="text-muted-foreground mr-2">بیمار یافت شد</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* زمان‌بندی */}
        <Card>
          <CardHeader>
            <CardTitle>زمان‌بندی ارسال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={scheduleLater}
                onCheckedChange={(checked) => setScheduleLater(checked)}
              />
              <Label>ارسال در زمان مشخص</Label>
            </div>

            {scheduleLater && (
              <div>
                <Label htmlFor="scheduled_date">تاریخ و زمان ارسال</Label>
                <Input
                  id="scheduled_date"
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
            )}

            {!scheduleLater && (
              <p className="text-sm text-muted-foreground">
                کمپین پس از تأیید، بلافاصله ارسال خواهد شد
              </p>
            )}
          </CardContent>
        </Card>

        {/* دکمه‌ها */}
        <div className="flex gap-4">
          <Button type="submit" disabled={updateCampaign.isPending} className="flex-1">
            {updateCampaign.isPending ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 ml-2" />
            )}
            ذخیره تغییرات
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            انصراف
          </Button>
        </div>
      </form>
    </div>
  );
}