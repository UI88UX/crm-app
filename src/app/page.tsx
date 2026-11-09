"use client"; // <--- این خط برای استفاده از State منوی موبایل اضافه شد

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
  Mail,
  CheckCircle2,
  Headphones,
  Activity,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ============================================================
// Features
// ============================================================

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

// ============================================================
// Benefits
// ============================================================

const BENEFITS = [
  {
    icon: Clock,
    title: "صرفه‌جویی در زمان",
    desc: "اتوماسیون کارهای تکراری و تمرکز بیشتر روی بیمار",
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

// ============================================================
// Home
// ============================================================

export default function Home() {
  // استیت برای منوی موبایل
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <main
      dir="rtl"
      // overflow-x-clip بهتر از hidden عمل میکنه و از اسکرول افقی جلوگیری میکنه
      className="relative min-h-screen w-full overflow-x-clip bg-background text-foreground"
    >
      {/* ======================================================
          Background
      ====================================================== */}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.32] [background-image:radial-gradient(hsl(var(--foreground)/0.08)_1px,transparent_1px)] [background-size:24px_24px]"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[400px] w-[400px] rounded-full bg-cyan-400/15 blur-[100px] sm:h-[600px] sm:w-[600px] sm:blur-[140px]"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px] sm:h-[600px] sm:w-[600px] sm:blur-[140px]"
      />

      {/* ======================================================
          Header
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2 sm:gap-3">
            <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-[2px] shadow-lg shadow-blue-500/20 sm:h-11 sm:w-11">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[14px] bg-white">
                <Image
                  src="/logo.png"
                  alt="CRM شنوایی‌سنجی"
                  width={44}
                  height={44}
                  priority
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            <div className="leading-tight">
              <p className="text-[14px] font-black tracking-tight sm:text-[15px]">
                CRM شنوایی‌سنجی
              </p>
              <p className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">
                مدیریت هوشمند کلینیک
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
            <Link
              href="/"
              className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
            >
              خانه
            </Link>

            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              امکانات
            </a>

            <a
              href="#benefits"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              مزایا
            </a>

            <Link
              href="/hearing-test"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              تست شنوایی رایگان
            </Link>

            <Link
              href="/contact"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              تماس با ما
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex"
            >
              <Link href="/contact">تماس با ما</Link>
            </Button>

            <Button
              asChild
              size="sm"
              className="rounded-xl bg-slate-950 px-4 text-xs shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 sm:px-5 sm:text-sm"
            >
              <Link href="/login">ورود</Link>
            </Button>

            {/* دکمه همبرگری موبایل */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="منو"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* منوی موبایل کشویی */}
        {isMobileMenuOpen && (
          <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl lg:hidden">
            <nav className="flex flex-col space-y-1 px-4 py-4 sm:px-6">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-blue-600 hover:bg-muted"
              >
                خانه
              </Link>
              <a
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                امکانات
              </a>
              <a
                href="#benefits"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                مزایا
              </a>
              <Link
                href="/hearing-test"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                تست شنوایی رایگان
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                تماس با ما
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ======================================================
          Hero
      ====================================================== */}

      {/* اضافه کردن overflow-hidden به سکشن برای جلوگیری از بیرون زدن حباب‌ها */}
      <section className="relative z-10 overflow-hidden">
        {/* Decorative glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-120px] top-[-100px] h-[300px] w-[300px] rounded-full bg-cyan-400/20 blur-[100px] sm:h-[500px] sm:w-[500px] sm:blur-[120px]"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-180px] left-[-150px] h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[100px] sm:h-[500px] sm:w-[500px] sm:blur-[120px]"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 py-10 sm:gap-12 sm:py-14 lg:min-h-[680px] lg:grid-cols-2 lg:gap-16 lg:py-20 xl:gap-20">
            
            {/* Hero Content */}
            <div className="relative z-20 text-center lg:text-right">
              <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1.5 text-[11px] font-semibold text-blue-700 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300 sm:mb-6 sm:px-4 sm:py-2 sm:text-xs md:text-sm">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
                </span>
                <span className="truncate">
                  راهکار جامع مدیریت کلینیک‌های شنوایی‌سنجی
                </span>
              </div>

              <h1 className="text-balance text-[1.75rem] font-black leading-[1.35] xs:text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[4.2rem]">
                مدیریت هوشمند
                <br />
                <span className="bg-gradient-to-l from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                  مطب شنوایی‌سنجی
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-pretty text-sm leading-7 text-muted-foreground sm:mt-7 sm:text-base sm:leading-8 lg:mx-0 lg:text-lg">
                سامانه‌ای کامل برای مدیریت بیماران، نوبت‌دهی، فروش سمعک،
                پیگیری تلفنی و ارسال پیامک — همه در یک مکان.
              </p>

              <div className="mt-7 flex flex-col items-stretch gap-3 sm:mt-9 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="group h-11 w-full rounded-xl bg-gradient-to-l from-blue-600 to-cyan-500 px-6 text-sm text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 sm:h-12 sm:w-auto sm:px-8 sm:text-base"
                >
                  <Link href="/login">
                    شروع کنید
                    <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-11 w-full rounded-xl border-border/70 bg-background/70 px-6 text-sm backdrop-blur-sm transition-all hover:bg-background sm:h-12 sm:w-auto sm:px-8 sm:text-base"
                >
                  <Link href="/contact">
                    <Mail className="ml-2 h-4 w-4" />
                    تماس با ما
                  </Link>
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground sm:mt-8 sm:gap-x-6 sm:gap-y-3 sm:text-xs md:text-sm lg:justify-start">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 sm:h-4 sm:w-4" />
                  راه‌اندازی آسان
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500 sm:h-4 sm:w-4" />
                  امنیت اطلاعات
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-500 sm:h-4 sm:w-4" />
                  طراحی مخصوص مطب
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative flex min-h-[360px] items-center justify-center sm:min-h-[430px] lg:min-h-[560px]">
              <div
                aria-hidden
                className="absolute h-[260px] w-[260px] rounded-full bg-blue-500/20 blur-[60px] sm:h-[380px] sm:w-[380px] sm:blur-[70px] md:h-[450px] md:w-[450px]"
              />

              <div className="absolute h-[260px] w-[260px] rounded-full border border-cyan-200/60 bg-gradient-to-br from-cyan-50/50 to-blue-50/30 dark:border-cyan-900/40 dark:from-cyan-950/20 dark:to-blue-950/20 sm:h-[380px] sm:w-[380px] md:h-[450px] md:w-[450px]" />

              <div
                aria-hidden
                className="absolute h-[300px] w-[300px] rounded-full border border-dashed border-blue-200/70 dark:border-blue-900/50 sm:h-[430px] sm:w-[430px] md:h-[510px] md:w-[510px]"
              />

              {/* Sound wave */}
              <div className="absolute left-0 top-1/2 z-10 flex -translate-y-1/2 items-end gap-0.5 opacity-80 sm:left-[3%] sm:gap-1">
                <span className="h-4 w-1 rounded-full bg-cyan-400 sm:h-5 sm:w-1.5" />
                <span className="h-7 w-1 rounded-full bg-cyan-400 sm:h-9 sm:w-1.5" />
                <span className="h-10 w-1 rounded-full bg-cyan-500 sm:h-14 sm:w-1.5" />
                <span className="h-16 w-1 rounded-full bg-blue-500 sm:h-24 sm:w-1.5" />
                <span className="h-11 w-1 rounded-full bg-cyan-500 sm:h-16 sm:w-1.5" />
                <span className="h-7 w-1 rounded-full bg-cyan-400 sm:h-9 sm:w-1.5" />
                <span className="h-4 w-1 rounded-full bg-cyan-400 sm:h-5 sm:w-1.5" />
              </div>

              {/* Main logo card */}
              <div className="relative z-20">
                <div className="absolute inset-0 scale-110 rounded-[2rem] bg-gradient-to-br from-blue-500/30 via-cyan-400/20 to-emerald-400/20 blur-2xl sm:rounded-[2.75rem]" />

                <div className="relative h-[220px] w-[220px] rotate-[-3deg] rounded-[2rem] border border-white/80 bg-white/70 p-3 shadow-2xl shadow-blue-500/20 backdrop-blur-xl transition-all duration-500 hover:rotate-0 hover:scale-105 dark:border-white/10 dark:bg-slate-900/70 sm:h-[290px] sm:w-[290px] sm:rounded-[2.75rem] sm:p-4 md:h-[360px] md:w-[360px]">
                  <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 sm:rounded-[2.25rem]">
                    <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl sm:h-48 sm:w-48" />
                    <div className="absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-blue-400/30 blur-3xl sm:h-48 sm:w-48" />

                    <Image
                      src="/logo.png"
                      alt="CRM شنوایی‌سنجی"
                      width={320}
                      height={320}
                      priority
                      className="relative z-10 h-[170px] w-[170px] object-contain drop-shadow-2xl sm:h-[240px] sm:w-[240px] md:h-[300px] md:w-[300px]"
                    />
                  </div>
                </div>

                {/* Floating patient card */}
                <div className="absolute -bottom-6 -left-3 z-30 flex items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-2.5 py-2 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 sm:-bottom-7 sm:-left-8 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 md:-left-16">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 sm:h-10 sm:w-10 sm:rounded-xl">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-muted-foreground sm:text-[10px]">
                      مدیریت بیماران
                    </p>
                    <p className="truncate text-xs font-bold sm:text-sm">
                      همه‌چیز یکجا
                    </p>
                  </div>
                </div>

                {/* Floating analytics card */}
                <div className="absolute -right-3 top-5 z-30 flex items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-2.5 py-2 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 sm:-right-7 sm:top-7 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 md:-right-14">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 sm:h-10 sm:w-10 sm:rounded-xl">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-muted-foreground sm:text-[10px]">
                      عملکرد کلینیک
                    </p>
                    <p className="truncate text-xs font-bold sm:text-sm">
                      هوشمند و سریع
                    </p>
                  </div>
                </div>

                {/* Hearing aid decoration */}
                <div className="absolute -bottom-5 -right-4 z-30 hidden rotate-[-10deg] sm:block md:-right-7">
                  <div className="rounded-2xl border border-white/60 bg-white/80 p-2.5 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80 sm:p-3">
                    <Headphones className="h-8 w-8 text-cyan-500 sm:h-10 sm:w-10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent"
        />
      </section>

      {/* ======================================================
          Features
      ====================================================== */}

      <section
        id="features"
        className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28"
      >
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300 sm:mb-4 sm:px-4 sm:py-2 sm:text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            امکانات سامانه
          </div>

          <h2 className="text-balance text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
            همه امکانات در یک سامانه
          </h2>

          <p className="mt-3 text-pretty text-sm leading-7 text-muted-foreground sm:mt-4 sm:text-base">
            طراحی‌شده برای رفع نیازهای واقعی مطب‌های شنوایی‌سنجی
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-border/60 bg-background/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:border-blue-900"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-500/5 blur-2xl transition-all duration-300 group-hover:bg-blue-500/10" />

              <CardHeader className="relative p-5 pb-4 sm:p-6 sm:pb-3">
                <div
                  className={`mb-3 grid h-11 w-11 place-items-center rounded-2xl sm:mb-4 sm:h-12 sm:w-12 ${feature.bg} transition-transform duration-300 group-hover:scale-110`}
                >
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>

                <CardTitle className="text-sm font-bold sm:text-base">
                  {feature.title}
                </CardTitle>

                <CardDescription className="text-xs leading-6 sm:text-sm sm:leading-7">
                  {feature.desc}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* ======================================================
          Benefits
      ====================================================== */}

      <section
        id="benefits"
        className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-4 pb-14 sm:px-6 sm:pb-20 lg:px-8 lg:pb-28"
      >
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-background via-background to-blue-50/50 dark:to-blue-950/10">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl sm:h-64 sm:w-64"
          />

          <CardContent className="relative p-5 sm:p-8 md:p-12">
            <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 sm:mb-4 sm:px-4 sm:py-2 sm:text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
                چرا CRM شنوایی‌سنجی؟
              </div>

              <h2 className="text-balance text-xl font-black tracking-tight sm:text-2xl md:text-3xl">
                مدیریت مطب، ساده‌تر از همیشه
              </h2>

              <p className="mt-2 text-xs leading-7 text-muted-foreground sm:mt-3 sm:text-sm">
                ابزارهایی که برای کار روزمره یک کلینیک شنوایی‌سنجی واقعاً لازم دارید.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5 sm:gap-8 lg:grid-cols-4">
              {BENEFITS.map((benefit) => (
                <div
                  key={benefit.title}
                  className="group flex flex-col items-center text-center"
                >
                  <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:group-hover:bg-blue-950/70 sm:mb-4 sm:h-14 sm:w-14">
                    <benefit.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>

                  <p className="text-sm font-bold sm:text-base">
                    {benefit.title}
                  </p>

                  <p className="mt-1.5 max-w-[200px] text-[11px] leading-5 text-muted-foreground sm:mt-2 sm:max-w-[220px] sm:text-xs sm:leading-6">
                    {benefit.desc}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ======================================================
          CTA
      ====================================================== */}

      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-blue-700 via-blue-600 to-cyan-500 px-5 py-10 text-center text-white shadow-2xl shadow-blue-500/20 sm:rounded-[2rem] sm:px-8 sm:py-12 md:px-12 md:py-16">
          <div
            aria-hidden
            className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-2xl sm:h-64 sm:w-64"
          />

          <div
            aria-hidden
            className="absolute -bottom-32 -left-20 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl sm:h-72 sm:w-72"
          />

          <div
            aria-hidden
            className="absolute inset-0 opacity-10 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:20px_20px]"
          />

          <div className="relative">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur-md sm:mb-5 sm:h-14 sm:w-14">
              <Headphones className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>

            <h2 className="text-balance text-xl font-black sm:text-2xl md:text-3xl">
              آماده‌اید مطب خود را هوشمندتر مدیریت کنید؟
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-pretty text-xs leading-6 text-white/85 sm:mt-4 sm:text-sm sm:leading-7 md:text-base">
              بیماران، نوبت‌ها، فروش، پیگیری‌ها و گزارش‌ها را در یک سامانه مدیریت کنید.
            </p>

            <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="group h-11 rounded-xl bg-white px-6 text-sm text-blue-700 shadow-lg hover:bg-white/90 sm:h-12 sm:px-8 sm:text-base"
              >
                <Link href="/login">
                  ورود به سامانه
                  <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 rounded-xl border-white/30 bg-white/10 px-6 text-sm text-white hover:bg-white/20 hover:text-white sm:h-12 sm:px-8 sm:text-base"
              >
                <Link href="/contact">تماس با ما</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          Footer
      ====================================================== */}

      <footer className="relative z-10 border-t border-border/50 bg-background/60 py-6 backdrop-blur-sm sm:py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-[11px] text-muted-foreground sm:flex-row sm:gap-4 sm:px-6 sm:text-xs md:text-sm lg:px-8">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center overflow-hidden rounded-lg sm:h-7 sm:w-7">
              <Image
                src="/logo.png"
                alt=""
                width={28}
                height={28}
                className="h-full w-full object-contain"
              />
            </div>

            <p>© {new Date().getFullYear()} CRM شنوایی‌سنجی</p>
          </div>

          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/contact" className="transition-colors hover:text-foreground">
              تماس با ما
            </Link>

            <Link href="/login" className="transition-colors hover:text-foreground">
              ورود
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}