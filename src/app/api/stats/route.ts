import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/stats - دریافت آمار داشبورد
export async function GET() {
  try {
    const supabase = await createClient();

    // دریافت آمار از تابع ذخیره شده
    const { data: stats, error: statsError } = await supabase
      .rpc('get_current_tenant_stats');

    if (statsError) {
      console.error("Error fetching stats:", statsError);
      return NextResponse.json(
        { error: statsError.message },
        { status: 500 }
      );
    }

    // دریافت فعالیت‌های اخیر
    const { data: activities, error: activitiesError } = await supabase
      .rpc('get_recent_activities', { p_limit: 10 });

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError);
    }

    return NextResponse.json({
      stats: stats || null,
      activities: activities || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور" },
      { status: 500 }
    );
  }
}