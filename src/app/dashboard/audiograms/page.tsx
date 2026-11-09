// src/app/dashboard/audiograms/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import AudiogramsPageClient from "./page.client";

/**
 * Server Component - فقط برای wrap کردن در Suspense.
 * بدون این، useSearchParams در build ورسل خطا می‌دهد:
 * "useSearchParams() should be wrapped in a suspense boundary"
 */
export default function AudiogramsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AudiogramsPageClient />
    </Suspense>
  );
}