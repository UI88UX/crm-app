import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // داده‌ها تا ۵ دقیقه تازه در نظر گرفته می‌شوند
      staleTime: 5 * 60 * 1000,
      // داده‌های غیرفعال تا ۱۰ دقیقه در کش می‌مانند
      gcTime: 10 * 60 * 1000,
      // تعداد دفعات تلاش مجدد در صورت خطا
      retry: 1,
      // در صورت بروز خطا، خطا را به کاربر نشان ندهیم
      throwOnError: false,
    },
    mutations: {
      // در صورت خطا در mutation، یک بار تلاش مجدد
      retry: 1,
    },
  },
});