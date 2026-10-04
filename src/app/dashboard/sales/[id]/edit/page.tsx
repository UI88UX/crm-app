// src/app/dashboard/sales/[id]/edit/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { LoadingPage } from "@/components/ui/loading-spinner";
import EditSaleClient from "./page.client";

export const metadata: Metadata = {
  title: "ویرایش فروش | سیستم مدیریت مطب",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSalePage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingPage />}>
      <EditSaleClient saleId={id} />
    </Suspense>
  );
}