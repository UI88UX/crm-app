// src/app/dashboard/sales/[id]/page.tsx
import SaleDetailClient from "./page.client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SaleDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <SaleDetailClient saleId={id} />;
}