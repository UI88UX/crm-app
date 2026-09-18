// src/lib/auth/permissions.ts

// ============================================
// Types
// ============================================
export type UserRole = 'admin' | 'user';

export interface UserPermissions {
    can_delete: boolean;
    can_manage_sms: boolean;
    can_view_reports: boolean;
}

export interface CurrentPermissions {
    role: UserRole;
    is_active: boolean;
    permissions: UserPermissions;
}

// ============================================
// پیش‌فرض‌ها
// ============================================
export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
    can_delete: true,
    can_manage_sms: true,
    can_view_reports: true,
};

export const ADMIN_PERMISSIONS: UserPermissions = {
    can_delete: true,
    can_manage_sms: true,
    can_view_reports: true,
};

// ============================================
// نقشه مسیرها و دسترسی موردنیاز
// ============================================
export interface RouteAccess {
    pattern: string;
    label: string;
    requiresAdmin?: boolean;               // 🔒 قفل: فقط admin
    requiredPermission?: keyof UserPermissions;
}
export const ROUTE_ACCESS: RouteAccess[] = [
    // 🔒 مسیرهای خاص اول (طولانی‌ترها اول)
    {
        pattern: '/dashboard/sms/campaigns',
        label: 'کمپین‌های پیامکی',
        requiredPermission: 'can_manage_sms',
    },
    {
        pattern: '/dashboard/sms/reports',
        label: 'گزارش‌های پیامکی',
        requiredPermission: 'can_view_reports',
    },
    {
        pattern: '/dashboard/sms/settings',
        label: 'تنظیمات پیامک',
        requiredPermission: 'can_manage_sms',
    },
    {
        pattern: '/dashboard/call-followups',
        label: 'پیگیری تلفنی',
    },
    {
        pattern: '/dashboard/appointments',
        label: 'نوبت‌ها',
    },
    {
        pattern: '/dashboard/patients',
        label: 'بیماران',
    },
    {
        pattern: '/dashboard/sales',
        label: 'فروش',
    },
    {
        pattern: '/dashboard/users',
        label: 'مدیریت کاربران',
        requiresAdmin: true, // 🔒 فقط admin
    },
    // داشبورد رو آخر بذار (چون با همه match می‌کنه)
    {
        pattern: '/dashboard',
        label: 'داشبورد',
    },
];

// ============================================
// Helper Functions
// ============================================

/**
 * آیا کاربر admin است؟
 */
export function isAdmin(role: UserRole | null | undefined): boolean {
    return role === 'admin';
}

/**
 * آیا کاربر می‌تواند به مدیریت کاربران دسترسی داشته باشد؟
 * - admin: ✅
 * - user: ❌ همیشه (غیرقابل تغییر)
 */
export function canManageUsers(role: UserRole | null | undefined): boolean {
    return role === 'admin';
}

/**
 * بررسی یک permission خاص
 */
export function hasPermission(
    role: UserRole | null | undefined,
    permissions: Partial<UserPermissions> | null | undefined,
    key: keyof UserPermissions
): boolean {
    // admin همیشه همه دسترسی‌ها رو داره
    if (role === 'admin') return true;

    // برای user، از permissions استفاده کن
    const userPerms = { ...DEFAULT_USER_PERMISSIONS, ...(permissions || {}) };
    return userPerms[key] === true;
}

/**
 * بررسی دسترسی به یک مسیر
 */
export function canAccessRoute(
    pathname: string,
    role: UserRole | null | undefined,
    permissions: Partial<UserPermissions> | null | undefined
): boolean {
    // پیدا کردن دقیق‌ترین route بر اساس طولانی‌ترین pattern
    const matchingRoutes = ROUTE_ACCESS.filter(
        (r) => pathname === r.pattern || pathname.startsWith(r.pattern + '/')
    );

    // مرتب‌سازی نزولی بر اساس طول pattern (بلندترین = دقیق‌ترین)
    const route = matchingRoutes.sort(
        (a, b) => b.pattern.length - a.pattern.length
    )[0];

    if (!route) return true;

    // 🔒 قفل: requiresAdmin
    if (route.requiresAdmin) {
        return canManageUsers(role);
    }

    // بررسی permission
    if (route.requiredPermission) {
        return hasPermission(role, permissions, route.requiredPermission);
    }

    return true;
}

/**
 * برچسب فارسی برای هر permission
 */
export const PERMISSION_LABELS: Record<keyof UserPermissions, {
    label: string;
    description: string;
}> = {
    can_delete: {
        label: 'حذف رکوردها',
        description: 'حذف بیماران، فروش‌ها و نوبت‌ها',
    },
    can_manage_sms: {
        label: 'مدیریت پیامک',
        description: 'ارسال کمپین‌ها و تنظیمات پیامکی',
    },
    can_view_reports: {
        label: 'مشاهده گزارش‌ها',
        description: 'دسترسی به گزارش‌های آماری',
    },
};