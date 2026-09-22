// src/app/admin/login/login-form.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Eye, EyeOff, Loader2, Ban, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { adminLogin } from '@/lib/supabase/admin-auth-actions';
import { toast } from 'sonner';

export default function AdminLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  let errorBanner: { title: string; description: string } | null = null;
  if (errorParam === 'session_expired') {
    errorBanner = {
      title: 'نشست منقضی شده',
      description: 'لطفاً مجدداً وارد شوید.',
    };
  } else if (errorParam === 'not_super_admin') {
    errorBanner = {
      title: 'دسترسی غیرمجاز',
      description: 'شما به پنل مدیریت دسترسی ندارید.',
    };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await adminLogin(formData);

    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 relative overflow-hidden">
      {/* پس‌زمینه تزئینی */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:24px_24px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-amber-500/20 blur-[120px]"
      />

      <Card className="w-full max-w-md relative z-10 border-amber-500/20 shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30">
              <ShieldCheck className="h-7 w-7 text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">پنل مدیریت</CardTitle>
          <CardDescription>
            ورود اختصاصی مدیر سیستم
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* پیام خطا بنر */}
            {errorBanner && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                      {errorBanner.title}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                      {errorBanner.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                required
                dir="ltr"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  dir="ltr"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? 'پنهان کردن رمز' : 'نمایش رمز'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* خطای فرم */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30 p-3">
                <div className="flex items-start gap-2">
                  <Ban className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  در حال ورود...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 ml-2" />
                  ورود به پنل
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              کاربر عادی هستید؟{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                ورود به داشبورد
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}