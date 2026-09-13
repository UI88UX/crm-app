// src/app/dashboard/call-followups/page.tsx
import { Suspense } from "react";
import { LoadingPage } from "@/components/ui/loading-spinner";
import CallFollowupsPageClient from "./page.client";

export default function CallFollowupsPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <CallFollowupsPageClient />
    </Suspense>
  );
}

export const metadata = {
  title: "پیگیری‌های تلفنی | CRM شنوایی‌سنجی",
};