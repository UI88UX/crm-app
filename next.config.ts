import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // غیرفعال برای سرعت بیشتر
  experimental: {
    optimizeCss: true, // بهینه‌سازی CSS
  },
  // حذف گزینه‌های deprecated
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  webpack: (config) => {
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    };
    return config;
  },
};

export default nextConfig;