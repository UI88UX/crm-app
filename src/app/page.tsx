import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  Database,
  FileLock2,
  KeyRound,
  LayoutDashboard,
  PanelsTopLeft,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";

// این یک Server Component است، پس می‌تواند متغیرهای محیطی سرور را بخواند.
function getEnvStatus() {
  return [
    {
      key: "NEXT_PUBLIC_SUPABASE_URL",
      label: "آدرس پروژه Supabase",
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      scope: "عمومی",
    },
    {
      key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      label: "کلید anon (عمومی)",
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      scope: "عمومی",
    },
    {
      key: "SUPABASE_SERVICE_ROLE_KEY",
      label: "کلید service role (محرمانه)",
      ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      scope: "سرور",
    },
    {
      key: "BACKUP_CRON_SECRET",
      label: "راز بکاپ/کرون",
      ok: Boolean(process.env.BACKUP_CRON_SECRET),
      scope: "سرور",
    },
  ];
}

const SCAFFOLD_STEPS = [
  {
    icon: Boxes,
    title: "Next.js 15 · App Router · TypeScript",
    desc: "ساختار پروژه با Tailwind و shadcn/ui آماده شد.",
  },
  {
    icon: Database,
    title: "کلاینت‌های Supabase",
    desc: "client / server / admin به‌صورت جداگانه پیاده‌سازی شدند.",
  },
  {
    icon: ShieldCheck,
    title: "Middleware محافظت از مسیرها",
    desc: "تازه‌سازی session و هدایت کاربر مهمان به /login.",
  },
  {
    icon: PanelsTopLeft,
    title: "Providerها",
    desc: "ThemeProvider و Toaster در layout ریشه فعال شدند.",
  },
];

export default function Home() {
  const env = getEnvStatus();
  const configuredCount = env.filter((e) => e.ok).length;
  const allConfigured = configuredCount === env.length;

  return (
    <div
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-background text-foreground"
    >
      {/* پس‌زمینه: شبکه نقطه‌ای + هاله رنگی */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:radial-gradient(hsl(var(--foreground)/0.12)_1px,transparent_1px)] [background-size:22px_22px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-emerald-500/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-sky-500/10 blur-[120px]"
      />

      <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-10 sm:px-8">
        {/* نوار بالا */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-foreground text-background shadow-sm">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">سامانه CRM</p>
              <p className="text-xs text-muted-foreground">
                مدیریت ارتباط با مشتری
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            مرحله ۰ — راه‌اندازی
          </Badge>
        </header>

        {/* بخش معرفی */}
        <section className="mt-14 max-w-2xl sm:mt-20">
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-5xl">
            ساختار اولیه پروژه با موفقیت آماده شد
          </h1>
          <p className="mt-4 text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            پایه‌ی فنی CRM شما روی Next.js و Supabase بنا شد. برای فعال‌شدن احراز
            هویت و دیتابیس، کافی است کلیدهای Supabase را در فایل{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.8em]">
              .env.local
            </code>{" "}
            قرار دهید.
          </p>
        </section>

        {/* کارت‌ها */}
        <section className="mt-12 grid flex-1 gap-5 lg:grid-cols-5">
          {/* چک‌لیست ساخت */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">آنچه پیاده‌سازی شد</CardTitle>
              <CardDescription>
                اجزای اصلی مرحله صفر که آماده استفاده‌اند.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {SCAFFOLD_STEPS.map((step, i) => (
                <div key={step.title}>
                  <div className="flex items-start gap-3 py-2.5">
                    <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted">
                      <step.icon className="h-[18px] w-[18px] text-foreground/80" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {step.title}
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                  {i < SCAFFOLD_STEPS.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* وضعیت متغیرهای محیطی */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <KeyRound className="h-4 w-4" />
                متغیرهای محیطی
              </CardTitle>
              <CardDescription>
                {allConfigured
                  ? "همه‌ی کلیدها تنظیم شده‌اند."
                  : `${configuredCount} از ${env.length} کلید تنظیم شده است.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {env.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-card/50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.label}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {item.key}
                    </p>
                  </div>
                  {item.ok ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <TriangleAlert className="h-5 w-5 shrink-0 text-amber-500" />
                  )}
                </div>
              ))}

              {!allConfigured && (
                <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5 text-xs leading-5 text-amber-700 dark:text-amber-400">
                  <FileLock2 className="mt-0.5 h-4 w-4 shrink-0" />
                  فایل{" "}
                  <code className="font-mono">.env.local.example</code> را به{" "}
                  <code className="font-mono">.env.local</code> کپی و مقادیر را
                  پر کنید.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* دکمه‌های اقدام */}
        <section className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="group">
            <Link href="/dashboard">
              ورود به داشبورد
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">صفحه ورود</Link>
          </Button>
        </section>

        <footer className="mt-10 border-t pt-5 text-center text-xs text-muted-foreground">
          ساخته‌شده با Next.js + Supabase · آماده برای مرحله بعد (احراز هویت)
        </footer>
      </main>
    </div>
  );
}
