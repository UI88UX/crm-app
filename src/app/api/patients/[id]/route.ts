import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/patients/[id] - دریافت یک بیمار
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
      .from("patients")
      .select("*")
      .eq("id", params.id)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "بیمار یافت نشد." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور" },
      { status: 500 }
    );
  }
}

// PUT /api/patients/[id] - ویرایش بیمار
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

    const { data, error } = await supabase
      .from("patients")
      .update(body)
      .eq("id", params.id)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "بیمار یافت نشد." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور" },
      { status: 500 }
    );
  }
}

// DELETE /api/patients/[id] - حذف بیمار (soft delete)
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
      .from("patients")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", params.id)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: params.id });
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