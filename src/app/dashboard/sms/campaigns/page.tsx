// src/app/dashboard/sms/campaigns/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Send, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toJalaliDisplay } from "@/lib/util/jalaliDate";

interface Campaign {
  id: string;
  name: string;
  content: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}

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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/sms/campaigns");
      const result = await response.json();
      
      if (response.ok) {
        setCampaigns(result.data || []);
      } else {
        toast.error(result.error || "خطا در دریافت کمپین‌ها");
      }
    } catch (error) {
      toast.error("خطا در دریافت کمپین‌ها");
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async (id: string) => {
    if (!confirm("آیا از ارسال این کمپین اطمینان دارید؟")) return;

    setSending(id);
    try {
      const response = await fetch(`/api/sms/campaigns/${id}/send`, {
        method: "POST",
      });
      const result = await response.json();

      if (response.ok) {
        toast.success("کمپین با موفقیت ارسال شد");
        fetchCampaigns();
      } else {
        toast.error(result.error || "خطا در ارسال کمپین");
      }
    } catch (error) {
      toast.error("خطا در ارسال کمپین");
    } finally {
      setSending(null);
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`آیا از حذف کمپین "${name}" اطمینان دارید؟`)) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/sms/campaigns/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (response.ok) {
        toast.success("کمپین با موفقیت حذف شد");
        fetchCampaigns();
      } else {
        toast.error(result.error || "خطا در حذف کمپین");
      }
    } catch (error) {
      toast.error("خطا در حذف کمپین");
    } finally {
      setDeleting(null);
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
                {campaigns.map((campaign) => (
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
                        {/* دکمه ارسال (فقط برای پیش‌نویس) */}
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendCampaign(campaign.id)}
                            disabled={sending === campaign.id}
                            title="ارسال کمپین"
                          >
                            {sending === campaign.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        )}

                        {/* دکمه مشاهده */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/sms/campaigns/${campaign.id}`)}
                          title="مشاهده جزئیات"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* دکمه ویرایش (فقط برای پیش‌نویس و برنامه‌ریزی شده) */}
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

                        {/* دکمه حذف */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                          disabled={deleting === campaign.id}
                          title="حذف کمپین"
                        >
                          {deleting === campaign.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}