// src/app/page.tsx

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
  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-background text-foreground"
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
        className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-cyan-400/15 blur-[140px]"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[140px]"
      />

      {/* ======================================================
          Header
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-3"
          >
            <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-[2px] shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-105">
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

            <div className="hidden leading-tight sm:block">
              <p className="text-[15px] font-black tracking-tight">
                CRM شنوایی‌سنجی
              </p>

              <p className="mt-0.5 text-[11px] text-muted-foreground">
                مدیریت هوشمند کلینیک
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
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
              href="/contact"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              تماس با ما
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link href="/contact">
                تماس با ما
              </Link>
            </Button>

            <Button
              asChild
              size="sm"
              className="rounded-xl bg-slate-950 px-5 shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              <Link href="/login">
                ورود
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ======================================================
          Hero
      ====================================================== */}

      <section className="relative z-10 overflow-hidden">
        {/* Decorative glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-120px] top-[-100px] h-[500px] w-[500px] rounded-full bg-cyan-400/20 blur-[120px]"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-180px] left-[-150px] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid min-h-[680px] items-center gap-12 py-14 lg:grid-cols-2 lg:gap-20 lg:py-20">

            {/* ==================================================
                Hero Content
            ================================================== */}

            <div className="relative z-20 text-center lg:text-right">

              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300 sm:text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
                </span>

                راهکار جامع مدیریت کلینیک‌های شنوایی‌سنجی
              </div>

              {/* Heading */}
              <h1 className="text-balance text-4xl font-black leading-[1.3] sm:text-5xl lg:text-[4.2rem]">

                مدیریت هوشمند

                <br />

                <span className="bg-gradient-to-l from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                  مطب شنوایی‌سنجی
                </span>
              </h1>

              {/* Description */}
              <p className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg lg:mx-0">
                سامانه‌ای کامل برای مدیریت بیماران، نوبت‌دهی، فروش سمعک،
                پیگیری تلفنی و ارسال پیامک — همه در یک مکان.
              </p>

              {/* CTA */}
              <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">

                <Button
                  asChild
                  size="lg"
                  className="group h-12 w-full rounded-xl bg-gradient-to-l from-blue-600 to-cyan-500 px-8 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 sm:w-auto"
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
                  className="h-12 w-full rounded-xl border-border/70 bg-background/70 px-8 backdrop-blur-sm transition-all hover:bg-background sm:w-auto"
                >
                  <Link href="/contact">
                    <Mail className="ml-2 h-4 w-4" />
                    تماس با ما
                  </Link>
                </Button>
              </div>

              {/* Trust items */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground sm:text-sm lg:justify-start">

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  راه‌اندازی آسان
                </div>

                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                  امنیت اطلاعات
                </div>

                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-500" />
                  طراحی مخصوص مطب
                </div>

              </div>
            </div>

            {/* ==================================================
                Hero Visual
            ================================================== */}

            <div className="relative flex min-h-[430px] items-center justify-center lg:min-h-[560px]">

              {/* Large glow */}
              <div
                aria-hidden
                className="absolute h-[330px] w-[330px] rounded-full bg-blue-500/20 blur-[70px] sm:h-[450px] sm:w-[450px]"
              />

              {/* Outer circle */}
              <div className="absolute h-[330px] w-[330px] rounded-full border border-cyan-200/60 bg-gradient-to-br from-cyan-50/50 to-blue-50/30 dark:border-cyan-900/40 dark:from-cyan-950/20 dark:to-blue-950/20 sm:h-[450px] sm:w-[450px]" />

              {/* Rotating decorative ring */}
              <div
                aria-hidden
                className="absolute h-[390px] w-[390px] rounded-full border border-dashed border-blue-200/70 dark:border-blue-900/50 sm:h-[510px] sm:w-[510px]"
              />

              {/* Sound wave */}
              <div className="absolute left-[2%] top-1/2 z-10 flex -translate-y-1/2 items-end gap-1 opacity-80 sm:left-[3%]">

                <span className="h-5 w-1.5 rounded-full bg-cyan-400" />
                <span className="h-9 w-1.5 rounded-full bg-cyan-400" />
                <span className="h-14 w-1.5 rounded-full bg-cyan-500" />
                <span className="h-24 w-1.5 rounded-full bg-blue-500" />
                <span className="h-16 w-1.5 rounded-full bg-cyan-500" />
                <span className="h-9 w-1.5 rounded-full bg-cyan-400" />
                <span className="h-5 w-1.5 rounded-full bg-cyan-400" />

              </div>

              {/* Main logo card */}
              <div className="relative z-20">

                {/* Glow behind card */}
                <div className="absolute inset-0 scale-110 rounded-[2.75rem] bg-gradient-to-br from-blue-500/30 via-cyan-400/20 to-emerald-400/20 blur-2xl" />

                {/* Glass frame */}
                <div className="relative h-[285px] w-[285px] rotate-[-3deg] rounded-[2.75rem] border border-white/80 bg-white/70 p-4 shadow-2xl shadow-blue-500/20 backdrop-blur-xl transition-all duration-500 hover:rotate-0 hover:scale-105 dark:border-white/10 dark:bg-slate-900/70 sm:h-[360px] sm:w-[360px]">

                  {/* Blue logo background */}
                  <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600">

                    {/* Inner glow */}
                    <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />

                    <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-blue-400/30 blur-3xl" />

                    <Image
                      src="/logo.png"
                      alt="CRM شنوایی‌سنجی"
                      width={320}
                      height={320}
                      priority
                      className="relative z-10 h-[230px] w-[230px] object-contain drop-shadow-2xl sm:h-[300px] sm:w-[300px]"
                    />
                  </div>
                </div>

                {/* Floating patient card */}
                <div className="absolute -bottom-7 -left-10 z-30 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 sm:-left-16">

                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <Users className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      مدیریت بیماران
                    </p>

                    <p className="text-sm font-bold">
                      همه‌چیز یکجا
                    </p>
                  </div>
                </div>

                {/* Floating analytics card */}
                <div className="absolute -right-7 top-7 z-30 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 sm:-right-14">

                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                    <Activity className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      عملکرد کلینیک
                    </p>

                    <p className="text-sm font-bold">
                      هوشمند و سریع
                    </p>
                  </div>
                </div>

                {/* Hearing aid decoration */}
                <div className="absolute -bottom-5 -right-7 z-30 hidden rotate-[-10deg] sm:block">
                  <div className="rounded-2xl border border-white/60 bg-white/80 p-3 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
                    <Headphones className="h-10 w-10 text-cyan-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero bottom fade */}
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
        className="relative z-10 mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
      >
        <div className="mx-auto mb-12 max-w-2xl text-center">

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5" />
            امکانات سامانه
          </div>

          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            همه امکانات در یک سامانه
          </h2>

          <p className="mt-4 text-pretty leading-7 text-muted-foreground">
            طراحی‌شده برای رفع نیازهای واقعی مطب‌های شنوایی‌سنجی
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-border/60 bg-background/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:border-blue-900"
            >
              {/* Hover glow */}
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-500/5 blur-2xl transition-all duration-300 group-hover:bg-blue-500/10" />

              <CardHeader className="relative pb-3">

                <div
                  className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ${feature.bg} transition-transform duration-300 group-hover:scale-110`}
                >
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>

                <CardTitle className="text-base font-bold">
                  {feature.title}
                </CardTitle>

                <CardDescription className="text-sm leading-7">
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
        className="relative z-10 mx-auto max-w-7xl scroll-mt-24 px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8"
      >
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-background via-background to-blue-50/50 dark:to-blue-950/10">

          {/* Background glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl"
          />

          <CardContent className="relative p-7 sm:p-12">

            <div className="mx-auto mb-10 max-w-2xl text-center">

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                چرا CRM شنوایی‌سنجی؟
              </div>

              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                مدیریت مطب، ساده‌تر از همیشه
              </h2>

              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                ابزارهایی که برای کار روزمره یک کلینیک شنوایی‌سنجی واقعاً لازم دارید.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {BENEFITS.map((benefit) => (
                <div
                  key={benefit.title}
                  className="group flex flex-col items-center text-center"
                >
                  <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:group-hover:bg-blue-950/70">
                    <benefit.icon className="h-6 w-6" />
                  </div>

                  <p className="font-bold">
                    {benefit.title}
                  </p>

                  <p className="mt-2 max-w-[220px] text-xs leading-6 text-muted-foreground">
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

      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">

        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-l from-blue-700 via-blue-600 to-cyan-500 px-6 py-12 text-center text-white shadow-2xl shadow-blue-500/20 sm:px-12 sm:py-16">

          {/* Decorative circles */}
          <div
            aria-hidden
            className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />

          <div
            aria-hidden
            className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl"
          />

          <div
            aria-hidden
            className="absolute inset-0 opacity-10 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:20px_20px]"
          />

          <div className="relative">

            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur-md">
              <Headphones className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-black sm:text-3xl">
              آماده‌اید مطب خود را هوشمندتر مدیریت کنید؟
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/85 sm:text-base">
              بیماران، نوبت‌ها، فروش، پیگیری‌ها و گزارش‌ها را در یک سامانه مدیریت کنید.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">

              <Button
                asChild
                size="lg"
                className="group h-12 rounded-xl bg-white px-8 text-blue-700 shadow-lg hover:bg-white/90"
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
                className="h-12 rounded-xl border-white/30 bg-white/10 px-8 text-white hover:bg-white/20 hover:text-white"
              >
                <Link href="/contact">
                  تماس با ما
                </Link>
              </Button>

            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          Footer
      ====================================================== */}

      <footer className="relative z-10 border-t border-border/50 bg-background/60 py-8 backdrop-blur-sm">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6 sm:text-sm lg:px-8">

          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center overflow-hidden rounded-lg">
              <Image
                src="/logo.png"
                alt=""
                width={28}
                height={28}
                className="h-full w-full object-contain"
              />
            </div>

            <p>
              © {new Date().getFullYear()} CRM شنوایی‌سنجی
            </p>
          </div>

          <div className="flex items-center gap-5">

            <Link
              href="/contact"
              className="transition-colors hover:text-foreground"
            >
              تماس با ما
            </Link>

            <Link
              href="/login"
              className="transition-colors hover:text-foreground"
            >
              ورود
            </Link>

          </div>
        </div>
      </footer>
    </main>
  );
}