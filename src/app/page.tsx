// src/app/page.tsx
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Calendar,
  ShoppingBag,
  Phone,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  Clock,
  Bell,
  UserCog,
  LayoutDashboard,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ============================================
// Features
// ============================================
const FEATURES = [
  {
    icon: Users,
    title: "مدیریت بیماران",
    desc: "پرونده کامل بیماران با اطلاعات تماس، سوابق و تاریخچه درمان.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-950/40",
  },
  {
    icon: Calendar,
    title: "نوبت‌دهی هوشمند",
    desc: "ثبت نوبت، مدیریت تقویم و جلوگیری از تداخل زمانی.",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-950/40",
  },
  {
    icon: ShoppingBag,
    title: "مدیریت فروش",
    desc: "ثبت فروش سمعک، گارانتی و پیگیری دوره‌ای مشتریان.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
  },
  {
    icon: Phone,
    title: "پیگیری تلفنی",
    desc: "یادآوری خودکار تماس با بیماران و ثبت نتیجه پیگیری.",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-950/40",
  },
  {
    icon: MessageSquare,
    title: "کمپین پیامکی",
    desc: "ارسال پیامک گروهی، یادآوری نوبت و تبریک تولد.",
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-100 dark:bg-pink-950/40",
  },
  {
    icon: BarChart3,
    title: "گزارش‌های تحلیلی",
    desc: "داشبورد آماری با نمودارهای فروش و نرخ تبدیل بیماران.",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-100 dark:bg-indigo-950/40",
  },
];

// ============================================
// Benefits
// ============================================
const BENEFITS = [
  {
    icon: Clock,
    title: "صرفه‌جویی در زمان",
    desc: "اتوماسیون کارهای تکراری و تمرکز روی بیمار",
  },
  {
    icon: Bell,
    title: "یادآوری خودکار",
    desc: "پیامک نوبت، تولد و پیگیری دوره‌ای بدون دخالت دستی",
  },
  {
    icon: UserCog,
    title: "مدیریت کاربران",
    desc: "تعریف دسترسی سفارشی برای هر عضو تیم مطب",
  },
  {
    icon: ShieldCheck,
    title: "امنیت داده‌ها",
    desc: "اطلاعات هر مطب به‌صورت کاملاً مجزا نگهداری می‌شود",
  },
];

export default function Home() {
  return (
    <div
      dir="rtl"
      className="relative min-h-screen bg-background text-foreground overflow-hidden"
    >
      {/* پس‌زمینه تزئینی */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(hsl(var(--foreground)/0.1)_1px,transparent_1px)] [background-size:24px_24px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-emerald-500/15 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-0 h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[140px]"
      />

      {/* ============ Header ============ */}
      <header className="relative z-10 border-b border-border/50 bg-background/60 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-bold tracking-tight">
                CRM شنوایی‌سنجی
              </p>
              <p className="text-xs text-muted-foreground">مدیریت مطب</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/contact">تماس با ما</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">ورود</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ============ Hero ============ */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-12 text-center">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl text-balance leading-tight ">
          مدیریت هوشمند
          <br />
          <span className="bg-gradient-to-l from-emerald-600 via-sky-600 to-indigo-600 bg-clip-text text-transparent">
            مطب شنوایی‌سنجی
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto text-pretty leading-7">
          سامانه‌ای کامل برای مدیریت بیماران، نوبت‌دهی، فروش سمعک، پیگیری تلفنی
          و ارسال پیامک — همه در یک مکان.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="group w-full sm:w-auto">
            <Link href="/login">
              ورود به سامانه
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Link href="/contact">
              <Mail className="h-4 w-4 ml-2" />
              تماس با ما
            </Link>
          </Button>
        </div>
      </section>

      {/* ============ Features ============ */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
            همه امکانات در یک سامانه
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-pretty">
            طراحی‌شده برای رفع نیازهای واقعی مطب‌های شنوایی‌سنجی
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="group hover:shadow-md transition-shadow border-border/60"
            >
              <CardHeader className="pb-3">
                <div
                  className={`grid h-11 w-11 place-items-center rounded-xl ${feature.bg} mb-3 transition-transform group-hover:scale-110`}
                >
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <CardTitle className="text-base font-semibold">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-sm leading-6">
                  {feature.desc}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ Benefits ============ */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pb-16 sm:pb-24">
        <Card className="border-border/60 bg-gradient-to-br from-background to-muted/30">
          <CardContent className="p-6 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight">
                چرا این سامانه؟
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {BENEFITS.map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex flex-col items-center text-center gap-3"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-semibold text-sm">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground leading-5">
                    {benefit.desc}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 pb-20">
        <Card className="border-0 bg-gradient-to-l from-emerald-600 via-emerald-700 to-teal-700 text-white overflow-hidden relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:20px_20px]"
          />
          <CardContent className="relative p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              آماده شروع هستید؟
            </h2>
            <p className="text-white/90 mb-8 max-w-md mx-auto text-sm sm:text-base">
              وارد سامانه شوید و مطب خود را هوشمند مدیریت کنید.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="group bg-white text-emerald-700 hover:bg-white/90"
            >
              <Link href="/login">
                ورود به سامانه
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* ============ Footer ============ */}
      <footer className="relative z-10 border-t border-border/50 py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} CRM شنوایی‌سنجی — همه حقوق محفوظ است
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/contact"
              className="hover:text-foreground transition-colors"
            >
              تماس با ما
            </Link>
            <Link
              href="/login"
              className="hover:text-foreground transition-colors"
            >
              ورود
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}