// src/app/api/call-followups/stats/route.ts
import { NextResponse } from "next/server";
import { getCallFollowupStats } from "@/lib/supabase/call-followups";

// GET /api/call-followups/stats
// برای Bell icon در هدر و کارت‌های آماری
export async function GET() {
  try {
    const response = await getCallFollowupStats();

    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: response.data });
  } catch (error: any) {
    console.error("GET /api/call-followups/stats error:", error);
    return NextResponse.json(
      { error: error.message || "خطای سرور" },
      { status: 500 }
    );
  }
}