// src/app/dashboard/sales/new/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { LoadingPage } from "@/components/ui/loading-spinner";
import NewSaleClient from "./page.client";

export const metadata: Metadata = {
  title: "ثبت فروش جدید | سیستم مدیریت مطب",
  description: "ثبت فروش سمعک جدید",
};

export default function NewSalePage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <NewSaleClient />
    </Suspense>
  );
}