// src/app/dashboard/sms/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

// ✅ ایمپورت React Query
import { useSmsSettings, useUpdateSmsSettings } from "@/hooks/useSmsSettings";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SmsSettingsPage() {
  // State محلی برای فرم
  const [settings, setSettings] = useState({
    is_enabled: true,
    max_messages_per_month: 10,
    allowed_start_hour: 9,
    allowed_end_hour: 20,
    enable_birthday_alerts: true,
    enable_hearing_aid_followup: true,
    clinic_name: "",
  });

  // ✅ React Query
  const { data: fetchedSettings, isLoading, isError, error, refetch } = useSmsSettings();
  const updateSettings = useUpdateSmsSettings();

  // پر کردن فرم با داده‌های دریافتی
  useEffect(() => {
    if (fetchedSettings) {
      setSettings({
        is_enabled: fetchedSettings.is_enabled ?? true,
        max_messages_per_month: fetchedSettings.max_messages_per_month ?? 10,
        allowed_start_hour: fetchedSettings.allowed_start_hour ?? 9,
        allowed_end_hour: fetchedSettings.allowed_end_hour ?? 20,
        enable_birthday_alerts: fetchedSettings.enable_birthday_alerts ?? true,
        enable_hearing_aid_followup: fetchedSettings.enable_hearing_aid_followup ?? true,
        clinic_name: fetchedSettings.clinic_name || "",
      });
    }
  }, [fetchedSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    updateSettings.mutate(settings, {
      onSuccess: () => {
        toast.success("تنظیمات با موفقیت ذخیره شد");
        refetch(); // به‌روزرسانی کش
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
  if (isError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error?.message || "خطا در دریافت تنظیمات"}</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">تنظیمات پیامک</h1>
        <p className="text-sm text-muted-foreground mt-1">
          مدیریت سیاست‌های ارسال پیامک
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* فعال/غیرفعال */}
        <Card>
          <CardHeader>
            <CardTitle>وضعیت کلی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.is_enabled}
                onCheckedChange={(checked: boolean) =>
                  setSettings({ ...settings, is_enabled: checked })
                }
              />
              <Label>سیستم پیامک فعال باشد</Label>
            </div>
          </CardContent>
        </Card>

        {/* سقف ارسال */}
        <Card>
          <CardHeader>
            <CardTitle>سقف ارسال</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="max_messages">حداکثر پیامک در ماه برای هر بیمار</Label>
              <Input
                id="max_messages"
                type="number"
                min={1}
                max={50}
                value={settings.max_messages_per_month}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    max_messages_per_month: parseInt(e.target.value) || 10,
                  })
                }
                className="mt-1 w-32"
              />
              <p className="text-xs text-muted-foreground mt-1">
                پیش‌فرض: ۱۰ پیامک در ماه
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ساعات مجاز */}
        <Card>
          <CardHeader>
            <CardTitle>ساعات مجاز ارسال</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_hour">از ساعت</Label>
                <Input
                  id="start_hour"
                  type="number"
                  min={0}
                  max={23}
                  value={settings.allowed_start_hour}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      allowed_start_hour: parseInt(e.target.value) || 9,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end_hour">تا ساعت</Label>
                <Input
                  id="end_hour"
                  type="number"
                  min={0}
                  max={23}
                  value={settings.allowed_end_hour}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      allowed_end_hour: parseInt(e.target.value) || 20,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              پیامک‌ها فقط در این بازه زمانی ارسال می‌شوند
            </p>
          </CardContent>
        </Card>

        {/* قابلیت‌ها */}
        <Card>
          <CardHeader>
            <CardTitle>قابلیت‌ها</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.enable_birthday_alerts}
                onCheckedChange={(checked: boolean) =>
                  setSettings({ ...settings, enable_birthday_alerts: checked })
                }
              />
              <Label>تبریک تولد خودکار</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.enable_hearing_aid_followup}
                onCheckedChange={(checked: boolean) =>
                  setSettings({ ...settings, enable_hearing_aid_followup: checked })
                }
              />
              <Label>یادآوری سرویس سمعک</Label>
            </div>
          </CardContent>
        </Card>

        {/* نام مطب */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات مطب</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="clinic_name">نام مطب</Label>
              <Input
                id="clinic_name"
                value={settings.clinic_name}
                onChange={(e) =>
                  setSettings({ ...settings, clinic_name: e.target.value })
                }
                placeholder="مثلاً: کلینیک شنوایی‌سنجی"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                این نام در متن پیامک‌ها استفاده می‌شود
              </p>
            </div>
          </CardContent>
        </Card>

        {/* دکمه ذخیره */}
        <Button type="submit" disabled={updateSettings.isPending} className="w-full">
          {updateSettings.isPending ? (
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 ml-2" />
          )}
          ذخیره تنظیمات
        </Button>
      </form>
    </div>
  );
}