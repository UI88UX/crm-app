// components/admin/TenantTable.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Search,
  Users,
  Activity,
  DollarSign,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { deleteTenant, toggleTenantStatus } from "@/lib/supabase/actions";

interface Tenant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  slug: string;
  license_key: string;
  plan: string;
  status: string;
  expires_at: string | null;
  max_users: number;
  max_patients: number;
  users_count: number;
  patients_count: number;
  sales_count: number;
  total_revenue: number;
  created_at: string;
}

interface TenantTableProps {
  tenants: Tenant[];
}

export function TenantTable({ tenants }: TenantTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'active' | 'inactive' | 'suspended'>('active');

  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">فعال</Badge>;
      case "inactive":
        return <Badge variant="secondary">غیرفعال</Badge>;
      case "suspended":
        return <Badge variant="destructive">تعلیق شده</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "free":
        return <Badge variant="outline">رایگان</Badge>;
      case "basic":
        return <Badge className="bg-blue-500">پایه</Badge>;
      case "premium":
        return <Badge className="bg-purple-500">پرمیوم</Badge>;
      case "enterprise":
        return <Badge className="bg-amber-500">سازمانی</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteTenant(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("مطب با موفقیت حذف شد");
      router.refresh();
    }
    setIsDeleteDialogOpen(false);
    setSelectedTenant(null);
  };

  const handleStatusChange = async (id: string, status: 'active' | 'inactive' | 'suspended') => {
    const result = await toggleTenantStatus(id, status);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`وضعیت مطب با موفقیت به ${status === 'active' ? 'فعال' : status === 'inactive' ? 'غیرفعال' : 'تعلیق'} تغییر یافت`);
      router.refresh();
    }
    setIsStatusDialogOpen(false);
    setSelectedTenant(null);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "نامحدود";
    return new Date(date).toLocaleDateString("fa-IR");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="جستجوی مطب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button onClick={() => router.push("/admin/tenants/new")}>
          افزودن مطب جدید
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست مطب‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام مطب</TableHead>
                <TableHead>اسلاگ</TableHead>
                <TableHead>پلن</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>کاربران</TableHead>
                <TableHead>بیماران</TableHead>
                <TableHead>فروش</TableHead>
                <TableHead>اعتبار</TableHead>
                <TableHead className="text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    هیچ مطبی یافت نشد
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell className="text-muted-foreground">{tenant.slug}</TableCell>
                    <TableCell>{getPlanBadge(tenant.plan)}</TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{tenant.users_count}/{tenant.max_users}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span>{tenant.patients_count}/{tenant.max_patients}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{formatCurrency(tenant.total_revenue || 0)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(tenant.expires_at)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                          >
                            <Edit className="ml-2 h-4 w-4" />
                            ویرایش
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setIsStatusDialogOpen(true);
                            }}
                          >
                            <AlertCircle className="ml-2 h-4 w-4" />
                            تغییر وضعیت
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="ml-2 h-4 w-4" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف مطب</DialogTitle>
            <DialogDescription>
              آیا از حذف مطب "{selectedTenant?.name}" مطمئن هستید؟ این عمل غیرقابل بازگشت است.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedTenant && handleDelete(selectedTenant.id)}
            >
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر وضعیت مطب</DialogTitle>
            <DialogDescription>
              وضعیت مطب "{selectedTenant?.name}" را انتخاب کنید
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 py-4">
            <Button
              variant={selectedTenant?.status === "active" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setNewStatus("active")}
            >
              <CheckCircle className="ml-2 h-4 w-4" />
              فعال
            </Button>
            <Button
              variant={selectedTenant?.status === "inactive" ? "secondary" : "outline"}
              className="flex-1"
              onClick={() => setNewStatus("inactive")}
            >
              <XCircle className="ml-2 h-4 w-4" />
              غیرفعال
            </Button>
            <Button
              variant={selectedTenant?.status === "suspended" ? "destructive" : "outline"}
              className="flex-1"
              onClick={() => setNewStatus("suspended")}
            >
              <AlertCircle className="ml-2 h-4 w-4" />
              تعلیق
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              انصراف
            </Button>
            <Button
              onClick={() => selectedTenant && handleStatusChange(selectedTenant.id, newStatus)}
            >
              تایید
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}