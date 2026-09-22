// src/lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { UserPermissions, canAccessRoute } from "@/lib/auth/permissions";

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname.startsWith("/login");
  const isAuthApi = pathname.startsWith("/api/auth");
  const isApiRoute = pathname.startsWith("/api");
  const isAdminLoginPage = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin");

  // ============ گرفتن permissions (حتی برای کاربر مهمان undefined می‌مونه) ============
  let permsData: {
    role?: 'admin' | 'user';
    is_active?: boolean;
    is_super_admin?: boolean;
    permissions?: Partial<UserPermissions>;
  } | null = null;

  if (user) {
    const { data, error: permsError } = await supabase.rpc(
      "get_my_permissions"
    );
    permsData = data;

    console.log(
      "🔍 [middleware] user:", user.id,
      "| path:", pathname,
      "| isActive:", permsData?.is_active,
      "| isSuperAdmin:", permsData?.is_super_admin,
      "| error:", permsError?.message
    );

    // ❌ اگر غیرفعال است
    if (permsData?.is_active === false) {
      if (isLoginPage) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.error("signOut failed:", e);
        }
        const response = NextResponse.next({ request });
        const cookiesToClear = request.cookies.getAll().filter((c) =>
          c.name.startsWith("sb-")
        );
        for (const cookie of cookiesToClear) {
          response.cookies.delete(cookie.name);
        }
        return response;
      }

      if (!isAuthApi) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.error("signOut failed:", e);
        }
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "account_disabled");
        const response = NextResponse.redirect(url);
        const cookiesToClear = request.cookies.getAll().filter((c) =>
          c.name.startsWith("sb-")
        );
        for (const cookie of cookiesToClear) {
          response.cookies.delete(cookie.name);
        }
        return response;
      }
    }

    // ✅ چک دسترسی مسیرهای dashboard (بدون /admin)
    if (
      permsData &&
      !isLoginPage &&
      !isAuthApi &&
      !isApiRoute &&
      !isAdminRoute
    ) {
      const hasAccess = canAccessRoute(
        pathname,
        permsData.role,
        permsData.permissions
      );

      if (!hasAccess && pathname !== "/dashboard") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.searchParams.set("error", "access_denied");
        return NextResponse.redirect(url);
      }
    }
  }

  // 🆕 محافظت از /admin/* — فقط super_admin
  // ⚠️ /admin/login رو همیشه آزاد بذار
  if (
    isAdminRoute &&
    !isAdminLoginPage && // ← کلید حل مشکل
    !isLoginPage &&
    !isApiRoute
  ) {
    // ۱. کاربر مهمان ← /admin/login
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    // 🆕 اگه سوپر ادمین لاگین‌کرده در /admin/login هست → برو /admin/tenants
    if (user && isAdminLoginPage && permsData?.is_super_admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/tenants";
      return NextResponse.redirect(url);
    }

    // ۲. کاربر لاگین‌کرده ولی super_admin نیست
    if (user && !permsData?.is_super_admin) {
      console.log("❌ [middleware] Non-super-admin tried to access /admin");
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "not_super_admin");
      return NextResponse.redirect(url);
    }
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  // کاربر مهمان ← login
  if (!user && isProtected) {
    // ⚠️ /admin/login و /login رو مستثنی کن
    if (isLoginPage || isAdminLoginPage) {
      return supabaseResponse; // اجازه بده باز بشه
    }

    const url = request.nextUrl.clone();
    if (isAdminRoute) {
      url.pathname = "/admin/login";
    } else {
      url.pathname = "/login";
      url.searchParams.set("redirectedFrom", pathname);
    }
    return NextResponse.redirect(url);
  }

  // کاربر وارد شده ← هدایت از صفحات auth (به جز login)
  if (user && isAuthRoute && !isLoginPage && !isAdminLoginPage) {
    // ⚠️ اگه super_admin هست، به /admin، وگرنه به داشبورد
    if (permsData?.is_super_admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/tenants";
      return NextResponse.redirect(url);
    }
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}