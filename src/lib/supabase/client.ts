import { createBrowserClient } from "@supabase/ssr";

/**
 * کلاینت Supabase برای استفاده در کامپوننت‌های سمت مرورگر ("use client").
 *
 * فقط از anon key استفاده می‌کند، بنابراین قوانین RLS (Row Level Security)
 * روی همه‌ی درخواست‌ها اعمال می‌شوند. استفاده در هر Client Component امن است.
 *
 * مثال:
 *   "use client";
 *   import { createClient } from "@/lib/supabase/client";
 *   const supabase = createClient();
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
