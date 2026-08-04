// app/admin/stats/page.tsx
import { getAdminStats } from "@/lib/supabase/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Users, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";

export default async function StatsPage() {
  const { data: stats, error } = await getAdminStats();

  // تبدیل stats به آرایه با استفاده از as any[]
  const statsArray = (stats as any[]) || [];
  
  // محاسبه مجموع کل
  const totalPatients = statsArray.reduce((sum: number, s: any) => sum + (s.total_patients || 0), 0);
  const totalSales = statsArray.reduce((sum: number, s: any) => sum + (s.total_sales || 0), 0);
  const totalRevenue = statsArray.reduce((sum: number, s: any) => sum + (Number(s.total_revenue) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">آمار کلی</h1>
        <p className="text-gray-500 mt-1">آمار تمام مطب‌های ثبت شده در سیستم</p>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">تعداد مطب‌ها</p>
                <p className="text-2xl font-bold text-blue-900">{statsArray.length || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">کل بیماران</p>
                <p className="text-2xl font-bold text-emerald-900">{totalPatients}</p>
              </div>
              <Users className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">کل فروش</p>
                <p className="text-2xl font-bold text-purple-900">{totalSales}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">کل درآمد</p>
                <p className="text-2xl font-bold text-amber-900">
                  {new Intl.NumberFormat("fa-IR").format(totalRevenue)} تومان
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول جزئیات */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-800">جزئیات مطب‌ها</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-red-500">خطا: {error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="text-right text-xs font-medium text-gray-500 uppercase">مطب</TableHead>
                    <TableHead className="text-right text-xs font-medium text-gray-500 uppercase">بیماران</TableHead>
                    <TableHead className="text-right text-xs font-medium text-gray-500 uppercase">فروش</TableHead>
                    <TableHead className="text-right text-xs font-medium text-gray-500 uppercase">درآمد</TableHead>
                    <TableHead className="text-right text-xs font-medium text-gray-500 uppercase">نرخ تبدیل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsArray.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                        <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        هیچ آماری موجود نیست
                      </TableCell>
                    </TableRow>
                  ) : (
                    statsArray.map((stat: any) => (
                      <TableRow key={stat.tenant_id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-gray-900">{stat.tenant_name}</TableCell>
                        <TableCell>
                          <span className="font-medium">{stat.total_patients || 0}</span>
                          <span className="text-gray-400 text-sm"> بیمار</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{stat.total_sales || 0}</span>
                          <span className="text-gray-400 text-sm"> فروش</span>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {new Intl.NumberFormat("fa-IR").format(Number(stat.total_revenue) || 0)} تومان
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${Math.min(Number(stat.conversion_rate) || 0, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{Number(stat.conversion_rate) || 0}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}