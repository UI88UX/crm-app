// src/app/api/sales/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/sales/[id] - دریافت یک فروش
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const tenantId = await getCurrentTenantId(supabase);

    if (!tenantId) {
      return NextResponse.json(
        { error: "کاربر به هیچ Tenant متصل نیست." },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        patient:patients (
          id,
          first_name,
          last_name,
          national_code,
          phone
        )
      `)
      .eq("id", params.id)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "فروش یافت نشد." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, error: null });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور" },
      { status: 500 }
    );
  }
}

// PUT /api/sales/[id] - ویرایش فروش
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const tenantId = await getCurrentTenantId(supabase);

    if (!tenantId) {
      return NextResponse.json(
        { error: "کاربر به هیچ Tenant متصل نیست." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // حذف فیلدهای غیرمجاز برای به‌روزرسانی
    const { patient, created_at, created_by, ...updateData } = body;

    const { data, error } = await supabase
      .from("sales")
      .update(updateData)
      .eq("id", params.id)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .select(`
        *,
        patient:patients (
          id,
          first_name,
          last_name,
          national_code,
          phone
        )
      `)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "فروش یافت نشد." },
          { status: 404 }
        );
      }
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "سریال سمعک قبلاً ثبت شده است." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, error: null });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور" },
      { status: 500 }
    );
  }
}

// DELETE /api/sales/[id] - حذف فروش (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const tenantId = await getCurrentTenantId(supabase);

    if (!tenantId) {
      return NextResponse.json(
        { error: "کاربر به هیچ Tenant متصل نیست." },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from("sales")
      .update({ 
        deleted_at: new Date().toISOString() 
      })
      .eq("id", params.id)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { success: true, id: params.id }, error: null });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور" },
      { status: 500 }
    );
  }
}

// تابع کمکی
async function getCurrentTenantId(supabase: any) {
  const { data: tenantId, error } = await supabase
    .rpc('get_current_tenant_id');
  
  if (error || !tenantId) return null;
  return tenantId;
}