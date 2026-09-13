// src/app/api/call-followups/due-soon/route.ts
import { NextResponse } from "next/server";
import { getDueSoonCallFollowups } from "@/lib/supabase/call-followups";

// GET /api/call-followups/due-soon
// برای Alert بنر (پیگیری‌های سررسید شده یا طی ۲۴ ساعت آینده)
export async function GET() {
  try {
    const response = await getDueSoonCallFollowups();

    if (response.error) {
      return NextResponse.json(
        { error: response.error, data: [] },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: response.data });
  } catch (error: any) {
    console.error("GET /api/call-followups/due-soon error:", error);
    return NextResponse.json(
      { error: error.message || "خطای سرور" },
      { status: 500 }
    );
  }
}