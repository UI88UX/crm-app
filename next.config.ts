import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // typescript: {
  //   // ! هشدار: این کار type-check رو کاملاً غیرفعال می‌کنه
  //   // فقط برای دیباگ موقت استفاده کن
  //   ignoreBuildErrors: true,
  // },
};

export default nextConfig;