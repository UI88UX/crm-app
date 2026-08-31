// src/app/api/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getAppointments,
  createAppointment,
  getCurrentTenantId,
} from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/server";
import { onAppointmentCreated } from '@/lib/sms/event-handlers';

// ============================================
// GET - دریافت لیست نوبت‌ها
// ============================================

export async function GET(request: NextRequest) {
  try {
    // بررسی احراز هویت
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "لطفاً وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    // دریافت پارامترها
    const searchParams = request.nextUrl.searchParams;
    const patient_id = searchParams.get("patient_id") || undefined;
    const status = searchParams.get("status") as any || undefined;
    const type = searchParams.get("type") as any || undefined;
    const start_date = searchParams.get("start_date") || undefined;
    const end_date = searchParams.get("end_date") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // دریافت نوبت‌ها
    const result = await getAppointments({
      patient_id,
      status,
      type,
      start_date,
      end_date,
      page,
      limit,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: result.data,
      count: result.count,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error in GET /api/appointments:", error);
    return NextResponse.json(
      { error: "خطا در دریافت نوبت‌ها" },
      { status: 500 }
    );
  }
}


// ============================================
// POST - ایجاد نوبت جدید
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "لطفاً وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // دریافت tenant_id از RPC
    const { data: tenantId, error: tenantError } = await supabase
      .rpc('get_current_tenant_id');

    if (tenantError || !tenantId) {
      console.error("Tenant error:", tenantError);
      return NextResponse.json(
        { error: "شما به هیچ Tenant متصل نیستید." },
        { status: 400 }
      );
    }

    // بررسی تداخل زمانی
    const { data: conflicts, error: conflictError } = await supabase
      .from("appointments")
      .select("id, status, start_time, end_time")
      .eq("tenant_id", tenantId)
      .eq("patient_id", body.patient_id)
      .is("deleted_at", null)
      .in("status", ["scheduled", "pending", "confirmed", "in_progress"])
      .or(`start_time.lte.${body.end_time},end_time.gte.${body.start_time}`);

    if (conflictError) {
      console.error("Error checking conflicts:", conflictError);
    }

    if (conflicts && conflicts.length > 0) {
      // نمایش وضعیت نوبت‌های تداخلی
      const conflictDetails = conflicts.map((c: any) => {
        const statusMap: Record<string, string> = {
          scheduled: 'برنامه‌ریزی‌شده',
          pending: 'در انتظار',
          confirmed: 'تأیید شده',
          in_progress: 'در حال انجام',
        };
        return `${statusMap[c.status] || c.status} (${c.start_time})`;
      }).join('، ');

      return NextResponse.json(
        {
          error: `بیمار در این زمان نوبت فعال دیگری دارد: ${conflictDetails}`
        },
        { status: 400 }
      );
    }
    // ایجاد نوبت
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: body.patient_id,
        start_time: body.start_time,
        end_time: body.end_time,
        type: body.type,
        status: body.status || 'scheduled',
        title: body.title || null,
        description: body.description || null,
        notes: body.notes || null,
        tenant_id: tenantId,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // ✅ ارسال پیامک تأیید نوبت (غیرهمزمان)
    if (data) {
      onAppointmentCreated(data.id).catch(console.error);
    }

    return NextResponse.json({
      data,
      message: 'نوبت با موفقیت ثبت شد',
    });
  } catch (error) {
    console.error("Error in POST /api/appointments:", error);
    return NextResponse.json(
      { error: "خطا در ثبت نوبت" },
      { status: 500 }
    );
  }
}