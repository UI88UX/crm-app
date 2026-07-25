"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Users,
  UserCog,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Mail,
  Search,
} from "lucide-react";
import { updateUserRole, toggleSuperAdmin } from "@/lib/supabase/actions";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'audiologist' | 'receptionist' | 'user';
  is_super_admin: boolean;
  last_sign_in_at: string | null;
  created_at: string;
}

interface UsersClientProps {
  users: User[];
  currentUserId: string;
  isSuperAdmin: boolean;
}

export default function UsersClient({ users: initialUsers, currentUserId, isSuperAdmin }: UsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [filteredUsers, setFilteredUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // جستجو در کاربران
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredUsers(users);
      return;
    }

    const lowercasedTerm = term.toLowerCase().trim();
    const filtered = users.filter((user) => {
      const fullName = user.full_name.toLowerCase();
      const email = user.email.toLowerCase();
      return fullName.includes(lowercasedTerm) || email.includes(lowercasedTerm);
    });
    setFilteredUsers(filtered);
  };

  // تغییر نقش کاربر
  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isSuperAdmin) {
      toast.error("شما دسترسی لازم برای تغییر نقش کاربران را ندارید");
      return;
    }

    setIsLoading(true);
    const result = await updateUserRole(userId, newRole);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("نقش کاربر با موفقیت به‌روزرسانی شد");
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole as any } : u
      ));
      setFilteredUsers(filteredUsers.map(u => 
        u.id === userId ? { ...u, role: newRole as any } : u
      ));
    }
    setIsLoading(false);
  };

  // تغییر وضعیت super admin
  const handleSuperAdminToggle = async (userId: string, isSuperAdmin: boolean) => {
    if (!isSuperAdmin) {
      toast.error("شما دسترسی لازم برای این کار را ندارید");
      return;
    }

    if (userId === currentUserId) {
      toast.error("نمی‌توانید دسترسی خود را تغییر دهید");
      return;
    }

    setIsLoading(true);
    const result = await toggleSuperAdmin(userId, isSuperAdmin);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`دسترسی مدیرکل با موفقیت ${isSuperAdmin ? 'فعال' : 'غیرفعال'} شد`);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_super_admin: isSuperAdmin } : u
      ));
      setFilteredUsers(filteredUsers.map(u => 
        u.id === userId ? { ...u, is_super_admin: isSuperAdmin } : u
      ));
    }
    setIsLoading(false);
  };

  // رنگ نقش
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 border-red-200';
      case 'audiologist': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'receptionist': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // ترجمه نقش
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'مدیر';
      case 'audiologist': return 'شنوایی‌شناس';
      case 'receptionist': return 'پذیرش';
      default: return 'کاربر';
    }
  };

  // فرمت تاریخ
  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fa-IR');
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* هدر */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">مدیریت کاربران</h1>
          <p className="text-gray-500 mt-1">مدیریت کاربران و دسترسی‌های مطب</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Users className="w-4 h-4 ml-1" />
            {users.length} کاربر
          </Badge>
          {isSuperAdmin && (
            <Badge className="bg-purple-100 text-purple-700">
              <ShieldCheck className="w-4 h-4 ml-1" />
              مدیرکل
            </Badge>
          )}
        </div>
      </div>

      {/* جستجو */}
      <div className="relative w-full md:w-96">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="جستجو در کاربران..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* لیست کاربران */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            لیست کاربران
            {searchTerm && (
              <Badge variant="outline" className="mr-2">
                {filteredUsers.length} نتیجه
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? "هیچ کاربری با این جستجو یافت نشد" : "هیچ کاربری ثبت نشده است"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-lg border ${
                    user.id === currentUserId ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  } hover:shadow-md transition-shadow`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg">
                        {user.full_name}
                        {user.id === currentUserId && (
                          <Badge className="mr-2 bg-blue-500 text-white">شما</Badge>
                        )}
                      </span>
                      {user.is_super_admin && (
                        <Badge className="bg-purple-500 text-white">
                          <Shield className="w-3 h-3 ml-1" />
                          مدیرکل
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </span>
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      <span className="text-gray-400 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        آخرین ورود: {formatDate(user.last_sign_in_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3 lg:mt-0">
                    {/* تغییر نقش - فقط برای مدیران کل */}
                    {isSuperAdmin && user.id !== currentUserId && (
                      <select
                        className="px-3 py-1 border rounded-md text-sm bg-white"
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={isLoading}
                      >
                        <option value="admin">مدیر</option>
                        <option value="audiologist">شنوایی‌شناس</option>
                        <option value="receptionist">پذیرش</option>
                        <option value="user">کاربر</option>
                      </select>
                    )}

                    {/* تغییر دسترسی مدیرکل - فقط برای مدیران کل */}
                    {isSuperAdmin && user.id !== currentUserId && (
                      <Button
                        variant={user.is_super_admin ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => handleSuperAdminToggle(user.id, !user.is_super_admin)}
                        disabled={isLoading}
                        className="whitespace-nowrap"
                      >
                        {user.is_super_admin ? (
                          <>
                            <ShieldAlert className="w-4 h-4 ml-1" />
                            لغو مدیرکل
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 ml-1" />
                            مدیرکل
                          </>
                        )}
                      </Button>
                    )}

                    {/* نشان برای کاربر فعلی */}
                    {user.id === currentUserId && (
                      <Badge variant="outline" className="text-blue-600 border-blue-300">
                        <UserCog className="w-3 h-3 ml-1" />
                        کاربر فعلی
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}