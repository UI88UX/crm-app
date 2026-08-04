// app/admin/users/page.tsx
"use client";

import { useState,useEffect } from "react";
import { getAllUsers } from "@/lib/supabase/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Calendar, Mail, UserCircle, Search } from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string;
  specialty: string;
  is_active: boolean;
  is_super_admin: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // بارگذاری داده‌ها در سمت کلاینت
  useEffect(() => {
    const loadUsers = async () => {
      const { data, error } = await getAllUsers();
      if (error) {
        setError(error);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    };
    loadUsers();
  }, []);

  // فیلتر کردن کاربران
  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.role.toLowerCase().includes(search) ||
      user.specialty.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">کاربران</h1>
        <p className="text-gray-500 mt-1">لیست تمام کاربران سیستم</p>
      </div>

      {/* نوار جستجو */}
      <div className="relative w-full md:w-72">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="جستجوی کاربر..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10 border-gray-200 focus:border-blue-500"
        />
      </div>

      {/* نتیجه جستجو */}
      <div className="text-sm text-gray-500">
        {filteredUsers.length} کاربر از {users.length} کاربر
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-800">همه کاربران</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-red-500">خطا: {error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="text-right text-xs font-medium text-gray-500 uppercase">کاربر</TableHead>
                    <TableHead className="text-right text-xs font-medium text-gray-500 uppercase">ایمیل</TableHead>
                    <TableHead className="text-right text-xs font-medium text-gray-500 uppercase">نقش</TableHead>
                    <TableHead className="text-right text-xs font-medium text-gray-500 uppercase">وضعیت</TableHead>
                    <TableHead className="text-right text-xs font-medium text-gray-500 uppercase">تاریخ ثبت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                        <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        {searchTerm ? "هیچ کاربری با عبارت جستجو یافت نشد" : "هیچ کاربری یافت نشد"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserCircle className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user.full_name}</div>
                              <div className="text-sm text-gray-500">{user.specialty || "بدون تخصص"}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-700">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.is_super_admin ? (
                            <Badge variant="destructive" className="bg-red-500">مدیرکل</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                              {user.role === "admin" ? "مدیر" : user.role === "audiologist" ? "شنوایی‌شناس" : "کاربر"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? "default" : "outline"} 
                            className={user.is_active ? "bg-emerald-500" : "bg-gray-100 text-gray-500"}>
                            {user.is_active ? "فعال" : "غیرفعال"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Calendar className="h-3 w-3" />
                            {new Date(user.created_at).toLocaleDateString("fa-IR")}
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