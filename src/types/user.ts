// src/types/user.ts

import { UserPermissions } from "@/lib/auth/permissions";

// ============================================
// User Types (Multi-Tenant)
// ============================================

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  tenant_id: string | null;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  specialty: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_super_admin: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  permissions: UserPermissions;
  email?: string;
}

/**
 * فرم ایجاد کاربر جدید
 */
export interface UserFormData {
  email: string;
  password: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  permissions?: UserPermissions;
}

/**
 * فرم ویرایش کاربر
 */
export interface UserUpdateData {
  full_name?: string;
  phone?: string | null;
  role?: UserRole;
  is_active?: boolean;
  permissions?: UserPermissions; 
}

/**
 * اطلاعات محدودیت کاربران Tenant
 */
export interface UserLimitInfo {
  current_users: number;
  max_users: number;
  remaining: number;
  is_at_limit: boolean;
  can_add_user: boolean;
}

/**
 * خروجی API: لیست کاربران + اطلاعات limit
 */
export interface UsersListResponse {
  users: User[];
  limit: UserLimitInfo;
}

// ============================================
// Constants
// ============================================

export const USER_ROLES: {
  value: UserRole;
  label: string;
  description: string;
}[] = [
  {
    value: 'admin',
    label: 'مدیر',
    description: 'دسترسی کامل به همه بخش‌های سیستم',
  },
  {
    value: 'user',
    label: 'کاربر',
    description: 'دسترسی به بیماران، نوبت‌ها، پذیرش و فروش',
  },
];

export const USER_ROLE_MAP: Record<UserRole, { label: string; description: string }> = {
  admin: {
    label: 'مدیر',
    description: 'دسترسی کامل به همه بخش‌های سیستم',
  },
  user: {
    label: 'کاربر',
    description: 'دسترسی به بیماران، نوبت‌ها، پذیرش و فروش',
  },
};

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  user: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
};