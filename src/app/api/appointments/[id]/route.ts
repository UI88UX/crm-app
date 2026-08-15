// src/app/api/appointments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getAppointment,
  updateAppointment,
  deleteAppointment,
  cancelAppointment,
} from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/server";

// ============================================
// GET - دریافت نوبت با ID
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = await params;

    // دریافت نوبت
    const result = await getAppointment(id);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: result.data,
    });
  } catch (error) {
    console.error("Error in GET /api/appointments/[id]:", error);
    return NextResponse.json(
      { error: "خطا در دریافت نوبت" },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - ویرایش نوبت
// ============================================

export async function PUT(
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

    // ابتدا نوبت را بگیریم
    const { data: existing, error: fetchError } = await supabase
      .from("appointments")
      .select("tenant_id, patient_id")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "نوبت یافت نشد" },
        { status: 404 }
      );
    }

    // آماده‌سازی داده‌های به‌روزرسانی (فقط فیلدهای قابل ویرایش)
    const updateData: any = {};
    if (body.patient_id) updateData.patient_id = body.patient_id;
    if (body.start_time) updateData.start_time = body.start_time;
    if (body.end_time) updateData.end_time = body.end_time;
    if (body.type) updateData.type = body.type;
    if (body.status) updateData.status = body.status;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // به‌روزرسانی
    const { data, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", existing.tenant_id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      console.error("Error updating appointment:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data,
      message: "نوبت با موفقیت ویرایش شد",
    });
  } catch (error) {
    console.error("Error in PUT /api/appointments/[id]:", error);
    return NextResponse.json(
      { error: "خطا در ویرایش نوبت" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - حذف نوبت
// ============================================

// src/app/api/appointments/[id]/route.ts
// بخش DELETE را به این صورت اصلاح کنید:

export async function DELETE(
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

    // Soft delete
    const { error } = await supabase
      .from("appointments")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", appointment.tenant_id)
      .is("deleted_at", null);

    if (error) {
      console.error("Error deleting appointment:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: { success: true, id },
      message: "نوبت با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("Error in DELETE /api/appointments/[id]:", error);
    return NextResponse.json(
      { error: "خطا در حذف نوبت" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - لغو نوبت (با دلیل)
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    if (action === "cancel") {
      const result = await cancelAppointment(id, reason);
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      return NextResponse.json({
        data: result.data,
        message: "نوبت با موفقیت لغو شد",
      });
    }

    return NextResponse.json(
      { error: "عملیات نامعتبر است" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in PATCH /api/appointments/[id]:", error);
    return NextResponse.json(
      { error: "خطا در لغو نوبت" },
      { status: 500 }
    );
  }
}