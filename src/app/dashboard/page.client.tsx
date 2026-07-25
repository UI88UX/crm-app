"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  ShoppingBag, 
  TrendingUp,
  Activity,
  Plus,
  Eye
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  total_patients: number;
  total_appointments: number;
  total_sales: number;
  total_revenue: number;
  recent_activity_count: number;
  conversion_rate: number;
}

interface Activity {
  id: string;
  user_email: string;
  action: string;
  table_name: string;
  created_at: string;
}

interface RecentSale {
  id: string;
  hearing_aid_model: string;
  price: number;
  sale_date: string;
  patient: {
    first_name: string;
    last_name: string;
  };
}

interface Props {
  stats: DashboardStats | null;
  activities: Activity[];
  recentSales: RecentSale[];
}

export default function DashboardClient({ stats, activities, recentSales }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // کارت‌های آمار
  const statCards = [
    {
      title: "کل بیماران",
      value: stats?.total_patients || 0,
      icon: Users,
      color: "bg-blue-500",
      link: "/dashboard/patients"
    },
    {
      title: "نوبت‌ها",
      value: stats?.total_appointments || 0,
      icon: Calendar,
      color: "bg-green-500",
      link: "/dashboard/appointments"
    },
    {
      title: "فروش",
      value: stats?.total_sales || 0,
      icon: ShoppingBag,
      color: "bg-purple-500",
      link: "/dashboard/sales"
    },
    {
      title: "درآمد کل",
      value: stats?.total_revenue 
        ? new Intl.NumberFormat('fa-IR').format(stats.total_revenue) + ' تومان'
        : '0 تومان',
      icon: TrendingUp,
      color: "bg-orange-500",
      link: "/dashboard/sales"
    }
  ];

  // رنگ اکشن
  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-green-100 text-green-700';
      case 'UPDATE': return 'bg-blue-100 text-blue-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // ترجمه اکشن
  const getActionLabel = (action: string) => {
    switch (action) {
      case 'INSERT': return 'ثبت';
      case 'UPDATE': return 'ویرایش';
      case 'DELETE': return 'حذف';
      default: return action;
    }
  };

  // ترجمه جدول
  const getTableLabel = (table: string) => {
    switch (table) {
      case 'patients': return 'بیمار';
      case 'sales': return 'فروش';
      case 'appointments': return 'نوبت';
      default: return table;
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* هدر */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">داشبورد</h1>
          <p className="text-gray-500 mt-1">خلاصه وضعیت مطب شما</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/patients/new">
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              بیمار جدید
            </Button>
          </Link>
        </div>
      </div>

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <Link href={card.link} key={index}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${card.color} text-white`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* نرخ تبدیل */}
      {stats?.conversion_rate !== undefined && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">نرخ تبدیل (فروش به بیمار)</p>
                <p className="text-2xl font-bold">{stats.conversion_rate}%</p>
              </div>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${Math.min(stats.conversion_rate, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* دو ستون: فعالیت‌ها و فروش‌های اخیر */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* فعالیت‌های اخیر */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              فعالیت‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-gray-500 text-center py-8">هیچ فعالیتی ثبت نشده است</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activities.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={getActionColor(activity.action)}>
                        {getActionLabel(activity.action)}
                      </Badge>
                      <span className="text-sm">{getTableLabel(activity.table_name)}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {activity.user_email}
                      <span className="mx-2">•</span>
                      {new Date(activity.created_at).toLocaleTimeString('fa-IR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* فروش‌های اخیر */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              آخرین فروش‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <p className="text-gray-500 text-center py-8">هیچ فروشی ثبت نشده است</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentSales.map((sale) => (
                  <div 
                    key={sale.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {sale.patient.first_name} {sale.patient.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{sale.hearing_aid_model}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-green-600">
                        {new Intl.NumberFormat('fa-IR').format(sale.price)} تومان
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(sale.sale_date).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}