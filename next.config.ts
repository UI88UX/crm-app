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
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: "all",
        minSize: 20000,
        maxSize: 244000,
      },
    };
    return config;
  },
};

export default nextConfig;