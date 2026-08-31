"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowRight, Save, Loader2, Users, Send, Calendar } from "lucide-react";
import { toast } from "sonner";

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
import { Badge } from "@/components/ui/badge";

interface Campaign {
  id: string;
  name: string;
  content: string;
  filters: any;
  total_recipients: number;
  status: string;
  scheduled_at: string | null;
}

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [filters, setFilters] = useState<any>({});
  const [scheduleLater, setScheduleLater] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [recipientsCount, setRecipientsCount] = useState<number | null>(null);
  const [showRecipients, setShowRecipients] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/sms/campaigns/${id}`);
      const result = await response.json();

      if (response.ok) {
        setName(result.data.name);
        setContent(result.data.content);
        setFilters(result.data.filters || {});
        if (result.data.scheduled_at) {
          setScheduleLater(true);
          setScheduledDate(result.data.scheduled_at);
        }
        setRecipientsCount(result.data.total_recipients);
      } else {
        toast.error(result.error || "خطا در دریافت اطلاعات");
        router.push("/dashboard/sms/campaigns");
      }
    } catch (error) {
      toast.error("خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      const response = await fetch("/api/sms/patients/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters }),
      });
      const result = await response.json();

      if (response.ok) {
        setRecipientsCount(result.count || 0);
        setShowRecipients(true);
        toast.success(`${result.count || 0} بیمار یافت شد`);
      } else {
        toast.error(result.error || "خطا در پیش‌نمایش");
      }
    } catch (error) {
      toast.error("خطا در پیش‌نمایش");
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

    setSaving(true);
    try {
      const response = await fetch(`/api/sms/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          content,
          filters,
          scheduled_at: scheduleLater ? scheduledDate : null,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        toast.success("کمپین با موفقیت ویرایش شد");
        router.push(`/dashboard/sms/campaigns/${id}`);
      } else {
        toast.error(result.error || "خطا در ویرایش کمپین");
      }
    } catch (error) {
      toast.error("خطا در ویرایش کمپین");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
                    onCheckedChange={(checked: boolean) =>
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
              className="w-full"
            >
              <Users className="w-4 h-4 ml-2" />
              پیش‌نمایش تعداد گیرندگان
            </Button>

            {showRecipients && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <span className="text-lg font-bold">{recipientsCount ?? 0}</span>
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
                onCheckedChange={(checked: boolean) => setScheduleLater(checked)}
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
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? (
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