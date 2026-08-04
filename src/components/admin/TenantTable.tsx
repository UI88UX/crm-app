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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Building2,
  Filter,
  X,
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<"active" | "inactive" | "suspended">("active");

  // فیلتر کردن مطب‌ها (جستجو + وضعیت + پلن)
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || tenant.status === statusFilter;
    const matchesPlan = planFilter === "all" || tenant.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">
            فعال
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="secondary" className="bg-gray-200 text-gray-700">
            غیرفعال
          </Badge>
        );
      case "suspended":
        return <Badge variant="destructive">تعلیق</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "free":
        return (
          <Badge variant="outline" className="text-gray-500">
            رایگان
          </Badge>
        );
      case "basic":
        return <Badge className="bg-blue-500 text-white">پایه</Badge>;
      case "premium":
        return <Badge className="bg-purple-500 text-white">پرمیوم</Badge>;
      case "enterprise":
        return <Badge className="bg-amber-500 text-white">سازمانی</Badge>;
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

  const handleStatusChange = async (
    id: string,
    status: "active" | "inactive" | "suspended"
  ) => {
    const result = await toggleTenantStatus(id, status);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("وضعیت مطب با موفقیت تغییر یافت");
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

  // شمارنده فیلترهای فعال
  const activeFiltersCount = [
    statusFilter !== "all",
    planFilter !== "all",
  ].filter(Boolean).length;

  // پاک کردن همه فیلترها
  const clearFilters = () => {
    setStatusFilter("all");
    setPlanFilter("all");
    setSearchTerm("");
  };

  return (
    <div className="space-y-4">
      {/* نوار جستجو و فیلترها */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="جستجوی مطب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">فیلترها:</span>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 text-sm">
              <SelectValue placeholder="وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              <SelectItem value="active">فعال</SelectItem>
              <SelectItem value="inactive">غیرفعال</SelectItem>
              <SelectItem value="suspended">تعلیق</SelectItem>
            </SelectContent>
          </Select>

          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[130px] h-9 text-sm">
              <SelectValue placeholder="پلن" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه پلن‌ها</SelectItem>
              <SelectItem value="free">رایگان</SelectItem>
              <SelectItem value="basic">پایه</SelectItem>
              <SelectItem value="premium">پرمیوم</SelectItem>
              <SelectItem value="enterprise">سازمانی</SelectItem>
            </SelectContent>
          </Select>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 ml-1" />
              پاک کردن ({activeFiltersCount})
            </Button>
          )}

          <Button
            onClick={() => router.push("/admin/tenants/new")}
            className="whitespace-nowrap"
          >
            افزودن مطب جدید
          </Button>
        </div>
      </div>

      {/* نتیجه جستجو */}
      <div className="text-sm text-muted-foreground">
        {filteredTenants.length} مطب از {tenants.length} مطب
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست مطب‌ها</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">نام مطب</TableHead>
                <TableHead className="text-right">اسلاگ</TableHead>
                <TableHead className="text-right">وضعیت</TableHead>
                <TableHead className="text-right">پلن</TableHead>
                <TableHead className="text-right">کاربران</TableHead>
                <TableHead className="text-right">بیماران</TableHead>
                <TableHead className="text-right">فروش</TableHead>
                <TableHead className="text-right">اعتبار</TableHead>
                <TableHead className="text-center">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                    {searchTerm ||
                    statusFilter !== "all" ||
                    planFilter !== "all"
                      ? "هیچ مطبی با فیلترهای انتخاب‌شده یافت نشد"
                      : "هیچ مطبی یافت نشد"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium text-right">
                      {tenant.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      {tenant.slug}
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(tenant.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getPlanBadge(tenant.plan)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span>
                          {tenant.users_count}/{tenant.max_users}
                        </span>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span>
                          {tenant.patients_count}/{tenant.max_patients}
                        </span>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span>
                          {formatCurrency(tenant.total_revenue || 0)}
                        </span>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDate(tenant.expires_at)}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/tenants/${tenant.id}`)
                            }
                          >
                            <Edit className="ml-2 h-4 w-4" />
                            ویرایش
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setNewStatus(
                                tenant.status as
                                  | "active"
                                  | "inactive"
                                  | "suspended"
                              );
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
              آیا از حذف مطب &quot;{selectedTenant?.name}&quot; مطمئن هستید؟ این
              عمل غیرقابل بازگشت است.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedTenant && handleDelete(selectedTenant.id)
              }
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
              وضعیت مطب &quot;{selectedTenant?.name}&quot; را انتخاب کنید
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 py-4">
            <Button
              variant={newStatus === "active" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setNewStatus("active")}
            >
              <CheckCircle className="ml-2 h-4 w-4" />
              فعال
            </Button>
            <Button
              variant={newStatus === "inactive" ? "secondary" : "outline"}
              className="flex-1"
              onClick={() => setNewStatus("inactive")}
            >
              <XCircle className="ml-2 h-4 w-4" />
              غیرفعال
            </Button>
            <Button
              variant={newStatus === "suspended" ? "destructive" : "outline"}
              className="flex-1"
              onClick={() => setNewStatus("suspended")}
            >
              <AlertCircle className="ml-2 h-4 w-4" />
              تعلیق
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
            >
              انصراف
            </Button>
            <Button
              onClick={() =>
                selectedTenant &&
                handleStatusChange(selectedTenant.id, newStatus)
              }
            >
              تایید
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}