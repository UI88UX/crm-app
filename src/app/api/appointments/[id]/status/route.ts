// src/app/api/appointments/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "لطفاً وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, reason } = body;

    // اعتبارسنجی وضعیت
    const validStatuses = ['scheduled', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "وضعیت نامعتبر است" },
        { status: 400 }
      );
    }

    // ابتدا نوبت را بگیریم تا tenant_id را داشته باشیم
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("tenant_id, patient_id")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: "نوبت یافت نشد" },
        { status: 404 }
      );
    }

    // آماده‌سازی داده‌های به‌روزرسانی
    const updateData: any = { status };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    } else if (status === 'in_progress') {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString();
    }

    if (status === 'cancelled' && reason) {
      updateData.cancellation_reason = reason;
    }

    if (status === 'no_show' && reason) {
      updateData.no_show_reason = reason;
    }

    // به‌روزرسانی با tenant_id از خود نوبت
    const { data, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", appointment.tenant_id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      console.error("Error updating appointment status:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data,
      message: "وضعیت نوبت با موفقیت تغییر کرد",
    });
  } catch (error) {
    console.error("Error in PATCH /api/appointments/[id]/status:", error);
    return NextResponse.json(
      { error: "خطا در تغییر وضعیت نوبت" },
      { status: 500 }
    );
  }
}