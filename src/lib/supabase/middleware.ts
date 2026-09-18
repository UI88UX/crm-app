// src/lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canAccessRoute } from "@/lib/auth/permissions";

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  // اگه کلیدهای Supabase تنظیم نشده، از middleware عبور کن
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

  // گرفتن اطلاعات کاربر
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname.startsWith("/login");
  const isAuthApi = pathname.startsWith("/api/auth");
  const isApiRoute = pathname.startsWith("/api");

  // ✅ بررسی is_active کاربر
  if (user) {
    const { data: isActive, error: activeError } = await supabase.rpc(
      "get_my_active_status"
    );

    console.log(
      "🔍 [middleware] user:",
      user.id,
      "| path:",
      pathname,
      "| isActive:",
      isActive,
      "| error:",
      activeError?.message
    );

    // اگر کاربر غیرفعال است
    if (isActive === false) {
      // ✅ اگر در صفحه login هستیم، اجازه بده بماند (تا بتونه پیام ببینه)
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

      // در همه صفحات دیگر → redirect به login
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
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  // کاربر مهمان → هدایت به لاگین
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  // کاربر وارد شده → هدایت از صفحات auth به داشبورد
  // ⚠️ ولی اگر کاربر غیرفعاله، این کار رو نکن (که حلقه ایجاد نشه)
  if (user && isAuthRoute && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // ============================================
  // ✅ [گام H] چک دسترسی مسیر بر اساس نقش و permissions
  // ============================================
  // فقط برای:
  //   - کاربر لاگین‌کرده
  //   - مسیرهای محافظت‌شده (dashboard/admin)
  //   - صفحات غیر از login/register/forgot-password
  //   - API routes رو مستثنی می‌کنیم (خودشون auth چک می‌کنن)
  if (user && isProtected && !isAuthRoute && !isApiRoute) {
    const { data: permsData, error: permsError } = await supabase.rpc(
      "get_my_permissions"
    );

    if (permsError) {
      console.error(
        "❌ [middleware] get_my_permissions error:",
        permsError.message
      );
    }

    if (permsData) {
      const hasAccess = canAccessRoute(
        pathname,
        permsData.role,
        permsData.permissions
      );

      // ✅ فقط اگه کاربر از قبل در /dashboard نیست (که حلقه نشه)
      if (!hasAccess && pathname !== "/dashboard") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.searchParams.set("error", "access_denied");
        return NextResponse.redirect(url);
      }
    }
  }

  // ✅ اگر کاربر غیرفعاله و در login هست، توی login بمونه
  return supabaseResponse;
}